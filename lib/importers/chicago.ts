import type { ImportRow } from './types'

const PRITZKER = 'Jay Pritzker Pavilion'
const MILLENNIUM = 'Millennium Park'
const NEIGHBORHOOD = 'Downtown / Loop'

const SHOWS: { date: string; artist: string; venue: string; time: string; source_name: string; source_url: string; genre: string | null }[] = [
  // Grant Park Music Festival — Wed & Fri evenings June 10 – Aug 15
  { date: '2026-06-10', artist: 'Grant Park Orchestra: Bernstein West Side Story / Joan Tower / Samuel Barber', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-06-12', artist: 'Grant Park Orchestra: Brahms Symphony No. 4', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-06-17', artist: 'Grant Park Orchestra: Copland Symphony No. 3', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-06-19', artist: 'Grant Park Orchestra: Tchaikovsky Piano Concerto No. 1', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-06-24', artist: 'Grant Park Orchestra: Rachmaninov Piano Concerto No. 3', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-07-01', artist: 'Grant Park Orchestra: Sibelius Symphony No. 2', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-07-02', artist: 'Grant Park Chorus: American Traditional & Contemporary Choral Works', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-07-03', artist: 'Grant Park Orchestra: Independence Day Salute', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-07-08', artist: 'Grant Park Orchestra: Tchaikovsky Symphony No. 5', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-07-10', artist: 'Grant Park Orchestra: Beethoven Symphony No. 9', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-07-15', artist: 'Grant Park Orchestra: Program TBA', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-07-17', artist: 'Grant Park Chorus: Fauré Requiem (Christopher Bell 25th Season)', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-07-22', artist: 'Grant Park Orchestra: Program TBA', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-07-24', artist: 'Grant Park Orchestra: Program TBA', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-07-29', artist: 'Grant Park Orchestra with Ben Folds — Special Evening', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-08-05', artist: 'Grant Park Orchestra: Program TBA', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-08-07', artist: 'Grant Park Orchestra: Program TBA', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-08-12', artist: 'Grant Park Orchestra: Program TBA', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },
  { date: '2026-08-14', artist: 'Grant Park Orchestra: Illinois Premiere — Liberty Bell by Julie Wolfe', venue: PRITZKER, time: '18:30', source_name: 'Grant Park Music Festival', source_url: 'https://www.grantparkmusicfestival.com', genre: 'Classical' },

  // Millennium Park Summer Music Series — select Mon/Thu June 15–Aug 6
  { date: '2026-06-15', artist: 'Millennium Park Summer Music Series — TBA', venue: PRITZKER, time: '18:30', source_name: 'Millennium Park Summer Music Series', source_url: 'https://www.chicago.gov/city/en/depts/dca/supp_info/millennium_park9.html', genre: null },
  { date: '2026-06-18', artist: 'Millennium Park Summer Music Series — TBA', venue: PRITZKER, time: '18:30', source_name: 'Millennium Park Summer Music Series', source_url: 'https://www.chicago.gov/city/en/depts/dca/supp_info/millennium_park9.html', genre: null },
  { date: '2026-06-22', artist: 'Millennium Park Summer Music Series — TBA', venue: PRITZKER, time: '18:30', source_name: 'Millennium Park Summer Music Series', source_url: 'https://www.chicago.gov/city/en/depts/dca/supp_info/millennium_park9.html', genre: null },
  { date: '2026-06-25', artist: 'Millennium Park Summer Music Series — TBA', venue: PRITZKER, time: '18:30', source_name: 'Millennium Park Summer Music Series', source_url: 'https://www.chicago.gov/city/en/depts/dca/supp_info/millennium_park9.html', genre: null },
  { date: '2026-07-06', artist: 'Millennium Park Summer Music Series — TBA', venue: PRITZKER, time: '18:30', source_name: 'Millennium Park Summer Music Series', source_url: 'https://www.chicago.gov/city/en/depts/dca/supp_info/millennium_park9.html', genre: null },
  { date: '2026-07-09', artist: 'Millennium Park Summer Music Series — TBA', venue: PRITZKER, time: '18:30', source_name: 'Millennium Park Summer Music Series', source_url: 'https://www.chicago.gov/city/en/depts/dca/supp_info/millennium_park9.html', genre: null },
  { date: '2026-07-13', artist: 'Millennium Park Summer Music Series — TBA', venue: PRITZKER, time: '18:30', source_name: 'Millennium Park Summer Music Series', source_url: 'https://www.chicago.gov/city/en/depts/dca/supp_info/millennium_park9.html', genre: null },
  { date: '2026-07-20', artist: 'Millennium Park Summer Music Series — TBA', venue: PRITZKER, time: '18:30', source_name: 'Millennium Park Summer Music Series', source_url: 'https://www.chicago.gov/city/en/depts/dca/supp_info/millennium_park9.html', genre: null },
  { date: '2026-08-06', artist: 'Millennium Park Summer Music Series — TBA', venue: PRITZKER, time: '18:30', source_name: 'Millennium Park Summer Music Series', source_url: 'https://www.chicago.gov/city/en/depts/dca/supp_info/millennium_park9.html', genre: null },

  // Chicago Blues Festival — June 4-7
  { date: '2026-06-04', artist: 'Chicago Blues Festival — Day 1', venue: MILLENNIUM, time: '11:00', source_name: 'Chicago Blues Festival', source_url: 'https://www.choosechicago.com/articles/chicago-music/chicago-blues-festival/', genre: 'Blues' },
  { date: '2026-06-05', artist: 'Chicago Blues Festival — Day 2', venue: MILLENNIUM, time: '11:00', source_name: 'Chicago Blues Festival', source_url: 'https://www.choosechicago.com/articles/chicago-music/chicago-blues-festival/', genre: 'Blues' },
  { date: '2026-06-06', artist: 'Chicago Blues Festival — Day 3', venue: MILLENNIUM, time: '11:00', source_name: 'Chicago Blues Festival', source_url: 'https://www.choosechicago.com/articles/chicago-music/chicago-blues-festival/', genre: 'Blues' },
  { date: '2026-06-07', artist: 'Chicago Blues Festival — Day 4', venue: MILLENNIUM, time: '11:00', source_name: 'Chicago Blues Festival', source_url: 'https://www.choosechicago.com/articles/chicago-music/chicago-blues-festival/', genre: 'Blues' },

  // Chicago Gospel Music Festival — July 24-25
  { date: '2026-07-24', artist: 'Chicago Gospel Music Festival — Day 1', venue: PRITZKER, time: '11:00', source_name: 'Chicago Gospel Music Festival', source_url: 'https://www.choosechicago.com', genre: 'Gospel' },
  { date: '2026-07-25', artist: 'Chicago Gospel Music Festival — Day 2', venue: PRITZKER, time: '11:00', source_name: 'Chicago Gospel Music Festival', source_url: 'https://www.choosechicago.com', genre: 'Gospel' },

  // Chicago House Music Festival — Aug 27-30
  { date: '2026-08-27', artist: 'Chicago House Music Festival — Day 1', venue: MILLENNIUM, time: '12:00', source_name: 'Chicago House Music Festival', source_url: 'https://www.choosechicago.com', genre: 'Electronic' },
  { date: '2026-08-28', artist: 'Chicago House Music Festival — Day 2', venue: MILLENNIUM, time: '12:00', source_name: 'Chicago House Music Festival', source_url: 'https://www.choosechicago.com', genre: 'Electronic' },
  { date: '2026-08-29', artist: 'Chicago House Music Festival — Day 3', venue: MILLENNIUM, time: '12:00', source_name: 'Chicago House Music Festival', source_url: 'https://www.choosechicago.com', genre: 'Electronic' },
  { date: '2026-08-30', artist: 'Chicago House Music Festival — Day 4', venue: MILLENNIUM, time: '12:00', source_name: 'Chicago House Music Festival', source_url: 'https://www.choosechicago.com', genre: 'Electronic' },

  // Chicago Jazz Festival — Sept 3-6
  { date: '2026-09-03', artist: 'Chicago Jazz Festival — Day 1', venue: PRITZKER, time: '11:00', source_name: 'Chicago Jazz Festival', source_url: 'https://www.choosechicago.com/articles/festivals-special-events/chicago-jazz-festival/', genre: 'Jazz' },
  { date: '2026-09-04', artist: 'Chicago Jazz Festival — Day 2', venue: PRITZKER, time: '11:00', source_name: 'Chicago Jazz Festival', source_url: 'https://www.choosechicago.com/articles/festivals-special-events/chicago-jazz-festival/', genre: 'Jazz' },
  { date: '2026-09-05', artist: 'Chicago Jazz Festival — Day 3', venue: PRITZKER, time: '11:00', source_name: 'Chicago Jazz Festival', source_url: 'https://www.choosechicago.com/articles/festivals-special-events/chicago-jazz-festival/', genre: 'Jazz' },
  { date: '2026-09-06', artist: 'Chicago Jazz Festival — Day 4', venue: PRITZKER, time: '11:00', source_name: 'Chicago Jazz Festival', source_url: 'https://www.choosechicago.com/articles/festivals-special-events/chicago-jazz-festival/', genre: 'Jazz' },
]

export function getChicagoShows(): ImportRow[] {
  return SHOWS.map(({ date, artist, venue, time, source_name, source_url, genre }) => ({
    artist_name: artist,
    venue,
    date,
    time,
    neighborhood: NEIGHBORHOOD,
    city: 'CHI' as const,
    genre,
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name,
    source_id: `chicago-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url,
  }))
}
