import type { ImportRow } from './types'

const SHOWS: { date: string; artist: string; venue: string; neighborhood: string; time: string; genre: string | null; source_name: string; source_url: string }[] = [
  // PDX Live at Pioneer Courthouse Square — August
  { date: '2026-08-04', artist: 'PDX Live: Ani DiFranco', venue: 'Pioneer Courthouse Square', neighborhood: 'Downtown Portland', time: '18:00', genre: 'Folk', source_name: 'PDX Live', source_url: 'https://thesquarepdx.org' },
  { date: '2026-08-06', artist: 'PDX Live — TBA', venue: 'Pioneer Courthouse Square', neighborhood: 'Downtown Portland', time: '18:00', genre: null, source_name: 'PDX Live', source_url: 'https://thesquarepdx.org' },
  { date: '2026-08-11', artist: 'PDX Live — TBA', venue: 'Pioneer Courthouse Square', neighborhood: 'Downtown Portland', time: '18:00', genre: null, source_name: 'PDX Live', source_url: 'https://thesquarepdx.org' },
  { date: '2026-08-13', artist: 'PDX Live — TBA', venue: 'Pioneer Courthouse Square', neighborhood: 'Downtown Portland', time: '18:00', genre: null, source_name: 'PDX Live', source_url: 'https://thesquarepdx.org' },
  { date: '2026-08-18', artist: 'PDX Live — TBA', venue: 'Pioneer Courthouse Square', neighborhood: 'Downtown Portland', time: '18:00', genre: null, source_name: 'PDX Live', source_url: 'https://thesquarepdx.org' },
  { date: '2026-08-20', artist: 'PDX Live: Vince Staples', venue: 'Pioneer Courthouse Square', neighborhood: 'Downtown Portland', time: '18:00', genre: 'Hip-Hop', source_name: 'PDX Live', source_url: 'https://thesquarepdx.org' },

  // Music on Main — Wednesdays, Portland'5
  { date: '2026-06-03', artist: 'Music on Main — TBA', venue: 'Main Street next to Arlene Schnitzer Concert Hall', neighborhood: 'Downtown Portland', time: '17:00', genre: null, source_name: 'Music on Main', source_url: 'https://www.portland5.com/events/music-main' },
  { date: '2026-06-10', artist: 'Music on Main — TBA', venue: 'Main Street next to Arlene Schnitzer Concert Hall', neighborhood: 'Downtown Portland', time: '17:00', genre: null, source_name: 'Music on Main', source_url: 'https://www.portland5.com/events/music-main' },
  { date: '2026-06-17', artist: 'Music on Main — TBA', venue: 'Main Street next to Arlene Schnitzer Concert Hall', neighborhood: 'Downtown Portland', time: '17:00', genre: null, source_name: 'Music on Main', source_url: 'https://www.portland5.com/events/music-main' },
  { date: '2026-06-24', artist: 'Music on Main — TBA', venue: 'Main Street next to Arlene Schnitzer Concert Hall', neighborhood: 'Downtown Portland', time: '17:00', genre: null, source_name: 'Music on Main', source_url: 'https://www.portland5.com/events/music-main' },
  { date: '2026-07-01', artist: 'Music on Main — TBA', venue: 'Main Street next to Arlene Schnitzer Concert Hall', neighborhood: 'Downtown Portland', time: '17:00', genre: null, source_name: 'Music on Main', source_url: 'https://www.portland5.com/events/music-main' },
  { date: '2026-07-08', artist: 'Music on Main — TBA', venue: 'Main Street next to Arlene Schnitzer Concert Hall', neighborhood: 'Downtown Portland', time: '17:00', genre: null, source_name: 'Music on Main', source_url: 'https://www.portland5.com/events/music-main' },
  { date: '2026-07-15', artist: 'Music on Main — TBA', venue: 'Main Street next to Arlene Schnitzer Concert Hall', neighborhood: 'Downtown Portland', time: '17:00', genre: null, source_name: 'Music on Main', source_url: 'https://www.portland5.com/events/music-main' },
  { date: '2026-07-22', artist: 'Music on Main — TBA', venue: 'Main Street next to Arlene Schnitzer Concert Hall', neighborhood: 'Downtown Portland', time: '17:00', genre: null, source_name: 'Music on Main', source_url: 'https://www.portland5.com/events/music-main' },
  { date: '2026-07-29', artist: 'Music on Main — TBA', venue: 'Main Street next to Arlene Schnitzer Concert Hall', neighborhood: 'Downtown Portland', time: '17:00', genre: null, source_name: 'Music on Main', source_url: 'https://www.portland5.com/events/music-main' },

  // Summer Free for All — Portland Parks concerts, July 10–August 29
  { date: '2026-07-10', artist: 'Summer Free For All: Concert in the Park — TBA', venue: 'Various Portland Parks', neighborhood: 'Portland', time: '18:30', genre: null, source_name: 'Portland Summer Free For All', source_url: 'https://www.portland.gov/parks/arts-culture/summer-free-all/cultural-events' },
  { date: '2026-07-14', artist: 'Summer Free For All: Concert in the Park — TBA', venue: 'Various Portland Parks', neighborhood: 'Portland', time: '18:30', genre: null, source_name: 'Portland Summer Free For All', source_url: 'https://www.portland.gov/parks/arts-culture/summer-free-all/cultural-events' },
  { date: '2026-07-17', artist: 'Summer Free For All: Concert in the Park — TBA', venue: 'Various Portland Parks', neighborhood: 'Portland', time: '18:30', genre: null, source_name: 'Portland Summer Free For All', source_url: 'https://www.portland.gov/parks/arts-culture/summer-free-all/cultural-events' },
  { date: '2026-07-21', artist: 'Summer Free For All: Concert in the Park — TBA', venue: 'Various Portland Parks', neighborhood: 'Portland', time: '18:30', genre: null, source_name: 'Portland Summer Free For All', source_url: 'https://www.portland.gov/parks/arts-culture/summer-free-all/cultural-events' },
  { date: '2026-07-24', artist: 'Summer Free For All: Concert in the Park — TBA', venue: 'Various Portland Parks', neighborhood: 'Portland', time: '18:30', genre: null, source_name: 'Portland Summer Free For All', source_url: 'https://www.portland.gov/parks/arts-culture/summer-free-all/cultural-events' },
  { date: '2026-07-28', artist: 'Summer Free For All: Concert in the Park — TBA', venue: 'Various Portland Parks', neighborhood: 'Portland', time: '18:30', genre: null, source_name: 'Portland Summer Free For All', source_url: 'https://www.portland.gov/parks/arts-culture/summer-free-all/cultural-events' },
  { date: '2026-07-31', artist: 'Summer Free For All: Concert in the Park — TBA', venue: 'Various Portland Parks', neighborhood: 'Portland', time: '18:30', genre: null, source_name: 'Portland Summer Free For All', source_url: 'https://www.portland.gov/parks/arts-culture/summer-free-all/cultural-events' },
  { date: '2026-08-04', artist: 'Summer Free For All: Concert in the Park — TBA', venue: 'Various Portland Parks', neighborhood: 'Portland', time: '18:30', genre: null, source_name: 'Portland Summer Free For All', source_url: 'https://www.portland.gov/parks/arts-culture/summer-free-all/cultural-events' },
  { date: '2026-08-07', artist: 'Summer Free For All: Concert in the Park — TBA', venue: 'Various Portland Parks', neighborhood: 'Portland', time: '18:30', genre: null, source_name: 'Portland Summer Free For All', source_url: 'https://www.portland.gov/parks/arts-culture/summer-free-all/cultural-events' },
  { date: '2026-08-11', artist: 'Summer Free For All: Concert in the Park — TBA', venue: 'Various Portland Parks', neighborhood: 'Portland', time: '18:30', genre: null, source_name: 'Portland Summer Free For All', source_url: 'https://www.portland.gov/parks/arts-culture/summer-free-all/cultural-events' },
  { date: '2026-08-14', artist: 'Summer Free For All: Concert in the Park — TBA', venue: 'Various Portland Parks', neighborhood: 'Portland', time: '18:30', genre: null, source_name: 'Portland Summer Free For All', source_url: 'https://www.portland.gov/parks/arts-culture/summer-free-all/cultural-events' },
  { date: '2026-08-21', artist: 'Summer Free For All: Concert in the Park — TBA', venue: 'Various Portland Parks', neighborhood: 'Portland', time: '18:30', genre: null, source_name: 'Portland Summer Free For All', source_url: 'https://www.portland.gov/parks/arts-culture/summer-free-all/cultural-events' },
  { date: '2026-08-28', artist: 'Summer Free For All: Concert in the Park — TBA', venue: 'Various Portland Parks', neighborhood: 'Portland', time: '18:30', genre: null, source_name: 'Portland Summer Free For All', source_url: 'https://www.portland.gov/parks/arts-culture/summer-free-all/cultural-events' },

  // Cathedral Park Jazz Festival
  { date: '2026-07-18', artist: 'Cathedral Park Jazz Festival — Day 1', venue: 'Cathedral Park', neighborhood: 'St. Johns', time: '12:00', genre: 'Jazz', source_name: 'Cathedral Park Jazz Festival', source_url: 'https://cathedralpark jazz.com' },
  { date: '2026-07-19', artist: 'Cathedral Park Jazz Festival — Day 2', venue: 'Cathedral Park', neighborhood: 'St. Johns', time: '12:00', genre: 'Jazz', source_name: 'Cathedral Park Jazz Festival', source_url: 'https://cathedralpark jazz.com' },

  // Waterfront Blues Festival — July 4th weekend
  { date: '2026-07-02', artist: 'Waterfront Blues Festival — Day 1', venue: 'Tom McCall Waterfront Park', neighborhood: 'Downtown Portland', time: '11:00', genre: 'Blues', source_name: 'Waterfront Blues Festival', source_url: 'https://waterfrontbluesfest.com' },
  { date: '2026-07-03', artist: 'Waterfront Blues Festival — Day 2', venue: 'Tom McCall Waterfront Park', neighborhood: 'Downtown Portland', time: '11:00', genre: 'Blues', source_name: 'Waterfront Blues Festival', source_url: 'https://waterfrontbluesfest.com' },
  { date: '2026-07-04', artist: 'Waterfront Blues Festival — Day 3', venue: 'Tom McCall Waterfront Park', neighborhood: 'Downtown Portland', time: '11:00', genre: 'Blues', source_name: 'Waterfront Blues Festival', source_url: 'https://waterfrontbluesfest.com' },
  { date: '2026-07-05', artist: 'Waterfront Blues Festival — Day 4', venue: 'Tom McCall Waterfront Park', neighborhood: 'Downtown Portland', time: '11:00', genre: 'Blues', source_name: 'Waterfront Blues Festival', source_url: 'https://waterfrontbluesfest.com' },
]

export function getPortlandShows(): ImportRow[] {
  return SHOWS.map(({ date, artist, venue, neighborhood, time, genre, source_name, source_url }) => ({
    artist_name: artist,
    venue,
    date,
    time,
    neighborhood,
    city: 'PDX' as const,
    genre,
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name,
    source_id: `portland-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url,
  }))
}
