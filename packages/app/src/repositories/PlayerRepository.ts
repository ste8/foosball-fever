import type { Player, Role } from "../types";

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

export interface PlayerRepository {
  getAll(): Promise<Player[]>;
  getById(id: string): Promise<Player | null>;
  create(data: CreatePlayerData): Promise<Player>;
  update(id: string, data: UpdatePlayerData): Promise<Player>;
  delete(id: string): Promise<void>;
}
