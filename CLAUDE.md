# Foosball Fever

Foosball team pairing app — generates balanced teams for weekly foosball evenings, maximizing variety across a full season.

## Design Document

See `docs/DESIGN.md` for the complete design document covering architecture, data model, database schema, screens, theming, localization, and implementation plan.

## Project Structure

- `DotNetAlgos/` — Original C# algorithm implementation with 117 tests (reference for TypeScript port)
- `packages/team-generator/` — TypeScript algorithm library + CLI testing tool
  - `src/` — Algorithm source (generateTeams, types)
  - `tests/` — Vitest tests (ported from C#)
  - `cli/` — Ink CLI app for testing the algorithm interactively
- `packages/app/` — Shared React app (screens, components, hooks, types, repository interfaces)
- `packages/storage-sql/` — Database layer — raw SQL repositories + migrations, SQLite and PostgreSQL via dialect abstraction (no ORM)
- `packages/storage-rest/` — REST client for web browser (future)
- `packages/tauri-shell/` — Tauri desktop app (wiring only: imports app + storage-sql with SQLite dialect)
- `packages/web-shell/` — Browser web app (future: imports app + storage-rest)
- `docs/DESIGN.md` — Full design document

## Tech Stack

- **App shell:** Tauri v2
- **Frontend:** React 19 (with React Compiler) + TypeScript + Vite
- **UI components:** shadcn/ui (Radix UI + Tailwind CSS)
- **Routing:** React Router
- **Database:** SQLite (raw SQL, no ORM, custom migration runner)
- **Testing:** Vitest
- **CLI app:** Ink (React for the terminal) + Ink UI
- **Localization:** react-i18next (English + Italian)

## Implementation Phases

1a. ✅ Algorithm + tests (standalone TypeScript port from C#)
1b. ✅ CLI app (Ink — port from C#)
2. ✅ Tauri + React scaffolding + theming (all 3 themes) + i18n
3. ✅ Database layer + repositories
4. ✅ Championship list (first vertical slice)
5. ✅ Player registry + roster management
6. ✅ Match day setup + generation
7. ✅ Pairings result + accept flow
8. ✅ History, detail screens, archive/delete

## App Complete

All 8 implementation phases are done. The app is feature-complete.

## Key Conventions

- **UUIDs** for all entity IDs (not auto-increment)
- **ISO 8601** for all dates/timestamps
- **Repository pattern** for data access — `packages/app/` defines interfaces, `packages/storage-sql/` provides SQL implementations (SQLite/PostgreSQL via dialect), `packages/storage-rest/` provides HTTP implementation (future), shells wire them together
- **Raw SQL, no ORM** — queries written by hand with named parameters (`:paramName`). SQLite supports them natively, PostgreSQL dialect layer transforms to `$N` positional parameters automatically
- **Separate migration files per dialect** — SQLite and PostgreSQL migrations in separate folders, same version numbers for the same logical change
- **Translation keys** for all user-facing text — never hardcoded strings
- **CSS variables** for all theming — components never reference colors/fonts directly
- **Package separation** — each package has one job: algorithm, UI, storage, shell

## React 19 Conventions

This project uses React 19 with the React Compiler. Follow modern patterns:

- **DO NOT** use `useMemo`, `useCallback`, or `React.memo` — the compiler handles memoization automatically
- **DO NOT** use `useEffect` for data fetching where `use()` is cleaner
- **DO** use `useOptimistic` for instant UI feedback during async operations
- **DO** use `useTransition` to keep UI responsive during heavier operations
- **DO** use `<Activity />` to pre-render hidden parts of the UI
- **DO** use `useEffectEvent` for event handlers inside effects
- **DO** write straightforward code — the compiler optimizes it

This is a Tauri client-side app with NO server. Do NOT use server-oriented features: Server Components, Server Actions (`'use server'`), Partial Pre-rendering.

## Algorithm Execution

The team generation algorithm runs in a **Web Worker** (separate thread), not on the main thread. The worker progressively reports its best result via `postMessage`, so:

- The UI is never blocked during generation
- The user can interrupt and take the best result found so far
- A safety timeout (5s) auto-stops and uses the best result

See `docs/DESIGN.md` section "Execution Model" for details.
