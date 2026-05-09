import { NextRequest, NextResponse } from 'next/server'

function applyAffiliateParams(url: URL): URL {
  const out = new URL(url.toString())
  const host = url.hostname.replace(/^www\./, '')

  // Booking.com — sign up at booking.com/affiliate-program/
  // Set BOOKING_AFFILIATE_ID in Vercel env vars once approved
  if (
    (host === 'booking.com' || host.endsWith('.booking.com')) &&
    process.env.BOOKING_AFFILIATE_ID
  ) {
    out.searchParams.set('aid', process.env.BOOKING_AFFILIATE_ID)
  }

  return out
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

  dest = applyAffiliateParams(dest)

  return NextResponse.redirect(dest.toString(), { status: 302 })
}
