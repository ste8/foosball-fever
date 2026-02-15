import type {
  Player,
  Championship,
  RosterEntry,
  RosterEntryWithPlayer,
  MatchDay,
  MatchDayWithTeams,
  Role,
} from "../types";
import type { MatchDayHistory } from "@foosball-fever/team-generator";

export interface CreatePlayerData {
  firstName: string;
  lastName: string;
  displayName: string;
  preferredRole?: Role;
}

export interface UpdatePlayerData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  preferredRole?: Role | null;
}

export interface CreateChampionshipData {
  name: string;
}

export interface UpdateChampionshipData {
  name?: string;
}

export interface CreateMatchDayTeam {
  attackerId: string;
  defenderId: string;
  teamNumber: number;
}

export interface PlayerRepository {
  getAll(): Promise<Player[]>;
  getById(id: string): Promise<Player | null>;
  create(data: CreatePlayerData): Promise<Player>;
  update(id: string, data: UpdatePlayerData): Promise<Player>;
  delete(id: string): Promise<void>;
}

export interface ChampionshipRepository {
  getAll(includeArchived?: boolean): Promise<Championship[]>;
  getById(id: string): Promise<Championship | null>;
  create(data: CreateChampionshipData): Promise<Championship>;
  update(id: string, data: UpdateChampionshipData): Promise<Championship>;
  archive(id: string): Promise<void>;
  unarchive(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface RosterRepository {
  getByChampionshipId(
    championshipId: string,
  ): Promise<RosterEntryWithPlayer[]>;
  addPlayer(
    championshipId: string,
    playerId: string,
    preferredRole?: Role,
  ): Promise<RosterEntry>;
  updatePreferredRole(id: string, role?: Role): Promise<void>;
  removePlayer(id: string): Promise<void>;
}

export interface MatchDayRepository {
  getByChampionshipId(championshipId: string): Promise<MatchDay[]>;
  getById(id: string): Promise<MatchDayWithTeams | null>;
  create(
    championshipId: string,
    matchDayNumber: number,
    playedAt: string,
    teams: CreateMatchDayTeam[],
  ): Promise<MatchDay>;
  deleteLast(championshipId: string): Promise<void>;
  getHistory(championshipId: string): Promise<MatchDayHistory[]>;
}

export interface Repositories {
  players: PlayerRepository;
  championships: ChampionshipRepository;
  roster: RosterRepository;
  matchDays: MatchDayRepository;
}
