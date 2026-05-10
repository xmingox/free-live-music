'use client'
import { useEffect } from 'react'

export default function TrackView({ concertId }: { concertId: string }) {
  useEffect(() => {
    // Fire once on mount, don't await, don't block render
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concertId }),
    }).catch(() => {})
  }, [concertId])
  return null
}
