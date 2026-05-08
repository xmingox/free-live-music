import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getAllMetros, cityCodeToSlug, aliasSlugMap } from '@/lib/city-slugs'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: concerts } = await supabase
    .from('concerts')
    .select('slug, date, created_at')
    .order('date', { ascending: true })

  const { data: venues } = await supabase
    .from('venues')
    .select('slug, city, updated_at')

  const concertUrls: MetadataRoute.Sitemap = (concerts ?? []).map((c) => ({
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
  const today = new Date().toISOString().split('T')[0]
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

  return [
    {
      url: 'https://www.freelivemusic.co',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...cityUrls,
    ...venueListUrls,
    ...aliasUrls,
    ...concertUrls,
    ...venueDetailUrls,
  ]
}
