import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/intl/'],
    },
    sitemap: 'https://www.freelivemusic.co/sitemap.xml',
  }
}
