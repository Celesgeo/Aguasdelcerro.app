import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { MembershipTierId } from '@/lib/memberships';
import { getMembershipById } from '@/lib/memberships';

export interface ExperienceUsage {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  time: string;
  experiencesUsed: number;
  note?: string;
  createdAt: string;
}

export interface MemberRecord {
  id: string;
  /** Número único de acceso (editable) */
  accessNumber: string;
  /** Código de 5 dígitos para descargar el carnet en la web */
  downloadCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  membershipId: MembershipTierId;
  totalExperiences: number;
  remainingExperiences: number;
  startDate: string;
  endDate: string;
  usageHistory: ExperienceUsage[];
  createdAt: string;
  updatedAt: string;
}

interface MembersStoreFile {
  members: MemberRecord[];
}

const STORE_PATH = path.join(process.cwd(), 'data', 'members-store.json');

const SEED: MemberRecord[] = [
  {
    id: 'seed-1',
    accessNumber: 'ADC-0001',
    downloadCode: '10245',
    firstName: 'María',
    lastName: 'González',
    membershipId: 'regular',
    totalExperiences: 25,
    remainingExperiences: 25,
    startDate: '2026-09-21',
    endDate: '2027-09-21',
    usageHistory: [],
    createdAt: '2026-09-21T12:00:00.000Z',
    updatedAt: '2026-09-21T12:00:00.000Z',
  },
  {
    id: 'seed-2',
    accessNumber: 'ADC-0002',
    downloadCode: '20458',
    firstName: 'Carlos',
    lastName: 'Ruiz',
    membershipId: 'plata',
    totalExperiences: 50,
    remainingExperiences: 50,
    startDate: '2026-09-21',
    endDate: '2027-09-21',
    usageHistory: [],
    createdAt: '2026-09-21T12:00:00.000Z',
    updatedAt: '2026-09-21T12:00:00.000Z',
  },
  {
    id: 'seed-3',
    accessNumber: 'ADC-0003',
    downloadCode: '30971',
    firstName: 'Ana',
    lastName: 'López',
    membershipId: 'oro',
    totalExperiences: 100,
    remainingExperiences: 100,
    startDate: '2026-09-21',
    endDate: '2027-09-21',
    usageHistory: [],
    createdAt: '2026-09-21T12:00:00.000Z',
    updatedAt: '2026-09-21T12:00:00.000Z',
  },
];

async function ensureStore(): Promise<MembersStoreFile> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as MembersStoreFile;
    if (!Array.isArray(parsed.members)) throw new Error('invalid store');
    return parsed;
  } catch {
    const initial: MembersStoreFile = { members: SEED };
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

async function writeStore(store: MembersStoreFile): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function nowIso() {
  return new Date().toISOString();
}

function generateDownloadCode(existing: Set<string>): string {
  for (let i = 0; i < 50; i++) {
    const code = String(Math.floor(10000 + Math.random() * 90000));
    if (!existing.has(code)) return code;
  }
  throw new Error('No se pudo generar un código único');
}

function generateAccessNumber(existing: Set<string>): string {
  let n = existing.size + 1;
  for (let i = 0; i < 200; i++) {
    const value = `ADC-${String(n).padStart(4, '0')}`;
    if (!existing.has(value.toUpperCase())) return value;
    n += 1;
  }
  return `ADC-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function listMembers(): Promise<MemberRecord[]> {
  const store = await ensureStore();
  return [...store.members].sort((a, b) => a.accessNumber.localeCompare(b.accessNumber));
}

export async function getMemberById(id: string): Promise<MemberRecord | null> {
  const store = await ensureStore();
  return store.members.find((m) => m.id === id) ?? null;
}

export async function findMemberByDownloadCode(code: string): Promise<MemberRecord | null> {
  const normalized = code.trim();
  if (!/^\d{5}$/.test(normalized)) return null;
  const store = await ensureStore();
  return store.members.find((m) => m.downloadCode === normalized) ?? null;
}

export type MemberInput = {
  accessNumber?: string;
  downloadCode?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  membershipId: MembershipTierId;
  totalExperiences?: number;
  remainingExperiences?: number;
  startDate: string;
  endDate: string;
};

export async function createMember(input: MemberInput): Promise<MemberRecord> {
  const store = await ensureStore();
  const accessNumbers = new Set(store.members.map((m) => m.accessNumber.toUpperCase()));
  const downloadCodes = new Set(store.members.map((m) => m.downloadCode));

  const tier = getMembershipById(input.membershipId);
  const total =
    input.totalExperiences ??
    tier?.experiences ??
    25;

  let accessNumber = (input.accessNumber || '').trim() || generateAccessNumber(accessNumbers);
  if (accessNumbers.has(accessNumber.toUpperCase())) {
    throw new Error('El número de acceso ya existe');
  }

  let downloadCode = (input.downloadCode || '').trim();
  if (downloadCode) {
    if (!/^\d{5}$/.test(downloadCode)) throw new Error('El código de descarga debe tener 5 dígitos');
    if (downloadCodes.has(downloadCode)) throw new Error('El código de descarga ya existe');
  } else {
    downloadCode = generateDownloadCode(downloadCodes);
  }

  const remaining =
    typeof input.remainingExperiences === 'number' ? input.remainingExperiences : total;

  const member: MemberRecord = {
    id: randomUUID(),
    accessNumber,
    downloadCode,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    membershipId: input.membershipId,
    totalExperiences: total,
    remainingExperiences: Math.max(0, remaining),
    startDate: input.startDate,
    endDate: input.endDate,
    usageHistory: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  store.members.push(member);
  await writeStore(store);
  return member;
}

export async function updateMember(id: string, input: Partial<MemberInput>): Promise<MemberRecord> {
  const store = await ensureStore();
  const idx = store.members.findIndex((m) => m.id === id);
  if (idx < 0) throw new Error('Socio no encontrado');

  const current = store.members[idx];
  const accessNumbers = new Set(
    store.members.filter((m) => m.id !== id).map((m) => m.accessNumber.toUpperCase()),
  );
  const downloadCodes = new Set(store.members.filter((m) => m.id !== id).map((m) => m.downloadCode));

  if (input.accessNumber !== undefined) {
    const next = input.accessNumber.trim();
    if (!next) throw new Error('El número de acceso es obligatorio');
    if (accessNumbers.has(next.toUpperCase())) throw new Error('El número de acceso ya existe');
    current.accessNumber = next;
  }

  if (input.downloadCode !== undefined) {
    const next = input.downloadCode.trim();
    if (!/^\d{5}$/.test(next)) throw new Error('El código de descarga debe tener 5 dígitos');
    if (downloadCodes.has(next)) throw new Error('El código de descarga ya existe');
    current.downloadCode = next;
  }

  if (input.firstName !== undefined) current.firstName = input.firstName.trim();
  if (input.lastName !== undefined) current.lastName = input.lastName.trim();
  if (input.email !== undefined) current.email = input.email.trim() || undefined;
  if (input.phone !== undefined) current.phone = input.phone.trim() || undefined;
  if (input.membershipId !== undefined) current.membershipId = input.membershipId;
  if (input.startDate !== undefined) current.startDate = input.startDate;
  if (input.endDate !== undefined) current.endDate = input.endDate;

  if (typeof input.totalExperiences === 'number') {
    current.totalExperiences = Math.max(0, input.totalExperiences);
  }
  if (typeof input.remainingExperiences === 'number') {
    current.remainingExperiences = Math.max(0, input.remainingExperiences);
  }

  current.updatedAt = nowIso();
  store.members[idx] = current;
  await writeStore(store);
  return current;
}

export async function deleteMember(id: string): Promise<void> {
  const store = await ensureStore();
  const next = store.members.filter((m) => m.id !== id);
  if (next.length === store.members.length) throw new Error('Socio no encontrado');
  store.members = next;
  await writeStore(store);
}

export async function addUsage(
  id: string,
  data: { date: string; time: string; experiencesUsed: number; note?: string },
): Promise<MemberRecord> {
  const store = await ensureStore();
  const idx = store.members.findIndex((m) => m.id === id);
  if (idx < 0) throw new Error('Socio no encontrado');

  const member = store.members[idx];
  const used = Math.max(1, Math.floor(data.experiencesUsed));
  if (used > member.remainingExperiences) {
    throw new Error(`Solo quedan ${member.remainingExperiences} experiencias disponibles`);
  }

  const entry: ExperienceUsage = {
    id: randomUUID(),
    date: data.date,
    time: data.time,
    experiencesUsed: used,
    note: data.note?.trim() || undefined,
    createdAt: nowIso(),
  };

  member.usageHistory = [entry, ...member.usageHistory];
  member.remainingExperiences -= used;
  member.updatedAt = nowIso();
  store.members[idx] = member;
  await writeStore(store);
  return member;
}

export async function deleteUsage(memberId: string, usageId: string): Promise<MemberRecord> {
  const store = await ensureStore();
  const idx = store.members.findIndex((m) => m.id === memberId);
  if (idx < 0) throw new Error('Socio no encontrado');

  const member = store.members[idx];
  const usage = member.usageHistory.find((u) => u.id === usageId);
  if (!usage) throw new Error('Registro de uso no encontrado');

  member.usageHistory = member.usageHistory.filter((u) => u.id !== usageId);
  member.remainingExperiences = Math.min(
    member.totalExperiences,
    member.remainingExperiences + usage.experiencesUsed,
  );
  member.updatedAt = nowIso();
  store.members[idx] = member;
  await writeStore(store);
  return member;
}
