export type CityCode =
  | 'ABE' | 'AGS' | 'AHN' | 'AKR' | 'ALB' | 'ALY' | 'AMA' | 'ANA' | 'ANC' | 'ANN'
  | 'ARK' | 'ASH' | 'ATL' | 'AUS' | 'BAL' | 'BEN' | 'BFL' | 'BHM' | 'BIL' | 'BLI'
  | 'BOS' | 'BOZ' | 'BR'  | 'BSE' | 'BTV' | 'BUF' | 'BWG' | 'CAE' | 'CAK' | 'CHA'
  | 'CHI' | 'CHS' | 'CHT' | 'CHV' | 'CHY' | 'CID' | 'CIN' | 'CKV' | 'CLE' | 'CMH'
  | 'CMI' | 'COE' | 'COS' | 'CRP' | 'DAB' | 'DAL' | 'DAY' | 'DC'  | 'DEN' | 'DES'
  | 'DET' | 'DLH' | 'ELP' | 'ERI' | 'EUG' | 'EVV' | 'FAR' | 'FAY' | 'FCA' | 'FLG'
  | 'FMY' | 'FRE' | 'FSD' | 'FTC' | 'FTL' | 'FTW' | 'FWA' | 'GNV' | 'GR'  | 'GRB'
  | 'GRE' | 'GRK' | 'GSP' | 'GTF' | 'HBG' | 'HNL' | 'HOU' | 'HRT' | 'HSV' | 'ICY'
  | 'ILM' | 'IND' | 'JAN' | 'JAX' | 'KC'  | 'KNX' | 'LA'  | 'LAN' | 'LB'  | 'LBB'
  | 'LEX' | 'LNK' | 'LOU' | 'LV'  | 'MAD' | 'MAT' | 'MCA' | 'MCN' | 'MEM' | 'MIA'
  | 'MID' | 'MIL' | 'MIN' | 'MLB' | 'MOB' | 'MOD' | 'MSL' | 'MSO' | 'MTY' | 'MYR'
  | 'NAP' | 'NHV' | 'NOLA'| 'NSH' | 'NYC' | 'OKC' | 'OLM' | 'OMA' | 'ORL' | 'PDX'
  | 'PEO' | 'PHI' | 'PHX' | 'PIT' | 'PNS' | 'POU' | 'PRO' | 'PRV' | 'PWM' | 'RAP'
  | 'RDU' | 'RFD' | 'RIC' | 'RIV' | 'RNO' | 'ROA' | 'ROC' | 'SAC' | 'SAT' | 'SAV'
  | 'SBA' | 'SBN' | 'SCR' | 'SCZ' | 'SD'  | 'SEA' | 'SF'  | 'SFE' | 'SHV' | 'SIT'
  | 'SJC' | 'SLC' | 'SLE' | 'SLO' | 'SPO' | 'SPR' | 'SRO' | 'SRQ' | 'STA' | 'STL'
  | 'SYR' | 'TAC' | 'TB'  | 'TLH' | 'TOL' | 'TRI' | 'TUC' | 'TUL' | 'TWF' | 'VB'
  | 'VNT' | 'WAC' | 'WIC' | 'WPB' | 'WSM' | 'YNG'
  | string // fallback for future cities not yet in this union

export interface ImportRow {
  artist_name:    string
  venue:          string
  date:           string        // YYYY-MM-DD
  time:           string | null
  neighborhood:   string
  city:           CityCode
  genre:          string | null
  price:          string
  admission_type: 'Walk-up free' | 'Free RSVP'
  indoor_outdoor: 'Indoor' | 'Outdoor' | 'Both' | null
  is_verified:    boolean
  image_url:      string | null
  source_name:    string
  source_id:      string
  source_url:     string
}
