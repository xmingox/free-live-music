'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CronRun {
  name: string
  started_at: string
  finished_at: string | null
  success: boolean
  stats_json: Record<string, unknown> | null
  error_message: string | null
}

interface SubmissionStat {
  extractor: string
  total: number
  approved: number
  rejected: number
  pending: number
}

interface VenueHealth {
  unscored: number
  high: number
  medium: number
  low: number
  negative: number
}

interface Suppression {
  id: string
  pattern: string
  match_field: string
  match_type: string
  reason: string
  added_by: string
  created_at: string
}

interface TopConcert {
  artist_name: string
  venue: string
  city: string
  date: string
  event_views: number
}

interface GscQuery {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  date: string
}

interface QaFlag {
  id: string
  concert_id: string
  flagged_at: string
  flag_type: 'source_gone' | 'field_mismatch' | 'price_changed'
  field_name: string | null
  stored_value: string | null
  fetched_value: string | null
  source_url: string
  resolved: boolean
}

interface HealthData {
  cronRuns: CronRun[]
  submissionStats: SubmissionStat[]
  pendingCount: number
  venueHealth: VenueHealth
  suppressions: Suppression[]
  topConcerts: TopConcert[]
  gscQueries: GscQuery[]
  qaFlags: QaFlag[]
}

function approvalRate(stat: SubmissionStat): number {
  const decided = stat.approved + stat.rejected
  if (decided === 0) return 0
  return Math.round((stat.approved / decided) * 100)
}

function ApprovalRateBadge({ rate, pending }: { rate: number; pending: number }) {
  if (pending > 0 && rate === 0) {
    return <span className="text-slate-400 text-sm">—</span>
  }
  const color = rate >= 95 ? 'text-green-400' : rate >= 80 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`font-semibold ${color}`}>{rate}%</span>
}

function StatusDot({ success }: { success: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${
        success ? 'bg-green-400' : 'bg-red-400'
      }`}
    />
  )
}

function CronGroupCard({ name, runs }: { name: string; runs: CronRun[] }) {
  const [expanded, setExpanded] = useState(false)
  const lastRun = runs[0]
  const recentRuns = runs.slice(0, 5)

  const lastRunTime = lastRun
    ? new Date(lastRun.started_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never'

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {lastRun && <StatusDot success={lastRun.success} />}
          <span className="font-mono text-sm text-violet-400 truncate">{name}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className="text-xs text-slate-400">{lastRunTime}</span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-slate-500 hover:text-slate-300 transition px-2 py-1 rounded border border-slate-700 hover:border-slate-600"
          >
            {expanded ? 'Collapse' : 'History'}
          </button>
        </div>
      </div>

      {lastRun?.stats_json && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
          {Object.entries(lastRun.stats_json).map(([k, v]) => (
            <span key={k} className="text-xs text-slate-400">
              <span className="text-slate-500">{k}:</span>{' '}
              <span className="text-white">
                {v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v)}
              </span>
            </span>
          ))}
        </div>
      )}

      {lastRun?.error_message && (
        <p className="text-xs text-red-400 font-mono mt-1 truncate" title={lastRun.error_message}>
          {lastRun.error_message}
        </p>
      )}

      {expanded && (
        <div className="mt-3 border-t border-slate-700/60 pt-3 space-y-2">
          {recentRuns.map((run, i) => (
            <div key={i} className="flex items-start gap-2">
              <StatusDot success={run.success} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-300">
                    {new Date(run.started_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {run.finished_at && (
                    <span className="text-xs text-slate-500">
                      {Math.round(
                        (new Date(run.finished_at).getTime() -
                          new Date(run.started_at).getTime()) /
                          1000,
                      )}
                      s
                    </span>
                  )}
                </div>
                {run.stats_json && (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {Object.entries(run.stats_json).map(([k, v]) => (
                      <span key={k} className="text-xs text-slate-500">
                        {k}: <span className="text-slate-400">
                          {v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
                {run.error_message && (
                  <p className="text-xs text-red-400 truncate mt-0.5">{run.error_message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminHealthPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const correctPassword = process.env.NEXT_PUBLIC_MODERATION_PASSWORD || 'flm-mod-2026'
    if (password === correctPassword) {
      setIsAuthenticated(true)
      setPassword('')
    } else {
      alert('Incorrect password')
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/health')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) loadData()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-white mb-2">Admin Health</h1>
            <p className="text-slate-400 text-sm mb-6">freelivemusic.co ops dashboard</p>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-violet-600"
                  placeholder="Enter password"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded transition"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Group cron runs by name
  const cronGroups: Record<string, CronRun[]> = {}
  if (data?.cronRuns) {
    for (const run of data.cronRuns) {
      if (!cronGroups[run.name]) cronGroups[run.name] = []
      if (cronGroups[run.name].length < 5) cronGroups[run.name].push(run)
    }
  }

  const venueTotal = data
    ? data.venueHealth.unscored +
      data.venueHealth.high +
      data.venueHealth.medium +
      data.venueHealth.low +
      data.venueHealth.negative
    : 0

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              Admin <span className="text-violet-400">Health</span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">freelivemusic.co ops dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sm text-white rounded transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={() => {
                setIsAuthenticated(false)
                setData(null)
              }}
              className="text-sm text-slate-400 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Section 1: Cron Run History */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            Cron Run History
            <span className="ml-2 text-sm font-normal text-slate-400">
              (last {data?.cronRuns.length ?? 0} runs)
            </span>
          </h2>
          {Object.keys(cronGroups).length === 0 ? (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-6 text-center text-slate-400 text-sm">
              {loading ? 'Loading...' : 'No cron runs found. The cron_runs table may be empty or not yet created.'}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(cronGroups).map(([name, runs]) => (
                <CronGroupCard key={name} name={name} runs={runs} />
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Submission Stats */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-1">
            Submission Stats
            <span className="ml-2 text-sm font-normal text-slate-400">(last 30 days)</span>
          </h2>
          {data && (
            <p className="text-sm text-slate-400 mb-4">
              <Link href="/moderation" className="text-violet-400 hover:text-violet-300 underline">
                {data.pendingCount} pending
              </Link>{' '}
              across all sources
            </p>
          )}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Extractor</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Total</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Approved</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Rejected</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Pending</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Approval %</th>
                </tr>
              </thead>
              <tbody>
                {data?.submissionStats.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      No submission data in the last 30 days.
                    </td>
                  </tr>
                )}
                {data?.submissionStats.map((stat) => {
                  const rate = approvalRate(stat)
                  return (
                    <tr
                      key={stat.extractor}
                      className="border-b border-slate-700/30 hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-violet-400 text-xs">{stat.extractor}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-white">{stat.total}</td>
                      <td className="px-4 py-3 text-right text-green-400">{stat.approved}</td>
                      <td className="px-4 py-3 text-right text-red-400">{stat.rejected}</td>
                      <td className="px-4 py-3 text-right">
                        {stat.pending > 0 ? (
                          <Link
                            href="/moderation"
                            className="text-yellow-400 hover:text-yellow-300 underline"
                          >
                            {stat.pending}
                          </Link>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ApprovalRateBadge rate={rate} pending={stat.pending} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Venue Health */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-1">Venue Health</h2>
          <p className="text-sm text-slate-400 mb-4">
            Venue health scoring is disabled. Existing scores reflect the last scoring run.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              {
                label: 'Unscored',
                value: data?.venueHealth.unscored ?? 0,
                color: 'text-slate-400',
                bar: 'bg-slate-600',
              },
              {
                label: 'High (≥40)',
                value: data?.venueHealth.high ?? 0,
                color: 'text-green-400',
                bar: 'bg-green-600',
              },
              {
                label: 'Medium (20–39)',
                value: data?.venueHealth.medium ?? 0,
                color: 'text-yellow-400',
                bar: 'bg-yellow-600',
              },
              {
                label: 'Low (0–19)',
                value: data?.venueHealth.low ?? 0,
                color: 'text-orange-400',
                bar: 'bg-orange-600',
              },
              {
                label: 'Negative',
                value: data?.venueHealth.negative ?? 0,
                color: 'text-red-400',
                bar: 'bg-red-600',
              },
            ].map((item) => {
              const pct = venueTotal > 0 ? Math.round((item.value / venueTotal) * 100) : 0
              return (
                <div
                  key={item.label}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4"
                >
                  <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{item.label}</div>
                  <div className="mt-2 h-1.5 rounded bg-slate-700">
                    <div
                      className={`h-1.5 rounded ${item.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{pct}%</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Section 4: Crawl Suppressions */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-1">Crawl Suppressions</h2>
          <p className="text-slate-400 text-xs mb-4">
            Patterns matched against every imported row — matching rows are silently dropped before DB insert.
            Add new rows directly in{' '}
            <a
              href="https://supabase.com/dashboard/project/rxdutrcjkmfhonzpsthb/editor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Supabase → crawl_suppressions
            </a>.
          </p>
          {!data?.suppressions?.length ? (
            <p className="text-slate-500 text-sm">No suppressions configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700">
                    <th className="pb-2 pr-4 font-medium">Pattern</th>
                    <th className="pb-2 pr-4 font-medium">Field</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">Reason</th>
                    <th className="pb-2 font-medium">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {data.suppressions.map((s) => (
                    <tr key={s.id} className="border-b border-slate-800/60">
                      <td className="py-2 pr-4 text-orange-300 font-mono text-xs">{s.pattern}</td>
                      <td className="py-2 pr-4 text-slate-300">{s.match_field}</td>
                      <td className="py-2 pr-4 text-slate-400">{s.match_type}</td>
                      <td className="py-2 pr-4 text-slate-400 max-w-xs truncate">{s.reason}</td>
                      <td className="py-2 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {s.added_by && s.added_by !== 'manual' && (
                          <span className="ml-1 text-slate-600">({s.added_by})</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 5: Top Viewed Concerts */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-1">Top Viewed Concerts</h2>
          <p className="text-slate-400 text-xs mb-4">
            Concerts with the most detail page views (all-time).
          </p>
          {!data?.topConcerts?.length ? (
            <p className="text-slate-500 text-sm">
              {loading ? 'Loading...' : 'No views recorded yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700">
                    <th className="pb-2 pr-4 font-medium">Artist</th>
                    <th className="pb-2 pr-4 font-medium">Venue</th>
                    <th className="pb-2 pr-4 font-medium">City</th>
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 font-medium text-right">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topConcerts.map((c, i) => (
                    <tr key={i} className="border-b border-slate-800/60">
                      <td className="py-2 pr-4 text-white font-medium">{c.artist_name}</td>
                      <td className="py-2 pr-4 text-slate-300">{c.venue}</td>
                      <td className="py-2 pr-4 text-slate-400 font-mono text-xs">{c.city}</td>
                      <td className="py-2 pr-4 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(c.date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-2 text-right text-violet-400 font-semibold">{c.event_views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 6: QA Flags */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-1">
            QA Flags
            <span className="ml-2 text-sm font-normal text-slate-400">
              ({data?.qaFlags.filter((f) => !f.resolved).length ?? 0} open)
            </span>
          </h2>
          <p className="text-slate-400 text-xs mb-4">
            Nightly re-validation of pipeline concerts. Flags auto-deduplicated — resolve in Supabase once confirmed.
          </p>
          {!data?.qaFlags?.length ? (
            <p className="text-slate-500 text-sm">
              {loading ? 'Loading...' : 'No open QA flags.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700">
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">Stored value</th>
                    <th className="pb-2 pr-4 font-medium">Fetched value</th>
                    <th className="pb-2 pr-4 font-medium">Source URL</th>
                    <th className="pb-2 font-medium">Flagged</th>
                  </tr>
                </thead>
                <tbody>
                  {data.qaFlags.map((f) => (
                    <tr key={f.id} className={`border-b border-slate-800/60 ${f.resolved ? 'opacity-40' : ''}`}>
                      <td className="py-2 pr-4">
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                          f.flag_type === 'source_gone' ? 'bg-red-900/50 text-red-300' : 'bg-yellow-900/50 text-yellow-300'
                        }`}>
                          {f.flag_type}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-slate-300 max-w-[180px] truncate" title={f.stored_value ?? ''}>{f.stored_value ?? '—'}</td>
                      <td className="py-2 pr-4 text-slate-400 max-w-[160px] truncate" title={f.fetched_value ?? ''}>{f.fetched_value ?? '—'}</td>
                      <td className="py-2 pr-4 max-w-[200px] truncate">
                        <a href={f.source_url} target="_blank" rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-xs">{f.source_url}</a>
                      </td>
                      <td className="py-2 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(f.flagged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 7: Search Console Top Queries */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-1">Search Console</h2>
          <p className="text-slate-400 text-xs mb-4">
            Top queries by clicks — last 7 days. Data synced daily at noon UTC via{' '}
            <span className="font-mono text-slate-500">/api/analytics/gsc</span>.
          </p>
          {!data?.gscQueries?.length ? (
            <p className="text-slate-500 text-sm">
              {loading ? 'Loading...' : 'No GSC data yet — cron runs daily at noon UTC. First data appears ~2 days after the first successful run.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700">
                    <th className="pb-2 pr-4 font-medium">Query</th>
                    <th className="pb-2 pr-4 font-medium text-right">Clicks</th>
                    <th className="pb-2 pr-4 font-medium text-right">Impressions</th>
                    <th className="pb-2 pr-4 font-medium text-right">CTR</th>
                    <th className="pb-2 font-medium text-right">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {data.gscQueries.map((q, i) => (
                    <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition">
                      <td className="py-2 pr-4 text-white max-w-xs truncate" title={q.query}>{q.query}</td>
                      <td className="py-2 pr-4 text-right text-violet-400 font-semibold">{q.clicks}</td>
                      <td className="py-2 pr-4 text-right text-slate-300">{q.impressions}</td>
                      <td className="py-2 pr-4 text-right text-slate-400">{(q.ctr * 100).toFixed(1)}%</td>
                      <td className="py-2 text-right text-slate-400">{q.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 7: Quick Links */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/moderation"
              className="px-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-slate-300 hover:text-white hover:border-violet-600/50 transition"
            >
              Moderation Dashboard
            </Link>
            <Link
              href="/admin/health"
              className="px-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-slate-300 hover:text-white hover:border-violet-600/50 transition"
            >
              Refresh Health Page
            </Link>
            <a
              href="https://supabase.com/dashboard/project/rxdutrcjkmfhonzpsthb"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-slate-300 hover:text-white hover:border-violet-600/50 transition"
            >
              Supabase Dashboard ↗
            </a>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-slate-300 hover:text-white hover:border-violet-600/50 transition"
            >
              Vercel Dashboard ↗
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
