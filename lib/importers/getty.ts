import type { ImportRow } from './types'

const SOURCE_NAME = 'Getty Off the 405'
const SOURCE_URL = 'https://www.getty.edu/whats-on/off-the-405/'

const SHOWS: { date: string; artist: string; genre: string | null }[] = [
  { date: '2026-05-30', artist: 'aja monet', genre: 'Poetry/Jazz' },
  { date: '2026-06-13', artist: 'Hunx and His Punx', genre: 'Punk' },
  { date: '2026-07-11', artist: 'LEENALCHI', genre: 'World' },
  { date: '2026-07-25', artist: 'Horse Lords', genre: 'Experimental' },
  { date: '2026-08-22', artist: 'Laurel Halo', genre: 'Electronic' },
]

export function getGettyShows(): ImportRow[] {
  return SHOWS.map(({ date, artist, genre }) => ({
    artist_name: artist,
    venue: 'Getty Center',
    date,
    time: '19:30',
    neighborhood: 'Brentwood',
    city: 'LA',
    genre,
    price: 'Free',
    admission_type: 'Free RSVP' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: SOURCE_NAME,
    source_id: `getty-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url: SOURCE_URL,
  }))
}
