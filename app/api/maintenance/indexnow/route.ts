/**
 * /api/maintenance/indexnow — Ping IndexNow with newly approved or modified URLs.
 *
 * Runs daily at 07:00 UTC (Vercel Hobby tier limits crons to daily cadence;
 * upgrade to Pro to change to hourly `5 * * * *` for faster surfacing).
 *
 * Within a 25-hour look-back window:
 *   1. New verified concerts        → /concert/{slug}
 *   2. New / updated eligible venues → /venues/{city}/{slug}
 *
 * Submits the combined batch to api.indexnow.org so Bing/Yandex re-crawl quickly.
 *
 * Requires:
 *   Authorization: Bearer {CRON_SECRET}
 *   INDEXNOW_KEY env var set in Vercel dashboard
 *
 * To activate: set INDEXNOW_KEY env var in Vercel dashboard, then create
 * public/{INDEXNOW_KEY}.txt containing just the key value.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const HOST = 'www.freelivemusic.co'

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

async function writeCronRun(stats: {
  urls_submitted: number
  skipped: boolean
  error?: string
}) {
  try {
    const supabase = getSupabase()
    await supabase.from('cron_runs').insert({
      name:          'indexnow',
      started_at:    new Date().toISOString(),
      finished_at:   new Date().toISOString(),
      success:       !stats.error,
      stats_json:    stats,
      error_message: stats.error ?? null,
    })
  } catch (err) {
    console.error('[/api/maintenance/indexnow] cron_runs insert failed:', err)
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check for IndexNow key before doing any DB work
  const indexNowKey = process.env.INDEXNOW_KEY
  if (!indexNowKey) {
    console.warn('[/api/maintenance/indexnow] INDEXNOW_KEY is not set — skipping')
    await writeCronRun({ urls_submitted: 0, skipped: true })
    return NextResponse.json({ skipped: true, reason: 'INDEXNOW_KEY not configured' })
  }

  // 25-hour look-back covers the daily cron with a 1-hour overlap to avoid
  // boundary misses; IndexNow tolerates repeated submissions for the same URL.
  const supabase = getSupabase()
  const sinceIso = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()

  // 1) Newly verified concerts in the window
  const concertsRes = await supabase
    .from('concerts')
    .select('slug, city')
    .gte('created_at', sinceIso)
    .eq('is_verified', true)

  if (concertsRes.error) {
    console.error('[/api/maintenance/indexnow] concerts query failed:', concertsRes.error)
    await writeCronRun({ urls_submitted: 0, skipped: false, error: concertsRes.error.message })
    return NextResponse.json({ error: concertsRes.error.message }, { status: 500 })
  }

  // 2) Newly created or updated eligible venues in the window
  const venuesRes = await supabase
    .from('venues')
    .select('slug, city, updated_at, music_score, music_schedule')
    .gte('updated_at', sinceIso)

  if (venuesRes.error) {
    console.error('[/api/maintenance/indexnow] venues query failed:', venuesRes.error)
    // Non-fatal: keep going with concerts
  }

  const cityCodeToSlug = (await import('@/lib/city-slugs')).cityCodeToSlug

  const concertUrls = (concertsRes.data ?? [])
    .map((c) => c.slug)
    .filter(Boolean)
    .map((slug) => `https://${HOST}/concert/${slug}`)

  const venueUrls = (venuesRes.data ?? [])
    .filter((v) => (v.music_score ?? 0) >= 0 || v.music_schedule != null)
    .map((v) => {
      const citySlug = cityCodeToSlug[v.city] ?? v.city?.toLowerCase()
      return citySlug && v.slug ? `https://${HOST}/venues/${citySlug}/${v.slug}` : null
    })
    .filter((u): u is string => !!u)

  const urlList = [...new Set([...concertUrls, ...venueUrls])].slice(0, 10_000)

  if (urlList.length === 0) {
    console.log('[/api/maintenance/indexnow] Nothing new to submit')
    await writeCronRun({ urls_submitted: 0, skipped: true })
    return NextResponse.json({ urls_submitted: 0, skipped: true })
  }

  // POST to IndexNow
  const body = {
    host:        HOST,
    key:         indexNowKey,
    keyLocation: `https://${HOST}/${indexNowKey}.txt`,
    urlList,
  }

  let indexNowError: string | undefined
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      indexNowError = `IndexNow responded ${res.status}: ${text}`
      console.error('[/api/maintenance/indexnow]', indexNowError)
    } else {
      console.log(
        `[/api/maintenance/indexnow] Submitted ${urlList.length} URL(s) (${concertUrls.length} concert, ${venueUrls.length} venue) to IndexNow`,
      )
    }
  } catch (err) {
    indexNowError = `IndexNow fetch threw: ${err}`
    console.error('[/api/maintenance/indexnow]', indexNowError)
  }

  const stats = {
    urls_submitted: indexNowError ? 0 : urlList.length,
    skipped:        false,
    ...(indexNowError ? { error: indexNowError } : {}),
  }

  await writeCronRun(stats)

  if (indexNowError) {
    return NextResponse.json({ error: indexNowError }, { status: 502 })
  }

  return NextResponse.json({ urls_submitted: urlList.length, urls: urlList })
}

export const GET  = handle
export const POST = handle
export const dynamic = 'force-dynamic'
