import type { ImportRow } from './types'

const SOURCE_NAME = 'Rancho Santa Margarita Central Park Concerts'
const SOURCE_URL  = 'https://www.samlarc.org/events'

// Select summer dates at Central Park 2026
const DATES = [
  '2026-06-26',
  '2026-07-10',
  '2026-07-24',
  '2026-08-07',
  '2026-08-21',
]

export function getRanchoSantaMargaritaShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Rancho Santa Margarita Central Park Concerts',
    venue:          'Central Park',
    date,
    time:           '18:00',
    neighborhood:   'Rancho Santa Margarita',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `rancho-santa-margarita-${date}`,
    source_url:     SOURCE_URL,
  }))
}
