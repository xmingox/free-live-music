export const revalidate = 86400

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { getCityCodeFromSlug, getMetroByCode, cityCodeToSlug } from '@/lib/city-slugs'
import { Venue } from '@/types'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'
import { cityToSlug } from '@/lib/city-slugs'
import { venueConfidence, CONFIDENCE_CONFIG } from '@/lib/venue-confidence'

const venueTypeLabels: Record<string, string> = {
  park: 'Park',
  amphitheater: 'Amphitheater',
  plaza: 'Plaza',
  bar: 'Bar',
  restaurant: 'Restaurant',
  brewery: 'Brewery',
  mall: 'Mall',
  farmers_market: "Farmers' Market",
  church: 'Church',
  library: 'Library',
  school: 'School',
  museum: 'Museum',
  community_center: 'Community Center',
  rooftop: 'Rooftop',
  other: 'Venue',
}

const venueTypeColors: Record<string, string> = {
  park: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  amphitheater: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  plaza: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  bar: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  restaurant: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  brewery: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  farmers_market: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
  church: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  library: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  school: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  museum: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  community_center: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  rooftop: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  other: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

type VenueWithCount = Venue & { upcoming_show_count: number }

async function getNeighborhoodData(metroCode: string, hoodSlug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get all distinct neighborhoods for this city to find the canonical name
  const { data: neighborhoodRows } = await supabase
    .from('venues')
    .select('neighborhood')
    .eq('city', metroCode)
    .not('neighborhood', 'is', null)

  const allNeighborhoods = [...new Set((neighborhoodRows ?? []).map(r => r.neighborhood as string))]
  const neighborhood = allNeighborhoods.find(n => cityToSlug(n) === hoodSlug)
  if (!neighborhood) return null

  const today = new Date().toISOString().split('T')[0]

  const { data: venues } = await supabase
    .from('venues')
    .select('*')
    .eq('city', metroCode)
    .eq('neighborhood', neighborhood)
    .order('name', { ascending: true })

  if (!venues?.length) return { neighborhood, venues: [] }

  const venueIds = venues.map(v => v.id)
  const { data: counts } = await supabase
    .from('concerts')
    .select('venue_id')
    .in('venue_id', venueIds)
    .gte('date', today)

  const countMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    if (row.venue_id) countMap[row.venue_id] = (countMap[row.venue_id] || 0) + 1
  }

  const venuesWithCounts: VenueWithCount[] = (venues as Venue[])
    .map(v => ({ ...v, upcoming_show_count: countMap[v.id] || 0 }))
    .sort((a, b) =>
      b.upcoming_show_count - a.upcoming_show_count ||
      (b.music_score ?? -999) - (a.music_score ?? -999) ||
      a.name.localeCompare(b.name)
    )

  return { neighborhood, venues: venuesWithCounts }
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string; hood: string }> }
): Promise<Metadata> {
  const { city: citySlug, hood: hoodSlug } = await params
  const metroCode = getCityCodeFromSlug(citySlug)
  if (!metroCode) return { title: 'Venues Not Found' }
  const metro = getMetroByCode(metroCode)
  if (!metro) return { title: 'Venues Not Found' }

  const result = await getNeighborhoodData(metroCode, hoodSlug)
  const neighborhood = result?.neighborhood ?? hoodSlug
  const url = `https://www.freelivemusic.co/venues/${citySlug}/neighborhood/${hoodSlug}`

  return {
    title: `Free Live Music in ${neighborhood}, ${metro.city} | Free Live Music`,
    description: `Find venues with free live music in ${neighborhood}, ${metro.city}. Parks, bars, breweries, and more — all free admission.`,
    alternates: { canonical: url },
    openGraph: {
      title: `Free Live Music in ${neighborhood}, ${metro.city}`,
      description: `Venues with free live music in ${neighborhood}.`,
      url,
      siteName: 'Free Live Music',
      type: 'website',
    },
  }
}

export default async function NeighborhoodPage(
  { params }: { params: Promise<{ city: string; hood: string }> }
) {
  const { city: citySlug, hood: hoodSlug } = await params
  const metroCode = getCityCodeFromSlug(citySlug)
  if (!metroCode) notFound()
  const metro = getMetroByCode(metroCode!)
  if (!metro) notFound()

  const result = await getNeighborhoodData(metroCode!, hoodSlug)
  if (!result) notFound()

  const { neighborhood, venues } = result
  const withShowsCount = venues.filter(v => v.upcoming_show_count > 0).length

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Free Music Venues in ${neighborhood}, ${metro.city}`,
    description: `Venues with free live music in ${neighborhood}, ${metro.city}, ${metro.state}`,
    url: `https://www.freelivemusic.co/venues/${citySlug}/neighborhood/${hoodSlug}`,
    numberOfItems: venues.length,
    itemListElement: venues.map((venue, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'MusicVenue',
        name: venue.name,
        address: {
          '@type': 'PostalAddress',
          addressLocality: metro.city,
          addressRegion: metro.state,
        },
        url: `https://www.freelivemusic.co/venues/${citySlug}/${venue.slug}`,
      },
    })),
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <SiteNav
            venuesHref={`/venues/${citySlug}`}
            breadcrumbs={[
              { label: 'Free Live Music', href: '/' },
              { label: metro.city, href: `/?city=${metroCode}` },
              { label: 'Venues', href: `/venues/${citySlug}` },
              { label: neighborhood },
            ]}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Free Live Music
            </span>
            <span className="text-white"> in {neighborhood}</span>
          </h1>
          <p className="text-slate-400">
            {venues.length} venue{venues.length !== 1 ? 's' : ''} with free live music in {neighborhood}, {metro.city}
            {withShowsCount > 0 && (
              <span className="ml-2 text-emerald-400 font-medium">· {withShowsCount} with upcoming shows</span>
            )}
          </p>
        </div>

        {venues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No venues listed in {neighborhood}</h3>
            <p className="text-slate-500 max-w-sm">
              <Link href={`/venues/${citySlug}`} className="text-violet-400 hover:text-violet-300">
                Browse all {metro.city} venues
              </Link>
            </p>
          </div>
        ) : (
          <>
            {withShowsCount > 0 && (
              <div className="mb-6 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <p className="text-emerald-300 text-sm font-medium">
                  {withShowsCount} venue{withShowsCount !== 1 ? 's' : ''} in {neighborhood} have upcoming free shows
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {venues.map((venue) => {
                const typeColor = venueTypeColors[venue.venue_type ?? 'other'] ?? venueTypeColors.other
                const typeLabel = venueTypeLabels[venue.venue_type ?? 'other'] ?? 'Venue'
                const conf = venueConfidence({ upcoming_show_count: venue.upcoming_show_count, music_score: venue.music_score })
                const confConfig = CONFIDENCE_CONFIG[conf]
                const isUnverified = conf === 'unverified'
                return (
                  <Link
                    key={venue.id}
                    href={`/venues/${citySlug}/${venue.slug}`}
                    className={`group flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-black/30 p-5 ${
                      isUnverified
                        ? 'bg-slate-800/40 border border-slate-700/40 hover:border-slate-600 hover:bg-slate-800/60'
                        : 'bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColor}`}>
                        {typeLabel}
                      </span>
                      {venue.indoor_outdoor && (
                        <span className="text-xs text-slate-500 capitalize">{venue.indoor_outdoor}</span>
                      )}
                    </div>
                    <h2 className={`text-base font-bold leading-tight group-hover:text-violet-200 transition-colors mb-1 ${isUnverified ? 'text-slate-300' : 'text-white'}`}>
                      {venue.name}
                    </h2>
                    <div className="mt-auto flex items-center gap-1.5">
                      {venue.upcoming_show_count > 0 ? (
                        <span className="text-xs font-semibold text-emerald-400">
                          {venue.upcoming_show_count} upcoming show{venue.upcoming_show_count !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${confConfig.dotColor}`} />
                          <span className={`text-xs ${confConfig.cardText}`}>{confConfig.cardNote}</span>
                        </>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="mt-10">
              <Link href={`/venues/${citySlug}`} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                ← All {metro.city} venues
              </Link>
            </div>
          </>
        )}
      </main>

      <SiteFooter cityLine={`Free live music in ${neighborhood}, ${metro.city}`} venueTypeSlug={citySlug} />
    </div>
  )
}
