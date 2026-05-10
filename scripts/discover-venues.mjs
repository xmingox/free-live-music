// scripts/discover-venues.mjs
// Usage: node scripts/discover-venues.mjs <CITY_CODE> [--insert] [--all-types] [--min-rating=N]
//
// Discovers potential new venues with live music for a given city via Google Places.
// Dry-run by default — shows candidates ranked by rating.
// Pass --insert to write them into the venues table.
// Pass --all-types to also surface parks and amphitheaters (mostly ticketed — use carefully).
// Pass --min-rating=4.2 to hide venues below that Google rating (good for noisy cities).

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env.local'), 'utf-8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const idx = line.indexOf('=')
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const SUPABASE_URL   = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY   = env.SUPABASE_SERVICE_ROLE_KEY
const PLACES_API_KEY = env.GOOGLE_PLACES_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env vars'); process.exit(1) }
if (!PLACES_API_KEY)                { console.error('Missing GOOGLE_PLACES_API_KEY'); process.exit(1) }

const cityCode   = process.argv[2]?.toUpperCase()
const autoInsert = process.argv.includes('--insert')
const allTypes   = process.argv.includes('--all-types')
const minRating  = parseFloat(process.argv.find(a => a.startsWith('--min-rating='))?.split('=')[1] ?? '0') || 0

if (!cityCode) {
  console.error('Usage: node scripts/discover-venues.mjs <CITY_CODE> [--insert] [--all-types] [--min-rating=N]')
  console.error('Example: node scripts/discover-venues.mjs LA --min-rating=4.2')
  process.exit(1)
}

const metros = JSON.parse(readFileSync(join(ROOT, 'lib/metros.json'), 'utf-8')).metros
const metro  = metros.find(m => m.code === cityCode)
if (!metro) {
  console.error(`Unknown city code: ${cityCode}`)
  console.error('Check lib/metros.json for valid codes.')
  process.exit(1)
}

const cityName = `${metro.city}, ${metro.state}`

// Queries designed to surface bars, restaurants, coffee shops, and breweries
// with regular live music — the year-round indoor venues we're missing.
const SEARCH_QUERIES = [
  `bar free live music ${cityName}`,
  `jazz bar ${cityName}`,
  `open mic bar ${cityName}`,
  `brewery live music ${cityName}`,
  `restaurant live music ${cityName}`,
  `coffee shop live music ${cityName}`,
  `cafe live music ${cityName}`,
  `rooftop bar live music ${cityName}`,
  `jazz club ${cityName}`,
  `blues bar ${cityName}`,
  `live music venue ${cityName}`,
  `shopping mall live music ${cityName}`,
  `shopping center outdoor concerts ${cityName}`,
]

const TYPE_PRIORITY = [
  ['amphitheater',            'amphitheater'],
  ['performing_arts_theater', 'amphitheater'],
  ['stadium',                 'amphitheater'],
  ['event_venue',             'amphitheater'],
  ['park',                    'park'],
  ['national_park',           'park'],
  ['state_park',              'park'],
  ['brewery',                 'brewery'],
  ['bar',                     'bar'],
  ['night_club',              'bar'],
  ['restaurant',              'restaurant'],
  ['cafe',                    'coffee_shop'],
  ['coffee_shop',             'coffee_shop'],
  ['shopping_mall',           'mall'],
  ['market',                  'farmers_market'],
  ['church',                  'church'],
  ['place_of_worship',        'church'],
  ['library',                 'library'],
  ['university',              'school'],
  ['school',                  'school'],
  ['museum',                  'museum'],
  ['community_center',        'community_center'],
]

// Types never worth discovering
const SKIP_TYPES = new Set(['school', 'museum', 'library', 'church', 'farmers_market'])

// Default: only surface venues that typically host FREE music (bars, breweries, restaurants, malls).
// amphitheater / park are mostly ticketed concert venues — opt-in with --all-types.
const FREE_VENUE_TYPES = new Set(['bar', 'brewery', 'restaurant', 'coffee_shop', 'mall', 'other'])

// Name keywords that almost always mean a ticketed commercial venue — skip regardless of type.
const TICKETED_NAME_RE = /\b(theater|theatre|palladium|ballroom|auditorium|arena|improv|comedy\s*club|opera\s*house|concert\s*hall)\b/i

function mapType(googleTypes = []) {
  for (const [googleType, ourType] of TYPE_PRIORITY) {
    if (googleTypes.includes(googleType)) return ourType
  }
  return 'other'
}

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function searchPlaces(query) {
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
        'places.rating',
        'places.userRatingCount',
        'places.regularOpeningHours',
      ].join(','),
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 20 }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.places ?? []
}

async function main() {
  console.log(`\n🔍 Discovering venues for ${metro.city}, ${metro.state} (${cityCode})`)
  console.log(`   Running ${SEARCH_QUERIES.length} searches via Google Places\n`)

  // Load existing venues to avoid duplicates
  const { data: existing } = await supabase
    .from('venues')
    .select('name, google_place_id, slug')
    .eq('city', cityCode)

  const existingPlaceIds = new Set((existing ?? []).map(v => v.google_place_id).filter(Boolean))
  const existingNames    = new Set((existing ?? []).map(v => v.name.toLowerCase()))

  console.log(`Existing in DB: ${existing?.length ?? 0} venues for ${cityCode}\n`)

  const seen       = new Set() // dedup across queries by google_place_id
  const candidates = []

  for (const query of SEARCH_QUERIES) {
    process.stdout.write(`  "${query}" ... `)
    try {
      const places = await searchPlaces(query)
      let newCount = 0

      for (const place of places) {
        if (!place.id || seen.has(place.id)) continue
        seen.add(place.id)

        if (existingPlaceIds.has(place.id)) continue
        const name = place.displayName?.text ?? ''
        if (!name || existingNames.has(name.toLowerCase())) continue

        const venueType = mapType(place.types ?? [])

        // Always skip certain types
        if (SKIP_TYPES.has(venueType)) continue

        // Skip obvious ticketed venues by name keyword
        if (TICKETED_NAME_RE.test(name)) continue

        // By default only keep bar/brewery/restaurant/mall/other.
        // Amphitheaters and parks are mostly ticketed — require --all-types to surface them.
        if (!allTypes && !FREE_VENUE_TYPES.has(venueType)) continue

        candidates.push({
          google_place_id:  place.id,
          name,
          address:          place.formattedAddress ?? '',
          lat:              place.location?.latitude  ?? null,
          lng:              place.location?.longitude ?? null,
          website:          place.websiteUri          ?? null,
          phone:            place.nationalPhoneNumber ?? null,
          venue_type:       venueType,
          google_types:     (place.types ?? []).slice(0, 5).join(', '),
          rating:           place.rating             ?? null,
          rating_count:     place.userRatingCount    ?? null,
        })
        newCount++
      }

      console.log(`${places.length} results → ${newCount} new`)
    } catch (err) {
      console.log(`ERROR: ${err.message}`)
    }

    await sleep(500)
  }

  // Apply min-rating filter if requested
  const filtered = minRating
    ? candidates.filter(c => (c.rating ?? 0) >= minRating)
    : candidates

  const dropped = candidates.length - filtered.length

  console.log(`\n${'─'.repeat(65)}`)
  console.log(`🎯 ${filtered.length} potential new venues found${dropped ? ` (${dropped} below ${minRating}★ hidden)` : ''}\n`)

  if (filtered.length === 0) {
    console.log('Nothing new to add.')
    return
  }

  // Sort: highest-rated first
  filtered.sort((a, b) =>
    (b.rating ?? 0) - (a.rating ?? 0) ||
    (b.rating_count ?? 0) - (a.rating_count ?? 0)
  )

  // Print report
  filtered.forEach((c, i) => {
    const stars = c.rating
      ? `⭐ ${c.rating} (${(c.rating_count ?? 0).toLocaleString()} reviews)`
      : '(no rating)'
    console.log(`${String(i + 1).padStart(3)}. [${c.venue_type.padEnd(14)}] ${c.name}`)
    console.log(`          ${c.address}`)
    console.log(`          ${stars}`)
    if (c.website) console.log(`          ${c.website}`)
    console.log()
  })

  if (!autoInsert) {
    console.log(`Review the list above, then insert with:`)
    console.log(`  node scripts/discover-venues.mjs ${cityCode} --insert`)
    console.log(`\nTo also surface parks/amphitheaters (mostly ticketed — review carefully):`)
    console.log(`  node scripts/discover-venues.mjs ${cityCode} --all-types\n`)
    return
  }

  // Insert
  console.log(`\nInserting ${filtered.length} venues into Supabase...\n`)
  let inserted = 0, skipped = 0, errors = 0

  for (const c of filtered) {
    const slug = `${slugify(c.name)}-${cityCode.toLowerCase()}`
    const row  = {
      slug,
      name:            c.name,
      city:            cityCode,
      venue_type:      c.venue_type,
      google_place_id: c.google_place_id,
      address:         c.address,
      lat:             c.lat,
      lng:             c.lng,
      website:         c.website,
      phone:           c.phone,
      updated_at:      new Date().toISOString(),
    }

    const { error } = await supabase.from('venues').insert(row)
    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        console.log(`  ⚠  skipped (duplicate slug): ${c.name}`)
        skipped++
      } else {
        console.log(`  ✗  ERROR ${c.name}: ${error.message}`)
        errors++
      }
    } else {
      console.log(`  ✓  [${c.venue_type}] ${c.name}`)
      inserted++
    }

    await sleep(100)
  }

  console.log(`\n${'─'.repeat(65)}`)
  console.log(`✅  Inserted: ${inserted}`)
  console.log(`⚠   Skipped:  ${skipped}  (duplicate slug — venue may already exist under a different name)`)
  console.log(`❌  Errors:   ${errors}`)
  console.log(`\nNext: run "node scripts/enrich-venues.mjs" to fill in any missing details,`)
  console.log(`then redeploy Vercel to clear ISR cache.\n`)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
main()
