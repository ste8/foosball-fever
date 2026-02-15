export interface Database {
  execute(sql: string, params?: Record<string, unknown>): Promise<void>;
  query<T>(sql: string, params?: Record<string, unknown>): Promise<T[]>;
  queryOne<T>(sql: string, params?: Record<string, unknown>): Promise<T | null>;
  transaction<T>(fn: (db: Database) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
