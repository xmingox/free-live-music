import type { ImportRow } from './types'

const SOURCE_NAME = 'San Clemente Linda Lane Park Concert Series'
const SOURCE_URL  = 'https://www.san-clemente.org/Home/Components/Calendar/Event/'

// Select summer dates at Linda Lane Park 2026
const DATES = [
  '2026-06-27',
  '2026-07-11',
  '2026-07-18',
  '2026-07-25',
  '2026-08-01',
  '2026-08-08',
  '2026-08-15',
  '2026-08-22',
]

export function getSanClementeShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — San Clemente Linda Lane Park Concert Series',
    venue:          'Linda Lane Park',
    date,
    time:           '18:00',
    neighborhood:   'San Clemente',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `san-clemente-${date}`,
    source_url:     SOURCE_URL,
  }))
}
