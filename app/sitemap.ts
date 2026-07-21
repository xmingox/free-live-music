import { MetadataRoute } from 'next'
import { getUsToday } from '@/lib/timezone'
import { createClient } from '@supabase/supabase-js'
import { getAllMetros, cityCodeToSlug, aliasSlugMap } from '@/lib/city-slugs'
import { GUIDE_CITIES } from '@/lib/city-guides'
import { GUIDE_SLUGS } from '@/lib/city-guides-data'
import { getActiveStateSlugs, stateCodeToSlug } from '@/lib/state-slugs'
import { seriesSlug } from '@/lib/series'
import { CITY_MIN_UPCOMING } from '@/lib/city-visibility'

// Refresh hourly so slug renames, new concerts, and is_tbd flips surface in
// crawler-facing sitemap.xml without needing a deploy.
export const revalidate = 86400 // daily; sitemap re-reads all concerts+venues, so keep this off the hourly path

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const today = getUsToday()
  const allConcerts: { slug: string; date: string; created_at: string; city: string; venue_id: string | null }[] = []
  const pageSize = 1000
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('concerts')
      .select('slug, date, created_at, city, venue_id')
      .eq('is_verified', true)
      .eq('is_tbd', false)
      .gte('date', today)
      .order('date', { ascending: true })
      .range(offset, offset + pageSize - 1)
    if (error || !data?.length) break
    allConcerts.push(...data)
    if (data.length < pageSize) break
    offset += pageSize
  }

  const cityCountMap: Record<string, number> = {}
  const venueIdsWithConcerts = new Set<string>()
  for (const c of allConcerts) {
    if (c.city) cityCountMap[c.city] = (cityCountMap[c.city] ?? 0) + 1
    if (c.venue_id) venueIdsWithConcerts.add(c.venue_id)
  }
  const CITY_MIN_CONCERTS = CITY_MIN_UPCOMING // shared floor — keeps sitemap inclusion in lockstep with the page's noindex threshold

  const { data: venueRows } = await supabase
    .from('venues')
    .select('id, slug, city, updated_at, music_score, music_schedule')

  // Only include venues that will actually be indexed:
  // - Must have music_score >= 0 or a music_schedule (baseline quality)
  // - Must have upcoming concerts (venue_id match) or a music_schedule
  // This aligns with the noindex logic in the venue detail page.
  const venues = (venueRows ?? []).filter(v =>
    ((v.music_score ?? 0) >= 0 || v.music_schedule != null) &&
    (v.music_schedule != null || venueIdsWithConcerts.has(v.id))
  )

  const concertUrls: MetadataRoute.Sitemap = allConcerts.map((c) => ({
    url: `https://www.freelivemusic.co/concert/${c.slug}`,
    lastModified: c.created_at,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const cityUrls: MetadataRoute.Sitemap = getAllMetros()
    .filter((metro) => (cityCountMap[metro.code] ?? 0) >= CITY_MIN_CONCERTS)
    .map((metro) => ({
      url: `https://www.freelivemusic.co/concerts/${cityCodeToSlug[metro.code]}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

  // Include alias city pages that have >= 5 upcoming events
  const aliasCityNames = Object.values(aliasSlugMap).map((a) => a.cityName)
  const aliasUrls: MetadataRoute.Sitemap = []

  if (aliasCityNames.length > 0) {
    const { data: aliasConcerts } = await supabase
      .from('concerts')
      .select('city')
      .in('city', aliasCityNames)
      .gte('date', today)

    const cityCounts: Record<string, number> = {}
    for (const concert of aliasConcerts ?? []) {
      cityCounts[concert.city] = (cityCounts[concert.city] || 0) + 1
    }

    for (const [slug, aliasCity] of Object.entries(aliasSlugMap)) {
      // Skip code-identical aliases (e.g. CHI, NYC, DAL) — they show subset/duplicate
      // content of the parent metro page and waste crawl budget.
      if (aliasCity.cityName === aliasCity.parentMetroCode) continue
      if ((cityCounts[aliasCity.cityName] || 0) >= 5) {
        aliasUrls.push({
          url: `https://www.freelivemusic.co/concerts/city/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.6,
        })
      }
    }
  }

  const venueListUrls: MetadataRoute.Sitemap = getAllMetros().map((metro) => ({
    url: `https://www.freelivemusic.co/venues/${cityCodeToSlug[metro.code]}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const venueDetailUrls: MetadataRoute.Sitemap = (venues ?? []).map((v) => ({
    url: `https://www.freelivemusic.co/venues/${cityCodeToSlug[v.city] ?? v.city.toLowerCase()}/${v.slug}`,
    lastModified: v.updated_at,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const weekendUrls: MetadataRoute.Sitemap = GUIDE_CITIES.map((c) => ({
    url: `https://www.freelivemusic.co/this-weekend/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const tonightUrls: MetadataRoute.Sitemap = GUIDE_CITIES.map((c) => ({
    url: `https://www.freelivemusic.co/tonight/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.6,
  }))

  const thisWeekUrls: MetadataRoute.Sitemap = GUIDE_CITIES.map((c) => ({
    url: `https://www.freelivemusic.co/this-week/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  const stateUrls: MetadataRoute.Sitemap = getActiveStateSlugs().map((slug) => ({
    url: `https://www.freelivemusic.co/free-concerts/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const guideUrls: MetadataRoute.Sitemap = GUIDE_SLUGS.map((slug) => ({
    url: `https://www.freelivemusic.co/free-live-music/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  // Artist pages: 3+ shows AND at least one show >= 14 days out
  const fourteenDaysOut = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: artistRows } = await supabase
    .from('concerts')
    .select('artist_name, date')
    .eq('is_verified', true)
    .gte('date', today)
    .not('artist_name', 'is', null)

  const artistMap = new Map<string, { count: number; hasFuture14: boolean }>()
  for (const row of artistRows ?? []) {
    const entry = artistMap.get(row.artist_name) ?? { count: 0, hasFuture14: false }
    entry.count++
    if (row.date >= fourteenDaysOut) entry.hasFuture14 = true
    artistMap.set(row.artist_name, entry)
  }

  const artistUrls: MetadataRoute.Sitemap = [...artistMap.entries()]
    .filter(([, v]) => v.count >= 3 && v.hasFuture14)
    .map(([name]) => ({
      url: `https://www.freelivemusic.co/artist/${seriesSlug(name)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))

  return [
    {
      url: 'https://www.freelivemusic.co',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://www.freelivemusic.co/traditions',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...guideUrls,
    ...cityUrls,
    ...stateUrls,
    ...tonightUrls,
    ...weekendUrls,
    ...thisWeekUrls,
    ...venueListUrls,
    ...aliasUrls,
    ...artistUrls,
    ...concertUrls,
    ...venueDetailUrls,
  ]
}
