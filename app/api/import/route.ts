import { NextRequest, NextResponse } from 'next/server'
import { runImport } from '@/lib/importers/index'

// Used by Vercel Cron (GET) and manual triggers (POST).
// Both require: Authorization: Bearer {CRON_SECRET}
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const stats = await runImport()
    console.log('[/api/import]', stats)
    return NextResponse.json(stats)
  } catch (err) {
    console.error('[/api/import]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export const GET  = handle
export const POST = handle
