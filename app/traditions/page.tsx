import { Metadata } from 'next'
import Link from 'next/link'
import { getAllResidencies, cadenceLabel, type Residency } from '@/lib/residencies'
import { getMetroByCode, cityCodeToSlug } from '@/lib/city-slugs'

// Daily backstop; busts with the residencies data via revalidateTag('residencies').
export const revalidate = 86400

const DAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_FULL: Record<string, string> = {
  Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
  Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday',
}

function cityNameOf(code: string | null): string {
  if (!code) return ''
  return getMetroByCode(code)?.city ?? code
}

export async function generateMetadata(): Promise<Metadata> {
  const all = await getAllResidencies()
  const cities = new Set(all.map((r) => r.cityCode).filter(Boolean)).size
  const title = 'Free Live Music Traditions Across America'
  const description = `${all.length} free, recurring live-music traditions across ${cities} US cities — nightly stages, Sunday organ concerts, drum circles, and free summer series. No tickets, no cover.`
  return {
    title: `${title} | Free Live Music`,
    description,
    alternates: { canonical: 'https://www.freelivemusic.co/traditions' },
    openGraph: { title, description, url: 'https://www.freelivemusic.co/traditions', siteName: 'Free Live Music', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: true, follow: true },
  }
}

export default async function TraditionsPage() {
  const all = await getAllResidencies()

  // Group by city
  const byCity = new Map<string, { name: string; slug: string; items: Residency[] }>()
  for (const r of all) {
    if (!r.cityCode) continue
    const metro = getMetroByCode(r.cityCode)
    const slug = cityCodeToSlug[r.cityCode]
    if (!metro || !slug) continue
    if (!byCity.has(r.cityCode)) byCity.set(r.cityCode, { name: metro.city, slug, items: [] })
    byCity.get(r.cityCode)!.items.push(r)
  }
  const cities = [...byCity.values()].sort((a, b) => a.name.localeCompare(b.name))

  // Group year-round weekly fixtures by day of week ("free music every Sunday")
  const byDay = new Map<string, Residency[]>()
  for (const r of all) {
    if (r.seasonal || !r.days) continue
    for (const d of r.days) {
      if (!byDay.has(d)) byDay.set(d, [])
      byDay.get(d)!.push(r)
    }
  }
  const daysWithMusic = DAY_ORDER.filter((d) => (byDay.get(d)?.length ?? 0) > 0)

  const yearRound = all.filter((r) => !r.seasonal).length
  const seasonal = all.length - yearRound

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Free Live Music Traditions Across America
          </h1>
          <p className="text-xl text-slate-600 mb-2">
            {all.length} free, recurring live-music traditions in {cities.length} cities.
          </p>
          <p className="text-slate-500">
            The stages, series, and rituals that put on live music for free, year after year —
            {yearRound} year-round and {seasonal} seasonal. No tickets, no cover. Each one verified against its official source.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-14">
        {/* By city */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Browse by city</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((c) => (
              <div key={c.slug} className="rounded-2xl border border-slate-200 bg-white p-5">
                <Link href={`/concerts/${c.slug}`} className="text-lg font-bold text-slate-900 hover:text-blue-700 transition">
                  {c.name}
                </Link>
                <ul className="mt-3 space-y-2">
                  {c.items.map((r) => (
                    <li key={r.id} className="text-sm">
                      <span className="text-slate-800">{r.venueName ?? r.seriesName}</span>
                      <span className="text-slate-400"> · {cadenceLabel(r)}{r.seasonal ? ' (seasonal)' : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* By day of week */}
        {daysWithMusic.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Free live music every day of the week</h2>
            <p className="text-slate-500 mb-6">Year-round traditions you can count on, sorted by the day they happen.</p>
            <div className="space-y-6">
              {daysWithMusic.map((d) => (
                <div key={d}>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-2">
                    Every {DAY_FULL[d]}
                  </h3>
                  <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
                    {(byDay.get(d) ?? []).map((r) => (
                      <li key={r.id} className="text-sm text-slate-600">
                        <span className="text-slate-800">{r.venueName ?? r.seriesName}</span>
                        {r.cityCode && (
                          <Link href={`/concerts/${cityCodeToSlug[r.cityCode] ?? ''}`} className="text-blue-600 hover:underline">
                            {' '}· {cityNameOf(r.cityCode)}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer note */}
        <section className="border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-500">
            Every listing here is a free, recurring tradition — no tickets and no cover — verified against the venue or
            organizer&apos;s own source. Seasonal series return each year; check the linked official site for the current
            schedule. Know one we&apos;re missing?{' '}
            <Link href="/" className="text-blue-600 hover:underline">Head home</Link> to submit it.
          </p>
        </section>
      </main>
    </div>
  )
}
