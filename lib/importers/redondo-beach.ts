import type { ImportRow } from './types'

const SOURCE_NAME = 'Redondo Beach Pier Summer of Music'
const SOURCE_URL  = 'https://redondopier.com/summer-of-music/'

// Thursdays & Saturdays, July 2 – August 29, 2026, 6:00–8:00pm
// Venue: West end of the Pier / Fisherman's Wharf, Redondo Beach
// Source confirmed: https://redondopier.com/summer-of-music/
const SHOWS: { date: string; artist: string; genre: string }[] = [
  { date: '2026-07-02', artist: 'Running Hot',               genre: 'Rock' },
  { date: '2026-07-04', artist: 'Ernando and the Nandos',    genre: 'Pop/Soul' },
  { date: '2026-07-09', artist: 'Bear Supply',               genre: 'Pop' },
  { date: '2026-07-11', artist: 'Backspin',                  genre: 'Rock' },
  { date: '2026-07-16', artist: 'Say It Ain\'t Weezer',      genre: 'Rock' },
  { date: '2026-07-18', artist: 'Sligo Rags',                genre: 'Irish/Folk' },
  { date: '2026-07-23', artist: 'Marvin Gaye Soul Serenade', genre: 'Soul' },
  { date: '2026-07-25', artist: 'Chad & the Ship of Fools',  genre: 'Rock' },
  { date: '2026-07-30', artist: 'Grateful to the Core',      genre: 'Rock' },
  { date: '2026-08-01', artist: 'Manuel the Band',           genre: 'Indie Pop' },
  { date: '2026-08-06', artist: 'Hot Lava',                  genre: 'Rock' },
  { date: '2026-08-08', artist: 'Alarmaz',                   genre: 'Reggae' },
  { date: '2026-08-13', artist: 'Fake Matthews',             genre: 'Rock' },
  { date: '2026-08-15', artist: 'Tom Nolan Band',            genre: 'Rock/Soul' },
  { date: '2026-08-20', artist: 'Supersonic LA',             genre: 'Rock' },
  { date: '2026-08-22', artist: 'CC Stugino',                genre: 'Blues Rock' },
  { date: '2026-08-27', artist: 'The Arcadies',              genre: 'Rock' },
  { date: '2026-08-29', artist: '1969',                      genre: 'Classic Rock' },
]

export function getRedondoBeachShows(): ImportRow[] {
  return SHOWS.map(({ date, artist, genre }) => ({
    artist_name:    artist,
    venue:          "Fisherman's Wharf, Redondo Beach Pier",
    date,
    time:           '6:00pm',
    neighborhood:   'Redondo Beach',
    city:           'LA' as const,
    genre,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `redondo-beach-${date}`,
    source_url:     SOURCE_URL,
  }))
}
