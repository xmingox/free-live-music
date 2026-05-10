/**
 * /api/maintenance/venue-health
 *
 * Runs weekly (Sunday 04:00 UTC) via Vercel Cron.
 * Computes a `music_score` integer for every venue and checks website health.
 *
 * Scoring:
 *   +30  any concert in last 90 days references this venue
 *   +20  any upcoming concert (date >= today) references this venue
 *   -30  venue_type is bar/restaurant/brewery/coffee_shop AND zero concerts in last 365 days
 *   +5   venue.music_schedule IS NOT NULL
 *
 * Website health (up to 500 venues per run, nulls first then oldest-checked):
 *   +10  HEAD returns 2xx or 3xx within 5s
 *   -20  HEAD returns 4xx or 5xx AND last_checked_at was already set (repeat failure)
 *        first failure: update last_checked_at only, no score penalty
 *
 * Writes a cron_runs record on completion.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Config ────────────────────────────────────────────────────────────────────

const VENUE_BATCH_SIZE      = 200
const WEBSITE_CHECK_LIMIT   = 500
const HEAD_TIMEOUT_MS       = 5000
const HEAD_CONCURRENCY      = 10
const HEAD_BATCH_DELAY_MS   = 200
const USER_AGENT            = 'freelivemusic-healthcheck/1.0'

const CASUAL_VENUE_TYPES = new Set(['bar', 'restaurant', 'brewery', 'coffee_shop'])

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

// ── Types ─────────────────────────────────────────────────────────────────────

interface Venue {
  id: string
  name: string
  venue_type: string | null
  website: string | null
  music_schedule: string | null
  last_checked_at: string | null
}

interface ConcertRef {
  venue_id: string | null
  venue: string | null
  date: string
}

// ── Website health check ──────────────────────────────────────────────────────

/** Returns the HTTP status of a HEAD request, or null on network error. */
async function headStatus(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(HEAD_TIMEOUT_MS),
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    })
    return res.status
  } catch {
    return null
  }
}

/** Process an array of async tasks in chunks of `size`, with an optional delay between chunks. */
async function batchSettled<T>(
  items: T[],
  size: number,
  delayMs: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size)
    await Promise.allSettled(chunk.map(fn))
    if (delayMs > 0 && i + size < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
}

// ── Score distribution buckets ────────────────────────────────────────────────

interface ScoreDist {
  high: number     // >= 40
  medium: number   // 20–39
  low: number      // 0–19
  negative: number // < 0
}

function bucket(dist: ScoreDist, score: number): void {
  if (score >= 40)      dist.high++
  else if (score >= 20) dist.medium++
  else if (score >= 0)  dist.low++
  else                  dist.negative++
}

// ── cron_runs helper ──────────────────────────────────────────────────────────

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
    console.error('[venue-health] cron_runs insert failed:', err)
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started_at = new Date().toISOString()
  const now        = new Date()
  const today      = now.toISOString().slice(0, 10)

  const ninetyDaysAgo  = new Date(now.getTime() - 90  * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const oneYearAgo     = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  try {
    // ── 1. Load all venues (ordered for website-check priority) ──────────────
    const { data: venues, error: venueErr } = await supabase
      .from('venues')
      .select('id, name, venue_type, website, music_schedule, last_checked_at')
      .order('last_checked_at', { ascending: true, nullsFirst: true })

    if (venueErr) throw venueErr
    if (!venues || venues.length === 0) {
      return NextResponse.json({ venues_processed: 0, websites_checked: 0 })
    }

    // ── 2. Load concert references (bulk, cast wide net: last 365 days + future) ──
    const { data: concerts, error: concertErr } = await supabase
      .from('concerts')
      .select('venue_id, venue, date')
      .gte('date', oneYearAgo)

    if (concertErr) throw concertErr
    const concertRows: ConcertRef[] = concerts ?? []

    // Build lookup sets keyed by venue_id and by lowercased venue name
    const venueIdRecent   = new Set<string>() // any concert in last 90 days
    const venueIdUpcoming = new Set<string>() // upcoming concerts
    const venueIdPastYear = new Set<string>() // any concert in last 365 days

    const nameRecent   = new Set<string>()
    const nameUpcoming = new Set<string>()
    const namePastYear = new Set<string>()

    for (const c of concertRows) {
      const vid  = c.venue_id ?? null
      const vnam = c.venue ? c.venue.toLowerCase().trim() : null

      const isRecent   = c.date >= ninetyDaysAgo && c.date <= today
      const isUpcoming = c.date >= today
      const isPastYear = true // all rows are already gte oneYearAgo

      if (vid) {
        if (isRecent)   venueIdRecent.add(vid)
        if (isUpcoming) venueIdUpcoming.add(vid)
        if (isPastYear) venueIdPastYear.add(vid)
      }
      if (vnam) {
        if (isRecent)   nameRecent.add(vnam)
        if (isUpcoming) nameUpcoming.add(vnam)
        if (isPastYear) namePastYear.add(vnam)
      }
    }

    // ── 3. Compute scores and collect website-check candidates ───────────────
    const scoreDist: ScoreDist = { high: 0, medium: 0, low: 0, negative: 0 }
    const websiteCheckVenues   = venues.slice(0, WEBSITE_CHECK_LIMIT)

    // Map venue → pending score delta from website check (applied after HEAD)
    const websiteScoreDelta = new Map<string, number>() // venue.id → delta

    let websites_checked = 0

    // ── 3a. Run website HEAD checks ──────────────────────────────────────────
    const websiteTargets = websiteCheckVenues.filter(v => v.website != null)

    await batchSettled(websiteTargets, HEAD_CONCURRENCY, HEAD_BATCH_DELAY_MS, async (venue) => {
      const url = venue.website!
      let delta = 0
      let checkedAt = now.toISOString()

      try {
        const status = await headStatus(url)
        websites_checked++

        if (status !== null) {
          if (status >= 200 && status < 400) {
            delta = 10
          } else if (status >= 400) {
            if (venue.last_checked_at !== null) {
              // Repeat failure — apply penalty
              delta = -20
            }
            // First failure: no penalty, just update timestamp
          }
        }
        // null status = network error; treat as first failure (no penalty unless repeated)
        // We still update last_checked_at to track the attempt
      } catch {
        // Per-venue safety net — should not reach here but guard anyway
      }

      websiteScoreDelta.set(venue.id, delta)

      // Update last_checked_at immediately (don't batch — each is independent)
      try {
        await supabase
          .from('venues')
          .update({ last_checked_at: checkedAt })
          .eq('id', venue.id)
      } catch (err) {
        console.error(`[venue-health] last_checked_at update failed for ${venue.id}:`, err)
      }
    })

    // ── 4. Compute final score per venue and batch-update ───────────────────
    let venues_processed = 0

    for (let i = 0; i < venues.length; i += VENUE_BATCH_SIZE) {
      const batch = venues.slice(i, i + VENUE_BATCH_SIZE)

      await Promise.allSettled(
        batch.map(async (venue) => {
          const vid  = venue.id
          const vnam = venue.name ? venue.name.toLowerCase().trim() : ''

          let score = 0

          // +30 if any concert in last 90 days
          if (venueIdRecent.has(vid) || nameRecent.has(vnam)) {
            score += 30
          }

          // +20 if any upcoming concert
          if (venueIdUpcoming.has(vid) || nameUpcoming.has(vnam)) {
            score += 20
          }

          // -30 if casual type AND zero concerts in last 365 days
          if (
            venue.venue_type && CASUAL_VENUE_TYPES.has(venue.venue_type) &&
            !venueIdPastYear.has(vid) && !namePastYear.has(vnam)
          ) {
            score -= 30
          }

          // +5 if has music schedule description
          if (venue.music_schedule !== null) {
            score += 5
          }

          // Apply website score delta (only for venues that were checked)
          const delta = websiteScoreDelta.get(vid)
          if (delta !== undefined) {
            score += delta
          }

          bucket(scoreDist, score)

          try {
            await supabase
              .from('venues')
              .update({ music_score: score })
              .eq('id', vid)
            venues_processed++
          } catch (err) {
            console.error(`[venue-health] score update failed for ${vid}:`, err)
          }
        }),
      )
    }

    // ── 5. Write cron_runs record ────────────────────────────────────────────
    const finished_at = new Date().toISOString()
    const stats = {
      venues_processed,
      websites_checked,
      score_distribution: scoreDist,
    }

    await writeCronRun({
      name: 'venue-health',
      started_at,
      finished_at,
      success: true,
      stats_json: stats,
      error_message: null,
    })

    console.log('[venue-health]', stats)
    return NextResponse.json(stats)
  } catch (err) {
    const finished_at = new Date().toISOString()
    const msg = String(err)
    console.error('[venue-health] fatal error:', err)

    await writeCronRun({
      name: 'venue-health',
      started_at,
      finished_at,
      success: false,
      stats_json: {},
      error_message: msg,
    })

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export const GET  = handle
export const POST = handle
export const dynamic = 'force-dynamic'
