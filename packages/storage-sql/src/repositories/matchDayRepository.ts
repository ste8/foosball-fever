import type {
  MatchDay,
  MatchDayWithTeams,
  TeamWithPlayers,
  Role,
} from "@foosball-fever/app/types";
import type {
  MatchDayRepository,
  CreateMatchDayTeam,
} from "@foosball-fever/app/repositories";
import type { MatchDayHistory } from "@foosball-fever/team-generator";
import type { Database } from "../database.ts";

interface MatchDayRow {
  id: string;
  championship_id: string;
  match_day_number: number;
  played_at: string;
  created_at: string;
  team_count?: number;
}

interface TeamWithPlayersRow {
  id: string;
  match_day_id: string;
  attacker_id: string;
  defender_id: string;
  team_number: number;
  a_id: string;
  a_first_name: string;
  a_last_name: string;
  a_display_name: string;
  a_preferred_role: string | null;
  a_created_at: string;
  a_updated_at: string;
  d_id: string;
  d_first_name: string;
  d_last_name: string;
  d_display_name: string;
  d_preferred_role: string | null;
  d_created_at: string;
  d_updated_at: string;
}

interface HistoryTeamRow {
  match_day_number: number;
  attacker_id: string;
  defender_id: string;
}

function rowToMatchDay(row: MatchDayRow): MatchDay {
  return {
    id: row.id,
    championshipId: row.championship_id,
    matchDayNumber: row.match_day_number,
    playedAt: row.played_at,
    createdAt: row.created_at,
    ...(row.team_count != null ? { teamCount: row.team_count } : {}),
  };
}

function rowToTeamWithPlayers(row: TeamWithPlayersRow): TeamWithPlayers {
  return {
    id: row.id,
    matchDayId: row.match_day_id,
    attackerId: row.attacker_id,
    defenderId: row.defender_id,
    teamNumber: row.team_number,
    attacker: {
      id: row.a_id,
      firstName: row.a_first_name,
      lastName: row.a_last_name,
      displayName: row.a_display_name,
      preferredRole: (row.a_preferred_role as Role) ?? undefined,
      createdAt: row.a_created_at,
      updatedAt: row.a_updated_at,
    },
    defender: {
      id: row.d_id,
      firstName: row.d_first_name,
      lastName: row.d_last_name,
      displayName: row.d_display_name,
      preferredRole: (row.d_preferred_role as Role) ?? undefined,
      createdAt: row.d_created_at,
      updatedAt: row.d_updated_at,
    },
  };
}

export function createMatchDayRepository(db: Database): MatchDayRepository {
  return {
    async getByChampionshipId(championshipId) {
      const rows = await db.query<MatchDayRow>(
        `SELECT md.id, md.championship_id, md.match_day_number, md.played_at, md.created_at,
                (SELECT COUNT(*) FROM teams t WHERE t.match_day_id = md.id) AS team_count
         FROM match_days md
         WHERE md.championship_id = :championshipId
         ORDER BY md.match_day_number DESC`,
        { championshipId },
      );
      return rows.map(rowToMatchDay);
    },

    async getById(id) {
      const matchDayRow = await db.queryOne<MatchDayRow>(
        `SELECT id, championship_id, match_day_number, played_at, created_at
         FROM match_days WHERE id = :id`,
        { id },
      );
      if (!matchDayRow) return null;

      const teamRows = await db.query<TeamWithPlayersRow>(
        `SELECT
           t.id, t.match_day_id, t.attacker_id, t.defender_id, t.team_number,
           a.id AS a_id, a.first_name AS a_first_name, a.last_name AS a_last_name,
           a.display_name AS a_display_name, a.preferred_role AS a_preferred_role,
           a.created_at AS a_created_at, a.updated_at AS a_updated_at,
           d.id AS d_id, d.first_name AS d_first_name, d.last_name AS d_last_name,
           d.display_name AS d_display_name, d.preferred_role AS d_preferred_role,
           d.created_at AS d_created_at, d.updated_at AS d_updated_at
         FROM teams t
         JOIN players a ON a.id = t.attacker_id
         JOIN players d ON d.id = t.defender_id
         WHERE t.match_day_id = :matchDayId
         ORDER BY t.team_number`,
        { matchDayId: id },
      );

      const matchDay: MatchDayWithTeams = {
        ...rowToMatchDay(matchDayRow),
        teams: teamRows.map(rowToTeamWithPlayers),
      };
      return matchDay;
    },

    async create(
      championshipId: string,
      matchDayNumber: number,
      playedAt: string,
      teams: CreateMatchDayTeam[],
    ) {
      return db.transaction(async (tx) => {
        const matchDayId = crypto.randomUUID();
        const now = new Date().toISOString();

        await tx.execute(
          `INSERT INTO match_days (id, championship_id, match_day_number, played_at, created_at)
           VALUES (:id, :championshipId, :matchDayNumber, :playedAt, :createdAt)`,
          {
            id: matchDayId,
            championshipId,
            matchDayNumber,
            playedAt,
            createdAt: now,
          },
        );

        for (const team of teams) {
          const teamId = crypto.randomUUID();
          await tx.execute(
            `INSERT INTO teams (id, match_day_id, attacker_id, defender_id, team_number)
             VALUES (:id, :matchDayId, :attackerId, :defenderId, :teamNumber)`,
            {
              id: teamId,
              matchDayId,
              attackerId: team.attackerId,
              defenderId: team.defenderId,
              teamNumber: team.teamNumber,
            },
          );
        }

        return {
          id: matchDayId,
          championshipId,
          matchDayNumber,
          playedAt,
          createdAt: now,
        };
      });
    },

    async deleteLast(championshipId) {
      const last = await db.queryOne<MatchDayRow>(
        `SELECT id, championship_id, match_day_number, played_at, created_at
         FROM match_days
         WHERE championship_id = :championshipId
         ORDER BY match_day_number DESC
         LIMIT 1`,
        { championshipId },
      );
      if (!last) throw new Error("No match days to delete");

      await db.transaction(async (tx) => {
        await tx.execute(
          "DELETE FROM teams WHERE match_day_id = :matchDayId",
          { matchDayId: last.id },
        );
        await tx.execute("DELETE FROM match_days WHERE id = :id", {
          id: last.id,
        });
      });
    },

    async getHistory(championshipId) {
      const rows = await db.query<HistoryTeamRow>(
        `SELECT md.match_day_number, t.attacker_id, t.defender_id
         FROM match_days md
         JOIN teams t ON t.match_day_id = md.id
         WHERE md.championship_id = :championshipId
         ORDER BY md.match_day_number, t.team_number`,
        { championshipId },
      );

      const byMatchDay = new Map<
        number,
        { attackerId: string; defenderId: string }[]
      >();
      for (const row of rows) {
        let teams = byMatchDay.get(row.match_day_number);
        if (!teams) {
          teams = [];
          byMatchDay.set(row.match_day_number, teams);
        }
        teams.push({
          attackerId: row.attacker_id,
          defenderId: row.defender_id,
        });
      }

      const history: MatchDayHistory[] = [];
      for (const [matchDayNumber, teams] of byMatchDay) {
        history.push({ matchDayNumber, teams });
      }
      // Ordered oldest → newest (by matchDayNumber ascending)
      history.sort((a, b) => a.matchDayNumber - b.matchDayNumber);
      return history;
    },
  };
}
