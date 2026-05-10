import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
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
  manualCity?: string
}

const getMetroCodeFromCity = (cityName: string): City | null => {
  const metro = metros.metros.find(m => m.city.toLowerCase() === cityName.toLowerCase())
  return metro ? (metro.code as City) : null
}

const getMetroCodeFromState = (state: string): City | null => {
  const metro = metros.metros.find(m => m.state.toUpperCase() === state.toUpperCase())
  return metro ? (metro.code as City) : null
}

const detectCityFromUrl = (url: string): string | null => {
  const urlLower = url.toLowerCase()

  const cityPatterns: Record<string, string> = {
    // Special cases - check these first
    'attpac.org': 'Dallas',
    'flora-street': 'Dallas',

    // Texas cities
    'dallas': 'Dallas',
    'austintexas': 'Austin',
    'austin': 'Austin',
    'houston': 'Houston',
    'san-antonio': 'San Antonio',
    'ft-worth': 'Fort Worth',
    'dfw': 'Dallas',

    // Other major cities
    'newyork': 'New York',
    'losangeles': 'Los Angeles',
    'chicago': 'Chicago',
    'sanfrancisco': 'San Francisco',
    'sf': 'San Francisco',
    'boston': 'Boston',
    'denver': 'Denver',
    'seattle': 'Seattle',
    'portland': 'Portland',
    'miami': 'Miami',
    'atlanta': 'Atlanta',
  }

  for (const [pattern, city] of Object.entries(cityPatterns)) {
    if (urlLower.includes(pattern)) {
      return city
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ApprovalRequest
    const { submissionId, action, manualCity } = body

    if (!submissionId || !action) {
      return NextResponse.json(
        { message: 'Missing submissionId or action' },
        { status: 400 }
      )
    }

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

      const extracted = await extractEventDetails(submission.source_url)

      if (!extracted.artist || !extracted.date) {
        return NextResponse.json(
          {
            message: 'Could not extract enough details from the URL',
            extracted,
          },
          { status: 400 }
        )
      }

      // Priority: manual > extracted > URL pattern > fallback
      const detectedCity = extracted.city || detectCityFromUrl(submission.source_url)

      let city: City = 'NYC'
      if (manualCity && getMetroCodeFromCity(manualCity)) {
        city = getMetroCodeFromCity(manualCity) as City
      } else if (detectedCity && getMetroCodeFromCity(detectedCity)) {
        city = getMetroCodeFromCity(detectedCity) as City
      } else if (extracted.state && getMetroCodeFromState(extracted.state)) {
        city = getMetroCodeFromState(extracted.state) as City
      }

      const neighborhood = detectedCity && extracted.state
        ? `${detectedCity}, ${extracted.state}`
        : detectedCity || extracted.state || 'Unknown'

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

      const { error: updateError } = await supabase
        .from('event_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
          extracted_artist: extracted.artist,
          extracted_venue: extracted.venue,
          extracted_venue_address: extracted.venueAddress,
          extracted_city: detectedCity || extracted.city,
          extracted_state: extracted.state,
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

      revalidateTag('concerts')

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
