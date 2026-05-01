import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'Free Live Music — Free Concerts Near You',
  description: 'Discover free live music concerts across the US. Find free outdoor shows in NYC, LA, Chicago, SF, Austin, Seattle, DC, Boston, Denver, Portland and more.',
  keywords: 'free concerts, free live music, outdoor concerts, free shows, free music near me',
  openGraph: {
    title: 'Free Live Music — Free Concerts Near You',
    description: 'Discover free live music concerts across the US. No tickets, no cover, just great music.',
    url: 'https://freelivemusic.co',
    siteName: 'Free Live Music',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Live Music — Free Concerts Near You',
    description: 'Discover free live music concerts across the US.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HE4QED3BWS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HE4QED3BWS');
          `}
        </Script>
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
