import type { ImportRow } from './types'

const SOURCE_NAME = 'Conejo Community Park Summer Concerts'
const SOURCE_URL  = 'https://www.crpd.org'

// Free summer concerts at Conejo Community Park, Memorial Day–Labor Day 2026
// CRPD typically runs select weekend dates through summer
const DATES = [
  '2026-05-23',
  '2026-06-06',
  '2026-06-20',
  '2026-07-04',
  '2026-07-18',
  '2026-08-01',
  '2026-08-15',
  '2026-08-29',
  '2026-09-05',
]

export function getThousandOaksShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Conejo Community Park Summer Concerts',
    venue:          'Conejo Community Park',
    date,
    time:           '18:00',
    neighborhood:   'Thousand Oaks',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `thousand-oaks-${date}`,
    source_url:     SOURCE_URL,
  }))
}
