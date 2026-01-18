import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/profile', '/login', '/api/'], // Private/internal paths
    },
    sitemap: 'https://scentia.fit/sitemap.xml',
  }
}
