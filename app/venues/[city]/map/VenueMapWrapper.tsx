'use client'

import dynamic from 'next/dynamic'
import { Venue } from '@/types'

const VenueMapClient = dynamic(() => import('./VenueMapClient'), { ssr: false })

type MapVenue = Pick<Venue, 'id' | 'slug' | 'name' | 'venue_type' | 'neighborhood' | 'lat' | 'lng'>

export default function VenueMapWrapper({ venues, citySlug }: { venues: MapVenue[]; citySlug: string }) {
  return <VenueMapClient venues={venues} citySlug={citySlug} />
}
