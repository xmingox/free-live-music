import { NextRequest, NextResponse } from 'next/server'
import { getConcerts } from '@/lib/data'

export const revalidate = 3600

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get('city') || 'NYC'
  const concerts = await getConcerts(city)
  return NextResponse.json(concerts)
}
