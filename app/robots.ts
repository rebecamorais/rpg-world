import type { MetadataRoute } from 'next';

import { SITE_URL } from '@frontend/constants/site';

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
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
