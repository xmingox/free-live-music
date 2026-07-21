/**
 * /api/analytics/gsc — Google Search Console data pull.
 *
 * Fetches yesterday's search analytics (page + query dimensions) from the GSC
 * API and upserts into the search_metrics table.
 *
 * Accepts GET (Vercel Cron) and POST (manual trigger).
 * Requires: Authorization: Bearer {CRON_SECRET}
 *
 * Required env vars:
 *   CRON_SECRET
 *   GOOGLE_SERVICE_ACCOUNT_JSON — (preferred) full service-account JSON key; add the SA email as a Full user on the GSC property
 *   GOOGLE_CLIENT_ID       — OAuth 2.0 Desktop app client ID
 *   GOOGLE_CLIENT_SECRET   — OAuth 2.0 Desktop app client secret
 *   GOOGLE_REFRESH_TOKEN   — long-lived refresh token for the GSC property owner
 *   GSC_SITE_URL           — e.g. "sc-domain:freelivemusic.co"
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

async function getGscClient() {
  // Preferred: service account (no refresh-token expiry, no consent screen).
  // Set GOOGLE_SERVICE_ACCOUNT_JSON (or _KEY) to the full service-account JSON key, and add
  // the service account's email as a user on the Search Console property.
  const saKey = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (saKey) {
    let credentials: { client_email?: string; private_key?: string }
    try {
      credentials = JSON.parse(saKey)
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is set but is not valid JSON')
    }
    // Env vars often store the private key with escaped newlines — normalize them.
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n')
    }
    const auth = new google.auth.GoogleAuth({ credentials, scopes: [GSC_SCOPE] })
    return google.searchconsole({ version: 'v1', auth })
  }

  // Fallback: OAuth2 refresh token (the original path — kept so nothing breaks).
  const clientId     = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('No GSC credentials: set GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN')
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret)
  oauth2.setCredentials({ refresh_token: refreshToken })
  return google.searchconsole({ version: 'v1', auth: oauth2 })
}

// Allow up to 60s so a backfill chunk (multiple GSC day-pulls) can finish.
export const maxDuration = 60

// A backfill request supplies ?start=YYYY-MM-DD&end=YYYY-MM-DD. Absent = normal
// daily pull of yesterday.
function backfillRange(req: NextRequest): { start: string; end: string } | null {
  const sp = req.nextUrl.searchParams
  const start = sp.get('start')
  const end = sp.get('end')
  const iso = /^\d{4}-\d{2}-\d{2}$/
  if (start && end && iso.test(start) && iso.test(end)) return { start, end }
  return null
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const range = backfillRange(req)
  return range ? backfill(range.start, range.end) : run()
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const range = backfillRange(req)
  return range ? backfill(range.start, range.end) : run()
}

async function run() {
  const startedAt = new Date().toISOString()
  const cronRunId = crypto.randomUUID()

  // Write cron_runs start record
  await supabase.from('cron_runs').insert({
    id: cronRunId,
    name: 'gsc-pull',
    started_at: startedAt,
  })

  try {
    const siteUrl = process.env.GSC_SITE_URL
    if (!siteUrl) throw new Error('GSC_SITE_URL not set')

    const gsc = await getGscClient()

    // Pull yesterday's data (GSC data lags ~2 days; yesterday is reliably available)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const response = await gsc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: yesterday,
        endDate: yesterday,
        dimensions: ['page', 'query'],
        rowLimit: 25000,
        dataState: 'all',
      },
    })

    const rows = response.data.rows ?? []
    let upserted = 0
    let errors = 0

    // Batch upsert in chunks of 500
    const CHUNK = 500
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK).map(row => {
        const [page, query] = row.keys ?? ['', '']
        return {
          date: yesterday,
          page,
          query,
          impressions: row.impressions ?? 0,
          clicks: row.clicks ?? 0,
          ctr: row.ctr != null ? Number(row.ctr.toFixed(4)) : null,
          position: row.position != null ? Number(row.position.toFixed(2)) : null,
        }
      })

      const { error } = await supabase
        .from('search_metrics')
        .upsert(chunk, { onConflict: 'date,page,query' })

      if (error) {
        console.error('search_metrics upsert error:', error)
        errors += chunk.length
      } else {
        upserted += chunk.length
      }
    }

    const stats = { date: yesterday, rows: rows.length, upserted, errors }

    await supabase.from('cron_runs').update({
      finished_at: new Date().toISOString(),
      success: errors === 0,
      stats_json: stats,
    }).eq('id', cronRunId)

    return NextResponse.json({ ok: true, ...stats })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('GSC pull error:', message)

    await supabase.from('cron_runs').update({
      finished_at: new Date().toISOString(),
      success: false,
      error_message: message,
    }).eq('id', cronRunId)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}


// ── One-time historical backfill ──────────────────────────────────────────────
// Pulls [start..end] inclusive, one GSC day-query per date, upserting into
// search_metrics (idempotent via onConflict). Bounded to MAX_BACKFILL_DAYS per
// call to stay under the function timeout; returns `nextStart` when more remains
// so the caller can chain until it comes back null. Does NOT write cron_runs —
// this is a manual op, not the daily cron. Trigger:
//   curl -X POST ".../api/analytics/gsc?start=2026-05-19&end=2026-07-19" \
//        -H "Authorization: Bearer $CRON_SECRET"
const MAX_BACKFILL_DAYS = 14

function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().split('T')[0]
}

async function backfill(start: string, end: string) {
  try {
    const siteUrl = process.env.GSC_SITE_URL
    if (!siteUrl) throw new Error('GSC_SITE_URL not set')
    if (start > end) throw new Error('start must be <= end')

    const gsc = await getGscClient()

    // Bounded list of dates for this call.
    const dates: string[] = []
    let cur = start
    while (cur <= end && dates.length < MAX_BACKFILL_DAYS) {
      dates.push(cur)
      cur = addDays(cur, 1)
    }

    let totalRows = 0
    let totalUpserted = 0
    let totalErrors = 0

    for (const date of dates) {
      const response = await gsc.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: date,
          endDate: date,
          dimensions: ['page', 'query'],
          rowLimit: 25000,
          dataState: 'all',
        },
      })
      const rows = response.data.rows ?? []
      totalRows += rows.length

      const CHUNK = 500
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK).map(row => {
          const [page, query] = row.keys ?? ['', '']
          return {
            date,
            page,
            query,
            impressions: row.impressions ?? 0,
            clicks: row.clicks ?? 0,
            ctr: row.ctr != null ? Number(row.ctr.toFixed(4)) : null,
            position: row.position != null ? Number(row.position.toFixed(2)) : null,
          }
        })
        const { error } = await supabase
          .from('search_metrics')
          .upsert(chunk, { onConflict: 'date,page,query' })
        if (error) { totalErrors += chunk.length } else { totalUpserted += chunk.length }
      }
    }

    const lastDate = dates[dates.length - 1] ?? start
    const nextStart = lastDate < end ? addDays(lastDate, 1) : null

    return NextResponse.json({
      ok: true,
      mode: 'backfill',
      from: dates[0] ?? start,
      to: lastDate,
      days: dates.length,
      totalRows,
      totalUpserted,
      totalErrors,
      nextStart,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message, mode: 'backfill' }, { status: 500 })
  }
}
