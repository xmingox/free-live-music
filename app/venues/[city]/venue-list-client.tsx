'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const venueTypeLabels: Record<string, string> = {
  park: 'Park',
  amphitheater: 'Amphitheater',
  plaza: 'Plaza',
  bar: 'Bar',
  restaurant: 'Restaurant',
  brewery: 'Brewery',
  mall: 'Mall',
  coffee_shop: 'Coffee Shop',
  farmers_market: "Farmers' Market",
  church: 'Church',
  library: 'Library',
  school: 'School',
  museum: 'Museum',
  community_center: 'Community Center',
  rooftop: 'Rooftop',
  other: 'Venue',
}

const venueTypeColors: Record<string, string> = {
  park: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  amphitheater: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  plaza: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  bar: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  restaurant: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  brewery: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  farmers_market: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
  church: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  library: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  school: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  museum: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  community_center: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  rooftop: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  coffee_shop: 'bg-stone-500/20 text-stone-300 border-stone-500/30',
  other: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

type Venue = {
  id: string
  slug: string
  name: string
  neighborhood: string | null
  venue_type: string | null
  indoor_outdoor: string | null
  upcoming_show_count: number
}

const FILTER_TYPES = ['bar', 'brewery', 'restaurant', 'coffee_shop', 'park', 'amphitheater', 'mall', 'rooftop', 'plaza']

export default function VenueListClient({
  venues,
  citySlug,
  cityName,
  withShowsCount,
}: {
  venues: Venue[]
  citySlug: string
  cityName: string
  withShowsCount: number
}) {
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<string | null>(null)
  const [showsOnly, setShowsOnly] = useState(false)

  const availableTypes = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const v of venues) {
      const t = v.venue_type ?? 'other'
      if (FILTER_TYPES.includes(t)) counts[t] = (counts[t] || 0) + 1
    }
    return FILTER_TYPES.filter(t => counts[t] > 0)
  }, [venues])

  const filtered = useMemo(() => {
    return venues.filter(v => {
      if (showsOnly && v.upcoming_show_count === 0) return false
      if (activeType && v.venue_type !== activeType) return false
      if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [venues, showsOnly, activeType, search])

  return (
    <>
      {/* Shows-this-week strip */}
      {withShowsCount > 0 && !showsOnly && !activeType && !search && (
        <button
          onClick={() => setShowsOnly(true)}
          className="w-full mb-6 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-4 hover:bg-emerald-500/15 transition-colors text-left"
        >
          <div>
            <p className="text-emerald-300 font-semibold text-sm">
              {withShowsCount} venue{withShowsCount !== 1 ? 's' : ''} with upcoming shows
            </p>
            <p className="text-emerald-400/60 text-xs mt-0.5">
              See only venues with confirmed free music
            </p>
          </div>
          <span className="text-emerald-400 text-sm shrink-0">Filter →</span>
        </button>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Search */}
        <input
          type="text"
          placeholder={`Search ${cityName} venues…`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
        />

        {/* Type chips + shows toggle */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowsOnly(v => !v)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              showsOnly
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
            }`}
          >
            With upcoming shows
          </button>

          {availableTypes.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(activeType === type ? null : type)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                activeType === type
                  ? venueTypeColors[type]
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              {venueTypeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <p className="text-slate-500 text-sm mb-4">
        {filtered.length === venues.length
          ? `${venues.length} venues`
          : `${filtered.length} of ${venues.length} venues`}
        {showsOnly ? ' with upcoming shows' : ''}
        {activeType ? ` · ${venueTypeLabels[activeType]}` : ''}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-slate-500 text-sm">No venues match your filters.</p>
          <button
            onClick={() => { setSearch(''); setActiveType(null); setShowsOnly(false) }}
            className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((venue) => {
            const typeColor = venueTypeColors[venue.venue_type ?? 'other'] ?? venueTypeColors.other
            const typeLabel = venueTypeLabels[venue.venue_type ?? 'other'] ?? 'Venue'
            return (
              <Link
                key={venue.id}
                href={`/venues/${citySlug}/${venue.slug}`}
                className="group flex flex-col bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden hover:border-slate-600 hover:bg-slate-800 transition-all duration-200 hover:shadow-xl hover:shadow-black/30 p-5"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColor}`}>
                    {typeLabel}
                  </span>
                  {venue.indoor_outdoor && (
                    <span className="text-xs text-slate-500 capitalize">{venue.indoor_outdoor}</span>
                  )}
                </div>
                <h2 className="text-base font-bold text-white leading-tight group-hover:text-violet-200 transition-colors mb-1">
                  {venue.name}
                </h2>
                {venue.neighborhood && (
                  <p className="text-sm text-slate-400 mb-3">{venue.neighborhood}</p>
                )}
                <div className="mt-auto">
                  {venue.upcoming_show_count > 0 ? (
                    <span className="text-xs font-semibold text-emerald-400">
                      {venue.upcoming_show_count} upcoming show{venue.upcoming_show_count !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600">No upcoming shows listed</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
