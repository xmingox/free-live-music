import type { ImportRow } from './types'

const SOURCE_NAME = 'NY Philharmonic'
const SOURCE_URL = 'https://www.nyphil.org/concerts-tickets/explore/parks/'

const SHOWS: { date: string; venue: string; neighborhood: string; time: string }[] = [
  { date: '2026-06-09', venue: 'Van Cortlandt Park', neighborhood: 'Bronx', time: '20:00' },
  { date: '2026-06-10', venue: 'Central Park Great Lawn', neighborhood: 'Central Park', time: '18:00' },
  { date: '2026-06-11', venue: 'Cunningham Park', neighborhood: 'Queens', time: '20:00' },
  { date: '2026-06-12', venue: 'Prospect Park', neighborhood: 'Brooklyn', time: '18:00' },
  { date: '2026-06-14', venue: 'St. George Theatre', neighborhood: 'Staten Island', time: '16:00' },
]

export function getNYPhilShows(): ImportRow[] {
  return SHOWS.map(({ date, venue, neighborhood, time }) => ({
    artist_name: 'New York Philharmonic',
    venue,
    date,
    time,
    neighborhood,
    city: 'NYC',
    genre: 'Classical',
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: neighborhood === 'Staten Island' ? 'Indoor' as const : 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: SOURCE_NAME,
    source_id: `nyphil-${date}-${venue.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url: SOURCE_URL,
  }))
}
