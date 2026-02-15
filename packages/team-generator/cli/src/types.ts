export interface TournamentData {
  players: string[];
  rounds: HistoricalRound[];
}

export interface HistoricalRound {
  timestamp: string; // ISO 8601
  attackers: string[];
  defenders: string[];
  teams: TeamRecord[];
}

export interface TeamRecord {
  attacker: string;
  defender: string;
}
