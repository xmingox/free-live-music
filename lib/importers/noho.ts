import type { ImportRow } from './types'

const SOURCE_NAME = 'NoHo Summer Nights'
const SOURCE_URL  = 'https://valleycultural.org/concerts-events/noho-summer-nights/'

// Free Saturday concerts at North Hollywood Park, July–August 2026
// Presented by Valley Cultural Foundation — select Saturdays
const DATES = [
  '2026-07-11',
  '2026-07-18',
  '2026-07-25',
  '2026-08-01',
  '2026-08-08',
  '2026-08-15',
  '2026-08-22',
]

export function getNoHoShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — NoHo Summer Nights',
    venue:          'North Hollywood Park',
    date,
    time:           '19:00',
    neighborhood:   'North Hollywood',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `noho-${date}`,
    source_url:     SOURCE_URL,
  }))
}
