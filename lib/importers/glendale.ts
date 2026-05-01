import type { ImportRow } from './types'

const SOURCE_NAME = 'Glendale Summer Concerts'
const SOURCE_URL  = 'https://www.glendaleca.gov/government/departments/community-services-parks/special-events'

// Free Wednesday concerts at Verdugo Park, July–August 2026
const DATES = [
  '2026-07-01',
  '2026-07-08',
  '2026-07-15',
  '2026-07-22',
  '2026-07-29',
  '2026-08-05',
  '2026-08-12',
  '2026-08-19',
  '2026-08-26',
]

export function getGlendaleShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Glendale Summer Concerts',
    venue:          'Verdugo Park',
    date,
    time:           '18:30',
    neighborhood:   'Glendale',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `glendale-${date}`,
    source_url:     SOURCE_URL,
  }))
}
