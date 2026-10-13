import type { NextConfig } from 'next';

import createNextIntlPlugin from 'next-intl/plugin';

import { securityHeaders } from './shared/http/security-headers';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          isDev: process.env.NODE_ENV === 'development',
        }),
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'images.rpgworldapp.com' }],
        destination: '/api/images/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.rpgworldapp.com',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
