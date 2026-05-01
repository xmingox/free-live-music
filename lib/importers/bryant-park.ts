import type { ImportRow } from './types'

const SOURCE_NAME = 'Bryant Park'
const SOURCE_URL = 'https://bryantpark.org/programs/picnic-performances'

const SHOWS: { date: string; artist: string; genre: string | null }[] = [
  { date: '2026-05-28', artist: 'Jazzmobile: Wycliffe Gordon and Friends', genre: 'Jazz' },
  { date: '2026-05-29', artist: 'NYC Opera: American Classics', genre: 'Classical' },
  { date: '2026-06-04', artist: 'Carolyn Dorfman / Terk Lewis / White Wave Dance', genre: 'Dance' },
  { date: '2026-06-05', artist: 'Ballet for the Wild with vildwerk', genre: 'Dance' },
  { date: '2026-06-11', artist: "It's Showtime NYC / SOLE Defined / Robin Dunn Contemporary Dance", genre: 'Dance' },
  { date: '2026-06-12', artist: 'World Music Institute: World of Percussion — Pedrito Martinez / Cyro Baptista / Kaoru Watanabe / Suphala / Sunny Jain / Glen Velez / Batalá / Adam Rudolph', genre: 'World' },
  { date: '2026-06-18', artist: "Joe's Pub: Joan As Police Woman / Britton & The Sting", genre: 'Indie' },
  { date: '2026-06-19', artist: 'The Unsung Collective: Starburst (Juneteenth)', genre: 'Classical' },
  { date: '2026-07-03', artist: 'Carnegie Hall: The Knights', genre: 'Classical' },
  { date: '2026-07-10', artist: 'Carnegie Hall: Aisha Jackson', genre: 'Pop' },
  { date: '2026-07-17', artist: 'Carnegie Hall: Nathan and the Zydeco Cha Chas', genre: 'Zydeco' },
  { date: '2026-07-24', artist: 'Carnegie Hall: NYC Ska Orchestra', genre: 'Ska' },
  { date: '2026-07-31', artist: 'Carnegie Hall: El Laberinto del Coco', genre: 'Latin' },
  { date: '2026-08-07', artist: 'NYC Opera: Celebration of Ella Fitzgerald with Latonia Moore', genre: 'Classical' },
  { date: '2026-08-14', artist: 'NY Guitar Festival: Raphaël Feuillâtre / Goran Ivanovic & Fareed Haque / Ziggy & Miles / Gabrielle Leite', genre: 'Classical' },
  { date: '2026-08-15', artist: 'NY Guitar Festival: The Messthetics / Gyan Riley / Pierre Bensusan', genre: 'Rock' },
  { date: '2026-08-21', artist: 'Bryant Park Choir Festival', genre: 'Classical' },
  { date: '2026-08-22', artist: 'Emerging Music Festival — Artists TBA', genre: 'Indie' },
  { date: '2026-08-28', artist: 'Accordion Festival: Jourdan Thibodeaux / Saami Brothers / Chicha Libre', genre: 'World' },
  { date: '2026-08-29', artist: 'Parallel Exit: Sunset Circus', genre: null },
  { date: '2026-09-03', artist: 'Asian American Arts Alliance: Grace Kelly / Ashni', genre: 'Jazz' },
  { date: '2026-09-04', artist: 'Brass Festival: New Breed Brass Band / Aberdeen / Brass Queens', genre: 'Jazz' },
  { date: '2026-09-10', artist: 'Dance Party All-Stars: Alfredo De La Fé All Star Band / George Gee Swing Orchestra', genre: 'Latin' },
  { date: '2026-09-11', artist: 'Tribute to the 25th Anniversary of September 11 — Artists TBA', genre: 'Classical' },
]

export function getBryantParkShows(): ImportRow[] {
  return SHOWS.map(({ date, artist, genre }) => ({
    artist_name: artist,
    venue: 'Bryant Park',
    date,
    time: '19:00',
    neighborhood: 'Midtown',
    city: 'NYC',
    genre,
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: SOURCE_NAME,
    source_id: `bryant-park-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url: SOURCE_URL,
  }))
}
