import { NextResponse } from 'next/server'
import { getSupabaseWithUser } from '@/lib/supabase'

export async function GET() {
  try {
    const { supabase, user } = await getSupabaseWithUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data: templates, error } = await supabase
      .from('document_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('GET /api/templates error:', error)
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
    const { name, type, contact_id, items, notes } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('document_templates')
      .insert({
        name,
        type,
        contact_id: contact_id || null,
        items: items || [],
        notes: notes || '',
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST /api/templates error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
