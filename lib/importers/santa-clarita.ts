import type { ImportRow } from './types'

const SOURCE_NAME = 'Santa Clarita Concerts in the Park'
const SOURCE_URL  = 'https://santaclarita.gov/arts-and-culture/events/concerts-in-the-park/'

// Free Saturday concerts at Central Park, July–August 2026
const DATES = [
  '2026-07-04',
  '2026-07-11',
  '2026-07-18',
  '2026-07-25',
  '2026-08-01',
  '2026-08-08',
  '2026-08-15',
  '2026-08-22',
  '2026-08-29',
]

export function getSantaClaritaShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Santa Clarita Concerts in the Park',
    venue:          'Central Park',
    date,
    time:           '19:00',
    neighborhood:   'Santa Clarita',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `santa-clarita-${date}`,
    source_url:     SOURCE_URL,
  }))
}
