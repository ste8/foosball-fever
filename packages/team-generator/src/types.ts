export interface GenerationInput {
  attackerIds: string[];
  defenderIds: string[];
  history: MatchDayHistory[]; // ordered oldest → newest
  seed: number;
}

export interface MatchDayHistory {
  matchDayNumber: number;
  teams: { attackerId: string; defenderId: string }[];
}

export interface GenerationResult {
  teams: GeneratedTeam[];
  metrics: GenerationMetrics;
}

export interface GeneratedTeam {
  teamNumber: number;
  attackerId: string;
  defenderId: string;
  lastOccurrence?: number; // match days ago (undefined = never played together)
}

export interface GenerationMetrics {
  freshMatchDays: number; // how far back without any repeats
  repeatedCount: number; // teams that repeat from history
  totalCount: number; // total teams generated
  calculationTimeMs: number;
}
