import { createContext, useContext, useState, type ReactNode } from "react";

export type Theme = "classic" | "classic-dark" | "sensible-soccer";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "foosball-fever-theme";
const THEME_CLASSES: Record<Theme, string> = {
  classic: "theme-classic",
  "classic-dark": "theme-classic-dark",
  "sensible-soccer": "theme-sensible-soccer",
};

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored in THEME_CLASSES) {
    return stored as Theme;
  }
  return "classic";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    const root = document.documentElement;
    for (const cls of Object.values(THEME_CLASSES)) {
      root.classList.remove(cls);
    }
    root.classList.add(THEME_CLASSES[newTheme]);
  };

  // Apply initial theme class on first render
  const root = document.documentElement;
  if (!root.classList.contains(THEME_CLASSES[theme])) {
    for (const cls of Object.values(THEME_CLASSES)) {
      root.classList.remove(cls);
    }
    root.classList.add(THEME_CLASSES[theme]);
  }

  return (
    <ThemeContext value={{ theme, setTheme }}>
      {children}
    </ThemeContext>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
