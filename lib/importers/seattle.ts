import type { ImportRow } from './types'

const SHOWS: {
  date: string; artist: string; venue: string; neighborhood: string;
  time: string; genre: string | null; source_name: string; source_url: string;
}[] = [
  // Downtown Summer Sounds — Thursdays July 9–Aug 27
  { date: '2026-07-09', artist: 'Downtown Summer Sounds — TBA', venue: 'Westlake Park', neighborhood: 'Downtown', time: '18:00', genre: null, source_name: 'Downtown Summer Sounds', source_url: 'https://downtownseattle.org/events/downtown-summer-sounds/' },
  { date: '2026-07-16', artist: 'Downtown Summer Sounds — TBA', venue: 'Westlake Park', neighborhood: 'Downtown', time: '18:00', genre: null, source_name: 'Downtown Summer Sounds', source_url: 'https://downtownseattle.org/events/downtown-summer-sounds/' },
  { date: '2026-07-23', artist: 'Downtown Summer Sounds — TBA', venue: 'Westlake Park', neighborhood: 'Downtown', time: '18:00', genre: null, source_name: 'Downtown Summer Sounds', source_url: 'https://downtownseattle.org/events/downtown-summer-sounds/' },
  { date: '2026-07-30', artist: 'Downtown Summer Sounds — TBA', venue: 'Occidental Square', neighborhood: 'Pioneer Square', time: '18:00', genre: null, source_name: 'Downtown Summer Sounds', source_url: 'https://downtownseattle.org/events/downtown-summer-sounds/' },
  { date: '2026-08-06', artist: 'Downtown Summer Sounds — TBA', venue: 'Bell Street Park', neighborhood: 'Belltown', time: '18:00', genre: null, source_name: 'Downtown Summer Sounds', source_url: 'https://downtownseattle.org/events/downtown-summer-sounds/' },
  { date: '2026-08-13', artist: 'Downtown Summer Sounds — TBA', venue: 'Union Square', neighborhood: 'Downtown', time: '18:00', genre: null, source_name: 'Downtown Summer Sounds', source_url: 'https://downtownseattle.org/events/downtown-summer-sounds/' },
  { date: '2026-08-20', artist: 'Downtown Summer Sounds — TBA', venue: 'Westlake Park', neighborhood: 'Downtown', time: '18:00', genre: null, source_name: 'Downtown Summer Sounds', source_url: 'https://downtownseattle.org/events/downtown-summer-sounds/' },
  { date: '2026-08-27', artist: 'Downtown Summer Sounds — TBA', venue: 'Westlake Park', neighborhood: 'Downtown', time: '18:00', genre: null, source_name: 'Downtown Summer Sounds', source_url: 'https://downtownseattle.org/events/downtown-summer-sounds/' },

  // Ballard Locks — weekends June–Labor Day
  { date: '2026-06-06', artist: 'Ballard Locks Summer Concert — TBA', venue: 'Hiram M. Chittenden Ballard Locks', neighborhood: 'Ballard', time: '14:00', genre: null, source_name: 'Ballard Locks Summer Concerts', source_url: 'https://www.nws.usace.army.mil/Missions/Civil-Works/Locks-and-Dams/Chittenden-Locks/' },
  { date: '2026-06-13', artist: 'Ballard Locks Summer Concert — TBA', venue: 'Hiram M. Chittenden Ballard Locks', neighborhood: 'Ballard', time: '14:00', genre: null, source_name: 'Ballard Locks Summer Concerts', source_url: 'https://www.nws.usace.army.mil/Missions/Civil-Works/Locks-and-Dams/Chittenden-Locks/' },
  { date: '2026-06-20', artist: 'Ballard Locks Summer Concert — TBA', venue: 'Hiram M. Chittenden Ballard Locks', neighborhood: 'Ballard', time: '14:00', genre: null, source_name: 'Ballard Locks Summer Concerts', source_url: 'https://www.nws.usace.army.mil/Missions/Civil-Works/Locks-and-Dams/Chittenden-Locks/' },
  { date: '2026-06-27', artist: 'Ballard Locks Summer Concert — TBA', venue: 'Hiram M. Chittenden Ballard Locks', neighborhood: 'Ballard', time: '14:00', genre: null, source_name: 'Ballard Locks Summer Concerts', source_url: 'https://www.nws.usace.army.mil/Missions/Civil-Works/Locks-and-Dams/Chittenden-Locks/' },
  { date: '2026-07-04', artist: 'Ballard Locks Summer Concert — TBA', venue: 'Hiram M. Chittenden Ballard Locks', neighborhood: 'Ballard', time: '14:00', genre: null, source_name: 'Ballard Locks Summer Concerts', source_url: 'https://www.nws.usace.army.mil/Missions/Civil-Works/Locks-and-Dams/Chittenden-Locks/' },
  { date: '2026-07-11', artist: 'Ballard Locks Summer Concert — TBA', venue: 'Hiram M. Chittenden Ballard Locks', neighborhood: 'Ballard', time: '14:00', genre: null, source_name: 'Ballard Locks Summer Concerts', source_url: 'https://www.nws.usace.army.mil/Missions/Civil-Works/Locks-and-Dams/Chittenden-Locks/' },
  { date: '2026-07-18', artist: 'Ballard Locks Summer Concert — TBA', venue: 'Hiram M. Chittenden Ballard Locks', neighborhood: 'Ballard', time: '14:00', genre: null, source_name: 'Ballard Locks Summer Concerts', source_url: 'https://www.nws.usace.army.mil/Missions/Civil-Works/Locks-and-Dams/Chittenden-Locks/' },
  { date: '2026-07-25', artist: 'Ballard Locks Summer Concert — TBA', venue: 'Hiram M. Chittenden Ballard Locks', neighborhood: 'Ballard', time: '14:00', genre: null, source_name: 'Ballard Locks Summer Concerts', source_url: 'https://www.nws.usace.army.mil/Missions/Civil-Works/Locks-and-Dams/Chittenden-Locks/' },
  { date: '2026-08-01', artist: 'Ballard Locks Summer Concert — TBA', venue: 'Hiram M. Chittenden Ballard Locks', neighborhood: 'Ballard', time: '14:00', genre: null, source_name: 'Ballard Locks Summer Concerts', source_url: 'https://www.nws.usace.army.mil/Missions/Civil-Works/Locks-and-Dams/Chittenden-Locks/' },
  { date: '2026-08-08', artist: 'Ballard Locks Summer Concert — TBA', venue: 'Hiram M. Chittenden Ballard Locks', neighborhood: 'Ballard', time: '14:00', genre: null, source_name: 'Ballard Locks Summer Concerts', source_url: 'https://www.nws.usace.army.mil/Missions/Civil-Works/Locks-and-Dams/Chittenden-Locks/' },
  { date: '2026-08-15', artist: 'Ballard Locks Summer Concert — TBA', venue: 'Hiram M. Chittenden Ballard Locks', neighborhood: 'Ballard', time: '14:00', genre: null, source_name: 'Ballard Locks Summer Concerts', source_url: 'https://www.nws.usace.army.mil/Missions/Civil-Works/Locks-and-Dams/Chittenden-Locks/' },
  { date: '2026-08-22', artist: 'Ballard Locks Summer Concert — TBA', venue: 'Hiram M. Chittenden Ballard Locks', neighborhood: 'Ballard', time: '14:00', genre: null, source_name: 'Ballard Locks Summer Concerts', source_url: 'https://www.nws.usace.army.mil/Missions/Civil-Works/Locks-and-Dams/Chittenden-Locks/' },
  { date: '2026-08-29', artist: 'Ballard Locks Summer Concert — TBA', venue: 'Hiram M. Chittenden Ballard Locks', neighborhood: 'Ballard', time: '14:00', genre: null, source_name: 'Ballard Locks Summer Concerts', source_url: 'https://www.nws.usace.army.mil/Missions/Civil-Works/Locks-and-Dams/Chittenden-Locks/' },

  // Volunteer Park Amphitheater — Thursday evenings July-August
  { date: '2026-07-02', artist: 'Volunteer Park Summer Music — TBA', venue: 'Volunteer Park Amphitheater', neighborhood: 'Capitol Hill', time: '19:00', genre: null, source_name: 'Volunteer Park Summer Music', source_url: 'https://volunteerparktrust.org' },
  { date: '2026-07-09', artist: 'Volunteer Park Summer Music — TBA', venue: 'Volunteer Park Amphitheater', neighborhood: 'Capitol Hill', time: '19:00', genre: null, source_name: 'Volunteer Park Summer Music', source_url: 'https://volunteerparktrust.org' },
  { date: '2026-07-16', artist: 'Volunteer Park Summer Music — TBA', venue: 'Volunteer Park Amphitheater', neighborhood: 'Capitol Hill', time: '19:00', genre: null, source_name: 'Volunteer Park Summer Music', source_url: 'https://volunteerparktrust.org' },
  { date: '2026-07-23', artist: 'Volunteer Park Summer Music — TBA', venue: 'Volunteer Park Amphitheater', neighborhood: 'Capitol Hill', time: '19:00', genre: null, source_name: 'Volunteer Park Summer Music', source_url: 'https://volunteerparktrust.org' },
  { date: '2026-07-30', artist: 'Volunteer Park Summer Music — TBA', venue: 'Volunteer Park Amphitheater', neighborhood: 'Capitol Hill', time: '19:00', genre: null, source_name: 'Volunteer Park Summer Music', source_url: 'https://volunteerparktrust.org' },
  { date: '2026-08-06', artist: 'Volunteer Park Summer Music — TBA', venue: 'Volunteer Park Amphitheater', neighborhood: 'Capitol Hill', time: '19:00', genre: null, source_name: 'Volunteer Park Summer Music', source_url: 'https://volunteerparktrust.org' },
  { date: '2026-08-13', artist: 'Volunteer Park Summer Music — TBA', venue: 'Volunteer Park Amphitheater', neighborhood: 'Capitol Hill', time: '19:00', genre: null, source_name: 'Volunteer Park Summer Music', source_url: 'https://volunteerparktrust.org' },
  { date: '2026-08-20', artist: 'Volunteer Park Summer Music — TBA', venue: 'Volunteer Park Amphitheater', neighborhood: 'Capitol Hill', time: '19:00', genre: null, source_name: 'Volunteer Park Summer Music', source_url: 'https://volunteerparktrust.org' },

  // KEXP Concerts at the Mural — Seattle Center, annual free event
  { date: '2026-08-01', artist: 'KEXP Concerts at the Mural — SASAMI / Sol / Daiistar + KEXP DJs', venue: 'Seattle Center Mural Amphitheatre', neighborhood: 'Seattle Center', time: '14:00', genre: 'Indie', source_name: 'KEXP Concerts at the Mural', source_url: 'https://www.kexp.org/events/catm/' },

  // Capitol Hill Block Party — Aug 7-9 (free street stages)
  { date: '2026-08-07', artist: 'Capitol Hill Block Party — Day 1 (free street stages)', venue: 'Capitol Hill', neighborhood: 'Capitol Hill', time: '12:00', genre: null, source_name: 'Capitol Hill Block Party', source_url: 'https://capitolhillblockparty.com' },
  { date: '2026-08-08', artist: 'Capitol Hill Block Party — Day 2 (free street stages)', venue: 'Capitol Hill', neighborhood: 'Capitol Hill', time: '12:00', genre: null, source_name: 'Capitol Hill Block Party', source_url: 'https://capitolhillblockparty.com' },
  { date: '2026-08-09', artist: 'Capitol Hill Block Party — Day 3 (free street stages)', venue: 'Capitol Hill', neighborhood: 'Capitol Hill', time: '12:00', genre: null, source_name: 'Capitol Hill Block Party', source_url: 'https://capitolhillblockparty.com' },
]

export function getSeattleShows(): ImportRow[] {
  return SHOWS.map(({ date, artist, venue, neighborhood, time, genre, source_name, source_url }) => ({
    artist_name: artist,
    venue,
    date,
    time,
    neighborhood,
    city: 'SEA' as const,
    genre,
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name,
    source_id: `seattle-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url,
  }))
}
