/**
 * SEO check library — pure functions used by /api/maintenance/seo-daily.
 *
 * Each check returns a CheckResult. The orchestrator decides whether a result
 * triggers an alert, becomes a qa_flag, or just gets recorded in the
 * findings_json blob on seo_daily_runs.
 *
 * Conventions:
 *   - 'pass'  → fully healthy, no action
 *   - 'warn'  → soft anomaly, surfaced in digest but no email alert
 *   - 'fail'  → hard problem worth a Resend alert
 *   - 'skip'  → check could not run (missing env var, upstream API outage)
 */

import { google, searchconsole_v1 } from 'googleapis'
import { getUsToday } from './timezone'

const HOST = 'www.freelivemusic.co'
const ORIGIN = `https://${HOST}`

export type Status = 'pass' | 'warn' | 'fail' | 'skip'

export interface CheckResult {
  name: string
  status: Status
  message: string
  details?: Record<string, unknown>
  flags?: SeoFlag[]
}

export interface SeoFlag {
  flag_type:
    | 'seo_noindex_in_sitemap'
    | 'seo_redirect_chain'
    | 'seo_jsonld_invalid'
    | 'seo_canonical_mismatch'
    | 'seo_broken_sitemap_url'
  source_url: string          // the URL that failed
  field_name?: string         // e.g. 'performer', 'canonical'
  stored_value?: string
  fetched_value?: string
}

// ── Small fetch helpers ──────────────────────────────────────────────────────

const UA = 'FLM-SEO-Daily/1.0 (+https://www.freelivemusic.co)'

async function fetchText(
  url: string,
  init: RequestInit = {},
  timeoutMs = 10_000,
): Promise<{ status: number; text: string; headers: Headers; finalUrl: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      headers: { 'User-Agent': UA, ...(init.headers ?? {}) },
      signal: controller.signal,
    })
    const text = res.body ? await res.text() : ''
    return { status: res.status, text, headers: res.headers, finalUrl: res.url }
  } finally {
    clearTimeout(timer)
  }
}

async function fetchStatusOnly(
  url: string,
  init: RequestInit = {},
  timeoutMs = 10_000,
): Promise<{ status: number; location: string | null }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      redirect: 'manual',
      headers: { 'User-Agent': UA, ...(init.headers ?? {}) },
      signal: controller.signal,
    })
    return { status: res.status, location: res.headers.get('location') }
  } finally {
    clearTimeout(timer)
  }
}

// ── Check 1 — sitemap HTTP + XML validity ────────────────────────────────────

export async function checkSitemap(): Promise<CheckResult & { urls: string[] }> {
  try {
    const res = await fetchText(`${ORIGIN}/sitemap.xml`, {}, 30_000)
    if (res.status !== 200) {
      return {
        name: 'sitemap_fetch',
        status: 'fail',
        message: `Sitemap returned HTTP ${res.status}`,
        urls: [],
      }
    }
    const urls = [...res.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    if (urls.length === 0) {
      return {
        name: 'sitemap_fetch',
        status: 'fail',
        message: 'Sitemap parsed but contained zero <loc> entries',
        urls: [],
      }
    }
    return {
      name: 'sitemap_fetch',
      status: 'pass',
      message: `Sitemap OK (${urls.length} URLs)`,
      details: { url_count: urls.length },
      urls,
    }
  } catch (err) {
    return {
      name: 'sitemap_fetch',
      status: 'fail',
      message: `Sitemap fetch threw: ${(err as Error).message}`,
      urls: [],
    }
  }
}

// ── Check 2 — sitemap URL count drift vs DB ──────────────────────────────────

export interface ExpectedCounts {
  concerts: number
  venues_eligible: number
  cities_eligible: number
  artists_eligible: number
  states_active: number
}

export function checkSitemapDrift(
  urlCount: number,
  expected: ExpectedCounts,
  yesterdayCount: number | null,
): CheckResult {
  const expectedTotal =
    expected.concerts +
    expected.venues_eligible +
    expected.cities_eligible +
    expected.artists_eligible +
    expected.states_active +
    20 // ≈ overhead (homepage + traditions + guides + tonight/weekend/this-week)

  const ratioVsExpected = urlCount / Math.max(expectedTotal, 1)
  const ratioVsYesterday =
    yesterdayCount && yesterdayCount > 0 ? urlCount / yesterdayCount : 1

  const details = {
    url_count: urlCount,
    expected_total: expectedTotal,
    yesterday_count: yesterdayCount,
    ratio_vs_expected: Number(ratioVsExpected.toFixed(3)),
    ratio_vs_yesterday: Number(ratioVsYesterday.toFixed(3)),
    ...expected,
  }

  // Hard fail if sitemap is empty or wildly out of line
  if (urlCount === 0) {
    return { name: 'sitemap_drift', status: 'fail', message: 'Sitemap is empty', details }
  }
  if (Math.abs(1 - ratioVsExpected) > 0.5) {
    return {
      name: 'sitemap_drift',
      status: 'fail',
      message: `Sitemap has ${urlCount} URLs but expected ≈${expectedTotal} (drift > 50%)`,
      details,
    }
  }
  if (yesterdayCount && Math.abs(1 - ratioVsYesterday) > 0.1) {
    return {
      name: 'sitemap_drift',
      status: 'fail',
      message: `Sitemap URL count changed >10% day-over-day (${yesterdayCount} → ${urlCount})`,
      details,
    }
  }
  if (Math.abs(1 - ratioVsExpected) > 0.1 || (yesterdayCount && Math.abs(1 - ratioVsYesterday) > 0.05)) {
    return {
      name: 'sitemap_drift',
      status: 'warn',
      message: `Sitemap drift exceeds warn threshold (vs expected: ${(ratioVsExpected * 100).toFixed(1)}%, vs yesterday: ${(ratioVsYesterday * 100).toFixed(1)}%)`,
      details,
    }
  }
  return { name: 'sitemap_drift', status: 'pass', message: 'Sitemap URL count within tolerance', details }
}

// ── Check 3 — sitemap sample liveness ────────────────────────────────────────

export async function checkSitemapSampleLiveness(
  urls: string[],
  sampleSize = 25,
): Promise<CheckResult> {
  const sample = pickRandomSample(urls, sampleSize)
  const flags: SeoFlag[] = []
  const failures: { url: string; reason: string }[] = []

  await Promise.all(
    sample.map(async (url) => {
      try {
        const res = await fetchText(url, {}, 15_000)
        if (res.status !== 200) {
          failures.push({ url, reason: `HTTP ${res.status}` })
          flags.push({ flag_type: 'seo_broken_sitemap_url', source_url: url, fetched_value: `HTTP ${res.status}` })
          return
        }
        const noindex = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(res.text)
        if (noindex) {
          failures.push({ url, reason: 'noindex meta on sitemap URL' })
          flags.push({ flag_type: 'seo_noindex_in_sitemap', source_url: url, fetched_value: 'noindex' })
        }
      } catch (err) {
        failures.push({ url, reason: (err as Error).message })
        flags.push({ flag_type: 'seo_broken_sitemap_url', source_url: url, fetched_value: (err as Error).message })
      }
    }),
  )

  const status: Status = failures.length === 0 ? 'pass' : failures.length <= 2 ? 'warn' : 'fail'
  return {
    name: 'sitemap_sample_liveness',
    status,
    message:
      failures.length === 0
        ? `All ${sample.length} sampled URLs returned 200 with no noindex`
        : `${failures.length}/${sample.length} sampled URLs failed`,
    details: { sample_size: sample.length, failures: failures.slice(0, 20) },
    flags,
  }
}

// ── Check 4 — robots.txt sanity ──────────────────────────────────────────────

export async function checkRobotsTxt(): Promise<CheckResult> {
  try {
    const res = await fetchText(`${ORIGIN}/robots.txt`, {}, 10_000)
    if (res.status !== 200) {
      return { name: 'robots_txt', status: 'fail', message: `robots.txt returned HTTP ${res.status}` }
    }
    const body = res.text
    const checks = {
      has_sitemap: /^Sitemap:\s+https?:\/\//im.test(body),
      blocks_api: /Disallow:\s*\/api/i.test(body),
      allows_concert: !/Disallow:\s*\/concert\b/i.test(body),
      allows_venues: !/Disallow:\s*\/venues\b/i.test(body),
      allows_concerts_list: !/Disallow:\s*\/concerts\b/i.test(body),
    }
    const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k)
    if (failed.length > 0) {
      return {
        name: 'robots_txt',
        status: 'fail',
        message: `robots.txt failed checks: ${failed.join(', ')}`,
        details: checks,
      }
    }
    return { name: 'robots_txt', status: 'pass', message: 'robots.txt OK', details: checks }
  } catch (err) {
    return { name: 'robots_txt', status: 'fail', message: `robots.txt fetch threw: ${(err as Error).message}` }
  }
}

// ── Check 5 — redirect-chain audit on previous_slug URLs ────────────────────

export async function checkRedirectChains(
  previousSlugs: string[],
  sampleSize = 20,
): Promise<CheckResult> {
  const sample = pickRandomSample(previousSlugs, sampleSize)
  const flags: SeoFlag[] = []
  const chains: { url: string; hops: number; final_status: number }[] = []

  await Promise.all(
    sample.map(async (slug) => {
      const startUrl = `${ORIGIN}/concert/${slug}`
      let hops = 0
      let currentUrl = startUrl
      let lastStatus = 0
      try {
        for (let i = 0; i < 5; i++) {
          const res = await fetchStatusOnly(currentUrl, {}, 8_000)
          lastStatus = res.status
          if (res.status >= 300 && res.status < 400 && res.location) {
            hops++
            currentUrl = res.location.startsWith('http') ? res.location : `${ORIGIN}${res.location}`
            continue
          }
          break
        }
        // 410 is intentional for past-event slugs (Vercel-level Gone response —
        // stronger deindex signal than 200+noindex). Treat as acceptable.
        const acceptableFinal = lastStatus === 200 || lastStatus === 410
        if (hops > 1 || !acceptableFinal) {
          chains.push({ url: startUrl, hops, final_status: lastStatus })
          flags.push({
            flag_type: 'seo_redirect_chain',
            source_url: startUrl,
            fetched_value: `hops=${hops}, final=${lastStatus}`,
          })
        }
      } catch {
        chains.push({ url: startUrl, hops, final_status: lastStatus })
      }
    }),
  )

  const status: Status = chains.length === 0 ? 'pass' : chains.length <= 1 ? 'warn' : 'fail'
  return {
    name: 'redirect_chains',
    status,
    message:
      chains.length === 0
        ? `All ${sample.length} previous_slug URLs resolve in 1 hop`
        : `${chains.length}/${sample.length} previous_slug URLs have chains or failures`,
    details: { sample_size: sample.length, chains },
    flags,
  }
}

// ── Check 6 — canonical / noindex consistency ────────────────────────────────

export async function checkCanonicalConsistency(
  urls: string[],
  sampleSize = 25,
): Promise<CheckResult> {
  const sample = pickRandomSample(urls, sampleSize)
  const flags: SeoFlag[] = []
  const mismatches: { url: string; canonical: string | null; noindex: boolean }[] = []

  await Promise.all(
    sample.map(async (url) => {
      try {
        const res = await fetchText(url, {}, 12_000)
        if (res.status !== 200) return
        const canonicalMatch = res.text.match(
          /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i,
        )
        const canonical = canonicalMatch?.[1] ?? null
        const noindex = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(res.text)
        // Normalize for comparison (strip trailing slash; trailingSlash:false enforced).
        const norm = (u: string) => u.replace(/\/$/, '')
        // If the fetch followed a redirect, the canonical legitimately points at
        // the new final URL — compare against finalUrl, not the requested URL.
        // The request URL being in the sitemap while pointing elsewhere is a
        // separate "stale sitemap" concern handled by sitemap_drift / liveness.
        const referenceUrl = res.finalUrl || url
        if (noindex || (canonical && norm(canonical) !== norm(referenceUrl))) {
          mismatches.push({ url, canonical, noindex })
          if (noindex) {
            flags.push({ flag_type: 'seo_noindex_in_sitemap', source_url: url, fetched_value: 'noindex' })
          }
          if (canonical && norm(canonical) !== norm(referenceUrl)) {
            flags.push({
              flag_type: 'seo_canonical_mismatch',
              source_url: url,
              stored_value: referenceUrl,
              fetched_value: canonical,
              field_name: 'canonical',
            })
          }
        }
      } catch {
        // ignore individual failures — liveness check above covers them
      }
    }),
  )

  const status: Status = mismatches.length === 0 ? 'pass' : mismatches.length <= 2 ? 'warn' : 'fail'
  return {
    name: 'canonical_consistency',
    status,
    message:
      mismatches.length === 0
        ? `All ${sample.length} sampled pages have matching canonical and no noindex`
        : `${mismatches.length}/${sample.length} pages have canonical or noindex issues`,
    details: { sample_size: sample.length, mismatches },
    flags,
  }
}

// ── Check 7 — JSON-LD field validation ───────────────────────────────────────

export async function checkJsonLd(urls: string[], sampleSize = 25): Promise<CheckResult> {
  const sample = pickRandomSample(urls, sampleSize)
  const flags: SeoFlag[] = []
  const failures: { url: string; reason: string }[] = []
  const today = getUsToday()

  await Promise.all(
    sample.map(async (url) => {
      try {
        const res = await fetchText(url, {}, 12_000)
        if (res.status !== 200) return
        const blocks = [
          ...res.text.matchAll(
            /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
          ),
        ].map((m) => m[1].trim())
        if (blocks.length === 0) return // pages without JSON-LD (e.g. homepage) are fine
        let hasMusicEvent = false
        for (const block of blocks) {
          let parsed: unknown
          try {
            parsed = JSON.parse(block)
          } catch (err) {
            failures.push({ url, reason: `invalid JSON-LD: ${(err as Error).message.slice(0, 80)}` })
            flags.push({
              flag_type: 'seo_jsonld_invalid',
              source_url: url,
              fetched_value: 'parse error',
            })
            continue
          }
          const arr = Array.isArray(parsed) ? parsed : [parsed]
          for (const node of arr) {
            const type = (node as Record<string, unknown>)?.['@type']
            if (type === 'MusicEvent') {
              hasMusicEvent = true
              const n = node as Record<string, unknown>
              const performer = n.performer as Record<string, unknown> | undefined
              const performerName = (performer?.name as string | undefined) ?? ''
              const startDate = (n.startDate as string | undefined) ?? ''
              const locationName = ((n.location as Record<string, unknown> | undefined)?.name as string | undefined) ?? ''
              if (!performerName) {
                failures.push({ url, reason: 'MusicEvent.performer.name missing' })
                flags.push({ flag_type: 'seo_jsonld_invalid', source_url: url, field_name: 'performer.name', fetched_value: 'empty' })
              }
              if (!locationName) {
                failures.push({ url, reason: 'MusicEvent.location.name missing' })
                flags.push({ flag_type: 'seo_jsonld_invalid', source_url: url, field_name: 'location.name', fetched_value: 'empty' })
              }
              if (!startDate || startDate.split('T')[0] < today) {
                failures.push({ url, reason: `MusicEvent.startDate is past or empty (${startDate})` })
                flags.push({ flag_type: 'seo_jsonld_invalid', source_url: url, field_name: 'startDate', fetched_value: startDate || 'empty' })
              }
            }
          }
        }
        // If the URL is /concert/* but we found no MusicEvent block, that's a regression
        if (url.includes('/concert/') && !hasMusicEvent) {
          failures.push({ url, reason: 'concert page missing MusicEvent JSON-LD' })
          flags.push({ flag_type: 'seo_jsonld_invalid', source_url: url, fetched_value: 'no MusicEvent block' })
        }
      } catch {
        // network failure — covered by liveness check
      }
    }),
  )

  const status: Status = failures.length === 0 ? 'pass' : failures.length <= 2 ? 'warn' : 'fail'
  return {
    name: 'jsonld_validation',
    status,
    message:
      failures.length === 0
        ? `All ${sample.length} sampled pages have valid JSON-LD`
        : `${failures.length} JSON-LD failures across ${sample.length} sampled pages`,
    details: { sample_size: sample.length, failures: failures.slice(0, 20) },
    flags,
  }
}

// ── Check 8 — GSC daily delta ────────────────────────────────────────────────

export interface DailyMetric {
  date: string
  impressions: number
  clicks: number
}

export function checkGscDelta(rolling: DailyMetric[]): CheckResult {
  if (rolling.length < 2) {
    return {
      name: 'gsc_daily_delta',
      status: 'skip',
      message: 'Not enough GSC history to compute delta',
      details: { rows: rolling.length },
    }
  }
  const sorted = [...rolling].sort((a, b) => a.date.localeCompare(b.date))
  const yesterday = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2]
  const trailing7 = sorted.slice(-8, -1) // 7 days excluding yesterday
  const avg7Imp =
    trailing7.length > 0
      ? trailing7.reduce((s, r) => s + r.impressions, 0) / trailing7.length
      : 0
  const avg7Clicks =
    trailing7.length > 0 ? trailing7.reduce((s, r) => s + r.clicks, 0) / trailing7.length : 0

  const impDoD = prev.impressions > 0 ? (yesterday.impressions - prev.impressions) / prev.impressions : 0
  const impVs7 = avg7Imp > 0 ? (yesterday.impressions - avg7Imp) / avg7Imp : 0
  const clicksDoD = prev.clicks > 0 ? (yesterday.clicks - prev.clicks) / prev.clicks : 0
  const clicksVs7 = avg7Clicks > 0 ? (yesterday.clicks - avg7Clicks) / avg7Clicks : 0

  const details = {
    yesterday,
    prev,
    avg7_impressions: Math.round(avg7Imp),
    avg7_clicks: Math.round(avg7Clicks),
    impressions_dod_pct: Number((impDoD * 100).toFixed(1)),
    impressions_vs_7d_pct: Number((impVs7 * 100).toFixed(1)),
    clicks_dod_pct: Number((clicksDoD * 100).toFixed(1)),
    clicks_vs_7d_pct: Number((clicksVs7 * 100).toFixed(1)),
  }

  if (impDoD <= -0.25 || impVs7 <= -0.4) {
    return {
      name: 'gsc_daily_delta',
      status: 'fail',
      message: `GSC impressions dropped sharply (DoD: ${(impDoD * 100).toFixed(1)}%, vs 7d: ${(impVs7 * 100).toFixed(1)}%)`,
      details,
    }
  }
  if (impDoD <= -0.1 || impVs7 <= -0.2) {
    return {
      name: 'gsc_daily_delta',
      status: 'warn',
      message: `GSC impressions softer than usual (DoD: ${(impDoD * 100).toFixed(1)}%, vs 7d: ${(impVs7 * 100).toFixed(1)}%)`,
      details,
    }
  }
  return {
    name: 'gsc_daily_delta',
    status: 'pass',
    message: `GSC impressions stable (DoD: ${(impDoD * 100).toFixed(1)}%, vs 7d: ${(impVs7 * 100).toFixed(1)}%)`,
    details,
  }
}

// ── Check 9 — GSC URL Inspection sample ──────────────────────────────────────

export async function checkGscUrlInspection(
  sampleUrls: string[],
): Promise<CheckResult> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  const siteUrl = process.env.GSC_SITE_URL

  if (!clientId || !clientSecret || !refreshToken || !siteUrl) {
    return { name: 'gsc_url_inspection', status: 'skip', message: 'GSC env vars not set' }
  }
  if (sampleUrls.length === 0) {
    return { name: 'gsc_url_inspection', status: 'skip', message: 'No URLs to inspect' }
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret)
  oauth2.setCredentials({ refresh_token: refreshToken })
  const gsc = google.searchconsole({ version: 'v1', auth: oauth2 })

  const issues: { url: string; coverageState: string; verdict: string; canonical?: string }[] = []
  const results: { url: string; coverageState: string; verdict: string }[] = []

  // GSC URL Inspection: 600 QPM rate limit per project; sequential is safer.
  for (const url of sampleUrls) {
    try {
      const resp = (await gsc.urlInspection.index.inspect({
        requestBody: { inspectionUrl: url, siteUrl },
      })) as { data: searchconsole_v1.Schema$InspectUrlIndexResponse }
      const idx = resp.data.inspectionResult?.indexStatusResult
      const coverageState = idx?.coverageState ?? 'unknown'
      const verdict = idx?.verdict ?? 'unknown'
      const userCanonical = idx?.userCanonical ?? undefined
      const googleCanonical = idx?.googleCanonical ?? undefined
      results.push({ url, coverageState, verdict })
      const isProblem =
        verdict === 'FAIL' ||
        (coverageState && /URL is unknown to Google|Discovered.*not indexed/i.test(coverageState))
      const canonicalMismatch =
        userCanonical && googleCanonical && userCanonical !== googleCanonical
      if (isProblem || canonicalMismatch) {
        issues.push({ url, coverageState, verdict, canonical: googleCanonical })
      }
    } catch (err) {
      results.push({ url, coverageState: 'inspection_error', verdict: (err as Error).message.slice(0, 80) })
    }
  }

  const status: Status = issues.length === 0 ? 'pass' : issues.length <= 2 ? 'warn' : 'fail'
  return {
    name: 'gsc_url_inspection',
    status,
    message:
      issues.length === 0
        ? `All ${results.length} inspected URLs look healthy in Google's index`
        : `${issues.length}/${results.length} URLs flagged by GSC inspection`,
    details: { results, issues },
  }
}

// ── Check 11 — CrUX History (Core Web Vitals field data) ────────────────────

export async function checkCrux(): Promise<CheckResult> {
  const apiKey = process.env.PSI_API_KEY ?? process.env.GOOGLE_API_KEY
  // CrUX History accepts unauthenticated calls but with much tighter quota; prefer key
  const url = apiKey
    ? `https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord?key=${apiKey}`
    : 'https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord'

  const body = {
    origin: ORIGIN,
    formFactor: 'PHONE',
    metrics: ['largest_contentful_paint', 'interaction_to_next_paint', 'cumulative_layout_shift'],
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      // 404 means CrUX has no data for the origin — not a failure
      if (res.status === 404) {
        return { name: 'crux_field_vitals', status: 'skip', message: 'CrUX has no field data for origin yet', details: { http: 404 } }
      }
      return { name: 'crux_field_vitals', status: 'warn', message: `CrUX returned ${res.status}: ${text.slice(0, 120)}` }
    }
    const json = (await res.json()) as {
      record?: {
        metrics?: Record<string, { percentilesTimeseries?: { p75s?: (number | null)[] } }>
        collectionPeriods?: { firstDate: { year: number; month: number; day: number } }[]
      }
    }
    const metrics = json.record?.metrics ?? {}
    const lcpSeries = metrics.largest_contentful_paint?.percentilesTimeseries?.p75s ?? []
    const inpSeries = metrics.interaction_to_next_paint?.percentilesTimeseries?.p75s ?? []
    const clsSeries = metrics.cumulative_layout_shift?.percentilesTimeseries?.p75s ?? []
    const last = <T>(arr: T[]) => (arr.length > 0 ? arr[arr.length - 1] : null)
    const lcp = last(lcpSeries) as number | null
    const inp = last(inpSeries) as number | null
    const cls = last(clsSeries) as number | null

    const details = { p75_lcp_ms: lcp, p75_inp_ms: inp, p75_cls: cls, periods: lcpSeries.length }

    // Google thresholds: LCP ≤ 2500ms good, INP ≤ 200ms good, CLS ≤ 0.1 good
    const breaches: string[] = []
    if (lcp != null && lcp > 2500) breaches.push(`LCP=${lcp}ms`)
    if (inp != null && inp > 200) breaches.push(`INP=${inp}ms`)
    if (cls != null && cls > 0.1) breaches.push(`CLS=${cls}`)
    if (breaches.length > 0) {
      return {
        name: 'crux_field_vitals',
        status: breaches.length >= 2 ? 'fail' : 'warn',
        message: `Core Web Vitals out of "good" range: ${breaches.join(', ')}`,
        details,
      }
    }
    return { name: 'crux_field_vitals', status: 'pass', message: 'Core Web Vitals all in "good" range', details }
  } catch (err) {
    return { name: 'crux_field_vitals', status: 'warn', message: `CrUX fetch threw: ${(err as Error).message}` }
  }
}

// ── Check 12 — past-event noindex regression ─────────────────────────────────

export async function checkPastEventNoindex(slugs: string[]): Promise<CheckResult> {
  if (slugs.length === 0) {
    return { name: 'past_event_noindex', status: 'skip', message: 'No archived events available to spot-check' }
  }
  const failures: { url: string; reason: string }[] = []
  await Promise.all(
    slugs.map(async (slug) => {
      const url = `${ORIGIN}/concert/${slug}`
      try {
        const res = await fetchText(url, {}, 10_000)
        if (res.status !== 200) return
        const hasNoindex = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(res.text)
        if (!hasNoindex) failures.push({ url, reason: 'past event missing noindex meta' })
      } catch {
        // ignore
      }
    }),
  )
  return failures.length === 0
    ? { name: 'past_event_noindex', status: 'pass', message: `All ${slugs.length} sampled past events have noindex meta` }
    : {
        name: 'past_event_noindex',
        status: 'fail',
        message: `${failures.length}/${slugs.length} past events missing noindex meta`,
        details: { failures },
      }
}

// ── Check 14 — sitemap split recommendation ──────────────────────────────────

export function checkSitemapSplit(urlCount: number): CheckResult {
  if (urlCount > 30_000) {
    return {
      name: 'sitemap_split',
      status: 'warn',
      message: `Sitemap has ${urlCount} URLs — consider splitting into a sitemap index (Google honors 50k URL / 50MB per file)`,
      details: { url_count: urlCount, threshold: 30_000 },
    }
  }
  return {
    name: 'sitemap_split',
    status: 'pass',
    message: `Sitemap size OK (${urlCount} URLs, threshold 30k)`,
    details: { url_count: urlCount, threshold: 30_000 },
  }
}

// ── Utilities ────────────────────────────────────────────────────────────────

export function pickRandomSample<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return [...arr]
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

export function summarizeFindings(results: CheckResult[]): {
  pass: number
  warn: number
  fail: number
  skip: number
  alert_count: number
} {
  let pass = 0, warn = 0, fail = 0, skip = 0
  for (const r of results) {
    if (r.status === 'pass') pass++
    else if (r.status === 'warn') warn++
    else if (r.status === 'fail') fail++
    else if (r.status === 'skip') skip++
  }
  return { pass, warn, fail, skip, alert_count: fail }
}
