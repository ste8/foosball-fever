import type { Database } from "../database.ts";

// Dynamic import to avoid bundling issues — only used in Tauri runtime
async function loadTauriSql() {
  return await import("@tauri-apps/plugin-sql");
}

export async function createTauriSqliteDatabase(
  path: string,
): Promise<Database> {
  const TauriSql = await loadTauriSql();
  const db = await TauriSql.default.load(`sqlite:${path}`);

  // Enable foreign keys
  await db.execute("PRAGMA foreign_keys = ON");

  const database: Database = {
    async execute(sql, params) {
      // Tauri SQL plugin uses $paramName for named params
      // Convert our :paramName style to array-based positional params
      if (!params || Object.keys(params).length === 0) {
        await db.execute(sql);
        return;
      }
      const { query, values } = convertNamedParams(sql, params);
      await db.execute(query, values);
    },

    async query<T>(
      sql: string,
      params?: Record<string, unknown>,
    ): Promise<T[]> {
      if (!params || Object.keys(params).length === 0) {
        return (await db.select(sql)) as T[];
      }
      const { query, values } = convertNamedParams(sql, params);
      return (await db.select(query, values)) as T[];
    },

    async queryOne<T>(
      sql: string,
      params?: Record<string, unknown>,
    ): Promise<T | null> {
      const rows = await database.query<T>(sql, params);
      return rows[0] ?? null;
    },

    async transaction<T>(fn: (txDb: Database) => Promise<T>): Promise<T> {
      await db.execute("BEGIN");
      try {
        const result = await fn(database);
        await db.execute("COMMIT");
        return result;
      } catch (err) {
        await db.execute("ROLLBACK");
        throw err;
      }
    },

    async close() {
      await db.close();
    },
  };

  return database;
}

/**
 * Convert :paramName style to $N positional parameters for Tauri SQL plugin.
 */
function convertNamedParams(
  sql: string,
  params: Record<string, unknown>,
): { query: string; values: unknown[] } {
  const values: unknown[] = [];
  let index = 0;
  const query = sql.replace(/:([a-zA-Z]\w*)/g, (_match, name: string) => {
    index++;
    values.push(params[name]);
    return `$${index}`;
  });
  return { query, values };
}
