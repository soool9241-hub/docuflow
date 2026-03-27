import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseWithUser } from '@/lib/supabase'

interface ValidationResult {
  valid: boolean
  score: number
  issues: string[]
  suggestions: string[]
}

interface DocumentItem {
  name?: string
  qty?: number
  unit_price?: number
  amount?: number
  tax?: number
}

interface DocumentPayload {
  type?: string
  items?: DocumentItem[]
  total_amount?: number
  tax_amount?: number
  notes?: string
  contact?: {
    company_name?: string
    representative?: string
    business_number?: string
  }
  receiver_info?: {
    company_name?: string
    representative?: string
    business_number?: string
  }
  title?: string
  issuer_info?: Record<string, string>
}

const VALIDATION_SYSTEM_PROMPT = `당신은 한국 비즈니스 서류를 검증하는 전문 AI입니다.

주어진 서류 데이터를 분석하고 다음 항목을 검사하세요:

1. **필수 항목 누락** (거래처명, 품목, 금액 등)
2. **금액 계산 오류** (수량 x 단가 = 금액, 합계 확인)
3. **세금 계산 정확성** (부가세 10% 확인)
4. **서류 유형별 필수 필드**:
   - 견적서(quotation): 거래처명, 품목, 금액
   - 세금계산서(tax_invoice): 거래처명, 사업자번호, 품목, 금액, 부가세
   - 거래명세서(transaction_statement): 거래처명, 품목, 금액
   - 영수증(receipt): 품목, 금액
   - 계약서(contract): 거래처명, 계약 내용
   - 발주서(purchase_order): 거래처명, 품목, 금액
   - 납품서(delivery_note): 거래처명, 품목, 수량
5. **날짜 형식 확인**

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트를 포함하지 마세요:
{
  "valid": true/false,
  "score": 0-100,
  "issues": ["발견된 문제점 목록"],
  "suggestions": ["개선 제안 목록"]
}

- score: 100은 완벽, 0은 매우 불량
- issues: 반드시 수정해야 할 오류
- suggestions: 선택적 개선 사항
- valid: issues가 없으면 true, 있으면 false`

function basicValidation(document: DocumentPayload): ValidationResult {
  const issues: string[] = []
  const suggestions: string[] = []

  // Check items
  if (!document.items || document.items.length === 0) {
    issues.push('품목이 입력되지 않았습니다.')
  } else {
    document.items.forEach((item, index) => {
      if (!item.name || item.name.trim() === '') {
        issues.push(`품목 ${index + 1}: 품명이 비어있습니다.`)
      }
      if (!item.qty || item.qty <= 0) {
        issues.push(`품목 ${index + 1}: 수량이 0 이하입니다.`)
      }
      if (!item.unit_price || item.unit_price <= 0) {
        issues.push(`품목 ${index + 1}: 단가가 0 이하입니다.`)
      }
      // Check amount calculation
      if (item.qty && item.unit_price && item.amount) {
        const expected = item.qty * item.unit_price
        if (Math.abs(expected - item.amount) > 1) {
          issues.push(`품목 ${index + 1}: 금액 계산 오류 (${item.qty} x ${item.unit_price.toLocaleString()} ≠ ${item.amount.toLocaleString()})`)
        }
      }
    })
  }

  // Check contact info
  const contact = document.contact || document.receiver_info
  if (!contact || !contact.company_name || contact.company_name.trim() === '') {
    issues.push('거래처명이 입력되지 않았습니다.')
  }

  // Check total amount
  if (document.total_amount !== undefined && document.total_amount <= 0) {
    issues.push('합계 금액이 0 이하입니다.')
  }

  // Check tax for tax_invoice
  if (document.type === 'tax_invoice') {
    if (!contact?.business_number || contact.business_number.trim() === '') {
      issues.push('세금계산서에는 사업자번호가 필수입니다.')
    }
    if (document.total_amount && document.tax_amount !== undefined) {
      const expectedTax = Math.round(document.total_amount * 0.1)
      if (Math.abs(expectedTax - document.tax_amount) > 1) {
        suggestions.push(`부가세가 공급가액의 10%와 다릅니다. (예상: ${expectedTax.toLocaleString()}원, 실제: ${document.tax_amount.toLocaleString()}원)`)
      }
    }
  }

  // Check title
  if (!document.title || document.title.trim() === '') {
    suggestions.push('서류 제목을 입력하는 것이 좋습니다.')
  }

  const score = Math.max(0, 100 - issues.length * 20 - suggestions.length * 5)

  return {
    valid: issues.length === 0,
    score,
    issues,
    suggestions,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getSupabaseWithUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { document } = body as { document: DocumentPayload }

    if (!document) {
      return NextResponse.json({ error: '서류 데이터가 필요합니다.' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // Fallback to basic validation without AI
      const result = basicValidation(document)
      return NextResponse.json(result)
    }

    try {
      const client = new Anthropic({ apiKey })

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: VALIDATION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `다음 한국 비즈니스 서류를 검증해주세요:\n\n${JSON.stringify(document, null, 2)}`,
          },
        ],
      })

      const textContent = response.content.find((c) => c.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        // Fallback
        const result = basicValidation(document)
        return NextResponse.json(result)
      }

      // Parse the AI response as JSON
      let aiResult: ValidationResult
      try {
        // Try to extract JSON from the response (in case AI wraps it)
        const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          aiResult = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch {
        // If AI response is not valid JSON, fallback
        const result = basicValidation(document)
        return NextResponse.json(result)
      }

      // Ensure proper types
      return NextResponse.json({
        valid: Boolean(aiResult.valid),
        score: Math.min(100, Math.max(0, Number(aiResult.score) || 0)),
        issues: Array.isArray(aiResult.issues) ? aiResult.issues : [],
        suggestions: Array.isArray(aiResult.suggestions) ? aiResult.suggestions : [],
      })
    } catch (err) {
      console.error('Anthropic API error:', err)
      // Fallback to basic validation on API error
      const result = basicValidation(document)
      return NextResponse.json(result)
    }
  } catch (err) {
    console.error('POST /api/validate error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
