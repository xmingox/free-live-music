import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const VALID_ISSUE_TYPES = ['cancelled', 'wrong_date_time', 'wrong_artist', 'broken_link', 'other'] as const
type IssueType = typeof VALID_ISSUE_TYPES[number]

function hashIp(ip: string): string {
  return createHash('sha256').update(ip + (process.env.IP_HASH_SALT ?? 'flm')).digest('hex').slice(0, 16)
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Honeypot — bots fill this field, humans don't see it
    if (body.website) {
      return NextResponse.json({ ok: true })
    }

    const { concert_id, issue_type, comment, reporter_email } = body

    if (!concert_id || typeof concert_id !== 'string') {
      return NextResponse.json({ error: 'Missing concert_id' }, { status: 400 })
    }
    if (!VALID_ISSUE_TYPES.includes(issue_type as IssueType)) {
      return NextResponse.json({ error: 'Invalid issue_type' }, { status: 400 })
    }
    if (comment && (typeof comment !== 'string' || comment.length > 280)) {
      return NextResponse.json({ error: 'Comment too long' }, { status: 400 })
    }

    const ip = getIp(req)
    const ip_hash = hashIp(ip)

    // Rate limit: 3 reports per hour per IP
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('event_reports')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ip_hash)
      .gte('created_at', oneHourAgo)

    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: 'Too many reports' }, { status: 429 })
    }

    const { error: insertError } = await supabase.from('event_reports').insert({
      concert_id,
      issue_type,
      comment: comment ?? null,
      reporter_email: reporter_email ?? null,
      ip_hash,
      status: 'new',
    })

    if (insertError) {
      console.error('event_reports insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
    }

    // Send email notification via Resend if configured
    if (process.env.RESEND_API_KEY && process.env.RESEND_TO_EMAIL) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      const issueLabels: Record<IssueType, string> = {
        cancelled: 'Event Cancelled',
        wrong_date_time: 'Wrong Date or Time',
        wrong_artist: 'Wrong Artist',
        broken_link: 'Source Link Broken',
        other: 'Other Issue',
      }

      await resend.emails.send({
        from: 'reports@freelivemusic.co',
        to: process.env.RESEND_TO_EMAIL,
        subject: `[Report] ${issueLabels[issue_type as IssueType]} — freelivemusic.co`,
        text: [
          `Issue: ${issueLabels[issue_type as IssueType]}`,
          `Concert ID: ${concert_id}`,
          `Concert URL: https://www.freelivemusic.co/concert/${body.concert_slug ?? ''}`,
          comment ? `Comment: ${comment}` : '',
          reporter_email ? `Reporter: ${reporter_email}` : '',
        ].filter(Boolean).join('\n'),
      }).catch(err => console.error('Resend error:', err))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Report API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
