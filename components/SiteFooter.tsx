import Link from 'next/link'

const FEATURED_CITIES = [
  { code: 'NYC', name: 'New York', slug: 'new-york' },
  { code: 'LA',  name: 'Los Angeles', slug: 'los-angeles' },
  { code: 'CHI', name: 'Chicago', slug: 'chicago' },
  { code: 'SF',  name: 'San Francisco', slug: 'san-francisco' },
  { code: 'AUS', name: 'Austin', slug: 'austin' },
  { code: 'SEA', name: 'Seattle', slug: 'seattle' },
  { code: 'DC',  name: 'Washington DC', slug: 'washington' },
  { code: 'BOS', name: 'Boston', slug: 'boston' },
  { code: 'DEN', name: 'Denver', slug: 'denver' },
  { code: 'ATL', name: 'Atlanta', slug: 'atlanta' },
  { code: 'NSH', name: 'Nashville', slug: 'nashville' },
  { code: 'PDX', name: 'Portland', slug: 'portland' },
]

export default function SiteFooter({ cityLine }: { cityLine?: string }) {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Free Music Venues by City
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {FEATURED_CITIES.map(city => (
              <Link
                key={city.code}
                href={`/venues/${city.slug}`}
                className="text-sm text-slate-400 hover:text-violet-300 transition-colors"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-slate-800/60">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-bold text-slate-300 hover:text-white transition-colors">
              Free Live Music
            </Link>
            <span className="text-slate-700">·</span>
            <Link href="/venues/new-york" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Venues
            </Link>
          </div>
          <p className="text-xs text-slate-600">
            {cityLine ?? 'Free live music across America · All shows free admission'}
          </p>
        </div>
      </div>
    </footer>
  )
}
