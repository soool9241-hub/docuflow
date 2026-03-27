import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `당신은 한국 비즈니스 서류 작성을 도와주는 전문 AI 어시스턴트입니다.

역할:
- 사용자가 원하는 서류(견적서, 거래명세서, 세금계산서, 계약서 등)를 대화를 통해 작성합니다.
- 친절하고 전문적인 어조로 대화합니다.
- 한국어로 응답합니다.

작성 프로세스:
1. 서류 종류 확인
2. 수신자(거래처) 정보 확인: 상호명, 대표자명, 사업자번호 등
3. 품목 정보 확인: 품명, 규격, 수량, 단가
4. 비고/특이사항 확인
5. 충분한 정보가 모이면 서류 데이터를 JSON으로 생성

중요 규칙:
- 한 번에 너무 많은 정보를 요구하지 말고, 단계별로 자연스럽게 대화하세요.
- 금액은 한국 원(₩) 기준입니다.
- 수량과 단가에서 합계를 자동 계산합니다.

서류 종류 매핑:
- 견적서 → quotation
- 거래명세서 → transaction_statement
- 세금계산서 → tax_invoice
- 영수증 → receipt
- 계약서 → contract
- 발주서 → purchase_order
- 납품서 → delivery_note

충분한 정보가 수집되면, 응답 마지막에 다음 형식의 JSON 블록을 포함하세요:
\`\`\`document_json
{
  "type": "quotation",
  "title": "서류 제목",
  "receiver_info": {
    "company_name": "거래처명",
    "representative": "대표자",
    "business_number": "사업자번호"
  },
  "items": [
    {"name": "품명", "spec": "규격", "qty": 1, "unit_price": 10000}
  ],
  "notes": "비고사항"
}
\`\`\`

JSON 블록은 반드시 \`\`\`document_json 으로 시작하고 \`\`\` 으로 끝나야 합니다.
JSON 블록 앞에는 서류 내용을 요약하는 설명 메시지를 넣으세요.`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function extractDocumentData(text: string): { message: string; documentData: Record<string, unknown> | null } {
  const docJsonRegex = /```document_json\s*([\s\S]*?)```/
  const match = text.match(docJsonRegex)

  if (match) {
    try {
      const documentData = JSON.parse(match[1].trim())
      const message = text.replace(docJsonRegex, '').trim()
      return { message, documentData }
    } catch {
      return { message: text, documentData: null }
    }
  }

  return { message: text, documentData: null }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body as { messages: ChatMessage[] }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: '메시지가 필요합니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return handleDemoResponse(messages)
    }

    const client = new Anthropic({ apiKey })

    const anthropicMessages = messages.slice(-20).map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = ''

          const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            system: SYSTEM_PROMPT,
            messages: anthropicMessages,
            stream: true,
          })

          for await (const event of response) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const content = event.delta.text
              fullContent += content
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              )
            }
          }

          // After stream complete, check for document data
          const { documentData } = extractDocumentData(fullContent)
          if (documentData) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ document_data: documentData })}\n\n`
              )
            )
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (err) {
          console.error('Claude API stream error:', err)
          // Fallback to demo on error
          const lastMessage = messages[messages.length - 1]?.content || ''
          const fallback = getDemoText(lastMessage)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ message: fallback.text })}\n\n`)
          )
          if (fallback.documentData) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ document_data: fallback.documentData })}\n\n`)
            )
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return new Response(JSON.stringify({ error: '서버 오류가 발생했습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function getDemoText(lastMessage: string): { text: string; documentData: Record<string, unknown> | null } {
  const msg = lastMessage.toLowerCase()

  if (msg.includes('견적서')) {
    return {
      text: '견적서를 작성하겠습니다. 먼저 거래처 정보가 필요합니다.\n\n다음 정보를 알려주세요:\n- **거래처(수신) 상호명**\n- **대표자명**\n- **사업자번호** (선택)',
      documentData: null,
    }
  } else if (msg.includes('거래명세서')) {
    return {
      text: '거래명세서를 작성하겠습니다. 먼저 거래처 정보를 알려주세요.\n\n- **거래처 상호명**\n- **대표자명**\n- **거래 품목**은 무엇인가요?',
      documentData: null,
    }
  } else if (msg.includes('세금계산서')) {
    return {
      text: '세금계산서를 발행하겠습니다. 다음 정보가 필요합니다:\n\n- **공급받는자 상호명**\n- **대표자명**\n- **사업자번호** (필수)\n- **업태 및 종목**',
      documentData: null,
    }
  } else if (msg.includes('계약서')) {
    return {
      text: '계약서를 작성하겠습니다. 어떤 종류의 계약서인가요?\n\n- 용역(서비스) 계약\n- 물품 공급 계약\n- 기타\n\n계약 상대방 정보도 함께 알려주세요.',
      documentData: null,
    }
  } else if (msg.includes('품목') || msg.includes('품명') || msg.includes('개') || msg.includes('원') || msg.includes('만원')) {
    return {
      text: '입력하신 정보로 견적서를 작성했습니다. 아래 내용을 확인해주세요.',
      documentData: {
        type: 'quotation',
        title: '견적서',
        receiver_info: {
          company_name: '(주)예시기업',
          representative: '홍길동',
          business_number: '123-45-67890',
        },
        items: [
          { name: '웹사이트 개발', spec: '반응형 웹', qty: 1, unit_price: 5000000 },
          { name: '유지보수 (월)', spec: '3개월', qty: 3, unit_price: 500000 },
        ],
        notes: '부가세 별도 / 납품일로부터 30일 이내 결제',
      },
    }
  }

  return {
    text: '어떤 서류를 작성하시겠어요? 아래 서류를 작성할 수 있습니다:\n\n- **견적서** - 거래 전 가격 제안\n- **거래명세서** - 거래 내역 증빙\n- **세금계산서** - 세금 신고용\n- **계약서** - 계약 체결용\n\n원하시는 서류를 말씀해주세요.',
    documentData: null,
  }
}

function handleDemoResponse(messages: ChatMessage[]) {
  const lastMessage = messages[messages.length - 1]?.content || ''
  const { text, documentData } = getDemoText(lastMessage)

  const encoder = new TextEncoder()
  const payload = documentData
    ? JSON.stringify({ message: text, document_data: documentData })
    : JSON.stringify({ message: text })

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
