import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import metros from '@/lib/metros.json'
import { City } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function generateSlug(artist: string, venue: string, date: string): string {
  return `${slugify(artist)}-${slugify(venue)}-${date}`
}

function getMetroCodeFromCity(cityName: string): City | null {
  const metro = metros.metros.find(
    (m) =>
      m.city.toLowerCase() === cityName.toLowerCase() ||
      m.aliases.some((a) => a.toLowerCase() === cityName.toLowerCase()),
  )
  return metro ? (metro.code as City) : null
}

interface BulkApproveBody {
  filter: 'auto_eligible'
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BulkApproveBody

    if (body.filter !== 'auto_eligible') {
      return NextResponse.json({ message: 'Invalid filter. Only "auto_eligible" is supported.' }, { status: 400 })
    }

    // Fetch all pending auto-approve-eligible submissions
    const { data: submissions, error: fetchError } = await supabase
      .from('event_submissions')
      .select('*')
      .eq('status', 'pending')
      .eq('auto_approve_eligible', true)

    if (fetchError) {
      return NextResponse.json({ message: 'Failed to fetch submissions', error: fetchError.message }, { status: 500 })
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ message: 'No auto-eligible pending submissions found.', approved: 0 })
    }

    let approved = 0
    let skipped = 0
    const errors: string[] = []

    for (const submission of submissions) {
      try {
        // Skip if already in concerts
        const { data: existing } = await supabase
          .from('concerts')
          .select('id')
          .eq('source_url', submission.source_url)
          .single()

        if (existing) {
          skipped++
          await supabase
            .from('event_submissions')
            .update({ status: 'approved', reviewed_at: new Date().toISOString() })
            .eq('id', submission.id)
          continue
        }

        const artist = submission.extracted_artist
        const venue = submission.extracted_venue || 'Venue TBD'
        const date = submission.extracted_date

        if (!artist || !date) {
          skipped++
          errors.push(`Submission ${submission.id}: missing artist or date`)
          continue
        }

        // Resolve city code: prefer city_code field, then extracted_city lookup
        let city: City = 'NYC'
        if (submission.city_code) {
          city = submission.city_code as City
        } else if (submission.extracted_city) {
          const resolved = getMetroCodeFromCity(submission.extracted_city)
          if (resolved) city = resolved
        }

        const neighborhood =
          submission.extracted_neighborhood ||
          (submission.extracted_city && submission.extracted_state
            ? `${submission.extracted_city}, ${submission.extracted_state}`
            : submission.extracted_city || submission.extracted_state || 'Unknown')

        const slug = generateSlug(artist, venue, date)

        const concertData = {
          artist_name: artist,
          venue,
          date,
          time: submission.extracted_time ?? null,
          neighborhood,
          city,
          genre: submission.extracted_genre ?? null,
          price: 'Free',
          admission_type: 'Walk-up free' as const,
          indoor_outdoor: null,
          image_url: submission.extracted_image_url ?? null,
          is_verified: true,
          source_url: submission.source_url,
          source_name: submission.source_extractor ?? 'Pipeline',
          source_id: `pipeline-${submission.id}`,
          slug,
          created_at: new Date().toISOString(),
        }

        const { data: concert, error: concertError } = await supabase
          .from('concerts')
          .insert([concertData])
          .select()
          .single()

        if (concertError) {
          errors.push(`Submission ${submission.id}: ${concertError.message}`)
          continue
        }

        await supabase
          .from('event_submissions')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            published_at: new Date().toISOString(),
            concert_id: concert.id,
          })
          .eq('id', submission.id)

        approved++
      } catch (err) {
        errors.push(`Submission ${submission.id}: ${err instanceof Error ? err.message : 'unknown error'}`)
      }
    }

    if (approved > 0) revalidateTag('concerts')

    return NextResponse.json({
      message: `Bulk approve complete. ${approved} approved, ${skipped} skipped.`,
      approved,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Bulk approve error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
