import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { extractEventDetails } from '@/lib/extract-event-details'
import { Concert, City } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface ApprovalRequest {
  submissionId: string
  action: 'approve' | 'reject'
}

// Valid metros
const VALID_METROS: City[] = ['NYC', 'LA', 'SF', 'CHI', 'AUS', 'SEA', 'DC', 'BOS', 'DEN', 'PDX']

// Map city names to metro codes
const cityToMetro: Record<string, City> = {
  'New York': 'NYC',
  'Los Angeles': 'LA',
  'San Francisco': 'SF',
  'Chicago': 'CHI',
  'Austin': 'AUS',
  'Seattle': 'SEA',
  'Washington': 'DC',
  'Boston': 'BOS',
  'Denver': 'DEN',
  'Portland': 'PDX',
}

// Fallback: map state to nearest metro
const stateToMetro: Record<string, City> = {
  'ME': 'BOS', 'NH': 'BOS', 'VT': 'BOS', 'MA': 'BOS', 'RI': 'BOS', 'CT': 'BOS',
  'NY': 'NYC', 'NJ': 'NYC', 'PA': 'NYC',
  'DE': 'DC', 'MD': 'DC', 'VA': 'DC', 'WV': 'DC', 'DC': 'DC',
  'NC': 'DC', 'SC': 'DC', 'GA': 'AUS', 'FL': 'AUS',
  'AL': 'AUS', 'MS': 'AUS', 'LA': 'LA', 'AR': 'AUS', 'TN': 'AUS', 'KY': 'DC',
  'OH': 'CHI', 'IN': 'CHI', 'IL': 'CHI', 'MI': 'CHI', 'WI': 'CHI',
  'MN': 'CHI', 'IA': 'DEN', 'MO': 'DEN', 'KS': 'DEN', 'NE': 'DEN', 'OK': 'AUS',
  'TX': 'AUS', 'MT': 'DEN', 'WY': 'DEN', 'CO': 'DEN', 'NM': 'AUS', 'UT': 'DEN',
  'ID': 'SEA', 'WA': 'SEA', 'OR': 'PDX', 'NV': 'SF', 'CA': 'LA', 'AZ': 'AUS',
  'HI': 'SF', 'AK': 'SEA', 'PR': 'NYC', 'GU': 'SF', 'VI': 'NYC', 'MP': 'SF', 'AS': 'SF',
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ApprovalRequest
    const { submissionId, action } = body

    if (!submissionId || !action) {
      return NextResponse.json(
        { message: 'Missing submissionId or action' },
        { status: 400 }
      )
    }

    // Fetch the submission
    const { data: submission, error: fetchError } = await supabase
      .from('event_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        { message: 'Submission not found' },
        { status: 404 }
      )
    }

    if (action === 'reject') {
      const { error } = await supabase
        .from('event_submissions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId)

      if (error) {
        return NextResponse.json(
          { message: 'Failed to reject submission' },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: 'Submission rejected' })
    }

    if (action === 'approve') {
      // Extract event details from the URL
      const extracted = await extractEventDetails(submission.source_url)

      // Validate minimum required fields
      if (!extracted.artist || !extracted.date) {
        return NextResponse.json(
          {
            message: 'Could not extract enough details from the URL',
            extracted,
          },
          { status: 400 }
        )
      }

      // Try to map submitted city to metro
      let city: City | undefined = cityToMetro[submission.submitted_city]

      // If not found, try state mapping as fallback
      if (!city) {
        const stateKey = submission.submitted_state.toUpperCase()
        city = stateToMetro[stateKey]
      }

      // Final fallback
      if (!city) {
        city = 'NYC'
      }

      // Validate city is in our supported metros
      if (!VALID_METROS.includes(city)) {
        return NextResponse.json(
          { message: `Unsupported metro: ${city}. We currently support: ${VALID_METROS.join(', ')}` },
          { status: 400 }
        )
      }

      // Create concert entry
      const concertData = {
        artist_name: extracted.artist,
        venue: extracted.venue || 'Venue TBD',
        date: extracted.date,
        time: extracted.time,
        neighborhood: `${submission.submitted_city}, ${submission.submitted_state}`,
        city,
        genre: null,
        price: 'Free',
        admission_type: 'Walk-up free' as const,
        indoor_outdoor: null,
        image_url: extracted.imageUrl,
        is_verified: false,
        source_url: submission.source_url,
        source_name: 'Community Submission',
        source_id: `community-${submissionId}`,
      }

      const { data: concert, error: concertError } = await supabase
        .from('concerts')
        .insert([concertData])
        .select()
        .single()

      if (concertError) {
        console.error('Error creating concert:', concertError)
        return NextResponse.json(
          { message: 'Failed to add concert to database' },
          { status: 500 }
        )
      }

      // Update submission with extracted data and concert_id
      const { error: updateError } = await supabase
        .from('event_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          extracted_artist: extracted.artist,
          extracted_venue: extracted.venue,
          extracted_date: extracted.date,
          extracted_time: extracted.time,
          extracted_image_url: extracted.imageUrl,
          concert_id: concert.id,
        })
        .eq('id', submissionId)

      if (updateError) {
        console.error('Error updating submission:', updateError)
        return NextResponse.json(
          { message: 'Failed to update submission' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Submission approved and concert added',
        concert,
        extracted,
      })
    }

    return NextResponse.json(
      { message: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
