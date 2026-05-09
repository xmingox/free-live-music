// scripts/enrich-venues.mjs
// Usage: node scripts/enrich-venues.mjs
// Enriches venues table with Google Places data (address, lat/lng, website, phone, type)

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Parse .env.local
const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env.local'), 'utf-8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const idx = line.indexOf('=')
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const SUPABASE_URL     = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY     = env.SUPABASE_SERVICE_ROLE_KEY
const PLACES_API_KEY   = env.GOOGLE_PLACES_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env vars'); process.exit(1) }
if (!PLACES_API_KEY)                { console.error('Missing GOOGLE_PLACES_API_KEY in .env.local'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Load metro code → city name map
const metros = JSON.parse(readFileSync(join(ROOT, 'lib/metros.json'), 'utf-8')).metros
const codeToCity = Object.fromEntries(metros.map(m => [m.code, `${m.city}, ${m.state}`]))

// Map Google place types → our venue_type enum
const TYPE_PRIORITY = [
  ['amphitheater',    'amphitheater'],
  ['performing_arts_theater', 'amphitheater'],
  ['stadium',         'amphitheater'],
  ['event_venue',     'amphitheater'],
  ['park',            'park'],
  ['national_park',   'park'],
  ['state_park',      'park'],
  ['brewery',         'brewery'],
  ['bar',             'bar'],
  ['night_club',      'bar'],
  ['restaurant',      'restaurant'],
  ['cafe',            'restaurant'],
  ['shopping_mall',   'mall'],
  ['market',          'farmers_market'],
  ['church',          'church'],
  ['place_of_worship','church'],
  ['library',         'library'],
  ['university',      'school'],
  ['school',          'school'],
  ['museum',          'museum'],
  ['community_center','community_center'],
  ['rooftop',         'rooftop'],
]

function mapType(googleTypes = []) {
  for (const [googleType, ourType] of TYPE_PRIORITY) {
    if (googleTypes.includes(googleType)) return ourType
  }
  return 'other'
}

async function searchPlace(venueName, cityCode) {
  const cityName = codeToCity[cityCode] ?? cityCode
  const query = `${venueName} ${cityName}`

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': PLACES_API_KEY,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.websiteUri',
        'places.nationalPhoneNumber',
        'places.types',
      ].join(','),
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.places?.[0] ?? null
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  // Fetch venues needing enrichment (no google_place_id yet)
  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, slug, name, city, google_place_id')
    .is('google_place_id', null)
    .order('city')

  if (error) { console.error('Supabase error:', error); process.exit(1) }

  console.log(`\n🎵 Enriching ${venues.length} venues via Google Places\n`)

  let updated = 0, notFound = 0, errors = 0
  const notFoundList = []

  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i]
    process.stdout.write(`[${i + 1}/${venues.length}] ${venue.name} (${venue.city}) ... `)

    try {
      const place = await searchPlace(venue.name, venue.city)

      if (!place) {
        console.log('not found')
        notFoundList.push(`${venue.name} (${venue.city})`)
        notFound++
        await sleep(300)
        continue
      }

      const venueType = mapType(place.types)
      const updates = {
        google_place_id: place.id,
        venue_type:      venueType,
        updated_at:      new Date().toISOString(),
      }
      if (place.formattedAddress)      updates.address = place.formattedAddress
      if (place.location?.latitude)    updates.lat     = place.location.latitude
      if (place.location?.longitude)   updates.lng     = place.location.longitude
      if (place.websiteUri)            updates.website = place.websiteUri
      if (place.nationalPhoneNumber)   updates.phone   = place.nationalPhoneNumber

      const { error: upErr } = await supabase.from('venues').update(updates).eq('id', venue.id)
      if (upErr) throw new Error(upErr.message)

      console.log(`✓  [${venueType}] ${place.formattedAddress ?? ''}`)
      updated++
    } catch (err) {
      console.log(`✗  ERROR: ${err.message}`)
      errors++
    }

    // ~2 req/sec — well within Google's 10 QPS limit
    await sleep(500)
  }

  console.log(`\n─────────────────────────────────`)
  console.log(`✅  Updated:   ${updated}`)
  console.log(`❓  Not found: ${notFound}`)
  console.log(`❌  Errors:    ${errors}`)

  if (notFoundList.length) {
    console.log(`\nNot found (may need manual check):`)
    notFoundList.forEach(n => console.log(`  • ${n}`))
  }

  console.log(`\nDone. Run "git push" if you're done — ISR will serve enriched data within an hour.`)
  console.log(`To clear cache immediately: Redeploy in Vercel dashboard.\n`)
}

main()
