import type { Repositories } from "@foosball-fever/app/repositories/interfaces";
import type { Database } from "../database.ts";
import { createPlayerRepository } from "./playerRepository.ts";
import { createChampionshipRepository } from "./championshipRepository.ts";
import { createRosterRepository } from "./rosterRepository.ts";
import { createMatchDayRepository } from "./matchDayRepository.ts";

export function createRepositories(db: Database): Repositories {
  return {
    players: createPlayerRepository(db),
    championships: createChampionshipRepository(db),
    roster: createRosterRepository(db),
    matchDays: createMatchDayRepository(db),
  };
}
