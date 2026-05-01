import type { ImportRow } from './types'

const SOURCE_NAME = 'Skirball Sunset Concerts'
const SOURCE_URL = 'https://www.skirball.org/sunsetconcerts'

// 2026 lineup TBA — typically 4 Thursday evenings in July/August
const SHOWS: { date: string; artist: string }[] = [
  { date: '2026-07-16', artist: 'TBA — Skirball Sunset Concerts' },
  { date: '2026-07-23', artist: 'TBA — Skirball Sunset Concerts' },
  { date: '2026-07-30', artist: 'TBA — Skirball Sunset Concerts' },
  { date: '2026-08-06', artist: 'TBA — Skirball Sunset Concerts' },
]

export function getSkirballShows(): ImportRow[] {
  return SHOWS.map(({ date, artist }) => ({
    artist_name: artist,
    venue: 'Skirball Cultural Center',
    date,
    time: '19:00',
    neighborhood: 'Bel Air',
    city: 'LA',
    genre: 'World',
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: SOURCE_NAME,
    source_id: `skirball-${date}`,
    source_url: SOURCE_URL,
  }))
}
