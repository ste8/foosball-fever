export type Role = "attacker" | "defender";

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  preferredRole?: Role;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface Championship {
  id: string;
  name: string;
  archivedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RosterEntry {
  id: string;
  championshipId: string;
  playerId: string;
  preferredRole?: Role;
  createdAt: string;
}

export interface RosterEntryWithPlayer extends RosterEntry {
  player: Player;
}

export interface MatchDay {
  id: string;
  championshipId: string;
  matchDayNumber: number;
  playedAt: string;
  createdAt: string;
}

export interface Team {
  id: string;
  matchDayId: string;
  attackerId: string;
  defenderId: string;
  teamNumber: number;
}

export interface TeamWithPlayers extends Team {
  attacker: Player;
  defender: Player;
}

export interface MatchDayWithTeams extends MatchDay {
  teams: TeamWithPlayers[];
}
