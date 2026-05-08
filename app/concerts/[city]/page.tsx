import { Metadata } from 'next'
import Link from 'next/link'
import { Concert } from '@/types'
import ConcertCard from '@/components/ConcertCard'
import { createClient } from '@supabase/supabase-js'
import { MOCK_CONCERTS } from '@/lib/mock-data'
import {
  getCityCodeFromSlug,
  getMetroByCode,
  getAllCityCodes,
  cityCodeToSlug,
  cityToSlug,
  getAliasCityFromSlug,
} from '@/lib/city-slugs'

export const revalidate = 3600 // Revalidate every hour

// Generate static params for all cities
export async function generateStaticParams() {
  return getAllCityCodes()
    .map((code) => cityCodeToSlug[code])
    .filter(Boolean)
    .map((slug) => ({ city: slug }))
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>
}): Promise<Metadata> {
  const { city } = await params
  const cityCode = getCityCodeFromSlug(city)
  if (!cityCode) {
    return { title: 'City Not Found' }
  }

  const metro = getMetroByCode(cityCode)
  if (!metro) {
    return { title: 'City Not Found' }
  }

  const title = `Free Live Music & Concerts in ${metro.city}, ${metro.state}`
  const description = `Discover free live music events and concerts in ${metro.city}. Find upcoming shows, venues, and performers. Updated daily.`

  return {
    title,
    description,
    keywords: [
      `free concerts ${metro.city}`,
      `free live music ${metro.city}`,
      `free shows ${metro.city}`,
      `live music ${metro.city}`,
      `concerts near me`,
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://www.freelivemusic.co/concerts/${city}`,
      siteName: 'Free Live Music',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://www.freelivemusic.co/concerts/${city}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

async function getConcertsByCity(metro: ReturnType<typeof getMetroByCode>): Promise<Concert[]> {
  if (!metro) return []
  const cityNames = [metro.city, ...(metro.aliases || [])]

  // Return mock data if no Supabase env vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return MOCK_CONCERTS.filter(c => c.city === metro.code)
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('concerts')
      .select('*')
      .in('city', cityNames)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(200)

    if (error || !data?.length) {
      return MOCK_CONCERTS.filter(c => c.city === metro.code)
    }
    return data as Concert[]
  } catch (error) {
    console.error(`Error fetching concerts for ${metro.city}:`, error)
    return MOCK_CONCERTS.filter(c => c.city === metro.code)
  }
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city: cityParam } = await params
  const citySlug = cityParam.toLowerCase()
  const cityCode = getCityCodeFromSlug(citySlug)

  // Handle invalid city
  if (!cityCode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-slate-900">City Not Found</h1>
            <p className="text-lg text-slate-600 mb-8">
              We don't have listings for that city yet. Try one of these:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {getAllCityCodes().map((code) => {
                const metro = getMetroByCode(code)
                const slug = cityCodeToSlug[code]
                if (!metro || !slug) return null

                return (
                  <Link
                    key={code}
                    href={`/concerts/${slug}`}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                  >
                    {metro.city}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const metro = getMetroByCode(cityCode)
  if (!metro) {
    return <div className="text-center py-20">City data not found</div>
  }

  const concerts = await getConcertsByCity(metro)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Free Live Music in {metro.city}
          </h1>
          <p className="text-xl text-slate-600 mb-2">
            {concerts.length} upcoming concerts and live music events
          </p>
          <p className="text-slate-500">
            Discover free performances across {metro.city}. Venues and dates updated daily.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {concerts && concerts.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {concerts.map((concert) => (
                <ConcertCard key={concert.id} concert={concert} />
              ))}
            </div>

            {concerts.length >= 50 && (
              <div className="text-center py-8 border-t border-slate-200">
                <p className="text-slate-600 mb-4">
                  Showing {concerts.length} events. More coming soon!
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-lg">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">No Concerts Found</h2>
            <p className="text-slate-600 mb-6">
              There are no upcoming free concerts scheduled right now. Check back soon!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Back to Home
            </Link>
          </div>
        )}
      </main>

      {/* Local SEO Content Section */}
      <section className="bg-slate-50 border-t border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Free Live Music in {metro.city}
              </h2>
              <p className="text-slate-700 mb-4">
                Looking for free live music and concerts in {metro.city}, {metro.state}?
                You've found the right place. We curate verified events from parks, outdoor venues,
                festivals, and cultural institutions throughout the city.
              </p>
              <p className="text-slate-600 mb-4">
                All events on this page are completely free to attend. No cover charges, no ticket fees—just great live music.
              </p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-center">
                  <span className="mr-3 text-blue-600">✓</span>
                  Outdoor parks and amphitheaters
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-600">✓</span>
                  Beach and waterfront concerts
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-600">✓</span>
                  Community festivals and street fairs
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-600">✓</span>
                  Museum and cultural center performances
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Use This Site?</h2>
              <ul className="space-y-4">
                <li>
                  <h3 className="font-semibold text-slate-900 mb-1">✓ Always Free</h3>
                  <p className="text-slate-600 text-sm">
                    Every event on this site is completely free to attend. No cover charges, no surprise fees.
                  </p>
                </li>
                <li>
                  <h3 className="font-semibold text-slate-900 mb-1">✓ Hand-Verified</h3>
                  <p className="text-slate-600 text-sm">
                    Every event is verified by our team to ensure accuracy and current information.
                  </p>
                </li>
                <li>
                  <h3 className="font-semibold text-slate-900 mb-1">✓ Constantly Updated</h3>
                  <p className="text-slate-600 text-sm">
                    New events are added daily so you'll always find the latest free concerts in {metro.city}.
                  </p>
                </li>
                <li>
                  <h3 className="font-semibold text-slate-900 mb-1">✓ Easy to Filter</h3>
                  <p className="text-slate-600 text-sm">
                    Filter by date, genre, and type to find exactly what you're looking for.
                  </p>
                </li>
              </ul>
            </div>
          </div>

          {/* Other Cities Links for SEO */}
          <div className="mt-12 pt-8 border-t border-slate-300">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Free Music in Other Cities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {getAllCityCodes()
                .filter(code => code !== cityCode)
                .slice(0, 12)
                .map((code) => {
                  const m = getMetroByCode(code)
                  const slug = cityCodeToSlug[code]
                  if (!m || !slug) return null

                  return (
                    <Link
                      key={code}
                      href={`/concerts/${slug}`}
                      className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
                    >
                      {m.city}
                    </Link>
                  )
                })}
            </div>
          </div>

          {metro.aliases && metro.aliases.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-300">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Browse by City in the {metro.city} Area</h3>
              <div className="flex flex-wrap gap-3">
                {metro.aliases.map((alias) => (
                  <Link
                    key={alias}
                    href={`/concerts/city/${cityToSlug(alias)}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
                  >
                    {alias}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
