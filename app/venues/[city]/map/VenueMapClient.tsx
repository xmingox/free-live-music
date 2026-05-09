'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Venue } from '@/types'
import 'mapbox-gl/dist/mapbox-gl.css'

const TYPE_COLORS: Record<string, string> = {
  park: '#10b981',
  amphitheater: '#8b5cf6',
  bar: '#f59e0b',
  brewery: '#eab308',
  restaurant: '#f97316',
  plaza: '#0ea5e9',
  farmers_market: '#84cc16',
  church: '#6366f1',
  library: '#3b82f6',
  museum: '#d946ef',
  community_center: '#14b8a6',
  rooftop: '#f43f5e',
  other: '#94a3b8',
}

const TYPE_LABELS: Record<string, string> = {
  park: 'Parks',
  amphitheater: 'Amphitheaters',
  bar: 'Bars',
  brewery: 'Breweries',
  restaurant: 'Restaurants',
  plaza: 'Plazas',
  farmers_market: "Farmers' Markets",
  church: 'Churches',
  library: 'Libraries',
  museum: 'Museums',
  community_center: 'Community Centers',
  rooftop: 'Rooftops',
  other: 'Other',
}

type MapVenue = Pick<Venue, 'id' | 'slug' | 'name' | 'venue_type' | 'neighborhood' | 'lat' | 'lng'>

function toGeoJSON(venues: MapVenue[]) {
  return {
    type: 'FeatureCollection' as const,
    features: venues.map(v => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [v.lng!, v.lat!] },
      properties: { id: v.id, name: v.name, venue_type: v.venue_type ?? 'other', neighborhood: v.neighborhood ?? '' },
    })),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildColorExpr(): any {
  const expr: unknown[] = ['match', ['get', 'venue_type']]
  for (const [type, color] of Object.entries(TYPE_COLORS)) {
    if (type !== 'other') expr.push(type, color)
  }
  expr.push(TYPE_COLORS.other)
  return expr
}

export default function VenueMapClient({
  venues,
  citySlug,
}: {
  venues: MapVenue[]
  citySlug: string
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mbRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const presentTypes = Array.from(new Set(venues.map(v => v.venue_type ?? 'other'))).sort()
  const filtered = typeFilter === 'all' ? venues : venues.filter(v => (v.venue_type ?? 'other') === typeFilter)

  // Init map once
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token || !mapContainerRef.current) return
    let destroyed = false

    import('mapbox-gl').then(mb => {
      if (destroyed || !mapContainerRef.current) return
      mbRef.current = mb.default
      mb.default.accessToken = token

      const map = new mb.default.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-98.5, 39.5],
        zoom: 3,
      })
      mapRef.current = map

      map.on('load', () => {
        map.addSource('venues', { type: 'geojson', data: toGeoJSON(venues) })

        map.addLayer({
          id: 'venues',
          type: 'circle',
          source: 'venues',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 16, 10],
            'circle-color': buildColorExpr(),
            'circle-stroke-color': 'rgba(255,255,255,0.6)',
            'circle-stroke-width': 1.5,
          },
        })

        map.addLayer({
          id: 'venues-active',
          type: 'circle',
          source: 'venues',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 9, 16, 16],
            'circle-color': '#ffffff',
            'circle-stroke-color': '#f43f5e',
            'circle-stroke-width': 3,
          },
          filter: ['==', ['get', 'id'], ''],
        })

        map.on('click', 'venues', (e: any) => {
          const id = e.features?.[0]?.properties?.id
          if (id) setActiveId(id)
        })
        map.on('mouseenter', 'venues', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'venues', () => { map.getCanvas().style.cursor = '' })

        // Fit to all venues
        const bounds = new mb.default.LngLatBounds()
        venues.forEach(v => { if (v.lat && v.lng) bounds.extend([v.lng, v.lat]) })
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 0 })

        setIsReady(true)
      })
    })

    return () => {
      destroyed = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update source when filter changes
  useEffect(() => {
    if (!isReady || !mapRef.current || !mbRef.current) return
    mapRef.current.getSource('venues')?.setData(toGeoJSON(filtered))
    if (filtered.length) {
      const bounds = new mbRef.current.LngLatBounds()
      filtered.forEach((v: MapVenue) => { if (v.lat && v.lng) bounds.extend([v.lng, v.lat]) })
      if (!bounds.isEmpty()) mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 500 })
    }
  }, [filtered, isReady])

  // Update active highlight filter
  useEffect(() => {
    if (!isReady || !mapRef.current) return
    mapRef.current.setFilter('venues-active', ['==', ['get', 'id'], activeId ?? ''])
  }, [activeId, isReady])

  // Scroll panel to active venue
  useEffect(() => {
    if (activeId) itemRefs.current.get(activeId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeId])

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        Add <code className="mx-1 text-violet-400">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable the map.
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Side panel — desktop only */}
      <div className="hidden md:flex flex-col w-72 lg:w-80 shrink-0 border-r border-slate-800 overflow-hidden">
        {/* Type filter chips */}
        <div className="p-3 border-b border-slate-800 shrink-0">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setTypeFilter('all')}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                typeFilter === 'all'
                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              All ({venues.length})
            </button>
            {presentTypes.map(type => {
              const count = venues.filter(v => (v.venue_type ?? 'other') === type).length
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    typeFilter === type
                      ? 'bg-slate-600 text-white border-slate-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {TYPE_LABELS[type] ?? type} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Venue list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-slate-500 text-xs text-center py-8">No venues of this type.</p>
          )}
          {filtered.map(venue => (
            <div
              key={venue.id}
              ref={el => { if (el) itemRefs.current.set(venue.id, el) }}
              onClick={() => {
                setActiveId(venue.id)
                if (venue.lat && venue.lng && mapRef.current) {
                  mapRef.current.flyTo({ center: [venue.lng, venue.lat], zoom: 15, duration: 700 })
                }
              }}
              className={`px-4 py-3 border-b border-slate-800/60 cursor-pointer transition-colors group ${
                activeId === venue.id ? 'bg-slate-700/80' : 'hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: TYPE_COLORS[venue.venue_type ?? 'other'] }}
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${activeId === venue.id ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                    {venue.name}
                  </p>
                  {venue.neighborhood && (
                    <p className="text-xs text-slate-500 truncate">{venue.neighborhood}</p>
                  )}
                  {activeId === venue.id && (
                    <Link
                      href={`/venues/${citySlug}/${venue.slug}`}
                      className="text-xs text-violet-400 hover:text-violet-300 mt-0.5 inline-block"
                      onClick={e => e.stopPropagation()}
                    >
                      View details →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map canvas */}
      <div ref={mapContainerRef} className="flex-1" />
    </div>
  )
}
