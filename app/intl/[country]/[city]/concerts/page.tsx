import { Metadata } from 'next'
import Link from 'next/link'
import { Concert } from '@/types'
import ConcertCard from '@/components/ConcertCard'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { getAllMetros, getMetroByCode, cityToSlug } from '@/lib/city-slugs'
import { getPublishedMetros, isMetroPublished } from '@/lib/feature-flags'
import { getMetroTz, getLocalDateStr } from '@/lib/timezone'
import { buildItemListJsonLd } from '@/lib/jsonld'

export const revalidate = 3600

// Only emit pages for published international metros
export async function generateStaticParams() {
  return getPublishedMetros()
    .filter(m => m.country && m.country !== 'US')
    .map(m => ({
      country: m.country!.toLowerCase(),
      city: cityToSlug(m.city),
    }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; city: string }>
}): Promise<Metadata> {
  const { country, city } = await params
  const metro = getAllMetros().find(
    m => m.country?.toLowerCase() === country && cityToSlug(m.city) === city
  )
  if (!metro || !isMetroPublished(metro)) {
    return { title: 'City Not Found' }
  }

  const title = `Free Live Music & Concerts in ${metro.city}`
  const description = `Discover free live music events and concerts in ${metro.city}. Find upcoming shows, venues, and performers. Updated daily.`

  return {
    title,
    description,
    alternates: { canonical: `https://www.freelivemusic.co/intl/${country}/${city}/concerts` },
    openGraph: { title, description, type: 'website' },
  }
}

export default async function IntlConcertsPage({
  params,
}: {
  params: Promise<{ country: string; city: string }>
}) {
  const { country, city } = await params

  const metro = getAllMetros().find(
    m => m.country?.toLowerCase() === country && cityToSlug(m.city) === city
  )
  if (!metro || !isMetroPublished(metro)) notFound()

  const tz = getMetroTz(metro as { timezone?: string; state?: string })
  const today = getLocalDateStr(tz)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const cityNames = [metro.city, ...(metro.aliases ?? [])]
  const { data: concerts } = await supabase
    .from('concerts')
    .select('id, slug, artist_name, venue, date, time, neighborhood, city, genre, price, admission_type, indoor_outdoor, image_url, is_verified, source_url, source_name')
    .in('city', cityNames)
    .eq('is_verified', true)
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(200)

  const concertList = (concerts ?? []) as Concert[]

  const itemListJsonLd = concertList.length > 0
    ? buildItemListJsonLd({
        name: `Free Concerts in ${metro.city}`,
        items: concertList.map((c, i) => ({
          type: 'City' as const,
          position: i + 1,
          name: `${c.artist_name} at ${c.venue}`,
          url: `https://www.freelivemusic.co/concert/${c.slug}`,
        })),
      })
    : null

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="text-sm text-slate-400 mb-6">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-white">{metro.city}</span>
        </nav>

        <h1 className="text-3xl font-bold mb-2">
          Free Live Music & Concerts in {metro.city}
        </h1>
        <p className="text-slate-400 mb-8">
          {concertList.length > 0
            ? `${concertList.length} upcoming free show${concertList.length !== 1 ? 's' : ''}`
            : 'No upcoming free concerts listed yet — check back soon.'}
        </p>

        {itemListJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
          />
        )}

        {concertList.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center">
            <p className="text-slate-400 text-lg mb-4">
              We&apos;re building out {metro.city} coverage now.
            </p>
            <Link href="/" className="text-blue-400 hover:underline">
              ← Browse US cities
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {concertList.map(concert => (
              <ConcertCard key={concert.id} concert={concert} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
