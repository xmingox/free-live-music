import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import ConcertCard from '@/components/ConcertCard'
import { Concert } from '@/types'
import {
  getCityCodeFromSlug,
  getMetroByCode,
  getAllCityCodes,
  cityCodeToSlug,
} from '@/lib/city-slugs'

export const revalidate = 3600

export async function generateStaticParams() {
  return getAllCityCodes()
    .map((code) => cityCodeToSlug[code])
    .filter(Boolean)
    .map((slug) => ({ city: slug }))
}

function getWeekendRange(): { start: string; end: string; label: string } {
  const today = new Date()
  const day = today.getDay() // 0=Sun, 1=Mon ... 5=Fri, 6=Sat

  const toISO = (d: Date) => d.toISOString().split('T')[0]
  const addDays = (d: Date, n: number) => {
    const r = new Date(d)
    r.setDate(d.getDate() + n)
    return r
  }
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  let start: Date, end: Date

  if (day === 0) {
    // Sunday — tail end of weekend, show just today
    start = today
    end = today
  } else if (day === 5) {
    // Friday — show Fri through Sun
    start = today
    end = addDays(today, 2)
  } else if (day === 6) {
    // Saturday — show Sat through Sun
    start = today
    end = addDays(today, 1)
  } else {
    // Mon-Thu — show the upcoming Fri through Sun
    const daysToFri = 5 - day
    start = addDays(today, daysToFri)
    end = addDays(start, 2)
  }

  const label =
    toISO(start) === toISO(end)
      ? start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      : `${fmt(start)}–${fmt(end)}`

  return { start: toISO(start), end: toISO(end), label }
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

  const title = `Free Concerts in ${metro.city} This Weekend | Free Live Music`
  const description = `Find free live music and outdoor concerts in ${metro.city} this weekend. No tickets, no cover charge — updated weekly.`

  return {
    title,
    description,
    keywords: [
      `free concerts ${metro.city} this weekend`,
      `free live music ${metro.city} weekend`,
      `free shows this weekend ${metro.city}`,
      `outdoor concerts ${metro.city} weekend`,
    ],
    openGraph: {
      title,
      description,
      url: `https://www.freelivemusic.co/concerts/${city}/this-weekend`,
      siteName: 'Free Live Music',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://www.freelivemusic.co/concerts/${city}/this-weekend`,
    },
    robots: { index: true, follow: true },
  }
}

async function getWeekendConcerts(
  metro: ReturnType<typeof getMetroByCode>,
  start: string,
  end: string
): Promise<Concert[]> {
  if (!metro) return []
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return []

  const cityNames = [metro.city, ...(metro.aliases || [])]

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data } = await supabase
    .from('concerts')
    .select('*')
    .in('city', cityNames)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
    .order('time', { ascending: true, nullsFirst: false })

  return (data as Concert[]) ?? []
}

export default async function ThisWeekendPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  const cityCode = getCityCodeFromSlug(city.toLowerCase())
  if (!cityCode) return <div className="text-center py-20">City not found</div>
  const metro = getMetroByCode(cityCode)
  if (!metro) return <div className="text-center py-20">City not found</div>

  const { start, end, label } = getWeekendRange()
  const concerts = await getWeekendConcerts(metro, start, end)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>›</span>
            <Link href={`/concerts/${city}`} className="hover:text-blue-600 transition-colors">
              {metro.city}
            </Link>
            <span>›</span>
            <span className="text-slate-700">This Weekend</span>
          </nav>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Free Concerts in {metro.city} This Weekend
          </h1>
          <p className="text-xl text-slate-600 mb-1">{label}</p>
          <p className="text-slate-500">
            {concerts.length > 0
              ? `${concerts.length} free ${concerts.length === 1 ? 'show' : 'shows'} — no tickets required`
              : `No free shows this weekend yet — check the full calendar`}
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {concerts.length > 0 && (
          <p className="text-slate-600 text-sm mb-8 max-w-2xl">
            {concerts.length === 1
              ? `One free show is happening in ${metro.city} this weekend. No tickets or cover charge — just show up.`
              : `${concerts.length} free shows across ${metro.city} this weekend. All events are free — no tickets, no cover charge. Some may require a free RSVP, noted on each listing.`}
          </p>
        )}
        {concerts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concerts.map((concert) => (
              <ConcertCard key={concert.id} concert={concert} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-lg">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              No Free Shows This Weekend in {metro.city}
            </h2>
            <p className="text-slate-600 mb-8">
              Nothing is scheduled for the weekend yet. Check the full calendar for upcoming shows.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link
                href={`/concerts/${city}/tonight`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Tonight →
              </Link>
              <Link
                href={`/concerts/${city}`}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
              >
                All Upcoming Shows
              </Link>
            </div>
          </div>
        )}
      </main>

      <section className="bg-slate-50 border-t border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">More Free Music in {metro.city}</h2>
          <div className="flex flex-wrap gap-4">
            <Link href={`/concerts/${city}/tonight`} className="text-blue-600 hover:underline text-sm">
              Free concerts tonight
            </Link>
            <Link href={`/concerts/${city}`} className="text-blue-600 hover:underline text-sm">
              All upcoming free concerts
            </Link>
            <Link href={`/venues/${cityCodeToSlug[cityCode]}`} className="text-blue-600 hover:underline text-sm">
              Venues in {metro.city}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
