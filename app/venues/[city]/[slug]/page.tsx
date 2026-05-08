export const revalidate = 3600

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { Venue, Concert } from '@/types'
import { getCityCodeFromSlug, getMetroByCode, cityCodeToSlug } from '@/lib/city-slugs'

export async function generateStaticParams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: venues } = await supabase
    .from('venues')
    .select('slug, city')

  return (venues ?? [])
    .filter(v => cityCodeToSlug[v.city])
    .map(v => ({ city: cityCodeToSlug[v.city], slug: v.slug }))
}

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
  const { data } = await supabase.from('venues').select('name, neighborhood, city').eq('slug', slug).single()
  if (!data) return { title: 'Venue Not Found' }

  const metro = getMetroByCode(metroCode)
  const canonicalUrl = `https://www.freelivemusic.co/venues/${citySlug}/${slug}`
  return {
    title: `${data.name} — Free Live Music Venue in ${metro?.city ?? data.city} | Free Live Music`,
    description: `Find free live music concerts at ${data.name}${data.neighborhood ? ` in ${data.neighborhood}` : ''}, ${metro?.city ?? data.city}. See upcoming shows and recurring music events.`,
    alternates: { canonical: canonicalUrl },
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

  const today = new Date().toISOString().split('T')[0]
  const { data: concerts } = await supabase
    .from('concerts')
    .select('id, slug, artist_name, venue, neighborhood, date, time, genre, admission_type, source_url')
    .eq('venue_id', venue.id)
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(50)

  const v = venue as Venue
  const shows = (concerts ?? []) as Pick<Concert, 'id' | 'slug' | 'artist_name' | 'venue' | 'neighborhood' | 'date' | 'time' | 'genre' | 'admission_type' | 'source_url'>[]
  const typeLabel = venueTypeLabels[v.venue_type ?? 'other'] ?? 'Venue'
  const canonicalUrl = `https://www.freelivemusic.co/venues/${citySlug}/${slug}`

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicVenue',
    name: v.name,
    address: v.address ? {
      '@type': 'PostalAddress',
      streetAddress: v.address,
      addressLocality: metro.city,
      addressRegion: metro.state,
    } : undefined,
    url: v.website ?? canonicalUrl,
    ...(v.lat && v.lng ? { geo: { '@type': 'GeoCoordinates', latitude: v.lat, longitude: v.lng } } : {}),
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />

      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1 text-sm text-slate-400 flex-wrap">
              <li><Link href="/" className="hover:text-white transition-colors">Free Live Music</Link></li>
              <li aria-hidden="true" className="text-slate-600">/</li>
              <li><Link href={`/?city=${metroCode}`} className="hover:text-white transition-colors">{metro.city}</Link></li>
              <li aria-hidden="true" className="text-slate-600">/</li>
              <li><Link href={`/venues/${citySlug}`} className="hover:text-white transition-colors">Venues</Link></li>
              <li aria-hidden="true" className="text-slate-600">/</li>
              <li className="text-slate-200 truncate max-w-[160px]" aria-current="page">{v.name}</li>
            </ol>
          </nav>
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
        </div>

        {/* Name */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
          {v.name}
        </h1>

        {/* Location */}
        <p className="text-slate-400 text-base mb-6">
          {[v.neighborhood, metro.city, metro.state].filter(Boolean).join(', ')}
        </p>

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
              <span className="text-slate-300 text-sm">{v.music_schedule}</span>
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

        {/* Upcoming shows */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">
            {shows.length > 0
              ? `${shows.length} Upcoming Free Show${shows.length !== 1 ? 's' : ''}`
              : 'Upcoming Shows'}
          </h2>

          {shows.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6 text-center">
              {v.music_schedule ? (
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
    </div>
  )
}
