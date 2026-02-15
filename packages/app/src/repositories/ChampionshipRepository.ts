import type { Championship } from "../types";

export interface CreateChampionshipData {
  name: string;
}

export interface UpdateChampionshipData {
  name?: string;
}

export interface ChampionshipRepository {
  getAll(includeArchived?: boolean): Promise<Championship[]>;
  getById(id: string): Promise<Championship | null>;
  create(data: CreateChampionshipData): Promise<Championship>;
  update(id: string, data: UpdateChampionshipData): Promise<Championship>;
  archive(id: string): Promise<void>;
  unarchive(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  getAllWithStats(
    includeArchived?: boolean,
  ): Promise<ChampionshipWithStats[]>;
  getStatsById(
    id: string,
  ): Promise<{
    matchDayCount: number;
    playerCount: number;
    lastPlayedAt?: string;
  } | null>;
}

export interface ChampionshipWithStats extends Championship {
  matchDayCount: number;
  playerCount: number;
  lastPlayedAt?: string;
}
