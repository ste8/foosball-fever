import BetterSqlite3 from "better-sqlite3";
import type { Database } from "../database.ts";

export function createSqliteDatabase(path: string): Database {
  const db = new BetterSqlite3(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  function mapParams(
    params?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (!params) return undefined;
    // better-sqlite3 expects named params without the colon prefix
    // but accepts them as object keys directly
    return params;
  }

  const database: Database = {
    async execute(sql, params) {
      if (!params || Object.keys(params).length === 0) {
        // db.exec supports multiple statements (used by migrations)
        db.exec(sql);
      } else {
        db.prepare(sql).run(mapParams(params)!);
      }
    },

    async query<T>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
      return db.prepare(sql).all(mapParams(params) ?? {}) as T[];
    },

    async queryOne<T>(
      sql: string,
      params?: Record<string, unknown>,
    ): Promise<T | null> {
      return (db.prepare(sql).get(mapParams(params) ?? {}) as T) ?? null;
    },

    async transaction<T>(fn: (txDb: Database) => Promise<T>): Promise<T> {
      // better-sqlite3 transactions are synchronous, but our fn is async.
      // We run the async fn and rely on the fact that better-sqlite3
      // transactions are per-connection and we're single-threaded.
      db.exec("BEGIN");
      try {
        const result = await fn(database);
        db.exec("COMMIT");
        return result;
      } catch (err) {
        db.exec("ROLLBACK");
        throw err;
      }
    },

    async close() {
      db.close();
    },
  };

  return database;
}
