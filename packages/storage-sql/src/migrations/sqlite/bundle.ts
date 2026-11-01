import type { Migration } from "../../migrationRunner.ts";
import initialSchema from "./001_initial_schema.sql?raw";
import playerArchivedAt from "./002_player_archived_at.sql?raw";

export const sqliteMigrations: Migration[] = [
  { version: 1, name: "initial_schema", sql: initialSchema },
  { version: 2, name: "player_archived_at", sql: playerArchivedAt },
];
