/**
 * /api/maintenance/past-events — Archive concerts older than 7 days.
 *
 * Runs daily at 05:15 UTC via Vercel Cron. Sets is_archived = true on concerts
 * whose date is more than 7 days in the past, keeping active queries fast by
 * letting them filter on is_archived = false.
 *
 * If the is_archived column doesn't exist yet (error code 42703), the handler
 * returns gracefully with a note to run the migration first.
 *
 * Requires: Authorization: Bearer {CRON_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Auth ──────────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

// ── Supabase ──────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function writeCronRun(record: {
  success: boolean
  stats_json: object
  error_message: string | null
}) {
  try {
    const supabase = getSupabase()
    const now = new Date().toISOString()
    await supabase.from('cron_runs').insert({
      name:          'past-events',
      started_at:    now,
      finished_at:   now,
      success:       record.success,
      stats_json:    record.stats_json,
      error_message: record.error_message,
    })
  } catch (err) {
    console.error('[/api/maintenance/past-events] cron_runs insert failed:', err)
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('concerts')
    .update({ is_archived: true })
    .lt('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .or('is_archived.is.null,is_archived.eq.false')
    .select('id')

  // Postgres error code 42703 = undefined_column (is_archived doesn't exist yet)
  if (error) {
    const pgCode = (error as any)?.code ?? ''
    if (pgCode === '42703') {
      const note = 'is_archived column not yet added — run migration first'
      console.warn('[/api/maintenance/past-events]', note)
      const stats = { archived: 0, note }
      await writeCronRun({ success: false, stats_json: stats, error_message: note })
      return NextResponse.json(stats)
    }

    console.error('[/api/maintenance/past-events] UPDATE failed:', error)
    await writeCronRun({
      success:       false,
      stats_json:    { archived: 0 },
      error_message: error.message,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const archived = data?.length ?? 0
  const stats = { archived }

  console.log(`[/api/maintenance/past-events] Archived ${archived} past concert(s)`)

  await writeCronRun({ success: true, stats_json: stats, error_message: null })

  return NextResponse.json(stats)
}

export const GET  = handle
export const POST = handle
export const dynamic = 'force-dynamic'
