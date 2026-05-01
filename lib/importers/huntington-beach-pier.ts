import type { ImportRow } from './types'

const SOURCE_NAME = 'Huntington Beach Pier Plaza Concert Series'
const SOURCE_URL  = 'https://www.huntingtonbeachca.gov/residents/recreation/special_events/'

// Select Thursdays & Saturdays, June–August 2026, 7:00 PM
const SHOWS: { date: string; day: string }[] = [
  { date: '2026-06-04', day: 'Thu' },
  { date: '2026-06-06', day: 'Sat' },
  { date: '2026-06-11', day: 'Thu' },
  { date: '2026-06-13', day: 'Sat' },
  { date: '2026-06-18', day: 'Thu' },
  { date: '2026-06-20', day: 'Sat' },
  { date: '2026-06-25', day: 'Thu' },
  { date: '2026-06-27', day: 'Sat' },
  { date: '2026-07-02', day: 'Thu' },
  { date: '2026-07-04', day: 'Sat' },
  { date: '2026-07-09', day: 'Thu' },
  { date: '2026-07-11', day: 'Sat' },
  { date: '2026-07-16', day: 'Thu' },
  { date: '2026-07-18', day: 'Sat' },
  { date: '2026-07-23', day: 'Thu' },
  { date: '2026-07-25', day: 'Sat' },
  { date: '2026-07-30', day: 'Thu' },
  { date: '2026-08-01', day: 'Sat' },
  { date: '2026-08-06', day: 'Thu' },
  { date: '2026-08-08', day: 'Sat' },
  { date: '2026-08-13', day: 'Thu' },
  { date: '2026-08-15', day: 'Sat' },
  { date: '2026-08-20', day: 'Thu' },
  { date: '2026-08-22', day: 'Sat' },
  { date: '2026-08-27', day: 'Thu' },
  { date: '2026-08-29', day: 'Sat' },
]

export function getHuntingtonBeachPierShows(): ImportRow[] {
  return SHOWS.map(({ date }) => ({
    artist_name:    'TBA — Huntington Beach Pier Plaza Concert Series',
    venue:          'Pier Plaza',
    date,
    time:           '19:00',
    neighborhood:   'Huntington Beach',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `huntington-beach-pier-${date}`,
    source_url:     SOURCE_URL,
  }))
}
