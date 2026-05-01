import type { ImportRow } from './types'

const SOURCE_NAME = 'Alhambra Concerts in the Park'
const SOURCE_URL  = 'https://www.cityofalhambra.org/CivicAlerts.aspx?AID=289'

// Free Friday concerts at Alhambra Park Bandshell
// Pattern: Fridays July 11 – August 8 (5 Fridays)
const DATES = [
  '2026-07-10',
  '2026-07-17',
  '2026-07-24',
  '2026-07-31',
  '2026-08-07',
]

export function getAlhambraShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Alhambra Concerts in the Park',
    venue:          'Alhambra Park Bandshell',
    date,
    time:           '19:00',
    neighborhood:   'Alhambra',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `alhambra-${date}`,
    source_url:     SOURCE_URL,
  }))
}
