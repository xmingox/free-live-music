// lib/runway.ts
//
// "Runway" = how much upcoming free-music supply each city has on the books.
// The site's structural risk is the autumn supply cliff (events are dated and
// expire; ~50 of ~55 importers are static summer arrays). This module measures
// events-per-city over the next 90 days and the 60–90-day tail, and compares
// the current snapshot to the previous run so we get alerted BEFORE a city goes
// dark — not after.
//
// Pure computation over a Supabase client; the cron route wires persistence,
// cron_runs mirroring, and alerting. Reads scale with the weekly cron, not traffic.

import type { SupabaseClient } from '@supabase/supabase-js'
import { addDays } from './timezone'
import { getMetroByCode, cityCodeToSlug } from './city-slugs'

/** A city that was previously covered (>= this many events in 90d) is "covered". */
export const COVERED_MIN = 3
/** Week-over-week site-wide drop that trips an alert. */
export const WOW_DROP_PCT = 0.2
/** Horizon for the primary runway window. */
export const RUNWAY_DAYS = 90

export interface RunwayCity {
  code: string
  cityName: string
  slug: string
  c90: number // events in the next 90 days
  c60_90: number // events in the 60–90 day tail (the leading edge of the cliff)
}

export interface RunwayTotals {
  events_90d: number
  cities_90d: number // cities with >= 1 event in 90d
  cities_covered: number // cities with >= COVERED_MIN events in 90d
  events_60_90d: number
  cities_60_90d: number
}

export interface RunwayFinding {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
}

export interface RunwaySnapshot {
  run_date: string
  totals: RunwayTotals
  by_city: Record<string, { c90: number; c60_90: number }>
  cities: RunwayCity[]
}

/** Build the current runway snapshot from the concerts table. */
export async function computeRunway(
  supabase: SupabaseClient,
  today: string,
): Promise<RunwaySnapshot> {
  const horizon = addDays(today, RUNWAY_DAYS)
  const tailStart = addDays(today, 60)

  const rows: { city: string; date: string }[] = []
  const pageSize = 1000
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('concerts')
      .select('city, date')
      .eq('is_verified', true)
      .eq('is_tbd', false)
      .eq('is_cancelled', false)
      .gte('date', today)
      .lte('date', horizon)
      .order('id', { ascending: true }) // stable sort so range pagination can't skip/dup rows
      .range(offset, offset + pageSize - 1)
    if (error || !data?.length) break
    rows.push(...(data as { city: string; date: string }[]))
    if (data.length < pageSize) break
    offset += pageSize
  }

  const buckets = new Map<string, { c90: number; c60_90: number }>()
  for (const r of rows) {
    if (!r.city) continue
    const b = buckets.get(r.city) ?? { c90: 0, c60_90: 0 }
    b.c90 += 1
    if (r.date >= tailStart) b.c60_90 += 1
    buckets.set(r.city, b)
  }

  const cities: RunwayCity[] = [...buckets.entries()]
    .map(([code, b]) => {
      const metro = getMetroByCode(code)
      return {
        code,
        cityName: metro?.city ?? code,
        slug: cityCodeToSlug[code] ?? code.toLowerCase(),
        c90: b.c90,
        c60_90: b.c60_90,
      }
    })
    .sort((a, b) => b.c90 - a.c90)

  const totals: RunwayTotals = {
    events_90d: rows.length,
    cities_90d: cities.filter((c) => c.c90 > 0).length,
    cities_covered: cities.filter((c) => c.c90 >= COVERED_MIN).length,
    events_60_90d: cities.reduce((n, c) => n + c.c60_90, 0),
    cities_60_90d: cities.filter((c) => c.c60_90 > 0).length,
  }

  const by_city: Record<string, { c90: number; c60_90: number }> = {}
  for (const c of cities) by_city[c.code] = { c90: c.c90, c60_90: c.c60_90 }

  return { run_date: today, totals, by_city, cities }
}

export interface PrevRunway {
  totals?: Partial<RunwayTotals>
  by_city?: Record<string, { c90: number; c60_90: number }>
}

/**
 * Compare the current snapshot to the previous run and derive findings/alerts.
 * Alerts (status 'fail'):
 *  - any city that was covered (prev c90 >= COVERED_MIN) and has now fallen below it
 *  - site-wide 90-day supply dropped more than WOW_DROP_PCT week-over-week
 */
export function diffRunway(
  current: RunwaySnapshot,
  prev: PrevRunway | null,
): { findings: RunwayFinding[]; cliffCities: string[] } {
  const findings: RunwayFinding[] = []
  const cliffCities: string[] = []

  // Per-city cliff detection (only meaningful with a prior run)
  if (prev?.by_city) {
    for (const [code, prevBucket] of Object.entries(prev.by_city)) {
      const nowC90 = current.by_city[code]?.c90 ?? 0
      if ((prevBucket.c90 ?? 0) >= COVERED_MIN && nowC90 < COVERED_MIN) {
        const metro = getMetroByCode(code)
        cliffCities.push(`${metro?.city ?? code} (${prevBucket.c90}→${nowC90})`)
      }
    }
  }

  if (cliffCities.length > 0) {
    findings.push({
      name: 'city_cliff',
      status: 'fail',
      message: `${cliffCities.length} covered cit${cliffCities.length !== 1 ? 'ies' : 'y'} fell below ${COVERED_MIN} events in ${RUNWAY_DAYS}d: ${cliffCities.slice(0, 12).join(', ')}${cliffCities.length > 12 ? ', …' : ''}`,
    })
  } else if (prev?.by_city) {
    findings.push({ name: 'city_cliff', status: 'pass', message: `No covered city dropped below ${COVERED_MIN} events in ${RUNWAY_DAYS}d.` })
  }

  // Site-wide week-over-week drop
  const prevTotal = prev?.totals?.events_90d
  if (typeof prevTotal === 'number' && prevTotal > 0) {
    const dropPct = (prevTotal - current.totals.events_90d) / prevTotal
    if (dropPct > WOW_DROP_PCT) {
      findings.push({
        name: 'sitewide_drop',
        status: 'fail',
        message: `90-day supply dropped ${(dropPct * 100).toFixed(0)}% WoW (${prevTotal} → ${current.totals.events_90d} events).`,
      })
    } else {
      findings.push({
        name: 'sitewide_drop',
        status: 'pass',
        message: `90-day supply ${current.totals.events_90d} events (prev ${prevTotal}, ${(dropPct * 100).toFixed(0)}% change).`,
      })
    }
  }

  // 60–90d tail = the leading edge of the cliff. Warn only when it SHRINKS
  // meaningfully vs the prior run (a fixed absolute floor would warn on every
  // run — pure noise); otherwise report it as an informational pass.
  const prevTail = prev?.totals?.cities_60_90d
  if (typeof prevTail === 'number' && prevTail > 0) {
    const drop = prevTail - current.totals.cities_60_90d
    const dropPct = drop / prevTail
    if (drop >= 3 && dropPct > 0.15) {
      findings.push({
        name: 'tail_thin',
        status: 'warn',
        message: `60–90d tail coverage shrank ${drop} cities (${(dropPct * 100).toFixed(0)}%): ${prevTail} → ${current.totals.cities_60_90d} cities (${current.totals.events_60_90d} events).`,
      })
    } else {
      findings.push({
        name: 'tail_thin',
        status: 'pass',
        message: `60–90d tail: ${current.totals.cities_60_90d} cities, ${current.totals.events_60_90d} events (prev ${prevTail}).`,
      })
    }
  } else {
    findings.push({
      name: 'tail_thin',
      status: 'pass',
      message: `60–90d tail: ${current.totals.cities_60_90d} cities, ${current.totals.events_60_90d} events (baseline).`,
    })
  }

  return { findings, cliffCities }
}
