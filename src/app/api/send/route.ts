import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendSMS } from '@/lib/solapi'
import { sendEmail } from '@/lib/email'
import { generateDocumentHTML } from '@/templates/document-html'
import { DOCUMENT_TYPE_LABELS } from '@/types'

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { document_id, method, recipient } = body

    if (!document_id || !method || !recipient) {
      return NextResponse.json(
        { error: 'Missing required fields: document_id, method, recipient' },
        { status: 400 }
      )
    }

    if (method !== 'sms' && method !== 'email') {
      return NextResponse.json(
        { error: 'Invalid method. Must be "sms" or "email"' },
        { status: 400 }
      )
    }

    // Fetch the document with contact info
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*, contacts(company_name, representative)')
      .eq('id', document_id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    const typeLabel = DOCUMENT_TYPE_LABELS[document.type as keyof typeof DOCUMENT_TYPE_LABELS] || document.type
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (method === 'sms') {
      const message = [
        `[DocuFlow] ${typeLabel} 발송`,
        `문서번호: ${document.document_number}`,
        `제목: ${document.title}`,
        `금액: ${document.total_amount.toLocaleString()}원`,
        `확인: ${appUrl}/documents/${document.id}`,
      ].join('\n')

      await sendSMS(recipient, message)
    } else {
      const subject = `[DocuFlow] ${typeLabel} - ${document.title} (${document.document_number})`
      const html = generateDocumentHTML(document as any, document.type as any)

      await sendEmail(recipient, subject, html)
    }

    // Update document status
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'sent',
        sent_via: method,
        sent_at: new Date().toISOString(),
      })
      .eq('id', document_id)

    if (updateError) {
      console.error('Failed to update document status:', updateError)
    }

    return NextResponse.json({
      message: `Document sent successfully via ${method}`,
      document_id,
      method,
      recipient,
    })
  } catch (error) {
    console.error('POST /api/send error:', error)
    return NextResponse.json(
      { error: 'Failed to send document' },
      { status: 500 }
    )
  }
}
