import Link from 'next/link';
import type { Metadata } from 'next';
import { SITE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: 'La página que buscás no existe en Aguas del Cerro.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="pt-28 pb-28 bg-brand-cream min-h-[60vh] flex items-center">
      <div className="mx-auto max-w-xl px-6 text-center">
        <p className="text-xs tracking-[0.35em] uppercase text-brand-gold mb-4 font-body">Error 404</p>
        <h1 className="font-display text-4xl md:text-5xl text-brand-brown mb-4">Página no encontrada</h1>
        <p className="text-brand-dark/70 font-body mb-10">
          El enlace puede estar roto o la página fue movida. Volvé al inicio para seguir explorando.
        </p>
        <Link
          href="/"
          className="inline-block border border-brand-brown bg-brand-brown px-8 py-3 text-brand-cream font-body text-sm tracking-wide hover:bg-brand-gold hover:border-brand-gold transition-colors"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
