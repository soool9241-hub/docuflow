import { NextResponse } from 'next/server'
import { sendSMS } from '@/lib/solapi'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, message } = body

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      )
    }

    // Basic phone number validation
    const phoneClean = to.replace(/[^0-9+]/g, '')
    if (phoneClean.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    const result = await sendSMS(to, message)

    return NextResponse.json({
      message: 'SMS sent successfully',
      result,
    })
  } catch (error) {
    console.error('POST /api/send/sms error:', error)
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    )
  }
}
