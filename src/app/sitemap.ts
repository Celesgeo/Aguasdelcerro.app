import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const pages = [
    '',
    '/experiencias',
    '/galeria',
    '/gastronomia',
    '/termas',
    '/membresias',
    '/contacto',
    '/reservas',
  ];
  return pages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }));
}
