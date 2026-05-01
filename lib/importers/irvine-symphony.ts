import type { ImportRow } from './types'

const SOURCE_NAME = 'Symphony in the Cities — Irvine'
const SOURCE_URL = 'https://cityofirvine.org/community-library-services-department/summer-city'

const SHOWS = ['2026-08-15']

export function getIrvineSymphonyShows(): ImportRow[] {
  return SHOWS.map(date => ({
    artist_name: 'TBA — Symphony in the Cities',
    venue: 'Mike Ward Community Park — Woodbridge',
    date,
    time: '19:00',
    neighborhood: 'Woodbridge',
    city: 'LA' as const,
    genre: null,
    price: 'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified: true,
    image_url: null,
    source_name: SOURCE_NAME,
    source_id: `irvine-symphony-${date}`,
    source_url: SOURCE_URL,
  }))
}
