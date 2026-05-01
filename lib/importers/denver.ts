import type { ImportRow } from './types'

const SHOWS: { date: string; artist: string; venue: string; neighborhood: string; time: string; genre: string | null; source_name: string; source_url: string }[] = [
  // City Park Jazz — Sundays June 7–August 9, 40th anniversary season
  { date: '2026-06-07', artist: 'City Park Jazz 40th Anniversary: Hazel Miller and the Collective', venue: 'City Park Bandshell', neighborhood: 'City Park', time: '18:00', genre: 'Jazz', source_name: 'City Park Jazz', source_url: 'https://cityparkjazz.org' },
  { date: '2026-06-14', artist: 'City Park Jazz: Shane Endsley and the Denver Municipal Band', venue: 'City Park Bandshell', neighborhood: 'City Park', time: '18:00', genre: 'Jazz', source_name: 'City Park Jazz', source_url: 'https://cityparkjazz.org' },
  { date: '2026-06-21', artist: 'City Park Jazz: Conjunto Colores', venue: 'City Park Bandshell', neighborhood: 'City Park', time: '18:00', genre: 'Latin', source_name: 'City Park Jazz', source_url: 'https://cityparkjazz.org' },
  { date: '2026-06-28', artist: 'City Park Jazz — TBA', venue: 'City Park Bandshell', neighborhood: 'City Park', time: '18:00', genre: 'Jazz', source_name: 'City Park Jazz', source_url: 'https://cityparkjazz.org' },
  { date: '2026-07-05', artist: 'City Park Jazz — TBA', venue: 'City Park Bandshell', neighborhood: 'City Park', time: '18:00', genre: 'Jazz', source_name: 'City Park Jazz', source_url: 'https://cityparkjazz.org' },
  { date: '2026-07-12', artist: 'City Park Jazz — TBA', venue: 'City Park Bandshell', neighborhood: 'City Park', time: '18:00', genre: 'Jazz', source_name: 'City Park Jazz', source_url: 'https://cityparkjazz.org' },
  { date: '2026-07-19', artist: 'City Park Jazz — TBA', venue: 'City Park Bandshell', neighborhood: 'City Park', time: '18:00', genre: 'Jazz', source_name: 'City Park Jazz', source_url: 'https://cityparkjazz.org' },
  { date: '2026-07-26', artist: 'City Park Jazz — TBA', venue: 'City Park Bandshell', neighborhood: 'City Park', time: '18:00', genre: 'Jazz', source_name: 'City Park Jazz', source_url: 'https://cityparkjazz.org' },
  { date: '2026-08-02', artist: 'City Park Jazz — TBA', venue: 'City Park Bandshell', neighborhood: 'City Park', time: '18:00', genre: 'Jazz', source_name: 'City Park Jazz', source_url: 'https://cityparkjazz.org' },
  { date: '2026-08-09', artist: 'City Park Jazz: Brass Band Extravaganza — Bourbon Brass Band & Bada Boom Brass Band', venue: 'City Park Bandshell', neighborhood: 'City Park', time: '18:00', genre: 'Jazz', source_name: 'City Park Jazz', source_url: 'https://cityparkjazz.org' },

  // Levitt Pavilion Denver — confirmed free shows
  { date: '2026-05-28', artist: 'Levitt Pavilion Denver — TBA', venue: 'Levitt Pavilion at Ruby Hill Park', neighborhood: 'Ruby Hill', time: '18:00', genre: null, source_name: 'Levitt Pavilion Denver', source_url: 'https://levittdenver.org' },
  { date: '2026-06-04', artist: 'Levitt Pavilion Denver: Lettuce', venue: 'Levitt Pavilion at Ruby Hill Park', neighborhood: 'Ruby Hill', time: '18:00', genre: 'Funk', source_name: 'Levitt Pavilion Denver', source_url: 'https://levittdenver.org' },
  { date: '2026-06-11', artist: 'Levitt Pavilion Denver: Inspector', venue: 'Levitt Pavilion at Ruby Hill Park', neighborhood: 'Ruby Hill', time: '18:00', genre: null, source_name: 'Levitt Pavilion Denver', source_url: 'https://levittdenver.org' },
  { date: '2026-06-18', artist: 'Levitt Pavilion Denver: Rainbow Girls', venue: 'Levitt Pavilion at Ruby Hill Park', neighborhood: 'Ruby Hill', time: '18:00', genre: 'Folk', source_name: 'Levitt Pavilion Denver', source_url: 'https://levittdenver.org' },
  { date: '2026-06-25', artist: 'Levitt Pavilion Denver: Shwayze with Claire Wright', venue: 'Levitt Pavilion at Ruby Hill Park', neighborhood: 'Ruby Hill', time: '18:00', genre: null, source_name: 'Levitt Pavilion Denver', source_url: 'https://levittdenver.org' },
  { date: '2026-07-02', artist: 'Levitt Pavilion Denver: Kyle Hollingsworth Band', venue: 'Levitt Pavilion at Ruby Hill Park', neighborhood: 'Ruby Hill', time: '18:00', genre: null, source_name: 'Levitt Pavilion Denver', source_url: 'https://levittdenver.org' },
  { date: '2026-07-09', artist: 'Levitt Pavilion Denver — TBA', venue: 'Levitt Pavilion at Ruby Hill Park', neighborhood: 'Ruby Hill', time: '18:00', genre: null, source_name: 'Levitt Pavilion Denver', source_url: 'https://levittdenver.org' },
  { date: '2026-07-16', artist: 'Levitt Pavilion Denver — TBA', venue: 'Levitt Pavilion at Ruby Hill Park', neighborhood: 'Ruby Hill', time: '18:00', genre: null, source_name: 'Levitt Pavilion Denver', source_url: 'https://levittdenver.org' },
  { date: '2026-07-23', artist: 'Levitt Pavilion Denver — TBA', venue: 'Levitt Pavilion at Ruby Hill Park', neighborhood: 'Ruby Hill', time: '18:00', genre: null, source_name: 'Levitt Pavilion Denver', source_url: 'https://levittdenver.org' },
  { date: '2026-07-30', artist: 'Levitt Pavilion Denver — TBA', venue: 'Levitt Pavilion at Ruby Hill Park', neighborhood: 'Ruby Hill', time: '18:00', genre: null, source_name: 'Levitt Pavilion Denver', source_url: 'https://levittdenver.org' },
  { date: '2026-08-06', artist: 'Levitt Pavilion Denver — TBA', venue: 'Levitt Pavilion at Ruby Hill Park', neighborhood: 'Ruby Hill', time: '18:00', genre: null, source_name: 'Levitt Pavilion Denver', source_url: 'https://levittdenver.org' },
  { date: '2026-08-13', artist: 'Levitt Pavilion Denver — TBA', venue: 'Levitt Pavilion at Ruby Hill Park', neighborhood: 'Ruby Hill', time: '18:00', genre: null, source_name: 'Levitt Pavilion Denver', source_url: 'https://levittdenver.org' },
  { date: '2026-08-20', artist: 'Levitt Pavilion Denver — TBA', venue: 'Levitt Pavilion at Ruby Hill Park', neighborhood: 'Ruby Hill', time: '18:00', genre: null, source_name: 'Levitt Pavilion Denver', source_url: 'https://levittdenver.org' },
  { date: '2026-08-27', artist: 'Levitt Pavilion Denver — TBA', venue: 'Levitt Pavilion at Ruby Hill Park', neighborhood: 'Ruby Hill', time: '18:00', genre: null, source_name: 'Levitt Pavilion Denver', source_url: 'https://levittdenver.org' },

  // Civic Center Park Concert Series
  { date: '2026-06-06', artist: 'Summer Sessions at Riverfront Park — free live music', venue: 'Riverfront Park', neighborhood: 'Downtown Denver', time: '14:00', genre: null, source_name: 'Denver Summer Sessions', source_url: 'https://civiccenterpark.org/events/concerts/' },
  { date: '2026-06-13', artist: 'Civic Center Park Concert — TBA', venue: 'Civic Center Park', neighborhood: 'Downtown Denver', time: '18:30', genre: null, source_name: 'Civic Center Park Concerts', source_url: 'https://civiccenterpark.org/events/concerts/' },
  { date: '2026-06-20', artist: 'Civic Center Park Concert — TBA', venue: 'Civic Center Park', neighborhood: 'Downtown Denver', time: '18:30', genre: null, source_name: 'Civic Center Park Concerts', source_url: 'https://civiccenterpark.org/events/concerts/' },
  { date: '2026-06-27', artist: 'Civic Center Park Concert — TBA', venue: 'Civic Center Park', neighborhood: 'Downtown Denver', time: '18:30', genre: null, source_name: 'Civic Center Park Concerts', source_url: 'https://civiccenterpark.org/events/concerts/' },
  { date: '2026-07-11', artist: 'Civic Center Park Concert — TBA', venue: 'Civic Center Park', neighborhood: 'Downtown Denver', time: '18:30', genre: null, source_name: 'Civic Center Park Concerts', source_url: 'https://civiccenterpark.org/events/concerts/' },
  { date: '2026-07-18', artist: 'Civic Center Park Concert — TBA', venue: 'Civic Center Park', neighborhood: 'Downtown Denver', time: '18:30', genre: null, source_name: 'Civic Center Park Concerts', source_url: 'https://civiccenterpark.org/events/concerts/' },
  { date: '2026-07-25', artist: 'Civic Center Park Concert — TBA', venue: 'Civic Center Park', neighborhood: 'Downtown Denver', time: '18:30', genre: null, source_name: 'Civic Center Park Concerts', source_url: 'https://civiccenterpark.org/events/concerts/' },
  { date: '2026-08-01', artist: 'Civic Center Park Concert — TBA', venue: 'Civic Center Park', neighborhood: 'Downtown Denver', time: '18:30', genre: null, source_name: 'Civic Center Park Concerts', source_url: 'https://civiccenterpark.org/events/concerts/' },
  { date: '2026-08-08', artist: 'Civic Center Park Concert — TBA', venue: 'Civic Center Park', neighborhood: 'Downtown Denver', time: '18:30', genre: null, source_name: 'Civic Center Park Concerts', source_url: 'https://civiccenterpark.org/events/concerts/' },
]

export function getDenverShows(): ImportRow[] {
  return SHOWS.map(({ date, artist, venue, neighborhood, time, genre, source_name, source_url }) => ({
    artist_name: artist,
    venue,
    date,
    time,
    neighborhood,
    city: 'DEN' as const,
    genre,
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name,
    source_id: `denver-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url,
  }))
}
