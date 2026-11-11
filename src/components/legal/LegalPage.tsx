import type { ReactNode } from 'react';

/** Contenedor común para las páginas legales: tipografía cuidada y lectura cómoda. */
export default function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-brand-cream min-h-screen pt-32 pb-28">
      <article lang="es" className="mx-auto max-w-3xl px-6 lg:px-10 font-body text-brand-dark">
        <p className="mb-3 text-[11px] tracking-[0.3em] uppercase text-brand-gold">{eyebrow}</p>
        <h1 className="font-display text-4xl md:text-5xl text-brand-brown leading-tight">{title}</h1>
        {updated ? <p className="mt-4 text-sm text-brand-dark/55">Vigente desde el {updated}.</p> : null}
        <div className="legal-body mt-10 space-y-8 text-[15px] leading-relaxed text-brand-dark/80">{children}</div>
      </article>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl text-brand-brown">{title}</h2>
      {children}
    </section>
  );
}
