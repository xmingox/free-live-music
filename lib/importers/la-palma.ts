import * as cheerio from 'cheerio'
import type { ImportRow } from './types'

const SOURCE_NAME = 'La Palma Concerts in the Park'
const SOURCE_URL  = 'https://www.lapalmaca.gov/220/Concerts-in-the-Park'

const STATIC_DATES = [
  '2026-06-06',
  '2026-06-20',
  '2026-07-11',
  '2026-07-25',
  '2026-08-08',
  '2026-08-22',
]

function makeRow(date: string, artist: string): ImportRow {
  return {
    artist_name:    artist,
    venue:          'La Palma Park',
    date,
    time:           '18:00',
    neighborhood:   'La Palma',
    city:           'LA' as const,
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free' as const,
    indoor_outdoor: 'Outdoor' as const,
    is_verified:    true,
    image_url:      null,
    source_name:    SOURCE_NAME,
    source_id:      `la-palma-${date}`,
    source_url:     SOURCE_URL,
  }
}

export async function getLaPalmaShows(): Promise<ImportRow[]> {
  try {
    const res = await fetch(SOURCE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const $ = cheerio.load(await res.text())
    const rows: ImportRow[] = []

    // The city site typically renders a table or list with date + performer columns
    $('table tr, .field-items li, .views-row, [class*="concert"]').each((_, el) => {
      const text  = $(el).text().replace(/\s+/g, ' ').trim()
      const match = text.match(/(20\d\d-\d\d-\d\d|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s*20\d\d)/i)
      if (!match) return

      let date = match[1]
      if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const parsed = new Date(date)
        if (isNaN(parsed.getTime())) return
        date = parsed.toISOString().slice(0, 10)
      }

      // Grab everything after the date as the artist name
      const afterDate = text.slice(text.indexOf(match[0]) + match[0].length).trim().replace(/^[-–:,\s]+/, '')
      const artist = afterDate.length > 3 ? afterDate.slice(0, 80) : `TBA — ${SOURCE_NAME}`
      rows.push(makeRow(date, artist))
    })

    if (rows.length > 0) return rows
  } catch {
    // fall through to static
  }

  return STATIC_DATES.map(date => makeRow(date, `TBA — ${SOURCE_NAME}`))
}
