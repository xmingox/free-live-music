import type { ImportRow } from './types'

const SOURCE_NAME = 'Brea Summer Concert Series'
const SOURCE_URL  = 'https://www.cityofbrea.gov/Calendar.aspx'

// Select summer dates at Brea City Hall Amphitheater 2026
const DATES = [
  '2026-06-12',
  '2026-06-26',
  '2026-07-10',
  '2026-07-24',
  '2026-08-07',
  '2026-08-21',
]

export function getBreaConcertShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Brea Summer Concert Series',
    venue:          'Brea City Hall Amphitheater',
    date,
    time:           '18:30',
    neighborhood:   'Brea',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `brea-${date}`,
    source_url:     SOURCE_URL,
  }))
}
