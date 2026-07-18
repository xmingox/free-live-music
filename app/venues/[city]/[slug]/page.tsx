export const revalidate = 21600

import { createClient } from '@supabase/supabase-js'
import { getUsToday } from '@/lib/timezone'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { Venue, Concert } from '@/types'
import { getCityCodeFromSlug, getMetroByCode, cityCodeToSlug, cityToSlug } from '@/lib/city-slugs'
import { VENUE_TYPE_CONFIGS } from '../type-hub-page'
import { venueConfidence, CONFIDENCE_CONFIG } from '@/lib/venue-confidence'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'
import { bookingSearchUrl } from '@/lib/affiliate'
import { buildMusicVenueJsonLd } from '@/lib/jsonld'

export async function generateStaticParams() { return [] }

const venueTypeLabels: Record<string, string> = {
  park: 'Park',
  amphitheater: 'Amphitheater',
  plaza: 'Plaza',
  bar: 'Bar',
  restaurant: 'Restaurant',
  brewery: 'Brewery',
  mall: 'Mall',
  farmers_market: "Farmers' Market",
  church: 'Church',
  library: 'Library',
  school: 'School / University',
  museum: 'Museum',
  community_center: 'Community Center',
  rooftop: 'Rooftop',
  other: 'Venue',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function isValidUrl(url: string): boolean {
  try { new URL(url); return true } catch { return false }
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string; slug: string }> }
): Promise<Metadata> {
  const { city: citySlug, slug } = await params
  const metroCode = getCityCodeFromSlug(citySlug)
  if (!metroCode) return { title: 'Venue Not Found' }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('venues')
    .select('id, name, neighborhood, city, music_schedule, music_score')
    .eq('slug', slug)
    .single()
  if (!data) return { title: 'Venue Not Found' }

  const metro = getMetroByCode(metroCode)
  const canonicalUrl = `https://www.freelivemusic.co/venues/${citySlug}/${slug}`

  const today = getUsToday()
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [{ count: upcomingCount }, { data: lastShow }] = await Promise.all([
    supabase
      .from('concerts')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', data.id)
      .gte('date', today)
      .eq('is_verified', true),
    supabase
      .from('concerts')
      .select('date')
      .eq('venue_id', data.id)
      .eq('is_verified', true)
      .lt('date', today)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const lastShowDate = lastShow?.date ?? null
  const noindex = (
    upcomingCount === 0 &&
    (!lastShowDate || lastShowDate < sixtyDaysAgo) &&
    !data.music_schedule
  ) || (data.music_score ?? 0) < -20

  return {
    title: `${data.name} — Free Live Music Venue in ${metro?.city ?? data.city} | Free Live Music`,
    description: `Find free live music concerts at ${data.name}${data.neighborhood ? ` in ${data.neighborhood}` : ''}, ${metro?.city ?? data.city}. See upcoming shows and recurring music events.`,
    alternates: { canonical: canonicalUrl },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: `${data.name} — Free Live Music in ${metro?.city ?? data.city}`,
      description: `Upcoming free shows at ${data.name}.`,
      url: canonicalUrl,
      siteName: 'Free Live Music',
      type: 'website',
    },
  }
}

export default async function VenuePage(
  { params }: { params: Promise<{ city: string; slug: string }> }
) {
  const { city: citySlug, slug } = await params
  const metroCode = getCityCodeFromSlug(citySlug)
  if (!metroCode) notFound()
  const metro = getMetroByCode(metroCode!)
  if (!metro) notFound()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: venue } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!venue) notFound()

  // Nearby venues — same neighborhood first, fall back to same venue_type
  const { data: nearbyRaw } = await supabase
    .from('venues')
    .select('id, slug, name, venue_type, neighborhood')
    .eq('city', metroCode!)
    .eq('neighborhood', venue.neighborhood ?? '')
    .neq('id', venue.id)
    .limit(6)

  const nearby = (nearbyRaw && nearbyRaw.length >= 2)
    ? nearbyRaw
    : await supabase
        .from('venues')
        .select('id, slug, name, venue_type, neighborhood')
        .eq('city', metroCode!)
        .eq('venue_type', venue.venue_type ?? 'other')
        .neq('id', venue.id)
        .limit(6)
        .then(r => r.data ?? [])

  const today = getUsToday()
  const [{ data: concerts }, { data: pastConcerts }] = await Promise.all([
    supabase
      .from('concerts')
      .select('id, slug, artist_name, venue, neighborhood, date, time, genre, admission_type, source_url')
      .eq('venue_id', venue.id)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(50),
    supabase
      .from('concerts')
      .select('id, slug, artist_name, date')
      .eq('venue_id', venue.id)
      .eq('is_verified', true)
      .lt('date', today)
      .order('date', { ascending: false })
      .limit(10),
  ])

  const v = venue as Venue
  const shows = (concerts ?? []) as Pick<Concert, 'id' | 'slug' | 'artist_name' | 'venue' | 'neighborhood' | 'date' | 'time' | 'genre' | 'admission_type' | 'source_url'>[]
  const typeLabel = venueTypeLabels[v.venue_type ?? 'other'] ?? 'Venue'
  const canonicalUrl = `https://www.freelivemusic.co/venues/${citySlug}/${slug}`
  const typeHubConfig = VENUE_TYPE_CONFIGS.find(c => c.type === v.venue_type)
  const confidence = venueConfidence({ upcoming_show_count: shows.length, music_score: v.music_score })
  const confConfig = CONFIDENCE_CONFIG[confidence]

  const localBusinessJsonLd = buildMusicVenueJsonLd({
    name: v.name,
    url: v.website ?? canonicalUrl,
    address: v.address ? {
      streetAddress: v.address,
      addressLocality: metro.city,
      addressRegion: metro.state ?? '',
    } : undefined,
    geo: (v.lat && v.lng) ? { latitude: v.lat, longitude: v.lng } : undefined,
    events: shows.slice(0, 10).map((c) => ({
      name: c.artist_name,
      startDate: c.time ? `${c.date}T${c.time}` : c.date,
      location: {
        name: v.name,
        address: v.address ? {
          streetAddress: v.address,
          addressLocality: metro.city,
          addressRegion: metro.state ?? '',
        } : undefined,
      },
      offers: { price: '0' as const, priceCurrency: 'USD', availability: 'https://schema.org/InStock' as const },
      url: `https://www.freelivemusic.co/concert/${c.slug}`,
    })),
  })

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />

      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <SiteNav
            venuesHref={`/venues/${citySlug}`}
            breadcrumbs={[
              { label: 'Free Live Music', href: '/' },
              { label: metro.city, href: `/?city=${metroCode}` },
              { label: 'Venues', href: `/venues/${citySlug}` },
              { label: v.name },
            ]}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Badges */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
            {typeLabel}
          </span>
          {v.indoor_outdoor && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/50 capitalize">
              {v.indoor_outdoor}
            </span>
          )}
          {v.is_partner && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Partner Venue
            </span>
          )}
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${confConfig.badgeColor}`}
            title={confConfig.detail}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${confConfig.dotColor} ${confidence === 'verified' ? 'animate-pulse' : ''}`} />
            {confConfig.label}
          </span>
        </div>

        {/* Name */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
          {v.name}
        </h1>

        {/* Location */}
        <p className="text-slate-400 text-base mb-6">
          {v.neighborhood ? (
            <>
              <Link
                href={`/venues/${citySlug}/neighborhood/${cityToSlug(v.neighborhood)}`}
                className="hover:text-violet-300 transition-colors"
              >
                {v.neighborhood}
              </Link>
              {', '}
            </>
          ) : null}
          {metro.city}, {metro.state}
        </p>

        {/* Static map thumbnail */}
        {v.lat && v.lng && process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl overflow-hidden mb-6 border border-slate-700/60 hover:border-slate-500 transition-colors"
          >
            <img
              src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+f43f5e(${v.lng},${v.lat})/${v.lng},${v.lat},14,0/800x240@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
              alt={`Map showing location of ${v.name}`}
              width={800}
              height={240}
              loading="lazy"
              className="w-full h-40 object-cover"
            />
          </a>
        )}

        {/* Info card */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 flex flex-col gap-4 mb-8">
          {v.address && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <span className="text-slate-300 text-sm">{v.address}</span>
            </div>
          )}

          {v.music_schedule && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
              </svg>
              <span className="text-slate-300 text-sm">
                {confidence === 'unverified' && (
                  <span className="text-slate-500 text-xs block mb-0.5">Per their Google listing:</span>
                )}
                {v.music_schedule}
              </span>
            </div>
          )}

          {v.website && isValidUrl(v.website) && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253" />
              </svg>
              <a href={v.website} target="_blank" rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300 text-sm transition-colors">
                {v.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          {v.description && (
            <p className="text-slate-400 text-sm leading-relaxed pt-2 border-t border-slate-700/60">
              {v.description}
            </p>
          )}
        </div>

        {/* Upcoming shows — suppressed for unverified venues with no data */}
        {(shows.length > 0 || confidence !== 'unverified' || v.music_schedule) && (
          <section>
            {(shows.length > 0 || confidence !== 'unverified') && (
              <h2 className="text-xl font-bold text-white mb-4">
                {shows.length > 0
                  ? `${shows.length} Upcoming Free Show${shows.length !== 1 ? 's' : ''}`
                  : 'Upcoming Shows'}
              </h2>
            )}

            {shows.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6 text-center">
                {confidence === 'unverified' ? (
                  <>
                    {v.music_schedule && (
                      <p className="text-slate-400 text-sm mb-3">
                        <span className="text-slate-500 text-xs block mb-1">Per their Google listing:</span>
                        {v.music_schedule}
                      </p>
                    )}
                    {v.website && isValidUrl(v.website) ? (
                      <a href={v.website} target="_blank" rel="noopener noreferrer"
                        className="inline-block text-xs text-violet-400 hover:text-violet-300 transition-colors">
                        Visit {v.name}&apos;s website for their current schedule →
                      </a>
                    ) : (
                      <p className="text-slate-600 text-xs">Check their website or call ahead to confirm music events.</p>
                    )}
                  </>
                ) : v.music_schedule ? (
                  <>
                    <p className="text-slate-400 text-sm">
                      No shows on the calendar yet — but {v.name} hosts live music{' '}
                      <span className="text-slate-300">{v.music_schedule.toLowerCase()}</span>.
                    </p>
                    {v.website && isValidUrl(v.website) && (
                      <a href={v.website} target="_blank" rel="noopener noreferrer"
                        className="mt-3 inline-block text-xs text-violet-400 hover:text-violet-300 transition-colors">
                        Check their site for the latest lineup →
                      </a>
                    )}
                  </>
                ) : v.website && isValidUrl(v.website) ? (
                  <>
                    <p className="text-slate-500 text-sm">No upcoming shows confirmed yet.</p>
                    <a href={v.website} target="_blank" rel="noopener noreferrer"
                      className="mt-3 inline-block text-xs text-violet-400 hover:text-violet-300 transition-colors">
                      Visit {v.name}&apos;s website for updates →
                    </a>
                  </>
                ) : (
                  <>
                    <p className="text-slate-500 text-sm">No upcoming shows listed for this venue.</p>
                    <p className="text-slate-600 text-xs mt-1">Check back soon — we update regularly.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {shows.map((show) => (
                  <Link
                    key={show.id}
                    href={`/concert/${show.slug}`}
                    className="flex items-start justify-between gap-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl px-4 py-3 transition-all duration-150 group"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm group-hover:text-violet-300 transition-colors truncate">
                        {show.artist_name}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {show.admission_type === 'Free RSVP' ? 'Free RSVP' : 'Free admission'}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 mt-0.5 text-right">
                      {formatDate(show.date)}
                      {show.time && <><br /><span className="text-slate-500">{show.time}</span></>}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Past shows */}
        {pastConcerts && pastConcerts.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-white mb-3">Past Shows</h2>
            <div className="flex flex-col gap-1.5">
              {pastConcerts.map((show) => (
                <div key={show.id} className="flex items-center justify-between px-4 py-2.5 bg-slate-800/30 border border-slate-700/30 rounded-lg">
                  <span className="text-slate-300 text-sm truncate">{show.artist_name}</span>
                  <span className="text-slate-500 text-xs shrink-0 ml-4">
                    {new Date(show.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hotel affiliate */}
        {(() => {
          const hotelDate = shows.length > 0
            ? shows[0].date
            : new Date(Date.now() + 86400000).toISOString().split('T')[0]
          const hotelUrl = bookingSearchUrl(metro.city, metro.state ?? '', hotelDate)
          return (
            <a
              href={hotelUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center justify-between w-full bg-slate-900 border border-slate-700/50 hover:border-slate-600 rounded-xl px-4 py-3 mt-8 mb-2 transition-colors group"
            >
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                Visiting {metro.city}? Find hotels near this venue
              </span>
              <span className="text-xs text-slate-500 group-hover:text-violet-400 transition-colors shrink-0 ml-2">
                Hotels ↗
              </span>
            </a>
          )
        })()}

        {/* Elevated Claim CTA for unverified venues */}
        {confidence === 'unverified' && (
          <div className="mt-8 bg-violet-500/10 border border-violet-500/30 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-slate-300 text-sm font-medium">Own or manage this venue?</p>
              <p className="text-slate-500 text-xs mt-0.5">
                Claim your listing to add your music schedule and get verified — free forever.
              </p>
            </div>
            <Link
              href={`/venues/claim?slug=${slug}`}
              className="shrink-0 px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-semibold rounded-lg transition-all"
            >
              Claim Listing
            </Link>
          </div>
        )}

        {/* Nearby venues */}
        {nearby.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-white mb-4">
              Other Free Music Spots in {v.neighborhood ?? metro.city}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nearby.map((nv) => (
                <Link
                  key={nv.id}
                  href={`/venues/${citySlug}/${nv.slug}`}
                  className="flex flex-col bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl px-4 py-3 transition-all duration-150 group"
                >
                  <p className="font-semibold text-white text-sm group-hover:text-violet-300 transition-colors truncate">
                    {nv.name}
                  </p>
                  {nv.neighborhood && (
                    <p className="text-slate-500 text-xs mt-0.5">{nv.neighborhood}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Hub links — type + neighborhood discovery */}
        {(typeHubConfig || v.neighborhood) && (
          <div className="mt-8 flex flex-wrap gap-3">
            {typeHubConfig && (
              <Link
                href={`/venues/${citySlug}/${typeHubConfig.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:border-violet-500/50 hover:text-violet-300 transition-colors"
              >
                Browse all {typeHubConfig.label.toLowerCase()} in {metro.city} →
              </Link>
            )}
            {v.neighborhood && (
              <Link
                href={`/venues/${citySlug}/neighborhood/${cityToSlug(v.neighborhood)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:border-violet-500/50 hover:text-violet-300 transition-colors"
              >
                Free music in {v.neighborhood} →
              </Link>
            )}
          </div>
        )}

        {/* Claim CTA */}
        <div className="mt-12 bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-sm mb-1 font-medium">Are you this venue?</p>
          <p className="text-slate-500 text-xs mb-4">
            Claim your listing to add your schedule, description, and contact info — free forever.
          </p>
          <Link
            href={`/venues/claim?slug=${slug}`}
            className="inline-block px-5 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-sm font-semibold rounded-lg transition-all"
          >
            Claim This Venue
          </Link>
        </div>

        <div className="mt-6">
          <Link href={`/venues/${citySlug}`} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            ← All {metro.city} venues
          </Link>
        </div>
      </main>

      <SiteFooter cityLine={`${v.name} · Free live music in ${metro.city}`} />
    </div>
  )
}
