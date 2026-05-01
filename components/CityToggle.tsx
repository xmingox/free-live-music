'use client'

import { useState, useRef, useEffect } from 'react'
import { City } from '@/types'

const CITIES: { id: City; label: string; emoji: string }[] = [
  { id: 'NYC', label: 'New York City', emoji: '🗽' },
  { id: 'LA',  label: 'Los Angeles',  emoji: '🌴' },
  { id: 'SF',  label: 'San Francisco', emoji: '🌉' },
  { id: 'CHI', label: 'Chicago',       emoji: '🌬️' },
  { id: 'AUS', label: 'Austin',        emoji: '🤠' },
  { id: 'SEA', label: 'Seattle',       emoji: '☕' },
  { id: 'DC',  label: 'Washington DC', emoji: '🏛️' },
  { id: 'BOS', label: 'Boston',        emoji: '🦞' },
  { id: 'DEN', label: 'Denver',        emoji: '🏔️' },
  { id: 'PDX', label: 'Portland',      emoji: '🌲' },
]

interface CityToggleProps {
  city: City
  onChange: (city: City) => void
}

export default function CityToggle({ city, onChange }: CityToggleProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = CITIES.find(c => c.id === city) ?? CITIES[0]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-violet-500/50 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 group"
      >
        <span className="text-base leading-none">{current.emoji}</span>
        <span className="text-white">{current.label}</span>
        <svg
          className={`w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ml-1 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {CITIES.map((c) => (
            <button
              key={c.id}
              onClick={() => { onChange(c.id); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-150 ${
                c.id === city
                  ? 'bg-gradient-to-r from-violet-600/30 to-pink-600/20 text-white border-l-2 border-violet-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 border-l-2 border-transparent'
              }`}
            >
              <span className="text-base">{c.emoji}</span>
              <span>{c.label}</span>
              {c.id === city && (
                <svg className="w-4 h-4 text-violet-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
          <div className="border-t border-slate-700/50 px-4 py-2.5">
            <p className="text-xs text-slate-600">More cities coming soon</p>
          </div>
        </div>
      )}
    </div>
  )
}
