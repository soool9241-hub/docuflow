import { NextResponse } from 'next/server'
import { getSupabaseWithUser } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getSupabaseWithUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search')
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))
    const offset = (page - 1) * limit

    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(
        `company_name.ilike.%${search}%,representative.ilike.%${search}%,business_number.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    const { data: contacts, error, count: total } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      contacts,
      total: total ?? 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('GET /api/contacts error:', error)
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

    const { company_name, representative, business_number, email, phone, address, memo } = body

    if (!company_name || !representative || !business_number) {
      return NextResponse.json(
        { error: 'Missing required fields: company_name, representative, business_number' },
        { status: 400 }
      )
    }

    // Validate business number format (Korean: 000-00-00000)
    const bnClean = business_number.replace(/-/g, '')
    if (!/^\d{10}$/.test(bnClean)) {
      return NextResponse.json(
        { error: 'Invalid business number format. Expected 10 digits (e.g., 000-00-00000)' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        company_name,
        representative,
        business_number,
        email: email || null,
        phone: phone || null,
        address: address || null,
        memo: memo || null,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST /api/contacts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
