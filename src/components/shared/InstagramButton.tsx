import Link from 'next/link';
import { FaInstagram } from 'react-icons/fa';
import { SITE } from '@/lib/constants';

export default function InstagramButton({ className = '' }: { className?: string }) {
  return (
    <Link
      href={SITE.instagram}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 border border-brand-gold/30 px-8 py-3.5 text-xs tracking-[0.25em] uppercase text-brand-gold hover:bg-brand-gold/10 transition-all duration-500 font-body ${className}`}
    >
      <FaInstagram size={18} />
      Seguinos en Instagram
    </Link>
  );
}
