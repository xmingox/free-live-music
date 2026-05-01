import type { ImportRow } from './types'

const SOURCE_NAME = 'Stern Grove Festival'
const SOURCE_URL = 'https://www.sterngrove.org/'
const VENUE = 'Stern Grove'

const SHOWS: { date: string; artist: string }[] = [
  { date: '2026-06-14', artist: 'Peter Cat Recording Co. / Marinero' },
  { date: '2026-06-21', artist: 'Bomba Estéreo / La Misa Negra' },
  { date: '2026-06-28', artist: 'Japanese Breakfast' },
  { date: '2026-07-05', artist: 'Major Lazer / Fijiana' },
  { date: '2026-07-12', artist: 'SF Symphony / Béla Fleck' },
  { date: '2026-07-19', artist: 'Charley Crockett / Nicki Bluhm' },
  { date: '2026-07-26', artist: 'Suki Waterhouse' },
  { date: '2026-08-02', artist: 'Violent Femmes / Tune-Yards' },
  { date: '2026-08-09', artist: 'Patti LaBelle / Destani Wolf' },
  { date: '2026-08-15', artist: 'Public Enemy' },
  { date: '2026-08-16', artist: 'Al Green / Goapele / The Glide Ensemble' },
]

export function getSternGroveShows(): ImportRow[] {
  return SHOWS.map(({ date, artist }) => ({
    artist_name: artist,
    venue: VENUE,
    date,
    time: '14:00',
    neighborhood: 'Sunset District',
    city: 'SF' as const,
    genre: null,
    price: 'Free',
    admission_type: 'Free RSVP' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: SOURCE_NAME,
    source_id: `stern-grove-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url: SOURCE_URL,
  }))
}
