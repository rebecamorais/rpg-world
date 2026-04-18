import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/change-password',
        '/forgot-password',
        '/reset-password',
        '/auth/callback',
      ],
    },
    sitemap: 'https://rpgworldapp.com/sitemap.xml',
  };
}
