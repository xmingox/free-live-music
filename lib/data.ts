import { unstable_cache } from 'next/cache'
import { Concert } from '@/types'
import { MOCK_CONCERTS } from './mock-data'
import metros from './metros.json'

async function fetchConcerts(metroCode?: string): Promise<Concert[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return MOCK_CONCERTS

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const today = new Date().toISOString().split('T')[0]

    let cityFilter: string[] | undefined
    if (metroCode) {
      const metro = metros.metros.find(m => m.code === metroCode)
      if (metro) cityFilter = [metro.city, ...(metro.aliases || [])]
    }

    const pageSize = 1000
    let offset = 0
    const all: Concert[] = []

    while (true) {
      let query = supabase
        .from('concerts')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
        .range(offset, offset + pageSize - 1)

      if (cityFilter) query = query.in('city', cityFilter)

      const { data, error } = await query
      if (error) break
      if (!data?.length) break
      all.push(...(data as Concert[]))
      if (data.length < pageSize) break
      offset += pageSize
    }

    if (!all.length) return MOCK_CONCERTS

    // Deduplicate by id (guards against accidental double-imports)
    const seen = new Set<string>()
    return all.filter(c => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
  } catch {
    return MOCK_CONCERTS
  }
}

// Cache per city code, revalidate hourly. Invalidate with revalidateTag('concerts')
// from moderation approve to bust immediately after new events are added.
export const getConcerts = unstable_cache(
  fetchConcerts,
  ['concerts'],
  { revalidate: 3600, tags: ['concerts'] }
)
