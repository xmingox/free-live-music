export const revalidate = 86400

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { cityGuides, GUIDE_CITIES } from '@/lib/city-guides'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'

export function generateStaticParams() {
  return GUIDE_CITIES.map(c => ({ city: c.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> }
): Promise<Metadata> {
  const { city: slug } = await params
  const meta = GUIDE_CITIES.find(c => c.slug === slug)
  if (!meta) return { title: 'Not Found' }

  const title = `Free Live Music in ${meta.name} — Where to Find It Year-Round`
  const description = `Discover where to find free live music in ${meta.name}, ${meta.state} — parks, bars, breweries, festivals, and neighborhoods known for live music. All shows free admission.`
  const url = `https://www.freelivemusic.co/free-music/${slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Free Live Music',
      type: 'article',
    },
  }
}

export default async function CityGuidePage(
  { params }: { params: Promise<{ city: string }> }
) {
  const { city: slug } = await params
  const meta = GUIDE_CITIES.find(c => c.slug === slug)
  if (!meta) notFound()

  const guide = cityGuides[slug]
  if (!guide) notFound()

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Free Live Music in ${meta.name} — Where to Find It Year-Round`,
    description: `Where to find free live music in ${meta.name}, ${meta.state} — parks, bars, festivals, and more.`,
    url: `https://www.freelivemusic.co/free-music/${slug}`,
    publisher: {
      '@type': 'Organization',
      '@id': 'https://www.freelivemusic.co/#organization',
      name: 'Free Live Music',
    },
    author: {
      '@type': 'Organization',
      name: 'Free Live Music',
    },
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <SiteNav
            breadcrumbs={[
              { label: 'Free Live Music', href: '/' },
              { label: meta.name, href: `/?city=${meta.code}` },
              { label: 'Music Guide' },
            ]}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
          <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
            Free Live Music
          </span>
          <span className="text-white"> in {meta.name}</span>
        </h1>
        <p className="text-slate-400 text-lg mb-10">Where to find it year-round — no tickets, no cover.</p>

        <article className="prose prose-invert prose-slate max-w-none">
          <p className="text-slate-300 leading-relaxed mb-6 text-base">{guide.intro}</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">The Free Music Scene in {meta.name}</h2>
          <p className="text-slate-300 leading-relaxed mb-6 text-base">{guide.scene}</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Where to Find Free Music</h2>
          <p className="text-slate-300 leading-relaxed mb-6 text-base">{guide.where}</p>

          {guide.venues.length > 0 && (
            <ul className="my-4 space-y-1.5">
              {guide.venues.map(v => (
                <li key={v} className="flex items-start gap-2 text-slate-300 text-sm">
                  <span className="text-violet-400 mt-0.5 shrink-0">♪</span>
                  {v}
                </li>
              ))}
            </ul>
          )}

          <h2 className="text-xl font-bold text-white mt-10 mb-4">When to Go</h2>
          <p className="text-slate-300 leading-relaxed mb-6 text-base">{guide.seasons}</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Tips for Finding Free Shows</h2>
          <ul className="space-y-3 my-4">
            {guide.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>

          {guide.hoods.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-white mt-10 mb-4">Neighborhoods to Explore</h2>
              <div className="flex flex-wrap gap-2 my-4">
                {guide.hoods.map(h => (
                  <Link
                    key={h}
                    href={`/venues/${slug}/neighborhood/${h.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`}
                    className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:border-violet-500/50 hover:text-violet-300 transition-colors"
                  >
                    {h}
                  </Link>
                ))}
              </div>
            </>
          )}
        </article>

        {/* CTA links */}
        <div className="mt-12 pt-8 border-t border-slate-800 grid sm:grid-cols-2 gap-4">
          <Link
            href={`/concerts/${slug}`}
            className="flex flex-col rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-violet-500/50 hover:bg-slate-800 transition-all p-5"
          >
            <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-1">Browse shows</span>
            <span className="text-white font-bold text-base">Upcoming Free Concerts in {meta.name} →</span>
            <span className="text-slate-400 text-sm mt-1">See what's playing this week</span>
          </Link>
          <Link
            href={`/venues/${slug}`}
            className="flex flex-col rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-violet-500/50 hover:bg-slate-800 transition-all p-5"
          >
            <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-1">Discover venues</span>
            <span className="text-white font-bold text-base">Free Music Venues in {meta.name} →</span>
            <span className="text-slate-400 text-sm mt-1">Parks, bars, breweries, and more</span>
          </Link>
        </div>

        {/* Other cities */}
        <div className="mt-10 pt-8 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">More City Guides</p>
          <div className="flex flex-wrap gap-2">
            {GUIDE_CITIES.filter(c => c.slug !== slug).slice(0, 12).map(c => (
              <Link
                key={c.slug}
                href={`/free-music/${c.slug}`}
                className="text-sm text-slate-400 hover:text-violet-300 transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter cityLine={`Free live music in ${meta.name} — all shows free admission`} venueTypeSlug={slug} />
    </div>
  )
}
