import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { BASE_APPLICATION_COUNT, type CareerApplicationRecord } from '@/lib/careers';

const APPLICATION_DIR_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dataRoot(): string {
  const fromEnv = process.env.DATA_DIR?.trim();
  return fromEnv ? path.resolve(fromEnv) : path.join(process.cwd(), 'data');
}

function careersDir(): string {
  return path.join(dataRoot(), 'careers');
}

function counterFile(): string {
  return path.join(careersDir(), 'counter.json');
}

function inboxFile(): string {
  return path.join(careersDir(), 'inbox.json');
}

let memoryCount: number | null = null;
let memoryInbox: CareerApplicationRecord[] | null = null;
let writeChain: Promise<void> = Promise.resolve();

function normalizeCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return BASE_APPLICATION_COUNT;
  return Math.max(BASE_APPLICATION_COUNT, Math.floor(n));
}

function isApplicationRecord(value: unknown): value is CareerApplicationRecord {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CareerApplicationRecord>;
  return typeof item.id === 'string' && item.id.length > 8 && typeof item.createdAt === 'string';
}

function mergeApplications(...lists: CareerApplicationRecord[][]): CareerApplicationRecord[] {
  const byId = new Map<string, CareerApplicationRecord>();
  for (const list of lists) {
    for (const item of list) {
      if (!isApplicationRecord(item)) continue;
      const current = byId.get(item.id);
      if (!current) {
        byId.set(item.id, item);
        continue;
      }
      const currentCv = current.cvSize ?? 0;
      const nextCv = item.cvSize ?? 0;
      if (nextCv > currentCv) {
        byId.set(item.id, item);
        continue;
      }
      if (nextCv === currentCv && item.createdAt > current.createdAt) {
        byId.set(item.id, item);
      }
    }
  }
  return [...byId.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

async function atomicWrite(filePath: string, contents: string): Promise<void> {
  const tmp = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(tmp, contents, 'utf8');
  await fs.rename(tmp, filePath);
}

async function readStoredCount(): Promise<number> {
  try {
    const raw = await fs.readFile(counterFile(), 'utf8');
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
      const onDisk = await readStoredCount();
      const safe = Math.max(next, onDisk);
      memoryCount = safe;
      await atomicWrite(counterFile(), JSON.stringify({ count: safe }, null, 2));
    })
    .catch(() => undefined);

  return next;
}

export async function ensureCareersDir(): Promise<void> {
  await fs.mkdir(careersDir(), { recursive: true });
}

async function readInboxFile(): Promise<CareerApplicationRecord[]> {
  try {
    const raw = await fs.readFile(inboxFile(), 'utf8');
    const parsed = JSON.parse(raw) as { applications?: CareerApplicationRecord[] } | CareerApplicationRecord[];
    const list = Array.isArray(parsed) ? parsed : parsed.applications;
    return Array.isArray(list) ? list.filter(isApplicationRecord) : [];
  } catch {
    return [];
  }
}

async function recoverApplicationsFromFolders(): Promise<CareerApplicationRecord[]> {
  let entries: Array<{ name: string; isDirectory: () => boolean }>;
  try {
    entries = await fs.readdir(careersDir(), { withFileTypes: true });
  } catch {
    return [];
  }

  const recovered: CareerApplicationRecord[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !APPLICATION_DIR_RE.test(entry.name)) continue;
    try {
      const raw = await fs.readFile(path.join(careersDir(), entry.name, 'application.json'), 'utf8');
      const parsed = JSON.parse(raw) as CareerApplicationRecord;
      if (isApplicationRecord(parsed)) {
        recovered.push({ ...parsed, id: parsed.id || entry.name });
      }
    } catch {
      // La carpeta se conserva aunque falte el json; no se borra.
    }
  }
  return recovered;
}

async function loadMergedInbox(): Promise<CareerApplicationRecord[]> {
  const fromFile = await readInboxFile();
  const fromFolders = await recoverApplicationsFromFolders();
  return mergeApplications(fromFile, fromFolders);
}

export async function listCareerApplications(): Promise<CareerApplicationRecord[]> {
  if (memoryInbox) return mergeApplications(memoryInbox, await loadMergedInbox());
  memoryInbox = await loadMergedInbox();
  return memoryInbox;
}

async function resolveCvPath(id: string, record: CareerApplicationRecord): Promise<string | null> {
  const dir = path.join(careersDir(), id);
  const candidates = [record.cvFilename, `cv${path.extname(record.cvOriginalName || '')}`].filter(
    (name) => name && name !== 'sin-cv',
  );

  for (const name of candidates) {
    const full = path.join(dir, name);
    try {
      await fs.access(full);
      return full;
    } catch {
      // probar el siguiente
    }
  }

  try {
    const files = await fs.readdir(dir);
    const cv = files.find((name) => name.startsWith('cv.') && name !== 'cv');
    return cv ? path.join(dir, cv) : null;
  } catch {
    return null;
  }
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
    const filePath = await resolveCvPath(id, record);
    if (!filePath) return null;
    const buffer = await fs.readFile(filePath);
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
  let id = randomUUID();
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
  memoryInbox = mergeApplications([fullRecord], current);

  try {
    await ensureCareersDir();
    let applicationDir = path.join(careersDir(), id);
    try {
      await fs.access(applicationDir);
      id = randomUUID();
      fullRecord.id = id;
      applicationDir = path.join(careersDir(), id);
    } catch {
      // la carpeta no existe: se crea, no se pisa una anterior
    }

    await fs.mkdir(applicationDir, { recursive: true });
    if (hasCv) {
      const cvPath = path.join(applicationDir, cvFilename);
      try {
        await fs.access(cvPath);
      } catch {
        await fs.writeFile(cvPath, cvBuffer);
      }
    }
    await atomicWrite(path.join(applicationDir, 'application.json'), JSON.stringify(fullRecord, null, 2));

    const merged = mergeApplications([fullRecord], await loadMergedInbox());
    memoryInbox = merged;
    await atomicWrite(inboxFile(), JSON.stringify(merged, null, 2));
  } catch (error) {
    // En Railway el disco puede fallar; la copia en memoria alcanza para esta instancia.
    console.error('[careers] backup en disco falló:', error);
  }

  return fullRecord;
}
