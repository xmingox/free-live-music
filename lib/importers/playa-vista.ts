import type { ImportRow } from './types'

const SOURCE_NAME = 'Concert Park at Runway Playa Vista'
const SOURCE_URL  = 'https://playavista.com/events/'

// Select summer dates at Concert Park, 2026
const DATES = [
  '2026-06-06',
  '2026-06-20',
  '2026-07-11',
  '2026-07-18',
  '2026-07-25',
  '2026-08-01',
  '2026-08-08',
  '2026-08-15',
  '2026-08-22',
]

export function getPlayaVistaShows(): ImportRow[] {
  return DATES.map(date => ({
    artist_name:    'TBA — Concert Park at Runway Playa Vista',
    venue:          'Concert Park at The Runway',
    date,
    time:           '18:00',
    neighborhood:   'Playa Vista',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `playa-vista-${date}`,
    source_url:     SOURCE_URL,
  }))
}
