import type { MatchDay, MatchDayWithTeams } from "../types";
import type { MatchDayHistory } from "@foosball-fever/team-generator";

export interface CreateMatchDayTeam {
  attackerId: string;
  defenderId: string;
  teamNumber: number;
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
