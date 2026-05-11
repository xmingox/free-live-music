import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Don't expose "X-Powered-By: Next.js" header
  poweredByHeader: false,

  // Permanent redirects: strip trailing slashes for canonical consistency
  trailingSlash: false,

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'freelivemusic.co' }],
        destination: 'https://www.freelivemusic.co/:path*',
        permanent: true,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow indexing everywhere; specific noindex pages set their own robots metadata
          { key: 'X-Robots-Tag', value: 'index, follow' },
        ],
      },
    ]
  },
}

export default nextConfig
