'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SITE } from '@/lib/constants';

export default function AdminShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <header className="bg-brand-brown border-b border-brand-gold/15">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/images/logo.png" alt={SITE.name} width={44} height={44} className="rounded-full" />
            <div>
              <p className="text-[11px] tracking-[0.25em] uppercase text-brand-gold font-body">Admin</p>
              <h1 className="font-display text-xl text-brand-cream">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/membresias" className="text-xs tracking-[0.15em] uppercase text-brand-cream/70 hover:text-brand-gold font-body">
              Ver sitio
            </Link>
            <button
              type="button"
              onClick={logout}
              className="text-xs tracking-[0.15em] uppercase border border-brand-gold/30 text-brand-gold px-4 py-2 font-body hover:bg-brand-gold/10"
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-10">{children}</div>
    </div>
  );
}
