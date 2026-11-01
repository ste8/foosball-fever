import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Migration } from "../../migrationRunner.ts";

const dir = dirname(fileURLToPath(import.meta.url));

function loadSql(filename: string): string {
  return readFileSync(join(dir, filename), "utf-8");
}

export const sqliteMigrations: Migration[] = [
  { version: 1, name: "initial_schema", sql: loadSql("001_initial_schema.sql") },
  { version: 2, name: "player_archived_at", sql: loadSql("002_player_archived_at.sql") },
];
