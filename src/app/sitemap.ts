import { MetadataRoute } from 'next';
import { SITE } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://aguasdelcerro.com';
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
