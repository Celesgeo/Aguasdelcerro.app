'use client';

import { usePathname } from 'next/navigation';
import { FaWhatsapp } from 'react-icons/fa';
import { WHATSAPP_PRIMARY_URL } from '@/lib/whatsapp';

export default function WhatsAppFloat() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <a
      href={WHATSAPP_PRIMARY_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl animate-pulse-soft hover:scale-105 transition-transform"
    >
      <FaWhatsapp size={28} />
    </a>
  );
}
