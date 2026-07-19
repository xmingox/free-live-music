// lib/city-fallback.ts
//
// Graceful-degradation data for thin/empty /concerts/[city] pages.
//
// When a city has few or no upcoming events (the September supply cliff),
// the page still needs to be useful and non-empty for users and crawlers.
// This module derives, from data we already have, three fallbacks:
//
//   1. Recurring-series HISTORY — series (artist+venue) that have run 3+ times
//      in this city, including DORMANT ones (no upcoming date), with a
//      data-supported "typically returns in {Month}" label.
//   2. TOP VENUES — the venues that have historically hosted the most shows.
//   3. NEARBY CITIES WITH EVENTS — nearest metros that DO have upcoming supply,
//      using venue lat/lng centroids (every venue is geocoded — no API cost).
//
// Cost discipline (CLAUDE.md §2): all queries here go through unstable_cache
// with a daily backstop and the shared 'concerts' tag, so they refresh when the
// import cron calls revalidateTag('concerts') — reads scale with imports, NOT
// with visitor traffic.

import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { getUsToday } from './timezone'
import { getMetroByCode, cityCodeToSlug, type Metro } from './city-slugs'
import { seriesSlug } from './series'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export interface RecurringSeriesHistory {
  artistName: string
  venue: string | null
  slug: string
  occurrences: number
  lastDate: string
  /** true when the series has no upcoming (>= today) show on the books */
  dormant: boolean
  /** e.g. "July" — the month this series most often runs; null if too scattered */
  typicalReturnMonth: string | null
}

export interface TopVenue {
  name: string
  showCount: number
}

export interface NearbyCity {
  code: string
  cityName: string
  slug: string
  upcomingCount: number
  distanceMi: number
}

export interface CityFallback {
  recurringSeries: RecurringSeriesHistory[]
  topVenues: TopVenue[]
  nearby: NearbyCity[]
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// ── Metro centroids + upcoming counts (shared across all city pages) ──────────

interface GeoAndCounts {
  centroids: Record<string, { lat: number; lng: number }>
  upcomingCounts: Record<string, number>
}

async function fetchGeoAndCounts(): Promise<GeoAndCounts> {
  const supabase = getSupabase()
  if (!supabase) return { centroids: {}, upcomingCounts: {} }

  // Venue centroids per metro code (venues.city stores the same metro codes as
  // concerts.city). Every venue has lat/lng, so this is a clean average.
  const sums: Record<string, { lat: number; lng: number; n: number }> = {}
  {
    const pageSize = 1000
    let offset = 0
    while (true) {
      const { data, error } = await supabase
        .from('venues')
        .select('city, lat, lng')
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .order('id', { ascending: true }) // stable sort so range pagination can't skip/dup rows
        .range(offset, offset + pageSize - 1)
      if (error || !data?.length) break
      for (const v of data as { city: string; lat: number; lng: number }[]) {
        if (!v.city) continue
        const s = sums[v.city] ?? { lat: 0, lng: 0, n: 0 }
        s.lat += v.lat
        s.lng += v.lng
        s.n += 1
        sums[v.city] = s
      }
      if (data.length < pageSize) break
      offset += pageSize
    }
  }
  const centroids: Record<string, { lat: number; lng: number }> = {}
  for (const [code, s] of Object.entries(sums)) {
    if (s.n > 0) centroids[code] = { lat: s.lat / s.n, lng: s.lng / s.n }
  }

  // Upcoming indexable event counts per metro code.
  const upcomingCounts: Record<string, number> = {}
  {
    const today = getUsToday()
    const pageSize = 1000
    let offset = 0
    while (true) {
      const { data, error } = await supabase
        .from('concerts')
        .select('city')
        .eq('is_verified', true)
        .eq('is_tbd', false)
        .eq('is_cancelled', false)
        .gte('date', today)
        .order('id', { ascending: true }) // stable sort so range pagination can't skip/dup rows
        .range(offset, offset + pageSize - 1)
      if (error || !data?.length) break
      for (const c of data as { city: string }[]) {
        if (!c.city) continue
        upcomingCounts[c.city] = (upcomingCounts[c.city] ?? 0) + 1
      }
      if (data.length < pageSize) break
      offset += pageSize
    }
  }

  return { centroids, upcomingCounts }
}

const getGeoAndCounts = unstable_cache(
  fetchGeoAndCounts,
  ['city-geo-counts'],
  { revalidate: 86400, tags: ['concerts'] },
)

function haversineMi(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 3958.8 // miles
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Nearest metros that currently have upcoming events, by venue-centroid distance.
 * Returns [] when the anchor metro has no geocoded venues (≈40 event-cities).
 */
export async function getNearbyCitiesWithEvents(
  metroCode: string,
  opts: { limit?: number; maxMi?: number } = {},
): Promise<NearbyCity[]> {
  const { limit = 6, maxMi = 350 } = opts
  const { centroids, upcomingCounts } = await getGeoAndCounts()
  const origin = centroids[metroCode]
  if (!origin) return []

  const candidates: NearbyCity[] = []
  for (const [code, count] of Object.entries(upcomingCounts)) {
    if (code === metroCode || count <= 0) continue
    const c = centroids[code]
    if (!c) continue
    const metro = getMetroByCode(code)
    const slug = cityCodeToSlug[code]
    if (!metro || !slug) continue
    const distanceMi = haversineMi(origin, c)
    candidates.push({
      code,
      cityName: metro.city,
      slug,
      upcomingCount: count,
      distanceMi: Math.round(distanceMi),
    })
  }

  candidates.sort((a, b) => a.distanceMi - b.distanceMi)
  const withinRange = candidates.filter((c) => c.distanceMi <= maxMi)
  // Prefer in-range neighbors; if none, fall back to the nearest overall so the
  // section is never empty for a geocoded city.
  return (withinRange.length ? withinRange : candidates).slice(0, limit)
}

// ── Per-city recurring-series history + top venues ───────────────────────────

async function fetchCityHistory(metroCode: string): Promise<{
  recurringSeries: RecurringSeriesHistory[]
  topVenues: TopVenue[]
}> {
  const metro = getMetroByCode(metroCode) as Metro | undefined
  const supabase = getSupabase()
  if (!metro || !supabase) return { recurringSeries: [], topVenues: [] }

  const cityNames = [metro.city, ...((metro as { aliases?: string[] }).aliases || [])]
  const today = getUsToday()

  // Full history (past + future). is_verified only — we WANT past shows here to
  // derive recurring/dormant series; date is not filtered.
  const rows: { artist_name: string; venue: string | null; date: string }[] = []
  const pageSize = 1000
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('concerts')
      .select('artist_name, venue, date')
      .in('city', cityNames)
      .eq('is_verified', true)
      .not('artist_name', 'is', null)
      .order('date', { ascending: true })
      .order('id', { ascending: true }) // secondary key: date isn't unique, keep pagination stable
      .range(offset, offset + pageSize - 1)
    if (error || !data?.length) break
    rows.push(...(data as typeof rows))
    if (data.length < pageSize) break
    offset += pageSize
  }

  // Group by artist+venue → a "series".
  interface Group {
    artistName: string
    venue: string | null
    dates: string[]
    monthCounts: number[] // index 0..11
  }
  const groups = new Map<string, Group>()
  const venueShowCounts = new Map<string, number>()

  for (const r of rows) {
    if (r.venue) venueShowCounts.set(r.venue, (venueShowCounts.get(r.venue) ?? 0) + 1)
    const key = `${r.artist_name}|||${r.venue ?? ''}`
    let g = groups.get(key)
    if (!g) {
      g = { artistName: r.artist_name, venue: r.venue, dates: [], monthCounts: new Array(12).fill(0) }
      groups.set(key, g)
    }
    g.dates.push(r.date)
    const month = Number(r.date.slice(5, 7)) - 1 // "YYYY-MM-DD" → 0..11
    if (month >= 0 && month < 12) g.monthCounts[month] += 1
  }

  const recurringSeries: RecurringSeriesHistory[] = [...groups.values()]
    .filter((g) => g.dates.length >= 3)
    .map((g) => {
      const lastDate = g.dates[g.dates.length - 1]
      const dormant = lastDate < today
      // typical month = the modal month, but only if reasonably concentrated
      // (audit: dormant series footprints are ≤4 distinct months, so a mode is meaningful).
      const maxCount = Math.max(...g.monthCounts)
      const modeMonth = g.monthCounts.indexOf(maxCount)
      const distinctMonths = g.monthCounts.filter((n) => n > 0).length
      const typicalReturnMonth =
        distinctMonths > 0 && distinctMonths <= 4 && maxCount >= 1 ? MONTHS[modeMonth] : null
      return {
        artistName: g.artistName,
        venue: g.venue,
        slug: seriesSlug(g.artistName),
        occurrences: g.dates.length,
        lastDate,
        dormant,
        typicalReturnMonth,
      }
    })
    // Surface dormant-but-recurring first (that's the "it'll be back" story),
    // then by how established the series is.
    .sort((a, b) => Number(b.dormant) - Number(a.dormant) || b.occurrences - a.occurrences)
    .slice(0, 12)

  const topVenues: TopVenue[] = [...venueShowCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, showCount]) => ({ name, showCount }))

  return { recurringSeries, topVenues }
}

// Cache per metro code (the code is part of the key array so each city caches
// independently), daily backstop, busted by the import cron's revalidateTag('concerts').
function getCityHistory(metroCode: string) {
  return unstable_cache(
    () => fetchCityHistory(metroCode),
    ['city-history', metroCode],
    { revalidate: 86400, tags: ['concerts'] },
  )()
}

/** One call that bundles everything the degraded city view needs. */
export async function getCityFallback(metroCode: string): Promise<CityFallback> {
  const [{ recurringSeries, topVenues }, nearby] = await Promise.all([
    getCityHistory(metroCode),
    getNearbyCitiesWithEvents(metroCode),
  ])
  return { recurringSeries, topVenues, nearby }
}
