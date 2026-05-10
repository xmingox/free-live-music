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
import { getIrvineConcertShows } from './irvine-concerts'
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

const ASYNC_SOURCES = [fetchNYCParks, scrapeGrandPerformances, getLevittLAShows, getLaPalmaShows]
const SYNC_SOURCES  = [getWashingtonDCShows, getBostonShows, getDenverShows, getPortlandShows, getAustinShows, getSeattleShows, getChicagoShows, getSternGroveShows, getMarinaDelReyShows, getTorranceShows, getSantaClaritaShows, getGlendaleShows, getBeverlyHillsShows, getAlhambraShows, getNoHoShows, getArcadiaShows, getThousandOaksShows, getSimiValleyShows, getCamarilloShows, getHermosaBeachShows, getPlayaVistaShows, getSantaMonicaShows, getCulverCityShows, getManhattanBeachShows, getElSegundoShows, getRedondoBeachShows, getIrvineConcertShows, getIrvineSymphonyShows, getHuntingtonBeachPierShows, getMissionViejoShows, getRanchoSantaMargaritaShows, getBreaConcertShows, getCostaMesaShows, getDanaPointShows, getSanClementeShows, getPacificSymphonyShows, getSymphonyInTheCitiesShows, scrapeLincolnCenter, getOCCitiesShows, getSkirballShows, getPasadenaShows, getLongBeachShows, getOCParksShows, getSummerStageShows, getGettyShows, getLACMAShows, getLACMALatinShows, getNaumburgShows, getCelebrateBrooklynShows, getNYPhilShows, getBryantParkShows, getHudsonYardsShows]

export async function runImport(): Promise<{ inserted: number; skipped: number; suppressed: number; errors: string[] }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  let inserted = 0
  let skipped  = 0
  const errors: string[] = []

  const suppressions = await loadSuppressions(supabase)

  const allRows: ImportRow[] = []

  for (const fetcher of SYNC_SOURCES) {
    allRows.push(...fetcher())
  }

  const nycParksRows: ImportRow[] = []

  for (const fetcher of ASYNC_SOURCES) {
    try {
      const rows = await fetcher()
      if (fetcher.name === 'fetchNYCParks') nycParksRows.push(...rows)
      allRows.push(...rows)
    } catch (err) {
      errors.push(`Fetch failed (${fetcher.name}): ${err}`)
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

  return { inserted, skipped, suppressed: suppressedCount, errors }
}
