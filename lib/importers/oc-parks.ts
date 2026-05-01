import type { ImportRow } from './types'

const SOURCE_NAME = 'OC Parks'
const SOURCE_URL = 'https://www.ocparks.com/news/oc-parks-presents-2026-summer-concert-series-and-sunset-cinema-film-series'

const SHOWS: { date: string; artist: string; venue: string; neighborhood: string }[] = [
  { date: '2026-07-09', artist: 'Flashback Heart Attack (80s tribute)', venue: 'Mason Regional Park', neighborhood: 'Irvine' },
  { date: '2026-07-16', artist: 'Queen Nation (Queen tribute)', venue: 'Irvine Regional Park', neighborhood: 'Irvine' },
  { date: '2026-07-23', artist: 'Boy Band Review', venue: 'Irvine Regional Park', neighborhood: 'Irvine' },
  { date: '2026-07-30', artist: 'Beatles vs. Stones: The Greatest Show That Never Was', venue: 'Craig Regional Park', neighborhood: 'Fullerton' },
  { date: '2026-08-06', artist: 'Mariachi Divas', venue: 'Craig Regional Park', neighborhood: 'Fullerton' },
  { date: '2026-08-13', artist: 'Como La Flor Band: A Tribute to Selena', venue: 'Mile Square Regional Park', neighborhood: 'Fountain Valley' },
  { date: '2026-08-20', artist: 'TBA — OC Parks Summer Concert Series', venue: 'Mile Square Regional Park', neighborhood: 'Fountain Valley' },
  { date: '2026-08-27', artist: 'Dream Like Taylor (Taylor Swift tribute)', venue: 'Bluff Park at Salt Creek Beach', neighborhood: 'Dana Point' },
  { date: '2026-09-03', artist: 'Family Style', venue: 'Bluff Park at Salt Creek Beach', neighborhood: 'Dana Point' },
]

export function getOCParksShows(): ImportRow[] {
  return SHOWS.map(({ date, artist, venue, neighborhood }) => ({
    artist_name: artist,
    venue,
    date,
    time: '17:00',
    neighborhood,
    city: 'LA',
    genre: null,
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: SOURCE_NAME,
    source_id: `oc-parks-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url: SOURCE_URL,
  }))
}
