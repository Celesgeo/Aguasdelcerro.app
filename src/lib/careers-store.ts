import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { BASE_APPLICATION_COUNT, type CareerApplicationRecord } from '@/lib/careers';

const CAREERS_DIR = path.join(process.cwd(), 'data', 'careers');
const COUNTER_FILE = path.join(CAREERS_DIR, 'counter.json');
const INBOX_FILE = path.join(CAREERS_DIR, 'inbox.json');

let memoryCount: number | null = null;
let memoryInbox: CareerApplicationRecord[] | null = null;
let writeChain: Promise<void> = Promise.resolve();

function normalizeCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return BASE_APPLICATION_COUNT;
  return Math.max(BASE_APPLICATION_COUNT, Math.floor(n));
}

async function readStoredCount(): Promise<number> {
  try {
    const raw = await fs.readFile(COUNTER_FILE, 'utf8');
    const parsed = JSON.parse(raw) as { count?: unknown };
    return normalizeCount(parsed.count);
  } catch {
    return BASE_APPLICATION_COUNT;
  }
}

export async function getApplicationCount(): Promise<number> {
  if (memoryCount !== null) return memoryCount;
  memoryCount = await readStoredCount();
  return memoryCount;
}

export async function incrementApplicationCount(): Promise<number> {
  const current = await getApplicationCount();
  const next = current + 1;
  memoryCount = next;

  writeChain = writeChain
    .then(async () => {
      await ensureCareersDir();
      await fs.writeFile(COUNTER_FILE, JSON.stringify({ count: memoryCount }, null, 2), 'utf8');
    })
    .catch(() => undefined);

  return next;
}

export async function ensureCareersDir(): Promise<void> {
  await fs.mkdir(CAREERS_DIR, { recursive: true });
}

async function readInboxFromDisk(): Promise<CareerApplicationRecord[]> {
  try {
    const raw = await fs.readFile(INBOX_FILE, 'utf8');
    const parsed = JSON.parse(raw) as { applications?: CareerApplicationRecord[] } | CareerApplicationRecord[];
    const list = Array.isArray(parsed) ? parsed : parsed.applications;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function listCareerApplications(): Promise<CareerApplicationRecord[]> {
  if (memoryInbox) return memoryInbox;
  memoryInbox = await readInboxFromDisk();
  return memoryInbox;
}

export async function readCareerCv(
  id: string,
): Promise<{ buffer: Buffer; filename: string; mimeType: string } | null> {
  const applications = await listCareerApplications();
  const record = applications.find((item) => item.id === id);
  if (!record || record.cvSize <= 0 || !record.cvFilename || record.cvFilename === 'sin-cv') {
    return null;
  }

  try {
    const buffer = await fs.readFile(path.join(CAREERS_DIR, id, record.cvFilename));
    return { buffer, filename: record.cvOriginalName || record.cvFilename, mimeType: record.cvMimeType };
  } catch {
    return null;
  }
}

export async function saveCareerApplication(
  record: Omit<CareerApplicationRecord, 'id' | 'createdAt' | 'cvFilename'>,
  cvBuffer: Buffer,
  cvExt: string,
): Promise<CareerApplicationRecord> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const hasCv = cvBuffer.length > 0 && Boolean(cvExt);
  const cvFilename = hasCv ? `cv${cvExt}` : 'sin-cv';
  const fullRecord: CareerApplicationRecord = {
    id,
    createdAt,
    ...record,
    cvFilename,
  };

  const current = await listCareerApplications();
  memoryInbox = [fullRecord, ...current].slice(0, 500);

  try {
    await ensureCareersDir();
    const applicationDir = path.join(CAREERS_DIR, id);
    await fs.mkdir(applicationDir, { recursive: true });
    if (hasCv) {
      await fs.writeFile(path.join(applicationDir, cvFilename), cvBuffer);
    }
    await fs.writeFile(
      path.join(applicationDir, 'application.json'),
      JSON.stringify(fullRecord, null, 2),
      'utf8',
    );
    await fs.writeFile(INBOX_FILE, JSON.stringify(memoryInbox, null, 2), 'utf8');
  } catch (error) {
    // En Railway el disco puede fallar; la copia en memoria alcanza para esta instancia.
    console.error('[careers] backup en disco falló:', error);
  }

  return fullRecord;
}
