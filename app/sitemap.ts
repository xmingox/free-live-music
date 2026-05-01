import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: concerts } = await supabase
    .from('concerts')
    .select('slug, date, created_at')
    .order('date', { ascending: true })

  const concertUrls: MetadataRoute.Sitemap = (concerts ?? []).map((c) => ({
    url: `https://freelivemusic.co/concert/${c.slug}`,
    lastModified: c.created_at,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    {
      url: 'https://freelivemusic.co',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...concertUrls,
  ]
}
