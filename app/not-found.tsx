import Link from 'next/link'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'

const POPULAR_CITIES = [
  { label: 'New York', href: '/concerts/new-york', code: 'NYC' },
  { label: 'Los Angeles', href: '/concerts/los-angeles', code: 'LA' },
  { label: 'Chicago', href: '/concerts/chicago', code: 'CHI' },
  { label: 'Nashville', href: '/concerts/nashville', code: 'NSH' },
  { label: 'Austin', href: '/concerts/austin', code: 'AUS' },
  { label: 'Seattle', href: '/concerts/seattle', code: 'SEA' },
  { label: 'Denver', href: '/concerts/denver', code: 'DEN' },
  { label: 'Atlanta', href: '/concerts/atlanta', code: 'ATL' },
  { label: 'Philadelphia', href: '/concerts/philadelphia', code: 'PHI' },
  { label: 'Portland', href: '/concerts/portland', code: 'PDX' },
  { label: 'San Diego', href: '/concerts/san-diego', code: 'SD' },
  { label: 'New Orleans', href: '/concerts/new-orleans', code: 'NOLA' },
]

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <SiteNav
            breadcrumbs={[
              { label: 'Free Live Music', href: '/' },
              { label: 'Page not found' },
            ]}
          />
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full">
        <div className="text-center mb-12">
          <p className="text-6xl font-bold text-slate-700 mb-4">404</p>
          <h1 className="text-2xl font-semibold text-white mb-3">
            This concert page doesn&apos;t exist
          </h1>
          <p className="text-slate-400 max-w-md mx-auto">
            This show may have already happened, been removed, or the link may be outdated.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors text-center"
          >
            Browse all concerts
          </Link>
          <Link
            href="/venues/new-york"
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors text-center"
          >
            Explore venues
          </Link>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 text-center">
            Find free concerts near you
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {POPULAR_CITIES.map((city) => (
              <Link
                key={city.code}
                href={city.href}
                className="px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white text-sm text-center transition-colors border border-slate-700/50"
              >
                {city.label}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
