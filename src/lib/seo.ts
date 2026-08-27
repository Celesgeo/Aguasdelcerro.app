import type { Metadata } from 'next';
import { FAQ_ITEMS, SITE } from '@/lib/constants';
import { getSiteUrl, absoluteUrl } from '@/lib/site-url';

/** Rutas públicas indexables (sin admin ni API). */
export const PUBLIC_ROUTES = [
  { path: '', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/experiencias', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/termas', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/gastronomia', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/membresias', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/galeria', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/reservas', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/contacto', priority: 0.7, changeFrequency: 'yearly' as const },
] as const;

type PageSeoOptions = {
  title: string;
  description: string;
  path: string;
  /** Imagen OG relativa o absoluta. */
  image?: string;
  /** Palabras clave adicionales para la página. */
  keywords?: string[];
  /** false solo para páginas que no deben indexarse (p. ej. 404). */
  index?: boolean;
};

/** Metadatos consistentes con canonical, Open Graph y Twitter por página. */
export function createPageMetadata({
  title,
  description,
  path,
  image = '/images/logo.png',
  keywords = [],
  index = true,
}: PageSeoOptions): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = image.startsWith('http') ? image : absoluteUrl(image);

  return {
    title,
    description,
    keywords: [...keywords, SITE.name, SITE.location, SITE.domain],
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'es_AR',
      url,
      siteName: SITE.name,
      title: `${title} | ${SITE.name}`,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: SITE.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE.name}`,
      description,
      images: [imageUrl],
    },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
  };
}

/** Metadatos globales del sitio (layout raíz). */
export function createRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const description =
    'Refugio de montaña en La Rioja, Argentina. Parque térmico y mirador gastronómico con vistas panorámicas. Una experiencia de lujo, naturaleza y tranquilidad.';

  const verification: Metadata['verification'] = {};
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  if (googleVerification) {
    verification.google = googleVerification;
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${SITE.name} | ${SITE.tagline}`,
      template: `%s | ${SITE.name}`,
    },
    description,
    keywords: [
      'parque térmico',
      'La Rioja',
      'mirador gastronómico',
      'turismo de lujo',
      'Argentina',
      SITE.domain,
      'aguas del cerro',
      'termas La Rioja',
    ],
    authors: [{ name: SITE.name, url: siteUrl }],
    creator: SITE.name,
    publisher: SITE.name,
    category: 'travel',
    openGraph: {
      type: 'website',
      locale: 'es_AR',
      url: siteUrl,
      siteName: SITE.name,
      title: `${SITE.name} | ${SITE.tagline}`,
      description,
      images: [{ url: '/images/logo.png', width: 1200, height: 630, alt: SITE.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE.name,
      description: SITE.tagline,
      images: ['/images/logo.png'],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    manifest: '/manifest.json',
    alternates: { canonical: siteUrl },
    ...(Object.keys(verification).length ? { verification } : {}),
  };
}

export function organizationJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: SITE.name,
    url: siteUrl,
    logo: absoluteUrl('/images/logo.png'),
    email: SITE.email,
    sameAs: [SITE.instagram],
  };
}

export function webSiteJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: SITE.name,
    url: siteUrl,
    description: SITE.tagline,
    inLanguage: 'es-AR',
    publisher: { '@id': `${siteUrl}/#organization` },
  };
}

export function localBusinessJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    '@id': `${siteUrl}/#business`,
    name: SITE.name,
    description: SITE.tagline,
    url: siteUrl,
    image: absoluteUrl('/images/logo.png'),
    email: SITE.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'La Rioja',
      addressRegion: 'La Rioja',
      addressCountry: 'AR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE.coordinates.lat,
      longitude: SITE.coordinates.lng,
    },
    sameAs: [SITE.instagram],
  };
}

export function faqPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
