import { Concert } from '@/types'
import { MOCK_CONCERTS } from './mock-data'
import metros from './metros.json'

export async function getConcerts(metroCode?: string): Promise<Concert[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return MOCK_CONCERTS
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
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
    const deduped = all.filter(c => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
    return deduped
  } catch {
    return MOCK_CONCERTS
  }
}
