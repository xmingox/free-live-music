import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Concert } from '@/types'
import ConcertCard from '@/components/ConcertCard'
import { createClient } from '@supabase/supabase-js'
import {
  getAliasCityFromSlug,
  getAllAliasSlugs,
  cityCodeToSlug,
  cityToSlug,
} from '@/lib/city-slugs'

export const revalidate = 86400 // daily backstop; import cron refreshes via revalidateTag('concerts')

const CITY_PAGE_THRESHOLD = 5

export async function generateStaticParams() {
  return getAllAliasSlugs().map((slug) => ({ alias: slug }))
}

async function getConcertsByAliasCity(cityName: string): Promise<Concert[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return []
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('concerts')
      .select('*')
      .eq('city', cityName)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(200)

    if (error) return []
    return (data ?? []) as Concert[]
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ alias: string }>
}): Promise<Metadata> {
  const { alias } = await params
  const aliasCity = getAliasCityFromSlug(alias)
  if (!aliasCity) return { title: 'City Not Found' }

  // Code-identical aliases redirect to parent metro — signal noindex in metadata
  if (aliasCity.cityName === aliasCity.parentMetroCode) {
    return {
      robots: { index: false, follow: false },
      alternates: { canonical: `https://www.freelivemusic.co/concerts/${cityCodeToSlug[aliasCity.parentMetroCode]}` },
    }
  }

  const concerts = await getConcertsByAliasCity(aliasCity.cityName)
  const belowThreshold = concerts.length < CITY_PAGE_THRESHOLD

  const title = `Free Live Music in ${aliasCity.cityName}, ${aliasCity.parentMetro.state}`
  const description = `Find free live music and concerts in ${aliasCity.cityName}. Browse upcoming shows near ${aliasCity.parentMetro.city}.`

  return {
    title,
    description,
    robots: belowThreshold
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: {
      canonical: belowThreshold
        ? `https://www.freelivemusic.co/concerts/${cityCodeToSlug[aliasCity.parentMetroCode]}`
        : `https://www.freelivemusic.co/concerts/city/${alias}`,
    },
  }
}

export default async function AliasCityPage({
  params,
}: {
  params: Promise<{ alias: string }>
}) {
  const { alias } = await params
  const aliasCity = getAliasCityFromSlug(alias.toLowerCase())

  if (!aliasCity) {
    const canonicalSlugs = Object.values(cityCodeToSlug)
    if (canonicalSlugs.includes(alias.toLowerCase())) {
      redirect(`/concerts/${alias.toLowerCase()}`)
    }
    redirect('/')
    throw new Error()
  }

  // Code-identical aliases (e.g. /concerts/city/chi for Chicago) duplicate
  // the parent metro page — redirect permanently to the canonical.
  if (aliasCity.cityName === aliasCity.parentMetroCode) {
    redirect(`/concerts/${cityCodeToSlug[aliasCity.parentMetroCode]}`)
    throw new Error()
  }

  const concerts = await getConcertsByAliasCity(aliasCity.cityName)

  if (concerts.length < CITY_PAGE_THRESHOLD) {
    redirect(`/concerts/${cityCodeToSlug[aliasCity.parentMetroCode]}`)
    throw new Error()
  }

  const { parentMetro } = aliasCity
  const metroSlug = cityCodeToSlug[aliasCity.parentMetroCode]
  const siblingAliases = (parentMetro.aliases || []).filter((a: string) => a !== aliasCity.cityName)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 text-sm text-slate-500 flex gap-2">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href={`/concerts/${metroSlug}`} className="hover:text-blue-600">{parentMetro.city}</Link>
          <span>/</span>
          <span className="text-slate-900">{aliasCity.cityName}</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Free Live Music in {aliasCity.cityName}
          </h1>
          <p className="text-xl text-slate-600 mb-2">
            {concerts.length} upcoming concerts and live music events
          </p>
          <p className="text-slate-500">
            Part of the {parentMetro.city} metro area. All events are free to attend.
          </p>
        </div>
      </section>

      {/* Events */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {concerts.map((concert) => (
            <ConcertCard key={concert.id} concert={concert} />
          ))}
        </div>

        {/* More nearby CTA */}
        <div className="text-center py-8 border-t border-slate-200">
          <p className="text-slate-600 mb-4">
            Looking for more? Browse all free music in the {parentMetro.city} metro area.
          </p>
          <Link
            href={`/concerts/${metroSlug}`}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            More nearby in {parentMetro.city}
          </Link>
        </div>
      </main>

      {/* Sibling cities */}
      {siblingAliases.length > 0 && (
        <section className="bg-slate-50 border-t border-slate-200 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Other Cities Near {aliasCity.cityName}
            </h2>
            <div className="flex flex-wrap gap-3">
              {siblingAliases.map((sibling: string) => (
                <Link
                  key={sibling}
                  href={`/concerts/city/${cityToSlug(sibling)}`}
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {sibling}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
