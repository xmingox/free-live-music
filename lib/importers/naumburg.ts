import type { ImportRow } from './types'

const SOURCE_NAME = 'Naumburg Orchestral Concerts'
const SOURCE_URL = 'https://naumburgconcerts.org/upcoming'

const SHOWS: { date: string; artist: string }[] = [
  { date: '2026-06-09', artist: 'Simone Dinnerstein / Baroklyn / CONCORA — J.S. Bach program' },
  { date: '2026-06-23', artist: 'TBA — Naumburg Orchestral Concerts' },
  { date: '2026-07-07', artist: 'TBA — Naumburg Orchestral Concerts' },
  { date: '2026-07-21', artist: "Orchestra of St. Luke's with Erin Wagner — All-Mozart program" },
  { date: '2026-08-04', artist: "Nosky's Baroque Band — Bach, Telemann & baroque trumpet" },
]

export function getNaumburgShows(): ImportRow[] {
  return SHOWS.map(({ date, artist }) => ({
    artist_name: artist,
    venue: 'Naumburg Bandshell',
    date,
    time: '19:30',
    neighborhood: 'Central Park',
    city: 'NYC',
    genre: 'Classical',
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: SOURCE_NAME,
    source_id: `naumburg-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url: SOURCE_URL,
  }))
}
