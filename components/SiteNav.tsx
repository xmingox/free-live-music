import Link from 'next/link'

type Crumb = { label: string; href?: string }

export default function SiteNav({
  breadcrumbs,
  venuesHref = '/venues/new-york',
}: {
  breadcrumbs: Crumb[]
  venuesHref?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1 text-sm text-slate-400 flex-wrap">
          {breadcrumbs.map((crumb, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true" className="text-slate-600">/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-white transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-200 truncate max-w-[160px]" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Site nav links */}
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href="/"
          className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          Concerts
        </Link>
        <Link
          href={venuesHref}
          className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          Venues
        </Link>
      </div>
    </div>
  )
}
