import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseWithUser } from '@/lib/supabase'

interface ClovaOCRField {
  inferText: string
  inferConfidence: number
  boundingPoly: {
    vertices: { x: number; y: number }[]
  }
}

interface ClovaOCRImage {
  fields: ClovaOCRField[]
}

interface ClovaOCRResponse {
  images: ClovaOCRImage[]
}

// Parse business registration number patterns
function extractBusinessInfo(text: string): Record<string, string> {
  const info: Record<string, string> = {}

  // 사업자등록번호 (xxx-xx-xxxxx)
  const bizNumMatch = text.match(/(\d{3}[-\s]?\d{2}[-\s]?\d{5})/)
  if (bizNumMatch) {
    info.business_number = bizNumMatch[1].replace(/\s/g, '').replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')
  }

  // 전화번호
  const phoneMatch = text.match(/(0\d{1,2}[-)\s]?\d{3,4}[-\s]?\d{4})/)
  if (phoneMatch) {
    info.phone = phoneMatch[1].replace(/\s/g, '')
  }

  // 이메일
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  if (emailMatch) {
    info.email = emailMatch[1]
  }

  return info
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getSupabaseWithUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const invokeUrl = process.env.CLOVA_OCR_INVOKE_URL
    const secretKey = process.env.CLOVA_OCR_SECRET_KEY

    if (!invokeUrl || !secretKey) {
      return NextResponse.json(
        { error: 'Clova OCR API 설정이 필요합니다. 환경변수를 확인해주세요.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const imageData = formData.get('imageData') as string | null

    let imageBase64: string
    let fileFormat: string

    if (file) {
      const arrayBuffer = await file.arrayBuffer()
      imageBase64 = Buffer.from(arrayBuffer).toString('base64')
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      fileFormat = ext === 'png' ? 'png' : 'jpg'
    } else if (imageData) {
      // data:image/jpeg;base64,xxxxx format
      const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/)
      if (!matches) {
        return NextResponse.json({ error: '잘못된 이미지 데이터입니다.' }, { status: 400 })
      }
      fileFormat = matches[1] === 'png' ? 'png' : 'jpg'
      imageBase64 = matches[2]
    } else {
      return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 })
    }

    // Call Clova OCR API
    const requestBody = {
      version: 'V2',
      requestId: `docuflow-${Date.now()}`,
      timestamp: Date.now(),
      images: [
        {
          format: fileFormat,
          name: 'document',
          data: imageBase64,
        },
      ],
    }

    const response = await fetch(invokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OCR-SECRET': secretKey,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Clova OCR API error:', response.status, errorText)
      return NextResponse.json(
        { error: `OCR API 오류: ${response.status}` },
        { status: 500 }
      )
    }

    const result: ClovaOCRResponse = await response.json()

    if (!result.images || result.images.length === 0) {
      return NextResponse.json({ error: '이미지에서 텍스트를 인식할 수 없습니다.' }, { status: 400 })
    }

    const fields = result.images[0].fields || []

    // Extract full text
    const fullText = fields.map((f) => f.inferText).join(' ')

    // Extract individual text lines by grouping by Y position
    const lines: string[] = []
    let currentLine: { text: string; y: number }[] = []

    const sortedFields = [...fields].sort((a, b) => {
      const aY = a.boundingPoly.vertices[0].y
      const bY = b.boundingPoly.vertices[0].y
      return aY - bY
    })

    let lastY = -1
    for (const field of sortedFields) {
      const y = field.boundingPoly.vertices[0].y
      if (lastY >= 0 && Math.abs(y - lastY) > 15) {
        // New line
        lines.push(currentLine.map((c) => c.text).join(' '))
        currentLine = []
      }
      currentLine.push({ text: field.inferText, y })
      lastY = y
    }
    if (currentLine.length > 0) {
      lines.push(currentLine.map((c) => c.text).join(' '))
    }

    // Try to extract structured business info
    const extractedInfo = extractBusinessInfo(fullText)

    // Try to find company name and representative
    const textLines = lines.join('\n')

    // 상호/법인명
    const companyPatterns = [
      /상\s*호[:\s]*([^\n]+)/,
      /법인명[:\s]*([^\n]+)/,
      /회사명[:\s]*([^\n]+)/,
    ]
    for (const pattern of companyPatterns) {
      const match = textLines.match(pattern)
      if (match) {
        extractedInfo.company_name = match[1].trim()
        break
      }
    }

    // 대표자
    const repPatterns = [
      /대표자[:\s]*([^\n]+)/,
      /성\s*명[:\s]*([^\n]+)/,
      /대\s*표[:\s]*([^\n]+)/,
    ]
    for (const pattern of repPatterns) {
      const match = textLines.match(pattern)
      if (match) {
        extractedInfo.representative = match[1].trim()
        break
      }
    }

    // 주소
    const addrPatterns = [
      /사업장\s*소재지[:\s]*([^\n]+)/,
      /주\s*소[:\s]*([^\n]+)/,
    ]
    for (const pattern of addrPatterns) {
      const match = textLines.match(pattern)
      if (match) {
        extractedInfo.address = match[1].trim()
        break
      }
    }

    // 업태
    const bizTypeMatch = textLines.match(/업\s*태[:\s]*([^\n]+)/)
    if (bizTypeMatch) {
      extractedInfo.business_type = bizTypeMatch[1].trim()
    }

    // 종목
    const bizCatMatch = textLines.match(/종\s*목[:\s]*([^\n]+)/)
    if (bizCatMatch) {
      extractedInfo.business_category = bizCatMatch[1].trim()
    }

    return NextResponse.json({
      success: true,
      fullText,
      lines,
      extractedInfo,
      fieldCount: fields.length,
    })
  } catch (err) {
    console.error('OCR processing error:', err)
    return NextResponse.json(
      { error: 'OCR 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
