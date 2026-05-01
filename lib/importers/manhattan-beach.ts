import type { ImportRow } from './types'

const SOURCE_NAME = 'Manhattan Beach Concerts in the Park'
const SOURCE_URL  = 'https://www.manhattanbeach.gov/?navid=1643'

// Sundays, June–August 2026, 5:00 PM at Polliwog Park
const DATES = [
  '2026-06-07',
  '2026-06-14',
  '2026-06-21',
  '2026-06-28',
  '2026-07-05',
  '2026-07-12',
  '2026-07-19',
  '2026-07-26',
  '2026-08-02',
  '2026-08-09',
  '2026-08-16',
  '2026-08-23',
  '2026-08-30',
]

export function getManhattanBeachShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Manhattan Beach Concerts in the Park',
    venue:          'Polliwog Park',
    date,
    time:           '17:00',
    neighborhood:   'Manhattan Beach',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `manhattan-beach-${date}`,
    source_url:     SOURCE_URL,
  }))
}
