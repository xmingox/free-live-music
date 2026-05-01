import { createClient } from '@supabase/supabase-js'

const EB_BASE = 'https://www.eventbriteapi.com/v3'

// Eventbrite music subcategory IDs → our genre labels
const SUBCATEGORY_GENRE: Record<string, string> = {
  '103002': 'Jazz',
  '103003': 'Classical',
  '103006': 'Electronic',
  '103007': 'Folk',
  '103008': 'Hip-hop',
  '103009': 'Indie Rock',
  '103010': 'Latin Folk',
  '103013': 'Indie Pop',
  '103014': 'R&B',
  '103017': 'Indie Rock',
  '103018': 'Folk',
}

interface EBEvent {
  id: string
  name: { text: string }
  start: { local: string }
  url: string
  subcategory_id: string | null
  venue: {
    name: string
    address: {
      neighborhood: string | null
      localized_area_display: string | null
    }
  } | null
}

// Async generator — yields one page of events at a time, handles pagination
async function* eventPages(apiKey: string, city: 'NYC' | 'LA') {
  const address = city === 'NYC' ? 'New York, NY' : 'Los Angeles, CA'
  const rangeStart = new Date().toISOString().split('.')[0]
  let page = 1

  while (true) {
    const qs = new URLSearchParams({
      categories: '103',           // Music category
      price: 'free',
      'location.address': address,
      'location.within': '25mi',
      'start_date.range_start': rangeStart,
      expand: 'venue',
      page: String(page),
    })

    const res = await fetch(`${EB_BASE}/events/search/?${qs}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!res.ok) throw new Error(`Eventbrite API ${res.status}: ${await res.text()}`)

    const body = await res.json() as {
      events: EBEvent[]
      pagination: { has_more_items: boolean }
    }

    yield body.events
    if (!body.pagination.has_more_items) break
    page++
  }
}

// Parse Eventbrite's local datetime string (no timezone offset) into date + 12h time
function parseLocalDT(local: string): { date: string; time: string } {
  const [datePart, timePart] = local.split('T')
  const [h, m] = timePart.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return {
    date: datePart,
    time: `${hour}:${String(m).padStart(2, '0')} ${period}`,
  }
}

function toRow(event: EBEvent, city: 'NYC' | 'LA') {
  const { date, time } = parseLocalDT(event.start.local)
  const addr = event.venue?.address
  const neighborhood =
    addr?.neighborhood ??
    addr?.localized_area_display ??
    (city === 'NYC' ? 'New York' : 'Los Angeles')

  return {
    artist_name: event.name.text.slice(0, 200),
    venue: event.venue?.name ?? 'TBA',
    date,
    time,
    neighborhood,
    city,
    genre: event.subcategory_id ? (SUBCATEGORY_GENRE[event.subcategory_id] ?? null) : null,
    price: 'Free',
    // Eventbrite always requires ticket claim even for free events
    admission_type: 'Free RSVP' as const,
    is_verified: false,
    source_url: event.url,
    source_name: 'Eventbrite',
    source_id: event.id,
  }
}

export interface ImportStats {
  inserted: number
  skipped: number
  errors: number
}

export async function runImport(): Promise<ImportStats> {
  const apiKey = process.env.EVENTBRITE_API_KEY
  if (!apiKey) throw new Error('EVENTBRITE_API_KEY is not set')

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } }
  )

  const stats: ImportStats = { inserted: 0, skipped: 0, errors: 0 }

  for (const city of ['NYC', 'LA'] as const) {
    for await (const events of eventPages(apiKey, city)) {
      for (const event of events) {
        if (!event.venue) { stats.skipped++; continue }

        const { error } = await supabase.from('concerts').insert(toRow(event, city))

        if (error) {
          // 23505 = unique_violation — duplicate source_name + source_id
          if (error.code === '23505') {
            stats.skipped++
          } else {
            stats.errors++
            console.error('[import] event', event.id, '—', error.message)
          }
        } else {
          stats.inserted++
        }
      }
    }
  }

  return stats
}
