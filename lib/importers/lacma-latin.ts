import type { ImportRow } from './types'

const SOURCE_NAME = 'LACMA Latin Sounds'
const SOURCE_URL = 'https://www.lacma.org/programs/music'

const SHOWS: { date: string; artist: string; time: string }[] = [
  { date: '2026-05-23', artist: 'Son Mayor', time: '17:00' },
  { date: '2026-05-30', artist: 'SitaroSon', time: '17:00' },
  { date: '2026-06-06', artist: 'Rush Hour Orquesta', time: '17:00' },
  { date: '2026-06-13', artist: 'Téka', time: '17:00' },
  { date: '2026-06-20', artist: 'Roosevelt, "El Presidente de la Salsa"', time: '16:00' },
  { date: '2026-06-27', artist: 'MAYEYA and Bomba Borkén', time: '17:00' },
]

export function getLACMALatinShows(): ImportRow[] {
  return SHOWS.map(({ date, artist, time }) => ({
    artist_name: artist,
    venue: 'LACMA',
    date,
    time,
    neighborhood: 'Mid-Wilshire',
    city: 'LA',
    genre: 'Latin',
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: SOURCE_NAME,
    source_id: `lacma-latin-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url: SOURCE_URL,
  }))
}
