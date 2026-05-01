import type { ImportRow } from './types'

const SOURCE_NAME = 'Hermosa Beach Concert Series'
const SOURCE_URL  = 'https://www.hermosabeach.gov/our-government/city-departments/community-resources-parks-recreation/hermosa-beach-concert-series'

const DATES = [
  '2026-09-13',
  '2026-09-20',
]

export function getHermosaBeachShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Hermosa Beach Concert Series',
    venue:          'Hermosa Beach Pier (South Side)',
    date,
    time:           '15:00',
    neighborhood:   'Hermosa Beach',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `hermosa-beach-${date}`,
    source_url:     SOURCE_URL,
  }))
}
