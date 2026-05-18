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
import { sendDailyDigest, DigestSeoFinding } from '@/lib/alerts'

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

  // Latest seo_daily_runs row (if any) — surfaces in the digest's SEO section
  const { data: seoRow } = await supabase
    .from('seo_daily_runs')
    .select('run_date, alert_count, warn_count, pass_count, findings_json')
    .order('run_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const seoLatest = seoRow
    ? {
        run_date: seoRow.run_date as string,
        alert_count: seoRow.alert_count as number,
        warn_count: seoRow.warn_count as number,
        pass_count: seoRow.pass_count as number,
        findings: Object.values(
          (seoRow.findings_json as Record<string, { name: string; status: DigestSeoFinding['status']; message: string }>) ?? {},
        ).map((f) => ({ name: f.name, status: f.status, message: f.message })),
      }
    : null

  await sendDailyDigest(runs ?? [], seoLatest)

  return NextResponse.json({ ok: true, runs_found: (runs ?? []).length, date: yesterday, seo_included: !!seoLatest })
}

export const POST = GET
export const dynamic = 'force-dynamic'
