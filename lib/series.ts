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

export function computeRecurringSeries(concerts: { artist_name: string; venue: string }[], minCount = 3): SeriesEntry[] {
  const grouped = new Map<string, { count: number; venue: string | null }>()
  for (const c of concerts) {
    const existing = grouped.get(c.artist_name)
    if (existing) {
      existing.count++
    } else {
      grouped.set(c.artist_name, { count: 1, venue: c.venue ?? null })
    }
  }
  return [...grouped.entries()]
    .filter(([, v]) => v.count >= minCount)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([name, { count, venue }]) => ({
      artistName: name,
      slug: seriesSlug(name),
      count,
      venue,
    }))
}
