import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runImport } from '@/lib/importers/index'
import { sendCronAlert } from '@/lib/alerts'
import { revalidateTag } from 'next/cache'

// Used by Vercel Cron (GET) and manual triggers (POST).
// Both require: Authorization: Bearer {CRON_SECRET}
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

async function writeCronRun(record: {
  started_at: string
  success: boolean
  stats_json: object
  error_message: string | null
}) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { error } = await supabase.from('cron_runs').insert({
      name:          'import',
      started_at:    record.started_at,
      finished_at:   new Date().toISOString(),
      success:       record.success,
      stats_json:    record.stats_json,
      error_message: record.error_message,
    })
    if (error) console.error('[/api/import] cron_runs insert failed:', error)
  } catch (err) {
    console.error('[/api/import] cron_runs insert threw:', err)
  }
}

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const started_at = new Date().toISOString()
  try {
    const stats = await runImport()
    console.log('[/api/import]', stats)
    // Event-driven revalidation: refresh the cached concert data + the pages that
    // consume it now that new events may have landed — instead of relying on
    // per-page hourly ISR timers (the cause of the ISR-write overage).
    revalidateTag('concerts')
    await writeCronRun({ started_at, success: true, stats_json: stats, error_message: null })
    return NextResponse.json(stats)
  } catch (err) {
    console.error('[/api/import]', err)
    await writeCronRun({ started_at, success: false, stats_json: {}, error_message: String(err) })
    await sendCronAlert('/api/import', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export const GET  = handle
export const POST = handle
