import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function authorized(req: NextRequest): boolean {
  const password = process.env.MODERATION_PASSWORD
  if (!password) return false
  return req.headers.get('authorization') === `Bearer ${password}`
}

// GET /api/moderation — fetch pending submissions
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('event_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('[moderation GET]', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PATCH /api/moderation — update submission status
// Body: { id: string, status: 'approved' | 'rejected' }
export async function PATCH(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, status } = await req.json()

  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { error } = await supabase
    .from('event_submissions')
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[moderation PATCH]', error)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
