import type { Viewport } from 'next';
import { Cormorant_Garamond, Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Loader from '@/components/layout/Loader';
import WhatsAppFloat from '@/components/shared/WhatsAppFloat';
import BackgroundAmbience from '@/components/shared/BackgroundAmbience';
import JsonLd from '@/components/seo/JsonLd';
import {
  createRootMetadata,
  faqPageJsonLd,
  localBusinessJsonLd,
  organizationJsonLd,
  webSiteJsonLd,
} from '@/lib/seo';

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

export const metadata = createRootMetadata();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4B220C',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${cormorant.variable} ${playfair.variable} ${inter.variable} h-full`}>
      <head>
        <meta
          name="google-site-verification"
          content="2Lg9VCEJ54m2kLcJB9gjAVw_B0VMxoZhdglIGT_o6Ug"
        />
        <JsonLd
          data={[organizationJsonLd(), webSiteJsonLd(), localBusinessJsonLd(), faqPageJsonLd()]}
        />
      </head>
      <body className="min-h-full flex flex-col bg-brand-cream text-brand-black antialiased">
        <Loader />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFloat />
        <BackgroundAmbience />
      </body>
    </html>
  );
}
