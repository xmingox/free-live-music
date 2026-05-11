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
 *   GOOGLE_SERVICE_ACCOUNT_JSON   — full JSON of the service account key file
 *   GSC_SITE_URL                  — e.g. "sc-domain:freelivemusic.co"
 *
 * Service account setup:
 *   1. Create a service account in Google Cloud Console
 *   2. Enable the Google Search Console API
 *   3. Add the service account email as a "Full" user in GSC → Settings → Users
 *   4. Download the JSON key and set GOOGLE_SERVICE_ACCOUNT_JSON to its contents
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

async function getGscClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set')

  const credentials = JSON.parse(keyJson)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })
  return google.searchconsole({ version: 'v1', auth })
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return run()
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return run()
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
        dataState: 'final',
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
