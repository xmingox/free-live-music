/**
 * /api/import/search — Generic search-based concert importer.
 *
 * Accepts both GET (Vercel Cron) and POST (manual trigger).
 * Requires:  Authorization: Bearer {CRON_SECRET}
 *
 * Query params:
 *   ?cityCode=OMA   Run a specific city only.
 *                   Omit to use weekly rotation across all metros that do NOT
 *                   have dedicated structured importers.
 *
 * Rotation strategy:
 *   All eligible metros are sorted alphabetically by code. They are split into
 *   batches of BATCH_SIZE cities each. Each week's UTC wall-clock week number
 *   (Math.floor(Date.now() / WEEK_MS)) selects the batch to run, cycling back
 *   to week 0 after the last batch is exhausted.
 *
 * Writes a `cron_runs` record on completion with stats.
 *
 * Vercel timeout budget: 300 s max. At ~10 s/city the route can safely handle
 *   ~25 cities per invocation (BATCH_SIZE).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import metros from '@/lib/metros.json'
import { genericSearchImport } from '@/lib/importers/_generic-search'

// ── Config ────────────────────────────────────────────────────────────────────

const BATCH_SIZE = 25
const WEEK_MS    = 7 * 24 * 60 * 60 * 1000

/**
 * City codes that have dedicated structured importers in lib/importers/.
 * These metros are excluded from the generic search rotation so we don't
 * double-submit events already covered by their own importer.
 *
 * When a new structured importer is added, add its city code here.
 */
const STRUCTURED_IMPORTER_CODES = new Set([
  // Core cities with full importers
  'NYC', 'LA', 'SF', 'CHI', 'AUS', 'SEA', 'DC', 'BOS', 'DEN', 'PDX',
  // LA sub-cities and OC cities handled by existing importers in lib/importers/
  // (glendale, torrance, santa-monica, culver-city, beverly-hills, alhambra,
  //  arcadia, noho, thousand-oaks, simi-valley, camarillo, hermosa-beach,
  //  playa-vista, manhattan-beach, el-segundo, redondo-beach, long-beach,
  //  pasadena, marina-del-rey, santa-clarita, oc-cities, oc-parks,
  //  huntington-beach-pier, mission-viejo, rancho-santa-margarita, brea,
  //  costa-mesa, dana-point, san-clemente, la-palma, irvine-symphony,
  //  pacific-symphony — all under the LA / ANA metro codes)
  'ANA',
])

// ── Auth ──────────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

// ── Metro helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the sorted list of metro codes eligible for the generic search
 * importer (i.e. not in STRUCTURED_IMPORTER_CODES).
 */
function eligibleCodes(): string[] {
  return (metros as any).metros
    .map((m: any) => m.code as string)
    .filter((code: string) => !STRUCTURED_IMPORTER_CODES.has(code))
    .sort()
}

/**
 * Determine which batch of codes to run this week.
 */
function currentBatch(): string[] {
  const codes   = eligibleCodes()
  const batches = Math.ceil(codes.length / BATCH_SIZE)
  const batchIndex = Math.floor(Date.now() / WEEK_MS) % batches
  const start  = batchIndex * BATCH_SIZE
  return codes.slice(start, start + BATCH_SIZE)
}

// ── Supabase ──────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function writeCronRun(record: {
  name: string
  started_at: string
  finished_at: string
  success: boolean
  stats_json: object
  error_message: string | null
}) {
  try {
    const supabase = getSupabase()
    await supabase.from('cron_runs').insert(record)
  } catch (err) {
    // Non-fatal — if cron_runs table doesn't exist yet, just log and continue.
    console.error('[/api/import/search] cron_runs insert failed:', err)
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started_at = new Date().toISOString()

  // Determine which cities to process
  const { searchParams } = new URL(req.url)
  const specificCode = searchParams.get('cityCode')?.toUpperCase()

  let citiesToProcess: string[]
  if (specificCode) {
    citiesToProcess = [specificCode]
  } else {
    citiesToProcess = currentBatch()
  }

  // Run imports
  let totalSubmissions = 0
  const allErrors: string[] = []

  for (const code of citiesToProcess) {
    try {
      const result = await genericSearchImport(code)
      totalSubmissions += result.submissions_created
      if (result.errors.length > 0) {
        allErrors.push(...result.errors.map(e => `[${code}] ${e}`))
      }
      console.log(
        `[/api/import/search] ${code}: ${result.submissions_created} submissions, ${result.errors.length} errors`,
      )
    } catch (err) {
      const msg = `[${code}] importer threw: ${err}`
      console.error('[/api/import/search]', msg)
      allErrors.push(msg)
    }
  }

  const finished_at = new Date().toISOString()
  const success = allErrors.length === 0

  const stats = {
    cities_processed:    citiesToProcess.length,
    submissions_created: totalSubmissions,
    errors:              allErrors,
  }

  await writeCronRun({
    name:          'search-import',
    started_at,
    finished_at,
    success,
    stats_json:    stats,
    error_message: success ? null : allErrors.slice(0, 3).join('; '),
  })

  return NextResponse.json(stats)
}

export const GET  = handle
export const POST = handle

// Opt out of Next.js response caching — this route mutates the DB.
export const dynamic = 'force-dynamic'
