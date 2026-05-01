'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Concert, City, DateFilter } from '@/types'
import { SubmitEventModal } from '@/components/SubmitEventModal'
import ConcertCard from '@/components/ConcertCard'
import CityToggle from '@/components/CityToggle'
import DateFilterBar from '@/components/DateFilter'

const VALID_CITIES = new Set<City>(['NYC', 'LA', 'SF', 'CHI', 'AUS', 'SEA', 'DC', 'BOS', 'DEN', 'PDX'])
const VALID_DATE_FILTERS = new Set<DateFilter>(['tonight', 'weekend', 'week', 'all'])

function parseCity(v: string | null): City {
  return v && VALID_CITIES.has(v as City) ? (v as City) : 'NYC'
}
function parseDateFilter(v: string | null): DateFilter {
  return v && VALID_DATE_FILTERS.has(v as DateFilter) ? (v as DateFilter) : 'all'
}

function filterByDate(concerts: Concert[], filter: DateFilter): Concert[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return concerts.filter((concert) => {
    const concertDate = new Date(concert.date + 'T00:00:00')

    switch (filter) {
      case 'tonight':
        return concertDate.toDateString() === today.toDateString()

      case 'weekend': {
        const day = concertDate.getDay()
        const isFriSatSun = day === 5 || day === 6 || day === 0
        const diffDays = (concertDate.getTime() - today.getTime()) / 86400000
        return isFriSatSun && diffDays >= 0 && diffDays <= 10
      }

      case 'week': {
        const diffDays = (concertDate.getTime() - today.getTime()) / 86400000
        return diffDays >= 0 && diffDays <= 7
      }

      default:
        return concertDate >= today
    }
  })
}

export default function ConcertsClient({ initialConcerts }: { initialConcerts: Concert[] }) {
  const searchParams = useSearchParams()

  const [city, setCity] = useState<City>(() => parseCity(searchParams.get('city')))
  const [dateFilter, setDateFilter] = useState<DateFilter>(() => parseDateFilter(searchParams.get('date')))

  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    const params = new URLSearchParams()
    params.set('city', city)
    params.set('date', dateFilter)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }, [city, dateFilter])
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)

  const handleCityChange = useCallback((newCity: City) => setCity(newCity), [])
  const handleDateFilterChange = useCallback((newFilter: DateFilter) => setDateFilter(newFilter), [])

  const filtered = useMemo(() => {
    const byCity = initialConcerts.filter((c) => c.city === city)
    return filterByDate(byCity, dateFilter)
  }, [initialConcerts, city, dateFilter])

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-slate-950 to-pink-950/50" />
        <div className="relative max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-lg shadow-lg">
                  🎵
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Always free
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-1">
                <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                  Free Live Music
                </span>
              </h1>
              <p className="text-slate-400 text-base sm:text-lg">
                The best free shows across the US
              </p>
            </div>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white text-sm font-semibold rounded-lg transition whitespace-nowrap flex-shrink-0"
            >
              Share Event
            </button>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <CityToggle city={city} onChange={handleCityChange} />
          <div className="sm:ml-auto">
            <DateFilterBar value={dateFilter} onChange={handleDateFilterChange} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Results count */}
        <p className="text-sm text-slate-500 mb-6">
          {filtered.length === 0
            ? 'No shows found'
            : `${filtered.length} ${filtered.length === 1 ? 'show' : 'shows'} in ${city}`}
        </p>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((concert) => (
              <ConcertCard key={concert.id} concert={concert} />
            ))}
          </div>
        ) : (
          <EmptyState city={city} filter={dateFilter} />
        )}
      </main>

      <footer className="mt-16 border-t border-slate-800 py-8 text-center text-slate-600 text-sm">
        Free Live Music · Free Live Music Across America · All shows free admission
      </footer>

      <SubmitEventModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
      />
    </div>
  )
}

function EmptyState({ city, filter }: { city: City; filter: DateFilter }) {
  const filterLabels: Record<DateFilter, string> = {
    tonight: 'tonight',
    weekend: 'this weekend',
    week: 'in the next 7 days',
    all: 'coming up',
  }
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">🎸</div>
      <h3 className="text-xl font-semibold text-slate-300 mb-2">No shows {filterLabels[filter]}</h3>
      <p className="text-slate-500 max-w-sm">
        No free concerts listed in {city} for this time
        window. Try selecting a different date range.
      </p>
    </div>
  )
}
