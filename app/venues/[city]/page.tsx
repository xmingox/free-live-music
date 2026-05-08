export const revalidate = 3600

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { getCityCodeFromSlug, getMetroByCode } from '@/lib/city-slugs'
import { Venue } from '@/types'

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
    .sort((a, b) => b.upcoming_show_count - a.upcoming_show_count || a.name.localeCompare(b.name))
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1 text-sm text-slate-400 flex-wrap">
              <li><Link href="/" className="hover:text-white transition-colors">Free Live Music</Link></li>
              <li aria-hidden="true" className="text-slate-600">/</li>
              <li><Link href={`/?city=${metroCode}`} className="hover:text-white transition-colors">{metro.city}</Link></li>
              <li aria-hidden="true" className="text-slate-600">/</li>
              <li className="text-slate-200" aria-current="page">Venues</li>
            </ol>
          </nav>
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
          <p className="text-slate-400">
            {venues.length} venue{venues.length !== 1 ? 's' : ''} with free live music in {metro.city}, {metro.state}
          </p>
        </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map((venue) => {
              const typeColor = venueTypeColors[venue.venue_type ?? 'other'] ?? venueTypeColors.other
              const typeLabel = venueTypeLabels[venue.venue_type ?? 'other'] ?? 'Venue'
              return (
                <Link
                  key={venue.id}
                  href={`/venues/${citySlug}/${venue.slug}`}
                  className="group flex flex-col bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden hover:border-slate-600 hover:bg-slate-800 transition-all duration-200 hover:shadow-xl hover:shadow-black/30 p-5"
                >
                  <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mt-5 -mx-5 mb-4 w-[calc(100%+2.5rem)]" />
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColor}`}>
                      {typeLabel}
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
              )
            })}
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-slate-800 py-8 text-center text-slate-600 text-sm">
        Free Live Music · {metro.city} Free Music Venues
      </footer>
    </div>
  )
}
