'use client'

import { DateFilter } from '@/types'

interface DateFilterProps {
  value: DateFilter
  onChange: (filter: DateFilter) => void
}

const FILTERS: { id: DateFilter; label: string }[] = [
  { id: 'tonight', label: 'Tonight' },
  { id: 'weekend', label: 'Weekend' },
  { id: 'week', label: 'Next 7 Days' },
  { id: 'all', label: 'All Shows' },
]

export default function DateFilterBar({ value, onChange }: DateFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
            value === f.id
              ? 'bg-slate-100 text-slate-900 border-slate-100'
              : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
