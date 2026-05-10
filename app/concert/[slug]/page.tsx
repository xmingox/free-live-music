import { notFound, permanentRedirect } from 'next/navigation'
import { Concert } from '@/types'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { cityCodeToSlug, getMetroByCode } from '@/lib/city-slugs'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'
import { outboundUrl, bookingSearchUrl } from '@/lib/affiliate'

const TrackView = dynamic(() => import('@/components/TrackView'), { ssr: false })

// Use fetch() with next: { revalidate } so Next.js treats this route as ISR.
// The Supabase JS client uses its own internal fetch that Next.js can't track,
// making the page permanently dynamic (private, no-cache). Direct REST calls fix this.
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SB_HEADERS = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  Accept: 'application/json',
}

async function sbGet<T>(path: string, revalidate = 3600): Promise<T[]> {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: SB_HEADERS,
    next: { revalidate },
  })
  if (!res.ok) return []
  return res.json()
}

async function getConcertBySlug(slug: string): Promise<Concert | null> {
  const rows = await sbGet<Concert>(`concerts?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`)
  return rows[0] ?? null
}

async function getVenueSlug(venueId: string): Promise<string | null> {
  const rows = await sbGet<{ slug: string }>(`venues?id=eq.${encodeURIComponent(venueId)}&select=slug&limit=1`)
  return rows[0]?.slug ?? null
}

async function getRelatedConcerts(city: string, excludeId: string, today: string) {
  return sbGet<{ slug: string; artist_name: string; venue: string; neighborhood: string; date: string; time: string | null }>(
    `concerts?city=eq.${encodeURIComponent(city)}&id=neq.${encodeURIComponent(excludeId)}&date=gte.${today}&select=slug,artist_name,venue,neighborhood,date,time&order=date.asc&limit=5`
  )
}

async function getVenueConcerts(venue: string, excludeId: string, today: string) {
  return sbGet<{ slug: string; artist_name: string; venue: string; date: string }>(
    `concerts?venue=eq.${encodeURIComponent(venue)}&id=neq.${encodeURIComponent(excludeId)}&date=gte.${today}&select=slug,artist_name,venue,date&order=date.asc&limit=4`
  )
}

async function getNeighborhoodConcerts(city: string, neighborhood: string, excludeId: string, today: string) {
  return sbGet<{ slug: string; artist_name: string; venue: string; neighborhood: string; date: string }>(
    `concerts?city=eq.${encodeURIComponent(city)}&neighborhood=eq.${encodeURIComponent(neighborhood)}&id=neq.${encodeURIComponent(excludeId)}&date=gte.${today}&select=slug,artist_name,venue,neighborhood,date&order=date.asc&limit=4`
  )
}

function parseTimeToIso(time: string): string {
  const m = time.match(/^(\d+):(\d+)\s*(am|pm)$/i)
  if (!m) return '00:00:00'
  let h = parseInt(m[1])
  const min = m[2]
  const period = m[3].toLowerCase()
  if (period === 'pm' && h !== 12) h += 12
  if (period === 'am' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${min}:00`
}

function parseEndTimeIso(time: string): string {
  const m = time.match(/^(\d+):(\d+)\s*(am|pm)$/i)
  if (!m) return '22:00:00'
  let h = parseInt(m[1])
  const min = m[2]
  const period = m[3].toLowerCase()
  if (period === 'pm' && h !== 12) h += 12
  if (period === 'am' && h === 12) h = 0
  h = (h + 2) % 24
  return `${String(h).padStart(2, '0')}:${min}:00`
}

function isValidUrl(url: string): boolean {
  try { new URL(url); return true } catch { return false }
}

export const revalidate = 3600
// Empty array = pre-build nothing, but enable on-demand ISR for all slugs.
// Without this, Next.js 15 marks the route ƒ (fully dynamic) and emits
// private/no-cache headers regardless of fetch revalidate settings.
export async function generateStaticParams() { return [] }

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTime(time: string): string {
  if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
    return time
  }
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')}${ampm}`
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const concert = await getConcertBySlug(slug)
  if (!concert) return { title: 'Concert Not Found' }

  const city = getMetroByCode(concert.city)?.city ?? concert.city
  const canonicalUrl = `https://www.freelivemusic.co/concert/${slug}`
  const normalMetadata = {
    title: `${concert.artist_name} — Free Concert in ${city} | Free Live Music`,
    description: `${concert.artist_name} performs free at ${concert.venue} in ${concert.neighborhood}, ${city} on ${formatDate(concert.date)}. Free admission.`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${concert.artist_name} — Free Concert in ${city}`,
      description: `Free show at ${concert.venue} on ${formatDate(concert.date)}`,
      url: canonicalUrl,
      siteName: 'Free Live Music',
      type: 'website',
    },
  }

  // Add noindex for recently-past concerts (within the last 7 days):
  // people may still search for them, but we don't want them permanently indexed.
  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  if (concert.date < today && concert.date >= sevenDaysAgo) {
    return { ...normalMetadata, robots: { index: false, follow: false } }
  }

  return normalMetadata
}

export default async function ConcertPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const concert = await getConcertBySlug(slug)
  if (!concert) notFound()

  const today = new Date().toISOString().split('T')[0]

  // Redirect past concerts (8+ days old) to venue or city page so Google
  // processes the 308 and removes the stale URL from its index.
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  if (concert.date <= eightDaysAgo) {
    const citySlug = cityCodeToSlug[concert.city]
    if (concert.venue_id) {
      const venueSlugForRedirect = await getVenueSlug(concert.venue_id)
      if (venueSlugForRedirect && citySlug) {
        permanentRedirect(`/venues/${citySlug}/${venueSlugForRedirect}`)
      }
    }
    // Fallback: redirect to city concerts page
    permanentRedirect(`/concerts/${citySlug ?? 'new-york'}`)
  }

  const [venueSlug, related, venueConcerts, neighborhoodConcerts] = await Promise.all([
    concert.venue_id ? getVenueSlug(concert.venue_id) : Promise.resolve(null),
    getRelatedConcerts(concert.city, concert.id, today),
    concert.venue ? getVenueConcerts(concert.venue, concert.id, today) : Promise.resolve([]),
    concert.neighborhood ? getNeighborhoodConcerts(concert.city, concert.neighborhood, concert.id, today) : Promise.resolve([]),
  ])

  const city = getMetroByCode(concert.city)?.city ?? concert.city
  const canonicalUrl = `https://www.freelivemusic.co/concert/${slug}`

  const offerUrl = concert.source_url && isValidUrl(concert.source_url) ? concert.source_url : canonicalUrl
  const ogImageUrl = `https://www.freelivemusic.co/concert/${slug}/opengraph-image`
  const eventDescription = `${concert.artist_name} performs free at ${concert.venue} in ${concert.neighborhood}, ${city} on ${formatDate(concert.date)}${concert.time ? ` at ${formatTime(concert.time)}` : ''}. ${concert.admission_type === 'Free RSVP' ? 'Free admission with RSVP — check the official listing to reserve your spot.' : 'Free admission — no tickets or cover charge needed, just show up and enjoy.'}`

  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: concert.artist_name,
    description: eventDescription,
    image: concert.image_url ?? ogImageUrl,
    startDate: concert.time ? `${concert.date}T${parseTimeToIso(concert.time)}` : concert.date,
    endDate: concert.time ? `${concert.date}T${parseEndTimeIso(concert.time)}` : concert.date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    performer: { '@type': 'MusicGroup', name: concert.artist_name },
    location: {
      '@type': 'Place',
      name: concert.venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
      },
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      validFrom: concert.created_at.split('T')[0],
      url: offerUrl,
    },
    organizer: {
      '@type': 'Organization',
      name: concert.source_name ?? 'Free Live Music',
      url: isValidUrl(concert.source_url ?? '') ? concert.source_url! : 'https://www.freelivemusic.co',
    },
  }

  // BreadcrumbList helps Google display breadcrumbs in search results
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Free Live Music',
        item: 'https://www.freelivemusic.co',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `Free Concerts in ${city}`,
        item: `https://www.freelivemusic.co/?city=${concert.city}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: concert.artist_name,
        item: canonicalUrl,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <SiteNav
            venuesHref={cityCodeToSlug[concert.city] ? `/venues/${cityCodeToSlug[concert.city]}` : '/venues/new-york'}
            breadcrumbs={[
              { label: 'Free Live Music', href: '/' },
              { label: city, href: `/?city=${concert.city}` },
              { label: concert.artist_name },
            ]}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <TrackView concertId={concert.id} />
        {/* City + Free badge */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-slate-400">{city}</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Free Admission
          </span>
          {concert.admission_type === 'Free RSVP' && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              RSVP Required
            </span>
          )}
        </div>

        {/* Artist name */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
          {concert.artist_name}
        </h1>

        {/* Description */}
        <p className="text-slate-300 text-base leading-relaxed mb-8">
          {concert.description
            ? concert.description
            : <>
                {concert.artist_name} performs free at {concert.venue} in {concert.neighborhood}, {city} on {formatDate(concert.date)}{concert.time ? ` at ${formatTime(concert.time)}` : ''}.{' '}
                {concert.admission_type === 'Free RSVP'
                  ? 'This event is free but requires an RSVP — check the official listing to reserve your spot.'
                  : 'No tickets or cover charge needed — just show up and enjoy.'}
              </>
          }
        </p>

        {/* Event image */}
        {concert.image_url && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-slate-700/60">
            <img
              src={concert.image_url}
              alt={`${concert.artist_name} event flyer`}
              className="w-full object-contain bg-slate-900"
            />
          </div>
        )}

        {/* Details card */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 flex flex-col gap-5 mb-8">
          {/* Date & Time */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-0.5">Date & Time</p>
              <p className="font-semibold text-white">{formatDate(concert.date)}</p>
              {concert.time && <p className="text-slate-300 text-sm">{formatTime(concert.time)}</p>}
            </div>
          </div>

          {/* Venue */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-0.5">Venue</p>
              {concert.venue && concert.venue !== 'TBD' && (
                venueSlug && cityCodeToSlug[concert.city] ? (
                  <Link
                    href={`/venues/${cityCodeToSlug[concert.city]}/${venueSlug}`}
                    className="font-semibold text-violet-300 hover:text-violet-200 transition-colors"
                  >
                    {concert.venue}
                  </Link>
                ) : (
                  <p className="font-semibold text-white">{concert.venue}</p>
                )
              )}
              <p className="text-slate-300 text-sm">{concert.neighborhood} · {city}</p>
              {venueSlug && cityCodeToSlug[concert.city] && (
                <Link
                  href={`/venues/${cityCodeToSlug[concert.city]}/${venueSlug}`}
                  className="text-xs text-slate-500 hover:text-violet-400 transition-colors mt-0.5 inline-block"
                >
                  More shows at this venue →
                </Link>
              )}
            </div>
          </div>

          {/* Genre */}
          {concert.genre && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-0.5">Genre</p>
                <p className="font-semibold text-white">{concert.genre}</p>
              </div>
            </div>
          )}

          {/* Source */}
          {concert.source_name && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-0.5">Source</p>
                {concert.source_url ? (
                  <a
                    href={outboundUrl(concert.source_url, 'concert-detail')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white hover:text-emerald-400 transition-colors"
                  >
                    via {concert.source_name}
                  </a>
                ) : (
                  <p className="font-semibold text-white">via {concert.source_name}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA */}
        <Link
          href="/"
          className="block w-full text-center bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-lg shadow-violet-900/30 mb-3"
        >
          ← Browse All Free Shows
        </Link>

        {/* Secondary: official listing */}
        {concert.source_url && (
          <a
            href={outboundUrl(concert.source_url, 'concert-detail')}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition-all duration-200 mb-6 text-sm"
          >
            View Official Listing ↗
          </a>
        )}

        {/* Hotel affiliate — shown only for destination metros */}
        {(() => {
          const metro = getMetroByCode(concert.city)
          if (!metro) return null
          const hotelUrl = bookingSearchUrl(metro.city, metro.state, concert.date)
          return (
            <a
              href={hotelUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center justify-between w-full bg-slate-900 border border-slate-700/50 hover:border-slate-600 rounded-xl px-4 py-3 mb-6 transition-colors group"
            >
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                Visiting {metro.city}? Find hotels near this show
              </span>
              <span className="text-xs text-slate-500 group-hover:text-violet-400 transition-colors shrink-0 ml-2">
                Hotels ↗
              </span>
            </a>
          )
        })()}

        {/* More free music section */}
        {(venueConcerts.length > 0 || neighborhoodConcerts.length > 0 || (related && related.length > 0)) && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-white mb-5">More free music</h2>

            {/* Row 1: More at this venue */}
            {venueConcerts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  More at {concert.venue}
                </h3>
                <div className="flex flex-col gap-2">
                  {venueConcerts.map((show) => (
                    <Link
                      key={show.slug}
                      href={`/concert/${show.slug}`}
                      className="flex items-start justify-between gap-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl px-4 py-3 transition-all duration-150 group"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm group-hover:text-violet-300 transition-colors truncate">
                          {show.artist_name}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0 mt-0.5">
                        {new Date(show.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Row 2: More in this neighborhood or city */}
            {neighborhoodConcerts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  More free music in {concert.neighborhood || city}
                </h3>
                <div className="flex flex-col gap-2">
                  {neighborhoodConcerts.map((show) => (
                    <Link
                      key={show.slug}
                      href={`/concert/${show.slug}`}
                      className="flex items-start justify-between gap-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl px-4 py-3 transition-all duration-150 group"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm group-hover:text-violet-300 transition-colors truncate">
                          {show.artist_name}
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5 truncate">
                          {show.venue}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0 mt-0.5">
                        {new Date(show.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback: city-wide related shows (when no venue or neighborhood matches) */}
            {venueConcerts.length === 0 && neighborhoodConcerts.length === 0 && related && related.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  More free shows in {city}
                </h3>
                <div className="flex flex-col gap-2">
                  {related.map((show) => (
                    <Link
                      key={show.slug}
                      href={`/concert/${show.slug}`}
                      className="flex items-start justify-between gap-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl px-4 py-3 transition-all duration-150 group"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm group-hover:text-violet-300 transition-colors truncate">
                          {show.artist_name}
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5 truncate">
                          {show.venue} · {show.neighborhood}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0 mt-0.5">
                        {new Date(show.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
      <SiteFooter cityLine={`Free live music in ${city} · No tickets needed`} />
    </div>
  )
}
