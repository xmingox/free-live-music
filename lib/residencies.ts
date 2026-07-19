// lib/residencies.ts
//
// Reads PUBLISHED (is_active=true) recurring free-music residencies for a city
// from event_series, joined to venues for the city scope + venue name.
//
// This is the pivot's cliff-proof inventory: year-round free music that renders
// as a SCHEDULE ("every night", "Fri, Sat"), never as synthetic dated event rows.
// RLS on event_series already restricts public reads to is_active=true, and we
// filter is_active=true here too (defense in depth). Cached daily, tag
// 'residencies' so an admin flip can bust it.

import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

export interface Residency {
  id: string
  seriesName: string
  venueName: string | null
  genre: string | null
  price: string | null
  time: string | null
  recurrence: string | null // 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'annual' | 'irregular'
  days: string[] | null
  description: string | null
}

const DAY_TO_SCHEMA: Record<string, string> = {
  Sun: 'https://schema.org/Sunday', Mon: 'https://schema.org/Monday', Tue: 'https://schema.org/Tuesday',
  Wed: 'https://schema.org/Wednesday', Thu: 'https://schema.org/Thursday', Fri: 'https://schema.org/Friday',
  Sat: 'https://schema.org/Saturday',
}

/**
 * schema.org Schedule for JSON-LD — expresses recurrence in markup WITHOUT
 * fabricating dated instances (the structured-data twin of "render as schedules").
 */
export function residencySchedule(r: Pick<Residency, 'recurrence' | 'days'>): Record<string, unknown> {
  const s: Record<string, unknown> = { '@type': 'Schedule' }
  if (r.recurrence === 'daily') {
    s.repeatFrequency = 'P1D'
  } else if (r.days && r.days.length > 0) {
    s.repeatFrequency = 'P1W'
    s.byDay = r.days.map((d) => DAY_TO_SCHEMA[d]).filter(Boolean)
  } else if (r.recurrence === 'weekly') {
    s.repeatFrequency = 'P1W'
  } else if (r.recurrence === 'monthly') {
    s.repeatFrequency = 'P1M'
  }
  return s
}

/** Human schedule label, e.g. "Every night", "Fri, Sat", "Weekly". */
export function scheduleLabel(r: Pick<Residency, 'recurrence' | 'days'>): string {
  if (r.recurrence === 'daily') return 'Every night'
  if (r.days && r.days.length > 0) return r.days.join(', ')
  switch (r.recurrence) {
    case 'weekly': return 'Weekly'
    case 'biweekly': return 'Every other week'
    case 'monthly': return 'Monthly'
    case 'annual': return 'Annually'
    default: return 'Recurring'
  }
}

async function fetchResidencies(cityCode: string): Promise<Residency[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  try {
    const supabase = createClient(url, key)
    // Inner join to venues: an active residency must resolve to a venue (that's
    // how it's city-scoped). Rows with a null venue_id are drafts and excluded.
    const { data, error } = await supabase
      .from('event_series')
      .select(
        'id, series_name, default_genre, default_price, default_time, recurrence_type, days_of_week, description, venues!inner(name, city)',
      )
      .eq('is_active', true)
      .eq('venues.city', cityCode)

    if (error || !data) return []

    return (data as unknown as Array<{
      id: string
      series_name: string
      default_genre: string | null
      default_price: string | null
      default_time: string | null
      recurrence_type: string | null
      days_of_week: string[] | null
      description: string | null
      venues: { name: string | null } | { name: string | null }[] | null
    }>).map((r) => {
      // PostgREST returns a to-one embed as an object, but tolerate an array too.
      const venue = Array.isArray(r.venues) ? r.venues[0] ?? null : r.venues
      return {
      id: r.id,
      seriesName: r.series_name,
      venueName: venue?.name ?? null,
      genre: r.default_genre,
      price: r.default_price,
      time: r.default_time,
      recurrence: r.recurrence_type,
      days: r.days_of_week,
      description: r.description,
      }
    })
  } catch {
    return []
  }
}

/** Cached per city code; daily backstop, bustable via revalidateTag('residencies'). */
export function getActiveResidencies(cityCode: string): Promise<Residency[]> {
  return unstable_cache(
    () => fetchResidencies(cityCode),
    ['residencies', cityCode],
    { revalidate: 86400, tags: ['residencies'] },
  )()
}
