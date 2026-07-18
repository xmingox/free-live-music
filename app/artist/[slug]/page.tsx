export const revalidate = 21600
export async function generateStaticParams() { return [] }

import { Metadata } from 'next'
import { getUsToday } from '@/lib/timezone'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Concert } from '@/types'
import ConcertCard from '@/components/ConcertCard'
import { createClient } from '@supabase/supabase-js'
import { cityCodeToSlug, getMetroByCode } from '@/lib/city-slugs'
import { seriesSlug } from '@/lib/series'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'
import { buildMusicGroupJsonLd } from '@/lib/jsonld'

async function resolveArtist(slug: string): Promise<{ artistName: string; concerts: Concert[] } | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const today = getUsToday()

  // Step 1: ILIKE match — convert slug to approximate name for fast lookup
  const nameGuess = decodeURIComponent(slug).replace(/-/g, ' ')
  const { data: guessRows } = await supabase
    .from('concerts')
    .select('artist_name')
    .ilike('artist_name', nameGuess)
    .gte('date', today)
    .eq('is_verified', true)
    .limit(5)

  let artistName = (guessRows ?? []).find(
    (r) => seriesSlug(r.artist_name) === slug
  )?.artist_name

  // Step 2: Fallback — fetch distinct names and match by slug
  if (!artistName) {
    const { data: allRows } = await supabase
      .from('concerts')
      .select('artist_name')
      .gte('date', today)
      .eq('is_verified', true)
      .not('artist_name', 'is', null)
      .limit(2000)

    artistName = (allRows ?? []).find(
      (r) => seriesSlug(r.artist_name) === slug
    )?.artist_name
  }

  if (!artistName) return null

  // Fetch all upcoming concerts for this artist across all cities
  const { data: concerts } = await supabase
    .from('concerts')
    .select('*')
    .eq('artist_name', artistName)
    .gte('date', today)
    .eq('is_verified', true)
    .order('date', { ascending: true })
    .limit(100)

  return { artistName, concerts: (concerts ?? []) as Concert[] }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const result = await resolveArtist(slug)
  if (!result) return { title: 'Artist Not Found', robots: { index: false, follow: true } }

  const { artistName, concerts } = result
  const cityCount = new Set(concerts.map((c) => c.city)).size
  const title = `${artistName} — Free Concert Schedule | Free Live Music`
  const description = cityCount > 1
    ? `Upcoming free shows by ${artistName} across ${cityCount} cities. No tickets or cover charge needed.`
    : `Upcoming free shows by ${artistName}. No tickets or cover charge needed.`

  return {
    title,
    description,
    alternates: { canonical: `https://www.freelivemusic.co/artist/${slug}` },
    openGraph: { title, description, url: `https://www.freelivemusic.co/artist/${slug}`, siteName: 'Free Live Music', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const result = await resolveArtist(slug)
  if (!result) notFound()

  const { artistName, concerts } = result

  // Group concerts by city for display
  const byCity = new Map<string, Concert[]>()
  for (const c of concerts) {
    const arr = byCity.get(c.city) ?? []
    arr.push(c)
    byCity.set(c.city, arr)
  }

  const cities = [...byCity.keys()]
  const primaryCity = cities[0]
  const primaryCitySlug = primaryCity ? cityCodeToSlug[primaryCity] ?? 'new-york' : 'new-york'
  const primaryMetro = primaryCity ? getMetroByCode(primaryCity) : null

  const jsonLd = buildMusicGroupJsonLd({
    name: artistName,
    url: `https://www.freelivemusic.co/artist/${slug}`,
    events: concerts.slice(0, 10).map((c) => {
      const metro = getMetroByCode(c.city)
      return {
        name: c.artist_name,
        startDate: c.time ? `${c.date}T${c.time}` : c.date,
        location: {
          name: c.venue ?? undefined,
          address: {
            addressLocality: metro?.city ?? c.city,
            addressRegion: metro?.state,
          },
        },
        offers: { price: '0' as const, priceCurrency: 'USD', availability: 'https://schema.org/InStock' as const },
        url: `https://www.freelivemusic.co/concert/${c.slug}`,
      }
    }),
  })

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <SiteNav
            venuesHref={`/venues/${primaryCitySlug}`}
            breadcrumbs={[
              { label: 'Free Live Music', href: '/' },
              { label: 'Artist Schedule', href: '/' },
              { label: artistName },
            ]}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">
            Free Concert Schedule
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
            {artistName}
          </h1>
          <p className="text-slate-400">
            {concerts.length} upcoming free show{concerts.length !== 1 ? 's' : ''}
            {cities.length > 1 ? ` across ${cities.length} cities` : primaryMetro ? ` in ${primaryMetro.city}` : ''}
            {' '}· No cover charge
          </p>
        </div>

        {concerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🎵</div>
            <h2 className="text-xl font-semibold text-slate-300 mb-2">No upcoming shows</h2>
            <p className="text-slate-500 max-w-sm mb-6">
              No upcoming free concerts found for {artistName}. Check back later or browse all upcoming shows.
            </p>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
            >
              Browse free music →
            </Link>
          </div>
        ) : cities.length > 1 ? (
          // Multi-city: group by city
          <>
            {[...byCity.entries()].map(([cityCode, cityConcerts]) => {
              const metro = getMetroByCode(cityCode)
              const cityName = metro?.city ?? cityCode
              const citySlug = cityCodeToSlug[cityCode] ?? cityCode.toLowerCase()
              return (
                <section key={cityCode} className="mb-12">
                  <h2 className="text-base font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
                    <Link href={`/concerts/${citySlug}`} className="hover:text-violet-300 transition-colors">
                      {cityName}
                    </Link>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cityConcerts.map((c) => (
                      <ConcertCard key={c.id} concert={c} />
                    ))}
                  </div>
                </section>
              )
            })}
          </>
        ) : (
          // Single city: flat grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {concerts.map((c) => (
              <ConcertCard key={c.id} concert={c} />
            ))}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-sm">
          {primaryCitySlug && (
            <Link href={`/concerts/${primaryCitySlug}`} className="text-violet-400 hover:text-violet-300 transition-colors">
              More free music in {primaryMetro?.city ?? 'your city'} →
            </Link>
          )}
          <Link href="/" className="text-slate-400 hover:text-slate-300 transition-colors">
            Browse all cities →
          </Link>
        </div>
      </main>

      <SiteFooter
        cityLine={`Free concerts by ${artistName} · No cover charge`}
        venueTypeSlug={primaryCitySlug}
      />
    </div>
  )
}
