import "./i18n/i18n";
import { ThemeProvider } from "./theme/ThemeProvider";
import { Router } from "./Router";

export function App() {
  return (
    <ThemeProvider>
      <Router />
    </ThemeProvider>
  );
}
