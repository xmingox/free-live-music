import type { ImportRow } from './types'

const SOURCE_NAME = 'LACMA Jazz'
const SOURCE_URL = 'https://www.lacma.org/programs/music'

const SHOWS: { date: string; artist: string }[] = [
  { date: '2026-05-01', artist: 'Michelle Coltrane Celebrates the Coltrane Centennial' },
  { date: '2026-05-08', artist: 'Lao Tizer Band' },
  { date: '2026-05-15', artist: 'Julius Rodriguez Trio' },
  { date: '2026-05-22', artist: 'Brian Swartz Quintet' },
  { date: '2026-05-29', artist: 'Tierney Sutton' },
  { date: '2026-06-05', artist: 'Paul Cornish Trio' },
  { date: '2026-06-12', artist: 'Ralph Moore Quartet' },
  { date: '2026-06-19', artist: 'Marvin "Smitty" Smith Septet' },
  { date: '2026-06-26', artist: 'Lynne Fiddmont' },
]

export function getLACMAShows(): ImportRow[] {
  return SHOWS.map(({ date, artist }) => ({
    artist_name: artist,
    venue: 'LACMA',
    date,
    time: '18:00',
    neighborhood: 'Mid-Wilshire',
    city: 'LA',
    genre: 'Jazz',
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: SOURCE_NAME,
    source_id: `lacma-jazz-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url: SOURCE_URL,
  }))
}
