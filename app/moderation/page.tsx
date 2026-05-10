'use client'

import { useState } from 'react'
import metros from '@/lib/metros.json'

interface Submission {
  id: string
  source_url: string
  submitter_email: string | null
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  extracted_artist: string | null
  extracted_venue: string | null
  extracted_venue_address: string | null
  extracted_city: string | null
  extracted_state: string | null
  extracted_date: string | null
  // Pipeline fields
  source_extractor: string | null
  city_code: string | null
  extracted_neighborhood: string | null
  extracted_genre: string | null
  auto_approve_eligible: boolean | null
}

type FilterTab = 'all' | 'user' | 'pipeline' | 'auto_eligible'

const TAB_LABELS: Record<FilterTab, string> = {
  all: 'All',
  user: 'User Submitted',
  pipeline: 'Pipeline (automated)',
  auto_eligible: 'Auto-approve eligible',
}

function SourceBadge({ extractor }: { extractor: string | null }) {
  if (!extractor) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-700/50">
        user-submitted
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-900/50 text-yellow-300 border border-yellow-700/50">
      {extractor}
    </span>
  )
}

export default function ModerationDashboard() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [bulkApproving, setBulkApproving] = useState(false)

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
      const manualCity = selectedCity[id]
      const body: Record<string, unknown> = { submissionId: id, action: 'approve' }
      if (manualCity) body.manualCity = manualCity

      const response = await fetch('/api/moderation/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      setSelectedCity((prev) => {
        const updated = { ...prev }
        delete updated[id]
        return updated
      })
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

  const handleBulkApprove = async () => {
    const eligible = filteredSubmissions.filter(
      (s) => s.status === 'pending' && s.auto_approve_eligible,
    )
    if (eligible.length === 0) {
      alert('No auto-eligible pending submissions in current view.')
      return
    }
    if (!confirm(`Approve ${eligible.length} auto-eligible submissions?`)) return

    setBulkApproving(true)
    try {
      const response = await fetch('/api/moderation/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter: 'auto_eligible' }),
      })
      const result = await response.json()
      if (!response.ok) {
        alert(`Error: ${result.message}`)
        return
      }
      alert(`${result.message}${result.errors ? `\n\nErrors:\n${result.errors.join('\n')}` : ''}`)
      await loadSubmissions()
    } catch (error) {
      console.error('Bulk approve error:', error)
      alert('Failed to bulk approve')
    } finally {
      setBulkApproving(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Event Moderation</h1>
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

  const pendingCount = submissions.filter((s) => s.status === 'pending').length
  const autoEligibleCount = submissions.filter(
    (s) => s.status === 'pending' && s.auto_approve_eligible,
  ).length

  const filteredSubmissions = submissions.filter((s) => {
    if (activeTab === 'all') return true
    if (activeTab === 'user') return s.submitter_email != null
    if (activeTab === 'pipeline') return s.source_extractor != null
    if (activeTab === 'auto_eligible') return s.auto_approve_eligible === true
    return true
  })

  const tabCounts: Record<FilterTab, number> = {
    all: submissions.length,
    user: submissions.filter((s) => s.submitter_email != null).length,
    pipeline: submissions.filter((s) => s.source_extractor != null).length,
    auto_eligible: submissions.filter((s) => s.auto_approve_eligible === true).length,
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-start">
          <h1 className="text-3xl font-bold">
            Moderation <span className="text-violet-400">Dashboard</span>
          </h1>
          <div className="text-right">
            <p className="text-slate-400 text-sm">
              <span className="text-violet-400 font-semibold">{pendingCount}</span> pending
              {autoEligibleCount > 0 && (
                <span className="ml-2 text-green-400">
                  ({autoEligibleCount} auto-eligible)
                </span>
              )}
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
        {/* Action bar */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={loadSubmissions}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          {autoEligibleCount > 0 && (
            <button
              onClick={handleBulkApprove}
              disabled={bulkApproving}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white font-semibold rounded transition disabled:opacity-50"
            >
              {bulkApproving
                ? 'Approving...'
                : `Bulk Approve Auto-Eligible (${autoEligibleCount})`}
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(Object.keys(TAB_LABELS) as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {TAB_LABELS[tab]}
              <span
                className={`ml-1.5 text-xs ${activeTab === tab ? 'text-violet-200' : 'text-slate-500'}`}
              >
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No submissions found for this filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
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
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <SourceBadge extractor={submission.source_extractor} />
                  {submission.auto_approve_eligible && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/50 text-green-300 border border-green-700/50">
                      Auto-eligible
                    </span>
                  )}
                  {submission.city_code && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-600/50">
                      {submission.city_code}
                    </span>
                  )}
                  {submission.extracted_neighborhood && (
                    <span className="text-xs text-slate-400">{submission.extracted_neighborhood}</span>
                  )}
                  {submission.extracted_genre && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700/40 text-slate-400 border border-slate-600/40">
                      {submission.extracted_genre}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">URL</p>
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
                      {submission.submitter_email ? 'Contact' : 'Source'}
                    </p>
                    <p className="text-white text-sm">
                      {submission.submitter_email ?? submission.source_extractor ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Detected Location</p>
                    {submission.extracted_city || submission.extracted_venue ? (
                      <div className="text-sm">
                        {submission.extracted_venue && (
                          <p className="text-white">{submission.extracted_venue}</p>
                        )}
                        {submission.extracted_venue_address && (
                          <p className="text-slate-400">{submission.extracted_venue_address}</p>
                        )}
                        {(submission.extracted_city || submission.extracted_state) && (
                          <p className="text-slate-400">
                            {[submission.extracted_city, submission.extracted_state]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm italic">Auto-detected on approve</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Submitted</p>
                    <p className="text-white text-sm">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {submission.status === 'pending' && (
                  <>
                    <div className="mb-4">
                      <label
                        htmlFor={`city-${submission.id}`}
                        className="text-xs text-slate-500 uppercase tracking-wide mb-2 block"
                      >
                        Override City (Optional)
                      </label>
                      <select
                        id={`city-${submission.id}`}
                        value={selectedCity[submission.id] || ''}
                        onChange={(e) =>
                          setSelectedCity((prev) => ({
                            ...prev,
                            [submission.id]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-violet-600"
                      >
                        <option value="">Auto-detect</option>
                        {metros.metros.map((metro) => (
                          <option key={metro.code} value={metro.city}>
                            {metro.city}, {metro.state}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(submission.id)}
                        disabled={approving === submission.id}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition disabled:opacity-50"
                      >
                        {approving === submission.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(submission.id)}
                        disabled={approving === submission.id}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition disabled:opacity-50"
                      >
                        {approving === submission.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </>
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
