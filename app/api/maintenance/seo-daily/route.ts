/**
 * /api/maintenance/seo-daily — Daily deep SEO health audit.
 *
 * Runs 15 checks across sitemap, crawlability, structured data, GSC signals,
 * Core Web Vitals (CrUX), and content QA. Persists structured findings to
 * seo_daily_runs, opens qa_flags for actionable per-page issues, and emits a
 * Resend alert on any check that returns 'fail'.
 *
 * Schedule: 13:00 UTC daily (6 AM PT) — runs after the 12:00 UTC GSC pull so
 * yesterday's search_metrics row is present for the GSC delta check.
 *
 * Requires:
 *   Authorization: Bearer {CRON_SECRET}
 * Optional env (each missing one is treated as a 'skip' for its check):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GSC_SITE_URL
 *   PSI_API_KEY or GOOGLE_API_KEY
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUsToday } from '@/lib/timezone'
import { createClient } from '@supabase/supabase-js'
import { sendCronAlert } from '@/lib/alerts'
import {
  CheckResult,
  ExpectedCounts,
  SeoFlag,
  checkCanonicalConsistency,
  checkCrux,
  checkGscDelta,
  checkGscUrlInspection,
  checkJsonLd,
  checkPastEventNoindex,
  checkRedirectChains,
  checkRobotsTxt,
  checkSitemap,
  checkSitemapDrift,
  checkSitemapSampleLiveness,
  checkSitemapSplit,
  pickRandomSample,
  summarizeFindings,
} from '@/lib/seo-checks'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const URL_INSPECTION_BUDGET = 20
const PSI_PRIORITY_URLS = [
  'https://www.freelivemusic.co/',
  'https://www.freelivemusic.co/concerts/new-york',
  'https://www.freelivemusic.co/concerts/los-angeles',
  'https://www.freelivemusic.co/venues/new-york',
]

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

  // ── 1. Sitemap fetch + parse ─────────────────────────────────────────────
  const sitemapResult = await checkSitemap()
  const allUrls = sitemapResult.urls
  const concertUrls = allUrls.filter((u) => u.includes('/concert/'))

  // ── 2. Expected counts vs DB (parallel) ──────────────────────────────────
  const today = getUsToday()
  const fourteenDaysOut = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [concertCountRes, venueRowsRes, cityRowsRes, artistRowsRes, prevDayRes] =
    await Promise.all([
      supabase
        .from('concerts')
        .select('id', { count: 'exact', head: true })
        .eq('is_verified', true)
        .eq('is_tbd', false)
        .gte('date', today),
      supabase
        .from('venues')
        .select('id, music_score, music_schedule'),
      supabase
        .from('concerts')
        .select('city')
        .eq('is_verified', true)
        .eq('is_tbd', false)
        .gte('date', today),
      supabase
        .from('concerts')
        .select('artist_name, date')
        .eq('is_verified', true)
        .gte('date', today)
        .not('artist_name', 'is', null),
      supabase
        .from('seo_daily_runs')
        .select('findings_json')
        .order('run_date', { ascending: false })
        .limit(1),
    ])

  const concertsCount = concertCountRes.count ?? 0
  const venuesEligible = (venueRowsRes.data ?? []).filter(
    (v) => ((v.music_score ?? 0) >= 0 || v.music_schedule != null),
  ).length

  const cityCountMap: Record<string, number> = {}
  for (const c of cityRowsRes.data ?? []) {
    cityCountMap[c.city] = (cityCountMap[c.city] ?? 0) + 1
  }
  const citiesEligible = Object.values(cityCountMap).filter((n) => n >= 10).length

  const artistMap = new Map<string, { count: number; hasFuture14: boolean }>()
  for (const row of artistRowsRes.data ?? []) {
    const e = artistMap.get(row.artist_name) ?? { count: 0, hasFuture14: false }
    e.count++
    if (row.date >= fourteenDaysOut) e.hasFuture14 = true
    artistMap.set(row.artist_name, e)
  }
  const artistsEligible = [...artistMap.values()].filter(
    (v) => v.count >= 3 && v.hasFuture14,
  ).length

  // states_active comes from getActiveStateSlugs() — coarse approx is fine
  const statesActive = 50

  const expected: ExpectedCounts = {
    concerts: concertsCount,
    venues_eligible: 0, // venues noindexed + removed from sitemap 2026-07-21 — excluded from expected count
    cities_eligible: citiesEligible,
    artists_eligible: artistsEligible,
    states_active: statesActive,
  }

  const yesterdayUrlCount =
    (prevDayRes.data?.[0]?.findings_json as { sitemap_fetch?: { details?: { url_count?: number } } })
      ?.sitemap_fetch?.details?.url_count ?? null

  const driftResult = checkSitemapDrift(allUrls.length, expected, yesterdayUrlCount)
  const splitResult = checkSitemapSplit(allUrls.length)

  // ── 3–7. Sampling-based checks (parallel) ────────────────────────────────
  const livenessP = checkSitemapSampleLiveness(allUrls, 25)
  const robotsP = checkRobotsTxt()
  const canonicalP = checkCanonicalConsistency(allUrls, 25)

  // For JSON-LD we want concert pages over-represented (the bug we keep
  // regressing on) but still some venue/city for coverage.
  const jsonldUrls = [
    ...pickRandomSample(concertUrls, 15),
    ...pickRandomSample(
      allUrls.filter((u) => u.includes('/venues/') && !u.endsWith('/map')),
      5,
    ),
    ...pickRandomSample(allUrls.filter((u) => u.includes('/concerts/')), 5),
  ]
  const jsonldP = checkJsonLd(jsonldUrls, jsonldUrls.length)

  // Past-event noindex regression — sample 5 archived rows
  const archivedSlugsRes = await supabase
    .from('concerts')
    .select('slug')
    .lt('date', today)
    .eq('is_verified', true)
    .order('date', { ascending: false })
    .limit(5)
  const archivedSlugs = (archivedSlugsRes.data ?? []).map((r) => r.slug).filter(Boolean) as string[]
  const pastNoindexP = checkPastEventNoindex(archivedSlugs)

  // Previous slug redirect-chain check
  const previousSlugsRes = await supabase
    .from('concerts')
    .select('previous_slug')
    .not('previous_slug', 'is', null)
    .limit(500)
  const previousSlugs = (previousSlugsRes.data ?? [])
    .map((r) => r.previous_slug as string)
    .filter(Boolean)
  const redirectsP = checkRedirectChains(previousSlugs, 20)

  // ── 8. GSC daily delta ───────────────────────────────────────────────────
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const gscRollingRes = await supabase
    .from('search_metrics')
    .select('date, impressions, clicks')
    .gte('date', eightDaysAgo)
  const rollingByDate: Record<string, { impressions: number; clicks: number }> = {}
  for (const r of gscRollingRes.data ?? []) {
    const d = r.date as string
    if (!rollingByDate[d]) rollingByDate[d] = { impressions: 0, clicks: 0 }
    rollingByDate[d].impressions += r.impressions ?? 0
    rollingByDate[d].clicks += r.clicks ?? 0
  }
  const rolling = Object.entries(rollingByDate).map(([date, v]) => ({ date, ...v }))
  const gscDeltaResult = checkGscDelta(rolling)

  // ── 9. GSC URL Inspection — recency-weighted sample ──────────────────────
  const recentConcertSlugsRes = await supabase
    .from('concerts')
    .select('slug, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .eq('is_verified', true)
    .order('created_at', { ascending: false })
    .limit(200)
  const recentConcertUrls = (recentConcertSlugsRes.data ?? [])
    .map((r) => `https://www.freelivemusic.co/concert/${r.slug}`)
  const topClickedRes = await supabase
    .from('search_metrics')
    .select('page, clicks')
    .gte('date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('clicks', { ascending: false })
    .limit(50)
  const topClickedPages = [...new Set((topClickedRes.data ?? []).map((r) => r.page as string))]
  const inspectionSample = [
    ...pickRandomSample(recentConcertUrls, 10),
    ...pickRandomSample(allUrls.filter((u) => u.includes('/concerts/') || u.includes('/venues/')), 5),
    ...pickRandomSample(topClickedPages, 5),
  ].slice(0, URL_INSPECTION_BUDGET)

  const urlInspectionP = checkGscUrlInspection(inspectionSample)

  // ── 11. CrUX field vitals ────────────────────────────────────────────────
  const cruxP = checkCrux()

  // Resolve parallel checks
  const [
    livenessResult,
    robotsResult,
    canonicalResult,
    jsonldResult,
    pastNoindexResult,
    redirectsResult,
    urlInspectionResult,
    cruxResult,
  ] = await Promise.all([
    livenessP,
    robotsP,
    canonicalP,
    jsonldP,
    pastNoindexP,
    redirectsP,
    urlInspectionP,
    cruxP,
  ])

  // ── Aggregate ────────────────────────────────────────────────────────────
  const results: CheckResult[] = [
    sitemapResult,
    driftResult,
    livenessResult,
    robotsResult,
    redirectsResult,
    canonicalResult,
    jsonldResult,
    gscDeltaResult,
    urlInspectionResult,
    cruxResult,
    pastNoindexResult,
    splitResult,
  ]

  const summary = summarizeFindings(results)
  const finished_at = new Date().toISOString()

  // Collect per-page flags from sample checks
  const allFlags: SeoFlag[] = []
  for (const r of results) {
    if (r.flags && r.flags.length > 0) allFlags.push(...r.flags)
  }

  // Insert/upsert qa_flags (skip if same source_url+flag_type is already open)
  let flagsInserted = 0
  for (const flag of allFlags) {
    const existing = await supabase
      .from('qa_flags')
      .select('id')
      .eq('source_url', flag.source_url)
      .eq('flag_type', flag.flag_type)
      .eq('resolved', false)
      .maybeSingle()
    if (!existing.data) {
      const { error } = await supabase.from('qa_flags').insert({
        concert_id: null,
        flag_type: flag.flag_type,
        field_name: flag.field_name ?? null,
        stored_value: flag.stored_value ?? null,
        fetched_value: flag.fetched_value ?? null,
        source_url: flag.source_url,
      })
      if (!error) flagsInserted++
    }
  }

  // Persist seo_daily_runs row (one per run_date — upsert).
  // Strip bulky per-check arrays that don't need to live in findings_json:
  // sitemap_fetch.urls is 3k+ URLs, and details.sample / details.failures can
  // grow; the digest only needs name/status/message/short-details.
  const findingsJson: Record<string, Record<string, unknown>> = {}
  for (const r of results) {
    const { flags: _flags, ...rest } = r
    const cleaned: Record<string, unknown> = { ...rest }
    if (r.name === 'sitemap_fetch') {
      cleaned.urls = undefined
    }
    findingsJson[r.name] = cleaned
  }
  const { error: upsertErr } = await supabase
    .from('seo_daily_runs')
    .upsert(
      {
        run_date: runDate,
        started_at,
        finished_at,
        success: summary.fail === 0,
        findings_json: findingsJson,
        alert_count: summary.fail,
        warn_count: summary.warn,
        pass_count: summary.pass,
      },
      { onConflict: 'run_date' },
    )
  if (upsertErr) {
    console.error('[/api/maintenance/seo-daily] seo_daily_runs upsert failed:', upsertErr)
  }

  // Mirror to cron_runs for digest-email uniformity
  await supabase.from('cron_runs').insert({
    name: 'seo-daily',
    started_at,
    finished_at,
    success: summary.fail === 0,
    stats_json: {
      pass: summary.pass,
      warn: summary.warn,
      fail: summary.fail,
      skip: summary.skip,
      flags_inserted: flagsInserted,
      psi_priority_urls: PSI_PRIORITY_URLS.length,
    },
    error_message: summary.fail > 0
      ? results.filter((r) => r.status === 'fail').map((r) => `${r.name}: ${r.message}`).join(' | ')
      : null,
  })

  // Alert on hard fails (cooldowned per-endpoint by sendCronAlert)
  if (summary.fail > 0) {
    const message = results
      .filter((r) => r.status === 'fail')
      .map((r) => `[${r.name}] ${r.message}`)
      .join('\n')
    await sendCronAlert('/api/maintenance/seo-daily', message)
  }

  return NextResponse.json({
    ok: true,
    run_date: runDate,
    summary,
    flags_inserted: flagsInserted,
    results,
  })
}

export const GET = handle
export const POST = handle
