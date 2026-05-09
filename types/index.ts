export interface Concert {
  id: string
  display_id: string
  slug: string
  artist_name: string
  venue: string
  venue_id: string | null
  series_id: string | null
  date: string
  time: string | null
  neighborhood: string
  city: 'NYC' | 'LA' | 'SF' | 'CHI' | 'AUS' | 'SEA' | 'DC' | 'BOS' | 'DEN' | 'PDX' | 'FTW' | 'LOU' | 'ELP' | 'BHM' | 'ABQ' | 'ALB' | 'TUS' | 'TUC' | 'TLS' | 'TUL' | 'PIT' | 'RAH' | 'OKC' | 'SAT' | 'HNL' | 'CHR' | 'CHA' | 'STL' | 'BAL' | 'JAX' | 'OMA' | 'LB' | 'SD' | 'SBA' | 'ANA' | 'LV' | 'ARK' | 'NSH' | 'PHI' | 'MIA' | 'ATL' | 'MIN' | 'NOLA' | 'MEM' | 'DET' | 'TB' | 'DAL' | 'IND' | 'CMH' | 'CLE' | 'RDU' | 'BUF' | 'MIL' | 'CHS' | 'HOU' | 'KC' | 'ORL' | 'KNX' | 'AKR' | 'ROC' | 'SYR' | 'LEX' | 'HRT' | 'BOZ' | 'SAV' | 'CHT' | 'BR' | 'RIC' | 'PHX' | 'CIN' | 'PRV' | 'GRE' | 'RNO' | 'DAY' | 'TOL' | 'DES' | 'MAD' | 'GR' | 'ANN' | 'WIC' | 'COS' | 'FTC' | 'TAC' | 'SPO' | 'EUG' | 'BEN' | 'WPB' | 'SLO' | 'MTY' | 'SCZ' | 'ASH' | 'SAC' | 'SFE' | 'CHV' | 'NAP' | 'FLG' | 'BTV' | 'ICY' | 'PNS' | 'FAY' | 'PWM' | 'CAE' | 'HSV' | 'VB' | 'TLH' | 'FSD' | 'FCA' | 'BSE' | 'FTL' | 'SLC' | 'ANC' | 'SIT' | 'MAT' | 'RIV' | 'GSP' | 'ALY' | 'FMY' | 'SRQ' | 'NHV' | 'STA' | 'VNT' | 'SJC' | 'ABE' | 'MCA' | 'DAB' | 'PRO' | 'FRE' | 'BFL' | 'SPR' | 'POU'
  genre: string | null
  price: string
  admission_type: 'Walk-up free' | 'Free RSVP'
  indoor_outdoor: 'Indoor' | 'Outdoor' | 'Both' | null
  image_url: string | null
  is_verified: boolean
  is_cancelled: boolean
  source_url: string | null
  source_name: string | null
  source_id: string | null
  description?: string | null
  created_at: string
}

export interface Venue {
  id: string
  slug: string
  name: string
  venue_type: string | null
  indoor_outdoor: 'indoor' | 'outdoor' | 'both' | null
  address: string | null
  neighborhood: string | null
  city: string
  state: string | null
  zip: string | null
  lat: number | null
  lng: number | null
  website: string | null
  instagram: string | null
  phone: string | null
  description: string | null
  music_genres: string[] | null
  music_frequency: string | null
  music_schedule: string | null
  is_21_plus: boolean
  is_verified: boolean
  is_partner: boolean
  partner_tier: string | null
  google_place_id: string | null
  created_at: string
  updated_at: string
}

export type City = 'NYC' | 'LA' | 'SF' | 'CHI' | 'AUS' | 'SEA' | 'DC' | 'BOS' | 'DEN' | 'PDX' | 'FTW' | 'LOU' | 'ELP' | 'BHM' | 'ABQ' | 'ALB' | 'TUS' | 'TUC' | 'TLS' | 'TUL' | 'PIT' | 'RAH' | 'OKC' | 'SAT' | 'HNL' | 'CHR' | 'CHA' | 'STL' | 'BAL' | 'JAX' | 'OMA' | 'LB' | 'SD' | 'SBA' | 'ANA' | 'LV' | 'ARK' | 'NSH' | 'PHI' | 'MIA' | 'ATL' | 'MIN' | 'NOLA' | 'MEM' | 'DET' | 'TB' | 'DAL' | 'IND' | 'CMH' | 'CLE' | 'RDU' | 'BUF' | 'MIL' | 'CHS' | 'HOU' | 'KC' | 'ORL' | 'KNX' | 'AKR' | 'ROC' | 'SYR' | 'LEX' | 'HRT' | 'BOZ' | 'SAV' | 'CHT' | 'BR' | 'RIC' | 'PHX' | 'CIN' | 'PRV' | 'GRE' | 'RNO' | 'DAY' | 'TOL' | 'DES' | 'MAD' | 'GR' | 'ANN' | 'WIC' | 'COS' | 'FTC' | 'TAC' | 'SPO' | 'EUG' | 'BEN' | 'WPB' | 'SLO' | 'MTY' | 'SCZ' | 'ASH' | 'SAC' | 'SFE' | 'CHV' | 'NAP' | 'FLG' | 'BTV' | 'ICY' | 'PNS' | 'FAY' | 'PWM' | 'CAE' | 'HSV' | 'VB' | 'TLH' | 'FSD' | 'FCA' | 'BSE' | 'FTL' | 'SLC' | 'ANC' | 'SIT' | 'MAT' | 'RIV' | 'GSP' | 'ALY' | 'FMY' | 'SRQ' | 'NHV' | 'STA' | 'VNT' | 'SJC' | 'ABE' | 'MCA' | 'DAB' | 'PRO' | 'FRE' | 'BFL' | 'SPR' | 'POU'
export type DateFilter = 'tonight' | 'weekend' | 'week' | 'all' | 'custom'
