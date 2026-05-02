'use client'

import { useState } from 'react'
import metros from '@/lib/metros.json'

interface SubmitEventModalProps {
  isOpen: boolean
  onClose: () => void
}

// Get list of all states from metros data
const getAllStates = () => {
  const states = new Set(metros.metros.map(m => m.state))
  return Array.from(states).sort()
}

// Get metros for a specific state
const getMetrosForState = (state: string) => {
  return metros.metros
    .filter(m => m.state === state)
    .sort((a, b) => a.city.localeCompare(b.city))
}

export function SubmitEventModal({ isOpen, onClose }: SubmitEventModalProps) {
  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState('')
  const [metro, setMetro] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const states = getAllStates()
  const metrosForState = state ? getMetrosForState(state) : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!url || !email || !state || !metro) {
      setError('All fields are required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/submit-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          email,
          state,
          city: metro,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to submit event')
      }

      alert('Event submitted successfully! Thanks for sharing.')
      setUrl('')
      setEmail('')
      setState('')
      setMetro('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-lg max-w-md w-full border border-slate-800 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Share a Free Event</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Event URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/event"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              State
            </label>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value)
                setMetro('')
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-violet-500"
              required
            >
              <option value="">Select a state...</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {state && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Metro/City
              </label>
              <select
                value={metro}
                onChange={(e) => setMetro(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-violet-500"
                required
              >
                <option value="">Select a metro...</option>
                {metrosForState.map((m) => (
                  <option key={m.code} value={m.city}>
                    {m.city}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded transition"
            >
              {loading ? 'Submitting...' : 'Submit Event'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
