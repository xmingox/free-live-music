import type { ImportRow } from './types'

const SOURCE_NAME = 'Celebrate Brooklyn'
const SOURCE_URL = 'https://bricartsmedia.org/celebrate-brooklyn/'
const VENUE = 'Lena Horne Bandshell, Prospect Park'

const SHOWS: { date: string; artist: string; genre: string | null }[] = [
  { date: '2026-06-13', artist: 'Mélissa Laveaux / Nathalie "TALIE" Cerin / Riva Nyri Précil', genre: 'World' },
  { date: '2026-06-19', artist: 'Juneteenth in the Park — Ghost-Note', genre: 'Funk' },
  { date: '2026-06-20', artist: 'Habibi Festival: Rasha Nahas / Yacine Boularès', genre: 'World' },
  { date: '2026-06-27', artist: 'Quincy Jones Tribute: The Greatest Night in Pop (film screening)', genre: null },
  { date: '2026-07-19', artist: 'BRIC Celebrate Brooklyn! at Brower Park', genre: null },
  { date: '2026-07-26', artist: 'A Tribute to Quincy Jones: The Wiz', genre: null },
  { date: '2026-08-01', artist: 'Mireya Ramos and the Poor Choices / Talibah Safiya / Morley', genre: 'Latin' },
  { date: '2026-08-02', artist: 'Gogol Bordello / Puzzled Panther / Pons', genre: 'Rock' },
  { date: '2026-08-09', artist: 'Lyricist Lounge Anniversary — Hip-Hop History', genre: 'Hip-Hop' },
]

export function getCelebrateBrooklynShows(): ImportRow[] {
  return SHOWS.map(({ date, artist, genre }) => ({
    artist_name: artist,
    venue: VENUE,
    date,
    time: '19:00',
    neighborhood: 'Prospect Park',
    city: 'NYC',
    genre,
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: SOURCE_NAME,
    source_id: `celebrate-brooklyn-${date}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    source_url: SOURCE_URL,
  }))
}
