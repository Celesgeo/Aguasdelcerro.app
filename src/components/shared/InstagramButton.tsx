'use client';

import Link from 'next/link';
import { FaInstagram } from 'react-icons/fa';
import { SITE } from '@/lib/constants';
import { useT } from '@/components/i18n/LanguageProvider';

export default function InstagramButton({ className = '' }: { className?: string }) {
  const t = useT();
  return (
    <Link
      href={SITE.instagram}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 border border-brand-gold/30 px-8 py-3.5 text-xs tracking-[0.25em] uppercase text-brand-gold hover:bg-brand-gold/10 transition-all duration-500 font-body ${className}`}
    >
      <FaInstagram size={18} />
      {t('home.instagramCta')}
    </Link>
  );
}
