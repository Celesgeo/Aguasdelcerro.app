import type { MembershipTierId } from '@/lib/memberships';

/**
 * Links de pago de Mercado Pago.
 * Prioridad: variable de entorno → link por defecto del plan.
 * Si no hay link, ese plan solo muestra “Consultar”.
 */
const DEFAULT_PAYMENT_LINKS: Partial<Record<MembershipTierId, string>> = {
  regular: 'https://mpago.la/24EGjQU', // $150.000
  plata: 'https://mpago.la/31VWCmQ', // $300.000
  oro: 'https://mpago.la/1VVN2FR', // $600.000
};

const PAYMENT_LINK_ENV: Record<MembershipTierId, string | undefined> = {
  regular: process.env.NEXT_PUBLIC_MP_LINK_REGULAR ?? DEFAULT_PAYMENT_LINKS.regular,
  plata: process.env.NEXT_PUBLIC_MP_LINK_PLATA ?? DEFAULT_PAYMENT_LINKS.plata,
  oro: process.env.NEXT_PUBLIC_MP_LINK_ORO ?? DEFAULT_PAYMENT_LINKS.oro,
  empresa: process.env.NEXT_PUBLIC_MP_LINK_EMPRESA_FUNDADORA,
  empresa_fundadora: process.env.NEXT_PUBLIC_MP_LINK_EMPRESA_FUNDADORA,
  empresa_plata: process.env.NEXT_PUBLIC_MP_LINK_EMPRESA_PLATA,
  empresa_oro: process.env.NEXT_PUBLIC_MP_LINK_EMPRESA_ORO,
};

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getPaymentLink(tierId: MembershipTierId): string | null {
  const raw = PAYMENT_LINK_ENV[tierId]?.trim();
  if (!raw || !isHttpUrl(raw)) return null;
  return raw;
}

export function hasAnyPaymentLink(): boolean {
  return (Object.keys(PAYMENT_LINK_ENV) as MembershipTierId[]).some(
    (id) => getPaymentLink(id) !== null
  );
}
