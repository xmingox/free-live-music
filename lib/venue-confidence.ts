export type VenueConfidence = 'verified' | 'historical' | 'unverified'

export function venueConfidence(v: {
  upcoming_show_count?: number
  music_score?: number | null
}): VenueConfidence {
  if ((v.upcoming_show_count ?? 0) > 0) return 'verified'
  if ((v.music_score ?? 0) > 0) return 'historical'
  return 'unverified'
}

export const CONFIDENCE_CONFIG = {
  verified: {
    label: 'Live Music Confirmed',
    detail: 'Upcoming shows listed below.',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    cardText: 'text-emerald-400',
    cardNote: '',
  },
  historical: {
    label: 'Previously Hosted',
    detail: 'Call ahead to confirm current schedule.',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    dotColor: 'bg-sky-400',
    cardText: 'text-slate-400',
    cardNote: 'No shows scheduled',
  },
  unverified: {
    label: 'Unverified',
    detail: "We haven't confirmed live music here — call ahead before visiting.",
    badgeColor: 'bg-slate-700/60 text-slate-500 border-slate-600/40',
    dotColor: 'bg-slate-500',
    cardText: 'text-slate-600',
    cardNote: 'Schedule unconfirmed',
  },
} as const
