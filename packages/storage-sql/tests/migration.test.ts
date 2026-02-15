import { describe, it, expect } from "vitest";
import { createSqliteDatabase } from "../src/dialects/sqlite.ts";
import { runMigrations } from "../src/migrationRunner.ts";
import { sqliteMigrations } from "../src/migrations/sqlite/index.ts";

describe("migration runner", () => {
  it("creates all tables from initial schema", async () => {
    const db = createSqliteDatabase(":memory:");
    await runMigrations(db, sqliteMigrations);

    const tables = await db.query<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
    );
    const names = tables.map((t) => t.name);

    expect(names).toContain("players");
    expect(names).toContain("championships");
    expect(names).toContain("roster_entries");
    expect(names).toContain("match_days");
    expect(names).toContain("teams");
    expect(names).toContain("schema_migrations");

    await db.close();
  });

  it("records applied migration in schema_migrations", async () => {
    const db = createSqliteDatabase(":memory:");
    await runMigrations(db, sqliteMigrations);

    const migrations = await db.query<{
      version: number;
      name: string;
      applied_at: string;
    }>("SELECT version, name, applied_at FROM schema_migrations");

    expect(migrations).toHaveLength(1);
    expect(migrations[0].version).toBe(1);
    expect(migrations[0].name).toBe("initial_schema");
    expect(migrations[0].applied_at).toBeTruthy();

    await db.close();
  });

  it("skips already-applied migrations on re-run", async () => {
    const db = createSqliteDatabase(":memory:");
    await runMigrations(db, sqliteMigrations);
    await runMigrations(db, sqliteMigrations); // run again

    const migrations = await db.query<{ version: number }>(
      "SELECT version FROM schema_migrations",
    );
    expect(migrations).toHaveLength(1);

    await db.close();
  });

  it("enforces foreign keys", async () => {
    const db = createSqliteDatabase(":memory:");
    await runMigrations(db, sqliteMigrations);

    const fkResult = await db.queryOne<{ foreign_keys: number }>(
      "PRAGMA foreign_keys",
    );
    expect(fkResult?.foreign_keys).toBe(1);

    await db.close();
  });
});
