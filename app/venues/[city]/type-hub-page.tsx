import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { getCityCodeFromSlug, getMetroByCode, cityCodeToSlug } from '@/lib/city-slugs'
import { Venue } from '@/types'
import SiteNav from '@/components/SiteNav'

export type VenueTypeConfig = {
  type: string
  label: string          // e.g. "Bars"
  singular: string       // e.g. "Bar"
  slug: string           // e.g. "bars" (URL segment)
  description: string    // short prose for the page subtitle
  color: string          // Tailwind classes for badges
}

export const VENUE_TYPE_CONFIGS: VenueTypeConfig[] = [
  {
    type: 'bar',
    label: 'Bars',
    singular: 'Bar',
    slug: 'bars',
    description: 'bars and live music venues',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    type: 'brewery',
    label: 'Breweries',
    singular: 'Brewery',
    slug: 'breweries',
    description: 'breweries and taprooms with live music',
    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  {
    type: 'park',
    label: 'Parks',
    singular: 'Park',
    slug: 'parks',
    description: 'parks and outdoor venues with free concerts',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    type: 'restaurant',
    label: 'Restaurants',
    singular: 'Restaurant',
    slug: 'restaurants',
    description: 'restaurants with free live music',
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  {
    type: 'amphitheater',
    label: 'Amphitheaters',
    singular: 'Amphitheater',
    slug: 'amphitheaters',
    description: 'amphitheaters and outdoor stages',
    color: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  },
]

type VenueWithCount = Venue & { upcoming_show_count: number }

async function getVenuesByType(metroCode: string, venueType: string): Promise<VenueWithCount[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const today = new Date().toISOString().split('T')[0]

  const { data: venues } = await supabase
    .from('venues')
    .select('*')
    .eq('city', metroCode)
    .eq('venue_type', venueType)
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
    .sort((a, b) => b.upcoming_show_count - a.upcoming_show_count || a.name.localeCompare(b.name))
}

export async function generateTypeHubMetadata(
  citySlug: string,
  config: VenueTypeConfig
): Promise<Metadata> {
  const metroCode = getCityCodeFromSlug(citySlug)
  if (!metroCode) return { title: 'Venues Not Found' }
  const metro = getMetroByCode(metroCode)
  if (!metro) return { title: 'Venues Not Found' }

  const title = `Free Music ${config.label} in ${metro.city} | Free Live Music`
  const description = `Find ${config.description} in ${metro.city}, ${metro.state} with free admission. Discover venues with upcoming free shows.`
  const url = `https://www.freelivemusic.co/venues/${citySlug}/${config.slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `Free Music ${config.label} in ${metro.city}`,
      description,
      url,
      siteName: 'Free Live Music',
      type: 'website',
    },
  }
}

export default async function TypeHubPage({
  citySlug,
  config,
}: {
  citySlug: string
  config: VenueTypeConfig
}) {
  const metroCode = getCityCodeFromSlug(citySlug)
  if (!metroCode) notFound()
  const metro = getMetroByCode(metroCode!)
  if (!metro) notFound()

  const venues = await getVenuesByType(metroCode!, config.type)
  const withShowsCount = venues.filter(v => v.upcoming_show_count > 0).length

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <SiteNav
            venuesHref={`/venues/${citySlug}`}
            breadcrumbs={[
              { label: 'Free Live Music', href: '/' },
              { label: metro.city, href: `/?city=${metroCode}` },
              { label: 'Venues', href: `/venues/${citySlug}` },
              { label: config.label },
            ]}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Free Music {config.label}
            </span>
            <span className="text-white"> in {metro.city}</span>
          </h1>
          <p className="text-slate-400">
            {venues.length} {venues.length !== 1 ? config.label.toLowerCase() : config.singular.toLowerCase()} with free live music in {metro.city}, {metro.state}
            {withShowsCount > 0 && (
              <span className="ml-2 text-emerald-400 font-medium">· {withShowsCount} with upcoming shows</span>
            )}
          </p>
        </div>

        {venues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No {config.label.toLowerCase()} listed yet</h3>
            <p className="text-slate-500 max-w-sm mb-6">
              We&apos;re still adding {config.description} in {metro.city}.{' '}
              <Link href={`/venues/${citySlug}`} className="text-violet-400 hover:text-violet-300">
                Browse all {metro.city} venues
              </Link>{' '}
              or{' '}
              <Link href="/" className="text-violet-400 hover:text-violet-300">browse concerts</Link>.
            </p>
          </div>
        ) : (
          <>
            {/* Shows strip */}
            {withShowsCount > 0 && (
              <div className="mb-6 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <p className="text-emerald-300 text-sm font-medium">
                  {withShowsCount} of these {config.label.toLowerCase()} have upcoming free shows
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {venues.map((venue) => (
                <Link
                  key={venue.id}
                  href={`/venues/${citySlug}/${venue.slug}`}
                  className="group flex flex-col bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden hover:border-slate-600 hover:bg-slate-800 transition-all duration-200 hover:shadow-xl hover:shadow-black/30 p-5"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.color}`}>
                      {config.singular}
                    </span>
                    {venue.indoor_outdoor && (
                      <span className="text-xs text-slate-500 capitalize">{venue.indoor_outdoor}</span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-white leading-tight group-hover:text-violet-200 transition-colors mb-1">
                    {venue.name}
                  </h2>
                  {venue.neighborhood && (
                    <p className="text-sm text-slate-400 mb-3">{venue.neighborhood}</p>
                  )}
                  <div className="mt-auto">
                    {venue.upcoming_show_count > 0 ? (
                      <span className="text-xs font-semibold text-emerald-400">
                        {venue.upcoming_show_count} upcoming show{venue.upcoming_show_count !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">No upcoming shows listed</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10">
              <Link href={`/venues/${citySlug}`} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                ← All {metro.city} venues
              </Link>
            </div>
          </>
        )}
      </main>

      <footer className="mt-16 border-t border-slate-800 py-8 text-center text-slate-600 text-sm">
        Free Live Music · Free Music {config.label} in {metro.city}
      </footer>
    </div>
  )
}
