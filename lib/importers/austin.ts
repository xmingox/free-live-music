import type { ImportRow } from './types'

const SHOWS: {
  date: string; artist: string; venue: string; neighborhood: string;
  time: string; genre: string | null; source_name: string; source_url: string;
}[] = [
  // Blues on the Green — Zilker Park, June 9-10
  { date: '2026-06-09', artist: 'Blues on the Green — TBA', venue: 'Zilker Park', neighborhood: 'Zilker', time: '19:00', genre: 'Blues', source_name: 'Blues on the Green', source_url: 'https://www.bluesonthegreen.com' },
  { date: '2026-06-10', artist: 'Blues on the Green — TBA', venue: 'Zilker Park', neighborhood: 'Zilker', time: '19:00', genre: 'Blues', source_name: 'Blues on the Green', source_url: 'https://www.bluesonthegreen.com' },

  // Austin Symphony July 4th
  { date: '2026-07-04', artist: 'Austin Symphony July 4th Concert & Fireworks', venue: 'Auditorium Shores', neighborhood: 'South Congress', time: '20:00', genre: 'Classical', source_name: 'Austin Symphony', source_url: 'https://austinsymphony.org' },

  // Hot Summer Nights — Red River Cultural District, July 16-18
  { date: '2026-07-16', artist: 'Hot Summer Nights — Day 1 (multiple stages)', venue: 'Red River Cultural District', neighborhood: 'Red River', time: '18:00', genre: null, source_name: 'Hot Summer Nights', source_url: 'https://redriverculturaldistrict.org' },
  { date: '2026-07-17', artist: 'Hot Summer Nights — Day 2 (multiple stages)', venue: 'Red River Cultural District', neighborhood: 'Red River', time: '18:00', genre: null, source_name: 'Hot Summer Nights', source_url: 'https://redriverculturaldistrict.org' },
  { date: '2026-07-18', artist: 'Hot Summer Nights — Day 3 (multiple stages)', venue: 'Red River Cultural District', neighborhood: 'Red River', time: '18:00', genre: null, source_name: 'Hot Summer Nights', source_url: 'https://redriverculturaldistrict.org' },

  // The Drop-In — Long Center, every Thursday May 22–Aug 14
  { date: '2026-05-22', artist: 'The Drop-In: Andrew Cashen & The Disciples of Creation', venue: 'Long Center Hartman Concert Lawn', neighborhood: 'Rainey Street', time: '19:00', genre: null, source_name: 'The Drop-In at Long Center', source_url: 'https://thelongcenter.org/thedropin/' },
  { date: '2026-05-28', artist: 'The Drop-In: Angelica Rahe', venue: 'Long Center Hartman Concert Lawn', neighborhood: 'Rainey Street', time: '19:00', genre: null, source_name: 'The Drop-In at Long Center', source_url: 'https://thelongcenter.org/thedropin/' },
  { date: '2026-06-04', artist: 'The Drop-In: Brownout', venue: 'Long Center Hartman Concert Lawn', neighborhood: 'Rainey Street', time: '19:00', genre: 'Latin', source_name: 'The Drop-In at Long Center', source_url: 'https://thelongcenter.org/thedropin/' },
  { date: '2026-06-11', artist: 'The Drop-In: Cilantro Boombox', venue: 'Long Center Hartman Concert Lawn', neighborhood: 'Rainey Street', time: '19:00', genre: null, source_name: 'The Drop-In at Long Center', source_url: 'https://thelongcenter.org/thedropin/' },
  { date: '2026-06-18', artist: 'The Drop-In: Chicoselfie', venue: 'Long Center Hartman Concert Lawn', neighborhood: 'Rainey Street', time: '19:00', genre: null, source_name: 'The Drop-In at Long Center', source_url: 'https://thelongcenter.org/thedropin/' },
  { date: '2026-06-25', artist: 'The Drop-In: Geto Gala', venue: 'Long Center Hartman Concert Lawn', neighborhood: 'Rainey Street', time: '19:00', genre: null, source_name: 'The Drop-In at Long Center', source_url: 'https://thelongcenter.org/thedropin/' },
  { date: '2026-07-02', artist: 'The Drop-In: Hotel de Nova', venue: 'Long Center Hartman Concert Lawn', neighborhood: 'Rainey Street', time: '19:00', genre: null, source_name: 'The Drop-In at Long Center', source_url: 'https://thelongcenter.org/thedropin/' },
  { date: '2026-07-09', artist: 'The Drop-In: Jo Alice', venue: 'Long Center Hartman Concert Lawn', neighborhood: 'Rainey Street', time: '19:00', genre: null, source_name: 'The Drop-In at Long Center', source_url: 'https://thelongcenter.org/thedropin/' },
  { date: '2026-07-16', artist: 'The Drop-In: L.C. Franke', venue: 'Long Center Hartman Concert Lawn', neighborhood: 'Rainey Street', time: '19:00', genre: null, source_name: 'The Drop-In at Long Center', source_url: 'https://thelongcenter.org/thedropin/' },
  { date: '2026-07-23', artist: 'The Drop-In: Mama Duke', venue: 'Long Center Hartman Concert Lawn', neighborhood: 'Rainey Street', time: '19:00', genre: null, source_name: 'The Drop-In at Long Center', source_url: 'https://thelongcenter.org/thedropin/' },
  { date: '2026-07-30', artist: 'The Drop-In: Blakchyl', venue: 'Long Center Hartman Concert Lawn', neighborhood: 'Rainey Street', time: '19:00', genre: null, source_name: 'The Drop-In at Long Center', source_url: 'https://thelongcenter.org/thedropin/' },
  { date: '2026-08-06', artist: 'The Drop-In: cheetah cheetah', venue: 'Long Center Hartman Concert Lawn', neighborhood: 'Rainey Street', time: '19:00', genre: null, source_name: 'The Drop-In at Long Center', source_url: 'https://thelongcenter.org/thedropin/' },
  { date: '2026-08-13', artist: 'The Drop-In: Nane ft. TBA', venue: 'Long Center Hartman Concert Lawn', neighborhood: 'Rainey Street', time: '19:00', genre: null, source_name: 'The Drop-In at Long Center', source_url: 'https://thelongcenter.org/thedropin/' },

  // Music Under the Star — Bullock Museum, monthly
  { date: '2026-06-05', artist: 'Music Under the Star — TBA', venue: 'Capitol Mall Amphitheater', neighborhood: 'Capitol', time: '19:00', genre: null, source_name: 'Music Under the Star', source_url: 'https://www.bullock museum.org' },
  { date: '2026-07-10', artist: 'Music Under the Star — TBA', venue: 'Capitol Mall Amphitheater', neighborhood: 'Capitol', time: '19:00', genre: null, source_name: 'Music Under the Star', source_url: 'https://www.bullockmuseum.org' },
  { date: '2026-08-07', artist: 'Music Under the Star — TBA', venue: 'Capitol Mall Amphitheater', neighborhood: 'Capitol', time: '19:00', genre: null, source_name: 'Music Under the Star', source_url: 'https://www.bullockmuseum.org' },

  // Pecan Street Festival — Hill Country Galleria, May & Sept
  { date: '2026-05-09', artist: 'Pecan Street Festival — Spring (multiple stages)', venue: 'Hill Country Galleria', neighborhood: 'Bee Cave', time: '10:00', genre: null, source_name: 'Pecan Street Festival', source_url: 'https://pecanstreetfestival.org' },
  { date: '2026-05-10', artist: 'Pecan Street Festival — Spring Day 2 (multiple stages)', venue: 'Hill Country Galleria', neighborhood: 'Bee Cave', time: '10:00', genre: null, source_name: 'Pecan Street Festival', source_url: 'https://pecanstreetfestival.org' },
  { date: '2026-09-12', artist: 'Pecan Street Festival — Fall (multiple stages)', venue: 'Hill Country Galleria', neighborhood: 'Bee Cave', time: '10:00', genre: null, source_name: 'Pecan Street Festival', source_url: 'https://pecanstreetfestival.org' },
  { date: '2026-09-13', artist: 'Pecan Street Festival — Fall Day 2 (multiple stages)', venue: 'Hill Country Galleria', neighborhood: 'Bee Cave', time: '10:00', genre: null, source_name: 'Pecan Street Festival', source_url: 'https://pecanstreetfestival.org' },
]

export function getAustinShows(): ImportRow[] {
  return SHOWS.map(({ date, artist, venue, neighborhood, time, genre, source_name, source_url }) => ({
    artist_name: artist,
    venue,
    date,
    time,
    neighborhood,
    city: 'AUS' as const,
    genre,
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name,
    source_id: `austin-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url,
  }))
}
