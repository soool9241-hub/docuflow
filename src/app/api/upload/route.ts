import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: '파일이 필요합니다.' },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '파일 크기는 10MB를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    const fileName = file.name
    const ext = fileName.split('.').pop()?.toLowerCase()

    // Handle CSV files
    if (ext === 'csv') {
      const text = await file.text()
      const lines = text.trim().split('\n')

      if (lines.length < 1) {
        return NextResponse.json(
          { error: 'CSV 파일이 비어있습니다.' },
          { status: 400 }
        )
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
      const rows: Record<string, string>[] = []

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue

        const values = parseCSVLine(lines[i])
        const row: Record<string, string> = {}
        headers.forEach((header, idx) => {
          row[header] = values[idx] || ''
        })
        rows.push(row)
      }

      // Try to store file in Supabase Storage
      let storagePath: string | null = null
      try {
        const supabase = createServerClient()
        const storageName = `uploads/${Date.now()}_${fileName}`
        const buffer = Buffer.from(text, 'utf-8')

        const { data, error } = await supabase.storage
          .from('documents')
          .upload(storageName, buffer, {
            contentType: 'text/csv',
            upsert: false,
          })

        if (!error && data) {
          storagePath = data.path
        }
      } catch {
        // Storage upload failed, continue without it
      }

      return NextResponse.json({
        success: true,
        fileName,
        fileType: 'csv',
        headers,
        rows,
        rowCount: rows.length,
        storagePath,
      })
    }

    // Handle image files
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '')) {
      // Store file in Supabase Storage
      let storagePath: string | null = null
      let publicUrl: string | null = null

      try {
        const supabase = createServerClient()
        const storageName = `uploads/${Date.now()}_${fileName}`
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { data, error } = await supabase.storage
          .from('documents')
          .upload(storageName, buffer, {
            contentType: file.type,
            upsert: false,
          })

        if (!error && data) {
          storagePath = data.path
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(storagePath)
          publicUrl = urlData.publicUrl
        }
      } catch {
        // Storage upload failed, continue without it
      }

      return NextResponse.json({
        success: true,
        fileName,
        fileType: 'image',
        storagePath,
        publicUrl,
        message: 'OCR 텍스트 추출은 외부 서비스 연동이 필요합니다.',
      })
    }

    return NextResponse.json(
      { error: '지원하지 않는 파일 형식입니다. CSV 또는 이미지 파일을 업로드해주세요.' },
      { status: 400 }
    )
  } catch (err) {
    console.error('Upload API error:', err)
    return NextResponse.json(
      { error: '파일 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}
