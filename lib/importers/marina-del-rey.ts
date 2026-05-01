import type { ImportRow } from './types'

const SOURCE_NAME = 'Marina del Rey Summer Concert Series'
const SOURCE_URL = 'https://beaches.lacounty.gov/concerts/'

const SHOWS = [
  '2026-07-11',
  '2026-07-18',
  '2026-07-25',
  '2026-08-01',
  '2026-08-08',
  '2026-08-15',
]

export function getMarinaDelReyShows(): ImportRow[] {
  return SHOWS.map(date => ({
    artist_name: 'TBA — Marina del Rey Summer Concert Series',
    venue: 'Burton Chace Park',
    date,
    time: '18:00',
    neighborhood: 'Marina del Rey',
    city: 'LA',
    genre: null,
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: SOURCE_NAME,
    source_id: `marina-del-rey-${date}`,
    source_url: SOURCE_URL,
  }))
}
