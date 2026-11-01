import type { Player, PlayerWithChampionships } from "@foosball-fever/app/types";
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
  archived_at: string | null;
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
    archivedAt: row.archived_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createPlayerRepository(db: Database): PlayerRepository {
  return {
    async getAll() {
      const rows = await db.query<PlayerRow>(
        `SELECT id, first_name, last_name, display_name, preferred_role, archived_at, created_at, updated_at
         FROM players WHERE archived_at IS NULL ORDER BY display_name`,
      );
      return rows.map(rowToPlayer);
    },

    async getById(id) {
      const row = await db.queryOne<PlayerRow>(
        `SELECT id, first_name, last_name, display_name, preferred_role, archived_at, created_at, updated_at
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
        `SELECT id, first_name, last_name, display_name, preferred_role, archived_at, created_at, updated_at
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
        archivedAt: existing.archived_at ?? undefined,
        createdAt: existing.created_at,
        updatedAt: now,
      };
    },

    async delete(id) {
      await db.execute("DELETE FROM players WHERE id = :id", { id });
    },

    async archive(id) {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE players SET archived_at = :now, updated_at = :now WHERE id = :id`,
        { id, now },
      );
    },

    async unarchive(id) {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE players SET archived_at = NULL, updated_at = :now WHERE id = :id`,
        { id, now },
      );
    },

    async getAllWithChampionships() {
      const playerRows = await db.query<PlayerRow>(
        `SELECT id, first_name, last_name, display_name, preferred_role, archived_at, created_at, updated_at
         FROM players WHERE archived_at IS NULL ORDER BY display_name`,
      );

      const champRows = await db.query<{
        player_id: string;
        championship_id: string;
        championship_name: string;
      }>(
        `SELECT r.player_id, c.id AS championship_id, c.name AS championship_name
         FROM roster_entries r
         JOIN championships c ON c.id = r.championship_id
         WHERE c.deleted_at IS NULL
         ORDER BY c.created_at DESC`,
      );

      const champsByPlayer = new Map<
        string,
        { id: string; name: string }[]
      >();
      for (const row of champRows) {
        let list = champsByPlayer.get(row.player_id);
        if (!list) {
          list = [];
          champsByPlayer.set(row.player_id, list);
        }
        list.push({ id: row.championship_id, name: row.championship_name });
      }

      return playerRows.map(
        (row): PlayerWithChampionships => ({
          ...rowToPlayer(row),
          championships: champsByPlayer.get(row.id) ?? [],
        }),
      );
    },

    async getAllWithChampionshipsIncludingArchived() {
      const playerRows = await db.query<PlayerRow>(
        `SELECT id, first_name, last_name, display_name, preferred_role, archived_at, created_at, updated_at
         FROM players ORDER BY display_name`,
      );

      const champRows = await db.query<{
        player_id: string;
        championship_id: string;
        championship_name: string;
      }>(
        `SELECT r.player_id, c.id AS championship_id, c.name AS championship_name
         FROM roster_entries r
         JOIN championships c ON c.id = r.championship_id
         WHERE c.deleted_at IS NULL
         ORDER BY c.created_at DESC`,
      );

      const champsByPlayer = new Map<
        string,
        { id: string; name: string }[]
      >();
      for (const row of champRows) {
        let list = champsByPlayer.get(row.player_id);
        if (!list) {
          list = [];
          champsByPlayer.set(row.player_id, list);
        }
        list.push({ id: row.championship_id, name: row.championship_name });
      }

      return playerRows.map(
        (row): PlayerWithChampionships => ({
          ...rowToPlayer(row),
          championships: champsByPlayer.get(row.id) ?? [],
        }),
      );
    },

    async getNotInChampionship(championshipId) {
      const rows = await db.query<PlayerRow>(
        `SELECT p.id, p.first_name, p.last_name, p.display_name, p.preferred_role, p.archived_at, p.created_at, p.updated_at
         FROM players p
         WHERE p.archived_at IS NULL AND p.id NOT IN (
           SELECT r.player_id FROM roster_entries r WHERE r.championship_id = :championshipId
         )
         ORDER BY p.display_name`,
        { championshipId },
      );
      return rows.map(rowToPlayer);
    },

    async isInAnyActiveRoster(id) {
      const row = await db.queryOne<{ cnt: number }>(
        `SELECT COUNT(*) AS cnt
         FROM roster_entries r
         JOIN championships c ON c.id = r.championship_id
         WHERE r.player_id = :id AND c.deleted_at IS NULL AND c.archived_at IS NULL`,
        { id },
      );
      return (row?.cnt ?? 0) > 0;
    },
  };
}
