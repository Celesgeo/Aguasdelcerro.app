import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Loader from '@/components/layout/Loader';
import WhatsAppFloat from '@/components/shared/WhatsAppFloat';
import { SITE } from '@/lib/constants';
import { getSiteUrl } from '@/lib/site-url';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '500', '600', '700'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description:
    'Refugio de montaña en La Rioja, Argentina. Parque térmico y mirador gastronómico con vistas panorámicas. Una experiencia de lujo, naturaleza y tranquilidad.',
  keywords: ['parque térmico', 'La Rioja', 'mirador gastronómico', 'turismo de lujo', 'Argentina', 'aguasdelcerro.com.ar'],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: getSiteUrl(),
    siteName: SITE.name,
    title: `${SITE.name} | ${SITE.tagline}`,
    description: 'Parque térmico y mirador gastronómico en La Rioja, Argentina.',
    images: [{ url: '/images/logo.png', width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.name,
    description: SITE.tagline,
    images: ['/images/logo.png'],
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  alternates: {
    canonical: getSiteUrl(),
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${cormorant.variable} ${playfair.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-brand-cream text-brand-black antialiased">
        <Loader />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
