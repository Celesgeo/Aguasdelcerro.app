import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import JsonLd from '@/components/seo/JsonLd';
import Tx from '@/components/i18n/Tx';
import SectionHeading from '@/components/shared/SectionHeading';
import ScrollReveal from '@/components/shared/ScrollReveal';
import Button from '@/components/shared/Button';
import MembershipDownload from '@/components/membresias/MembershipDownload';
import { TICKET_PRICE_ARS, formatARS } from '@/lib/memberships';
import { breadcrumbJsonLd, createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Membresías',
  description:
    'Membresía visitante individual de Aguas del Cerro: un ingreso por persona en el día y turno que elijas. Pago online con Mercado Pago. La Rioja, Argentina.',
  path: '/membresias',
  keywords: ['membresía visitante', 'membresía individual', 'reservas', 'La Rioja'],
});

const INCLUDES = ['include1', 'include2', 'include3'] as const;
const EXTRAS = ['extra1', 'extra2'] as const;

export default function MembresiasPage() {
  return (
    <div className="bg-brand-cream min-h-screen">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Membresías', path: '/membresias' },
        ])}
      />
      <section className="pt-32 pb-16 px-6 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            i18n={{
              eyebrow: 'pages.memberships.kicker',
              title: 'pages.memberships.title',
              description: 'pages.memberships.description',
            }}
          />
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-10">
        <ScrollReveal className="mx-auto max-w-xl">
          <article className="flex flex-col border border-brand-gold bg-brand-brown p-8 md:p-10 text-brand-cream">
            <p className="mb-3 text-[11px] tracking-[0.3em] uppercase text-brand-gold font-body">
              <Tx k="pages.reservations.ticketEyebrow" />
            </p>
            <h2 className="font-display text-3xl text-brand-cream">
              <Tx k="pages.reservations.ticketTitle" />
            </h2>
            <p className="mt-6 font-display text-5xl text-brand-gold">{formatARS(TICKET_PRICE_ARS)}</p>
            <p className="mt-3 text-sm leading-relaxed font-body text-brand-cream/75">
              <Tx k="pages.reservations.ticketDetail" />
            </p>

            <ul className="mt-6 space-y-3 font-body text-sm">
              {INCLUDES.map((key) => (
                <li key={key} className="flex gap-3">
                  <Check size={16} className="mt-0.5 shrink-0 text-brand-gold" aria-hidden="true" />
                  <span className="text-brand-cream/85">
                    <Tx k={`pages.reservations.${key}`} />
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-[11px] tracking-[0.25em] uppercase text-brand-gold font-body">
              <Tx k="pages.reservations.extrasTitle" />
            </p>
            <ul className="mt-2 space-y-1 font-body text-sm text-brand-cream/70">
              {EXTRAS.map((key) => (
                <li key={key}>
                  <Tx k={`pages.reservations.${key}`} />
                </li>
              ))}
            </ul>

            <p className="mt-6 text-xs leading-relaxed font-body text-brand-cream/60">
              <Tx k="pages.reservations.minors" />
            </p>

            <div className="mt-8">
              <Button href="/reservas" className="w-full">
                <Tx k="pages.memberships.cardCta" />
              </Button>
            </div>
          </article>
        </ScrollReveal>
      </section>

      <section id="descarga" className="py-24 px-6 lg:px-10 scroll-mt-24 border-t border-brand-brown/10">
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            i18n={{
              eyebrow: 'pages.memberships.downloadKicker',
              title: 'pages.memberships.downloadTitle',
              description: 'pages.memberships.downloadDescription',
            }}
          />
          <MembershipDownload />
        </div>
      </section>
    </div>
  );
}
