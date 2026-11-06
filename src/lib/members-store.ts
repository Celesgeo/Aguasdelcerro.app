import { randomInt, randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { query, transaction } from '@/lib/db';
import type { MembershipTierId } from '@/lib/memberships';
import { getMembershipById } from '@/lib/memberships';

/**
 * Socios y uso de experiencias, guardados en Postgres.
 * Mantiene las mismas funciones y formas de datos que la versión anterior en archivo JSON,
 * así el panel /admin y la descarga del carnet siguen funcionando igual.
 */

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

interface MemberRow {
  id: string;
  access_number: string;
  download_code: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  membership_id: string;
  total_experiences: number;
  remaining_experiences: number;
  start_date: string;
  end_date: string;
  created_at: Date;
  updated_at: Date;
}

interface UsageRow {
  id: string;
  member_id: string;
  usage_date: string;
  usage_time: string;
  experiences_used: number;
  note: string | null;
  created_at: Date;
}

function toUsage(row: UsageRow): ExperienceUsage {
  return {
    id: row.id,
    date: row.usage_date,
    time: row.usage_time,
    experiencesUsed: row.experiences_used,
    note: row.note ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function toMember(row: MemberRow, usage: UsageRow[]): MemberRecord {
  return {
    id: row.id,
    accessNumber: row.access_number,
    downloadCode: row.download_code,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    membershipId: row.membership_id as MembershipTierId,
    totalExperiences: row.total_experiences,
    remainingExperiences: row.remaining_experiences,
    startDate: row.start_date,
    endDate: row.end_date,
    usageHistory: usage.filter((u) => u.member_id === row.id).map(toUsage),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function loadMembers(where = '', values: unknown[] = []): Promise<MemberRecord[]> {
  const members = await query<MemberRow>(`SELECT * FROM members ${where}`, values);
  if (members.length === 0) return [];
  const usage = await query<UsageRow>(
    'SELECT * FROM member_usage WHERE member_id = ANY($1::uuid[]) ORDER BY created_at DESC',
    [members.map((m) => m.id)],
  );
  return members.map((m) => toMember(m, usage));
}

async function loadMemberWith(client: PoolClient, id: string): Promise<MemberRecord | null> {
  const members = (await client.query<MemberRow>('SELECT * FROM members WHERE id = $1', [id])).rows;
  if (!members[0]) return null;
  const usage = (
    await client.query<UsageRow>('SELECT * FROM member_usage WHERE member_id = $1 ORDER BY created_at DESC', [id])
  ).rows;
  return toMember(members[0], usage);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function generateDownloadCode(client: PoolClient): Promise<string> {
  for (let i = 0; i < 80; i++) {
    const code = String(randomInt(10000, 100000));
    const taken = await client.query('SELECT 1 FROM members WHERE download_code = $1', [code]);
    if (taken.rows.length === 0) return code;
  }
  throw new Error('No se pudo generar un código único');
}

async function generateAccessNumber(client: PoolClient): Promise<string> {
  const { rows } = await client.query<{ count: number }>('SELECT count(*)::int AS count FROM members');
  let n = Number(rows[0]?.count ?? 0) + 1;
  for (let i = 0; i < 200; i++) {
    const value = `ADC-${String(n).padStart(4, '0')}`;
    const taken = await client.query('SELECT 1 FROM members WHERE upper(access_number) = upper($1)', [value]);
    if (taken.rows.length === 0) return value;
    n += 1;
  }
  return `ADC-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function listMembers(): Promise<MemberRecord[]> {
  const members = await loadMembers();
  return members.sort((a, b) => a.accessNumber.localeCompare(b.accessNumber));
}

export async function getMemberById(id: string): Promise<MemberRecord | null> {
  if (!isUuid(id)) return null;
  const members = await loadMembers('WHERE id = $1', [id]);
  return members[0] ?? null;
}

export async function findMemberByDownloadCode(code: string): Promise<MemberRecord | null> {
  const normalized = code.trim();
  if (!/^\d{5}$/.test(normalized)) return null;
  const members = await loadMembers('WHERE download_code = $1', [normalized]);
  return members[0] ?? null;
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
  return transaction(async (client) => {
    await client.query('LOCK TABLE members IN SHARE ROW EXCLUSIVE MODE');

    const tier = getMembershipById(input.membershipId);
    const total = input.totalExperiences ?? tier?.experiences ?? 25;

    const accessNumber = (input.accessNumber || '').trim() || (await generateAccessNumber(client));
    const accessTaken = await client.query('SELECT 1 FROM members WHERE upper(access_number) = upper($1)', [accessNumber]);
    if (accessTaken.rows.length > 0) throw new Error('El número de acceso ya existe');

    let downloadCode = (input.downloadCode || '').trim();
    if (downloadCode) {
      if (!/^\d{5}$/.test(downloadCode)) throw new Error('El código de descarga debe tener 5 dígitos');
      const codeTaken = await client.query('SELECT 1 FROM members WHERE download_code = $1', [downloadCode]);
      if (codeTaken.rows.length > 0) throw new Error('El código de descarga ya existe');
    } else {
      downloadCode = await generateDownloadCode(client);
    }

    const remaining = typeof input.remainingExperiences === 'number' ? input.remainingExperiences : total;
    const id = randomUUID();

    await client.query(
      `INSERT INTO members
        (id, access_number, download_code, first_name, last_name, email, phone, membership_id,
         total_experiences, remaining_experiences, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        id,
        accessNumber,
        downloadCode,
        input.firstName.trim(),
        input.lastName.trim(),
        input.email?.trim() || null,
        input.phone?.trim() || null,
        input.membershipId,
        total,
        Math.max(0, remaining),
        input.startDate,
        input.endDate,
      ],
    );

    const member = await loadMemberWith(client, id);
    if (!member) throw new Error('No se pudo crear el socio');
    return member;
  });
}

export async function updateMember(id: string, input: Partial<MemberInput>): Promise<MemberRecord> {
  if (!isUuid(id)) throw new Error('Socio no encontrado');

  return transaction(async (client) => {
    const current = (await client.query<MemberRow>('SELECT * FROM members WHERE id = $1 FOR UPDATE', [id])).rows[0];
    if (!current) throw new Error('Socio no encontrado');

    const next = { ...current };

    if (input.accessNumber !== undefined) {
      const value = input.accessNumber.trim();
      if (!value) throw new Error('El número de acceso es obligatorio');
      const taken = await client.query(
        'SELECT 1 FROM members WHERE upper(access_number) = upper($1) AND id <> $2',
        [value, id],
      );
      if (taken.rows.length > 0) throw new Error('El número de acceso ya existe');
      next.access_number = value;
    }

    if (input.downloadCode !== undefined) {
      const value = input.downloadCode.trim();
      if (!/^\d{5}$/.test(value)) throw new Error('El código de descarga debe tener 5 dígitos');
      const taken = await client.query('SELECT 1 FROM members WHERE download_code = $1 AND id <> $2', [value, id]);
      if (taken.rows.length > 0) throw new Error('El código de descarga ya existe');
      next.download_code = value;
    }

    if (input.firstName !== undefined) next.first_name = input.firstName.trim();
    if (input.lastName !== undefined) next.last_name = input.lastName.trim();
    if (input.email !== undefined) next.email = input.email.trim() || null;
    if (input.phone !== undefined) next.phone = input.phone.trim() || null;
    if (input.membershipId !== undefined) next.membership_id = input.membershipId;
    if (input.startDate !== undefined) next.start_date = input.startDate;
    if (input.endDate !== undefined) next.end_date = input.endDate;
    if (typeof input.totalExperiences === 'number') next.total_experiences = Math.max(0, input.totalExperiences);
    if (typeof input.remainingExperiences === 'number') {
      next.remaining_experiences = Math.max(0, input.remainingExperiences);
    }

    await client.query(
      `UPDATE members SET
        access_number = $2, download_code = $3, first_name = $4, last_name = $5, email = $6, phone = $7,
        membership_id = $8, total_experiences = $9, remaining_experiences = $10, start_date = $11, end_date = $12,
        updated_at = now()
       WHERE id = $1`,
      [
        id,
        next.access_number,
        next.download_code,
        next.first_name,
        next.last_name,
        next.email,
        next.phone,
        next.membership_id,
        next.total_experiences,
        next.remaining_experiences,
        next.start_date,
        next.end_date,
      ],
    );

    const member = await loadMemberWith(client, id);
    if (!member) throw new Error('Socio no encontrado');
    return member;
  });
}

export async function deleteMember(id: string): Promise<void> {
  if (!isUuid(id)) throw new Error('Socio no encontrado');
  const rows = await query<{ id: string }>('DELETE FROM members WHERE id = $1 RETURNING id', [id]);
  if (!rows[0]) throw new Error('Socio no encontrado');
}

export async function addUsage(
  id: string,
  data: { date: string; time: string; experiencesUsed: number; note?: string },
): Promise<MemberRecord> {
  if (!isUuid(id)) throw new Error('Socio no encontrado');

  return transaction(async (client) => {
    const current = (await client.query<MemberRow>('SELECT * FROM members WHERE id = $1 FOR UPDATE', [id])).rows[0];
    if (!current) throw new Error('Socio no encontrado');

    const used = Math.max(1, Math.floor(data.experiencesUsed));
    if (used > current.remaining_experiences) {
      throw new Error(`Solo quedan ${current.remaining_experiences} experiencias disponibles`);
    }

    await client.query(
      `INSERT INTO member_usage (id, member_id, usage_date, usage_time, experiences_used, note)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [randomUUID(), id, data.date, data.time, used, data.note?.trim() || null],
    );
    await client.query(
      'UPDATE members SET remaining_experiences = remaining_experiences - $2, updated_at = now() WHERE id = $1',
      [id, used],
    );

    const member = await loadMemberWith(client, id);
    if (!member) throw new Error('Socio no encontrado');
    return member;
  });
}

export async function deleteUsage(memberId: string, usageId: string): Promise<MemberRecord> {
  if (!isUuid(memberId) || !isUuid(usageId)) throw new Error('Registro de uso no encontrado');

  return transaction(async (client) => {
    const current = (await client.query<MemberRow>('SELECT * FROM members WHERE id = $1 FOR UPDATE', [memberId]))
      .rows[0];
    if (!current) throw new Error('Socio no encontrado');

    const removed = (
      await client.query<UsageRow>(
        'DELETE FROM member_usage WHERE id = $1 AND member_id = $2 RETURNING *',
        [usageId, memberId],
      )
    ).rows[0];
    if (!removed) throw new Error('Registro de uso no encontrado');

    await client.query(
      `UPDATE members
       SET remaining_experiences = LEAST(total_experiences, remaining_experiences + $2), updated_at = now()
       WHERE id = $1`,
      [memberId, removed.experiences_used],
    );

    const member = await loadMemberWith(client, memberId);
    if (!member) throw new Error('Socio no encontrado');
    return member;
  });
}
