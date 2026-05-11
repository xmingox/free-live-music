import { Metadata } from 'next'
import Link from 'next/link'
import { Concert } from '@/types'
import ConcertCard from '@/components/ConcertCard'
import { createClient } from '@supabase/supabase-js'
import { MOCK_CONCERTS } from '@/lib/mock-data'
import {
  getCityCodeFromSlug,
  getMetroByCode,
  getAllCityCodes,
  cityCodeToSlug,
  cityToSlug,
  getAliasCityFromSlug,
} from '@/lib/city-slugs'
import { computeRecurringSeries } from '@/lib/series'

export const revalidate = 3600 // Revalidate every hour

// Generate static params for all cities
export async function generateStaticParams() {
  return getAllCityCodes()
    .map((code) => cityCodeToSlug[code])
    .filter(Boolean)
    .map((slug) => ({ city: slug }))
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>
}): Promise<Metadata> {
  const { city } = await params
  const cityCode = getCityCodeFromSlug(city)
  if (!cityCode) {
    return { title: 'City Not Found' }
  }

  const metro = getMetroByCode(cityCode)
  if (!metro) {
    return { title: 'City Not Found' }
  }

  const title = `Free Live Music & Concerts in ${metro.city}, ${metro.state}`
  const description = `Discover free live music events and concerts in ${metro.city}. Find upcoming shows, venues, and performers. Updated daily.`

  return {
    title,
    description,
    keywords: [
      `free concerts ${metro.city}`,
      `free live music ${metro.city}`,
      `free shows ${metro.city}`,
      `live music ${metro.city}`,
      `concerts near me`,
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://www.freelivemusic.co/concerts/${city}`,
      siteName: 'Free Live Music',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://www.freelivemusic.co/concerts/${city}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

function joinList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function getCityInsights(concerts: Concert[], metro: ReturnType<typeof getMetroByCode>) {
  if (!metro || !concerts.length) return null

  const artistCounts = new Map<string, number>()
  const venueCounts = new Map<string, number>()
  const hoodCounts = new Map<string, number>()
  const genreCounts = new Map<string, number>()

  for (const c of concerts) {
    if (c.artist_name) artistCounts.set(c.artist_name, (artistCounts.get(c.artist_name) ?? 0) + 1)
    if (c.venue) venueCounts.set(c.venue, (venueCounts.get(c.venue) ?? 0) + 1)
    if (c.neighborhood) hoodCounts.set(c.neighborhood, (hoodCounts.get(c.neighborhood) ?? 0) + 1)
    if (c.genre) genreCounts.set(c.genre, (genreCounts.get(c.genre) ?? 0) + 1)
  }

  const topSeries = [...artistCounts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)

  const topVenues = [...venueCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)

  const topHoods = [...hoodCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)

  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)

  const lastDate = concerts.at(-1)?.date
  const lastDateLabel = lastDate
    ? new Date(lastDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return { topSeries, topVenues, topHoods, topGenres, lastDateLabel, total: concerts.length }
}

async function getConcertsByCity(metro: ReturnType<typeof getMetroByCode>): Promise<Concert[]> {
  if (!metro) return []
  const cityNames = [metro.city, ...(metro.aliases || [])]

  // Return mock data if no Supabase env vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return MOCK_CONCERTS.filter(c => c.city === metro.code)
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('concerts')
      .select('*')
      .in('city', cityNames)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(200)

    if (error || !data?.length) {
      return MOCK_CONCERTS.filter(c => c.city === metro.code)
    }
    return data as Concert[]
  } catch (error) {
    console.error(`Error fetching concerts for ${metro.city}:`, error)
    return MOCK_CONCERTS.filter(c => c.city === metro.code)
  }
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city: cityParam } = await params
  const citySlug = cityParam.toLowerCase()
  const cityCode = getCityCodeFromSlug(citySlug)

  // Handle invalid city
  if (!cityCode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-slate-900">City Not Found</h1>
            <p className="text-lg text-slate-600 mb-8">
              We don't have listings for that city yet. Try one of these:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {getAllCityCodes().map((code) => {
                const metro = getMetroByCode(code)
                const slug = cityCodeToSlug[code]
                if (!metro || !slug) return null

                return (
                  <Link
                    key={code}
                    href={`/concerts/${slug}`}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                  >
                    {metro.city}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const metro = getMetroByCode(cityCode)
  if (!metro) {
    return <div className="text-center py-20">City data not found</div>
  }

  const concerts = await getConcertsByCity(metro)
  const insights = getCityInsights(concerts, metro)
  const recurringSeries = computeRecurringSeries(concerts)

  // FAQPage structured data — answers vary by city based on real concert data
  const faqItems: { q: string; a: string }[] = [
    {
      q: `Are there free concerts in ${metro.city} this weekend?`,
      a: `Yes — check our free concerts in ${metro.city} this weekend page for the current weekend's shows. All events are free to attend with no tickets or cover charge.`,
    },
    {
      q: `Where can I see free live music in ${metro.city}?`,
      a: insights?.topVenues.length
        ? `Popular free music venues in ${metro.city} include ${insights.topVenues.join(', ')}. Browse all ${metro.city} venues for a full list.`
        : `${metro.city} hosts free concerts in parks, amphitheaters, plazas, and cultural institutions throughout the city. Browse our venues page for a full list.`,
    },
    {
      q: `Do I need tickets for free concerts in ${metro.city}?`,
      a: `Most free concerts in ${metro.city} are walk-up free — no tickets or reservation needed, just show up. Some events are free RSVP, which is noted on each listing.`,
    },
    ...(insights?.topGenres.length
      ? [{
          q: `What kinds of music are at free concerts in ${metro.city}?`,
          a: `Free concerts in ${metro.city} cover a wide range of genres including ${insights.topGenres.join(', ')}, and more. Check individual listings for genre details.`,
        }]
      : []),
    {
      q: `How often are new free concerts added for ${metro.city}?`,
      a: `This page is updated daily as new events are announced. ${insights?.lastDateLabel ? `Current listings run through ${insights.lastDateLabel}.` : 'Check back regularly for the latest shows.'}`,
    },
  ]

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  const itemListConcerts = concerts.slice(0, 20)
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Free Live Music in ${metro.city}`,
    description: `Upcoming free concerts in ${metro.city}, ${metro.state}`,
    url: `https://www.freelivemusic.co/concerts/${citySlug}`,
    numberOfItems: itemListConcerts.length,
    itemListElement: itemListConcerts.map((concert, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'MusicEvent',
        name: concert.artist_name,
        startDate: concert.time
          ? `${concert.date}T${concert.time}`
          : `${concert.date}T18:00:00`,
        location: {
          '@type': 'Place',
          name: concert.venue ?? metro.city,
          address: `${metro.city}, ${metro.state}`,
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Free Live Music in {metro.city}
          </h1>
          <p className="text-xl text-slate-600 mb-2">
            {concerts.length} upcoming concerts and live music events
          </p>
          <p className="text-slate-500">
            Discover free performances across {metro.city}. Venues and dates updated daily.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Quick date filter links */}
        <div className="flex flex-wrap gap-3 mb-8">
          <a
            href="#tonight"
            className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-medium hover:bg-blue-100 transition"
          >
            Tonight
          </a>
          <Link
            href={`/this-weekend/${citySlug}`}
            className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-medium hover:bg-blue-100 transition"
          >
            This Weekend
          </Link>
        </div>

        {concerts && concerts.length > 0 ? (
          <>
            {/* Tonight strip */}
            {(() => {
              const today = new Date().toISOString().split('T')[0]
              const tonightShows = concerts.filter((c) => c.date === today)
              if (!tonightShows.length) return null
              return (
                <section id="tonight" className="mb-10 scroll-mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-lg font-bold text-slate-900">
                      Live Tonight in {metro!.city}
                    </h2>
                    <span className="text-sm text-slate-500">({tonightShows.length} show{tonightShows.length !== 1 ? 's' : ''})</span>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {tonightShows.map((c) => (
                      <ConcertCard key={c.id} concert={c} />
                    ))}
                  </div>
                  <div className="border-t border-slate-200" />
                </section>
              )
            })()}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {concerts.map((concert) => (
                <ConcertCard key={concert.id} concert={concert} />
              ))}
            </div>

            {concerts.length >= 50 && (
              <div className="text-center py-8 border-t border-slate-200">
                <p className="text-slate-600 mb-4">
                  Showing {concerts.length} events. More coming soon!
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-lg">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">No Concerts Found</h2>
            <p className="text-slate-600 mb-6">
              There are no upcoming free concerts scheduled right now. Check back soon!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Back to Home
            </Link>
          </div>
        )}

        {/* Recurring Series */}
        {recurringSeries.length > 0 && (
          <section className="mt-8 pt-8 border-t border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Recurring Concert Series in {metro.city}
            </h2>
            <div className="flex flex-wrap gap-2">
              {recurringSeries.map((s) => (
                <Link
                  key={s.slug}
                  href={`/series/${citySlug}/${s.slug}`}
                  className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition text-sm"
                >
                  <span className="font-medium text-slate-800 group-hover:text-blue-700">
                    {s.artistName}
                  </span>
                  <span className="text-slate-400 text-xs">{s.count} shows</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Local SEO Content Section */}
      <section className="bg-slate-50 border-t border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Free Live Music in {metro.city}
              </h2>
              {insights ? (
                <>
                  <p className="text-slate-700 mb-4">
                    {metro.city} has {insights.total} free concert{insights.total !== 1 ? 's' : ''} coming up
                    {insights.topSeries.length > 0 && (
                      <>, including {joinList(insights.topSeries)}</>
                    )}.
                    {' '}All events are completely free — no tickets, no cover charges.
                  </p>
                  {insights.topVenues.length > 0 && (
                    <p className="text-slate-600 mb-4">
                      Shows take place at {joinList(insights.topVenues)}
                      {insights.topHoods.length > 0 && (
                        <> and other venues across {joinList(insights.topHoods)}</>
                      )}.
                      {insights.lastDateLabel && <> Events run through {insights.lastDateLabel}.</>}
                    </p>
                  )}
                  {insights.topGenres.length > 0 && (
                    <p className="text-slate-600">
                      Genres include {joinList(insights.topGenres)} and more.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-slate-700">
                  Looking for free live music in {metro.city}, {metro.state}? We curate verified
                  free events from parks, outdoor venues, festivals, and cultural institutions
                  across the city — no tickets, no cover charges.
                </p>
              )}
            </div>

            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Browse by Date</h2>
              <ul className="space-y-4">
                <li>
                  <Link
                    href={`/concerts/${cityParam}/tonight`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Free concerts in {metro.city} tonight →
                  </Link>
                  <p className="text-slate-600 text-sm mt-1">
                    Shows happening today — walk up and enjoy.
                  </p>
                </li>
                <li>
                  <Link
                    href={`/concerts/${cityParam}/this-weekend`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Free concerts this weekend in {metro.city} →
                  </Link>
                  <p className="text-slate-600 text-sm mt-1">
                    Friday through Sunday shows — plan your weekend.
                  </p>
                </li>
                <li>
                  <Link
                    href={`/venues/${cityCodeToSlug[cityCode]}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Free music venues in {metro.city} →
                  </Link>
                  <p className="text-slate-600 text-sm mt-1">
                    Bars, parks, and amphitheaters with live music.
                  </p>
                </li>
              </ul>
            </div>
          </div>

          {/* Other Cities Links for SEO */}
          <div className="mt-12 pt-8 border-t border-slate-300">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Free Music in Other Cities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {getAllCityCodes()
                .filter(code => code !== cityCode)
                .slice(0, 12)
                .map((code) => {
                  const m = getMetroByCode(code)
                  const slug = cityCodeToSlug[code]
                  if (!m || !slug) return null

                  return (
                    <Link
                      key={code}
                      href={`/concerts/${slug}`}
                      className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
                    >
                      {m.city}
                    </Link>
                  )
                })}
            </div>
          </div>

          {/* FAQ section — matches FAQPage JSON-LD above for rich results */}
          <div className="mt-12 pt-8 border-t border-slate-300">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Frequently Asked Questions
            </h2>
            <dl className="space-y-6">
              {faqItems.map(({ q, a }) => (
                <div key={q}>
                  <dt className="font-semibold text-slate-900 mb-1">{q}</dt>
                  <dd className="text-slate-600 text-sm leading-relaxed">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </div>
  )
}
