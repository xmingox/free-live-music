import type { ImportRow } from './types'

const SOURCE_NAME = 'Backyard at Hudson Yards'
const SOURCE_URL = 'https://www.hudsonyardsnewyork.com/backyard'

const SHOWS = [
  { date: '2026-05-13', artist: 'Aly & AJ' },
  { date: '2026-05-20', artist: 'Warren G' },
  { date: '2026-05-27', artist: 'Busta Rhymes' },
  { date: '2026-06-03', artist: 'Jordin Sparks' },
]

export function getHudsonYardsShows(): ImportRow[] {
  return SHOWS.map(({ date, artist }) => ({
    artist_name:    artist,
    venue:          'Wells Fargo Stage at Hudson Yards',
    date,
    time:           '18:00',
    neighborhood:   'Hudson Yards',
    city:           'NYC',
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `hudson-yards-${date}`,
    source_url:     SOURCE_URL,
  }))
}
