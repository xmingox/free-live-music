import type { ImportRow } from './types'

const SOURCE_NAME = 'Arcadia Summer Concerts in the Park'
const SOURCE_URL  = 'https://www.arcadiaca.gov/recreation/parks-facilities/events'

// Free Thursday concerts at Arcadia Park, June–August 2026
const DATES = [
  '2026-06-11',
  '2026-06-25',
  '2026-07-09',
  '2026-07-23',
  '2026-08-06',
  '2026-08-20',
]

export function getArcadiaShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Arcadia Summer Concerts in the Park',
    venue:          'Arcadia Park',
    date,
    time:           '18:30',
    neighborhood:   'Arcadia',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `arcadia-${date}`,
    source_url:     SOURCE_URL,
  }))
}
