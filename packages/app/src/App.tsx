import "./i18n/i18n";
import { ThemeProvider } from "./theme/ThemeProvider";
import { RepositoryProvider } from "./repositories/RepositoryContext";
import { Router } from "./Router";
import type { Repositories } from "./repositories/interfaces";

export function App({ repositories }: { repositories?: Repositories }) {
  return (
    <ThemeProvider>
      {repositories ? (
        <RepositoryProvider repositories={repositories}>
          <Router />
        </RepositoryProvider>
      ) : (
        <Router />
      )}
    </ThemeProvider>
  );
}
