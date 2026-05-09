import { NextRequest, NextResponse } from 'next/server'
import { wrapWithAwin } from '@/lib/affiliate'

function applyAffiliateTracking(url: URL): string {
  const host = url.hostname.replace(/^www\./, '')

  // Booking.com via Awin — wrap in Awin tracking redirect
  if (host === 'booking.com' || host.endsWith('.booking.com')) {
    return wrapWithAwin(url.toString())
  }

  return url.toString()
}

export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get('to')

  if (!to) return NextResponse.redirect(new URL('/', request.url))

  let dest: URL
  try {
    dest = new URL(to)
  } catch {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Only allow http/https — reject javascript:, data:, etc.
  if (!['http:', 'https:'].includes(dest.protocol)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const finalUrl = applyAffiliateTracking(dest)

  return NextResponse.redirect(finalUrl, { status: 302 })
}
