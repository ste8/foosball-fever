# Foosball Fever

Foosball Fever builds balanced foosball teams for a weekly game night and keeps the pairings varied across a whole season. In Italian the app is called *Biliardino Fever*.

A group of friends plays every week from September to June. On each evening (a **match day**) the app pairs one attacker ⚔️ with one defender 🛡️ for each team. It looks at the match days already played in the season (the **championship**) so the same two players are paired together as rarely as possible.

## Features

- **Fresh pairings.** The generator uses Hopcroft-Karp bipartite matching to find the largest number of recent match days it can avoid completely, so that no pair from those match days plays together again. Among the lineups that meet that, it picks one at random using a seed. It reports how many teams repeat a pairing from older history, but it doesn't try to minimize that number.
- **Responsive while it runs.** Generation runs in a Web Worker, so the UI stays usable. If you stop it, or it hasn't finished after 5 seconds, it runs again on the main thread and uses that result.
- **Championships and rosters.** Each championship has its own roster, drawn from a global player registry. Players can be archived when they stop playing.
- **Match day history.** You can browse past match days. The most recent one can be deleted.
- **Three themes:** Classic, Classic Dark, and Sensible Soccer, a pixel-art 16-bit look.
- **Two languages:** English and Italian.
- **Offline desktop app.** Data is stored in a local SQLite database through Tauri.

## Tech stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri v2 |
| UI | React 19 (React Compiler), TypeScript, Vite |
| Components | shadcn/ui (Radix UI + Tailwind CSS v4) |
| Routing / i18n | React Router, react-i18next |
| Storage | SQLite with raw SQL (no ORM) and a custom migration runner |
| Testing | Vitest, fast-check |
| CLI | Ink + Ink UI |

## Repository layout

```
packages/
  team-generator/   Pairing algorithm (TypeScript) and its tests
    cli/            Ink terminal app for trying the algorithm interactively
  app/              Shared React app: screens, components, hooks, types, repository interfaces
  storage-sql/      SQL repositories, dialects and migrations
  tauri-shell/      Tauri desktop app that wires app + storage-sql (SQLite)
DotNetAlgos/        Original C# implementation, kept as the reference for the port
docs/DESIGN.md      Full design document
```

The packages are kept separate on purpose. `app` defines repository interfaces, `storage-sql` implements them, and the shell connects the two, so the UI never depends on a particular storage backend.

## Getting started

### Prerequisites

- Node.js and npm
- Rust toolchain and the [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform

### Install

```bash
npm install
```

### Run the desktop app in development

```bash
npm run tauri dev --workspace @foosball-fever/tauri-shell
```

### Build the desktop app

```bash
npm run tauri build --workspace @foosball-fever/tauri-shell
```

If `cargo` is not on your `PATH`, run `source "$HOME/.cargo/env"` first.

### Run the tests

```bash
npm test --workspace @foosball-fever/team-generator
```

```bash
npm test --workspace @foosball-fever/storage-sql
```

### Try the algorithm from the terminal

The CLI is not an npm workspace, so it needs its own install:

```bash
cd packages/team-generator/cli && npm install && npm start
```

## Development notes

- **IDs and dates.** Entity IDs are UUIDs and timestamps use ISO 8601.
- **Raw SQL.** Queries are written by hand with named parameters (`:paramName`).
- **Migrations.** These live in `packages/storage-sql/src/migrations/<dialect>/`. A new SQLite migration has to be registered in **both** `index.ts` (used by Node and the tests) and `bundle.ts` (used by the Vite/Tauri bundle).
- **Text.** All user-facing text goes through translation keys in `packages/app/src/i18n/{en,it}.json`.
- **Styling.** Colors and fonts come from CSS variables defined per theme in `packages/app/src/theme/themes/`.
- **React 19.** The React Compiler handles memoization, so don't add `useMemo`, `useCallback` or `React.memo`.

For the data model, screen designs, algorithm contract and execution model, see [docs/DESIGN.md](docs/DESIGN.md). For an illustrated, beginner-friendly walkthrough of how the team generator works (graphs, matchings, BFS and DFS, Hopcroft-Karp, binary search), open [docs/ALGORITHM.html](docs/ALGORITHM.html) in a browser.
