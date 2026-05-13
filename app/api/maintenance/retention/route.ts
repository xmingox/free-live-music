/**
 * /api/maintenance/retention — 90-day data retention policy.
 *
 * Runs weekly (Sunday 02:00 UTC). Deletes:
 *   - cron_runs older than 90 days
 *   - qa_flags older than 90 days (resolved or not)
 *
 * Requires: Authorization: Bearer {CRON_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const stats: Record<string, number> = {}

  const { count: cronCount, error: cronErr } = await supabase
    .from('cron_runs')
    .delete({ count: 'exact' })
    .lt('started_at', cutoff)

  if (cronErr) {
    console.error('[retention] cron_runs delete failed:', cronErr)
  } else {
    stats.cron_runs_deleted = cronCount ?? 0
  }

  const { count: qaCount, error: qaErr } = await supabase
    .from('qa_flags')
    .delete({ count: 'exact' })
    .lt('flagged_at', cutoff)

  if (qaErr) {
    console.error('[retention] qa_flags delete failed:', qaErr)
  } else {
    stats.qa_flags_deleted = qaCount ?? 0
  }

  // Log to cron_runs
  const { error: writeErr } = await supabase.from('cron_runs').insert({
    name: 'retention',
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    success: !cronErr && !qaErr,
    stats_json: stats,
    error_message: [cronErr?.message, qaErr?.message].filter(Boolean).join('; ') || null,
  })
  if (writeErr) console.error('[retention] cron_runs insert failed:', writeErr)

  console.log('[retention]', stats)
  return NextResponse.json(stats)
}

export const GET  = handle
export const POST = handle
