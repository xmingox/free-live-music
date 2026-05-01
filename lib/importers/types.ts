export interface ImportRow {
  artist_name:    string
  venue:          string
  date:           string        // YYYY-MM-DD
  time:           string | null
  neighborhood:   string
  city:           'NYC' | 'LA' | 'SF' | 'CHI' | 'AUS' | 'SEA' | 'DC' | 'BOS' | 'DEN' | 'PDX'
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
