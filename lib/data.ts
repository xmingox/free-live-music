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
    
    let query = supabase
      .from('concerts')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
    
    if (metroCode) {
      const metro = metros.metros.find(m => m.code === metroCode)
      if (metro) {
        const cities = [metro.city, ...(metro.aliases || [])]
        query = query.in('city', cities)
      }
    }

    const { data, error } = await query

    if (error || !data?.length) return MOCK_CONCERTS
    return data as Concert[]
  } catch {
    return MOCK_CONCERTS
  }
}
