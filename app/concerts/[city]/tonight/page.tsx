import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import ConcertCard from '@/components/ConcertCard'
import { Concert } from '@/types'
import {
  getCityCodeFromSlug,
  getMetroByCode,
  getAllCityCodes,
  cityCodeToSlug,
} from '@/lib/city-slugs'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return getAllCityCodes()
    .map((code) => cityCodeToSlug[code])
    .filter(Boolean)
    .map((slug) => ({ city: slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>
}): Promise<Metadata> {
  const { city } = await params
  const cityCode = getCityCodeFromSlug(city)
  if (!cityCode) return { title: 'City Not Found' }
  const metro = getMetroByCode(cityCode)
  if (!metro) return { title: 'City Not Found' }

  const title = `Free Concerts in ${metro.city} Tonight | Free Live Music`
  const description = `Find free live music happening tonight in ${metro.city}, ${metro.state}. No tickets, no cover charge — just great live music.`

  return {
    title,
    description,
    keywords: [
      `free concerts ${metro.city} tonight`,
      `free live music tonight ${metro.city}`,
      `concerts tonight ${metro.city}`,
      `free shows tonight ${metro.city}`,
    ],
    openGraph: {
      title,
      description,
      url: `https://www.freelivemusic.co/concerts/${city}/tonight`,
      siteName: 'Free Live Music',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://www.freelivemusic.co/concerts/${city}/tonight`,
    },
    robots: { index: true, follow: true },
  }
}

async function getTonightConcerts(metro: ReturnType<typeof getMetroByCode>): Promise<Concert[]> {
  if (!metro) return []
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return []

  const cityNames = [metro.city, ...(metro.aliases || [])]
  const today = new Date().toISOString().split('T')[0]

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data } = await supabase
    .from('concerts')
    .select('*')
    .in('city', cityNames)
    .eq('date', today)
    .order('time', { ascending: true, nullsFirst: false })

  return (data as Concert[]) ?? []
}

export default async function TonightPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  const cityCode = getCityCodeFromSlug(city.toLowerCase())
  if (!cityCode) return <div className="text-center py-20">City not found</div>
  const metro = getMetroByCode(cityCode)
  if (!metro) return <div className="text-center py-20">City not found</div>

  const concerts = await getTonightConcerts(metro)

  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const itemListJsonLd = concerts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Free Concerts in ${metro.city} Tonight`,
    url: `https://www.freelivemusic.co/concerts/${city}/tonight`,
    numberOfItems: concerts.length,
    itemListElement: concerts.map((concert, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'MusicEvent',
        name: concert.artist_name,
        startDate: concert.time ? `${concert.date}T${concert.time}` : concert.date,
        location: {
          '@type': 'Place',
          name: concert.venue ?? metro.city,
          address: `${metro.city}, ${metro.state}`,
        },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    })),
  } : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>›</span>
            <Link href={`/concerts/${city}`} className="hover:text-blue-600 transition-colors">
              {metro.city}
            </Link>
            <span>›</span>
            <span className="text-slate-700">Tonight</span>
          </nav>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Free Concerts in {metro.city} Tonight
          </h1>
          <p className="text-xl text-slate-600 mb-1">
            {dateLabel}
          </p>
          <p className="text-slate-500">
            {concerts.length > 0
              ? `${concerts.length} free ${concerts.length === 1 ? 'show' : 'shows'} happening today — no tickets required`
              : `No free shows tonight — check back or browse this weekend`}
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {concerts.length > 0 && (
          <p className="text-slate-600 text-sm mb-8 max-w-2xl">
            {concerts.length === 1
              ? `One free show is happening in ${metro.city} today. No tickets or cover charge needed — walk up and enjoy.`
              : `${concerts.length} free shows are happening in ${metro.city} today. No tickets or cover charges — walk up and enjoy. Shows are sorted by start time.`}
          </p>
        )}
        {concerts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concerts.map((concert) => (
              <ConcertCard key={concert.id} concert={concert} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-lg">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              No Free Shows Tonight in {metro.city}
            </h2>
            <p className="text-slate-600 mb-8">
              Nothing is scheduled for today, but there may be shows this weekend or later this week.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link
                href={`/concerts/${city}/this-weekend`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                This Weekend →
              </Link>
              <Link
                href={`/concerts/${city}`}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
              >
                All Upcoming Shows
              </Link>
            </div>
          </div>
        )}
      </main>

      <section className="bg-slate-50 border-t border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">More Free Music in {metro.city}</h2>
          <div className="flex flex-wrap gap-4">
            <Link href={`/concerts/${city}/this-weekend`} className="text-blue-600 hover:underline text-sm">
              Free concerts this weekend
            </Link>
            <Link href={`/concerts/${city}`} className="text-blue-600 hover:underline text-sm">
              All upcoming free concerts
            </Link>
            <Link href={`/venues/${cityCodeToSlug[cityCode]}`} className="text-blue-600 hover:underline text-sm">
              Venues in {metro.city}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
