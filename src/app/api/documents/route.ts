import { NextResponse } from 'next/server'
import { getSupabaseWithUser } from '@/lib/supabase'

const TYPE_PREFIXES: Record<string, string> = {
  quotation: 'QT',
  transaction_statement: 'TS',
  tax_invoice: 'TI',
  receipt: 'RC',
  contract: 'CT',
  consent: 'CS',
  purchase_order: 'PO',
  delivery_note: 'DN',
}

async function generateDocumentNumber(
  supabase: Awaited<ReturnType<typeof getSupabaseWithUser>>['supabase'],
  type: string
): Promise<string> {
  const prefix = TYPE_PREFIXES[type] || 'DOC'
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const pattern = `${prefix}-${dateStr}-%`

  const { count } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .like('document_number', pattern)

  const seq = String((count ?? 0) + 1).padStart(3, '0')
  return `${prefix}-${dateStr}-${seq}`
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getSupabaseWithUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))
    const offset = (page - 1) * limit

    let query = supabase
      .from('documents')
      .select('*, contacts(company_name, representative)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type) {
      query = query.eq('type', type as any)
    }

    if (status) {
      query = query.eq('status', status as any)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,document_number.ilike.%${search}%`)
    }

    const { data: documents, error, count: total } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      documents,
      total: total ?? 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('GET /api/documents error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getSupabaseWithUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()

    const { type, title, contact_id, issuer_info, receiver_info, items, total_amount, tax_amount, notes, status } = body

    if (!type || !title || !issuer_info || !receiver_info || !items) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, issuer_info, receiver_info, items' },
        { status: 400 }
      )
    }

    if (!TYPE_PREFIXES[type]) {
      return NextResponse.json(
        { error: `Invalid document type: ${type}` },
        { status: 400 }
      )
    }

    const document_number = await generateDocumentNumber(supabase, type)

    const { data, error } = await supabase
      .from('documents')
      .insert({
        type,
        title,
        document_number,
        contact_id: contact_id || null,
        issuer_info,
        receiver_info,
        items,
        total_amount: total_amount ?? 0,
        tax_amount: tax_amount ?? 0,
        notes: notes || null,
        status: status || 'draft',
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST /api/documents error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
