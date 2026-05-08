/**
 * Automated concert scraper — uses Brave Search + Claude Haiku to find free concerts.
 *
 * Usage:  tsx scripts/scrape-concerts.ts <CITY_CODE>
 * Output: console table + output/<CITY_CODE>-draft.json
 *
 * Required in .env.local:
 *   ANTHROPIC_API_KEY
 *   BRAVE_API_KEY         (free tier: https://brave.com/search/api/)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import * as cheerio from 'cheerio'
import * as fs from 'fs'
import * as path from 'path'
import metros from '../lib/metros.json'

// ── Validation ────────────────────────────────────────────────────────────────

const CITY_CODE = process.argv[2]?.toUpperCase()
if (!CITY_CODE) {
  console.error('Usage: tsx scripts/scrape-concerts.ts <CITY_CODE>')
  process.exit(1)
}

const metro = (metros as any).metros.find((m: any) => m.code === CITY_CODE)
if (!metro) {
  console.error(`City code "${CITY_CODE}" not found in metros.json`)
  process.exit(1)
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY in .env.local')
  process.exit(1)
}
if (!process.env.BRAVE_API_KEY) {
  console.error('Missing BRAVE_API_KEY in .env.local')
  process.exit(1)
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface DraftEvent {
  artist_name: string
  venue: string
  date: string           // YYYY-MM-DD
  time: string | null    // 7:00pm or null
  neighborhood: string
  genre: string | null
  admission_type: 'Walk-up free' | 'Free RSVP'
  indoor_outdoor: 'Indoor' | 'Outdoor' | 'Both' | null
  source_name: string
  source_url: string
}

// ── Search ────────────────────────────────────────────────────────────────────

const SKIP_DOMAINS = /youtube\.com|facebook\.com|twitter\.com|instagram\.com|tiktok\.com|reddit\.com|yelp\.com|tripadvisor\.com|ticketmaster\.com|stubhub\.com|eventbrite\.com|songkick\.com|seatgeek\.com|bandsintown\.com|concerts50\.com|concertfix\.com|jambase\.com|axs\.com|livenation\.com|vivid/

async function braveSearch(query: string): Promise<string[]> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=7`
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': process.env.BRAVE_API_KEY!,
    },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) {
    console.warn(`  Brave search error: ${res.status}`)
    return []
  }
  const data: any = await res.json()
  return (data.web?.results ?? [])
    .map((r: any) => r.url as string)
    .filter((u: string) => !SKIP_DOMAINS.test(u))
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchWithCheerio(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  })
  if (!res.ok) return ''
  const html = await res.text()
  const $ = cheerio.load(html)
  $('script, style, nav, footer, header, noscript, iframe, [class*="cookie"], [class*="banner"], [class*="popup"]').remove()
  return $('body').text().replace(/\s+/g, ' ').trim()
}

async function fetchWithPuppeteer(url: string): Promise<string> {
  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 })
    const text = await page.evaluate(() => document.body.innerText)
    return text.replace(/\s+/g, ' ').trim()
  } finally {
    await browser.close()
  }
}

async function fetchPageText(url: string): Promise<string> {
  try {
    const text = await fetchWithCheerio(url)
    if (text.length < 800) {
      process.stdout.write('(js) ')
      const jsText = await fetchWithPuppeteer(url).catch(() => '')
      return jsText.slice(0, 12000)
    }
    return text.slice(0, 12000)
  } catch {
    return ''
  }
}

// ── Extract ───────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

async function extractEvents(text: string, sourceUrl: string): Promise<DraftEvent[]> {
  const prompt = `Extract free live music/concert events from the text below. Return a JSON array only — no markdown, no other text.

City: ${metro.city}, ${metro.state}
Source URL: ${sourceUrl}
Today: ${TODAY}

Rules:
- ONLY include events physically located in ${metro.city}, ${metro.state} — reject events in other cities or states even if the page mentions them
- Only include events with FREE admission (no ticket cost, walk-up free or free RSVP)
- Only include 2026 dates (YYYY-MM-DD format)
- Skip events where the date is unclear or in the past
- If a series runs every week (e.g. "every Friday June–August"), expand each occurrence into its own entry
- time: "7:00pm" style (12-hour, lowercase, no space before am/pm), or null if not stated
- admission_type: "Walk-up free" or "Free RSVP"
- indoor_outdoor: "Indoor", "Outdoor", "Both", or null

Return one object per event with exactly these fields:
{
  "artist_name": "Performer or series name if performer TBA",
  "venue": "Venue name",
  "date": "YYYY-MM-DD",
  "time": "7:00pm" or null,
  "neighborhood": "Neighborhood or area name",
  "genre": "Genre or null",
  "admission_type": "Walk-up free",
  "indoor_outdoor": "Outdoor",
  "source_name": "Name of the series or organization",
  "source_url": "${sourceUrl}"
}

If no free concerts found, return [].

Text:
${text}`

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body,
    signal: AbortSignal.timeout(30000),
  })

  const data: any = await res.json()
  const raw: string = data?.content?.[0]?.text ?? '[]'

  // Strip possible markdown code fences
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  try {
    const events: DraftEvent[] = JSON.parse(jsonMatch[0])
    return events.filter(e =>
      e.artist_name &&
      e.venue &&
      /^\d{4}-\d{2}-\d{2}$/.test(e.date ?? '') &&
      (e.date ?? '') >= TODAY
    ).map(e => ({ ...e, source_url: sourceUrl }))
  } catch {
    return []
  }
}

// ── Deduplicate ───────────────────────────────────────────────────────────────

function dedupe(events: DraftEvent[]): DraftEvent[] {
  const seen = new Set<string>()
  return events.filter(e => {
    const key = `${e.date}|${e.artist_name.toLowerCase().replace(/\s+/g, '').slice(0, 30)}|${e.venue.toLowerCase().slice(0, 20)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  Scraping free concerts — ${metro.city}, ${metro.state} (${CITY_CODE})`)
  console.log(`${'═'.repeat(60)}\n`)

  const cityState = `${metro.city} ${metro.state}`
  const queries = [
    `${cityState} free concerts summer 2026 schedule`,
    `"${cityState}" free outdoor concert series 2026`,
    `${cityState} parks free live music 2026`,
  ]

  // Collect URLs from search
  const urlSet = new Set<string>()
  for (const q of queries) {
    console.log(`Searching: "${q}"`)
    const urls = await braveSearch(q)
    urls.forEach(u => urlSet.add(u))
  }

  // Seed with known static-HTML pages per city (add as discovered)
  const KNOWN_URLS: Record<string, string[]> = {
    // Example: NYC: ['https://www.nycgovparks.org/events/free-concerts']
  }
  ;(KNOWN_URLS[CITY_CODE] ?? []).forEach(u => urlSet.add(u))

  const urls = [...urlSet].slice(0, 12)
  console.log(`\n${urls.length} unique URLs to scrape\n`)

  // Fetch + extract
  const allEvents: DraftEvent[] = []
  for (const url of urls) {
    process.stdout.write(`Fetching ${url.slice(0, 70)}... `)
    const text = await fetchPageText(url)
    if (text.length < 300) {
      console.log('skip (too short)')
      continue
    }
    const events = await extractEvents(text, url)
    console.log(`${events.length} events`)
    allEvents.push(...events)
  }

  const results = dedupe(allEvents).sort((a, b) => a.date.localeCompare(b.date))

  // ── Print table ──
  console.log(`\n${'═'.repeat(100)}`)
  console.log(`  ${results.length} unique events found`)
  console.log(`${'═'.repeat(100)}\n`)

  if (results.length) {
    const col = (s: string, w: number) => s.slice(0, w).padEnd(w)
    console.log(
      col('Date', 12) + col('Artist / Series', 30) + col('Venue', 25) +
      col('Time', 10) + col('Source', 25)
    )
    console.log('─'.repeat(102))
    for (const e of results) {
      console.log(
        col(e.date, 12) +
        col(e.artist_name, 30) +
        col(e.venue, 25) +
        col(e.time ?? 'TBD', 10) +
        col(e.source_name, 25)
      )
    }
  }

  // ── Save draft ──
  const outDir = path.join(process.cwd(), 'output')
  fs.mkdirSync(outDir, { recursive: true })
  const outFile = path.join(outDir, `${CITY_CODE.toLowerCase()}-draft.json`)
  fs.writeFileSync(outFile, JSON.stringify({
    city_code: CITY_CODE,
    city_name: metro.city,
    state: metro.state,
    scraped_at: new Date().toISOString(),
    event_count: results.length,
    events: results,
  }, null, 2))

  console.log(`\nDraft saved → output/${CITY_CODE.toLowerCase()}-draft.json`)
  console.log('\nReview the table above, then use the normal insert flow to push to Supabase.\n')
}

main().catch(err => {
  console.error('Scraper failed:', err)
  process.exit(1)
})
