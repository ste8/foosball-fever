import type { RosterEntry, RosterEntryWithPlayer, Role } from "@foosball-fever/app/types";
import type { RosterRepository } from "@foosball-fever/app/repositories/interfaces";
import type { Database } from "../database.ts";

interface RosterEntryWithPlayerRow {
  id: string;
  championship_id: string;
  player_id: string;
  preferred_role: string | null;
  created_at: string;
  p_id: string;
  p_first_name: string;
  p_last_name: string;
  p_display_name: string;
  p_preferred_role: string | null;
  p_created_at: string;
  p_updated_at: string;
}

function rowToRosterEntryWithPlayer(
  row: RosterEntryWithPlayerRow,
): RosterEntryWithPlayer {
  return {
    id: row.id,
    championshipId: row.championship_id,
    playerId: row.player_id,
    preferredRole: (row.preferred_role as Role) ?? undefined,
    createdAt: row.created_at,
    player: {
      id: row.p_id,
      firstName: row.p_first_name,
      lastName: row.p_last_name,
      displayName: row.p_display_name,
      preferredRole: (row.p_preferred_role as Role) ?? undefined,
      createdAt: row.p_created_at,
      updatedAt: row.p_updated_at,
    },
  };
}

export function createRosterRepository(db: Database): RosterRepository {
  return {
    async getByChampionshipId(championshipId) {
      const rows = await db.query<RosterEntryWithPlayerRow>(
        `SELECT
           r.id, r.championship_id, r.player_id, r.preferred_role, r.created_at,
           p.id AS p_id, p.first_name AS p_first_name, p.last_name AS p_last_name,
           p.display_name AS p_display_name, p.preferred_role AS p_preferred_role,
           p.created_at AS p_created_at, p.updated_at AS p_updated_at
         FROM roster_entries r
         JOIN players p ON p.id = r.player_id
         WHERE r.championship_id = :championshipId
         ORDER BY p.display_name`,
        { championshipId },
      );
      return rows.map(rowToRosterEntryWithPlayer);
    },

    async addPlayer(championshipId, playerId, preferredRole?) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.execute(
        `INSERT INTO roster_entries (id, championship_id, player_id, preferred_role, created_at)
         VALUES (:id, :championshipId, :playerId, :preferredRole, :createdAt)`,
        {
          id,
          championshipId,
          playerId,
          preferredRole: preferredRole ?? null,
          createdAt: now,
        },
      );
      const entry: RosterEntry = {
        id,
        championshipId,
        playerId,
        preferredRole,
        createdAt: now,
      };
      return entry;
    },

    async updatePreferredRole(id, role?) {
      await db.execute(
        `UPDATE roster_entries SET preferred_role = :preferredRole WHERE id = :id`,
        { id, preferredRole: role ?? null },
      );
    },

    async removePlayer(id) {
      await db.execute("DELETE FROM roster_entries WHERE id = :id", { id });
    },
  };
}
