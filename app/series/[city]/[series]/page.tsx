export const revalidate = 3600

import { Metadata } from 'next'
import Link from 'next/link'
import { Concert } from '@/types'
import ConcertCard from '@/components/ConcertCard'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import {
  getCityCodeFromSlug,
  getMetroByCode,
  cityCodeToSlug,
} from '@/lib/city-slugs'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'
import { seriesSlug } from '@/lib/series'

async function getSeriesConcerts(
  metro: ReturnType<typeof getMetroByCode>,
  seriesParam: string
): Promise<{ artistName: string; concerts: Concert[] } | null> {
  if (!metro) return null
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const cityNames = [metro.city, ...(metro.aliases || [])]
  const today = new Date().toISOString().split('T')[0]

  // Fetch all upcoming concerts for this metro, find which artist slug matches
  const { data } = await supabase
    .from('concerts')
    .select('*')
    .in('city', cityNames)
    .gte('date', today)
    .eq('is_verified', true)
    .order('date', { ascending: true })
    .limit(500)

  const concerts = (data ?? []) as Concert[]

  // Group by artist name and find the one whose slug matches
  const grouped = new Map<string, Concert[]>()
  for (const c of concerts) {
    const slug = seriesSlug(c.artist_name)
    if (slug === seriesParam) {
      if (!grouped.has(c.artist_name)) grouped.set(c.artist_name, [])
      grouped.get(c.artist_name)!.push(c)
    }
  }

  if (grouped.size === 0) return null

  // Pick the artist name with the most concerts (handles near-duplicates)
  const [artistName, seriesConcerts] = [...grouped.entries()].sort(
    (a, b) => b[1].length - a[1].length
  )[0]

  return { artistName, concerts: seriesConcerts }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; series: string }>
}): Promise<Metadata> {
  const { city, series } = await params
  const cityCode = getCityCodeFromSlug(city)
  if (!cityCode) return { title: 'Series Not Found' }
  const metro = getMetroByCode(cityCode)
  if (!metro) return { title: 'Series Not Found' }

  const result = await getSeriesConcerts(metro, series)
  if (!result) return { title: 'Series Not Found' }

  const { artistName, concerts } = result
  const title = `${artistName} — Free Concert Series in ${metro.city} | Free Live Music`
  const description = `${artistName} plays ${concerts.length} upcoming free show${concerts.length !== 1 ? 's' : ''} in ${metro.city}, ${metro.state}. All concerts are free admission — no tickets needed.`
  const url = `https://www.freelivemusic.co/series/${city}/${series}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Free Live Music', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ city: string; series: string }>
}) {
  const { city: citySlug, series: seriesParam } = await params
  const cityCode = getCityCodeFromSlug(citySlug)
  if (!cityCode) notFound()
  const metro = getMetroByCode(cityCode!)
  if (!metro) notFound()

  const result = await getSeriesConcerts(metro, seriesParam)
  if (!result) notFound()

  const { artistName, concerts } = result
  const concertsSlug = cityCodeToSlug[cityCode!] ?? citySlug

  // Derive venue name + location from first concert
  const firstVenue = concerts[0]?.venue
  const firstNeighborhood = concerts[0]?.neighborhood

  // Compute date range label
  const firstDate = concerts.at(0)?.date
  const lastDate = concerts.at(-1)?.date
  const dateRangeLabel =
    firstDate && lastDate && firstDate !== lastDate
      ? `${fmtDate(firstDate)} – ${fmtDate(lastDate)}`
      : firstDate
      ? fmtDate(firstDate)
      : null

  // EventSeries JSON-LD
  const eventSeriesJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EventSeries',
    name: artistName,
    location: {
      '@type': 'Place',
      name: firstVenue ?? metro.city,
      address: {
        '@type': 'PostalAddress',
        addressLocality: metro.city,
        addressRegion: metro.state,
      },
    },
    organizer: { '@type': 'Organization', name: artistName },
    url: `https://www.freelivemusic.co/series/${citySlug}/${seriesParam}`,
    subEvent: concerts.slice(0, 20).map((c) => ({
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
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      url: `https://www.freelivemusic.co/concert/${c.slug}`,
    })),
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSeriesJsonLd) }}
      />

      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <SiteNav
            venuesHref={`/venues/${concertsSlug}`}
            breadcrumbs={[
              { label: 'Free Live Music', href: '/' },
              { label: metro.city, href: `/concerts/${concertsSlug}` },
              { label: artistName },
            ]}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Concert Series
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Free Admission
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              {artistName}
            </span>
          </h1>

          <p className="text-slate-400 text-base">
            {firstVenue && <>{firstVenue} · </>}
            {firstNeighborhood && <>{firstNeighborhood}, </>}
            {metro.city}, {metro.state}
          </p>

          {dateRangeLabel && (
            <p className="text-slate-500 text-sm mt-1">{dateRangeLabel}</p>
          )}

          <p className="text-slate-300 mt-4">
            {concerts.length} upcoming free show{concerts.length !== 1 ? 's' : ''} · No tickets or cover charge
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {concerts.map((c) => (
            <ConcertCard key={c.id} concert={c} />
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-sm">
          <Link href={`/concerts/${concertsSlug}`} className="text-violet-400 hover:text-violet-300 transition-colors">
            All free concerts in {metro.city} →
          </Link>
          <Link href={`/venues/${concertsSlug}`} className="text-slate-400 hover:text-slate-300 transition-colors">
            Browse {metro.city} venues →
          </Link>
        </div>
      </main>

      <SiteFooter
        cityLine={`${artistName} · Free concert series in ${metro.city}`}
        venueTypeSlug={concertsSlug}
      />
    </div>
  )
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}
