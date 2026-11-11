'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Mail, MapPin } from 'lucide-react';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { LEGAL, NAV_LINKS, SITE } from '@/lib/constants';
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

        <div className="mt-16 border-t border-brand-gold/10 pt-10 flex flex-col items-center gap-5 text-center font-body">
          <nav aria-label="Información legal" className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            <Link
              href="/arrepentimiento"
              className="border border-brand-gold/60 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-brand-gold hover:bg-brand-gold hover:text-brand-black transition-colors"
            >
              BOTÓN DE ARREPENTIMIENTO
            </Link>
            <Link
              href="/arrepentimiento?tipo=baja"
              className="border border-brand-gold/60 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-brand-gold hover:bg-brand-gold hover:text-brand-black transition-colors"
            >
              BOTÓN DE BAJA DE SERVICIO
            </Link>
          </nav>
          <nav aria-label="Documentos" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-brand-cream/70">
            <Link href="/contratos-de-adhesion" className="underline underline-offset-4 hover:text-brand-gold">
              Contratos de adhesión - Ley N° 24.240 de Defensa del Consumidor
            </Link>
            <Link href="/privacidad" className="underline underline-offset-4 hover:text-brand-gold">
              Política de privacidad
            </Link>
          </nav>
          <div className="max-w-3xl space-y-1 text-xs leading-relaxed text-brand-cream/55">
            {[LEGAL.businessName, LEGAL.cuit ? `CUIT ${LEGAL.cuit}` : '', LEGAL.address].filter(Boolean).length > 0 ? (
              <p>{[LEGAL.businessName, LEGAL.cuit ? `CUIT ${LEGAL.cuit}` : '', LEGAL.address].filter(Boolean).join(' · ')}</p>
            ) : null}
            <p>
              Atención al cliente, consultas y reclamos:{' '}
              <a href={`mailto:${LEGAL.supportEmail}`} className="underline underline-offset-2 hover:text-brand-gold">
                {LEGAL.supportEmail}
              </a>{' '}
              · WhatsApp{' '}
              <a href={WHATSAPP_PRIMARY_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-brand-gold">
                +{SITE.whatsappPrimary}
              </a>
              {LEGAL.supportHours ? ` · ${LEGAL.supportHours}` : ''}
            </p>
          </div>
          {LEGAL.dataFiscalUrl ? (
            <a href={LEGAL.dataFiscalUrl} target="_F960AFIPInfo" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.afip.gob.ar/images/f960/DATAWEB.jpg" alt="Data Fiscal" width={60} height={82} />
            </a>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 text-center text-xs tracking-[0.15em] text-brand-cream/40 font-body">
          <LanguageSwitch />
          <p>
            © {new Date().getFullYear()} {SITE.name}. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
