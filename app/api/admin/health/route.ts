import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// TODO: Replace moderation-password auth with CRON_SECRET bearer token once
// this route is called server-side or from a secure context. For now we rely
// on the client-side password gate on the health page itself — the API is
// technically public, but the data is low-sensitivity admin/ops info.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET() {
  try {
    const [cronRunsResult, submissionStatsResult, pendingCountResult, venueHealthResult, suppressionsResult] =
      await Promise.all([
        supabase
          .from('cron_runs')
          .select('name, started_at, finished_at, success, stats_json, error_message')
          .order('started_at', { ascending: false })
          .limit(100),

        supabase.rpc('get_submission_stats_by_extractor').then(
          (r) => r,
          () => ({ data: null, error: null }),
        ),

        supabase
          .from('event_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        supabase.rpc('get_venue_health_summary').then(
          (r) => r,
          () => ({ data: null, error: null }),
        ),

        supabase
          .from('crawl_suppressions')
          .select('id, pattern, match_field, match_type, reason, added_by, created_at')
          .order('created_at', { ascending: true }),
      ])

    // If RPCs don't exist yet, fall back to raw queries
    let submissionStats = submissionStatsResult.data
    if (!submissionStats) {
      const { data } = await supabase
        .from('event_submissions')
        .select('source_extractor, status, submitted_at')
        .gte('submitted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (data) {
        const groups: Record<
          string,
          { extractor: string; total: number; approved: number; rejected: number; pending: number }
        > = {}
        for (const row of data) {
          const key = row.source_extractor ?? 'user-submitted'
          if (!groups[key]) {
            groups[key] = { extractor: key, total: 0, approved: 0, rejected: 0, pending: 0 }
          }
          groups[key].total++
          if (row.status === 'approved') groups[key].approved++
          else if (row.status === 'rejected') groups[key].rejected++
          else if (row.status === 'pending') groups[key].pending++
        }
        submissionStats = Object.values(groups).sort((a, b) => b.total - a.total)
      }
    }

    let venueHealth = venueHealthResult.data
    if (!venueHealth) {
      const { data } = await supabase.from('venues').select('music_score')
      if (data) {
        venueHealth = {
          unscored: data.filter((v) => v.music_score == null).length,
          high: data.filter((v) => v.music_score != null && v.music_score >= 40).length,
          medium: data.filter(
            (v) => v.music_score != null && v.music_score >= 20 && v.music_score < 40,
          ).length,
          low: data.filter(
            (v) => v.music_score != null && v.music_score >= 0 && v.music_score < 20,
          ).length,
          negative: data.filter((v) => v.music_score != null && v.music_score < 0).length,
        }
      }
    }

    return NextResponse.json({
      cronRuns: cronRunsResult.data ?? [],
      submissionStats: submissionStats ?? [],
      pendingCount: pendingCountResult.count ?? 0,
      venueHealth: venueHealth ?? { unscored: 0, high: 0, medium: 0, low: 0, negative: 0 },
      suppressions: suppressionsResult.data ?? [],
    })
  } catch (error) {
    console.error('Health API error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
