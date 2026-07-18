/**
 * /api/maintenance/noindex-audit — Weekly venue indexability audit.
 *
 * Categorises every venue by its indexing tier and logs a summary to cron_runs.
 * Optionally emails the report via Resend when RESEND_API_KEY is set.
 *
 * Tiers (in descending quality order):
 *   verified   — has upcoming shows (highest signal)
 *   scored     — music_score > 0, no upcoming shows
 *   scheduled  — music_schedule IS NOT NULL, score ≤ 0
 *   thin       — score == 0, no schedule, no shows (in sitemap but borderline)
 *   soft       — score [-1..-20], no schedule (NOT in sitemap, not yet noindexed)
 *   noindexed  — score < -20, no schedule (noindex meta applied, excluded from sitemap)
 *
 * Accepts GET (Vercel Cron) and POST (manual trigger).
 * Requires: Authorization: Bearer {CRON_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUsToday } from '@/lib/timezone'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return run()
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return run()
}

type VenueTier = 'verified' | 'scored' | 'scheduled' | 'thin' | 'soft' | 'noindexed'

interface AuditStats {
  total: number
  byTier: Record<VenueTier, number>
  reclaimable: number   // soft/noindexed venues that got a new upcoming show in last 7 days
  noindexedByCity: Record<string, number>
  softByCity: Record<string, number>
  sitemap: { included: number; excluded: number }
}

async function run() {
  const cronRunId = crypto.randomUUID()
  await supabase.from('cron_runs').insert({
    id: cronRunId,
    name: 'noindex-audit',
    started_at: new Date().toISOString(),
  })

  try {
    const today = getUsToday()

    // Fetch all venues with score + schedule
    const { data: venues, error: venueError } = await supabase
      .from('venues')
      .select('id, city, music_score, music_schedule')

    if (venueError) throw new Error(venueError.message)
    if (!venues?.length) throw new Error('No venues returned')

    // Fetch venue IDs that have at least one upcoming show
    const { data: upcomingRows } = await supabase
      .from('concerts')
      .select('venue_id')
      .gte('date', today)
      .eq('is_verified', true)
      .not('venue_id', 'is', null)

    const venuesWithShows = new Set((upcomingRows ?? []).map(r => r.venue_id as string))

    // Fetch venue IDs that got a new upcoming show in the last 7 days (reclaimable)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: recentlyAddedRows } = await supabase
      .from('concerts')
      .select('venue_id')
      .gte('date', today)
      .gte('created_at', sevenDaysAgo)
      .eq('is_verified', true)
      .not('venue_id', 'is', null)

    const recentlyAddedVenues = new Set((recentlyAddedRows ?? []).map(r => r.venue_id as string))

    const stats: AuditStats = {
      total: venues.length,
      byTier: { verified: 0, scored: 0, scheduled: 0, thin: 0, soft: 0, noindexed: 0 },
      reclaimable: 0,
      noindexedByCity: {},
      softByCity: {},
      sitemap: { included: 0, excluded: 0 },
    }

    for (const v of venues) {
      const score = v.music_score ?? 0
      const hasSchedule = v.music_schedule != null
      const hasShows = venuesWithShows.has(v.id)

      // Tier classification
      let tier: VenueTier
      if (hasShows) {
        tier = 'verified'
      } else if (score > 0) {
        tier = 'scored'
      } else if (hasSchedule) {
        tier = 'scheduled'
      } else if (score === 0) {
        tier = 'thin'
      } else if (score >= -20) {
        // -1 to -20: soft exclude
        tier = 'soft'
      } else {
        // < -20 with no schedule: noindex meta applied
        tier = 'noindexed'
      }

      stats.byTier[tier]++

      // Sitemap inclusion: score >= 0 OR has schedule
      if (score >= 0 || hasSchedule) {
        stats.sitemap.included++
      } else {
        stats.sitemap.excluded++
      }

      // Track noindexed + soft by city for diagnostics
      if (tier === 'noindexed') {
        stats.noindexedByCity[v.city] = (stats.noindexedByCity[v.city] ?? 0) + 1
      } else if (tier === 'soft') {
        stats.softByCity[v.city] = (stats.softByCity[v.city] ?? 0) + 1
      }

      // Reclaimable: currently below-par but got a new upcoming show in last 7 days
      if ((tier === 'soft' || tier === 'noindexed') && recentlyAddedVenues.has(v.id)) {
        stats.reclaimable++
      }
    }

    // Sort city maps by count for readability
    stats.noindexedByCity = Object.fromEntries(
      Object.entries(stats.noindexedByCity).sort((a, b) => b[1] - a[1]).slice(0, 20)
    )
    stats.softByCity = Object.fromEntries(
      Object.entries(stats.softByCity).sort((a, b) => b[1] - a[1]).slice(0, 20)
    )

    // Optional: email report via Resend
    if (process.env.RESEND_API_KEY && process.env.RESEND_TO_EMAIL) {
      await sendAuditEmail(stats)
    }

    await supabase.from('cron_runs').update({
      finished_at: new Date().toISOString(),
      success: true,
      stats_json: stats,
    }).eq('id', cronRunId)

    return NextResponse.json({ ok: true, ...stats })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('noindex-audit error:', message)
    await supabase.from('cron_runs').update({
      finished_at: new Date().toISOString(),
      success: false,
      error_message: message,
    }).eq('id', cronRunId)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function sendAuditEmail(stats: AuditStats) {
  const { byTier, sitemap, total, noindexedByCity, reclaimable } = stats
  const topNoindexed = Object.entries(noindexedByCity)
    .slice(0, 10)
    .map(([city, n]) => `${city}: ${n}`)
    .join(', ')

  const body = `
Venue Indexability Audit — ${new Date().toDateString()}

Total venues: ${total}

Tier breakdown:
  verified   (has upcoming shows):  ${byTier.verified}
  scored     (score > 0, no shows): ${byTier.scored}
  scheduled  (has schedule):        ${byTier.scheduled}
  thin       (score = 0, no sched): ${byTier.thin}
  soft       (score -1..-20):       ${byTier.soft}
  noindexed  (score < -20):         ${byTier.noindexed}

Sitemap: ${sitemap.included} included / ${sitemap.excluded} excluded

Reclaimable (soft/noindexed + new show in last 7 days): ${reclaimable}

Top cities by noindexed venues:
  ${topNoindexed || 'none'}
`.trim()

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'audit@freelivemusic.co',
      to: process.env.RESEND_TO_EMAIL,
      subject: `[FLM] Noindex audit — ${byTier.noindexed} noindexed, ${sitemap.included} in sitemap`,
      text: body,
    }),
  })
}
