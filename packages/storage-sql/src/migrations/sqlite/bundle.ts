import type { Migration } from "../../migrationRunner.ts";
import initialSchema from "./001_initial_schema.sql?raw";

export const sqliteMigrations: Migration[] = [
  { version: 1, name: "initial_schema", sql: initialSchema },
];
