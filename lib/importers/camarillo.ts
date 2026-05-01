import type { ImportRow } from './types'

const SOURCE_NAME = 'Camarillo Summer Concert Series'
const SOURCE_URL  = 'https://www.ci.camarillo.ca.us'

// Free Saturday concerts at Constitution Park, June–August 2026
const DATES = [
  '2026-06-06',
  '2026-06-20',
  '2026-07-11',
  '2026-07-25',
  '2026-08-08',
  '2026-08-22',
]

export function getCamarilloShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Camarillo Summer Concert Series',
    venue:          'Constitution Park',
    date,
    time:           '18:00',
    neighborhood:   'Camarillo',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `camarillo-${date}`,
    source_url:     SOURCE_URL,
  }))
}
