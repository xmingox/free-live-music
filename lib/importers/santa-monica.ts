import type { ImportRow } from './types'

const SOURCE_NAME = 'Santa Monica Summer Twilight Concert Series'
const SOURCE_URL  = 'https://www.santamonica.com/events-calendar/'

// Thursdays at Santa Monica Pier, July–August 2026
const DATES = [
  '2026-07-02',
  '2026-07-09',
  '2026-07-16',
  '2026-07-23',
  '2026-07-30',
  '2026-08-06',
  '2026-08-13',
  '2026-08-20',
  '2026-08-27',
]

export function getSantaMonicaShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Santa Monica Summer Twilight Concert Series',
    venue:          'Santa Monica Pier',
    date,
    time:           '18:30',
    neighborhood:   'Santa Monica',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `santa-monica-${date}`,
    source_url:     SOURCE_URL,
  }))
}
