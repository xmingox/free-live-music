import { config } from 'dotenv'
config({ path: '.env.local' })
import { fetchNYCParks } from '../lib/importers/nyc-parks'

;(async () => {
  const rows = await fetchNYCParks()
  console.log('NYC Parks rows returned:', rows.length)
  if (rows.length) {
    console.log('First:', rows[0].date, '|', rows[0].artist_name)
    console.log('Last: ', rows[rows.length - 1].date, '|', rows[rows.length - 1].artist_name)
  }
})()
