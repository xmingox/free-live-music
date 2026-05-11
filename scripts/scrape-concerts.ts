/**
 * Automated concert scraper — uses Brave Search + Claude Haiku to find free concerts.
 *
 * Usage:  tsx scripts/scrape-concerts.ts <CITY_CODE>
 *
 * Results are written directly to event_submissions (status='pending').
 * Review and approve them at /moderation.
 *
 * Required in .env.local:
 *   ANTHROPIC_API_KEY
 *   BRAVE_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import metros from '../lib/metros.json'
import { genericSearchImport } from '../lib/importers/_generic-search'

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

for (const key of ['ANTHROPIC_API_KEY', 'BRAVE_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in .env.local`)
    process.exit(1)
  }
}

async function main() {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  Scraping free concerts — ${metro.city}, ${metro.state} (${CITY_CODE})`)
  console.log(`${'═'.repeat(60)}\n`)

  const result = await genericSearchImport(CITY_CODE)

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  Done`)
  console.log(`${'═'.repeat(60)}`)
  console.log(`  Submissions created : ${result.submissions_created}`)
  if (result.errors.length > 0) {
    console.log(`  Errors (${result.errors.length}):`)
    result.errors.forEach(e => console.log(`    - ${e}`))
  }
  console.log(`\nReview and approve at /moderation (Pipeline tab).\n`)
}

main().catch(err => {
  console.error('Scraper failed:', err)
  process.exit(1)
})
