import type { Metadata } from 'next';
import { SITE } from '@/lib/constants';
import JsonLd from '@/components/seo/JsonLd';
import SectionHeading from '@/components/shared/SectionHeading';
import { WHATSAPP_PRIMARY_URL, WHATSAPP_SECONDARY_URL } from '@/lib/whatsapp';
import { breadcrumbJsonLd, createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Contacto',
  description:
    'Contactá a Aguas del Cerro en La Rioja, Argentina. WhatsApp, email e Instagram para reservas y consultas.',
  path: '/contacto',
  keywords: ['contacto', 'WhatsApp', 'reservas La Rioja'],
});

export default function ContactoPage() {
  return (
    <div className="pt-28 pb-28 bg-brand-cream min-h-screen">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Contacto', path: '/contacto' },
        ])}
      />
      <div className="mx-auto max-w-3xl px-6 text-center">
        <SectionHeading
          eyebrow="Contacto"
          title="Estamos para acompañarte"
          description="Escribinos y te ayudamos a planificar tu experiencia."
        />
        <div className="space-y-6 text-left mt-12">
          <a href={WHATSAPP_PRIMARY_URL} target="_blank" rel="noopener noreferrer" className="block border border-brand-brown/10 bg-white p-6 hover:border-brand-gold transition-colors">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-gold font-body">WhatsApp principal</p>
            <p className="font-display text-2xl text-brand-brown mt-2">+54 380 4910523</p>
          </a>
          <a href={WHATSAPP_SECONDARY_URL} target="_blank" rel="noopener noreferrer" className="block border border-brand-brown/10 bg-white p-6 hover:border-brand-gold transition-colors">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-gold font-body">Contacto alternativo</p>
            <p className="font-display text-2xl text-brand-brown mt-2">+54 380 4941981</p>
          </a>
          <div className="border border-brand-brown/10 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-gold font-body">Email</p>
            <p className="font-body text-brand-brown mt-2">{SITE.email}</p>
          </div>
          <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className="block border border-brand-brown/10 bg-white p-6 hover:border-brand-gold transition-colors">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-gold font-body">Instagram</p>
            <p className="font-body text-brand-brown mt-2">@aguasdelcerro</p>
          </a>
        </div>
      </div>
    </div>
  );
}
