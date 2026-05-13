/**
 * JSON-LD smoke test — validates that all builders produce Google-required fields.
 *
 * Google's rich result requirements:
 *   MusicEvent : name, startDate, location (name or address), offers
 *   MusicVenue : name
 *   BreadcrumbList : itemListElement with position + name
 *   ItemList : itemListElement with position
 *   FAQPage : mainEntity with name + acceptedAnswer.text
 *   MusicGroup : name
 *
 * Run with: npx tsx scripts/validate-jsonld.ts
 * Exit code 0 = all pass, 1 = failure.
 */

import type { MusicGroupLeaf, MusicVenueLeaf } from 'schema-dts'
import type { WithContext } from 'schema-dts'
import {
  buildMusicEventJsonLd,
  buildBreadcrumbJsonLd,
  buildMusicVenueJsonLd,
  buildMusicGroupJsonLd,
  buildItemListJsonLd,
  buildFaqPageJsonLd,
} from '../lib/jsonld'

let failures = 0

function assert(label: string, cond: boolean) {
  if (!cond) {
    console.error(`  FAIL  ${label}`)
    failures++
  } else {
    console.log(`  pass  ${label}`)
  }
}

// ── MusicEvent ────────────────────────────────────────────────────────────────
console.log('\nMusicEvent')
const event = buildMusicEventJsonLd({
  name: 'The Shins',
  description: 'Free show at Lincoln Center',
  url: 'https://www.freelivemusic.co/concert/the-shins-nyc-2026-07-04',
  image: 'https://example.com/img.jpg',
  startDate: '2026-07-04T19:00:00',
  endDate: '2026-07-04T21:00:00',
  performer: 'The Shins',
  venueName: 'Damrosch Park',
  venueCity: 'New York',
  venueState: 'NY',
  offer: { validFrom: '2026-01-01', url: 'https://lincolncenter.org' },
  organizer: { name: 'Lincoln Center', url: 'https://lincolncenter.org' },
})
assert('@context', event['@context'] === 'https://schema.org')
assert('@type', event['@type'] === 'MusicEvent')
assert('name', typeof event.name === 'string' && event.name.length > 0)
assert('startDate', typeof event.startDate === 'string')
assert('location present', event.location !== undefined)
assert('offers present', event.offers !== undefined)
assert('performer present', event.performer !== undefined)

// ── BreadcrumbList ────────────────────────────────────────────────────────────
console.log('\nBreadcrumbList')
const breadcrumb = buildBreadcrumbJsonLd([
  { name: 'Home', item: 'https://www.freelivemusic.co' },
  { name: 'Free Concerts in New York', item: 'https://www.freelivemusic.co/concerts/new-york' },
  { name: 'The Shins' },
])
assert('@type', breadcrumb['@type'] === 'BreadcrumbList')
const items = breadcrumb.itemListElement as any[]
assert('3 items', items.length === 3)
assert('position 1', items[0].position === 1)
assert('position 3', items[2].position === 3)
assert('last item no url', items[2].item === undefined)
assert('first item has url', items[0].item === 'https://www.freelivemusic.co')

// ── MusicVenue ────────────────────────────────────────────────────────────────
console.log('\nMusicVenue')
const venue: WithContext<MusicVenueLeaf> = buildMusicVenueJsonLd({
  name: 'Damrosch Park',
  url: 'https://www.freelivemusic.co/venues/new-york/damrosch-park',
  address: { streetAddress: '62nd St', addressLocality: 'New York', addressRegion: 'NY' },
  geo: { latitude: 40.7731, longitude: -73.9836 },
  events: [
    {
      name: 'The Shins',
      startDate: '2026-07-04T19:00:00',
      location: { name: 'Damrosch Park', address: { addressLocality: 'New York', addressRegion: 'NY' } },
      offers: { price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
      url: 'https://www.freelivemusic.co/concert/the-shins-damrosch-park-2026-07-04',
    },
  ],
})
assert('@type', venue['@type'] === 'MusicVenue')
assert('name', typeof venue.name === 'string')
assert('address present', venue.address !== undefined)
assert('geo present', venue.geo !== undefined)
const venueEvents = venue.event as any[]
assert('1 event', venueEvents.length === 1)
assert('event type', venueEvents[0]['@type'] === 'MusicEvent')

// ── MusicGroup ────────────────────────────────────────────────────────────────
console.log('\nMusicGroup')
const group: WithContext<MusicGroupLeaf> = buildMusicGroupJsonLd({
  name: 'The Shins',
  url: 'https://www.freelivemusic.co/artist/the-shins',
  events: [
    {
      name: 'The Shins',
      startDate: '2026-07-04',
      location: { name: 'Damrosch Park', address: { addressLocality: 'New York', addressRegion: 'NY' } },
      offers: { price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
      url: 'https://www.freelivemusic.co/concert/the-shins-damrosch-park-2026-07-04',
    },
  ],
})
assert('@type', group['@type'] === 'MusicGroup')
assert('name', typeof group.name === 'string')
assert('event array', Array.isArray(group.event))

// ── ItemList (MusicEvent items) ───────────────────────────────────────────────
console.log('\nItemList — MusicEvent items')
const eventList = buildItemListJsonLd({
  name: 'Free Live Music in New York',
  description: 'Upcoming free concerts in New York, NY',
  url: 'https://www.freelivemusic.co/concerts/new-york',
  numberOfItems: 1,
  items: [
    {
      type: 'MusicEvent',
      position: 1,
      event: {
        name: 'The Shins',
        startDate: '2026-07-04T18:00:00',
        location: { name: 'Damrosch Park', address: 'New York, NY' },
        offers: { price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
      },
    },
  ],
})
assert('@type', eventList['@type'] === 'ItemList')
const listItems = eventList.itemListElement as any[]
assert('1 item', listItems.length === 1)
assert('position 1', listItems[0].position === 1)
assert('inner type MusicEvent', listItems[0].item['@type'] === 'MusicEvent')

// ── ItemList (City items — state hub) ─────────────────────────────────────────
console.log('\nItemList — City items')
const cityList = buildItemListJsonLd({
  name: 'Free Live Music in California',
  numberOfItems: 2,
  items: [
    { type: 'City', position: 1, name: 'Los Angeles', url: 'https://www.freelivemusic.co/concerts/los-angeles' },
    { type: 'City', position: 2, name: 'San Francisco', url: 'https://www.freelivemusic.co/concerts/san-francisco' },
  ],
})
const cityItems = cityList.itemListElement as any[]
assert('2 city items', cityItems.length === 2)
assert('city type', cityItems[0].item['@type'] === 'City')
assert('city url', cityItems[0].item.url.includes('los-angeles'))

// ── FAQPage ───────────────────────────────────────────────────────────────────
console.log('\nFAQPage')
const faq = buildFaqPageJsonLd([
  { question: 'Are the concerts really free?', answer: 'Yes, all listings are free to attend.' },
  { question: 'Do I need tickets?', answer: 'No ticket required.' },
])
assert('@type', faq['@type'] === 'FAQPage')
const entities = faq.mainEntity as any[]
assert('2 questions', entities.length === 2)
assert('question type', entities[0]['@type'] === 'Question')
assert('answer type', entities[0].acceptedAnswer['@type'] === 'Answer')
assert('answer text', typeof entities[0].acceptedAnswer.text === 'string')

// ── Result ────────────────────────────────────────────────────────────────────
console.log(`\n${failures === 0 ? '✓ All JSON-LD checks passed' : `✗ ${failures} check(s) failed`}\n`)
process.exit(failures > 0 ? 1 : 0)
