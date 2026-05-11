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

export async function generateStaticParams() {
  return GUIDE_CITIES.map((c) => ({ city: c.slug }))
}

interface WeekInfo {
  monday: string
  friday: string
  queryFrom: string
  weekdays: { date: string; label: string }[]
  weekLabel: string
  isNextWeek: boolean
}

function getThisWeekDates(): WeekInfo {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const dow = today.getDay() // 0=Sun…6=Sat

  // If weekend, advance to next Monday; otherwise step back to this Monday
  const daysToMonday = dow === 0 ? 1 : dow === 6 ? 2 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + daysToMonday)

  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const monStr = fmt(monday)
  const friStr = fmt(friday)
  const queryFrom = todayStr > monStr ? todayStr : monStr

  const weekdays: { date: string; label: string }[] = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = fmt(d)
    if (dateStr >= queryFrom) {
      weekdays.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      })
    }
  }

  const dayLabel = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  return {
    monday: monStr,
    friday: friStr,
    queryFrom,
    weekdays,
    weekLabel: `${dayLabel(monday)} – ${dayLabel(friday)}`,
    isNextWeek: dow === 0 || dow === 6,
  }
}

async function getWeekConcerts(
  metro: ReturnType<typeof getMetroByCode>,
  queryFrom: string,
  friday: string
): Promise<Concert[]> {
  if (!metro) return []
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return []

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const cityNames = [metro.city, ...(metro.aliases || [])]
  const { data } = await supabase
    .from('concerts')
    .select('*')
    .in('city', cityNames)
    .gte('date', queryFrom)
    .lte('date', friday)
    .eq('is_verified', true)
    .order('date', { ascending: true })
    .order('time', { ascending: true, nullsFirst: false })

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

  const { weekLabel } = getThisWeekDates()
  const title = `Free Concerts This Week in ${metro.city} — ${weekLabel}`
  const description = `Find free live music happening this week (Monday–Friday) in ${metro.city}, ${metro.state}. Browse weekday concerts with no cover charge.`
  const url = `https://www.freelivemusic.co/this-week/${city}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Free Live Music', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function ThisWeekCityPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city: citySlug } = await params
  const cityCode = getCityCodeFromSlug(citySlug)
  if (!cityCode) return null
  const metro = getMetroByCode(cityCode)
  if (!metro) return null

  const { monday, friday, queryFrom, weekdays, weekLabel, isNextWeek } = getThisWeekDates()
  const concerts = await getWeekConcerts(metro, queryFrom, friday)
  const concertsSlug = cityCodeToSlug[cityCode] ?? citySlug

  // Group concerts by date for day-by-day sections
  const byDate = new Map<string, Concert[]>()
  for (const c of concerts) {
    const arr = byDate.get(c.date) ?? []
    arr.push(c)
    byDate.set(c.date, arr)
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Free Live Music', item: 'https://www.freelivemusic.co' },
      { '@type': 'ListItem', position: 2, name: `Free Concerts in ${metro.city}`, item: `https://www.freelivemusic.co/concerts/${concertsSlug}` },
      { '@type': 'ListItem', position: 3, name: 'This Week' },
    ],
  }

  const eventJsonLd = concerts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Free Concerts This Week in ${metro.city}`,
    description: `Free weekday live music in ${metro.city}, ${metro.state} — ${weekLabel}`,
    url: `https://www.freelivemusic.co/this-week/${citySlug}`,
    numberOfItems: concerts.length,
    itemListElement: concerts.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'MusicEvent',
        name: c.artist_name,
        startDate: c.time ? `${c.date}T${c.time}` : c.date,
        location: {
          '@type': 'Place',
          name: c.venue,
          address: { '@type': 'PostalAddress', addressLocality: metro.city, addressRegion: metro.state },
        },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
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
              { label: 'This Week' },
            ]}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Free Concerts This Week
            </span>
            <span className="text-white"> in {metro.city}</span>
          </h1>
          <p className="text-slate-400">
            {isNextWeek ? 'Next week' : 'This week'} · {weekLabel} · {metro.city}, {metro.state}
          </p>
        </div>

        {concerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🎵</div>
            <h2 className="text-xl font-semibold text-slate-300 mb-2">
              No free weekday shows listed yet
            </h2>
            <p className="text-slate-500 max-w-sm mb-6">
              Most free concerts happen on weekends.{' '}
              <Link href={`/this-weekend/${citySlug}`} className="text-violet-400 hover:text-violet-300">
                Browse this weekend in {metro.city}
              </Link>{' '}
              or check all upcoming shows.
            </p>
            <Link
              href={`/concerts/${concertsSlug}`}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
            >
              All upcoming free music →
            </Link>
          </div>
        ) : (
          <>
            <p className="text-slate-400 mb-8">
              {concerts.length} free show{concerts.length !== 1 ? 's' : ''} · No cover charge
            </p>

            {weekdays.map((day) => {
              const dayConcerts = byDate.get(day.date) ?? []
              if (dayConcerts.length === 0) return null
              return (
                <section key={day.date} className="mb-10">
                  <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
                    {day.label}
                    <span className="text-slate-500 font-normal text-sm">
                      ({dayConcerts.length} show{dayConcerts.length !== 1 ? 's' : ''})
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dayConcerts.map((c) => (
                      <ConcertCard key={c.id} concert={c} />
                    ))}
                  </div>
                </section>
              )
            })}
          </>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-sm">
          <Link href={`/tonight/${citySlug}`} className="text-violet-400 hover:text-violet-300 transition-colors">
            Tonight in {metro.city} →
          </Link>
          <Link href={`/this-weekend/${citySlug}`} className="text-violet-400 hover:text-violet-300 transition-colors">
            This weekend in {metro.city} →
          </Link>
          <Link href={`/concerts/${concertsSlug}`} className="text-slate-400 hover:text-slate-300 transition-colors">
            All upcoming free music →
          </Link>
        </div>
      </main>

      <SiteFooter
        cityLine={`Free weekday concerts in ${metro.city} · No cover charge`}
        venueTypeSlug={concertsSlug}
      />
    </div>
  )
}
