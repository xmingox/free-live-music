import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Our Sources — Free Live Music',
  description: 'The venues, parks, and organizations behind the free concerts we list. Transparent curation from trusted sources across NYC, LA, SF, Chicago, Austin, Seattle, DC, Boston, Denver, and Portland.',
}

interface Source {
  name: string
  url: string
  description: string
}

interface Metro {
  code: string
  name: string
  sources: Source[]
}

const METROS: Metro[] = [
  {
    code: 'NYC',
    name: 'New York City',
    sources: [
      { name: 'NYC Parks', url: 'https://www.nycgovparks.org/events', description: 'Free concerts and events across all five boroughs' },
      { name: 'Lincoln Center', url: 'https://www.lincolncenter.org/series/midsummer-night-swing', description: 'Midsummer Night Swing, Out of Doors, and free plaza programming' },
      { name: 'SummerStage', url: 'https://cityparksfoundation.org/summerstage/', description: 'City Parks Foundation\'s flagship free concert series in Central Park and beyond' },
      { name: 'Naumburg Orchestral Concerts', url: 'https://www.naumburg.org', description: 'Free classical concerts in Central Park since 1905' },
      { name: 'Celebrate Brooklyn!', url: 'https://bricartsmedia.org/performing-arts/bric-celebrate-brooklyn-festival', description: 'BRIC\'s free performing arts festival at Prospect Park Bandshell' },
    ],
  },
  {
    code: 'LA',
    name: 'Los Angeles',
    sources: [
      { name: 'Grand Performances', url: 'https://grandperformances.org', description: 'Free world-class performances at California Plaza in downtown LA' },
      { name: 'Levitt LA', url: 'https://levittla.org', description: '50 free concerts a season at MacArthur Park' },
      { name: 'Getty Center', url: 'https://www.getty.edu/visit/events/', description: 'Free concerts and cultural events at the Getty' },
      { name: 'LACMA', url: 'https://www.lacma.org/programs/music', description: 'Friday night jazz and other free music programs' },
      { name: 'Marina del Rey', url: 'https://www.marinadelrey.com/events', description: 'Free summer concerts by the water' },
      { name: 'Long Beach Parks', url: 'https://www.longbeach.gov/park/events/', description: 'Free outdoor concerts and festivals' },
      { name: 'Pasadena Concerts', url: 'https://www.cityofpasadena.net/parks/', description: 'Rose Bowl and Levitt Pavilion free summer series' },
      { name: 'Skirball Cultural Center', url: 'https://www.skirball.org/programs', description: 'Free community programs and outdoor events' },
    ],
  },
  {
    code: 'SF',
    name: 'San Francisco',
    sources: [
      { name: 'Stern Grove Festival', url: 'https://www.sterngrove.org', description: 'Free Sunday concerts in a stunning eucalyptus grove since 1938' },
      { name: 'SF Parks', url: 'https://sfrecpark.org/events/', description: 'Free performances across Golden Gate Park and city parks' },
      { name: 'Outside Lands Free Stages', url: 'https://www.sfoutsidelands.com', description: 'Free programming around the Outside Lands footprint' },
    ],
  },
  {
    code: 'CHI',
    name: 'Chicago',
    sources: [
      { name: 'Chicago Park District', url: 'https://www.chicagoparkdistrict.com/events', description: 'Free concerts and festivals across hundreds of city parks' },
      { name: 'Millennium Park', url: 'https://www.chicago.gov/city/en/depts/dca/supp_info/millennium_park_events.html', description: 'Free summer concert series at the Jay Pritzker Pavilion' },
      { name: 'Chicago Cultural Center', url: 'https://www.chicago.gov/city/en/depts/dca/supp_info/cultural_center.html', description: 'Free concerts and exhibitions in a stunning landmark building' },
    ],
  },
  {
    code: 'AUS',
    name: 'Austin',
    sources: [
      { name: 'Austin Parks & Recreation', url: 'https://www.austintexas.gov/department/parks-and-recreation', description: 'Free outdoor concerts and community events' },
      { name: 'Austin City Limits Free Events', url: 'https://www.aclfestival.com', description: 'Free programming around the ACL Festival' },
      { name: 'Blues on the Green', url: 'https://austinsymphony.org/bluesonthegreen/', description: 'Free outdoor concerts at Zilker Park' },
    ],
  },
  {
    code: 'SEA',
    name: 'Seattle',
    sources: [
      { name: 'Seattle Parks & Recreation', url: 'https://www.seattle.gov/parks/events', description: 'Free concerts and events in parks across the city' },
      { name: 'Out to Lunch', url: 'https://downtownseattle.org/events/out-to-lunch/', description: 'Free weekday lunchtime concerts in downtown plazas' },
      { name: 'Concerts at the Mural', url: 'https://www.seattlecenter.com/events', description: 'Free outdoor concerts at Seattle Center' },
    ],
  },
  {
    code: 'DC',
    name: 'Washington DC',
    sources: [
      { name: 'DC Parks & Recreation', url: 'https://dpr.dc.gov/events', description: 'Free concerts and events in parks across the District' },
      { name: 'Kennedy Center Millennium Stage', url: 'https://www.kennedy-center.org/millennium-stage/', description: 'Free daily performances at 6pm — every single day' },
      { name: 'National Mall Events', url: 'https://www.nps.gov/nama/planyourvisit/events.htm', description: 'Free concerts and festivals on the National Mall' },
      { name: 'Smithsonian Folklife Festival', url: 'https://festival.si.edu', description: 'Free annual cultural festival on the National Mall' },
    ],
  },
  {
    code: 'BOS',
    name: 'Boston',
    sources: [
      { name: 'Boston Parks', url: 'https://www.boston.gov/departments/parks-and-recreation', description: 'Free outdoor concerts and events across Boston\'s parks' },
      { name: 'Boston Pops on the Esplanade', url: 'https://www.bso.org/brands/pops/boston-pops-esplanade.aspx', description: 'Free summer concerts on the Charles River Esplanade' },
      { name: 'City Hall Plaza Events', url: 'https://www.boston.gov/event', description: 'Free concerts and festivals at City Hall Plaza' },
    ],
  },
  {
    code: 'DEN',
    name: 'Denver',
    sources: [
      { name: 'Denver Parks & Recreation', url: 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Parks-Recreation', description: 'Free concerts and events across Denver\'s park system' },
      { name: 'Levitt Denver', url: 'https://levittdenver.org', description: '50 free concerts a season at Ruby Hill Park' },
      { name: 'Denver Arts Week', url: 'https://www.denver.org/arts-culture/', description: 'Free arts and music events throughout the city' },
    ],
  },
  {
    code: 'PDX',
    name: 'Portland',
    sources: [
      { name: 'Portland Parks & Recreation', url: 'https://www.portland.gov/parks/events', description: 'Free outdoor concerts and events in Portland\'s parks' },
      { name: 'Oregon Symphony Free Events', url: 'https://www.orsymphony.org', description: 'Free community concerts and outdoor performances' },
      { name: 'Waterfront Blues Festival', url: 'https://www.waterfrontbluesfest.com', description: 'Annual blues festival with free tiers along the Willamette' },
    ],
  },
]

export default function SourcesPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-slate-950 to-pink-950/50" />
        <div className="relative max-w-4xl mx-auto px-4 py-10 sm:py-14">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-6 transition"
          >
            ← Back to concerts
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-lg shadow-lg">
              🎵
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Free Live Music
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Our Sources
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl">
            Every concert on this site comes from a trusted public source — city parks, cultural institutions, and established free concert series. We never list paid events.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-10">
          <h2 className="text-lg font-semibold text-white mb-2">How we curate</h2>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li className="flex gap-2"><span className="text-violet-400 flex-shrink-0">→</span> We pull directly from official venue, park, and organization websites</li>
            <li className="flex gap-2"><span className="text-violet-400 flex-shrink-0">→</span> Every event is verified as free admission — no tickets, no cover charge</li>
            <li className="flex gap-2"><span className="text-violet-400 flex-shrink-0">→</span> We review community submissions before publishing</li>
            <li className="flex gap-2"><span className="text-violet-400 flex-shrink-0">→</span> We're not affiliated with any venue and have no financial relationship with our sources</li>
          </ul>
        </div>

        <div className="space-y-10">
          {METROS.map((metro) => (
            <section key={metro.code}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-800 px-2 py-1 rounded">
                  {metro.code}
                </span>
                <h2 className="text-xl font-bold text-white">{metro.name}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {metro.sources.map((source) => (
                  <a
                    key={source.name}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg p-4 transition"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-white group-hover:text-violet-300 transition">
                        {source.name}
                      </span>
                      <span className="text-slate-600 group-hover:text-slate-400 transition flex-shrink-0 mt-0.5">
                        ↗
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{source.description}</p>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-violet-950/60 to-pink-950/40 border border-violet-800/40 rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Know a free show we're missing?</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            We rely on the community to help us find great free music. If you know of a series or venue we should add, let us know.
          </p>
          <Link
            href="/?submit=true"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white font-semibold rounded-lg transition"
          >
            Share a Free Event
          </Link>
        </div>
      </main>

      <footer className="mt-16 border-t border-slate-800 py-8 text-center text-slate-600 text-sm">
        <Link href="/" className="hover:text-slate-400 transition">Free Live Music</Link>
        {' · '}Free Live Music Across America · All shows free admission
      </footer>
    </div>
  )
}
