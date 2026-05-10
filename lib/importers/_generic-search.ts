/**
 * Generic search-based concert importer.
 *
 * Uses Brave Search API to find free-concert pages for a given metro, then
 * sends the page text through Claude Haiku (two-pass: classify → extract) and
 * writes extracted events to the `event_submissions` table with
 * status='pending' and source_extractor='haiku:scrape-concerts'.
 *
 * NOTE: puppeteer fallback (for JS-rendered pages) is intentionally omitted
 * here — this module is designed for serverless/Vercel execution where
 * puppeteer is not available. The CLI script at scripts/scrape-concerts.ts
 * retains the puppeteer fallback for local use.
 *
 * NOTE: URL deduplication against `scraped_sources` (skip URLs scraped in the
 * last 7 days) is not implemented here because that table does not yet exist in
 * the DB. To add it, create a migration:
 *
 *   CREATE TABLE scraped_sources (
 *     url         text PRIMARY KEY,
 *     last_scraped timestamptz NOT NULL DEFAULT now(),
 *     city_code    text
 *   );
 *
 * Then add a check in fetchAndExtract() before fetching each URL.
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY
 *   BRAVE_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'
import metros from '@/lib/metros.json'
import { loadSuppressions, filterSuppressed } from './suppression'

// ── Constants ─────────────────────────────────────────────────────────────────

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const MAX_URLS = 12
const MAX_PAGE_TEXT = 12_000
const TODAY = new Date().toISOString().split('T')[0]

/**
 * Domains that never contain useful concert listing pages.
 * Kept as a RegExp for fast per-URL filtering.
 */
const SKIP_DOMAINS =
  /youtube\.com|facebook\.com|twitter\.com|instagram\.com|tiktok\.com|reddit\.com|yelp\.com|tripadvisor\.com|ticketmaster\.com|stubhub\.com|eventbrite\.com|songkick\.com|seatgeek\.com|bandsintown\.com|concerts50\.com|concertfix\.com|jambase\.com|axs\.com|livenation\.com/

// ── Internal types ────────────────────────────────────────────────────────────

interface ExtractedEvent {
  artist_name: string
  venue: string
  date: string           // YYYY-MM-DD
  time: string | null    // "7:00pm" or null
  neighborhood: string
  genre: string | null
  admission_type: 'Walk-up free' | 'Free RSVP'
  indoor_outdoor: 'Indoor' | 'Outdoor' | 'Both' | null
  source_name: string
  source_url: string
}

// ── Supabase client (lazy singleton per invocation) ───────────────────────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ── Brave Search ──────────────────────────────────────────────────────────────

async function braveSearch(query: string): Promise<string[]> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=7`
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': process.env.BRAVE_API_KEY!,
      },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return []
    const data: any = await res.json()
    return (data.web?.results ?? [])
      .map((r: any) => r.url as string)
      .filter((u: string) => !SKIP_DOMAINS.test(u))
  } catch {
    return []
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Page fetcher (cheerio only — no puppeteer in serverless) ──────────────────

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    if (!res.ok) return ''
    const html = await res.text()
    const $ = cheerio.load(html)
    $(
      'script, style, nav, footer, header, noscript, iframe, [class*="cookie"], [class*="banner"], [class*="popup"]',
    ).remove()
    const text = $('body').text().replace(/\s+/g, ' ').trim()
    return text.slice(0, MAX_PAGE_TEXT)
  } catch {
    return ''
  }
}

// ── Haiku helpers ─────────────────────────────────────────────────────────────

async function callHaiku(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
      max_tokens: 64,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(30_000),
  })
  const data: any = await res.json()
  return data?.content?.[0]?.text ?? ''
}

async function callHaikuExtract(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(30_000),
  })
  const data: any = await res.json()
  return data?.content?.[0]?.text ?? '[]'
}

/**
 * Pass 1: Ask Haiku whether this page is a relevant free-concert listing.
 * Returns true if Haiku answers YES.
 */
async function classifyPage(
  text: string,
  cityName: string,
  stateName: string,
): Promise<boolean> {
  const prompt =
    `Is this page a free live music event listing for ${cityName}, ${stateName} in 2026? ` +
    `Reply YES or NO and one sentence reason.\n\nText:\n${text.slice(0, 3000)}`
  const answer = await callHaiku(prompt)
  return answer.trimStart().toUpperCase().startsWith('YES')
}

/**
 * Pass 2: Extract structured events from the page text.
 * Returns an empty array if parsing fails or Haiku returns nothing useful.
 */
async function extractEvents(
  text: string,
  sourceUrl: string,
  cityName: string,
  stateName: string,
): Promise<ExtractedEvent[]> {
  const prompt = `Extract free live music/concert events from the text below. Return a JSON array only — no markdown, no other text.

City: ${cityName}, ${stateName}
Source URL: ${sourceUrl}
Today: ${TODAY}

Rules:
- ONLY include events physically located in ${cityName}, ${stateName} — reject events in other cities or states even if the page mentions them
- Only include events with FREE admission (no ticket cost, walk-up free or free RSVP)
- Only include 2026 dates (YYYY-MM-DD format) that are >= ${TODAY}
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

  const raw = await callHaikuExtract(prompt)
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  try {
    const events: ExtractedEvent[] = JSON.parse(jsonMatch[0])
    return events
      .filter(
        e =>
          e.artist_name &&
          e.venue &&
          /^\d{4}-\d{2}-\d{2}$/.test(e.date ?? '') &&
          (e.date ?? '') >= TODAY,
      )
      .map(e => ({ ...e, source_url: sourceUrl }))
  } catch {
    return []
  }
}

// ── Deduplication ─────────────────────────────────────────────────────────────

/**
 * In-flight deduplication: removes events with the same date|artist|venue
 * key that already appeared in the current batch.
 */
function dedupeLocal(events: ExtractedEvent[]): ExtractedEvent[] {
  const seen = new Set<string>()
  return events.filter(e => {
    const key = `${e.date}|${e.artist_name.toLowerCase().replace(/\s+/g, '').slice(0, 30)}|${e.venue.toLowerCase().slice(0, 20)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Cross-table deduplication: check the `concerts` table for events with the
 * same date and a similar slug-like artist key. Returns the subset of events
 * that are NOT already in the concerts table.
 */
async function filterAgainstConcerts(
  events: ExtractedEvent[],
  cityCode: string,
): Promise<ExtractedEvent[]> {
  if (events.length === 0) return []

  const supabase = getSupabase()
  const dates = [...new Set(events.map(e => e.date))]

  // Fetch existing concerts for this city on the same dates.
  const { data: existing } = await supabase
    .from('concerts')
    .select('date, artist_name')
    .eq('city', cityCode)
    .in('date', dates)

  if (!existing || existing.length === 0) return events

  const existingKeys = new Set(
    existing.map(
      (row: { date: string; artist_name: string }) =>
        `${row.date}|${row.artist_name.toLowerCase().replace(/\s+/g, '').slice(0, 30)}`,
    ),
  )

  return events.filter(e => {
    const key = `${e.date}|${e.artist_name.toLowerCase().replace(/\s+/g, '').slice(0, 30)}`
    return !existingKeys.has(key)
  })
}

// ── Supabase insert ───────────────────────────────────────────────────────────

async function insertSubmissions(
  events: ExtractedEvent[],
  cityCode: string,
): Promise<number> {
  if (events.length === 0) return 0

  const supabase = getSupabase()

  const rows = events.map(e => ({
    source_extractor: 'haiku:scrape-concerts',
    city_code: cityCode,
    extracted_artist: e.artist_name,
    extracted_venue: e.venue,
    extracted_date: e.date,
    extracted_time: e.time,
    extracted_genre: e.genre ?? null,
    extracted_neighborhood: e.neighborhood ?? null,
    extracted_admission_type: e.admission_type,
    extracted_indoor_outdoor: e.indoor_outdoor ?? null,
    source_name: e.source_name,
    source_url: e.source_url,
    status: 'pending',
    auto_approve_eligible: false,
    submitted_at: new Date().toISOString(),
  }))

  const { error, data } = await supabase
    .from('event_submissions')
    .insert(rows)
    .select('id')

  if (error) {
    console.error('[genericSearchImport] insert error:', error.message)
    return 0
  }

  return data?.length ?? rows.length
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run the generic search importer for a single metro city.
 *
 * Steps:
 * 1. Resolve city + state from metros.json.
 * 2. Run 3 Brave search queries, collect up to MAX_URLS unique URLs.
 * 3. For each URL: fetch text → classify (Haiku pass 1) → extract (pass 2).
 * 4. Dedupe locally, then cross-check against existing concerts table.
 * 5. Insert survivors to event_submissions with status='pending'.
 *
 * @param cityCode  Metro code, e.g. "OMA", "PIT", "STL"
 */
export async function genericSearchImport(cityCode: string): Promise<{
  submissions_created: number
  errors: string[]
}> {
  const errors: string[] = []

  // 1. Resolve metro
  const metro = (metros as any).metros.find(
    (m: any) => m.code === cityCode.toUpperCase(),
  )
  if (!metro) {
    return {
      submissions_created: 0,
      errors: [`Metro code "${cityCode}" not found in metros.json`],
    }
  }

  const { city: cityName, state: stateName } = metro
  const cityState = `${cityName} ${stateName}`

  // 2. Collect search result URLs
  const queries = [
    `"${cityState}" free concerts summer 2026 schedule`,
    `"${cityState}" free outdoor concert series 2026`,
    `${cityState} parks free live music 2026`,
  ]

  const urlSet = new Set<string>()
  for (const query of queries) {
    const urls = await braveSearch(query)
    urls.forEach(u => urlSet.add(u))
    await sleep(500)
  }

  const urls = [...urlSet].slice(0, MAX_URLS)

  // 3. Fetch, classify, extract
  const allEvents: ExtractedEvent[] = []

  for (const url of urls) {
    try {
      const text = await fetchPageText(url)
      if (text.length < 300) {
        await sleep(200)
        continue
      }

      const isRelevant = await classifyPage(text, cityName, stateName)
      if (!isRelevant) {
        await sleep(200)
        continue
      }

      const events = await extractEvents(text, url, cityName, stateName)
      allEvents.push(...events)
    } catch (err) {
      const msg = `URL fetch/extract failed (${url.slice(0, 80)}): ${err}`
      console.error('[genericSearchImport]', msg)
      errors.push(msg)
    }
    await sleep(200)
  }

  // 4. Dedupe: in-flight first, then against concerts table
  const deduped = dedupeLocal(allEvents)
  let toInsert: ExtractedEvent[]
  try {
    toInsert = await filterAgainstConcerts(deduped, cityCode.toUpperCase())
  } catch (err) {
    // Non-fatal: if the dedup query fails, skip that guard and insert all
    const msg = `concerts dedup check failed: ${err}`
    console.warn('[genericSearchImport]', msg)
    errors.push(msg)
    toInsert = deduped
  }

  // 4b. Suppression filter — drop any rows matching crawl_suppressions
  try {
    const suppressions = await loadSuppressions(getSupabase())
    const { kept, suppressed } = filterSuppressed(toInsert, suppressions)
    if (suppressed > 0) {
      console.log(`[genericSearchImport:${cityCode}] suppressed ${suppressed} rows`)
    }
    toInsert = kept as ExtractedEvent[]
  } catch (err) {
    console.warn('[genericSearchImport] suppression load failed (non-fatal):', err)
  }

  // 5. Insert
  let submissions_created = 0
  try {
    submissions_created = await insertSubmissions(toInsert, cityCode.toUpperCase())
  } catch (err) {
    const msg = `event_submissions insert failed: ${err}`
    console.error('[genericSearchImport]', msg)
    errors.push(msg)
  }

  return { submissions_created, errors }
}
