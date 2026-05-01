import type { ImportRow } from './types'

const SOURCE_NAME = 'El Segundo Summer Concerts in the Park'
const SOURCE_URL  = 'https://www.elsegundorecparks.gov/about-us/recparks-advanced-components/calendar-month-view'

// Confirmed 2026 dates — select Sundays at Library Park, 4:30 PM
const DATES = [
  '2026-06-21',
  '2026-07-12',
  '2026-08-09',
]

export function getElSegundoShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — El Segundo Summer Concerts in the Park',
    venue:          'Library Park',
    date,
    time:           '16:30',
    neighborhood:   'El Segundo',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `el-segundo-${date}`,
    source_url:     SOURCE_URL,
  }))
}
