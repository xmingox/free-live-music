'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Concert, City, DateFilter } from '@/types'
import { SubmitEventModal } from '@/components/SubmitEventModal'
import ConcertCard from '@/components/ConcertCard'
import DateFilterBar from '@/components/DateFilter'
import metros from '@/lib/metros.json'

const VALID_CITIES = new Set<City>(metros.metros.map(m => m.code as City))
const VALID_DATE_FILTERS = new Set<DateFilter>(['tonight', 'weekend', 'week', 'all', 'custom'])

type MetroType = typeof metros.metros[0]

function parseCity(v: string | null): City {
  return v && VALID_CITIES.has(v as City) ? (v as City) : 'NYC'
}

function parseDateFilter(v: string | null): DateFilter {
  return v && VALID_DATE_FILTERS.has(v as DateFilter) ? (v as DateFilter) : 'all'
}

function getAllStates() {
  const states = new Set(metros.metros.map(m => m.state))
  return Array.from(states).sort()
}

function getMetrosForState(state: string): MetroType[] {
  return metros.metros
    .filter(m => m.state === state)
    .sort((a, b) => a.city.localeCompare(b.city))
}

function filterByDate(concerts: Concert[], filter: DateFilter, dateFrom?: string, dateTo?: string): Concert[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return concerts.filter((concert) => {
    const concertDate = new Date(concert.date + 'T00:00:00')

    // Custom date range
    if (filter === 'custom' && dateFrom && dateTo) {
      const from = new Date(dateFrom)
      const to = new Date(dateTo)
      return concertDate >= from && concertDate <= to
    }

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
  const router = useRouter()

  const [city, setCity] = useState<City>(() => parseCity(searchParams.get('city')))
  const [state, setState] = useState<string>(() => {
    const metro = metros.metros.find(m => m.code === city)
    return metro?.state || 'NY'
  })
  const [dateFilter, setDateFilter] = useState<DateFilter>(() => parseDateFilter(searchParams.get('date')))
  const [dateFrom, setDateFrom] = useState<string>(searchParams.get('dateFrom') || '')
  const [dateTo, setDateTo] = useState<string>(searchParams.get('dateTo') || '')
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)

  const states = getAllStates()
  const metrosForState = getMetrosForState(state)

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('city', city)
    params.set('date', dateFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    router.push(`?${params.toString()}`)
  }, [city, dateFilter, dateFrom, dateTo, router])

  const handleStateChange = (newState: string) => {
    setState(newState)
    // Auto-select first metro in the state
    const metrosInState = getMetrosForState(newState)
    if (metrosInState.length > 0) {
      setCity(metrosInState[0].code as City)
    }
  }

  const handleCityChange = useCallback((newCity: City) => setCity(newCity), [])
  const handleDateFilterChange = useCallback((newFilter: DateFilter) => {
    setDateFilter(newFilter)
    if (newFilter !== 'custom') {
      setDateFrom('')
      setDateTo('')
    }
  }, [])

  const filtered = useMemo(() => {
    const byCity = initialConcerts.filter((c) => c.city === city)
    return filterByDate(byCity, dateFilter, dateFrom, dateTo)
  }, [initialConcerts, city, dateFilter, dateFrom, dateTo])

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-slate-950 to-pink-950/50" />
        <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-14">
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
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-end gap-3">
          {/* State & City Dropdowns */}
          <div className="flex gap-2 items-end">
            <div className="w-20">
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">State</label>
              <select
                value={state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-2 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-violet-500 text-sm"
              >
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">City</label>
              <select
                value={city}
                onChange={(e) => handleCityChange(e.target.value as City)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-violet-500 text-sm"
              >
                {metrosForState.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Filters - Right aligned */}
          <div className="sm:ml-auto">
            <DateFilterBar value={dateFilter} onChange={handleDateFilterChange} />
          </div>

          {/* Custom Date Range Inputs */}
          {dateFilter === 'custom' && (
            <div className="flex gap-2 sm:w-auto">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-violet-500 text-sm"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-violet-500 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Results count */}
        <p className="text-sm text-slate-500 mb-6">
          {filtered.length === 0
            ? 'No shows found'
            : `${filtered.length} ${filtered.length === 1 ? 'show' : 'shows'} in ${metros.metros.find(m => m.code === city)?.city || city}`}
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
    custom: 'in the selected date range',
  }
  const cityName = metros.metros.find(m => m.code === city)?.city || city
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">🎸</div>
      <h3 className="text-xl font-semibold text-slate-300 mb-2">No shows {filterLabels[filter]}</h3>
      <p className="text-slate-500 max-w-sm">
        No free concerts listed in {cityName} for this time
        window. Try selecting a different date range or city.
      </p>
    </div>
  )
}
