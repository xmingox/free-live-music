// ISR: re-render at most once per hour instead of on every request
export const revalidate = 3600

import { Suspense } from 'react'
import { Metadata } from 'next'
import ConcertsClient from './concerts-client'
import ConcertCard from '@/components/ConcertCard'
import { getConcerts } from '@/lib/data'
import { Concert } from '@/types'

function HomeFallback({ concerts }: { concerts: Concert[] }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-slate-950 to-pink-950/50" />
        <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-lg shadow-lg">
              🎵
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Always free</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-1">
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Free Live Music
            </span>
          </h1>
          <p className="text-slate-400 text-lg">The best free shows across the US</p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-12">
        <p className="text-slate-400 mb-6">{concerts.length} shows in New York</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {concerts.slice(0, 24).map((concert) => (
            <ConcertCard key={concert.id} concert={concert} />
          ))}
        </div>
      </main>
    </div>
  )
}

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

export default async function Home() {
  const concerts = await getConcerts('NYC')
  return (
    <Suspense fallback={<HomeFallback concerts={concerts} />}>
      <ConcertsClient initialConcerts={concerts} defaultCity="NYC" />
    </Suspense>
  )
}
