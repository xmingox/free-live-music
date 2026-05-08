'use client'

import Link from 'next/link'
import { Concert } from '@/types'

const genreColors: Record<string, string> = {
  'Folk': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Jazz': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Jazz/Funk': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Indie Rock': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Indie Pop': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'R&B': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Soul': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Neo-soul': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Hip-hop': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Electronic': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Psychedelic': 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  'Dream Pop': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'Latin Folk': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Alt-country': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'DJ Set': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
}

const cityNames: Record<string, string> = {
  NYC: 'New York, NY',
  LA: 'Los Angeles, CA',
  SF: 'San Francisco, CA',
  CHI: 'Chicago, IL',
  AUS: 'Austin, TX',
  SEA: 'Seattle, WA',
  DC: 'Washington, DC',
  BOS: 'Boston, MA',
  DEN: 'Denver, CO',
  PDX: 'Portland, OR',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function isToday(dateStr: string): boolean {
  const today = new Date()
  const date = new Date(dateStr + 'T00:00:00')
  return date.toDateString() === today.toDateString()
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

function buildJsonLd(concert: Concert) {
  const cityName = cityNames[concert.city] ?? concert.city
  const startDate = concert.time
    ? `${concert.date}T${parseTimeToIso(concert.time)}`
    : concert.date

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: concert.artist_name,
    startDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: concert.venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: cityName,
      },
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: concert.source_url ?? `https://freelivemusic.co`,
    },
    organizer: {
      '@type': 'Organization',
      name: concert.source_name ?? 'Free Live Music',
      url: concert.source_url ?? 'https://freelivemusic.co',
    },
  }
}

export default function ConcertCard({ concert }: { concert: Concert }) {
  const genreColor = concert.genre
    ? (genreColors[concert.genre] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30')
    : null
  const tonight = isToday(concert.date)
  const hasFooter = !!(concert.source_name || concert.source_url)

  return (
    <Link href={`/concert/${concert.slug}`} className="group relative flex flex-col bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden hover:border-slate-600 hover:bg-slate-800 transition-all duration-200 hover:shadow-xl hover:shadow-black/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(concert)) }}
      />
      {/* Top accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="flex flex-col gap-3 p-5 flex-1">
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {tonight && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 animate-pulse">
                Tonight
              </span>
            )}
            {concert.genre && genreColor && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${genreColor}`}>
                {concert.genre}
              </span>
            )}
          </div>
          <span className={`text-xs px-2.5 py-0.5 rounded-full border ${
            concert.admission_type === 'Free RSVP'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-slate-700/60 text-slate-400 border-slate-600/50'
          }`}>
            {concert.admission_type}
          </span>
        </div>

        {/* Artist name */}
        <h3 className="text-lg font-bold text-white leading-tight group-hover:text-violet-200 transition-colors">
          {concert.artist_name}
        </h3>

        {/* Venue + Neighborhood */}
        <div className="flex items-start gap-2 text-slate-400">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <div className="min-w-0">
            {concert.venue && concert.venue !== 'TBD' ? (
              <>
                <span className="text-slate-200 font-medium text-sm">{concert.venue}</span>
                <span className="text-slate-500 text-sm"> · {concert.neighborhood}</span>
              </>
            ) : (
              <span className="text-slate-200 font-medium text-sm">{concert.neighborhood}</span>
            )}
          </div>
        </div>

        {/* Date + Time */}
        <div className="flex items-center gap-2 text-slate-400">
          <svg className="w-4 h-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
          </svg>
          <span className="text-sm">
            <span className="text-slate-200">{formatDate(concert.date)}</span>
            {concert.time && (
              <span className="text-slate-500"> · {concert.time}</span>
            )}
          </span>
        </div>

        {/* Source footer */}
        {hasFooter && (
          <div className="mt-auto pt-3 border-t border-slate-700/60 flex items-center justify-between gap-3">
            {concert.source_name ? (
              <span className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
                {concert.is_verified && (
                  <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="truncate">via {concert.source_name}</span>
              </span>
            ) : (
              <span />
            )}

            {concert.source_url && (
              <a
                href={concert.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                View listing
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
