'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_LINKS, SITE } from '@/lib/constants';
import Button from '@/components/shared/Button';

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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <Image src="/images/logo.png" alt={SITE.name} width={52} height={52} className="rounded-full" />
          <span className="hidden sm:block font-display text-brand-cream text-xl tracking-wide">
            {SITE.name}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs tracking-[0.22em] uppercase font-body transition-colors ${
                pathname === link.href ? 'text-brand-gold' : 'text-brand-cream/80 hover:text-brand-gold'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Button href="/reservas" variant="ghost" className="!py-2.5 !px-5 !text-xs">
            Reservar
          </Button>
        </nav>

        <button
          type="button"
          className="lg:hidden relative z-10 text-brand-cream"
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
            className="lg:hidden absolute inset-x-0 top-full bg-brand-brown/95 backdrop-blur-md border-b border-brand-gold/10 px-6 py-8"
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
