'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_LINKS, SITE } from '@/lib/constants';
import Button from '@/components/shared/Button';

/** En desktop el logo va al inicio y el botón a reservas; acá van el resto. */
const HEADER_NAV_LINKS = NAV_LINKS.filter(
  (link) => link.href !== '/' && link.href !== '/reservas',
);

function headerLinkLabel(label: string, href: string): string {
  if (href === '/trabaja-con-nosotros') return 'Trabajá';
  return label;
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  if (isAdmin) return null;

  const solid = scrolled || !isHome;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ${
        solid
          ? 'bg-brand-brown/90 backdrop-blur-md border-b border-brand-gold/10 py-3'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 lg:px-10">
        <Link href="/" className="relative z-20 flex shrink-0 items-center gap-3 min-w-0">
          <Image src="/images/logo.png" alt={SITE.name} width={52} height={52} className="rounded-full shrink-0" />
          <span className="hidden xl:block font-display text-brand-cream text-xl tracking-wide whitespace-nowrap">
            {SITE.name}
          </span>
        </Link>

        <nav className="hidden xl:flex flex-1 items-center justify-end gap-5 min-w-0">
          {HEADER_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 text-[11px] tracking-[0.18em] uppercase font-body transition-colors whitespace-nowrap ${
                pathname === link.href ? 'text-brand-gold' : 'text-brand-cream/80 hover:text-brand-gold'
              }`}
            >
              {headerLinkLabel(link.label, link.href)}
            </Link>
          ))}
          <Button href="/reservas" variant="ghost" className="!py-2.5 !px-5 !text-xs shrink-0 ml-1">
            Reservar
          </Button>
        </nav>

        <button
          type="button"
          className="xl:hidden relative z-20 ml-auto text-brand-cream"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="xl:hidden absolute inset-x-0 top-full bg-brand-brown/95 backdrop-blur-md border-b border-brand-gold/10 px-6 py-8"
          >
            <div className="flex flex-col gap-5">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm tracking-[0.2em] uppercase text-brand-cream/90"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
