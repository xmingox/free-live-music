import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteNav from '@/components/SiteNav'
import { CITY_GUIDES, GUIDE_SLUGS } from '@/lib/city-guides-data'

export const revalidate = 86400

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ city: slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>
}): Promise<Metadata> {
  const { city: citySlug } = await params
  const guide = CITY_GUIDES[citySlug]
  if (!guide) return { title: 'Guide Not Found' }

  const title = `Free Live Music in ${guide.cityName} | Where to Find It Year-Round`
  const description = guide.intro.slice(0, 160).trimEnd() + (guide.intro.length > 160 ? '…' : '')

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.freelivemusic.co/free-live-music/${citySlug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.freelivemusic.co/free-live-music/${citySlug}`,
      siteName: 'Free Live Music',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: { index: true, follow: true },
  }
}

export default async function CityGuidePage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city: citySlug } = await params
  const guide = CITY_GUIDES[citySlug]
  if (!guide) notFound()

  const concertSlug = guide.slug
  const concertHref = `/concerts/${concertSlug}`

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <SiteNav
            venuesHref={`/venues/${concertSlug}`}
            breadcrumbs={[
              { label: 'Free Live Music', href: '/' },
              { label: 'Guides', href: '/' },
              { label: guide.cityName },
            ]}
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Link
            href={concertHref}
            className="inline-block px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse {guide.cityName} Concerts →
          </Link>
        </div>

        <article className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-extrabold text-slate-900 leading-tight mb-6">
            Free Live Music in {guide.cityName} — Where to Find It Year-Round
          </h1>

          <p className="text-lg text-slate-700 leading-relaxed mb-10">{guide.intro}</p>

          <section aria-labelledby="neighborhoods-heading">
            <h2
              id="neighborhoods-heading"
              className="text-2xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-100 pb-2"
            >
              Neighborhoods &amp; Venues
            </h2>
            {guide.neighborhoods.split('\n\n').map((para, i) => (
              <p key={i} className="text-slate-700 leading-relaxed mb-4">
                {para}
              </p>
            ))}
          </section>

          <section aria-labelledby="seasons-heading">
            <h2
              id="seasons-heading"
              className="text-2xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-100 pb-2"
            >
              Best Seasons for Free Music
            </h2>
            {guide.seasons.split('\n\n').map((para, i) => (
              <p key={i} className="text-slate-700 leading-relaxed mb-4">
                {para}
              </p>
            ))}
          </section>

          <section aria-labelledby="howto-heading">
            <h2
              id="howto-heading"
              className="text-2xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-100 pb-2"
            >
              How to Find Free Shows in {guide.cityName}
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">{guide.howToFind}</p>
          </section>
        </article>

        <div className="my-10 rounded-xl border border-blue-200 bg-blue-50 px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900 text-lg">
              Ready to find shows this week?
            </p>
            <p className="text-slate-600 text-sm mt-1">
              Browse verified upcoming free concerts in {guide.cityName}, updated daily.
            </p>
          </div>
          <Link
            href={concertHref}
            className="shrink-0 inline-block px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            See upcoming free concerts in {guide.cityName} →
          </Link>
        </div>

        <section aria-labelledby="faq-heading" className="mt-10">
          <h2
            id="faq-heading"
            className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2"
          >
            Frequently Asked Questions
          </h2>
          <dl className="space-y-0 divide-y divide-slate-100">
            {guide.faqs.map(({ q, a }, i) => (
              <details key={i} className="group py-4" open={i === 0}>
                <summary className="flex cursor-pointer items-start justify-between gap-4 list-none">
                  <dt className="font-semibold text-slate-900 text-base leading-snug">{q}</dt>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-slate-400 group-open:rotate-180 transition-transform duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <dd className="mt-3 text-slate-600 text-sm leading-relaxed">{a}</dd>
              </details>
            ))}
          </dl>
        </section>

        <div className="mt-10 mb-4">
          <Link
            href={concertHref}
            className="inline-block px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse {guide.cityName} Concerts →
          </Link>
        </div>
      </div>
    </div>
  )
}
