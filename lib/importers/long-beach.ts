import type { ImportRow } from './types'

// Long Beach, CA free concert series — 2026 season
// Artists TBA for most series; genres/formats confirmed

const SHOWS: {
  date: string; artist: string; venue: string; neighborhood: string;
  time: string; genre: string | null; source_name: string; source_url: string;
}[] = [
  // Long Beach Airport — Airwaves (brand new series, confirmed dates + genres)
  { date: '2026-07-12', artist: 'TBA — Soul Music (3 bands)', venue: 'Long Beach Airport Plaza', neighborhood: 'Long Beach', time: '17:00', genre: 'Soul', source_name: 'Long Beach Airport Airwaves', source_url: 'https://www.longbeach.gov/lgb/' },
  { date: '2026-08-16', artist: 'TBA — Rocksteady (3 bands)', venue: 'Long Beach Airport Plaza', neighborhood: 'Long Beach', time: '17:00', genre: 'Reggae', source_name: 'Long Beach Airport Airwaves', source_url: 'https://www.longbeach.gov/lgb/' },
  { date: '2026-09-20', artist: 'TBA — Latin Jazz Funk (3 bands)', venue: 'Long Beach Airport Plaza', neighborhood: 'Long Beach', time: '17:00', genre: 'Latin Jazz', source_name: 'Long Beach Airport Airwaves', source_url: 'https://www.longbeach.gov/lgb/' },

  // Bixby Knolls Concerts in the Park(ing Lot)
  { date: '2026-06-23', artist: 'TBA — Bixby Knolls Concert Series', venue: 'Bixby Knolls', neighborhood: 'Bixby Knolls', time: '18:30', genre: null, source_name: 'Bixby Knolls Concerts', source_url: 'https://bixbyknollsinfo.com/concerts' },
  { date: '2026-07-14', artist: 'TBA — Bixby Knolls Concert Series', venue: 'Bixby Knolls', neighborhood: 'Bixby Knolls', time: '18:30', genre: null, source_name: 'Bixby Knolls Concerts', source_url: 'https://bixbyknollsinfo.com/concerts' },
  { date: '2026-07-21', artist: 'TBA — Bixby Knolls Concert Series', venue: 'Bixby Knolls', neighborhood: 'Bixby Knolls', time: '18:30', genre: null, source_name: 'Bixby Knolls Concerts', source_url: 'https://bixbyknollsinfo.com/concerts' },
  { date: '2026-08-01', artist: 'TBA — Bixby Knolls Concert Series', venue: 'Bixby Knolls', neighborhood: 'Bixby Knolls', time: '18:30', genre: null, source_name: 'Bixby Knolls Concerts', source_url: 'https://bixbyknollsinfo.com/concerts' },
  { date: '2026-08-11', artist: 'TBA — Bixby Knolls Concert Series', venue: 'Bixby Knolls', neighborhood: 'Bixby Knolls', time: '18:30', genre: null, source_name: 'Bixby Knolls Concerts', source_url: 'https://bixbyknollsinfo.com/concerts' },

  // Naples Island monthly concerts
  { date: '2026-05-27', artist: 'Manuel the Band', venue: 'The Colonnade, Naples Island', neighborhood: 'Naples Island', time: '18:00', genre: null, source_name: 'Naples Island Concerts', source_url: 'https://www.naplesislands.org/calendar' },
  { date: '2026-06-24', artist: 'Hillbilly Crutch', venue: 'The Colonnade, Naples Island', neighborhood: 'Naples Island', time: '18:00', genre: 'Country', source_name: 'Naples Island Concerts', source_url: 'https://www.naplesislands.org/calendar' },
  { date: '2026-07-29', artist: 'Ashe Bros', venue: 'The Colonnade, Naples Island', neighborhood: 'Naples Island', time: '18:00', genre: null, source_name: 'Naples Island Concerts', source_url: 'https://www.naplesislands.org/calendar' },
  { date: '2026-09-07', artist: 'King Salmon (street dance)', venue: 'The Colonnade, Naples Island', neighborhood: 'Naples Island', time: '18:00', genre: null, source_name: 'Naples Island Concerts', source_url: 'https://www.naplesislands.org/calendar' },

  // Peninsula Neighborhood Association
  { date: '2026-06-08', artist: 'Blue Breeze Band', venue: 'Alamitos Park', neighborhood: 'Long Beach Peninsula', time: '17:30', genre: null, source_name: 'Peninsula Neighborhood Concerts', source_url: 'https://lbpeninsula.org/summer-concert-series/' },
  { date: '2026-06-29', artist: 'Stone Soul', venue: 'Alamitos Park', neighborhood: 'Long Beach Peninsula', time: '17:30', genre: 'Soul', source_name: 'Peninsula Neighborhood Concerts', source_url: 'https://lbpeninsula.org/summer-concert-series/' },
]

export function getLongBeachShows(): ImportRow[] {
  return SHOWS.map(({ date, artist, venue, neighborhood, time, genre, source_name, source_url }) => ({
    artist_name: artist,
    venue,
    date,
    time,
    neighborhood,
    city: 'LA',
    genre,
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name,
    source_id: `long-beach-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url,
  }))
}
