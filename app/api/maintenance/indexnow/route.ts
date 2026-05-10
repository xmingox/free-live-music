/**
 * /api/maintenance/indexnow — Ping IndexNow with newly approved concert URLs.
 *
 * Runs every 30 minutes via Vercel Cron. Queries concerts approved in the last
 * 35 minutes (overlapping window to avoid missing events near the boundary) and
 * submits their URLs to api.indexnow.org so Bing indexes them immediately.
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

  // Query concerts approved in the last 35 minutes (35-min window covers the
  // 30-min cron interval with a 5-min overlap to avoid boundary misses)
  const supabase = getSupabase()
  const { data: concerts, error: queryError } = await supabase
    .from('concerts')
    .select('slug')
    .gte('created_at', new Date(Date.now() - 35 * 60 * 1000).toISOString())
    .eq('is_verified', true)

  if (queryError) {
    console.error('[/api/maintenance/indexnow] DB query failed:', queryError)
    await writeCronRun({ urls_submitted: 0, skipped: false, error: queryError.message })
    return NextResponse.json({ error: queryError.message }, { status: 500 })
  }

  // Filter to concerts that have a slug (all verified concerts should, but guard anyway)
  const slugs = (concerts ?? []).map((c) => c.slug).filter(Boolean) as string[]

  if (slugs.length === 0) {
    console.log('[/api/maintenance/indexnow] No new concerts to submit')
    await writeCronRun({ urls_submitted: 0, skipped: true })
    return NextResponse.json({ urls_submitted: 0, skipped: true })
  }

  const urlList = slugs.map((slug) => `https://${HOST}/concert/${slug}`)

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
        `[/api/maintenance/indexnow] Submitted ${urlList.length} URL(s) to IndexNow`,
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
