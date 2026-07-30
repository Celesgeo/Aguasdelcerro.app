export type MembershipTierId =
  | 'regular'
  | 'plata'
  | 'oro'
  | 'empresa'
  | 'empresa_fundadora'
  | 'empresa_plata'
  | 'empresa_oro';

export type MembershipCurrency = 'ARS' | 'USD';

export interface MembershipTier {
  id: MembershipTierId;
  name: string;
  tagline: string;
  experiences?: number;
  duration: string;
  forWhom: string;
  price: number;
  currency?: MembershipCurrency;
  listValue?: number;
  savings?: number;
  savingsPercent?: number;
  unitPrice?: number;
  highlight?: boolean;
  category: 'personal' | 'empresa';
  benefits: string[];
  note?: string;
}

export const MEMBERSHIP_UNIT_PRICE = 20_000;

const EMPRESA_BASE_BENEFITS = [
  'Pase fundador personal gratis durante 1 año',
  'Pase fundador para acompañante durante 1 año',
  'Experiencias transferibles y acumulables (clientes, empleados, premios)',
  'Publicidad en el predio: parque térmico y mirador gastronómico',
  'Nombramiento en placa de fundadores en el predio',
  'Uso publicitario como Empresa Fundadora de Aguas del Cerro',
];

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: 'regular',
    name: 'Membresía Regular',
    tagline: '25 experiencias · 1 año',
    experiences: 25,
    duration: '1 año',
    forWhom: '1 persona · transferibles y acumulables',
    unitPrice: MEMBERSHIP_UNIT_PRICE,
    listValue: 500_000,
    price: 150_000,
    currency: 'ARS',
    savings: 350_000,
    savingsPercent: 70,
    category: 'personal',
    benefits: [
      'Acceso al predio',
      'Acceso al parque térmico',
      '10% de descuento en mirador gastronómico',
      'Acceso al evento anual para miembros',
      'Invitado especial a la inauguración',
    ],
    note: 'En un mismo día podés usar las 25 experiencias con amigos.',
  },
  {
    id: 'plata',
    name: 'Membresía Plata',
    tagline: '50 experiencias · 1 año',
    experiences: 50,
    duration: '1 año',
    forWhom: '1 persona · transferibles y acumulables',
    unitPrice: MEMBERSHIP_UNIT_PRICE,
    listValue: 1_000_000,
    price: 300_000,
    currency: 'ARS',
    savings: 700_000,
    savingsPercent: 70,
    highlight: true,
    category: 'personal',
    benefits: [
      'Acceso al predio',
      'Acceso al parque térmico',
      '10% de descuento en mirador gastronómico',
      'Acceso al evento anual para miembros',
      'Invitado especial a la inauguración',
    ],
    note: 'En un mismo día podés usar las 50 experiencias con amigos.',
  },
  {
    id: 'oro',
    name: 'Membresía Oro',
    tagline: '100 experiencias · 1 año',
    experiences: 100,
    duration: '1 año',
    forWhom: '1 persona · transferibles y acumulables',
    unitPrice: MEMBERSHIP_UNIT_PRICE,
    listValue: 2_000_000,
    price: 600_000,
    currency: 'ARS',
    savings: 1_400_000,
    savingsPercent: 70,
    category: 'personal',
    benefits: [
      'Acceso al predio',
      'Acceso al parque térmico',
      '10% de descuento en mirador gastronómico',
      'Acceso al evento anual para miembros',
      'Invitado especial a la inauguración',
    ],
    note: 'En un mismo día podés usar las 100 experiencias con amigos.',
  },
  {
    id: 'empresa_fundadora',
    name: 'Empresa Fundadora',
    tagline: '50 experiencias · 1 año',
    experiences: 50,
    duration: '1 año',
    forWhom: 'Empresas fundadoras',
    price: 1000,
    currency: 'USD',
    category: 'empresa',
    benefits: [...EMPRESA_BASE_BENEFITS],
    note: 'Ideal para acompañar el nacimiento de Aguas del Cerro con presencia de marca.',
  },
  {
    id: 'empresa_plata',
    name: 'Empresa Fundadora Plata',
    tagline: '100 experiencias · 1 año',
    experiences: 100,
    duration: '1 año',
    forWhom: 'Empresas fundadoras',
    price: 2000,
    currency: 'USD',
    highlight: true,
    category: 'empresa',
    benefits: [...EMPRESA_BASE_BENEFITS],
    note: 'Mayor volumen de experiencias para clientes, empleados y premios.',
  },
  {
    id: 'empresa_oro',
    name: 'Empresa Fundadora Oro',
    tagline: '150 experiencias · 1 año',
    experiences: 150,
    duration: '1 año',
    forWhom: 'Empresas fundadoras premium',
    price: 3000,
    currency: 'USD',
    category: 'empresa',
    benefits: [
      ...EMPRESA_BASE_BENEFITS,
      'Tarjeta diferencial Empresa Oro',
      'Mesa principal en el evento anual de fundadores',
      'Exclusividad en eventos y espacios publicitarios',
      'Nombramiento de una pileta del parque térmico con el nombre de la empresa',
    ],
    note: 'El nivel más exclusivo para empresas fundadoras.',
  },
];

/** Legacy id `empresa` maps to Empresa Fundadora */
export function getMembershipById(id: string) {
  if (id === 'empresa') {
    return MEMBERSHIP_TIERS.find((t) => t.id === 'empresa_fundadora');
  }
  return MEMBERSHIP_TIERS.find((t) => t.id === id);
}

export function isEmpresaMembership(id: string): boolean {
  return id === 'empresa' || id.startsWith('empresa_');
}

export function formatARS(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMembershipPrice(tier: MembershipTier): string {
  if (tier.currency === 'USD') return `${formatUSD(tier.price)} USD`;
  return formatARS(tier.price);
}
