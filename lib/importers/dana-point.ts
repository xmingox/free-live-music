import type { ImportRow } from './types'

const SOURCE_NAME = 'Dana Point Summer of Music'
const SOURCE_URL  = 'https://www.danapoint.org/departments/community-services-recreation/events-calendar'

// Select Sundays, July–August 2026 — two acts per show
const SHOWS: { date: string; artist: string }[] = [
  { date: '2026-07-05', artist: 'Dana Point Summer of Music — Act 1' },
  { date: '2026-07-05', artist: 'Dana Point Summer of Music — Act 2' },
  { date: '2026-07-12', artist: 'Dana Point Summer of Music — Act 1' },
  { date: '2026-07-12', artist: 'Dana Point Summer of Music — Act 2' },
  { date: '2026-07-19', artist: 'Dana Point Summer of Music — Act 1' },
  { date: '2026-07-19', artist: 'Dana Point Summer of Music — Act 2' },
  { date: '2026-07-26', artist: 'Dana Point Summer of Music — Act 1' },
  { date: '2026-07-26', artist: 'Dana Point Summer of Music — Act 2' },
  { date: '2026-08-02', artist: 'Dana Point Summer of Music — Act 1' },
  { date: '2026-08-02', artist: 'Dana Point Summer of Music — Act 2' },
  { date: '2026-08-09', artist: 'Dana Point Summer of Music — Act 1' },
  { date: '2026-08-09', artist: 'Dana Point Summer of Music — Act 2' },
  { date: '2026-08-16', artist: 'Dana Point Summer of Music — Act 1' },
  { date: '2026-08-16', artist: 'Dana Point Summer of Music — Act 2' },
  { date: '2026-08-23', artist: 'Dana Point Summer of Music — Act 1' },
  { date: '2026-08-23', artist: 'Dana Point Summer of Music — Act 2' },
]

export function getDanaPointShows(): ImportRow[] {
  return SHOWS.map(({ date, artist }, i) => ({
    artist_name:    artist,
    venue:          'Sea Terrace Park',
    date,
    time:           '17:00',
    neighborhood:   'Dana Point',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `dana-point-${date}-${i % 2 === 0 ? 'act1' : 'act2'}`,
    source_url:     SOURCE_URL,
  }))
}
