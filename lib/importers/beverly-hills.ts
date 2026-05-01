import type { ImportRow } from './types'

const SOURCE_NAME = 'Concerts on Cañon'
const SOURCE_URL  = 'https://www.beverlyhills.org/1313/Concerts-on-Canon---June-through-August'

// Free Thursday concerts at Beverly Canon Gardens, June–August 2026
const SHOWS: { date: string; artist: string }[] = [
  { date: '2026-06-04', artist: 'TBA — Concerts on Cañon' },
  { date: '2026-06-11', artist: 'TBA — Concerts on Cañon' },
  { date: '2026-06-18', artist: 'TBA — Concerts on Cañon' },
  { date: '2026-06-25', artist: 'TBA — Concerts on Cañon' },
  { date: '2026-07-02', artist: 'TBA — Concerts on Cañon' },
  { date: '2026-07-09', artist: 'TBA — Concerts on Cañon' },
  { date: '2026-07-16', artist: 'TBA — Concerts on Cañon' },
  { date: '2026-07-23', artist: 'TBA — Concerts on Cañon' },
  { date: '2026-07-30', artist: 'TBA — Concerts on Cañon' },
  { date: '2026-08-06', artist: 'TBA — Concerts on Cañon' },
  { date: '2026-08-13', artist: 'TBA — Concerts on Cañon' },
  { date: '2026-08-20', artist: 'TBA — Concerts on Cañon' },
  { date: '2026-08-27', artist: 'TBA — Concerts on Cañon' },
]

export function getBeverlyHillsShows(): ImportRow[] {
  return SHOWS.map(({ date, artist }) => ({
    artist_name:    artist,
    venue:          'Beverly Canon Gardens',
    date,
    time:           '18:00',
    neighborhood:   'Beverly Hills',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `beverly-hills-${date}`,
    source_url:     SOURCE_URL,
  }))
}
