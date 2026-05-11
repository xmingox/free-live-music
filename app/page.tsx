import { Metadata } from 'next'
import Link from 'next/link'
import ConcertsClient from './concerts-client'
import { getConcerts } from '@/lib/data'
import { getMetroByCode } from '@/lib/city-slugs'
import { City } from '@/types'
import { GUIDE_CITIES } from '@/lib/city-guides'

export const metadata: Metadata = {
  title: 'Free Live Music Near You | freelivemusic.co',
  description: 'Find free live music concerts and outdoor shows in your city — NYC, LA, Chicago, Austin, Seattle, and 70+ more US cities. Updated daily.',
  alternates: {
    canonical: 'https://www.freelivemusic.co',
  },
  openGraph: {
    title: 'Free Live Music Near You',
    description: 'Find free live music concerts and outdoor shows in your city. Updated daily.',
    url: 'https://www.freelivemusic.co',
    siteName: 'Free Live Music',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Live Music Near You',
    description: 'Find free live concerts in NYC, LA, Chicago, Austin, Seattle, and 70+ US cities.',
  },
}

function resolveMetroCode(cityParam: string | undefined): City {
  if (!cityParam) return 'NYC'
  const code = cityParam.toUpperCase()
  return (getMetroByCode(code) ? code : 'NYC') as City
}

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.freelivemusic.co/#website',
      name: 'Free Live Music',
      url: 'https://www.freelivemusic.co',
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.freelivemusic.co/#organization',
      name: 'Free Live Music',
      url: 'https://www.freelivemusic.co',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.freelivemusic.co/icon-512.png',
      },
    },
  ],
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>
}) {
  const { city: cityParam } = await searchParams
  const metroCode = resolveMetroCode(cityParam)
  const concerts = await getConcerts(metroCode)
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
      />
      <ConcertsClient initialConcerts={concerts.slice(0, 24)} defaultCity={metroCode} />
      {/* Server-rendered city directory — crawlable canonical links for all city pages */}
      <nav
        aria-label="Browse free concerts by city"
        className="bg-slate-950 border-t border-slate-800/50 px-4 py-8"
      >
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4">
            Free Concerts by City — All shows free admission
          </p>
          <ul className="flex flex-wrap gap-x-2 gap-y-1">
            {GUIDE_CITIES.map((c) => (
              <li key={c.slug} className="flex items-center gap-1 text-xs text-slate-600">
                <Link href={`/concerts/${c.slug}`} className="hover:text-slate-400 transition-colors">
                  {c.name}
                </Link>
                <span className="text-slate-800">·</span>
                <Link href={`/tonight/${c.slug}`} className="hover:text-slate-400 transition-colors">
                  Tonight
                </Link>
                <span className="text-slate-800">·</span>
                <Link href={`/this-weekend/${c.slug}`} className="hover:text-slate-400 transition-colors">
                  Weekend
                </Link>
                <span className="text-slate-800 mx-1">|</span>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  )
}
