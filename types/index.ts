export interface Concert {
  id: string
  display_id: string
  slug: string
  artist_name: string
  venue: string
  date: string
  time: string | null
  neighborhood: string
  city: 'NYC' | 'LA' | 'SF' | 'CHI' | 'AUS' | 'SEA' | 'DC' | 'BOS' | 'DEN' | 'PDX'
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

export type City = 'NYC' | 'LA' | 'SF' | 'CHI' | 'AUS' | 'SEA' | 'DC' | 'BOS' | 'DEN' | 'PDX'
export type DateFilter = 'tonight' | 'weekend' | 'week' | 'all' | 'custom'
