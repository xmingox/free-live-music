/**
 * /api/maintenance/digest — Daily cron digest.
 *
 * Pulls yesterday's cron_runs and emails a summary via Resend.
 * Runs at 08:00 UTC daily (after all overnight crons have completed).
 *
 * Requires: Authorization: Bearer {CRON_SECRET}
 * Optional: RESEND_API_KEY + RESEND_TO_EMAIL (no-op if not set)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendDailyDigest } from '@/lib/alerts'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: runs, error } = await supabase
    .from('cron_runs')
    .select('name, started_at, success, error_message, stats_json')
    .gte('started_at', `${yesterday}T00:00:00Z`)
    .lte('started_at', `${yesterday}T23:59:59Z`)
    .order('started_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await sendDailyDigest(runs ?? [])

  return NextResponse.json({ ok: true, runs_found: (runs ?? []).length, date: yesterday })
}

export const POST = GET
export const dynamic = 'force-dynamic'
