// ISR: re-render at most once per hour instead of on every request
export const revalidate = 3600

import { Metadata } from 'next'
import ConcertsClient from './concerts-client'
import { getConcerts } from '@/lib/data'

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
  return <ConcertsClient initialConcerts={concerts.slice(0, 24)} defaultCity="NYC" />
}
