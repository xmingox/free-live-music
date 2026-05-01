import type { ImportRow } from './types'

const SOURCE_NAME = 'Costa Mesa Summer Concerts'
const SOURCE_URL  = 'https://www.costamesaca.gov/government/departments-and-divisions/parks-and-community-services/events'

// Select summer dates at Fairview Park 2026
const DATES = [
  '2026-06-20',
  '2026-07-11',
  '2026-07-18',
  '2026-07-25',
  '2026-08-01',
  '2026-08-08',
  '2026-08-15',
  '2026-08-22',
]

export function getCostaMesaShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Costa Mesa Summer Concerts',
    venue:          'Fairview Park',
    date,
    time:           '18:00',
    neighborhood:   'Costa Mesa',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `costa-mesa-${date}`,
    source_url:     SOURCE_URL,
  }))
}
