'use client'

import { useState, useCallback } from 'react'
import { CheckCircle, XCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react'

interface Submission {
  id: string
  source_url: string
  submitter_email: string
  submitted_city: string
  submitted_state: string
  submitted_at: string
  status: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function ModerationPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchSubmissions = useCallback(async (pw: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/moderation', {
        headers: { Authorization: `Bearer ${pw}` },
      })
      if (res.status === 401) {
        setAuthError('Incorrect password')
        setAuthed(false)
        return false
      }
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setSubmissions(data)
      return true
    } catch {
      setAuthError('Something went wrong')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    const ok = await fetchSubmissions(password)
    if (ok) setAuthed(true)
  }

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id + status)
    try {
      const res = await fetch('/api/moderation', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setSubmissions((prev) => prev.filter((s) => s.id !== id))
    } catch {
      alert('Failed to update submission. Try again.')
    } finally {
      setActionLoading(null)
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm shadow-lg">
              🎵
            </div>
            <h1 className="text-lg font-bold text-white">Moderation</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            {authError && (
              <p className="text-sm text-red-400">{authError}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Checking...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Moderation Queue</h1>
            <p className="text-sm text-slate-500">
              {loading
                ? 'Loading...'
                : `${submissions.length} pending submission${submissions.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => fetchSubmissions(password)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading && submissions.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        )}

        {!loading && submissions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-slate-300 mb-2">All clear</h2>
            <p className="text-slate-500">No pending submissions.</p>
          </div>
        )}

        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <a
                  href={sub.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 font-medium text-sm transition break-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  {sub.source_url}
                </a>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                  <span>{sub.submitted_city}, {sub.submitted_state}</span>
                  <span className="text-slate-600">·</span>
                  <span>{sub.submitter_email}</span>
                  <span className="text-slate-600">·</span>
                  <span>{formatDate(sub.submitted_at)}</span>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleAction(sub.id, 'approved')}
                  disabled={actionLoading !== null}
                  title="Approve"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/50 hover:bg-emerald-800/60 disabled:opacity-40 border border-emerald-700/50 text-emerald-400 text-sm font-medium rounded-lg transition"
                >
                  {actionLoading === sub.id + 'approved'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle className="w-4 h-4" />}
                  Approve
                </button>
                <button
                  onClick={() => handleAction(sub.id, 'rejected')}
                  disabled={actionLoading !== null}
                  title="Reject"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/50 hover:bg-red-800/60 disabled:opacity-40 border border-red-700/50 text-red-400 text-sm font-medium rounded-lg transition"
                >
                  {actionLoading === sub.id + 'rejected'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <XCircle className="w-4 h-4" />}
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
