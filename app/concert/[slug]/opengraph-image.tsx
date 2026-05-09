import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const revalidate = 86400
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('concerts')
    .select('artist_name, venue, date, city')
    .eq('slug', slug)
    .single()

  const artist = data?.artist_name ?? 'Free Concert'
  const venue = data?.venue ?? ''
  const date = data?.date
    ? new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)',
        color: 'white',
        padding: '72px 80px',
        justifyContent: 'space-between',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 22, color: '#a78bfa', fontWeight: 700, letterSpacing: 1 }}>
          FREE LIVE MUSIC
        </div>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6d28d9', marginTop: 2 }} />
        <div style={{ fontSize: 22, color: '#64748b' }}>freelivemusic.co</div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div
          style={{
            fontSize: 16,
            color: '#818cf8',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 4,
          }}
        >
          Free Admission
        </div>
        <div
          style={{
            fontSize: artist.length > 30 ? 56 : 72,
            fontWeight: 900,
            lineHeight: 1.05,
            color: '#e2e8f0',
            maxWidth: 900,
          }}
        >
          {artist}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 8 }}>
          {venue && (
            <div style={{ fontSize: 28, color: '#94a3b8' }}>{venue}</div>
          )}
          {venue && date && (
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#475569', marginTop: 4 }} />
          )}
          {date && (
            <div style={{ fontSize: 28, color: '#94a3b8' }}>{date}</div>
          )}
        </div>
      </div>

      {/* Bottom badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(109,40,217,0.25)',
          border: '1px solid rgba(167,139,250,0.3)',
          borderRadius: 12,
          padding: '10px 20px',
          alignSelf: 'flex-start',
        }}
      >
        <div style={{ fontSize: 18, color: '#a78bfa' }}>No tickets · No cover · Just show up</div>
      </div>
    </div>
  )
}
