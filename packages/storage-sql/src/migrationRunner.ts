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
    try {
      await db.execute(migration.sql);
    } catch (err) {
      // DDL (e.g. ALTER TABLE) may have already been applied from a previous
      // interrupted run that failed to record in schema_migrations. If so,
      // we still record it as applied below. Re-throw truly unexpected errors.
      const message = String(err).toLowerCase();
      if (!message.includes("duplicate column") && !message.includes("already exists")) {
        throw err;
      }
    }
    await db.execute(
      `INSERT INTO schema_migrations (version, name, applied_at)
       VALUES (:version, :name, :appliedAt)`,
      {
        version: migration.version,
        name: migration.name,
        appliedAt: new Date().toISOString(),
      },
    );
  }
}
