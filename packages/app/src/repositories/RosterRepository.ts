import type { RosterEntry, RosterEntryWithPlayer, Role } from "../types";

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
