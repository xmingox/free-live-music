'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
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

    if (filter === 'custom' && dateFrom && dateTo) {
      const from = new Date(dateFrom)
      const to = new Date(dateTo)
      return concertDate >= from && concertDate <= to
    }

    switch (filter) {
      case 'tonight':
        return concertDate.toDateString() === today.toDateString()
      case 'weekend': {
        const dayOfWeek = concertDate.getDay()
        const daysUntilFriday = (5 - today.getDay() + 7) % 7
        const fridayDate = new Date(today)
        fridayDate.setDate(fridayDate.getDate() + (daysUntilFriday === 0 ? 0 : daysUntilFriday))
        const sundayDate = new Date(fridayDate)
        sundayDate.setDate(sundayDate.getDate() + 2)
        return concertDate >= fridayDate && concertDate <= sundayDate
      }
      case 'week':
        const weekFromNow = new Date(today)
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        return concertDate >= today && concertDate <= weekFromNow
      case 'all':
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
    const metro = metros.metros.find(m => m.code === city)
    const cityNames = metro ? [metro.city, ...(metro.aliases || [])] : [city]
    const byCity = initialConcerts.filter((c) => cityNames.includes(c.city))
    return filterByDate(byCity, dateFilter, dateFrom, dateTo)
  }, [initialConcerts, city, dateFilter, dateFrom, dateTo])

  return (
    <div className="min-h-screen bg-slate-950">
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
              <p className="text-slate-400 text-lg">The best free shows across the US</p>
            </div>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 rounded-lg font-semibold hover:from-violet-500 hover:to-pink-500 transition-all"
            >
              Share Event
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">STATE</label>
              <select
                value={state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-violet-500 text-sm"
              >
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">CITY</label>
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

          <div className="sm:ml-auto mt-4">
            <DateFilterBar value={dateFilter} onChange={handleDateFilterChange} />
          </div>

          {dateFilter === 'custom' && (
            <div className="flex gap-2 mt-4">
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
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <p className="text-slate-400 mb-6">
          {filtered.length > 0
            ? `${filtered.length} ${filtered.length === 1 ? 'show' : 'shows'} in ${metros.metros.find(m => m.code === city)?.city || city}`
            : `No free concerts listed in ${metros.metros.find(m => m.code === city)?.city || city} for this time window.`}
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
        No free concerts listed in {cityName} for this time window. Try selecting a different date range or city.
      </p>
    </div>
  )
}
