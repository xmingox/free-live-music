export const revalidate = 900 // 15-minute ISR — intent expires fast

import { Metadata } from 'next'
import Link from 'next/link'
import { Concert } from '@/types'
import ConcertCard from '@/components/ConcertCard'
import { createClient } from '@supabase/supabase-js'
import { GUIDE_CITIES } from '@/lib/city-guides'
import {
  getCityCodeFromSlug,
  getMetroByCode,
  cityCodeToSlug,
} from '@/lib/city-slugs'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'

export async function generateStaticParams() {
  return GUIDE_CITIES.map((c) => ({ city: c.slug }))
}

async function getTonightConcerts(
  metro: ReturnType<typeof getMetroByCode>,
  today: string
): Promise<Concert[]> {
  if (!metro) return []
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return []

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const cityNames = [metro.city, ...(metro.aliases || [])]
  const { data } = await supabase
    .from('concerts')
    .select('*')
    .in('city', cityNames)
    .eq('date', today)
    .eq('is_verified', true)
    .order('time', { ascending: true, nullsFirst: false })

  return (data ?? []) as Concert[]
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

  const today = new Date()
  const dayLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const title = `Free Concerts Tonight in ${metro.city} — ${dayLabel}`
  const description = `Find free live music happening tonight in ${metro.city}, ${metro.state}. Browse tonight's free shows — no cover charge or tickets needed.`
  const url = `https://www.freelivemusic.co/tonight/${city}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Free Live Music',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function TonightCityPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city: citySlug } = await params
  const cityCode = getCityCodeFromSlug(citySlug)
  if (!cityCode) return null
  const metro = getMetroByCode(cityCode)
  if (!metro) return null

  const today = new Date().toISOString().split('T')[0]
  const dayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const concerts = await getTonightConcerts(metro, today)
  const concertsSlug = cityCodeToSlug[cityCode] ?? citySlug

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Free Live Music', item: 'https://www.freelivemusic.co' },
      { '@type': 'ListItem', position: 2, name: `Free Concerts in ${metro.city}`, item: `https://www.freelivemusic.co/concerts/${concertsSlug}` },
      { '@type': 'ListItem', position: 3, name: 'Tonight' },
    ],
  }

  const eventJsonLd = concerts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Free Concerts Tonight in ${metro.city}`,
    description: `Free live music tonight in ${metro.city}, ${metro.state}`,
    url: `https://www.freelivemusic.co/tonight/${citySlug}`,
    numberOfItems: concerts.length,
    itemListElement: concerts.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'MusicEvent',
        name: c.artist_name,
        startDate: c.time ? `${c.date}T${c.time}` : c.date,
        location: {
          '@type': 'Place',
          name: c.venue,
          address: {
            '@type': 'PostalAddress',
            addressLocality: metro.city,
            addressRegion: metro.state,
          },
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        url: `https://www.freelivemusic.co/concert/${c.slug}`,
      },
    })),
  } : null

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {eventJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />
      )}

      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <SiteNav
            venuesHref={`/venues/${concertsSlug}`}
            breadcrumbs={[
              { label: 'Free Live Music', href: '/' },
              { label: metro.city, href: `/?city=${cityCode}` },
              { label: 'Tonight' },
            ]}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Free Concerts Tonight
            </span>
            <span className="text-white"> in {metro.city}</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <p className="text-slate-400">{dayLabel} · {metro.city}, {metro.state}</p>
          </div>
        </div>

        {concerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🎵</div>
            <h2 className="text-xl font-semibold text-slate-300 mb-2">
              No free shows listed for tonight
            </h2>
            <p className="text-slate-500 max-w-sm mb-6">
              Some venues post last-minute. Check{' '}
              <Link href={`/concerts/${concertsSlug}`} className="text-violet-400 hover:text-violet-300">
                all upcoming free music in {metro.city}
              </Link>{' '}
              or come back later today.
            </p>
            <Link
              href={`/this-weekend/${citySlug}`}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
            >
              Browse this weekend instead →
            </Link>
          </div>
        ) : (
          <>
            <p className="text-slate-400 mb-6">
              {concerts.length} free show{concerts.length !== 1 ? 's' : ''} tonight · No cover charge
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {concerts.map((c) => (
                <ConcertCard key={c.id} concert={c} />
              ))}
            </div>
          </>
        )}

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-sm">
          <Link
            href={`/this-weekend/${citySlug}`}
            className="text-violet-400 hover:text-violet-300 transition-colors"
          >
            This weekend in {metro.city} →
          </Link>
          <Link
            href={`/concerts/${concertsSlug}`}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            All upcoming free music →
          </Link>
          <Link
            href={`/venues/${concertsSlug}`}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            Browse venues →
          </Link>
        </div>
      </main>

      <SiteFooter
        cityLine={`Free concerts tonight in ${metro.city} · No cover charge`}
        venueTypeSlug={concertsSlug}
      />
    </div>
  )
}
