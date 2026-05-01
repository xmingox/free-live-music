import { config } from 'dotenv'
config({ path: '.env.local' })
import { runImport } from '../lib/importers/index'

;(async () => {
  const result = await runImport()
  console.log(`Inserted: ${result.inserted}`)
  console.log(`Skipped:  ${result.skipped}`)
  if (result.errors.length) {
    console.error('Errors:')
    result.errors.forEach(e => console.error(' ', e))
    process.exit(1)
  }
})()
