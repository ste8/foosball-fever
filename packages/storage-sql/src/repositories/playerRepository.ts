import type { Player } from "@foosball-fever/app/types";
import type {
  PlayerRepository,
  CreatePlayerData,
  UpdatePlayerData,
} from "@foosball-fever/app/repositories";
import type { Database } from "../database.ts";

interface PlayerRow {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  preferred_role: string | null;
  created_at: string;
  updated_at: string;
}

function rowToPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name,
    preferredRole: (row.preferred_role ?? undefined) as Player["preferredRole"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createPlayerRepository(db: Database): PlayerRepository {
  return {
    async getAll() {
      const rows = await db.query<PlayerRow>(
        `SELECT id, first_name, last_name, display_name, preferred_role, created_at, updated_at
         FROM players ORDER BY display_name`,
      );
      return rows.map(rowToPlayer);
    },

    async getById(id) {
      const row = await db.queryOne<PlayerRow>(
        `SELECT id, first_name, last_name, display_name, preferred_role, created_at, updated_at
         FROM players WHERE id = :id`,
        { id },
      );
      return row ? rowToPlayer(row) : null;
    },

    async create(data: CreatePlayerData) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.execute(
        `INSERT INTO players (id, first_name, last_name, display_name, preferred_role, created_at, updated_at)
         VALUES (:id, :firstName, :lastName, :displayName, :preferredRole, :createdAt, :updatedAt)`,
        {
          id,
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: data.displayName,
          preferredRole: data.preferredRole ?? null,
          createdAt: now,
          updatedAt: now,
        },
      );
      return {
        id,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: data.displayName,
        preferredRole: data.preferredRole,
        createdAt: now,
        updatedAt: now,
      };
    },

    async update(id, data: UpdatePlayerData) {
      const existing = await db.queryOne<PlayerRow>(
        `SELECT id, first_name, last_name, display_name, preferred_role, created_at, updated_at
         FROM players WHERE id = :id`,
        { id },
      );
      if (!existing) throw new Error(`Player not found: ${id}`);

      const now = new Date().toISOString();
      const updated = {
        firstName: data.firstName ?? existing.first_name,
        lastName: data.lastName ?? existing.last_name,
        displayName: data.displayName ?? existing.display_name,
        preferredRole:
          data.preferredRole === null
            ? null
            : (data.preferredRole ?? existing.preferred_role),
      };

      await db.execute(
        `UPDATE players
         SET first_name = :firstName, last_name = :lastName, display_name = :displayName,
             preferred_role = :preferredRole, updated_at = :updatedAt
         WHERE id = :id`,
        {
          id,
          firstName: updated.firstName,
          lastName: updated.lastName,
          displayName: updated.displayName,
          preferredRole: updated.preferredRole,
          updatedAt: now,
        },
      );

      return {
        id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        displayName: updated.displayName,
        preferredRole: (updated.preferredRole ?? undefined) as Player["preferredRole"],
        createdAt: existing.created_at,
        updatedAt: now,
      };
    },

    async delete(id) {
      await db.execute("DELETE FROM players WHERE id = :id", { id });
    },
  };
}
