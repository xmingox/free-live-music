export const revalidate = 3600

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
import { getMetroTimezone, getLocalDateStr, getLocalDow, addDays, formatDateLabel } from '@/lib/timezone'

export async function generateStaticParams() {
  return GUIDE_CITIES.map((c) => ({ city: c.slug }))
}

function getWeekendDates(tz: string): { sat: string; sun: string; satLabel: string; sunLabel: string } {
  const todayStr = getLocalDateStr(tz)
  const dow = getLocalDow(tz) // 0=Sun … 6=Sat
  const daysToSat = dow === 6 ? 0 : dow === 0 ? 6 : 6 - dow
  const sat = addDays(todayStr, daysToSat)
  const sun = addDays(sat, 1)
  const labelOpts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }
  return { sat, sun, satLabel: formatDateLabel(sat, labelOpts), sunLabel: formatDateLabel(sun, labelOpts) }
}

async function getWeekendConcerts(
  metro: ReturnType<typeof getMetroByCode>,
  sat: string,
  sun: string
): Promise<Concert[]> {
  if (!metro) return []
  const cityNames = [metro.city, ...(metro.aliases || [])]

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return []
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data } = await supabase
    .from('concerts')
    .select('*')
    .in('city', cityNames)
    .in('date', [sat, sun])
    .eq('is_verified', true)
    .order('date', { ascending: true })
    .order('time', { ascending: true })

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

  const tz = getMetroTimezone(metro.state ?? '')
  const { sat, sun } = getWeekendDates(tz)
  const satLabel = formatDateLabel(sat, { month: 'long', day: 'numeric' })
  const sunLabel = formatDateLabel(sun, { month: 'long', day: 'numeric' })

  const title = `Free Concerts This Weekend in ${metro.city} — ${satLabel} & ${sunLabel}`
  const description = `Find free live music this weekend in ${metro.city}, ${metro.state}. Browse Saturday & Sunday concerts with no cover charge.`
  const url = `https://www.freelivemusic.co/this-weekend/${city}`

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

export default async function ThisWeekendCityPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city: citySlug } = await params
  const cityCode = getCityCodeFromSlug(citySlug)
  if (!cityCode) return null
  const metro = getMetroByCode(cityCode)
  if (!metro) return null

  const tz = getMetroTimezone(metro.state ?? '')
  const { sat, sun, satLabel, sunLabel } = getWeekendDates(tz)
  const concerts = await getWeekendConcerts(metro, sat, sun)

  const satConcerts = concerts.filter((c) => c.date === sat)
  const sunConcerts = concerts.filter((c) => c.date === sun)

  const concertsSlug = cityCodeToSlug[cityCode] ?? citySlug

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Free Live Music', item: 'https://www.freelivemusic.co' },
      { '@type': 'ListItem', position: 2, name: `Free Concerts in ${metro.city}`, item: `https://www.freelivemusic.co/concerts/${concertsSlug}` },
      { '@type': 'ListItem', position: 3, name: 'This Weekend' },
    ],
  }

  const eventJsonLd = concerts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Free Concerts This Weekend in ${metro.city}`,
    description: `Free live music this weekend in ${metro.city}, ${metro.state}`,
    url: `https://www.freelivemusic.co/this-weekend/${citySlug}`,
    numberOfItems: concerts.length,
    itemListElement: concerts.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'MusicEvent',
        name: c.artist_name,
        startDate: c.time ? `${c.date}T${c.time}` : c.date,
        eventStatus: 'https://schema.org/EventScheduled',
        organizer: { '@type': 'Organization', name: 'Free Live Music', url: 'https://www.freelivemusic.co' },
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
          url: `https://www.freelivemusic.co/concert/${c.slug}`,
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
              { label: 'This Weekend' },
            ]}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Free Concerts This Weekend
            </span>
            <span className="text-white"> in {metro.city}</span>
          </h1>
          <p className="text-slate-400">
            {satLabel} &amp; {sunLabel} · {metro.city}, {metro.state}
          </p>
        </div>

        {concerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🎵</div>
            <h2 className="text-xl font-semibold text-slate-300 mb-2">No free concerts listed yet</h2>
            <p className="text-slate-500 max-w-sm mb-6">
              Weekend listings are added as venues post their schedules.{' '}
              <Link href={`/concerts/${concertsSlug}`} className="text-violet-400 hover:text-violet-300">
                Browse all upcoming free music in {metro.city}
              </Link>{' '}
              or check back closer to the weekend.
            </p>
          </div>
        ) : (
          <>
            {satConcerts.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
                  Saturday · {satLabel}
                  <span className="text-slate-500 font-normal text-sm">({satConcerts.length} show{satConcerts.length !== 1 ? 's' : ''})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {satConcerts.map((c) => (
                    <ConcertCard key={c.id} concert={c} />
                  ))}
                </div>
              </section>
            )}

            {sunConcerts.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-400 inline-block" />
                  Sunday · {sunLabel}
                  <span className="text-slate-500 font-normal text-sm">({sunConcerts.length} show{sunConcerts.length !== 1 ? 's' : ''})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sunConcerts.map((c) => (
                    <ConcertCard key={c.id} concert={c} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-sm">
          <Link href={`/concerts/${concertsSlug}`} className="text-violet-400 hover:text-violet-300 transition-colors">
            All upcoming free music in {metro.city} →
          </Link>
          <Link href={`/venues/${concertsSlug}`} className="text-slate-400 hover:text-slate-300 transition-colors">
            Browse {metro.city} venues →
          </Link>
        </div>
      </main>

      <SiteFooter
        cityLine={`Free concerts this weekend in ${metro.city} · No cover charge`}
        venueTypeSlug={concertsSlug}
      />
    </div>
  )
}
