import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import SectionHeading from '@/components/shared/SectionHeading';
import ScrollReveal from '@/components/shared/ScrollReveal';
import Button from '@/components/shared/Button';
import MembershipInquiryForm from '@/components/membresias/MembershipInquiryForm';
import MembershipDownload from '@/components/membresias/MembershipDownload';
import {
  MEMBERSHIP_TIERS,
  formatARS,
  formatMembershipPrice,
  type MembershipTier,
} from '@/lib/memberships';
import { getPaymentLink } from '@/lib/payment-links';

export const metadata: Metadata = {
  title: 'Membresías',
  description:
    'Membresías personales y Empresa Fundadora (USD) de Aguas del Cerro. Experiencias transferibles con beneficios exclusivos.',
};

function TierCard({
  tier,
  delay = 0,
  dark = false,
}: {
  tier: MembershipTier;
  delay?: number;
  dark?: boolean;
}) {
  const highlighted = Boolean(tier.highlight) || dark;
  const paymentLink = getPaymentLink(tier.id);
  const shortName = tier.name
    .replace('Membresía ', '')
    .replace('Empresa Fundadora ', '')
    .replace('Empresa Fundadora', 'Fundadora');

  return (
    <ScrollReveal delay={delay}>
      <article
        className={`h-full flex flex-col border p-8 ${
          highlighted
            ? 'border-brand-gold bg-brand-brown text-brand-cream'
            : 'border-brand-brown/15 bg-white text-brand-dark'
        }`}
      >
        {tier.highlight && (
          <p className="mb-4 text-[11px] tracking-[0.3em] uppercase text-brand-gold font-body">
            Más elegida
          </p>
        )}
        <h2
          className={`font-display text-3xl mb-2 ${
            highlighted ? 'text-brand-cream' : 'text-brand-brown'
          }`}
        >
          {shortName}
        </h2>
        <p
          className={`text-sm font-body mb-4 ${
            highlighted ? 'text-brand-cream/70' : 'text-brand-dark/55'
          }`}
        >
          {tier.tagline}
        </p>
        <p className={`text-xs font-body mb-1 ${highlighted ? 'text-brand-gold' : 'text-brand-dark/45'}`}>
          {tier.forWhom}
        </p>

        <div className="my-6">
          {tier.listValue ? (
            <p
              className={`text-sm line-through font-body ${
                highlighted ? 'text-brand-cream/40' : 'text-brand-dark/35'
              }`}
            >
              {formatARS(tier.listValue)}
            </p>
          ) : null}
          <p className={`font-display text-4xl ${highlighted ? 'text-brand-gold' : 'text-brand-brown'}`}>
            {formatMembershipPrice(tier)}
          </p>
          {tier.currency === 'USD' ? (
            <p
              className={`mt-2 text-sm font-body tracking-[0.08em] uppercase ${
                highlighted ? 'text-brand-gold' : 'text-brand-brown'
              }`}
            >
              Precio en USD · dólares estadounidenses
            </p>
          ) : null}
          {tier.savingsPercent ? (
            <p
              className={`mt-2 text-sm font-body ${
                highlighted ? 'text-brand-cream/75' : 'text-brand-dark/60'
              }`}
            >
              Ahorrás {formatARS(tier.savings ?? 0)} · {tier.savingsPercent}% menos
            </p>
          ) : null}
          {tier.experiences && tier.unitPrice ? (
            <p
              className={`mt-1 text-xs font-body ${
                highlighted ? 'text-brand-cream/45' : 'text-brand-dark/40'
              }`}
            >
              Valor unitario {formatARS(tier.unitPrice)} × {tier.experiences}
            </p>
          ) : null}
          {tier.currency === 'USD' && tier.experiences ? (
            <p
              className={`mt-1 text-xs font-body ${
                highlighted ? 'text-brand-cream/45' : 'text-brand-dark/40'
              }`}
            >
              Incluye {tier.experiences} experiencias · valor en dólares (USD)
            </p>
          ) : null}
        </div>

        <ul className="space-y-3 mb-6 flex-1">
          {tier.benefits.map((benefit) => (
            <li key={benefit} className="flex gap-3 text-sm font-body leading-snug">
              <Check
                size={16}
                className={`mt-0.5 shrink-0 ${highlighted ? 'text-brand-gold' : 'text-brand-brown'}`}
              />
              <span className={highlighted ? 'text-brand-cream/85' : 'text-brand-dark/75'}>
                {benefit}
              </span>
            </li>
          ))}
        </ul>

        {tier.note && (
          <p
            className={`mb-6 text-xs leading-relaxed font-body ${
              highlighted ? 'text-brand-cream/55' : 'text-brand-dark/50'
            }`}
          >
            {tier.note}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-3">
          {paymentLink ? (
            <Button href={paymentLink} variant={highlighted ? 'primary' : 'ghost'} className="w-full">
              Pagar ahora
            </Button>
          ) : null}
          <Button
            href="#consulta"
            variant={paymentLink ? 'ghost' : highlighted ? 'primary' : 'ghost'}
            className="w-full"
          >
            {paymentLink ? 'Consultar' : 'Consultar / Reservar'}
          </Button>
        </div>
      </article>
    </ScrollReveal>
  );
}

export default function MembresiasPage() {
  const personal = MEMBERSHIP_TIERS.filter((t) => t.category === 'personal');
  const empresas = MEMBERSHIP_TIERS.filter((t) => t.category === 'empresa');

  return (
    <div className="bg-brand-cream min-h-screen">
      <section className="pt-32 pb-16 px-6 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            eyebrow="Membresías"
            title="Más experiencias, mejor valor"
            description="Planes anuales transferibles y acumulables. Usá varias experiencias el mismo día con amigos y disfrutá beneficios exclusivos."
          />
        </div>
      </section>

      <section className="pb-20 px-6 lg:px-10">
        <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-3">
          {personal.map((tier, i) => (
            <TierCard key={tier.id} tier={tier} delay={i * 0.08} />
          ))}
        </div>
      </section>

      <section id="empresas" className="pb-24 px-6 lg:px-10 scroll-mt-24">
        <div className="mx-auto max-w-4xl mb-12">
          <SectionHeading
            eyebrow="Empresas fundadoras"
            title="Sé parte del origen"
            description="Planes en dólares estadounidenses (USD). Incluyen pases fundadores, experiencias para clientes o equipos, publicidad en el predio y nombramiento en la placa de fundadores."
          />
        </div>
        <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-3">
          {empresas.map((tier, i) => (
            <TierCard
              key={tier.id}
              tier={tier}
              delay={i * 0.08}
              dark={tier.id === 'empresa_oro'}
            />
          ))}
        </div>
      </section>

      <section id="consulta" className="py-24 bg-brand-brown px-6 lg:px-10 scroll-mt-24">
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            light
            eyebrow="Consulta"
            title="Escribinos por WhatsApp"
            description="Si preferís pagar online, usá “Pagar ahora” en el plan. Si tenés dudas o querés plan empresa, completá el formulario y te abrimos WhatsApp con tu consulta lista."
          />
          <div className="mt-4 rounded-sm bg-brand-cream/95 p-6 md:p-10">
            <MembershipInquiryForm />
          </div>
        </div>
      </section>

      <section id="descarga" className="py-24 px-6 lg:px-10 scroll-mt-24">
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            eyebrow="Descarga"
            title="Tu carnet de socio"
            description="Ingresá el código único de 5 dígitos emitido por Aguas del Cerro para descargar tu membresía con número de socio y vigencia."
          />
          <MembershipDownload />
        </div>
      </section>
    </div>
  );
}
