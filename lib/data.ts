import { Concert } from '@/types'
import { MOCK_CONCERTS } from './mock-data'

export async function getConcerts(): Promise<Concert[]> {
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
    const { data, error } = await supabase
      .from('concerts')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })

    if (error || !data?.length) return MOCK_CONCERTS
    return data as Concert[]
  } catch {
    return MOCK_CONCERTS
  }
}
