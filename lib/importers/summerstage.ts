import type { ImportRow } from './types'
import { getUsToday } from '../timezone'

const ICAL_URL = 'https://cityparksfoundation.org/?post_type=tribe_events&ical=1&eventDisplay=list&tribe_events_cat=summerstage'
const SOURCE_NAME = 'SummerStage'
const SOURCE_URL = 'https://cityparksfoundation.org/summerstage/'

// iCal line folding: continuation lines start with a space or tab
function unfoldLines(raw: string): string[] {
  return raw.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r\n|\r|\n/)
}

function parseVEvents(raw: string): Record<string, string>[] {
  const lines = unfoldLines(raw)
  const events: Record<string, string>[] = []
  let current: Record<string, string> | null = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {}
    } else if (line === 'END:VEVENT') {
      if (current) events.push(current)
      current = null
    } else if (current) {
      const colonIdx = line.indexOf(':')
      if (colonIdx === -1) continue
      // Strip property parameters (e.g. DTSTART;TZID=America/New_York → DTSTART)
      const key = line.slice(0, colonIdx).split(';')[0].toUpperCase()
      const value = line.slice(colonIdx + 1)
      current[key] = value
    }
  }

  return events
}

function parseDatetime(dtstart: string): { date: string; time: string | null } {
  const m = dtstart.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/)
  if (!m) return { date: '', time: null }
  const date = `${m[1]}-${m[2]}-${m[3]}`
  const time = m[4] && m[5] ? `${m[4]}:${m[5]}` : null
  return { date, time }
}

function normalizeLocation(location: string): string {
  const lower = location.toLowerCase()
  if (lower.includes('bronx'))         return 'Bronx'
  if (lower.includes('brooklyn'))      return 'Brooklyn'
  if (lower.includes('queens'))        return 'Queens'
  if (lower.includes('staten island')) return 'Staten Island'
  if (lower.includes('manhattan'))     return 'Manhattan'
  return location || 'New York'
}

// Benefit concerts require ticket purchase — skip them
function isBenefitConcert(summary: string): boolean {
  const lower = summary.toLowerCase()
  return lower.includes('benefit') && lower.includes('concert')
}

export async function fetchSummerStageShows(): Promise<ImportRow[]> {
  const res = await fetch(ICAL_URL, {
    headers: { 'User-Agent': 'freelivemusic.co/importer' },
    next: { revalidate: 0 },
  })
  if (!res.ok) return []

  const raw = await res.text()
  const vevents = parseVEvents(raw)
  const today = getUsToday()
  const rows: ImportRow[] = []

  for (const ev of vevents) {
    const summary = ev['SUMMARY'] ?? ''
    if (!summary || isBenefitConcert(summary)) continue

    const { date, time } = parseDatetime(ev['DTSTART'] ?? '')
    if (!date || date < today) continue

    const neighborhood = normalizeLocation(ev['LOCATION'] ?? '')
    const eventUrl = ev['URL'] ?? SOURCE_URL
    const sourceId = `summerstage-${date}-${summary.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`

    rows.push({
      artist_name:    summary,
      venue:          'SummerStage',
      date,
      time,
      neighborhood,
      city:           'NYC',
      genre:          null,
      price:          'Free',
      admission_type: 'Walk-up free',
      indoor_outdoor: 'Outdoor',
      is_verified:    true,
      image_url:      null,
      source_name:    SOURCE_NAME,
      source_id:      sourceId,
      source_url:     eventUrl,
    })
  }

  return rows
}
