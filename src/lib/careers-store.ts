import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { CareerApplicationRecord } from '@/lib/careers';

const CAREERS_DIR = path.join(process.cwd(), 'data', 'careers');

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
