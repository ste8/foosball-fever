import { createSqliteDatabase } from "../src/dialects/sqlite.ts";
import { runMigrations } from "../src/migrationRunner.ts";
import { sqliteMigrations } from "../src/migrations/sqlite/index.ts";
import { createRepositories } from "../src/repositories/index.ts";
import type { Database } from "../src/database.ts";
import type { Repositories } from "@foosball-fever/app/repositories";

export interface TestContext {
  db: Database;
  repos: Repositories;
}

export async function createTestDatabase(): Promise<TestContext> {
  const db = createSqliteDatabase(":memory:");
  await runMigrations(db, sqliteMigrations);
  const repos = createRepositories(db);
  return { db, repos };
}
