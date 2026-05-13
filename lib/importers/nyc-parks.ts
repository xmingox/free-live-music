// Scrapes https://www.nycgovparks.org/events/free_summer_concerts
// The page uses Schema.org microdata — reliable, no JS rendering needed.

import * as cheerio from 'cheerio'
import type { ImportRow } from './types'

const BASE = 'https://www.nycgovparks.org'
const URL  = `${BASE}/events/free_summer_concerts`

const GENRE_KEYWORDS: [string[], string][] = [
  [['jazz'],                                                  'Jazz'],
  [['classical', 'orchestra', 'symphony', 'philharmonic'],   'Classical'],
  [['hip hop', 'hip-hop', 'rap'],                            'Hip-hop'],
  [['folk', 'bluegrass', 'acoustic', 'singer-songwriter'],   'Folk'],
  [['latin', 'salsa', 'merengue', 'cumbia', 'bachata'],      'Latin Folk'],
  [['r&b', 'soul', 'rhythm and blues'],                      'R&B'],
  [['electronic', ' dj ', 'dj set', 'dance music'],         'Electronic'],
  [['rock', 'indie'],                                        'Indie Rock'],
]

function detectGenre(text: string): string | null {
  const t = text.toLowerCase()
  for (const [keywords, genre] of GENRE_KEYWORDS) {
    if (keywords.some(k => t.includes(k))) return genre
  }
  return null
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'America/New_York',
  })
}

export async function fetchNYCParks(): Promise<ImportRow[]> {
  const res = await fetch(URL, {
    signal: AbortSignal.timeout(15_000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  })

  if (!res.ok) throw new Error(`NYC Parks responded ${res.status}`)

  const $ = cheerio.load(await res.text())
  const rows: ImportRow[] = []

  $('[itemtype="http://schema.org/Event"]').each((_, el) => {
    const $el = $(el)

    const titleLink  = $el.find('h3.event-title a').first()
    const name       = titleLink.text().trim()
    const relHref    = titleLink.attr('href') ?? ''
    if (!name || !relHref) return

    const startMeta  = $el.find('meta[itemprop="startDate"]').attr('content') ?? ''
    if (!startMeta) return

    const venue       = $el.find('[itemprop="location"] [itemprop="name"]').first().text().trim()
    const borough     = $el.find('[itemprop="addressLocality"]').first().text().trim()
    const description = $el.find('[itemprop="description"]').first().text().trim()
    const imgSrc      = $el.find('img').first().attr('src') ?? null

    rows.push({
      artist_name:    name.slice(0, 200),
      venue:          venue || 'NYC Parks',
      date:           startMeta.split('T')[0],
      time:           formatTime(startMeta),
      neighborhood:   venue || borough || 'New York',
      city:           'NYC',
      genre:          detectGenre(name + ' ' + description),
      price:          'Free',
      admission_type: 'Walk-up free',
      indoor_outdoor: 'Outdoor',
      is_verified:    true,
      image_url:      imgSrc ? (imgSrc.startsWith('http') ? imgSrc : `${BASE}${imgSrc}`) : null,
      source_name:    'NYC Parks',
      source_id:      relHref.replace(/^\/events\//, ''),
      source_url:     `${BASE}${relHref}`,
    })
  })

  return rows
}
