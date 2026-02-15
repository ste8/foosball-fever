import { createContext, useContext, type ReactNode } from "react";
import type { PlayerRepository } from "./PlayerRepository";
import type { ChampionshipRepository } from "./ChampionshipRepository";
import type { RosterRepository } from "./RosterRepository";
import type { MatchDayRepository } from "./MatchDayRepository";

export interface Repositories {
  players: PlayerRepository;
  championships: ChampionshipRepository;
  roster: RosterRepository;
  matchDays: MatchDayRepository;
}

const RepositoryContext = createContext<Repositories | null>(null);

export function RepositoryProvider({
  repositories,
  children,
}: {
  repositories: Repositories;
  children: ReactNode;
}) {
  return (
    <RepositoryContext value={repositories}>
      {children}
    </RepositoryContext>
  );
}

export function useRepositories(): Repositories {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error(
      "useRepositories must be used within a RepositoryProvider",
    );
  }
  return context;
}
