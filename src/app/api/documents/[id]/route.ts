import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('documents')
      .select('*, contacts(company_name, representative, email, phone)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/documents/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const { id } = await params
    const body = await request.json()

    const {
      type,
      title,
      contact_id,
      issuer_info,
      receiver_info,
      items,
      total_amount,
      tax_amount,
      notes,
      status,
    } = body

    const updateData: Record<string, any> = {}
    if (type !== undefined) updateData.type = type
    if (title !== undefined) updateData.title = title
    if (contact_id !== undefined) updateData.contact_id = contact_id
    if (issuer_info !== undefined) updateData.issuer_info = issuer_info
    if (receiver_info !== undefined) updateData.receiver_info = receiver_info
    if (items !== undefined) updateData.items = items
    if (total_amount !== undefined) updateData.total_amount = total_amount
    if (tax_amount !== undefined) updateData.tax_amount = tax_amount
    if (notes !== undefined) updateData.notes = notes
    if (status !== undefined) updateData.status = status

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('documents')
      .update(updateData as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('PUT /api/documents/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const { id } = await params

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/documents/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
