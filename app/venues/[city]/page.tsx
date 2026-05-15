export const revalidate = 86400

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { getCityCodeFromSlug, getMetroByCode, getAllMetros, cityCodeToSlug, cityToSlug } from '@/lib/city-slugs'
import { Venue } from '@/types'
import VenueListClient from './venue-list-client'
import SiteNav from '@/components/SiteNav'
import { VENUE_TYPE_CONFIGS } from './type-hub-page'
import SiteFooter from '@/components/SiteFooter'

export function generateStaticParams() {
  return getAllMetros().map((metro) => ({ city: cityCodeToSlug[metro.code] }))
}

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
  school: 'School / University',
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

async function getVenuesForCity(metroCode: string): Promise<VenueWithCount[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const today = new Date().toISOString().split('T')[0]

  const { data: venues } = await supabase
    .from('venues')
    .select('*')
    .eq('city', metroCode)
    .order('name', { ascending: true })

  if (!venues?.length) return []

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

  return (venues as Venue[])
    .map(v => ({ ...v, upcoming_show_count: countMap[v.id] || 0 }))
    .sort((a, b) =>
      b.upcoming_show_count - a.upcoming_show_count ||
      (b.music_score ?? -999) - (a.music_score ?? -999) ||
      a.name.localeCompare(b.name)
    )
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> }
): Promise<Metadata> {
  const { city: citySlug } = await params
  const metroCode = getCityCodeFromSlug(citySlug)
  if (!metroCode) return { title: 'Venues Not Found' }
  const metro = getMetroByCode(metroCode)
  if (!metro) return { title: 'Venues Not Found' }

  return {
    title: `Free Music Venues in ${metro.city} | Free Live Music`,
    description: `Discover parks, amphitheaters, bars, and restaurants with free live music in ${metro.city}, ${metro.state}. Updated regularly.`,
    alternates: { canonical: `https://www.freelivemusic.co/venues/${citySlug}` },
    openGraph: {
      title: `Free Music Venues in ${metro.city}`,
      description: `Find every venue with free live music in ${metro.city}.`,
      url: `https://www.freelivemusic.co/venues/${citySlug}`,
      siteName: 'Free Live Music',
      type: 'website',
    },
  }
}

export default async function VenueListPage(
  { params }: { params: Promise<{ city: string }> }
) {
  const { city: citySlug } = await params
  const metroCode = getCityCodeFromSlug(citySlug)
  if (!metroCode) notFound()
  const metro = getMetroByCode(metroCode!)
  if (!metro) notFound()

  const venues = await getVenuesForCity(metroCode!)

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Free Music Venues in ${metro.city}`,
    description: `Venues with free live music in ${metro.city}, ${metro.state}`,
    url: `https://www.freelivemusic.co/venues/${citySlug}`,
    numberOfItems: venues.length,
    itemListElement: venues.slice(0, 50).map((venue, index) => ({
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
              { label: 'Venues' },
            ]}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Free Music Venues
            </span>
            <span className="text-white"> in {metro.city}</span>
          </h1>
          <div className="flex items-center justify-between gap-4">
            <p className="text-slate-400">
              {venues.length} venue{venues.length !== 1 ? 's' : ''} · {venues.filter(v => v.upcoming_show_count > 0).length} with upcoming shows
            </p>
            <Link
              href={`/venues/${citySlug}/map`}
              className="shrink-0 flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
              Map view
            </Link>
          </div>
        </div>

        {venues.length > 0 && (
          <p className="text-slate-400 text-sm mb-8 max-w-2xl leading-relaxed">
            {venueIntro(venues, metro.city, metro.state ?? '')}
          </p>
        )}

        {venues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🎸</div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No venues listed yet</h3>
            <p className="text-slate-500 max-w-sm">
              We&apos;re still building out {metro.city}. Check back soon or{' '}
              <Link href="/" className="text-violet-400 hover:text-violet-300">browse concerts</Link>.
            </p>
          </div>
        ) : (
          <>
            <HubLinks venues={venues} citySlug={citySlug} />
            <VenueListClient
              venues={venues}
              citySlug={citySlug}
              cityName={metro.city}
              withShowsCount={venues.filter(v => v.upcoming_show_count > 0).length}
            />
          </>
        )}
      </main>

      <SiteFooter cityLine={`${metro.city} free music venues · All shows free admission`} venueTypeSlug={citySlug} />
    </div>
  )
}

type VenueMin = { venue_type: string | null; neighborhood: string | null; upcoming_show_count: number }

function venueIntro(venues: VenueMin[], cityName: string, state: string): string {
  const withShows = venues.filter(v => v.upcoming_show_count > 0).length

  const typeCounts: Record<string, number> = {}
  for (const v of venues) {
    const t = v.venue_type ?? 'other'
    typeCounts[t] = (typeCounts[t] || 0) + 1
  }
  const topTypes = Object.entries(typeCounts)
    .filter(([t]) => t !== 'other')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => venueTypeLabels[t] ?? t)

  const parts: string[] = []
  parts.push(
    `${cityName} has ${venues.length} venue${venues.length !== 1 ? 's' : ''} with free live music`
    + (state ? ` across ${cityName}, ${state}` : '') + '.'
  )
  if (withShows > 0) {
    parts.push(`${withShows} ${withShows === 1 ? 'venue has' : 'venues have'} upcoming shows scheduled.`)
  }
  if (topTypes.length > 0) {
    const list = topTypes.length === 1
      ? topTypes[0] + 's'
      : topTypes.slice(0, -1).join('s, ') + 's and ' + topTypes[topTypes.length - 1] + 's'
    parts.push(`Browse ${list} — all free to attend, no cover charge.`)
  }
  return parts.join(' ')
}

function HubLinks({ venues, citySlug }: { venues: VenueMin[]; citySlug: string }) {
  // Type hub links — only for types present in this city
  const typeCounts: Record<string, number> = {}
  for (const v of venues) {
    const t = v.venue_type ?? 'other'
    typeCounts[t] = (typeCounts[t] || 0) + 1
  }
  const presentTypes = VENUE_TYPE_CONFIGS.filter(c => (typeCounts[c.type] ?? 0) > 0)

  // Top neighborhoods by venue count
  const hoodCounts: Record<string, number> = {}
  for (const v of venues) {
    if (v.neighborhood) hoodCounts[v.neighborhood] = (hoodCounts[v.neighborhood] || 0) + 1
  }
  const topHoods = Object.entries(hoodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([hood]) => hood)

  if (presentTypes.length === 0 && topHoods.length === 0) return null

  return (
    <div className="mb-8 flex flex-col gap-4">
      {presentTypes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Browse by type</p>
          <div className="flex flex-wrap gap-2">
            {presentTypes.map(c => (
              <Link
                key={c.slug}
                href={`/venues/${citySlug}/${c.slug}`}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors hover:opacity-80 ${c.color}`}
              >
                {c.label} <span className="opacity-60">({typeCounts[c.type]})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {topHoods.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Browse by neighborhood</p>
          <div className="flex flex-wrap gap-2">
            {topHoods.map(hood => (
              <Link
                key={hood}
                href={`/venues/${citySlug}/neighborhood/${cityToSlug(hood)}`}
                className="text-xs font-medium px-3 py-1.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white transition-colors"
              >
                {hood}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
