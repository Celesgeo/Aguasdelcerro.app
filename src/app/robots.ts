import { MetadataRoute } from 'next';
import { PUBLIC_ROUTES } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/api',
          '/data',
          '/.env',
          '/.git',
          '/node_modules',
          '/server.js',
          '/package.json',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: new URL(base).host,
  };
}
