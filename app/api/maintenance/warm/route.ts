/**
 * /api/maintenance/warm
 *
 * Runs daily at 06:30 UTC (after the 06:00 import cron) via Vercel Cron.
 * Pre-populates Vercel's ISR cache by fetching the top city concert and venue
 * pages before real users hit them.
 *
 * Fetches /concerts/{slug} and /venues/{slug} for the 30 highest-traffic metros.
 * Batches 10 requests at a time with Promise.allSettled.
 *
 * Writes a cron_runs record on completion.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Config ────────────────────────────────────────────────────────────────────

const SITE_ORIGIN    = 'https://www.freelivemusic.co'
const FETCH_TIMEOUT  = 15000
const BATCH_SIZE     = 10

/**
 * Top 30 city slugs by traffic. Hardcoded to avoid importing metros.json.
 * Order: NYC, LA, CHI, SF, AUS, SEA, DC, BOS, DEN, ATL,
 *        NSH, PDX, MIA, HOU, PHX, DAL, PHI, MIN, DET, CLE,
 *        STL, PIT, BAL, SAN (San Diego), ORL, Tampa, LV, SLC, IND, MIL
 */
const TOP_CITY_SLUGS: readonly string[] = [
  'new-york',
  'los-angeles',
  'chicago',
  'san-francisco',
  'austin',
  'seattle',
  'washington',
  'boston',
  'denver',
  'atlanta',
  'nashville',
  'portland',
  'miami',
  'houston',
  'phoenix',
  'dallas',
  'philadelphia',
  'minneapolis',
  'detroit',
  'cleveland',
  'st-louis',
  'pittsburgh',
  'baltimore',
  'san-diego',
  'orlando',
  'tampa',
  'las-vegas',
  'salt-lake-city',
  'indianapolis',
  'milwaukee',
]

// ── Auth ──────────────────────────────────────────────────────────────────────

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

// ── Supabase ──────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function writeCronRun(record: {
  name: string
  started_at: string
  finished_at: string
  success: boolean
  stats_json: object
  error_message: string | null
}): Promise<void> {
  try {
    await supabase.from('cron_runs').insert(record)
  } catch (err) {
    console.error('[isr-warm] cron_runs insert failed:', err)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build the full list of URLs to warm: /concerts/{slug} and /venues/{slug}. */
function buildUrls(): string[] {
  const urls: string[] = []
  for (const slug of TOP_CITY_SLUGS) {
    urls.push(`${SITE_ORIGIN}/concerts/${slug}`)
    urls.push(`${SITE_ORIGIN}/venues/${slug}`)
  }
  return urls
}

/** Fetch a URL to trigger ISR render (response body not needed). */
async function warmUrl(url: string): Promise<boolean> {
  try {
    await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    })
    return true
  } catch {
    return false
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started_at = new Date().toISOString()
  const t0         = Date.now()

  const urls   = buildUrls()
  let warmed   = 0
  let errors   = 0

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const chunk   = urls.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(chunk.map(warmUrl))

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        warmed++
      } else {
        errors++
      }
    }
  }

  const duration_ms  = Date.now() - t0
  const finished_at  = new Date().toISOString()
  const stats        = { warmed, errors }

  await writeCronRun({
    name: 'isr-warm',
    started_at,
    finished_at,
    success: errors === 0,
    stats_json: stats,
    error_message: errors > 0 ? `${errors} URL(s) failed to warm` : null,
  })

  console.log('[isr-warm]', { warmed, errors, duration_ms })
  return NextResponse.json({ warmed, errors, duration_ms })
}

export const GET  = handle
export const POST = handle
export const dynamic = 'force-dynamic'
