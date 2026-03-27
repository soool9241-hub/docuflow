import { NextResponse } from 'next/server'
import { getSupabaseWithUser } from '@/lib/supabase'

export async function POST() {
  try {
    const { supabase, user } = await getSupabaseWithUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    let created = 0

    // 1. Check for unsent documents (draft) older than 3 days
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { data: unsentDocs, error: unsentError } = await supabase
      .from('documents')
      .select('id, title, document_number')
      .eq('status', 'draft')
      .lt('created_at', threeDaysAgo.toISOString())

    if (!unsentError && unsentDocs && unsentDocs.length > 0) {
      // Check which documents already have an unsent notification
      const docIds = unsentDocs.map((d) => d.id)
      const { data: existingNotifs } = await supabase
        .from('notifications')
        .select('document_id')
        .eq('user_id', user.id)
        .eq('type', 'unsent')
        .in('document_id', docIds)

      const existingDocIds = new Set(
        (existingNotifs || []).map((n: { document_id: string }) => n.document_id)
      )

      const newNotifs = unsentDocs
        .filter((doc) => !existingDocIds.has(doc.id))
        .map((doc) => ({
          user_id: user.id,
          type: 'unsent',
          title: '미발송 서류가 있습니다',
          message: `"${doc.title}" (${doc.document_number}) 서류가 3일 이상 미발송 상태입니다.`,
          document_id: doc.id,
          is_read: false,
        }))

      if (newNotifs.length > 0) {
        const { error: insertError } = await supabase
          .from('notifications')
          .insert(newNotifs)

        if (!insertError) {
          created += newNotifs.length
        }
      }
    }

    // 2. Document status summary - create only if no recent summary exists
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const { data: recentSummary } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'summary')
      .gte('created_at', oneDayAgo.toISOString())
      .limit(1)

    if (!recentSummary || recentSummary.length === 0) {
      const { data: allDocs } = await supabase
        .from('documents')
        .select('status')

      if (allDocs && allDocs.length > 0) {
        const counts: Record<string, number> = { draft: 0, sent: 0, confirmed: 0 }
        allDocs.forEach((doc) => {
          if (counts[doc.status] !== undefined) {
            counts[doc.status]++
          }
        })

        const summaryMessage = `작성중: ${counts.draft}건, 발송완료: ${counts.sent}건, 확인됨: ${counts.confirmed}건 (총 ${allDocs.length}건)`

        const { error: summaryError } = await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'summary',
            title: '서류 현황 요약',
            message: summaryMessage,
            document_id: null,
            is_read: false,
          })

        if (!summaryError) {
          created++
        }
      }
    }

    return NextResponse.json({ created })
  } catch (error) {
    console.error('POST /api/notifications/check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
