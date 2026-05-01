import type { ImportRow } from './types'

const SOURCE_NAME = 'Simi Valley Music in the Park'
const SOURCE_URL  = 'https://www.rsrpd.org'

// Free Saturday concerts at Rancho Simi Community Park, June–August 2026
const DATES = [
  '2026-06-13',
  '2026-06-27',
  '2026-07-11',
  '2026-07-25',
  '2026-08-08',
  '2026-08-22',
]

export function getSimiValleyShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Simi Valley Music in the Park',
    venue:          'Rancho Simi Community Park',
    date,
    time:           '18:00',
    neighborhood:   'Simi Valley',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `simi-valley-${date}`,
    source_url:     SOURCE_URL,
  }))
}
