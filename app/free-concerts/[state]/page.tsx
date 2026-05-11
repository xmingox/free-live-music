export const revalidate = 3600

import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  STATE_NAMES,
  slugToStateCode,
  stateCodeToSlug,
  getActiveStateSlugs,
  getMetrosByState,
} from '@/lib/state-slugs'
import { cityCodeToSlug } from '@/lib/city-slugs'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'

export async function generateStaticParams() {
  return getActiveStateSlugs().map((state) => ({ state }))
}

async function getCityConcertCounts(stateCode: string): Promise<Record<string, number>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return {}

  const metros = getMetrosByState(stateCode)
  const allCityNames = metros.flatMap((m) => [m.city, ...(m.aliases || [])])
  if (allCityNames.length === 0) return {}

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('concerts')
    .select('city')
    .in('city', allCityNames)
    .gte('date', today)
    .eq('is_verified', true)

  // Aggregate by metro (city + aliases → metro.city)
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const metro = metros.find((m) => m.city === row.city || (m.aliases || []).includes(row.city))
    if (metro) counts[metro.city] = (counts[metro.city] ?? 0) + 1
  }
  return counts
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>
}): Promise<Metadata> {
  const { state: stateSlug } = await params
  const stateCode = slugToStateCode[stateSlug]
  if (!stateCode) return { title: 'State Not Found' }
  const stateName = STATE_NAMES[stateCode]

  const title = `Free Live Music in ${stateName} — Free Concerts Near You`
  const description = `Find free live music and concerts across ${stateName}. Browse cities with upcoming free shows — no cover charge or tickets needed.`
  const url = `https://www.freelivemusic.co/free-concerts/${stateSlug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Free Live Music', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function StatePage({
  params,
}: {
  params: Promise<{ state: string }>
}) {
  const { state: stateSlug } = await params
  const stateCode = slugToStateCode[stateSlug]
  if (!stateCode) notFound()

  const stateName = STATE_NAMES[stateCode]
  const metros = getMetrosByState(stateCode)
  const counts = await getCityConcertCounts(stateCode)

  // Sort: cities with shows first (by count desc), then alpha
  const sorted = [...metros].sort((a, b) => {
    const ca = counts[a.city] ?? 0
    const cb = counts[b.city] ?? 0
    if (cb !== ca) return cb - ca
    return a.city.localeCompare(b.city)
  })

  const totalShows = Object.values(counts).reduce((s, n) => s + n, 0)
  const citiesWithShows = sorted.filter((m) => (counts[m.city] ?? 0) > 0)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Free Live Music', item: 'https://www.freelivemusic.co' },
      { '@type': 'ListItem', position: 2, name: `Free Concerts in ${stateName}` },
    ],
  }

  const itemListJsonLd = citiesWithShows.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Free Live Music in ${stateName}`,
    description: `Cities with free concerts in ${stateName}`,
    url: `https://www.freelivemusic.co/free-concerts/${stateSlug}`,
    numberOfItems: citiesWithShows.length,
    itemListElement: citiesWithShows.map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'City',
        name: m.city,
        url: `https://www.freelivemusic.co/concerts/${cityCodeToSlug[m.code] ?? ''}`,
      },
    })),
  } : null

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <SiteNav
            breadcrumbs={[
              { label: 'Free Live Music', href: '/' },
              { label: stateName },
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
            <span className="text-white"> in {stateName}</span>
          </h1>
          {totalShows > 0 ? (
            <p className="text-slate-400">
              {totalShows} free show{totalShows !== 1 ? 's' : ''} across {citiesWithShows.length} {citiesWithShows.length !== 1 ? 'cities' : 'city'} · No cover charge
            </p>
          ) : (
            <p className="text-slate-400">Browse cities with upcoming free concerts</p>
          )}
        </div>

        {sorted.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No cities found for {stateName}.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((metro) => {
              const slug = cityCodeToSlug[metro.code]
              const count = counts[metro.city] ?? 0
              if (!slug) return null
              return (
                <Link
                  key={metro.code}
                  href={`/concerts/${slug}`}
                  className="group flex items-center justify-between bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl px-5 py-4 transition-all duration-150"
                >
                  <div>
                    <p className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                      {metro.city}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {count > 0 ? `${count} upcoming show${count !== 1 ? 's' : ''}` : 'No shows yet'}
                    </p>
                  </div>
                  <span className="text-slate-600 group-hover:text-violet-400 transition-colors text-lg">→</span>
                </Link>
              )
            })}
          </div>
        )}

        {/* Cross-link to other states */}
        <div className="mt-12 pt-6 border-t border-slate-800">
          <p className="text-sm text-slate-500 mb-3">Other states</p>
          <div className="flex flex-wrap gap-2">
            {getActiveStateSlugs()
              .filter((s) => s !== stateSlug)
              .map((s) => {
                const code = slugToStateCode[s]
                return (
                  <Link
                    key={s}
                    href={`/free-concerts/${s}`}
                    className="text-sm text-slate-400 hover:text-violet-400 transition-colors"
                  >
                    {STATE_NAMES[code]}
                  </Link>
                )
              })}
          </div>
        </div>
      </main>

      <SiteFooter cityLine={`Free concerts in ${stateName} · No cover charge`} />
    </div>
  )
}
