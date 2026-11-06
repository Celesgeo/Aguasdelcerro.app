import { Pool, type PoolClient } from 'pg';

/**
 * Conexión a Postgres (Railway). La variable DATABASE_URL la inyecta Railway
 * al referenciar el servicio Postgres desde el servicio web.
 */

const globalForDb = globalThis as unknown as {
  __adcPool?: Pool;
  __adcSchemaReady?: Promise<void>;
};

function connectionString(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error('DATABASE_URL no está configurada');
  }
  return url;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function getPool(): Pool {
  if (!globalForDb.__adcPool) {
    const url = connectionString();
    // La red privada de Railway (*.railway.internal) no usa SSL; la URL pública sí.
    const needsSsl = !/\.railway\.internal(?::\d+)?\//.test(url) && !/localhost|127\.0\.0\.1/.test(url);
    const pool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: needsSsl ? { rejectUnauthorized: false } : false,
    });
    pool.on('error', (error) => {
      console.error('[db] error en el pool:', error.message);
    });
    globalForDb.__adcPool = pool;
  }
  return globalForDb.__adcPool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  visit_date TEXT NOT NULL,
  shift_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL,
  total INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  hold_expires_at TIMESTAMPTZ,
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  confirmation_sent_at TIMESTAMPTZ,
  reschedule_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reservations_slot_idx ON reservations (visit_date, shift_id, status);
CREATE INDEX IF NOT EXISTS reservations_email_idx ON reservations (lower(customer_email));

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY,
  access_number TEXT NOT NULL,
  download_code TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  membership_id TEXT NOT NULL,
  total_experiences INTEGER NOT NULL DEFAULT 0,
  remaining_experiences INTEGER NOT NULL DEFAULT 0,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS members_access_number_idx ON members (upper(access_number));

CREATE TABLE IF NOT EXISTS member_usage (
  id UUID PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  usage_date TEXT NOT NULL,
  usage_time TEXT NOT NULL,
  experiences_used INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS member_usage_member_idx ON member_usage (member_id, created_at DESC);
`;

async function ensureSchema(): Promise<void> {
  if (!globalForDb.__adcSchemaReady) {
    globalForDb.__adcSchemaReady = getPool()
      .query(SCHEMA)
      .then(() => undefined)
      .catch((error: unknown) => {
        globalForDb.__adcSchemaReady = undefined;
        throw error;
      });
  }
  return globalForDb.__adcSchemaReady;
}

export async function query<R = Record<string, unknown>>(text: string, values?: unknown[]): Promise<R[]> {
  await ensureSchema();
  const result = await getPool().query<R>(text, values);
  return result.rows;
}

/** Ejecuta `task` dentro de una transacción. Si algo falla, se deshace todo. */
export async function transaction<T>(task: (client: PoolClient) => Promise<T>): Promise<T> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await task(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
