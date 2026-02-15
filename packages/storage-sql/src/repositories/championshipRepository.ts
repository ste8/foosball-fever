import type { Championship } from "@foosball-fever/app/types";
import type {
  ChampionshipRepository,
  CreateChampionshipData,
  UpdateChampionshipData,
  ChampionshipWithStats,
} from "@foosball-fever/app/repositories";
import type { Database } from "../database.ts";

interface ChampionshipRow {
  id: string;
  name: string;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ChampionshipStatsRow {
  match_day_count: number;
  player_count: number;
  last_played_at: string | null;
}

function rowToChampionship(row: ChampionshipRow): Championship {
  return {
    id: row.id,
    name: row.name,
    archivedAt: row.archived_at ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToChampionshipWithStats(
  row: ChampionshipRow & ChampionshipStatsRow,
): ChampionshipWithStats {
  return {
    ...rowToChampionship(row),
    matchDayCount: Number(row.match_day_count),
    playerCount: Number(row.player_count),
    lastPlayedAt: row.last_played_at ?? undefined,
  };
}

export function createChampionshipRepository(
  db: Database,
): ChampionshipRepository {
  return {
    async getAll(includeArchived = false) {
      const sql = includeArchived
        ? `SELECT id, name, archived_at, deleted_at, created_at, updated_at
           FROM championships WHERE deleted_at IS NULL
           ORDER BY created_at DESC`
        : `SELECT id, name, archived_at, deleted_at, created_at, updated_at
           FROM championships WHERE deleted_at IS NULL AND archived_at IS NULL
           ORDER BY created_at DESC`;
      const rows = await db.query<ChampionshipRow>(sql);
      return rows.map(rowToChampionship);
    },

    async getById(id) {
      const row = await db.queryOne<ChampionshipRow>(
        `SELECT id, name, archived_at, deleted_at, created_at, updated_at
         FROM championships WHERE id = :id`,
        { id },
      );
      return row ? rowToChampionship(row) : null;
    },

    async create(data: CreateChampionshipData) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.execute(
        `INSERT INTO championships (id, name, created_at, updated_at)
         VALUES (:id, :name, :createdAt, :updatedAt)`,
        { id, name: data.name, createdAt: now, updatedAt: now },
      );
      return {
        id,
        name: data.name,
        createdAt: now,
        updatedAt: now,
      };
    },

    async update(id, data: UpdateChampionshipData) {
      const existing = await db.queryOne<ChampionshipRow>(
        `SELECT id, name, archived_at, deleted_at, created_at, updated_at
         FROM championships WHERE id = :id`,
        { id },
      );
      if (!existing) throw new Error(`Championship not found: ${id}`);

      const now = new Date().toISOString();
      const name = data.name ?? existing.name;

      await db.execute(
        `UPDATE championships SET name = :name, updated_at = :updatedAt WHERE id = :id`,
        { id, name, updatedAt: now },
      );

      return {
        ...rowToChampionship(existing),
        name,
        updatedAt: now,
      };
    },

    async archive(id) {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE championships SET archived_at = :archivedAt, updated_at = :updatedAt WHERE id = :id`,
        { id, archivedAt: now, updatedAt: now },
      );
    },

    async unarchive(id) {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE championships SET archived_at = NULL, updated_at = :updatedAt WHERE id = :id`,
        { id, updatedAt: now },
      );
    },

    async delete(id) {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE championships SET deleted_at = :deletedAt, updated_at = :updatedAt WHERE id = :id`,
        { id, deletedAt: now, updatedAt: now },
      );
    },

    async getAllWithStats(includeArchived = false) {
      const archiveFilter = includeArchived
        ? ""
        : "AND c.archived_at IS NULL";
      const sql = `
        SELECT
          c.id, c.name, c.archived_at, c.deleted_at, c.created_at, c.updated_at,
          COALESCE(md.match_day_count, 0) AS match_day_count,
          COALESCE(r.player_count, 0) AS player_count,
          md.last_played_at
        FROM championships c
        LEFT JOIN (
          SELECT championship_id,
                 COUNT(*) AS match_day_count,
                 MAX(played_at) AS last_played_at
          FROM match_days
          GROUP BY championship_id
        ) md ON md.championship_id = c.id
        LEFT JOIN (
          SELECT championship_id, COUNT(*) AS player_count
          FROM roster_entries
          GROUP BY championship_id
        ) r ON r.championship_id = c.id
        WHERE c.deleted_at IS NULL ${archiveFilter}
        ORDER BY c.created_at DESC`;
      const rows = await db.query<ChampionshipRow & ChampionshipStatsRow>(sql);
      return rows.map(rowToChampionshipWithStats);
    },

    async getStatsById(id) {
      const row = await db.queryOne<{ id: string } & ChampionshipStatsRow>(
        `SELECT
           c.id,
           COALESCE(md.match_day_count, 0) AS match_day_count,
           COALESCE(r.player_count, 0) AS player_count,
           md.last_played_at
         FROM championships c
         LEFT JOIN (
           SELECT championship_id,
                  COUNT(*) AS match_day_count,
                  MAX(played_at) AS last_played_at
           FROM match_days
           GROUP BY championship_id
         ) md ON md.championship_id = c.id
         LEFT JOIN (
           SELECT championship_id, COUNT(*) AS player_count
           FROM roster_entries
           GROUP BY championship_id
         ) r ON r.championship_id = c.id
         WHERE c.id = :id`,
        { id },
      );
      if (!row) return null;
      return {
        matchDayCount: Number(row.match_day_count),
        playerCount: Number(row.player_count),
        lastPlayedAt: row.last_played_at ?? undefined,
      };
    },
  };
}
