import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// UUID v4 regex for validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// POST { concertId: string }
// Public beacon endpoint — no auth required.
// Increments event_views by 1 for a valid concert UUID.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const concertId: unknown = body?.concertId

    if (!concertId || typeof concertId !== 'string' || !UUID_RE.test(concertId)) {
      return NextResponse.json({ error: 'Invalid concertId' }, { status: 400 })
    }

    await supabase.rpc('increment_event_views', { p_id: concertId })

    return NextResponse.json({ ok: true })
  } catch {
    // Never throw — always return 200 or 400
    return NextResponse.json({ ok: true })
  }
}
