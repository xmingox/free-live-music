// Standalone import script — run with:  npm run import
// Loads .env.local automatically via dotenv before anything else.
import { config } from 'dotenv'
config({ path: '.env.local' })

import { runImport } from '../lib/import-eventbrite'

runImport()
  .then(({ inserted, skipped, errors }) => {
    console.log(`Done — inserted: ${inserted}  skipped (duplicates): ${skipped}  errors: ${errors}`)
    process.exit(0)
  })
  .catch((err: Error) => {
    console.error('Import failed:', err.message)
    process.exit(1)
  })
