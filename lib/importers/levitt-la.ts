import * as cheerio from 'cheerio'
import type { ImportRow } from './types'

const SOURCE_NAME = 'Levitt Pavilion LA'
const BASE_URL    = 'https://www.levittpavilionla.org'
const EVENTS_URL  = `${BASE_URL}/events`

// Static fallback — used until the site publishes its 2026 lineup
const STATIC_SHOWS: { date: string; artist: string }[] = [
  { date: '2026-06-21', artist: 'TBA — Levitt Pavilion LA' },
  { date: '2026-06-28', artist: 'TBA — Levitt Pavilion LA' },
  { date: '2026-07-05', artist: 'TBA — Levitt Pavilion LA' },
  { date: '2026-07-12', artist: 'TBA — Levitt Pavilion LA' },
  { date: '2026-07-19', artist: 'TBA — Levitt Pavilion LA' },
  { date: '2026-07-26', artist: 'TBA — Levitt Pavilion LA' },
  { date: '2026-08-02', artist: 'TBA — Levitt Pavilion LA' },
  { date: '2026-08-09', artist: 'TBA — Levitt Pavilion LA' },
  { date: '2026-08-16', artist: 'TBA — Levitt Pavilion LA' },
  { date: '2026-08-23', artist: 'TBA — Levitt Pavilion LA' },
]

function makeRow(date: string, artist: string, url: string, img: string | null): ImportRow {
  return {
    artist_name:    artist,
    venue:          'Levitt Pavilion MacArthur Park',
    date,
    time:           '17:00',
    neighborhood:   'MacArthur Park',
    city:           'LA',
    genre:          null,
    price:          'Free',
    admission_type: 'Walk-up free',
    indoor_outdoor: 'Outdoor',
    is_verified:    true,
    image_url:      img,
    source_name:    SOURCE_NAME,
    source_id:      `levitt-la-${date}`,
    source_url:     url,
  }
}

async function scrapePage(url: string): Promise<ImportRow[]> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
  })
  if (!res.ok) return []

  const html = await res.text()

  // Try embedded FullCalendar JS pattern (same as levittpavilion.com)
  const blocks = html.match(/title = "([^"]+)"[\s\S]{0,500}?new Date\("(20\d\d-\d\d-\d\d)/g) || []
  if (blocks.length > 0) {
    return blocks.map(b => {
      const title = b.match(/title = "([^"]+)"/)?.[1] ?? ''
      const date  = b.match(/new Date\("(20\d\d-\d\d-\d\d)/)?.[1] ?? ''
      return makeRow(date, title, url, null)
    }).filter(r => r.date && r.artist_name)
  }

  // Try Tribe Events / WordPress Events Calendar
  const $ = cheerio.load(html)
  const rows: ImportRow[] = []
  $('[class*="tribe-event"], article[class*="event"]').each((_, el) => {
    const title   = $(el).find('h2, h3, [class*="title"]').first().text().trim()
    const dateStr = $(el).find('time, [class*="date"]').first().attr('datetime') ?? ''
    const href    = $(el).find('a').first().attr('href') ?? url
    const img     = $(el).find('img').first().attr('src') ?? null
    if (!title || !dateStr) return
    const date = dateStr.split('T')[0]
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) return
    rows.push(makeRow(date, title, href.startsWith('http') ? href : `${BASE_URL}${href}`, img))
  })

  return rows
}

export async function getLevittLAShows(): Promise<ImportRow[]> {
  const allRows: ImportRow[] = []

  for (let page = 1; page <= 10; page++) {
    const url  = page === 1 ? EVENTS_URL : `${EVENTS_URL}/p${page}`
    const rows = await scrapePage(url)
    allRows.push(...rows)
    if (rows.length === 0) break
  }

  // Fall back to static placeholders if site returned nothing
  if (allRows.length === 0) {
    return STATIC_SHOWS.map(({ date, artist }) => makeRow(date, artist, EVENTS_URL, null))
  }

  return allRows
}
