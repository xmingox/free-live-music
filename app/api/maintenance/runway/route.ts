/**
 * /api/maintenance/runway — Weekly supply-runway monitor.
 *
 * Measures upcoming free-music supply per city (next 90 days + the 60–90d tail),
 * compares against the previous run, and alerts when a previously-covered city
 * falls below the coverage floor or when site-wide 90-day supply drops sharply
 * week-over-week. Persists a snapshot to runway_runs, mirrors a summary to
 * cron_runs (so it shows in the daily digest), and emails via Resend on any fail.
 *
 * Schedule: weekly (see vercel.json). Runs read-only against concerts; writes
 * only to runway_runs + cron_runs via the service role.
 *
 * Requires: Authorization: Bearer {CRON_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUsToday } from '@/lib/timezone'
import { createClient } from '@supabase/supabase-js'
import { sendCronAlert } from '@/lib/alerts'
import { computeRunway, diffRunway, type PrevRunway } from '@/lib/runway'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

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

  const started_at = new Date().toISOString()
  const runDate = getUsToday()
  const supabase = getSupabase()

  try {
    // Previous run (most recent run_date strictly before today) for the diff.
    const { data: prevRows } = await supabase
      .from('runway_runs')
      .select('run_date, findings_json')
      .lt('run_date', runDate)
      .order('run_date', { ascending: false })
      .limit(1)
    const prevJson = prevRows?.[0]?.findings_json as
      | { totals?: PrevRunway['totals']; by_city?: PrevRunway['by_city'] }
      | undefined
    const prev: PrevRunway | null = prevJson
      ? { totals: prevJson.totals, by_city: prevJson.by_city }
      : null

    const snapshot = await computeRunway(supabase, runDate)
    const { findings, cliffCities } = diffRunway(snapshot, prev)

    const failCount = findings.filter((f) => f.status === 'fail').length
    const warnCount = findings.filter((f) => f.status === 'warn').length
    const passCount = findings.filter((f) => f.status === 'pass').length
    const finished_at = new Date().toISOString()

    // Persist snapshot (one row per run_date). by_city is what the NEXT run
    // diffs against, so it must live in findings_json.
    const findings_json = {
      totals: snapshot.totals,
      by_city: snapshot.by_city,
      findings,
      cliff_cities: cliffCities,
      // Thinnest covered cities, for at-a-glance triage in the digest/admin.
      thinnest: snapshot.cities
        .filter((c) => c.c90 > 0)
        .sort((a, b) => a.c90 - b.c90)
        .slice(0, 15)
        .map((c) => ({ code: c.code, city: c.cityName, c90: c.c90, c60_90: c.c60_90 })),
    }

    const { error: upsertErr } = await supabase
      .from('runway_runs')
      .upsert(
        {
          run_date: runDate,
          started_at,
          finished_at,
          success: failCount === 0,
          findings_json,
          alert_count: failCount,
          warn_count: warnCount,
          pass_count: passCount,
        },
        { onConflict: 'run_date' },
      )
    if (upsertErr) {
      console.error('[/api/maintenance/runway] runway_runs upsert failed:', upsertErr)
    }

    // Mirror to cron_runs so the daily digest lists it uniformly.
    await supabase.from('cron_runs').insert({
      name: 'runway',
      started_at,
      finished_at,
      success: failCount === 0,
      stats_json: {
        events_90d: snapshot.totals.events_90d,
        cities_90d: snapshot.totals.cities_90d,
        cities_covered: snapshot.totals.cities_covered,
        events_60_90d: snapshot.totals.events_60_90d,
        cities_60_90d: snapshot.totals.cities_60_90d,
        fail: failCount,
        warn: warnCount,
      },
      error_message:
        failCount > 0
          ? findings.filter((f) => f.status === 'fail').map((f) => f.message).join(' | ')
          : null,
    })

    // Alert on hard fails (cooldowned per-endpoint by sendCronAlert).
    if (failCount > 0) {
      const message = findings
        .filter((f) => f.status === 'fail')
        .map((f) => `[${f.name}] ${f.message}`)
        .join('\n')
      await sendCronAlert('/api/maintenance/runway', message)
    }

    return NextResponse.json({
      ok: true,
      run_date: runDate,
      totals: snapshot.totals,
      findings,
      cliff_cities: cliffCities,
    })
  } catch (err) {
    console.error('[/api/maintenance/runway]', err)
    await supabase.from('cron_runs').insert({
      name: 'runway',
      started_at,
      finished_at: new Date().toISOString(),
      success: false,
      stats_json: {},
      error_message: String(err),
    })
    await sendCronAlert('/api/maintenance/runway', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
