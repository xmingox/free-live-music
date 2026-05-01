import type { ImportRow } from './types'

const SOURCE_NAME = 'Irvine Summer Concerts'
const SOURCE_URL = 'https://cityofirvine.org/community-library-services-department/summer-city'

const SHOWS: { date: string; artist: string }[] = [
  { date: '2026-06-06', artist: 'Jimmy\'s Buffet' },
  { date: '2026-06-27', artist: '4 Lads from Liverpool' },
  { date: '2026-07-18', artist: 'Jukebox' },
]

export function getIrvineConcertShows(): ImportRow[] {
  return SHOWS.map(({ date, artist }) => ({
    artist_name: artist,
    venue: 'Mike Ward Community Park — Woodbridge',
    date,
    time: '17:30',
    neighborhood: 'Woodbridge',
    city: 'LA' as const,
    genre: null,
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: SOURCE_NAME,
    source_id: `irvine-concerts-${date}`,
    source_url: SOURCE_URL,
  }))
}
