import type { ImportRow } from './types'

const SHOWS: {
  date: string; artist: string; venue: string; neighborhood: string;
  time: string; genre: string | null; source_name: string; source_url: string;
}[] = [
  // Pasadena Symphony free concert — confirmed June 6 2026
  { date: '2026-06-06', artist: 'Pasadena Symphony — Dancin\' in the Streets (Broadway & film music)', venue: 'Sierra Madre Memorial Park', neighborhood: 'Sierra Madre', time: '18:30', genre: 'Classical', source_name: 'Pasadena Symphony', source_url: 'https://www.pasadenasymphony-pops.org' },

  // Playhouse Village Jazz in the Park — every Sunday in July
  { date: '2026-07-05', artist: 'Jazz in the Park — TBA', venue: 'Playhouse Village Park', neighborhood: 'Pasadena', time: '18:00', genre: 'Jazz', source_name: 'Playhouse Village Jazz in the Park', source_url: 'https://playhousevillage.org/summer-concerts-in-the-village/' },
  { date: '2026-07-12', artist: 'Jazz in the Park — TBA', venue: 'Playhouse Village Park', neighborhood: 'Pasadena', time: '18:00', genre: 'Jazz', source_name: 'Playhouse Village Jazz in the Park', source_url: 'https://playhousevillage.org/summer-concerts-in-the-village/' },
  { date: '2026-07-19', artist: 'Jazz in the Park — TBA', venue: 'Playhouse Village Park', neighborhood: 'Pasadena', time: '18:00', genre: 'Jazz', source_name: 'Playhouse Village Jazz in the Park', source_url: 'https://playhousevillage.org/summer-concerts-in-the-village/' },
  { date: '2026-07-26', artist: 'Jazz in the Park — TBA', venue: 'Playhouse Village Park', neighborhood: 'Pasadena', time: '18:00', genre: 'Jazz', source_name: 'Playhouse Village Jazz in the Park', source_url: 'https://playhousevillage.org/summer-concerts-in-the-village/' },

  // Vroman's Summer Music Series — confirmed dates
  { date: '2026-07-12', artist: 'Vroman\'s Summer Music Series — PCM Jazz & World Music faculty', venue: 'Vroman\'s Bookstore Paseo Stage', neighborhood: 'Pasadena', time: '17:00', genre: 'Jazz', source_name: 'Vroman\'s Summer Music Series', source_url: 'https://www.vromansbookstore.com' },
  { date: '2026-08-02', artist: 'Vroman\'s Summer Music Series — PCM Jazz & World Music faculty', venue: 'Vroman\'s Bookstore Paseo Stage', neighborhood: 'Pasadena', time: '17:00', genre: 'World', source_name: 'Vroman\'s Summer Music Series', source_url: 'https://www.vromansbookstore.com' },
]

export function getPasadenaShows(): ImportRow[] {
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
    source_id: `pasadena-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url,
  }))
}
