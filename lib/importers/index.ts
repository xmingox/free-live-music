import { createClient } from '@supabase/supabase-js'
import { fetchNYCParks } from './nyc-parks'
import { getSummerStageShows } from './summerstage'
import { scrapeGrandPerformances } from './grand-performances'
import { getGettyShows } from './getty'
import { getLACMAShows } from './lacma'
import { getNaumburgShows } from './naumburg'
import { getCelebrateBrooklynShows } from './celebrate-brooklyn'
import { getNYPhilShows } from './ny-philharmonic'
import { getLACMALatinShows } from './lacma-latin'
import { getBryantParkShows } from './bryant-park'
import { getLevittLAShows } from './levitt-la'
import { getHudsonYardsShows } from './hudson-yards'
import { getOCParksShows } from './oc-parks'
import { getLongBeachShows } from './long-beach'
import { getPasadenaShows } from './pasadena'
import { getSkirballShows } from './skirball'
import { getOCCitiesShows } from './oc-cities'
import { getMarinaDelReyShows } from './marina-del-rey'
import { getTorranceShows } from './torrance'
import { getSantaClaritaShows } from './santa-clarita'
import { getGlendaleShows } from './glendale'
import { getBeverlyHillsShows } from './beverly-hills'
import { getAlhambraShows } from './alhambra'
import { getNoHoShows } from './noho'
import { getArcadiaShows } from './arcadia'
import { getThousandOaksShows } from './thousand-oaks'
import { getSimiValleyShows } from './simi-valley'
import { getCamarilloShows } from './camarillo'
import { getHuntingtonBeachPierShows } from './huntington-beach-pier'
import { getMissionViejoShows } from './mission-viejo'
import { getRanchoSantaMargaritaShows } from './rancho-santa-margarita'
import { getBreaConcertShows } from './brea'
import { getCostaMesaShows } from './costa-mesa'
import { getDanaPointShows } from './dana-point'
import { getSanClementeShows } from './san-clemente'
import { getLaPalmaShows } from './la-palma'
import { getHermosaBeachShows } from './hermosa-beach'
import { getPlayaVistaShows } from './playa-vista'
import { getSantaMonicaShows } from './santa-monica'
import { getCulverCityShows } from './culver-city'
import { getManhattanBeachShows } from './manhattan-beach'
import { getElSegundoShows } from './el-segundo'
import { getRedondoBeachShows } from './redondo-beach'
import { getIrvineSymphonyShows } from './irvine-symphony'
import { getPacificSymphonyShows, getSymphonyInTheCitiesShows } from './pacific-symphony'
import { scrapeLincolnCenter } from './lincoln-center'
import { getSternGroveShows } from './stern-grove'
import { getChicagoShows } from './chicago'
import { getAustinShows } from './austin'
import { getWashingtonDCShows } from './washington-dc'
import { getBostonShows } from './boston'
import { getDenverShows } from './denver'
import { getPortlandShows } from './portland'
import { getSeattleShows } from './seattle'
import type { ImportRow } from './types'
import { loadSuppressions, filterSuppressed } from './suppression'

// Use explicit names — function.name gets minified in production builds
const ASYNC_SOURCES: Array<{ label: string; fn: () => Promise<ImportRow[]> }> = [
  { label: 'fetchNYCParks',           fn: fetchNYCParks },
  { label: 'scrapeGrandPerformances', fn: scrapeGrandPerformances },
  { label: 'getLevittLAShows',        fn: getLevittLAShows },
  { label: 'getLaPalmaShows',         fn: getLaPalmaShows },
]
// Use explicit names — function.name gets minified in production builds
const SYNC_SOURCES: Array<{ label: string; fn: () => ImportRow[] }> = [
  { label: 'getWashingtonDCShows',         fn: getWashingtonDCShows },
  { label: 'getBostonShows',               fn: getBostonShows },
  { label: 'getDenverShows',               fn: getDenverShows },
  { label: 'getPortlandShows',             fn: getPortlandShows },
  { label: 'getAustinShows',               fn: getAustinShows },
  { label: 'getSeattleShows',              fn: getSeattleShows },
  { label: 'getChicagoShows',              fn: getChicagoShows },
  { label: 'getSternGroveShows',           fn: getSternGroveShows },
  { label: 'getMarinaDelReyShows',         fn: getMarinaDelReyShows },
  { label: 'getTorranceShows',             fn: getTorranceShows },
  { label: 'getSantaClaritaShows',         fn: getSantaClaritaShows },
  { label: 'getGlendaleShows',             fn: getGlendaleShows },
  { label: 'getBeverlyHillsShows',         fn: getBeverlyHillsShows },
  { label: 'getAlhambraShows',             fn: getAlhambraShows },
  { label: 'getNoHoShows',                 fn: getNoHoShows },
  { label: 'getArcadiaShows',              fn: getArcadiaShows },
  { label: 'getThousandOaksShows',         fn: getThousandOaksShows },
  { label: 'getSimiValleyShows',           fn: getSimiValleyShows },
  { label: 'getCamarilloShows',            fn: getCamarilloShows },
  { label: 'getHermosaBeachShows',         fn: getHermosaBeachShows },
  { label: 'getPlayaVistaShows',           fn: getPlayaVistaShows },
  { label: 'getSantaMonicaShows',          fn: getSantaMonicaShows },
  { label: 'getCulverCityShows',           fn: getCulverCityShows },
  { label: 'getManhattanBeachShows',       fn: getManhattanBeachShows },
  { label: 'getElSegundoShows',            fn: getElSegundoShows },
  { label: 'getRedondoBeachShows',         fn: getRedondoBeachShows },
  { label: 'getIrvineSymphonyShows',       fn: getIrvineSymphonyShows },
  { label: 'getHuntingtonBeachPierShows',  fn: getHuntingtonBeachPierShows },
  { label: 'getMissionViejoShows',         fn: getMissionViejoShows },
  { label: 'getRanchoSantaMargaritaShows', fn: getRanchoSantaMargaritaShows },
  { label: 'getBreaConcertShows',          fn: getBreaConcertShows },
  { label: 'getCostaMesaShows',            fn: getCostaMesaShows },
  { label: 'getDanaPointShows',            fn: getDanaPointShows },
  { label: 'getSanClementeShows',          fn: getSanClementeShows },
  { label: 'getPacificSymphonyShows',      fn: getPacificSymphonyShows },
  { label: 'getSymphonyInTheCitiesShows',  fn: getSymphonyInTheCitiesShows },
  { label: 'scrapeLincolnCenter',          fn: scrapeLincolnCenter },
  { label: 'getOCCitiesShows',             fn: getOCCitiesShows },
  { label: 'getSkirballShows',             fn: getSkirballShows },
  { label: 'getPasadenaShows',             fn: getPasadenaShows },
  { label: 'getLongBeachShows',            fn: getLongBeachShows },
  { label: 'getOCParksShows',              fn: getOCParksShows },
  { label: 'getSummerStageShows',          fn: getSummerStageShows },
  { label: 'getGettyShows',               fn: getGettyShows },
  { label: 'getLACMAShows',               fn: getLACMAShows },
  { label: 'getLACMALatinShows',          fn: getLACMALatinShows },
  { label: 'getNaumburgShows',             fn: getNaumburgShows },
  { label: 'getCelebrateBrooklynShows',    fn: getCelebrateBrooklynShows },
  { label: 'getNYPhilShows',              fn: getNYPhilShows },
  { label: 'getBryantParkShows',          fn: getBryantParkShows },
  { label: 'getHudsonYardsShows',         fn: getHudsonYardsShows },
]

export async function runImport(): Promise<{ inserted: number; skipped: number; suppressed: number; errors: string[]; per_source: Record<string, number> }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  let inserted = 0
  let skipped  = 0
  const errors: string[] = []
  const perSource: Record<string, number> = {}

  const suppressions = await loadSuppressions(supabase)

  const allRows: ImportRow[] = []

  for (const { label, fn } of SYNC_SOURCES) {
    const rows = fn()
    perSource[label] = rows.length
    allRows.push(...rows)
  }

  const nycParksRows: ImportRow[] = []

  for (const { label, fn } of ASYNC_SOURCES) {
    try {
      const rows = await fn()
      perSource[label] = rows.length
      if (label === 'fetchNYCParks') nycParksRows.push(...rows)
      allRows.push(...rows)
    } catch (err) {
      perSource[label] = -1
      const cause = (err instanceof Error && (err as NodeJS.ErrnoException).cause)
        ? ` — cause: ${(err as NodeJS.ErrnoException).cause}`
        : ''
      errors.push(`Fetch failed (${label}): ${err}${cause}`)
    }
  }

  const { kept, suppressed: suppressedCount } = filterSuppressed(allRows, suppressions)
  if (suppressedCount > 0) {
    console.log(`[runImport] suppressed ${suppressedCount} rows`)
  }

  for (const row of kept as ImportRow[]) {
    const { error } = await supabase
      .from('concerts')
      .insert(row)

    if (error) {
      if (error.code === '23505') {
        skipped++
      } else {
        if (row.source_name === 'NYC Parks') {
          console.error('[NYC Parks insert error]', error.code, error.message, JSON.stringify(row).slice(0, 200))
        }
        errors.push(`Insert error: ${error.message} — ${JSON.stringify(row).slice(0, 120)}`)
      }
    } else {
      inserted++
    }
  }

  return { inserted, skipped, suppressed: suppressedCount, errors, per_source: perSource }
}
