import type { ImportRow } from './types'

const SHOWS: {
  date: string; artist: string; venue: string; neighborhood: string;
  time: string; genre: string | null; source_name: string; source_url: string;
}[] = [
  // Laguna Beach Sunset Serenades at Heisler Park
  { date: '2026-05-01', artist: 'Afro Fiesta', venue: 'Heisler Park', neighborhood: 'Laguna Beach', time: '18:00', genre: 'World', source_name: 'Laguna Beach Sunset Serenades', source_url: 'https://www.lagunabeachcity.net/government/departments/cultural-arts/performances/sunset-serenades' },
  { date: '2026-05-08', artist: 'Kim Johnson', venue: 'Heisler Park', neighborhood: 'Laguna Beach', time: '18:00', genre: null, source_name: 'Laguna Beach Sunset Serenades', source_url: 'https://www.lagunabeachcity.net/government/departments/cultural-arts/performances/sunset-serenades' },
  { date: '2026-05-15', artist: 'Street Corner Renaissance', venue: 'Heisler Park', neighborhood: 'Laguna Beach', time: '18:00', genre: null, source_name: 'Laguna Beach Sunset Serenades', source_url: 'https://www.lagunabeachcity.net/government/departments/cultural-arts/performances/sunset-serenades' },
  { date: '2026-05-22', artist: 'Rumba LA', venue: 'Heisler Park', neighborhood: 'Laguna Beach', time: '18:00', genre: 'Latin', source_name: 'Laguna Beach Sunset Serenades', source_url: 'https://www.lagunabeachcity.net/government/departments/cultural-arts/performances/sunset-serenades' },
  { date: '2026-05-29', artist: 'Simon Says Revue', venue: 'Heisler Park', neighborhood: 'Laguna Beach', time: '18:00', genre: null, source_name: 'Laguna Beach Sunset Serenades', source_url: 'https://www.lagunabeachcity.net/government/departments/cultural-arts/performances/sunset-serenades' },
  { date: '2026-06-05', artist: 'Caro Pierotto', venue: 'Heisler Park', neighborhood: 'Laguna Beach', time: '18:00', genre: null, source_name: 'Laguna Beach Sunset Serenades', source_url: 'https://www.lagunabeachcity.net/government/departments/cultural-arts/performances/sunset-serenades' },
  { date: '2026-06-12', artist: 'Celter Skelter', venue: 'Heisler Park', neighborhood: 'Laguna Beach', time: '18:00', genre: 'Rock', source_name: 'Laguna Beach Sunset Serenades', source_url: 'https://www.lagunabeachcity.net/government/departments/cultural-arts/performances/sunset-serenades' },

  // Huntington Beach Concert Band — Central Park Bandshell
  { date: '2026-06-28', artist: 'Huntington Beach Concert Band', venue: 'HB Central Park Concert Bandstand', neighborhood: 'Huntington Beach', time: '17:00', genre: 'Classical', source_name: 'HB Concert Band Series', source_url: 'https://hbconcertband.org/SummerSeries/' },
  { date: '2026-07-05', artist: 'Navy Band SouthWest', venue: 'HB Central Park Concert Bandstand', neighborhood: 'Huntington Beach', time: '17:00', genre: 'Classical', source_name: 'HB Concert Band Series', source_url: 'https://hbconcertband.org/SummerSeries/' },
  { date: '2026-07-12', artist: 'The Velvetones', venue: 'HB Central Park Concert Bandstand', neighborhood: 'Huntington Beach', time: '17:00', genre: null, source_name: 'HB Concert Band Series', source_url: 'https://hbconcertband.org/SummerSeries/' },
  { date: '2026-07-19', artist: 'Madison Grove', venue: 'HB Central Park Concert Bandstand', neighborhood: 'Huntington Beach', time: '17:00', genre: null, source_name: 'HB Concert Band Series', source_url: 'https://hbconcertband.org/SummerSeries/' },
  { date: '2026-07-26', artist: 'Navy Band SouthWest', venue: 'HB Central Park Concert Bandstand', neighborhood: 'Huntington Beach', time: '17:00', genre: 'Classical', source_name: 'HB Concert Band Series', source_url: 'https://hbconcertband.org/SummerSeries/' },
  { date: '2026-08-02', artist: 'lousy little gods', venue: 'HB Central Park Concert Bandstand', neighborhood: 'Huntington Beach', time: '17:00', genre: 'Rock', source_name: 'HB Concert Band Series', source_url: 'https://hbconcertband.org/SummerSeries/' },
  { date: '2026-08-09', artist: 'Huntington Beach Concert Band', venue: 'HB Central Park Concert Bandstand', neighborhood: 'Huntington Beach', time: '17:00', genre: 'Classical', source_name: 'HB Concert Band Series', source_url: 'https://hbconcertband.org/SummerSeries/' },
  { date: '2026-08-16', artist: '3rd Marine Aircraft Wing Band', venue: 'HB Central Park Concert Bandstand', neighborhood: 'Huntington Beach', time: '17:00', genre: 'Classical', source_name: 'HB Concert Band Series', source_url: 'https://hbconcertband.org/SummerSeries/' },
  { date: '2026-08-23', artist: 'The Wise Guys', venue: 'HB Central Park Concert Bandstand', neighborhood: 'Huntington Beach', time: '17:00', genre: null, source_name: 'HB Concert Band Series', source_url: 'https://hbconcertband.org/SummerSeries/' },
  { date: '2026-08-30', artist: 'Cruise Control', venue: 'HB Central Park Concert Bandstand', neighborhood: 'Huntington Beach', time: '17:00', genre: null, source_name: 'HB Concert Band Series', source_url: 'https://hbconcertband.org/SummerSeries/' },

  // Hart Park, Orange — Wednesdays
  { date: '2026-07-01', artist: 'Stone Soul (Classic Soul, R&B & Motown)', venue: 'Hart Park Band Shell', neighborhood: 'Orange', time: '19:00', genre: 'Soul', source_name: 'Hart Park Concerts', source_url: 'https://www.kiwanisoforange.org/concerts-in-the-park' },
  { date: '2026-07-08', artist: 'The Trip (60s, 70s, 80s Rock)', venue: 'Hart Park Band Shell', neighborhood: 'Orange', time: '19:00', genre: 'Rock', source_name: 'Hart Park Concerts', source_url: 'https://www.kiwanisoforange.org/concerts-in-the-park' },
  { date: '2026-07-15', artist: 'Ronstadt Revival (Linda Ronstadt Tribute)', venue: 'Hart Park Band Shell', neighborhood: 'Orange', time: '19:00', genre: 'Rock', source_name: 'Hart Park Concerts', source_url: 'https://www.kiwanisoforange.org/concerts-in-the-park' },
  { date: '2026-07-22', artist: 'The New Romantics (Taylor Swift Tribute)', venue: 'Hart Park Band Shell', neighborhood: 'Orange', time: '19:00', genre: 'Pop', source_name: 'Hart Park Concerts', source_url: 'https://www.kiwanisoforange.org/concerts-in-the-park' },
  { date: '2026-07-29', artist: '90s Rockshow', venue: 'Hart Park Band Shell', neighborhood: 'Orange', time: '19:00', genre: 'Rock', source_name: 'Hart Park Concerts', source_url: 'https://www.kiwanisoforange.org/concerts-in-the-park' },

  // Balboa Island — Fridays
  { date: '2026-07-10', artist: 'The Nomads', venue: 'Balboa Island Park', neighborhood: 'Newport Beach', time: '18:00', genre: null, source_name: 'Balboa Island Concert Series', source_url: 'https://biia.org/summer-concert-series/' },
  { date: '2026-07-17', artist: 'The New Originals', venue: 'Balboa Island Park', neighborhood: 'Newport Beach', time: '18:00', genre: null, source_name: 'Balboa Island Concert Series', source_url: 'https://biia.org/summer-concert-series/' },
  { date: '2026-07-24', artist: 'The Reef Brothers', venue: 'Balboa Island Park', neighborhood: 'Newport Beach', time: '18:00', genre: null, source_name: 'Balboa Island Concert Series', source_url: 'https://biia.org/summer-concert-series/' },
  { date: '2026-08-14', artist: 'Trishia Freeman', venue: 'Balboa Island Park', neighborhood: 'Newport Beach', time: '18:00', genre: null, source_name: 'Balboa Island Concert Series', source_url: 'https://biia.org/summer-concert-series/' },
  { date: '2026-08-20', artist: 'The Chancers', venue: 'Balboa Island Park', neighborhood: 'Newport Beach', time: '18:00', genre: null, source_name: 'Balboa Island Concert Series', source_url: 'https://biia.org/summer-concert-series/' },
  { date: '2026-09-03', artist: 'James Kelly Band', venue: 'Balboa Island Park', neighborhood: 'Newport Beach', time: '18:00', genre: null, source_name: 'Balboa Island Concert Series', source_url: 'https://biia.org/summer-concert-series/' },
  { date: '2026-09-11', artist: 'Kenny Hale', venue: 'Balboa Island Park', neighborhood: 'Newport Beach', time: '18:00', genre: null, source_name: 'Balboa Island Concert Series', source_url: 'https://biia.org/summer-concert-series/' },

  // Newport Beach Concerts on the Green
  { date: '2026-07-19', artist: 'Redneck Rodeo', venue: 'Newport Beach Civic Center Green', neighborhood: 'Newport Beach', time: '18:00', genre: 'Country', source_name: 'Newport Beach Concerts on the Green', source_url: 'https://www.newportbeachca.gov/government/departments/library-services/cultural-arts/concerts-on-the-green' },
  { date: '2026-09-13', artist: 'Flashback Heart Attack', venue: 'Newport Beach Civic Center Green', neighborhood: 'Newport Beach', time: '18:00', genre: 'Rock', source_name: 'Newport Beach Concerts on the Green', source_url: 'https://www.newportbeachca.gov/government/departments/library-services/cultural-arts/concerts-on-the-green' },
  { date: '2026-10-11', artist: "Diego's Garage", venue: 'Marina Park, Newport Beach', neighborhood: 'Newport Beach', time: '18:00', genre: null, source_name: 'Newport Beach Concerts on the Green', source_url: 'https://www.newportbeachca.gov/government/departments/library-services/cultural-arts/concerts-on-the-green' },

  // Laguna Niguel — Crown Valley Park
  { date: '2026-05-15', artist: 'James Kelly Band', venue: 'Crown Valley Park', neighborhood: 'Laguna Niguel', time: '18:00', genre: null, source_name: 'Laguna Niguel Concerts', source_url: 'https://www.cityoflagunaniguel.org/calendar.aspx' },
  { date: '2026-06-12', artist: 'Funky Hippeez', venue: 'Crown Valley Park', neighborhood: 'Laguna Niguel', time: '18:00', genre: 'Funk', source_name: 'Laguna Niguel Concerts', source_url: 'https://www.cityoflagunaniguel.org/calendar.aspx' },
  { date: '2026-07-10', artist: 'The Dreamboats', venue: 'Crown Valley Park', neighborhood: 'Laguna Niguel', time: '18:00', genre: null, source_name: 'Laguna Niguel Concerts', source_url: 'https://www.cityoflagunaniguel.org/calendar.aspx' },
  { date: '2026-07-24', artist: '90s Rock Show', venue: 'Crown Valley Park', neighborhood: 'Laguna Niguel', time: '18:00', genre: 'Rock', source_name: 'Laguna Niguel Concerts', source_url: 'https://www.cityoflagunaniguel.org/calendar.aspx' },
  { date: '2026-08-20', artist: 'Flashback Heart Attack', venue: 'Crown Valley Park', neighborhood: 'Laguna Niguel', time: '18:00', genre: 'Rock', source_name: 'Laguna Niguel Concerts', source_url: 'https://www.cityoflagunaniguel.org/calendar.aspx' },

  // Irvine — Mike Ward Community Park
  { date: '2026-06-06', artist: "Jimmy's Buffet (Jimmy Buffett tribute)", venue: 'Mike Ward Community Park', neighborhood: 'Irvine', time: '17:30', genre: 'Pop', source_name: 'Irvine Summer City Concerts', source_url: 'https://cityofirvine.org/community-library-services-department/summer-city' },
  { date: '2026-06-27', artist: '4 Lads from Liverpool (Beatles tribute)', venue: 'Mike Ward Community Park', neighborhood: 'Irvine', time: '17:30', genre: 'Rock', source_name: 'Irvine Summer City Concerts', source_url: 'https://cityofirvine.org/community-library-services-department/summer-city' },
  { date: '2026-07-18', artist: 'Jukebox (Top 40)', venue: 'Mike Ward Community Park', neighborhood: 'Irvine', time: '17:30', genre: 'Pop', source_name: 'Irvine Summer City Concerts', source_url: 'https://cityofirvine.org/community-library-services-department/summer-city' },

  // Aliso Viejo Grand Park — Sundays
  { date: '2026-06-07', artist: 'Tijuana Dogs (Dance/Party Rock)', venue: 'Grand Park', neighborhood: 'Aliso Viejo', time: '18:00', genre: 'Rock', source_name: 'Aliso Viejo Grand Park Concerts', source_url: 'https://www.alisoviejo.org' },
  { date: '2026-06-21', artist: 'Wayward Ons (80s)', venue: 'Grand Park', neighborhood: 'Aliso Viejo', time: '18:00', genre: 'Rock', source_name: 'Aliso Viejo Grand Park Concerts', source_url: 'https://www.alisoviejo.org' },
  { date: '2026-07-12', artist: 'Family Style (Blues/Soul)', venue: 'Grand Park', neighborhood: 'Aliso Viejo', time: '18:00', genre: 'Soul', source_name: 'Aliso Viejo Grand Park Concerts', source_url: 'https://www.alisoviejo.org' },
  { date: '2026-07-26', artist: 'Stone Soul (Motown/60s)', venue: 'Grand Park', neighborhood: 'Aliso Viejo', time: '18:00', genre: 'Soul', source_name: 'Aliso Viejo Grand Park Concerts', source_url: 'https://www.alisoviejo.org' },
  { date: '2026-08-09', artist: 'Flashback Heart Attack', venue: 'Grand Park', neighborhood: 'Aliso Viejo', time: '18:00', genre: 'Rock', source_name: 'Aliso Viejo Grand Park Concerts', source_url: 'https://www.alisoviejo.org' },

  // Yorba Linda — Hurless Barton Park
  { date: '2026-07-05', artist: 'The Trip (Classic Rock)', venue: 'Hurless Barton Park', neighborhood: 'Yorba Linda', time: '18:00', genre: 'Rock', source_name: 'Yorba Linda Concerts', source_url: 'https://www.yorbalindaca.gov/404/Upcoming-Family-Fun-Special-Events' },
  { date: '2026-07-19', artist: 'New Romantics (Taylor Swift Tribute)', venue: 'Hurless Barton Park', neighborhood: 'Yorba Linda', time: '18:00', genre: 'Pop', source_name: 'Yorba Linda Concerts', source_url: 'https://www.yorbalindaca.gov/404/Upcoming-Family-Fun-Special-Events' },
  { date: '2026-07-26', artist: 'Blue Breeze Band (Motown, R&B, Funk & Soul)', venue: 'Hurless Barton Park', neighborhood: 'Yorba Linda', time: '18:00', genre: 'Soul', source_name: 'Yorba Linda Concerts', source_url: 'https://www.yorbalindaca.gov/404/Upcoming-Family-Fun-Special-Events' },
  { date: '2026-08-16', artist: 'Coldplay USA (Coldplay Tribute)', venue: 'Hurless Barton Park', neighborhood: 'Yorba Linda', time: '18:00', genre: 'Rock', source_name: 'Yorba Linda Concerts', source_url: 'https://www.yorbalindaca.gov/404/Upcoming-Family-Fun-Special-Events' },
  { date: '2026-08-23', artist: 'The Tokens (60s & 70s Doo-Wop)', venue: 'Hurless Barton Park', neighborhood: 'Yorba Linda', time: '18:00', genre: 'Oldies', source_name: 'Yorba Linda Concerts', source_url: 'https://www.yorbalindaca.gov/404/Upcoming-Family-Fun-Special-Events' },

  // Nixon Library Sunday Concert Series — year round free
  { date: '2026-06-14', artist: 'Nixon Library Sunday Concert Series — TBA', venue: 'Nixon Presidential Library', neighborhood: 'Yorba Linda', time: '14:00', genre: null, source_name: 'Nixon Library Sunday Concerts', source_url: 'https://www.nixonlibrary.gov/sunday-concert-series' },
  { date: '2026-07-12', artist: 'Nixon Library Sunday Concert Series — TBA', venue: 'Nixon Presidential Library', neighborhood: 'Yorba Linda', time: '14:00', genre: null, source_name: 'Nixon Library Sunday Concerts', source_url: 'https://www.nixonlibrary.gov/sunday-concert-series' },
  { date: '2026-08-09', artist: 'Nixon Library Sunday Concert Series — TBA', venue: 'Nixon Presidential Library', neighborhood: 'Yorba Linda', time: '14:00', genre: null, source_name: 'Nixon Library Sunday Concerts', source_url: 'https://www.nixonlibrary.gov/sunday-concert-series' },
]

export function getOCCitiesShows(): ImportRow[] {
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
    source_id: `oc-cities-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url,
  }))
}
