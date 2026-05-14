export const revalidate = 86400

import { Metadata } from 'next'
import { getAllMetros, cityCodeToSlug } from '@/lib/city-slugs'
import TypeHubPage, { VENUE_TYPE_CONFIGS, generateTypeHubMetadata } from '../type-hub-page'

const config = VENUE_TYPE_CONFIGS.find(c => c.slug === 'restaurants')!

export function generateStaticParams() {
  return getAllMetros().map(metro => ({ city: cityCodeToSlug[metro.code] }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> }
): Promise<Metadata> {
  const { city } = await params
  return generateTypeHubMetadata(city, config)
}

export default async function RestaurantsPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params
  return <TypeHubPage citySlug={city} config={config} />
}
