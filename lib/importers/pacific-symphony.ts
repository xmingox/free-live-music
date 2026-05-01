import type { ImportRow } from './types'

const SOTG_SOURCE = 'Pacific Symphony On The Go'
const SOTG_URL = 'https://www.pacificsymphony.org/sotg'

const SOTG_SHOWS: { date: string; venue: string; neighborhood: string; time: string }[] = [
  { date: '2026-06-18', venue: 'Soka University Campus Green', neighborhood: 'Aliso Viejo', time: '18:30' },
  { date: '2026-06-27', venue: 'Eisenhower Park', neighborhood: 'Seal Beach', time: '18:30' },
  { date: '2026-07-07', venue: 'Hunt Library', neighborhood: 'Fullerton', time: '18:30' },
  { date: '2026-07-08', venue: 'Pines Park', neighborhood: 'Dana Point', time: '18:30' },
  { date: '2026-07-21', venue: 'Oso Grande Park', neighborhood: 'Ladera Ranch', time: '18:30' },
  { date: '2026-07-28', venue: 'Portola Park', neighborhood: 'La Habra', time: '18:30' },
  { date: '2026-08-11', venue: 'Heller Park', neighborhood: 'Costa Mesa', time: '18:30' },
  { date: '2026-08-12', venue: 'Ehlers Event Center', neighborhood: 'Buena Park', time: '18:30' },
  { date: '2026-08-13', venue: 'La Palma Central Park', neighborhood: 'La Palma', time: '18:30' },
  { date: '2026-08-14', venue: 'Maple Grove North Park', neighborhood: 'Cypress', time: '18:30' },
  { date: '2026-08-18', venue: 'Huntington Beach Central Library', neighborhood: 'Huntington Beach', time: '18:30' },
  { date: '2026-08-19', venue: 'Vista Park', neighborhood: 'Costa Mesa', time: '18:30' },
  { date: '2026-08-25', venue: 'Cabot Park', neighborhood: 'Laguna Hills', time: '18:30' },
  { date: '2026-08-27', venue: 'Ole Hanson Beach Club', neighborhood: 'San Clemente', time: '18:30' },
  { date: '2026-08-29', venue: 'Shiffer Park', neighborhood: 'Costa Mesa', time: '18:30' },
  { date: '2026-08-30', venue: 'Bradford Park', neighborhood: 'Placentia', time: '18:30' },
  { date: '2026-09-15', venue: 'Los Rios Park', neighborhood: 'San Juan Capistrano', time: '18:00' },
  { date: '2026-09-25', venue: 'Heisler Park Amphitheater', neighborhood: 'Laguna Beach', time: '17:30' },
  { date: '2026-09-26', venue: 'Villa Park Town Center', neighborhood: 'Villa Park', time: '18:30' },
]

export function getPacificSymphonyShows(): ImportRow[] {
  return SOTG_SHOWS.map(({ date, venue, neighborhood, time }) => ({
    artist_name: 'Pacific Symphony On The Go',
    venue,
    date,
    time,
    neighborhood,
    city: 'LA' as const,
    genre: 'Classical',
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: SOTG_SOURCE,
    source_id: `pacific-symphony-${date}-${venue.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url: SOTG_URL,
  }))
}

const SITC_SHOWS: { date: string; venue: string; neighborhood: string; time: string }[] = [
  { date: '2026-08-08', venue: 'Oso Viejo Community Park', neighborhood: 'Mission Viejo', time: '19:00' },
  { date: '2026-08-09', venue: 'Newport Beach Central Library', neighborhood: 'Newport Beach', time: '18:00' },
  { date: '2026-08-15', venue: 'Mike Ward Community Park', neighborhood: 'Irvine', time: '19:00' },
  { date: '2026-08-16', venue: 'Musco Center for the Arts at Chapman University', neighborhood: 'Orange', time: '19:00' },
]

export function getSymphonyInTheCitiesShows(): ImportRow[] {
  return SITC_SHOWS.map(({ date, venue, neighborhood, time }) => ({
    artist_name: 'Pacific Symphony — Symphony in the Cities',
    venue,
    date,
    time,
    neighborhood,
    city: 'LA' as const,
    genre: 'Classical',
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: 'Pacific Symphony Symphony in the Cities',
    source_id: `sitc-${date}-${venue.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url: 'https://www.pacificsymphony.org/communityconcerts',
  }))
}
