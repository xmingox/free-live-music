export function seriesSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export type SeriesEntry = {
  artistName: string
  slug: string
  count: number
  venue: string | null
}

// A series qualifies at 3+ shows, OR 2+ shows where at least one is 14+ days out
// (signals genuine recurring series intent, not a two-night stand).
export function computeRecurringSeries(
  concerts: { artist_name: string; venue: string; date: string }[]
): SeriesEntry[] {
  const today = new Date()
  const fourteenDays = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const grouped = new Map<string, { count: number; venue: string | null; hasFuture14: boolean }>()

  for (const c of concerts) {
    const existing = grouped.get(c.artist_name)
    const isFuture14 = c.date >= fourteenDays
    if (existing) {
      existing.count++
      if (isFuture14) existing.hasFuture14 = true
    } else {
      grouped.set(c.artist_name, { count: 1, venue: c.venue ?? null, hasFuture14: isFuture14 })
    }
  }

  return [...grouped.entries()]
    .filter(([, v]) => v.count >= 3 || (v.count >= 2 && v.hasFuture14))
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([name, { count, venue }]) => ({
      artistName: name,
      slug: seriesSlug(name),
      count,
      venue,
    }))
}
