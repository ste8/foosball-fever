import type { Database } from "./database.ts";

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export async function runMigrations(
  db: Database,
  migrations: Migration[],
): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);

  const applied = await db.query<{ version: number }>(
    "SELECT version FROM schema_migrations ORDER BY version",
  );
  const appliedSet = new Set(applied.map((r) => r.version));

  const pending = migrations
    .filter((m) => !appliedSet.has(m.version))
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.transaction(async (tx) => {
      await tx.execute(migration.sql);
      await tx.execute(
        `INSERT INTO schema_migrations (version, name, applied_at)
         VALUES (:version, :name, :appliedAt)`,
        {
          version: migration.version,
          name: migration.name,
          appliedAt: new Date().toISOString(),
        },
      );
    });
  }
}
