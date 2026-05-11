'use client'

import { useState } from 'react'

interface Props {
  concertId: string
  concertSlug: string
}

const ISSUE_OPTIONS = [
  { value: 'cancelled',       label: 'Event cancelled' },
  { value: 'wrong_date_time', label: 'Wrong date or time' },
  { value: 'wrong_artist',    label: 'Wrong artist' },
  { value: 'broken_link',     label: 'Source link broken' },
  { value: 'other',           label: 'Other' },
] as const

type IssueType = typeof ISSUE_OPTIONS[number]['value']
type State = 'idle' | 'open' | 'submitting' | 'done' | 'error'

export default function ReportForm({ concertId, concertSlug }: Props) {
  const [state, setState] = useState<State>('idle')
  const [issueType, setIssueType] = useState<IssueType>('cancelled')
  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('submitting')

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concert_id: concertId,
          concert_slug: concertSlug,
          issue_type: issueType,
          comment: comment.trim() || undefined,
          reporter_email: email.trim() || undefined,
          website: honeypot, // honeypot
        }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'idle') {
    return (
      <button
        onClick={() => setState('open')}
        className="text-xs text-slate-500 hover:text-slate-400 transition-colors underline underline-offset-2"
      >
        Report an issue with this listing
      </button>
    )
  }

  if (state === 'done') {
    return (
      <p className="text-xs text-slate-500">
        Thanks — we'll look into it.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="mt-2 rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-300">Report an issue</p>

      {/* Honeypot — hidden from users */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={e => setHoneypot(e.target.value)}
        aria-hidden="true"
        tabIndex={-1}
        className="hidden"
      />

      <fieldset className="space-y-1.5">
        {ISSUE_OPTIONS.map(opt => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="issue_type"
              value={opt.value}
              checked={issueType === opt.value}
              onChange={() => setIssueType(opt.value)}
              className="accent-violet-500"
            />
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
              {opt.label}
            </span>
          </label>
        ))}
      </fieldset>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value.slice(0, 280))}
        placeholder="Optional details (280 chars max)"
        rows={2}
        className="w-full rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-sm px-3 py-2 resize-none placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60"
      />

      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Your email (optional — we'll only reply if we need more info)"
        className="w-full rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-sm px-3 py-2 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60"
      />

      {state === 'error' && (
        <p className="text-xs text-red-400">Something went wrong — try again.</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {state === 'submitting' ? 'Sending…' : 'Submit'}
        </button>
        <button
          type="button"
          onClick={() => setState('idle')}
          className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
