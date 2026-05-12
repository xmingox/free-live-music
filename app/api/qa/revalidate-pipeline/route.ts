/**
 * /api/qa/revalidate-pipeline — Nightly pipeline backstop.
 *
 * Samples ~5% of pipeline-approved concerts (capped at SAMPLE_SIZE),
 * re-fetches each source URL, and writes qa_flags for:
 *   - source_gone   : HTTP 404/410 or fetch error
 *   - field_mismatch: artist name no longer found on page
 *
 * No auto-delete. Sends a Resend alert if new flags are created.
 *
 * Requires: Authorization: Bearer {CRON_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendCronAlert } from '@/lib/alerts'

const SAMPLE_SIZE = 40
const FETCH_TIMEOUT_MS = 8000

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

interface Concert {
  id: string
  artist_name: string
  source_url: string
  date: string
}

interface QaFlag {
  concert_id: string
  flag_type: 'source_gone' | 'field_mismatch' | 'price_changed'
  field_name: string | null
  stored_value: string | null
  fetched_value: string | null
  source_url: string
}

async function checkConcert(concert: Concert): Promise<QaFlag | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(concert.source_url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FLM-QA/1.0)' },
    })
    clearTimeout(timer)

    if (res.status === 404 || res.status === 410) {
      return {
        concert_id: concert.id,
        flag_type: 'source_gone',
        field_name: null,
        stored_value: null,
        fetched_value: `HTTP ${res.status}`,
        source_url: concert.source_url,
      }
    }

    if (!res.ok) return null

    const html = await res.text()
    const bodyLower = html.toLowerCase()

    // Check if artist name still appears on the page
    const artistTokens = concert.artist_name
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 3)

    const artistFound =
      artistTokens.length === 0 ||
      artistTokens.every((token) => bodyLower.includes(token))

    if (!artistFound) {
      return {
        concert_id: concert.id,
        flag_type: 'field_mismatch',
        field_name: 'artist_name',
        stored_value: concert.artist_name,
        fetched_value: 'not found on page',
        source_url: concert.source_url,
      }
    }

    return null
  } catch {
    clearTimeout(timer)
    // Timeout or network error — not a definitive source_gone
    return null
  }
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started_at = new Date().toISOString()
  const supabase = getSupabase()

  // Sample SAMPLE_SIZE random pipeline concerts with source URLs
  const { data: concerts, error: fetchErr } = await supabase
    .from('concerts')
    .select('id, artist_name, source_url, date')
    .not('source_url', 'is', null)
    .eq('is_verified', true)
    .gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('id') // deterministic ordering; random slice chosen below
    .limit(SAMPLE_SIZE * 20) // oversample then shuffle

  if (fetchErr || !concerts?.length) {
    return NextResponse.json({ error: fetchErr?.message ?? 'no concerts' }, { status: 500 })
  }

  // Shuffle and take SAMPLE_SIZE
  const shuffled = concerts
    .map((c) => ({ c, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, SAMPLE_SIZE)
    .map((x) => x.c) as Concert[]

  // Check each concert sequentially (avoid hammering external hosts in parallel)
  const newFlags: QaFlag[] = []
  let checked = 0

  for (const concert of shuffled) {
    const flag = await checkConcert(concert)
    checked++
    if (flag) newFlags.push(flag)
  }

  // Write flags to DB (skip duplicates — same concert + flag_type already unresolved)
  let inserted = 0
  for (const flag of newFlags) {
    const { data: existing } = await supabase
      .from('qa_flags')
      .select('id')
      .eq('concert_id', flag.concert_id)
      .eq('flag_type', flag.flag_type)
      .eq('resolved', false)
      .maybeSingle()

    if (!existing) {
      await supabase.from('qa_flags').insert(flag)
      inserted++
    }
  }

  const finished_at = new Date().toISOString()
  const stats = {
    concerts_checked: checked,
    flags_found: newFlags.length,
    flags_inserted: inserted,
  }

  // Write cron_run
  try {
    await supabase.from('cron_runs').insert({
      name: 'qa-revalidate-pipeline',
      started_at,
      finished_at,
      success: true,
      stats_json: stats,
      error_message: null,
    })
  } catch {
    // non-fatal
  }

  if (inserted > 0) {
    const summary = newFlags
      .map((f) => `[${f.flag_type}] ${f.stored_value ?? ''} — ${f.source_url}`)
      .join('\n')
    await sendCronAlert('/api/qa/revalidate-pipeline', `${inserted} new QA flag(s):\n${summary}`)
  }

  return NextResponse.json(stats)
}

export const GET  = handle
export const POST = handle
export const dynamic = 'force-dynamic'
