/**
 * /api/maintenance/source-urls
 *
 * Runs weekly (Sunday 03:00 UTC) via Vercel Cron.
 * HEAD-checks every distinct source_url on upcoming concerts.
 *
 * Actions by status:
 *   0 (DNS/timeout) or 404/410 — domain dead or page gone: delete all upcoming
 *     concerts pointing at that URL and log a suppression
 *   403             — bot-blocking, page exists: skip
 *   5xx             — server error, transient: skip
 *   2xx/3xx         — healthy: skip
 *
 * Writes a cron_runs record on completion.
 *
 * Requires: Authorization: Bearer {CRON_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Config ────────────────────────────────────────────────────────────────────

const BATCH_SIZE     = 10
const BATCH_DELAY_MS = 300
const TIMEOUT_MS     = 10_000
const USER_AGENT     = 'Mozilla/5.0 (compatible; freelivemusic-bot/1.0)'

// ── Auth ──────────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

// ── Supabase ──────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── URL health check ──────────────────────────────────────────────────────────

/** Returns HTTP status, or 0 on DNS failure / timeout. */
async function checkUrl(url: string): Promise<number> {
  const opts = {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'follow' as const,
  }
  try {
    const res = await fetch(url, { method: 'HEAD', ...opts })
    return res.status
  } catch {
    // Some servers reject HEAD — fall back to GET (body not read)
    try {
      const res = await fetch(url, { method: 'GET', ...opts })
      return res.status
    } catch {
      return 0 // DNS failure, timeout, or connection refused
    }
  }
}

/** True if the URL is definitively dead (should trigger concert deletion). */
function isDead(status: number): boolean {
  return status === 0 || status === 404 || status === 410
}

// ── cron_runs helper ──────────────────────────────────────────────────────────

async function writeCronRun(record: {
  name: string
  started_at: string
  finished_at: string
  success: boolean
  stats_json: object
  error_message: string | null
}): Promise<void> {
  try {
    await supabase.from('cron_runs').insert(record)
  } catch (err) {
    console.error('[source-urls] cron_runs insert failed:', err)
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started_at = new Date().toISOString()
  const today = new Date().toISOString().slice(0, 10)

  try {
    // 1. Fetch all distinct source URLs from upcoming concerts
    const { data, error } = await supabase
      .from('concerts')
      .select('source_url, source_name')
      .gte('date', today)
      .not('source_url', 'is', null)

    if (error) throw error

    // Dedupe by URL, track source_name and concert count
    const urlMap = new Map<string, { source_name: string; count: number }>()
    for (const row of data ?? []) {
      if (!row.source_url) continue
      if (!urlMap.has(row.source_url)) {
        urlMap.set(row.source_url, { source_name: row.source_name ?? 'unknown', count: 0 })
      }
      urlMap.get(row.source_url)!.count++
    }

    const urls = [...urlMap.entries()]
    console.log(`[source-urls] Checking ${urls.length} distinct source URLs`)

    const stats = {
      total_checked:    0,
      ok:               0,
      skipped_403:      0,
      skipped_5xx:      0,
      dead_urls:        0,
      concerts_deleted: 0,
      dead_details:     [] as { url: string; status: number; source_name: string; concerts: number }[],
    }

    // 2. Check in batches
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE)

      await Promise.allSettled(batch.map(async ([url, meta]) => {
        const status = await checkUrl(url)
        stats.total_checked++

        if (isDead(status)) {
          // Delete all upcoming concerts with this source URL
          const { data: deleted, error: delErr } = await supabase
            .from('concerts')
            .delete()
            .eq('source_url', url)
            .gte('date', today)
            .select('id')

          const deletedCount = deleted?.length ?? 0
          stats.dead_urls++
          stats.concerts_deleted += deletedCount

          const statusLabel = status === 0 ? 'DNS/timeout' : `HTTP ${status}`
          console.log(
            `[source-urls] DEAD [${statusLabel}] ${meta.source_name} — deleted ${deletedCount} concerts | ${url}`
          )

          if (delErr) {
            console.error(`[source-urls] delete failed for ${url}:`, delErr.message)
          }

          stats.dead_details.push({
            url,
            status,
            source_name: meta.source_name,
            concerts:    deletedCount,
          })

          // Add suppression so future imports don't re-insert these concerts
          if (deletedCount > 0) {
            await supabase.from('crawl_suppressions').insert({
              pattern:     url,
              match_field: 'source_url',
              match_type:  'exact',
              reason:      `source URL dead (${statusLabel}) — auto-suppressed by source-urls cron ${today}`,
              added_by:    'source-urls-cron',
            }).then(({ error: supErr }) => {
              if (supErr && !supErr.message.includes('duplicate')) {
                console.error(`[source-urls] suppression insert failed:`, supErr.message)
              }
            })
          }

        } else if (status === 403) {
          stats.skipped_403++
        } else if (status >= 500) {
          stats.skipped_5xx++
          console.log(`[source-urls] 5xx [${status}] ${meta.source_name} — skipping | ${url}`)
        } else {
          stats.ok++
        }
      }))

      if (i + BATCH_SIZE < urls.length) {
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
      }
    }

    const finished_at = new Date().toISOString()
    await writeCronRun({
      name:          'source-urls',
      started_at,
      finished_at,
      success:       true,
      stats_json:    stats,
      error_message: null,
    })

    console.log('[source-urls]', stats)
    return NextResponse.json(stats)

  } catch (err) {
    const finished_at = new Date().toISOString()
    const msg = String(err)
    console.error('[source-urls] fatal:', err)

    await writeCronRun({
      name:          'source-urls',
      started_at,
      finished_at,
      success:       false,
      stats_json:    {},
      error_message: msg,
    })

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export const GET  = handle
export const POST = handle
export const dynamic = 'force-dynamic'
