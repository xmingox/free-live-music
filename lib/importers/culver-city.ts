import type { ImportRow } from './types'

const SOURCE_NAME = 'Culver City Summer Concert Series'
const SOURCE_URL  = 'https://www.culvercity.org/Events'

// Select summer dates 2026
const DATES = [
  '2026-06-19',
  '2026-07-10',
  '2026-07-17',
  '2026-07-24',
  '2026-07-31',
  '2026-08-07',
  '2026-08-14',
  '2026-08-21',
]

export function getCulverCityShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Culver City Summer Concert Series',
    venue:          'Culver City Park',
    date,
    time:           '18:00',
    neighborhood:   'Culver City',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `culver-city-${date}`,
    source_url:     SOURCE_URL,
  }))
}
