Read docs/DESIGN.md, focusing on "Phase 2: Tauri + React Scaffolding", "Project Structure", "Global Navigation Element", "Theming" (Phase 1 Themes), "Localization (i18n)", "Routes", and "React 19 — Relevant Features".

Set up two new packages:

1. `packages/app/` — the shared React app
2. `packages/tauri-shell/` — the Tauri v2 desktop wiring

Target structure:
```
packages/
  app/
    src/
      App.tsx                 ← root component, takes repositories via props/context
      Router.tsx              ← React Router with all routes from the design doc
      screens/                ← placeholder screens (just the name for now)
      components/
        GlobalHeader.tsx      ← header bar with ← Back (contextual) and 👤 icon (global)
        SettingsMenu.tsx      ← dropdown from 👤: theme picker + language selector
      hooks/
      i18n/
        en.json               ← English translations
        it.json               ← Italian translations
        i18n.ts               ← react-i18next setup, auto-detect system language
      theme/
        ThemeProvider.tsx      ← wraps app, applies CSS class to root element
        themes/
          classic.css         ← Classic theme (light, clean, neutral)
          classic-dark.css    ← Classic Dark theme (inverted colors)
          sensible-soccer.css ← Sensible Soccer theme (pixel font, green tones, square corners)
      types/                  ← domain types (placeholder for now)
      repositories/
        interfaces.ts         ← abstract repository interfaces (placeholder for now)
    package.json
    tsconfig.json
  tauri-shell/
    src-tauri/                ← Tauri v2 Rust config
    src/
      main.tsx                ← entry point, renders <App />
    package.json
    tsconfig.json
```

Requirements:

**Tauri + Vite + React 19:**
- Tauri v2 with Vite as the build tool
- React 19 with React Compiler enabled
- TypeScript throughout

**UI Components:**
- shadcn/ui with Tailwind CSS
- Install the components we'll need: Button, Card, Dialog, AlertDialog, DropdownMenu, Select

**Routing (React Router):**
- All routes from the design doc as placeholder screens:
  - / → Championship list
  - /championships/:id → Championship detail
  - /championships/:id/roster → Roster management
  - /championships/:id/match-days → Match day history
  - /championships/:id/match-days/new → Match day setup
  - /championships/:id/match-days/:matchDayId → Match day result
  - /players → Global player registry
- Each placeholder screen just shows its name and route params

**Global Header:**
- Present on every screen
- Left side: ← Back button (contextual, not shown on home screen)
- Right side: 👤 icon (always present, opens settings dropdown)
- Center/left: screen title

**Settings Menu (from 👤 icon):**
- Theme selector: Classic / Dark / Sensible Soccer radio options (instant switch, no reload)
- Language selector: English / Italiano radio options (instant switch)
- Uses shadcn/ui DropdownMenu

**Theming:**
- ThemeProvider using React context + CSS variables
- Three themes working:
  - Classic (light, clean, neutral — the baseline)
  - Classic Dark (same personality, inverted colors — proves color swap)
  - Sensible Soccer (pixel font like "Press Start 2P" from Google Fonts, bright green tones, sharp square corners with no border-radius, bold flat primary colors red/blue/yellow, thick blocky borders, 16-bit game menu feel — proves deep theming beyond just colors)
- Theme switching applies a CSS class to the root element
- All shadcn/ui components should respond to the theme variables
- Persist theme choice (localStorage is fine for now, will move to DB later)

**Localization (react-i18next):**
- English and Italian translation files
- Auto-detect system language on first launch, default to English
- All placeholder screen titles use translation keys
- App name: "Foosball Fever" (English) / "Biliardino Fever" (Italian)
- Persist language choice (localStorage is fine for now)
- Instant language switching, no reload

**React 19 conventions:**
- Do NOT use useMemo, useCallback, or React.memo (compiler handles it)
- Do NOT use server features (Server Components, Server Actions)
- All user-facing text via translation keys, never hardcoded

**Verification:**
1. `npm install` succeeds
2. App launches in Tauri window
3. All routes are navigable
4. Theme switching works (Classic ↔ Dark ↔ Sensible Soccer) instantly from 👤 menu
5. Sensible Soccer theme visibly changes font (pixel), border-radius (none), and colors (green/bright)
5. Language switching works (English ↔ Italian) instantly from 👤 menu
6. Back navigation works on all non-home screens
7. Existing algorithm tests still pass (no regressions)
