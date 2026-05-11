'use client'

import { useState, useMemo, useCallback, useEffect, useRef, useTransition } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Concert, City, DateFilter } from '@/types'
import ConcertCard from '@/components/ConcertCard'
import DateFilterBar from '@/components/DateFilter'
import metros from '@/lib/metros.json'
import { cityCodeToSlug } from '@/lib/city-slugs'

const SubmitEventModal = dynamic(
  () => import('@/components/SubmitEventModal').then(m => ({ default: m.SubmitEventModal })),
  { ssr: false }
)

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
  // 'all' is already pre-filtered to future dates by the DB query — skip client Date() to avoid
  // hydration mismatch between server render time and client time.
  if (filter === 'all') return concerts

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
        const daysUntilFriday = (5 - today.getDay() + 7) % 7
        const fridayDate = new Date(today)
        fridayDate.setDate(fridayDate.getDate() + (daysUntilFriday === 0 ? 0 : daysUntilFriday))
        const sundayDate = new Date(fridayDate)
        sundayDate.setDate(sundayDate.getDate() + 2)
        return concertDate >= fridayDate && concertDate <= sundayDate
      }
      case 'week': {
        const weekFromNow = new Date(today)
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        return concertDate >= today && concertDate <= weekFromNow
      }
      default:
        return true
    }
  })
}

const PAGE_SIZE = 24

export default function ConcertsClient({
  initialConcerts,
  defaultCity,
}: {
  initialConcerts: Concert[]
  defaultCity: City
}) {
  const router = useRouter()

  // Initialize from defaultCity so SSR renders a full page without Suspense.
  // Read actual URL params after hydration in a one-time effect below.
  const [city, setCity] = useState<City>(defaultCity)
  const [state, setState] = useState<string>(() => {
    const metro = metros.metros.find(m => m.code === defaultCity)
    return metro?.state || 'NY'
  })
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)

  const cache = useRef<Partial<Record<City, Concert[]>>>({})
  const [concerts, setConcerts] = useState<Concert[]>(initialConcerts)
  const [isFetching, setIsFetching] = useState(false)
  const [, startTransition] = useTransition()
  // On initial mount, skip the loading indicator so SSR concerts stay visible
  // (good LCP). Only show loading state on explicit city switches.
  const isFirstFetchRef = useRef(true)

  // Sync from URL params once on mount — avoids useSearchParams() which forces Suspense
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlCity = parseCity(params.get('city'))
    const urlFilter = parseDateFilter(params.get('date'))
    const urlDateFrom = params.get('dateFrom') || ''
    const urlDateTo = params.get('dateTo') || ''
    if (urlCity !== defaultCity) {
      setCity(urlCity)
      setState(metros.metros.find(m => m.code === urlCity)?.state || 'NY')
    }
    if (urlFilter !== 'all') setDateFilter(urlFilter)
    if (urlDateFrom) setDateFrom(urlDateFrom)
    if (urlDateTo) setDateTo(urlDateTo)
  }, [defaultCity])

  const states = getAllStates()
  const metrosForState = getMetrosForState(state)

  // Skip the initial mount — only sync URL on user-driven state changes
  const didInitRef = useRef(false)
  useEffect(() => {
    if (!didInitRef.current) { didInitRef.current = true; return }
    const params = new URLSearchParams()
    params.set('city', city)
    params.set('date', dateFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    router.replace(`?${params.toString()}`)
  }, [city, dateFilter, dateFrom, dateTo, router])

  useEffect(() => {
    if (cache.current[city]) {
      setConcerts(cache.current[city]!)
      setIsFetching(false)
      isFirstFetchRef.current = false
      return
    }
    const isFirst = isFirstFetchRef.current
    isFirstFetchRef.current = false
    if (!isFirst) {
      setIsFetching(true)
      setConcerts([])
    }
    fetch(`/api/concerts?city=${city}`)
      .then(r => r.json())
      .then((data: Concert[]) => {
        cache.current[city] = data
        startTransition(() => {
          setConcerts(data)
          setIsFetching(false)
        })
      })
      .catch(() => setIsFetching(false))
  }, [city])

  const handleStateChange = (newState: string) => {
    setState(newState)
    setVisibleCount(PAGE_SIZE)
    const metrosInState = getMetrosForState(newState)
    if (metrosInState.length > 0) {
      setCity(metrosInState[0].code as City)
    }
  }

  const handleCityChange = useCallback((newCity: City) => {
    setCity(newCity)
    setVisibleCount(PAGE_SIZE)
  }, [])
  const handleDateFilterChange = useCallback((newFilter: DateFilter) => {
    setDateFilter(newFilter)
    setVisibleCount(PAGE_SIZE)
    if (newFilter !== 'custom') {
      setDateFrom('')
      setDateTo('')
    }
  }, [])

  const filtered = useMemo(() => {
    return filterByDate(concerts, dateFilter, dateFrom, dateTo)
  }, [concerts, dateFilter, dateFrom, dateTo])

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-slate-950 to-pink-950/50" />
        {/* Site nav */}
        <div className="relative border-b border-slate-800/60 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
            <Link href="/" className="text-sm font-extrabold text-white tracking-tight">
              Free Live Music
            </Link>
            <div className="flex items-center gap-1">
              <span className="px-3 py-1.5 text-xs font-medium text-violet-400 bg-violet-500/10 rounded-lg">
                Concerts
              </span>
              {cityCodeToSlug[city] && (
                <Link
                  href={`/venues/${cityCodeToSlug[city]}`}
                  className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Venues
                </Link>
              )}
            </div>
          </div>
        </div>
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
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-1 bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Free Live Music
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

          {cityCodeToSlug[city] && (
            <div className="mt-4">
              <Link
                href={`/venues/${cityCodeToSlug[city]}`}
                className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                Browse {metros.metros.find(m => m.code === city)?.city ?? city} venues →
              </Link>
            </div>
          )}

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
          {isFetching
            ? `Loading shows in ${metros.metros.find(m => m.code === city)?.city || city}…`
            : filtered.length > 0
            ? `${filtered.length} ${filtered.length === 1 ? 'show' : 'shows'} in ${metros.metros.find(m => m.code === city)?.city || city}`
            : `No free concerts listed in ${metros.metros.find(m => m.code === city)?.city || city} for this time window.`}
        </p>

        {isFetching && concerts.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.slice(0, visibleCount).map((concert) => (
                <ConcertCard key={concert.id} concert={concert} />
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 font-medium transition-colors"
                >
                  Show more ({filtered.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState city={city} filter={dateFilter} />
        )}
      </main>

      <footer className="mt-16 border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Free Concerts by City
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {[
                { name: 'New York',       slug: 'new-york' },
                { name: 'Los Angeles',    slug: 'los-angeles' },
                { name: 'Chicago',        slug: 'chicago' },
                { name: 'San Francisco',  slug: 'san-francisco' },
                { name: 'Austin',         slug: 'austin' },
                { name: 'Seattle',        slug: 'seattle' },
                { name: 'Washington DC',  slug: 'washington' },
                { name: 'Boston',         slug: 'boston' },
                { name: 'Denver',         slug: 'denver' },
                { name: 'Atlanta',        slug: 'atlanta' },
                { name: 'Nashville',      slug: 'nashville' },
                { name: 'Portland',       slug: 'portland' },
                { name: 'Miami',          slug: 'miami' },
                { name: 'Philadelphia',   slug: 'philadelphia' },
                { name: 'Dallas',         slug: 'dallas' },
                { name: 'Houston',        slug: 'houston' },
                { name: 'Minneapolis',    slug: 'minneapolis' },
                { name: 'San Diego',      slug: 'san-diego' },
                { name: 'Phoenix',        slug: 'phoenix' },
                { name: 'St. Louis',      slug: 'st-louis' },
                { name: 'Baltimore',      slug: 'baltimore' },
                { name: 'Pittsburgh',     slug: 'pittsburgh' },
                { name: 'Charlotte',      slug: 'charlotte' },
                { name: 'Raleigh',        slug: 'raleigh' },
                { name: 'New Orleans',    slug: 'new-orleans' },
                { name: 'Jacksonville',   slug: 'jacksonville' },
                { name: 'San Antonio',    slug: 'san-antonio' },
                { name: 'Oklahoma City',  slug: 'oklahoma-city' },
                { name: 'Omaha',          slug: 'omaha' },
                { name: 'Honolulu',       slug: 'honolulu' },
              ].map(c => (
                <Link key={c.slug} href={`/concerts/${c.slug}`} className="text-sm text-slate-400 hover:text-violet-300 transition-colors">
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Browse Venues
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {[
                { label: 'Parks',         slug: 'parks' },
                { label: 'Bars',          slug: 'bars' },
                { label: 'Breweries',     slug: 'breweries' },
                { label: 'Restaurants',   slug: 'restaurants' },
                { label: 'Amphitheaters', slug: 'amphitheaters' },
              ].map(t => (
                <Link key={t.slug} href={`/venues/new-york/${t.slug}`} className="text-sm text-slate-400 hover:text-violet-300 transition-colors">
                  {t.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-slate-800/60">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-300">Free Live Music</span>
              <span className="text-slate-700">·</span>
              <Link href="/venues/new-york" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Venues
              </Link>
            </div>
            <p className="text-xs text-slate-600">Free live music across America · All shows free admission</p>
          </div>
        </div>
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
