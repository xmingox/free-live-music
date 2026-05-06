import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Don't expose "X-Powered-By: Next.js" header
  poweredByHeader: false,

  // Permanent redirects: strip trailing slashes for canonical consistency
  trailingSlash: false,

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
