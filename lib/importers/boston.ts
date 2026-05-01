import type { ImportRow } from './types'

const HATCH = 'DCR Hatch Memorial Shell'
const HATCH_URL = 'https://hatchshell.com'

const SHOWS: { date: string; artist: string; venue: string; neighborhood: string; time: string; genre: string | null; source_name: string; source_url: string }[] = [
  // Boston Landmarks Orchestra — Wednesdays July-August
  { date: '2026-07-08', artist: 'Boston Landmarks Orchestra — Season Opening', venue: HATCH, neighborhood: 'Back Bay Esplanade', time: '19:00', genre: 'Classical', source_name: 'Boston Landmarks Orchestra', source_url: 'https://landmarksorchestra.org' },
  { date: '2026-07-15', artist: 'Boston Landmarks Orchestra — American Classics', venue: HATCH, neighborhood: 'Back Bay Esplanade', time: '19:00', genre: 'Classical', source_name: 'Boston Landmarks Orchestra', source_url: 'https://landmarksorchestra.org' },
  { date: '2026-07-22', artist: 'Boston Landmarks Orchestra — Green Concert: Appalachian Spring & new work by Brian Nabors', venue: HATCH, neighborhood: 'Back Bay Esplanade', time: '19:00', genre: 'Classical', source_name: 'Boston Landmarks Orchestra', source_url: 'https://landmarksorchestra.org' },
  { date: '2026-07-29', artist: 'Boston Landmarks Orchestra with Terri Lyne Carrington — Symphonic legacy of Black women in America', venue: HATCH, neighborhood: 'Back Bay Esplanade', time: '19:00', genre: 'Classical', source_name: 'Boston Landmarks Orchestra', source_url: 'https://landmarksorchestra.org' },
  { date: '2026-08-05', artist: 'Boston Landmarks Orchestra — Gershwin: An American in Paris / Bernstein: On the Town', venue: HATCH, neighborhood: 'Back Bay Esplanade', time: '19:00', genre: 'Classical', source_name: 'Boston Landmarks Orchestra', source_url: 'https://landmarksorchestra.org' },
  { date: '2026-08-12', artist: 'Boston Landmarks Orchestra — Mozart / Joseph Bologne / Fabiola Mendez', venue: HATCH, neighborhood: 'Back Bay Esplanade', time: '19:00', genre: 'Classical', source_name: 'Boston Landmarks Orchestra', source_url: 'https://landmarksorchestra.org' },
  { date: '2026-08-19', artist: 'Boston Landmarks Orchestra — Dance Night: Beethoven Symphony No. 7 / Tchaikovsky Sleeping Beauty with Boston Ballet', venue: HATCH, neighborhood: 'Back Bay Esplanade', time: '19:00', genre: 'Classical', source_name: 'Boston Landmarks Orchestra', source_url: 'https://landmarksorchestra.org' },

  // July 4th Boston Pops
  { date: '2026-07-04', artist: 'Boston Pops July 4th Concert & Fireworks with Keith Lockhart', venue: HATCH, neighborhood: 'Back Bay Esplanade', time: '20:00', genre: 'Classical', source_name: 'Boston Pops July 4th', source_url: HATCH_URL },

  // GroundBeat Free Riverfront Music Series
  { date: '2026-07-10', artist: 'GroundBeat Riverfront Concert — TBA', venue: 'Charles River Esplanade', neighborhood: 'Back Bay Esplanade', time: '18:00', genre: null, source_name: 'GroundBeat Esplanade Concert Series', source_url: 'https://esplanade.org/events/' },
  { date: '2026-07-17', artist: 'GroundBeat Riverfront Concert — TBA', venue: 'Charles River Esplanade', neighborhood: 'Back Bay Esplanade', time: '18:00', genre: null, source_name: 'GroundBeat Esplanade Concert Series', source_url: 'https://esplanade.org/events/' },
  { date: '2026-07-24', artist: 'GroundBeat Riverfront Concert — TBA', venue: 'Charles River Esplanade', neighborhood: 'Back Bay Esplanade', time: '18:00', genre: null, source_name: 'GroundBeat Esplanade Concert Series', source_url: 'https://esplanade.org/events/' },
  { date: '2026-07-31', artist: 'GroundBeat Riverfront Concert — TBA', venue: 'Charles River Esplanade', neighborhood: 'Back Bay Esplanade', time: '18:00', genre: null, source_name: 'GroundBeat Esplanade Concert Series', source_url: 'https://esplanade.org/events/' },
  { date: '2026-08-07', artist: 'GroundBeat Riverfront Concert — TBA', venue: 'Charles River Esplanade', neighborhood: 'Back Bay Esplanade', time: '18:00', genre: null, source_name: 'GroundBeat Esplanade Concert Series', source_url: 'https://esplanade.org/events/' },
  { date: '2026-08-14', artist: 'GroundBeat Riverfront Concert — TBA', venue: 'Charles River Esplanade', neighborhood: 'Back Bay Esplanade', time: '18:00', genre: null, source_name: 'GroundBeat Esplanade Concert Series', source_url: 'https://esplanade.org/events/' },
]

export function getBostonShows(): ImportRow[] {
  return SHOWS.map(({ date, artist, venue, neighborhood, time, genre, source_name, source_url }) => ({
    artist_name: artist,
    venue,
    date,
    time,
    neighborhood,
    city: 'BOS' as const,
    genre,
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name,
    source_id: `boston-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url,
  }))
}
