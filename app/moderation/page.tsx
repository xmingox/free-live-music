'use client'

import { useState, useEffect } from 'react'

interface Submission {
  id: string
  source_url: string
  submitter_email: string
  submitted_city: string
  submitted_state: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
}

export default function ModerationDashboard() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const correctPassword = process.env.NEXT_PUBLIC_MODERATION_PASSWORD || 'flm-mod-2026'
    if (password === correctPassword) {
      setIsAuthenticated(true)
      setPassword('')
      loadSubmissions()
    } else {
      alert('Incorrect password')
    }
  }

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/moderation/get-submissions', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch submissions')
      }

      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (error) {
      console.error('Error loading submissions:', error)
      alert('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    setApproving(id)
    try {
      const response = await fetch('/api/moderation/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: id, action: 'approve' }),
      })

      const result = await response.json()
      if (!response.ok) {
        alert(`Error: ${result.message}`)
        return
      }

      alert('Submission approved! Concert added.')
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'approved' } : s))
      )
    } catch (error) {
      console.error('Error approving:', error)
      alert('Failed to approve submission')
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm('Reject this submission?')) return

    setApproving(id)
    try {
      const response = await fetch('/api/moderation/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: id, action: 'reject' }),
      })

      if (!response.ok) {
        const result = await response.json()
        alert(`Error: ${result.message}`)
        return
      }

      alert('Submission rejected.')
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s))
      )
    } catch (error) {
      console.error('Error rejecting:', error)
      alert('Failed to reject submission')
    } finally {
      setApproving(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-8 rounded-lg max-w-sm w-full border border-slate-800">
          <h1 className="text-2xl font-bold text-white mb-6">Moderation</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter moderation password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500"
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  const pendingCount = submissions.filter((s) => s.status === 'pending').length

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">
            Moderation Dashboard
          </h1>
          <div className="text-right">
            <p className="text-slate-400 text-sm">
              <span className="text-violet-400 font-semibold">{pendingCount}</span> pending
            </p>
            <button
              onClick={() => {
                setIsAuthenticated(false)
                setSubmissions([])
              }}
              className="mt-2 px-3 py-1 text-sm text-slate-400 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6">
          <button
            onClick={loadSubmissions}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className={`p-4 border rounded-lg ${
                  submission.status === 'pending'
                    ? 'bg-slate-900 border-violet-600/50'
                    : submission.status === 'approved'
                      ? 'bg-slate-900/50 border-green-600/30'
                      : 'bg-slate-900/30 border-red-600/30'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                      URL
                    </p>
                    <a
                      href={submission.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 break-all text-sm"
                    >
                      {submission.source_url}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                      Contact
                    </p>
                    <p className="text-white text-sm">{submission.submitter_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                      Location
                    </p>
                    <p className="text-white text-sm">
                      {submission.submitted_city}, {submission.submitted_state}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                      Submitted
                    </p>
                    <p className="text-white text-sm">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {submission.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(submission.id)}
                      disabled={approving === submission.id}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition disabled:opacity-50"
                    >
                      {approving === submission.id ? 'Processing...' : '✅ Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(submission.id)}
                      disabled={approving === submission.id}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition disabled:opacity-50"
                    >
                      {approving === submission.id ? 'Processing...' : '❌ Reject'}
                    </button>
                  </div>
                )}

                {submission.status !== 'pending' && (
                  <div className="text-xs text-slate-500">
                    Status: <span className="capitalize">{submission.status}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
