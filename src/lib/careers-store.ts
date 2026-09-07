import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { BASE_APPLICATION_COUNT, type CareerApplicationRecord } from '@/lib/careers';

const CAREERS_DIR = path.join(process.cwd(), 'data', 'careers');
const COUNTER_FILE = path.join(CAREERS_DIR, 'counter.json');

let memoryCount: number | null = null;
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

export async function saveCareerApplication(
  record: Omit<CareerApplicationRecord, 'id' | 'createdAt' | 'cvFilename'>,
  cvBuffer: Buffer,
  cvExt: string,
): Promise<CareerApplicationRecord> {
  await ensureCareersDir();

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const applicationDir = path.join(CAREERS_DIR, id);
  await fs.mkdir(applicationDir, { recursive: true });

  const cvFilename = `cv${cvExt}`;
  const fullRecord: CareerApplicationRecord = {
    id,
    createdAt,
    ...record,
    cvFilename,
  };

  await fs.writeFile(path.join(applicationDir, cvFilename), cvBuffer);
  await fs.writeFile(
    path.join(applicationDir, 'application.json'),
    JSON.stringify(fullRecord, null, 2),
    'utf8',
  );

  return fullRecord;
}
