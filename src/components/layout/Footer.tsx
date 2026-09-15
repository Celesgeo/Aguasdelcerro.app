'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Mail, MapPin } from 'lucide-react';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { NAV_LINKS, SITE } from '@/lib/constants';
import { WHATSAPP_PRIMARY_URL } from '@/lib/whatsapp';
import { useT } from '@/components/i18n/LanguageProvider';
import LanguageSwitch from '@/components/i18n/LanguageSwitch';

const NAV_KEYS: Record<string, string> = {
  '/': 'nav.home',
  '/experiencias': 'nav.experiences',
  '/termas': 'nav.termas',
  '/membresias': 'nav.memberships',
  '/gastronomia': 'nav.gastronomy',
  '/galeria': 'nav.gallery',
  '/contacto': 'nav.contact',
  '/reservas': 'nav.reservations',
  '/trabaja-con-nosotros': 'nav.careers',
};

export default function Footer() {
  const pathname = usePathname();
  const t = useT();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-brand-black text-brand-cream border-t border-brand-gold/10">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image src="/images/logo.png" alt={SITE.name} width={80} height={80} className="mb-6 rounded-full" />
            <p className="font-subtitle text-brand-gold text-lg">{SITE.tagline}</p>
            <p className="mt-3 text-sm text-brand-cream/60 font-body">{SITE.location}</p>
          </div>

          <div>
            <h3 className="mb-5 text-xs tracking-[0.3em] uppercase text-brand-gold font-body">{t('footer.navigation')}</h3>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-brand-cream/70 hover:text-brand-gold transition-colors font-body">
                    {t(NAV_KEYS[link.href] ?? link.href)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-xs tracking-[0.3em] uppercase text-brand-gold font-body">{t('footer.contact')}</h3>
            <ul className="space-y-4 text-sm font-body text-brand-cream/70">
              <li>
                <a href={WHATSAPP_PRIMARY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-brand-gold">
                  <FaWhatsapp /> +54 380 4910523
                </a>
              </li>
              <li>
                <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-brand-gold">
                  <FaInstagram /> @aguasdelcerro
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-2 hover:text-brand-gold">
                  <Mail size={16} /> {SITE.email}
                </a>
              </li>
              <li>
                <a href={SITE.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-brand-gold">
                  <MapPin size={16} /> {t('footer.howToGet')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-xs tracking-[0.3em] uppercase text-brand-gold font-body">{t('footer.experience')}</h3>
            <p className="text-sm leading-relaxed text-brand-cream/65 font-body">
              {t('footer.blurb')}
            </p>
          </div>
        </div>

        <div className="mt-16 border-t border-brand-gold/10 pt-8 flex flex-col items-center gap-4 text-center text-xs tracking-[0.15em] text-brand-cream/40 font-body">
          <LanguageSwitch />
          <p>
            © {new Date().getFullYear()} {SITE.name}. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
