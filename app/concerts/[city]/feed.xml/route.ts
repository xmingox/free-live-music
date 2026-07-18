import { NextRequest, NextResponse } from 'next/server'
import { getUsToday } from '@/lib/timezone'
import { createClient } from '@supabase/supabase-js'
import { getCityCodeFromSlug, getMetroByCode } from '@/lib/city-slugs'

function escapeXml(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ city: string }> }
) {
  const { city: citySlug } = await params

  const cityCode = getCityCodeFromSlug(citySlug)
  if (!cityCode) return new NextResponse('Not found', { status: 404 })
  const metro = getMetroByCode(cityCode)
  if (!metro) return new NextResponse('Not found', { status: 404 })

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return new NextResponse('Server error', { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const today = getUsToday()
  const cityNames = [metro.city, ...(metro.aliases || [])]

  const { data: concerts } = await supabase
    .from('concerts')
    .select('slug, artist_name, venue, neighborhood, date, time')
    .in('city', cityNames)
    .gte('date', today)
    .eq('is_verified', true)
    .order('date', { ascending: true })
    .limit(30)

  const feedUrl = `https://www.freelivemusic.co/concerts/${citySlug}/feed.xml`
  const siteUrl = `https://www.freelivemusic.co/concerts/${citySlug}`
  const now = new Date().toISOString()

  const entries = (concerts ?? []).map((c) => {
    const concertUrl = `https://www.freelivemusic.co/concert/${escapeXml(c.slug)}`
    const dateObj = new Date(c.date + 'T00:00:00')
    const dateLabel = dateObj.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    })
    const where = c.venue ? c.venue : c.neighborhood ? c.neighborhood : metro.city
    const summary = `Free concert${c.venue ? ` at ${c.venue}` : ''}${c.neighborhood ? `, ${c.neighborhood}` : ''} — ${dateLabel}. No tickets needed.`
    return `  <entry>
    <title>${escapeXml(c.artist_name)} — ${escapeXml(dateLabel)}</title>
    <link href="${concertUrl}"/>
    <id>${concertUrl}</id>
    <updated>${now}</updated>
    <summary type="text">${escapeXml(summary)}</summary>
    <category term="${escapeXml(where)}"/>
  </entry>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Free Concerts in ${escapeXml(metro.city)}</title>
  <subtitle>Upcoming free live music in ${escapeXml(metro.city)}, ${escapeXml(metro.state)}. No cover charge.</subtitle>
  <link href="${siteUrl}" rel="alternate" type="text/html"/>
  <link href="${feedUrl}" rel="self" type="application/atom+xml"/>
  <id>${siteUrl}</id>
  <updated>${now}</updated>
  <rights>© ${new Date().getFullYear()} freelivemusic.co</rights>
  <author>
    <name>Free Live Music</name>
    <uri>https://www.freelivemusic.co</uri>
  </author>
${entries}
</feed>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
    },
  })
}
