import type { ImportRow } from './types'

const SOURCE_NAME = 'Lincoln Center Summer for the City'
const SOURCE_URL = 'https://www.lincolncenter.org/series/summer-for-the-city'

const SHOWS: { date: string; artist: string; venue: string; genre: string | null }[] = [
  { date: '2026-06-14', artist: 'Buhaina\'s Hot Seat: Art Blakey Jazz Messengers Trumpet Tradition feat. Bruce Harris', venue: 'David Rubenstein Atrium', genre: 'Jazz' },
  { date: '2026-06-18', artist: '10th Jazztopad Festival: SUTARInova with Shahzad Ismaily', venue: 'David Rubenstein Atrium', genre: 'Jazz' },
  { date: '2026-06-19', artist: 'Carl Hancock Rux\'s Oh Sankofa — A Juneteenth Celebration', venue: 'Hearst Plaza', genre: 'World' },
  { date: '2026-06-26', artist: 'Orestes Gómez', venue: 'David Rubenstein Atrium', genre: 'Latin' },
  { date: '2026-06-27', artist: 'J.PERIOD Presents The Block Party', venue: 'Josie Robertson Plaza', genre: 'Hip-Hop' },
  { date: '2026-07-02', artist: 'Joe McGinty & The Loser\'s Lounge celebrate disco', venue: 'Josie Robertson Plaza', genre: 'Disco' },
  { date: '2026-07-05', artist: 'Louis Armstrong at 125, America at 250: A Birthday Celebration for Pops', venue: 'David Rubenstein Atrium', genre: 'Jazz' },
  { date: '2026-07-09', artist: 'Brazil Day: Baia Toca Forró', venue: 'Josie Robertson Plaza', genre: 'World' },
  { date: '2026-07-10', artist: 'Sauljaljui', venue: 'David Rubenstein Atrium', genre: 'World' },
  { date: '2026-07-12', artist: 'Ruidosa Fest: Pabllo Vittar presents CLUB VITTAR / Dominga & Volvox / Armana Khan', venue: 'Josie Robertson Plaza', genre: 'Pop' },
  { date: '2026-07-16', artist: 'The American Quartet', venue: 'David Rubenstein Atrium', genre: 'Jazz' },
  { date: '2026-08-01', artist: 'globalFEST: Elida Almeida / Sinkane / Saha Gnawa', venue: 'Josie Robertson Plaza', genre: 'World' },
  { date: '2026-08-05', artist: 'Hurray for the Riff Raff', venue: 'Josie Robertson Plaza', genre: 'Indie' },
]

export function scrapeLincolnCenter(): ImportRow[] {
  return SHOWS.map(({ date, artist, venue, genre }) => ({
    artist_name: artist,
    venue,
    date,
    time: '19:00',
    neighborhood: 'Lincoln Center',
    city: 'NYC',
    genre,
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: SOURCE_NAME,
    source_id: `lincoln-center-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url: SOURCE_URL,
  }))
}
