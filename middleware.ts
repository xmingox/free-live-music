/**
 * middleware.ts
 *
 * Intercepts /concert/:slug requests. For concerts whose date is 7+ days in
 * the past (or that have is_archived = true), returns HTTP 410 Gone so search
 * engines deindex the URL immediately rather than following a 308 redirect.
 *
 * Concerts 0–6 days past still reach the page component, which renders them
 * with noindex metadata — useful for people searching for recent show info.
 */

import { NextRequest, NextResponse } from 'next/server'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// 7 days in ms
const GONE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

export const config = {
  matcher: '/concert/:slug*',
}

function goneHtml(cityPath: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Event Ended · Free Live Music</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#020617;color:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}
    .card{max-width:480px;width:100%;text-align:center}
    .badge{display:inline-block;background:rgba(139,92,246,.15);color:#a78bfa;border:1px solid rgba(139,92,246,.3);border-radius:999px;font-size:.75rem;font-weight:600;padding:.25rem .75rem;margin-bottom:1.5rem;letter-spacing:.05em}
    h1{font-size:1.75rem;font-weight:800;margin-bottom:.75rem}
    p{color:#94a3b8;margin-bottom:2rem;line-height:1.6}
    a{display:inline-block;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;font-weight:700;padding:.75rem 1.75rem;border-radius:.75rem;text-decoration:none;transition:opacity .15s}
    a:hover{opacity:.85}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">EVENT ENDED</div>
    <h1>This show has passed</h1>
    <p>This free concert has already taken place. Browse upcoming shows to find your next live music experience.</p>
    <a href="${cityPath}">Browse upcoming free shows →</a>
  </div>
</body>
</html>`
}

export async function middleware(req: NextRequest) {
  const slug = req.nextUrl.pathname.replace(/^\/concert\//, '').split('?')[0]
  if (!slug) return NextResponse.next()

  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/concerts?slug=eq.${encodeURIComponent(slug)}&select=date,is_archived,city&limit=1`,
      {
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          Accept: 'application/json',
        },
      },
    )

    if (!res.ok) return NextResponse.next()

    const [concert] = await res.json() as Array<{ date: string; is_archived: boolean | null; city: string }> | []
    if (!concert) return NextResponse.next() // 404 handled by page

    const concertDate = new Date(concert.date + 'T00:00:00')
    const isPast = Date.now() - concertDate.getTime() > GONE_THRESHOLD_MS
    const isArchived = concert.is_archived === true

    if (isPast || isArchived) {
      // Build a best-guess city path for the CTA link
      const cityPath = `/concerts/${concert.city.toLowerCase().replace(/\s+/g, '-')}`

      return new NextResponse(goneHtml(cityPath), {
        status: 410,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Robots-Tag': 'noindex',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }
  } catch {
    // Supabase unreachable — let the page component handle it gracefully
  }

  return NextResponse.next()
}
