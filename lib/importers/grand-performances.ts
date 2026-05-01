import type { ImportRow } from './types'

const SOURCE_NAME = 'Grand Performances'
const EVENTS_URL = 'https://www.grandperformances.org/events?format=json'

export async function scrapeGrandPerformances(): Promise<ImportRow[]> {
  const res = await fetch(EVENTS_URL)
  const data = await res.json()
  const rows: ImportRow[] = []

  const items = data?.upcoming ?? data?.collection?.items ?? data?.items ?? []

  for (const item of items) {
    const title = item.title ?? item.fullTitle
    const startDate = item.startDate ?? item.publishOn
    if (!title || !startDate) continue

    const date = new Date(typeof startDate === 'number' ? startDate : Number(startDate))
    const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Los_Angeles' })

    rows.push({
      artist_name:    title,
      venue:          'California Plaza',
      date:           dateStr,
      time:           timeStr,
      neighborhood:   'Downtown LA',
      city:           'LA',
      genre:          null,
      price:          'Free',
      admission_type: 'Walk-up free',
      indoor_outdoor: 'Outdoor',
      is_verified:    true,
      image_url:      item.assetUrl ?? item.thumbnailUrl ?? null,
      source_name:    SOURCE_NAME,
      source_id:      `gp-${dateStr}-${item.id ?? item.urlId}`,
      source_url:     `https://www.grandperformances.org/events/${item.urlId ?? item.id}`,
    })
  }

  return rows
}
