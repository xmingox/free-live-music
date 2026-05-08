import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Concert } from '@/types'
import Link from 'next/link'
import { cityCodeToSlug } from '@/lib/city-slugs'

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

// ISR: re-render at most once per hour instead of on every request
export const revalidate = 3600

const cityNames: Record<string, string> = {
  NYC: 'New York City',
  LA: 'Los Angeles',
  SF: 'San Francisco',
  CHI: 'Chicago',
  AUS: 'Austin',
  SEA: 'Seattle',
  DC: 'Washington DC',
  BOS: 'Boston',
  DEN: 'Denver',
  PDX: 'Portland',
}

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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { slug } = await params
  const { data } = await supabase.from('concerts').select('*').eq('slug', slug).single()
  if (!data) return { title: 'Concert Not Found' }

  const city = cityNames[data.city] ?? data.city
  const canonicalUrl = `https://www.freelivemusic.co/concert/${slug}`
  return {
    title: `${data.artist_name} — Free Concert in ${city} | Free Live Music`,
    description: `${data.artist_name} performs free at ${data.venue} in ${data.neighborhood}, ${city} on ${formatDate(data.date)}. Free admission.`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${data.artist_name} — Free Concert in ${city}`,
      description: `Free show at ${data.venue} on ${formatDate(data.date)}`,
      url: canonicalUrl,
      siteName: 'Free Live Music',
      type: 'website',
    },
  }
}

export default async function ConcertPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: concert } = await supabase
    .from('concerts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!concert) notFound()

  // Fetch venue slug for linking when venue_id is set
  let venueSlug: string | null = null
  if (concert.venue_id) {
    const { data: v } = await supabase
      .from('venues')
      .select('slug')
      .eq('id', concert.venue_id)
      .single()
    venueSlug = v?.slug ?? null
  }

  const today = new Date().toISOString().split('T')[0]
  const { data: related } = await supabase
    .from('concerts')
    .select('slug, artist_name, venue, neighborhood, date, time')
    .eq('city', concert.city)
    .neq('id', concert.id)
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(5)

  const city = cityNames[concert.city] ?? concert.city
  const canonicalUrl = `https://www.freelivemusic.co/concert/${slug}`

  const offerUrl = concert.source_url && isValidUrl(concert.source_url) ? concert.source_url : canonicalUrl
  const ogImageUrl = `https://www.freelivemusic.co/concert/${slug}/opengraph-image`
  const eventDescription = `${concert.artist_name} performs free at ${concert.venue} in ${concert.neighborhood}, ${city} on ${formatDate(concert.date)}${concert.time ? ` at ${formatTime(concert.time)}` : ''}. ${concert.admission_type === 'Free RSVP' ? 'Free admission with RSVP — check the official listing to reserve your spot.' : 'Free admission — no tickets or cover charge needed, just show up and enjoy.'}`

  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: concert.artist_name,
    description: eventDescription,
    image: concert.image_url ?? ogImageUrl,
    startDate: concert.time ? `${concert.date}T${parseTimeToIso(concert.time)}` : concert.date,
    endDate: concert.time ? `${concert.date}T${parseEndTimeIso(concert.time)}` : concert.date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    performer: { '@type': 'PerformingGroup', name: concert.artist_name },
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
          {/* Breadcrumb nav — visible to users and crawlers */}
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1 text-sm text-slate-400 flex-wrap">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Free Live Music
                </Link>
              </li>
              <li aria-hidden="true" className="text-slate-600">/</li>
              <li>
                <Link
                  href={`/?city=${concert.city}`}
                  className="hover:text-white transition-colors"
                >
                  {city}
                </Link>
              </li>
              <li aria-hidden="true" className="text-slate-600">/</li>
              <li className="text-slate-200 truncate max-w-[180px]" aria-current="page">
                {concert.artist_name}
              </li>
            </ol>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
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
          {concert.artist_name} performs free at {concert.venue} in {concert.neighborhood}, {city} on {formatDate(concert.date)}{concert.time ? ` at ${formatTime(concert.time)}` : ''}.{' '}
          {concert.admission_type === 'Free RSVP'
            ? 'This event is free but requires an RSVP — check the official listing to reserve your spot.'
            : 'No tickets or cover charge needed — just show up and enjoy.'}
        </p>

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
                <p className="font-semibold text-white">via {concert.source_name}</p>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        {concert.source_url && (
          <a
            href={concert.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-lg shadow-violet-900/30 mb-6"
          >
            View Official Listing →
          </a>
        )}

        <Link
          href="/"
          className="block w-full text-center bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-4 rounded-xl transition-all duration-200"
        >
          ← Browse All Free Shows
        </Link>

        {/* Related shows */}
        {related && related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-white mb-4">More Free Shows in {city}</h2>
            <div className="flex flex-col gap-2">
              {related.map((show) => (
                <Link
                  key={show.slug}
                  href={`/concert/${show.slug}`}
                  className="flex items-start justify-between gap-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl px-4 py-3 transition-all duration-150 group"
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
          </section>
        )}
      </main>
    </div>
  )
}
