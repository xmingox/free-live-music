import type { ImportRow } from './types'

const SOURCE_NAME = 'Redondo Beach Pier Summer of Music'
const SOURCE_URL  = 'https://redondopier.com/events/'

// Every Thursday (Tribute Thursdays) & Saturday (Saturday Sessions)
// July 3 – August 30, 2026. July 3 falls on a Friday, so Thursdays start July 9.
const SHOWS: { date: string; artist: string }[] = [
  // Thursdays — Tribute Thursdays
  { date: '2026-07-09', artist: 'TBA — Tribute Thursdays at Redondo Beach Pier' },
  { date: '2026-07-16', artist: 'TBA — Tribute Thursdays at Redondo Beach Pier' },
  { date: '2026-07-23', artist: 'TBA — Tribute Thursdays at Redondo Beach Pier' },
  { date: '2026-07-30', artist: 'TBA — Tribute Thursdays at Redondo Beach Pier' },
  { date: '2026-08-06', artist: 'TBA — Tribute Thursdays at Redondo Beach Pier' },
  { date: '2026-08-13', artist: 'TBA — Tribute Thursdays at Redondo Beach Pier' },
  { date: '2026-08-20', artist: 'TBA — Tribute Thursdays at Redondo Beach Pier' },
  { date: '2026-08-27', artist: 'TBA — Tribute Thursdays at Redondo Beach Pier' },
  // Saturdays — Saturday Sessions
  { date: '2026-07-04', artist: 'TBA — Saturday Sessions at Redondo Beach Pier' },
  { date: '2026-07-11', artist: 'TBA — Saturday Sessions at Redondo Beach Pier' },
  { date: '2026-07-18', artist: 'TBA — Saturday Sessions at Redondo Beach Pier' },
  { date: '2026-07-25', artist: 'TBA — Saturday Sessions at Redondo Beach Pier' },
  { date: '2026-08-01', artist: 'TBA — Saturday Sessions at Redondo Beach Pier' },
  { date: '2026-08-08', artist: 'TBA — Saturday Sessions at Redondo Beach Pier' },
  { date: '2026-08-15', artist: 'TBA — Saturday Sessions at Redondo Beach Pier' },
  { date: '2026-08-22', artist: 'TBA — Saturday Sessions at Redondo Beach Pier' },
  { date: '2026-08-29', artist: 'TBA — Saturday Sessions at Redondo Beach Pier' },
]

export function getRedondoBeachShows(): ImportRow[] {
  return SHOWS.map(({ date, artist }) => ({
    artist_name:    artist,
    venue:          "Fisherman's Wharf, Redondo Beach Pier",
    date,
    time:           '18:00',
    neighborhood:   'Redondo Beach',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `redondo-beach-${date}-${artist.includes('Tribute') ? 'thu' : 'sat'}`,
    source_url:     SOURCE_URL,
  }))
}
