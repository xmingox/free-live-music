import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getAllMetros, cityCodeToSlug, aliasSlugMap } from '@/lib/city-slugs'
import { GUIDE_CITIES } from '@/lib/city-guides'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const today = new Date().toISOString().split('T')[0]
  const allConcerts: { slug: string; date: string; created_at: string }[] = []
  const pageSize = 1000
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('concerts')
      .select('slug, date, created_at')
      .eq('is_verified', true)
      .gte('date', today)
      .order('date', { ascending: true })
      .range(offset, offset + pageSize - 1)
    if (error || !data?.length) break
    allConcerts.push(...data)
    if (data.length < pageSize) break
    offset += pageSize
  }

  const { data: venueRows } = await supabase
    .from('venues')
    .select('slug, city, updated_at, music_score, music_schedule')

  // Exclude venues with negative score AND no music schedule — these are
  // Google Places entries with no evidence of live music (Opus recommendation).
  // Venues with upcoming shows won't have negative scores (weekly cron adds +20).
  const venues = (venueRows ?? []).filter(v =>
    (v.music_score ?? 0) >= 0 || v.music_schedule != null
  )

  const concertUrls: MetadataRoute.Sitemap = allConcerts.map((c) => ({
    url: `https://www.freelivemusic.co/concert/${c.slug}`,
    lastModified: c.created_at,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const cityUrls: MetadataRoute.Sitemap = getAllMetros().map((metro) => ({
    url: `https://www.freelivemusic.co/concerts/${cityCodeToSlug[metro.code]}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
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

  return [
    {
      url: 'https://www.freelivemusic.co',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...cityUrls,
    ...tonightUrls,
    ...weekendUrls,
    ...thisWeekUrls,
    ...venueListUrls,
    ...aliasUrls,
    ...concertUrls,
    ...venueDetailUrls,
  ]
}
