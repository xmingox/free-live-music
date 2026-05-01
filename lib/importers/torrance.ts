import type { ImportRow } from './types'

const SOURCE_NAME = 'Torrance Summer Nights'
const SOURCE_URL  = 'https://www.torranceca.gov/services/cultural-services-arts-and-classes/torrance-summer-nights'

// Free Saturday concerts at Wilson Park Amphitheatre, June–September 2026
const DATES = [
  '2026-06-06',
  '2026-06-13',
  '2026-06-20',
  '2026-06-27',
  '2026-07-11',
  '2026-07-18',
  '2026-07-25',
  '2026-08-01',
  '2026-08-08',
  '2026-08-15',
  '2026-08-22',
  '2026-08-29',
  '2026-09-05',
  '2026-09-12',
  '2026-09-19',
  '2026-09-26',
]

export function getTorranceShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Torrance Summer Nights',
    venue:          'Wilson Park Amphitheatre',
    date,
    time:           '17:00',
    neighborhood:   'Torrance',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `torrance-${date}`,
    source_url:     SOURCE_URL,
  }))
}
