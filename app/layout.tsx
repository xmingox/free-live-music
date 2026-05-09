import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/react'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Free Live Music — Free Concerts Nationwide',
  description: 'Find free live music concerts across the USA. Browse concerts in 173+ cities including New York, Los Angeles, Chicago, San Francisco, Austin, Seattle, Denver, Boston, Miami, Atlanta, and more. Always free, no tickets needed.',
  keywords: 'free concerts, free live music, outdoor concerts, free shows, free music near me, live music USA',
  openGraph: {
    title: 'Free Live Music — Free Concerts Nationwide',
    description: 'Discover free live music in 173+ cities across the USA. No tickets, no cover, just great music.',
    url: 'https://www.freelivemusic.co',
    siteName: 'Free Live Music',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Live Music — Free Concerts Nationwide',
    description: 'Find free concerts in 173+ US cities. Always free, no tickets required.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HE4QED3BWS"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
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
