import { DateFilter } from '@/types'

interface DateFilterBarProps {
  value: DateFilter
  onChange: (filter: DateFilter) => void
}

export default function DateFilterBar({ value, onChange }: DateFilterBarProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onChange('tonight')}
        className={`px-4 py-2 rounded-full font-medium transition ${
          value === 'tonight'
            ? 'bg-violet-600 text-white'
            : 'border border-slate-700 text-slate-300 hover:border-violet-500'
        }`}
      >
        Tonight
      </button>
      <button
        onClick={() => onChange('weekend')}
        className={`px-4 py-2 rounded-full font-medium transition ${
          value === 'weekend'
            ? 'bg-violet-600 text-white'
            : 'border border-slate-700 text-slate-300 hover:border-violet-500'
        }`}
      >
        Weekend
      </button>
      <button
        onClick={() => onChange('week')}
        className={`px-4 py-2 rounded-full font-medium transition ${
          value === 'week'
            ? 'bg-violet-600 text-white'
            : 'border border-slate-700 text-slate-300 hover:border-violet-500'
        }`}
      >
        Next 7 Days
      </button>
      <button
        onClick={() => onChange('all')}
        className={`px-4 py-2 rounded-full font-medium transition ${
          value === 'all'
            ? 'bg-violet-600 text-white'
            : 'border border-slate-700 text-slate-300 hover:border-violet-500'
        }`}
      >
        All Shows
      </button>
      <button
        onClick={() => onChange('custom')}
        className={`px-4 py-2 rounded-full font-medium transition ${
          value === 'custom'
            ? 'bg-violet-600 text-white'
            : 'border border-slate-700 text-slate-300 hover:border-violet-500'
        }`}
      >
        Custom Dates
      </button>
    </div>
  )
}
