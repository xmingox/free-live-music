export interface Concert {
  id: string
  display_id: string
  slug: string
  artist_name: string
  venue: string
  date: string
  time: string | null
  neighborhood: string
  city: 'NYC' | 'LA' | 'SF' | 'CHI' | 'AUS' | 'SEA' | 'DC' | 'BOS' | 'DEN' | 'PDX' | 'FTW' | 'LOU' | 'ELP' | 'BHM' | 'ABQ' | 'ALB' | 'TUS' | 'TUC' | 'TLS' | 'TUL' | 'PIT' | 'RAH' | 'OKC' | 'SAT' | 'HNL' | 'CHR' | 'CHA' | 'STL' | 'BAL' | 'JAX' | 'OMA' | 'LB' | 'SD' | 'SBA' | 'ANA' | 'LV' | 'ARK' | 'NSH' | 'PHI' | 'MIA' | 'ATL' | 'MIN' | 'NOLA' | 'MEM' | 'DET' | 'TB' | 'DAL' | 'IND' | 'CMH' | 'CLE' | 'RDU' | 'BUF' | 'MIL' | 'CHS' | 'HOU' | 'KC'
  genre: string | null
  price: string
  admission_type: 'Walk-up free' | 'Free RSVP'
  indoor_outdoor: 'Indoor' | 'Outdoor' | 'Both' | null
  image_url: string | null
  is_verified: boolean
  source_url: string | null
  source_name: string | null
  source_id: string | null
  created_at: string
}

export type City = 'NYC' | 'LA' | 'SF' | 'CHI' | 'AUS' | 'SEA' | 'DC' | 'BOS' | 'DEN' | 'PDX' | 'FTW' | 'LOU' | 'ELP' | 'BHM' | 'ABQ' | 'ALB' | 'TUS' | 'TUC' | 'TLS' | 'TUL' | 'PIT' | 'RAH' | 'OKC' | 'SAT' | 'HNL' | 'CHR' | 'CHA' | 'STL' | 'BAL' | 'JAX' | 'OMA' | 'LB' | 'SD' | 'SBA' | 'ANA' | 'LV' | 'ARK' | 'NSH' | 'PHI' | 'MIA' | 'ATL' | 'MIN' | 'NOLA' | 'MEM' | 'DET' | 'TB' | 'DAL' | 'IND' | 'CMH' | 'CLE' | 'RDU' | 'BUF' | 'MIL' | 'CHS' | 'HOU' | 'KC'
export type DateFilter = 'tonight' | 'weekend' | 'week' | 'all' | 'custom'
