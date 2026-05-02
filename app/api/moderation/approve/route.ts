import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { extractEventDetails } from '@/lib/extract-event-details'
import { Concert, City } from '@/types'
import metros from '@/lib/metros.json'

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

// Get metro code from city name
const getMetroCodeFromCity = (cityName: string): City | null => {
  const metro = metros.metros.find(m => m.city.toLowerCase() === cityName.toLowerCase())
  return metro ? (metro.code as City) : null
}

// Get metro code from state (fallback)
const getMetroCodeFromState = (state: string): City | null => {
  const metro = metros.metros.find(m => m.state.toUpperCase() === state.toUpperCase())
  return metro ? (metro.code as City) : null
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
      // Check for duplicate URL in concerts table
      const { data: existingConcert } = await supabase
        .from('concerts')
        .select('id, slug')
        .eq('source_url', submission.source_url)
        .single()

      if (existingConcert) {
        return NextResponse.json(
          {
            message: 'This event is already in the database',
            existingConcertSlug: existingConcert.slug,
          },
          { status: 409 }
        )
      }

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

      // Map extracted city/state to metro code, fallback to NYC
      let city: City = 'NYC'
      if (extracted.city && getMetroCodeFromCity(extracted.city)) {
        city = getMetroCodeFromCity(extracted.city) as City
      } else if (extracted.state && getMetroCodeFromState(extracted.state)) {
        city = getMetroCodeFromState(extracted.state) as City
      }

      const neighborhood = extracted.city && extracted.state
        ? `${extracted.city}, ${extracted.state}`
        : extracted.city || extracted.state || 'Unknown'

      // Create concert entry
      const concertData = {
        artist_name: extracted.artist,
        venue: extracted.venue || 'Venue TBD',
        date: extracted.date,
        time: extracted.time,
        neighborhood,
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

      // Update submission with extracted data, concert_id, and published_at
      const { error: updateError } = await supabase
        .from('event_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
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
        message: 'Submission approved and concert published',
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
