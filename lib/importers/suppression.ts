import type { SupabaseClient } from '@supabase/supabase-js'
import type { ImportRow } from './types'

export interface Suppression {
  id: string
  pattern: string
  match_field: 'artist_name' | 'venue' | 'source_name' | 'source_url' | 'any'
  match_type: 'contains' | 'exact' | 'starts_with'
  reason: string
  added_by: string
  created_at: string
}

type CheckableRow = {
  artist_name?: string | null
  venue?: string | null
  source_name?: string | null
  source_url?: string | null
}

export async function loadSuppressions(supabase: SupabaseClient): Promise<Suppression[]> {
  const { data, error } = await supabase
    .from('crawl_suppressions')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) {
    console.error('[suppression] failed to load:', error.message)
    return []
  }
  return (data ?? []) as Suppression[]
}

function fieldMatches(value: string | null | undefined, pattern: string, matchType: string): boolean {
  if (!value) return false
  const v = value.toLowerCase()
  const p = pattern.toLowerCase()
  if (matchType === 'exact') return v === p
  if (matchType === 'starts_with') return v.startsWith(p)
  return v.includes(p)
}

export function isSuppressed(row: CheckableRow, suppressions: Suppression[]): boolean {
  for (const s of suppressions) {
    const fields: (keyof CheckableRow)[] =
      s.match_field === 'any'
        ? ['artist_name', 'venue', 'source_name', 'source_url']
        : [s.match_field as keyof CheckableRow]

    for (const field of fields) {
      if (fieldMatches(row[field], s.pattern, s.match_type)) return true
    }
  }
  return false
}

export function filterSuppressed(
  rows: (ImportRow | CheckableRow)[],
  suppressions: Suppression[],
): { kept: typeof rows; suppressed: number } {
  if (suppressions.length === 0) return { kept: rows, suppressed: 0 }
  const kept = rows.filter(r => !isSuppressed(r, suppressions))
  return { kept, suppressed: rows.length - kept.length }
}
