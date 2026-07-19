import { Metadata } from 'next'
import { getUsToday } from '@/lib/timezone'
import Link from 'next/link'
import { Concert } from '@/types'
import ConcertCard from '@/components/ConcertCard'
import { createClient } from '@supabase/supabase-js'
import { MOCK_CONCERTS } from '@/lib/mock-data'
import { notFound } from 'next/navigation'
import {
  getCityCodeFromSlug,
  getMetroByCode,
  getAllCityCodes,
  cityCodeToSlug,
  cityToSlug,
  getAliasCityFromSlug,
} from '@/lib/city-slugs'
import { computeRecurringSeries } from '@/lib/series'
import { buildFaqPageJsonLd, buildItemListJsonLd } from '@/lib/jsonld'
import { CITY_GUIDES } from '@/lib/city-guides-data'
import { CITY_MIN_UPCOMING, countIndexable } from '@/lib/city-visibility'
import { getCityFallback } from '@/lib/city-fallback'
import { getActiveResidencies, scheduleLabel, residencySchedule } from '@/lib/residencies'

export const revalidate = 86400 // 24h: this page queries Supabase directly (getConcertsByCity) and is NOT tag-covered, so new events surface within a day, not on import

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const today = getUsToday()
  // Count indexable upcoming events the SAME way the page body does
  // (isIndexableUpcoming: verified, not TBA, not cancelled) and over the same
  // set of city codes (metro + aliases) the body renders — so the noindex
  // decision here can never disagree with the degraded view the body shows.
  const cityNames = [metro.city, ...(metro.aliases || [])]
  const { count: upcomingCount } = await supabase
    .from('concerts')
    .select('id', { count: 'exact', head: true })
    .in('city', cityNames)
    .gte('date', today)
    .eq('is_verified', true)
    .eq('is_tbd', false)
    .eq('is_cancelled', false)

  const sparse = (upcomingCount ?? 0) < CITY_MIN_UPCOMING
  // A city with published year-round residencies has durable, indexable content
  // even when its dated-event count is thin — so it should NOT be noindexed just
  // for being off-season. This is the whole point of the residency inventory.
  const residencies = await getActiveResidencies(cityCode)
  const indexable = !sparse || residencies.length > 0

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
      types: {
        'application/atom+xml': `https://www.freelivemusic.co/concerts/${city}/feed.xml`,
      },
    },
    robots: {
      index: indexable,
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
    const today = getUsToday()
    const { data, error } = await supabase
      .from('concerts')
      .select('*')
      .in('city', cityNames)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(200)

    if (error) {
      console.error(`Error fetching concerts for ${metro.city}:`, error)
      return []
    }
    // A genuinely empty city returns [] (not mock) so the graceful-degradation
    // view actually triggers. Mock data is dev-only (missing env, handled above)
    // — surfacing fabricated events on a real city page would violate the
    // "no unverified events" invariant and hide the empty state we want to show.
    return (data ?? []) as Concert[]
  } catch (error) {
    console.error(`Error fetching concerts for ${metro.city}:`, error)
    return []
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

  if (!cityCode) notFound()

  const metro = getMetroByCode(cityCode)
  if (!metro) notFound()

  const concerts = await getConcertsByCity(metro)
  const insights = getCityInsights(concerts, metro)
  const recurringSeries = computeRecurringSeries(concerts)

  // Graceful degradation: use the SAME "indexable upcoming" definition the
  // metadata/sitemap use, so what the user sees (rich fallback) and what
  // crawlers see (noindex) always agree. When sparse, pull series history,
  // top venues, and nearby cities with events (all cached, concerts-tagged).
  const indexableUpcoming = countIndexable(concerts)
  const sparse = indexableUpcoming < CITY_MIN_UPCOMING
  const fallback = sparse ? await getCityFallback(cityCode) : null

  // Published year-round free residencies (renders as schedules, never as
  // synthetic dated events). This is the cliff-proof inventory.
  const residencies = await getActiveResidencies(cityCode)

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

  const faqJsonLd = buildFaqPageJsonLd(
    faqItems.map(({ q, a }) => ({ question: q, answer: a }))
  )

  const itemListConcerts = concerts.slice(0, 20)
  const itemListJsonLd = buildItemListJsonLd({
    name: `Free Live Music in ${metro.city}`,
    description: `Upcoming free concerts in ${metro.city}, ${metro.state}`,
    url: `https://www.freelivemusic.co/concerts/${citySlug}`,
    numberOfItems: itemListConcerts.length,
    items: itemListConcerts.map((concert, index) => ({
      type: 'MusicEvent' as const,
      position: index + 1,
      event: {
        name: concert.artist_name,
        startDate: concert.time
          ? `${concert.date}T${concert.time}`
          : `${concert.date}T18:00:00`,
        location: {
          name: concert.venue ?? metro.city,
          address: `${metro.city}, ${metro.state}`,
        },
        offers: { price: '0' as const, priceCurrency: 'USD', availability: 'https://schema.org/InStock' as const },
        url: `https://www.freelivemusic.co/concert/${concert.slug}`,
      },
    })),
  })

  // EventSeries JSON-LD for published residencies — honest structured data
  // (real venue, free offer), no fabricated dated instances.
  const residencyJsonLd = residencies.map((r) => ({
    '@context': 'https://schema.org',
    '@type': 'EventSeries',
    name: r.seriesName,
    ...(r.description ? { description: r.description } : {}),
    ...(r.venueName
      ? {
          location: {
            '@type': 'Place',
            name: r.venueName,
            address: {
              '@type': 'PostalAddress',
              addressLocality: metro.city,
              addressRegion: metro.state,
            },
          },
        }
      : {}),
    eventSchedule: residencySchedule(r),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    url: `https://www.freelivemusic.co/concerts/${citySlug}`,
  }))

  // Headline is derived from the data, not hardcoded: "every night" only when a
  // daily residency actually exists, so the claim can never outrun the rows.
  const residenciesNightly = residencies.some((r) => r.recurrence === 'daily')

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {residencyJsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(residencyJsonLd) }}
        />
      )}
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
          <Link
            href={`/tonight/${citySlug}`}
            className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-medium hover:bg-blue-100 transition"
          >
            Tonight
          </Link>
          <Link
            href={`/this-weekend/${citySlug}`}
            className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-medium hover:bg-blue-100 transition"
          >
            This Weekend
          </Link>
          {CITY_GUIDES[citySlug] && (
            <Link
              href={`/free-live-music/${citySlug}`}
              className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-full text-sm font-medium hover:bg-slate-100 transition"
            >
              Year-Round Guide →
            </Link>
          )}
        </div>

        {/* Year-round free residencies — the cliff-proof inventory. Renders as
            SCHEDULES (never synthetic dated rows), so it stays true off-season. */}
        {residencies.length > 0 && (
          <section className="mb-10 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h2 className="text-lg font-bold text-slate-900">
                Free live music {residenciesNightly ? 'every night ' : ''}in {metro.city}
              </h2>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              Year-round free residencies — no tickets, no cover, on a regular schedule.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {residencies.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-slate-900">{r.venueName ?? r.seriesName}</p>
                    <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Free
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{r.description}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    <span className="font-medium text-slate-700">{scheduleLabel(r)}</span>
                    {r.time ? ` · ${r.time}` : ''}
                    {r.genre ? ` · ${r.genre}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Thin-season degraded view — keeps the page useful (and non-empty for
            crawlers) during the autumn supply cliff: recurring-series history
            with a "typically returns" hint, top venues, and nearby cities that
            do have upcoming shows. */}
        {sparse && (
          <div className="mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-6">
            <p className="text-sm text-slate-500">
              {indexableUpcoming === 0
                ? `No upcoming free concerts are on the calendar in ${metro.city} right now. Many of ${metro.city}'s free music series run seasonally — here's what typically returns, plus nearby cities with shows this season.`
                : `${indexableUpcoming} upcoming show${indexableUpcoming !== 1 ? 's' : ''} on the calendar in ${metro.city} right now. More are added as venues announce their schedules — here's what usually runs here, plus where to find free music nearby.`}
            </p>

            {/* Recurring series that typically return */}
            {fallback && fallback.recurringSeries.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-3">
                  Free music series in {metro.city}
                </h2>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {fallback.recurringSeries.slice(0, 6).map((s) => (
                    <li key={s.slug + (s.venue ?? '')} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <Link
                        href={`/series/${citySlug}/${s.slug}`}
                        className="font-medium text-slate-800 hover:text-blue-700 transition"
                      >
                        {s.artistName}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {s.venue ? `${s.venue} · ` : ''}
                        {s.occurrences} show{s.occurrences !== 1 ? 's' : ''} on record
                        {s.dormant
                          ? ` · last hosted ${new Date(s.lastDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                          : ' · currently running'}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Nearby cities that have upcoming events */}
            {fallback && fallback.nearby.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-3">
                  Free concerts near {metro.city}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {fallback.nearby.map((n) => (
                    <Link
                      key={n.code}
                      href={`/concerts/${n.slug}`}
                      className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition text-sm"
                    >
                      <span className="font-medium text-slate-800 group-hover:text-blue-700">{n.cityName}</span>
                      <span className="text-slate-400 text-xs">{n.upcomingCount} shows · {n.distanceMi} mi</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Top venues from the city's history */}
            {fallback && fallback.topVenues.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-3">
                  Venues that host free music in {metro.city}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {fallback.topVenues.map((v) => (
                    <span
                      key={v.name}
                      className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm text-slate-700"
                    >
                      {v.name}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/venues/${citySlug}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition mt-3"
                >
                  Browse all {metro.city} music venues →
                </Link>
              </div>
            )}

            {/* Year-round guide */}
            {CITY_GUIDES[citySlug] && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-slate-700 text-sm leading-relaxed mb-2">
                  {CITY_GUIDES[citySlug].intro.split('. ').slice(0, 2).join('. ') + '.'}
                </p>
                <Link
                  href={`/free-live-music/${citySlug}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-violet-700 hover:text-violet-600 transition"
                >
                  Read the full {metro.city} free music guide →
                </Link>
              </div>
            )}
          </div>
        )}

        {concerts && concerts.length > 0 ? (
          <>
            {/* Tonight strip */}
            {(() => {
              const today = getUsToday()
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
                    href={`/tonight/${citySlug}`}
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
                    href={`/this-week/${citySlug}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Free concerts this week in {metro.city} →
                  </Link>
                  <p className="text-slate-600 text-sm mt-1">
                    Monday through Friday shows — weekday free music.
                  </p>
                </li>
                <li>
                  <Link
                    href={`/this-weekend/${citySlug}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Free concerts this weekend in {metro.city} →
                  </Link>
                  <p className="text-slate-600 text-sm mt-1">
                    Saturday and Sunday shows — plan your weekend.
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
