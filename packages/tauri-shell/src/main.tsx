import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { App } from "@foosball-fever/app";
import { createTauriSqliteDatabase } from "@foosball-fever/storage-sql/dialects/tauri-sqlite";
import { runMigrations, createRepositories } from "@foosball-fever/storage-sql";
import { sqliteMigrations } from "@foosball-fever/storage-sql/migrations/sqlite/bundle";
import type { Repositories } from "@foosball-fever/app/repositories";
import "@foosball-fever/app/index.css";

function Root() {
  const [repositories, setRepositories] = useState<Repositories | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const db = await createTauriSqliteDatabase("foosball_fever.db");
        await runMigrations(db, sqliteMigrations);
        setRepositories(createRepositories(db));
      } catch (err) {
        setError(String(err));
      }
    }
    init();
  }, []);

  if (error) {
    return <div style={{ padding: 20, color: "red" }}>Database error: {error}</div>;
  }

  if (!repositories) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return <App repositories={repositories} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
