import { createContext, useContext, type ReactNode } from "react";
import type { Repositories } from "./interfaces";

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
