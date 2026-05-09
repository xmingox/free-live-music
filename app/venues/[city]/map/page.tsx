export const revalidate = 3600

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { getCityCodeFromSlug, getMetroByCode, getAllMetros, cityCodeToSlug } from '@/lib/city-slugs'
import { Venue } from '@/types'
import SiteNav from '@/components/SiteNav'
import VenueMapWrapper from './VenueMapWrapper'

export function generateStaticParams() {
  return getAllMetros().map(metro => ({ city: cityCodeToSlug[metro.code] }))
}

async function getVenuesForMap(metroCode: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('venues')
    .select('id, slug, name, venue_type, neighborhood, lat, lng')
    .eq('city', metroCode)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('name', { ascending: true })
  return (data ?? []) as Pick<Venue, 'id' | 'slug' | 'name' | 'venue_type' | 'neighborhood' | 'lat' | 'lng'>[]
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> }
): Promise<Metadata> {
  const { city: citySlug } = await params
  const metroCode = getCityCodeFromSlug(citySlug)
  if (!metroCode) return { title: 'Map Not Found' }
  const metro = getMetroByCode(metroCode)
  if (!metro) return { title: 'Map Not Found' }
  return {
    title: `Free Music Venues Map — ${metro.city} | Free Live Music`,
    description: `Interactive map of parks, bars, amphitheaters, and other venues with free live music in ${metro.city}.`,
    alternates: { canonical: `https://www.freelivemusic.co/venues/${citySlug}/map` },
  }
}

export default async function VenueMapPage(
  { params }: { params: Promise<{ city: string }> }
) {
  const { city: citySlug } = await params
  const metroCode = getCityCodeFromSlug(citySlug)
  if (!metroCode) notFound()
  const metro = getMetroByCode(metroCode!)
  if (!metro) notFound()

  const venues = await getVenuesForMap(metroCode!)

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <SiteNav
            venuesHref={`/venues/${citySlug}`}
            breadcrumbs={[
              { label: 'Free Live Music', href: '/' },
              { label: metro.city, href: `/?city=${metroCode}` },
              { label: 'Venues', href: `/venues/${citySlug}` },
              { label: 'Map' },
            ]}
          />
        </div>
      </header>

      <div className="shrink-0 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white">
            Free Music Venues · {metro.city}
          </h1>
          <p className="text-xs text-slate-500">{venues.length} venues on map</p>
        </div>
        <Link
          href={`/venues/${citySlug}`}
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          ← List view
        </Link>
      </div>

      <div className="flex-1 min-h-0">
        <VenueMapWrapper venues={venues} citySlug={citySlug} />
      </div>
    </div>
  )
}
