/**
 * enrich-neighborhoods.mjs
 *
 * Back-fills the `neighborhood` field on venues that have lat/lng but no neighborhood,
 * using Google's Geocoding API (reverse geocode).
 *
 * Usage:
 *   node scripts/enrich-neighborhoods.mjs [--limit 1000] [--dry-run]
 *
 * Env vars required (loaded from .env.local automatically):
 *   GOOGLE_MAPS_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Cost: ~$5 per 1,000 requests (Google Geocoding API).
 *       Usually covered by the $200/month free credit.
 *
 * Only processes venues that:
 *   - have lat AND lng populated
 *   - have neighborhood IS NULL or empty
 *   - are NOT soft-deleted (music_score > -100 or music_score IS NULL)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Load .env.local ───────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
try {
  const env = readFileSync(envPath, 'utf8')
  for (const line of env.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  // .env.local not found — rely on environment variables being set externally
}

// ── Config ────────────────────────────────────────────────────────────────────

const limitArg = process.argv.find(a => a.startsWith('--limit=') || a.startsWith('--limit'))
const LIMIT    = parseInt(limitArg?.includes('=') ? limitArg.split('=')[1] : (process.argv[process.argv.indexOf('--limit') + 1] ?? '1000'), 10)
const DRY_RUN  = process.argv.includes('--dry-run')
const BATCH_SZ = 10   // concurrent geocode requests
const DELAY_MS = 100  // ms between batches (stay under 50 QPS)

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!GOOGLE_KEY) { console.error('Missing GOOGLE_MAPS_API_KEY'); process.exit(1) }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env vars'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Load suppression list ─────────────────────────────────────────────────────

async function loadSuppressedVenueNames() {
  const { data } = await supabase
    .from('crawl_suppressions')
    .select('pattern, match_field, match_type')
  return data ?? []
}

function isSuppressedVenue(venueName, suppressions) {
  for (const s of suppressions) {
    if (s.match_field !== 'venue' && s.match_field !== 'any') continue
    const v = venueName.toLowerCase()
    const p = s.pattern.toLowerCase()
    if (s.match_type === 'exact' && v === p) return true
    if (s.match_type === 'starts_with' && v.startsWith(p)) return true
    if (s.match_type === 'contains' && v.includes(p)) return true
  }
  return false
}

// ── Google Geocoding ──────────────────────────────────────────────────────────

async function reverseGeocode(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_KEY}`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 'OK') return null

    const result = data.results?.[0]
    if (!result) return null

    // Try neighborhood first, fall back to sublocality_level_1, then sublocality
    const components = result.address_components ?? []
    for (const preferred of ['neighborhood', 'sublocality_level_1', 'sublocality']) {
      const match = components.find(c => c.types.includes(preferred))
      if (match) return match.long_name
    }
    return null
  } catch {
    return null
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nenrich-neighborhoods.mjs`)
  console.log(`  limit:   ${LIMIT}`)
  console.log(`  dry-run: ${DRY_RUN}`)
  console.log(`  batch:   ${BATCH_SZ} concurrent\n`)

  // Load suppression list
  const suppressions = await loadSuppressedVenueNames()
  console.log(`Loaded ${suppressions.length} suppression rules\n`)

  // Fetch all qualifying venues with pagination (Supabase caps at 1000/request)
  const PAGE_SIZE = 1000
  const venues = []
  let offset = 0

  while (venues.length < LIMIT) {
    const fetchSize = Math.min(PAGE_SIZE, LIMIT - venues.length)
    const { data, error } = await supabase
      .from('venues')
      .select('id, name, lat, lng, city')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .or('neighborhood.is.null,neighborhood.eq.')
      .or('music_score.is.null,music_score.gt.-100')
      .range(offset, offset + fetchSize - 1)

    if (error) {
      console.error('Failed to fetch venues:', error.message)
      process.exit(1)
    }
    if (!data || data.length === 0) break
    venues.push(...data)
    offset += data.length
    if (data.length < fetchSize) break
  }

  console.log(`Fetched ${venues.length} venues to enrich\n`)

  // Filter out suppressed venue names
  const toProcess = venues.filter(v => !isSuppressedVenue(v.name, suppressions))
  const skippedSuppressed = venues.length - toProcess.length
  if (skippedSuppressed > 0) {
    console.log(`Skipped ${skippedSuppressed} suppressed venues\n`)
  }

  let enriched = 0
  let notFound = 0
  let failed   = 0
  let processed = 0

  // Process in batches
  for (let i = 0; i < toProcess.length; i += BATCH_SZ) {
    const batch = toProcess.slice(i, i + BATCH_SZ)

    await Promise.all(batch.map(async (venue) => {
      const neighborhood = await reverseGeocode(venue.lat, venue.lng)
      processed++

      if (!neighborhood) {
        notFound++
        return
      }

      if (DRY_RUN) {
        console.log(`  [dry-run] ${venue.name} (${venue.city}) → "${neighborhood}"`)
        enriched++
        return
      }

      const { error: updateError } = await supabase
        .from('venues')
        .update({ neighborhood })
        .eq('id', venue.id)

      if (updateError) {
        console.error(`  Failed to update ${venue.name}: ${updateError.message}`)
        failed++
      } else {
        enriched++
        if (enriched % 50 === 0) {
          console.log(`  Progress: ${processed}/${toProcess.length} processed, ${enriched} enriched`)
        }
      }
    }))

    if (i + BATCH_SZ < toProcess.length) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  console.log('\n── Results ──────────────────────────────────────────')
  console.log(`  Processed:  ${processed}`)
  console.log(`  Enriched:   ${enriched}`)
  console.log(`  Not found:  ${notFound}  (no neighborhood in geocode response)`)
  console.log(`  Failed:     ${failed}   (DB update errors)`)
  console.log(`  Suppressed: ${skippedSuppressed}  (matched suppression list)`)
  if (DRY_RUN) console.log('\n  (dry-run mode — no DB writes made)')
  console.log('')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
