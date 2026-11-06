/**
 * Tipos mínimos de `pg` (node-postgres) para lo que usa el sitio.
 * Si más adelante se instala `@types/pg`, este archivo se puede borrar.
 */
declare module 'pg' {
  export interface QueryResult<R = Record<string, unknown>> {
    rows: R[];
    rowCount: number | null;
  }

  export interface PoolConfig {
    connectionString?: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
    ssl?: boolean | { rejectUnauthorized?: boolean };
  }

  export interface PoolClient {
    query<R = Record<string, unknown>>(text: string, values?: unknown[]): Promise<QueryResult<R>>;
    release(error?: Error | boolean): void;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query<R = Record<string, unknown>>(text: string, values?: unknown[]): Promise<QueryResult<R>>;
    connect(): Promise<PoolClient>;
    on(event: 'error', listener: (error: Error) => void): this;
    end(): Promise<void>;
  }

  const pg: { Pool: typeof Pool };
  export default pg;
}
