'use client';

import { useT } from '@/components/i18n/LanguageProvider';

export default function Tx({
  k,
  className,
}: {
  k: string;
  className?: string;
}) {
  const t = useT();
  return <span className={className}>{t(k)}</span>;
}
