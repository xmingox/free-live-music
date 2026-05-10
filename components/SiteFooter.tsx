import Link from 'next/link'

const FEATURED_CITIES = [
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
  { name: 'Jacksonville',   slug: 'jacksonville' },
  { name: 'San Antonio',    slug: 'san-antonio' },
  { name: 'Oklahoma City',  slug: 'oklahoma-city' },
  { name: 'Omaha',          slug: 'omaha' },
  { name: 'New Orleans',    slug: 'new-orleans' },
  { name: 'Honolulu',       slug: 'honolulu' },
]

const TYPE_HUBS = [
  { label: 'Parks',         slug: 'parks' },
  { label: 'Bars',          slug: 'bars' },
  { label: 'Breweries',     slug: 'breweries' },
  { label: 'Restaurants',   slug: 'restaurants' },
  { label: 'Amphitheaters', slug: 'amphitheaters' },
]

export default function SiteFooter({ cityLine, venueTypeSlug }: { cityLine?: string; venueTypeSlug?: string }) {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Free Music Venues by City
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {FEATURED_CITIES.map(city => (
              <Link
                key={city.slug}
                href={`/venues/${city.slug}`}
                className="text-sm text-slate-400 hover:text-violet-300 transition-colors"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Browse by Venue Type
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {TYPE_HUBS.map(type => (
              <Link
                key={type.slug}
                href={venueTypeSlug ? `/venues/${venueTypeSlug}/${type.slug}` : `/venues/new-york/${type.slug}`}
                className="text-sm text-slate-400 hover:text-violet-300 transition-colors"
              >
                {type.label}
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
