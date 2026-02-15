# Foosball Fever — App Design Document (v2)

## Overview

This document captures all design decisions for evolving the Foosball Tournament Manager from a CLI application to a cross-platform desktop/web app.

### Current state

A C# project in the `DotNetAlgos/` folder with a pairing algorithm, 117 tests, and an interactive CLI app. Given a group of players assigned as attackers or defenders, it generates team pairings that maximize "freshness" — avoiding recently repeated combinations across a long season of weekly play.

### Real-world context

A group of friends plays foosball regularly (e.g., every Monday evening) from September to June. The app generates team pairings once per evening, and those teams play against each other in a mini-tournament that night. The pairing history across evenings is the core value — ensuring variety over 30–40 weeks.

### Project Name

| | Name |
|---|---|
| **Internal / repo** | foosball-fever |
| **English** | Foosball Fever |
| **Italian** | Biliardino Fever |

The commercial name changes with the app language. Each audience sees "their" game. "Fever" is universally understood and adds energy and fun.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Native shell | Tauri v2 |
| Build tooling | Vite |
| UI framework | React 19 (with React Compiler) |
| UI components | shadcn/ui (Radix UI + Tailwind CSS) |
| Localization | react-i18next |
| Routing | React Router |
| Testing | Vitest |
| CLI app | Ink (React for the terminal) + Ink UI |
| Language | TypeScript |

### Key Decisions

- **Tauri over Electron:** Lightweight (~10MB vs ~150MB), supports desktop and mobile
- **React 19 with Compiler:** Automatic optimization eliminates manual `useMemo`, `useCallback`, and `React.memo`. Write straightforward code; the compiler handles memoization at build time
- **React over Svelte:** Familiarity from work experience, massive ecosystem, strong tooling support
- **React Router from day one:** Future web version will need real URLs; easier to design around routes now than retrofit later
- **No Next.js:** It's designed for server-rendered web apps; Tauri is a client-side native app with no server
- **Algorithm rewrite:** The C# algorithm will be rewritten in TypeScript; performance is not a concern given the small data scale (10–30 players, dozens of match days)
- **shadcn/ui over MUI or custom:** Components are copied into the project (full ownership), built on Radix UI (accessibility) and Tailwind CSS (theming via CSS variables). Lightweight, customizable, and well-supported by AI coding tools
- **Vitest over Jest:** Natural companion to Vite — shares configuration and TypeScript pipeline, zero extra setup
- **Ink for CLI app:** React for the terminal — same mental model as the Tauri app, enables skill transfer and code sharing (types, repository layer). Richer terminal UI than prompt-based alternatives (Inquirer.js). Used by Claude Code, Prisma, Shopify CLI

### React 19 — Relevant Features

This is a Tauri client-side app with no server, so server-oriented features (Server Components, Server Actions, Partial Pre-rendering) do not apply. The following React 19 features are relevant and should be used:

| Feature | Use case in this app |
|---------|---------------------|
| **React Compiler** | Automatic memoization at build time. No manual `useMemo`, `useCallback`, or `React.memo` |
| **`<Activity />`** | Pre-render hidden UI (e.g., pairings result while still on setup screen) |
| **`useOptimistic`** | Instant UI feedback while saving to SQLite (e.g., accepting a match day) |
| **`useTransition`** | Keep UI responsive during heavier operations (e.g., generating teams) |
| **`use()` hook** | Cleaner data loading from repositories |
| **`useEffectEvent`** | Cleaner event handling inside effects without dependency array issues |
| **Automatic batching** | Fewer re-renders, handled automatically |

### React 19 — Patterns to Avoid

These patterns are legacy in React 19 and should NOT be used:

- `useMemo` / `useCallback` / `React.memo` — the React Compiler handles this automatically
- `useEffect` for data fetching where `use()` is cleaner
- Manual loading/error state management where `useOptimistic` or `useTransition` suffice

---

## Terminology

| Term | Meaning |
|------|---------|
| **Championship** | A season-long event (e.g., September to June) |
| **Match Day** | A single evening when teams are generated and play |
| **Player** | A person in the global registry |
| **Roster** | The players participating in a specific championship |
| **Roster Entry** | A single player's membership in a championship's roster |
| **Team** | A pair of one attacker + one defender |
| **Attacker / Defender** | The two roles in a foosball team |

### Why These Terms?

- **Championship** over "Season": sounds exciting and purposeful; "Season" is just a time period
- **Match Day** over "Round": avoids confusion with rounds within an evening's mini-tournament
- **Team** over "Pairing": natural language — it's what users say and think

### Role Icons

- ⚔️ = Attacker
- 🛡️ = Defender

These replace colored circles (🔴/🔵) which don't communicate what the role is. The icons are visually distinct at small sizes and immediately evocative.

---

## Data Model

### Core Entities

```typescript
type Role = 'attacker' | 'defender'

interface Player {
  id: string           // UUID
  firstName: string
  lastName: string
  displayName: string
  preferredRole?: Role // global preference (suggestion, never constraint)
  createdAt: string    // ISO 8601
  updatedAt: string
}

interface Championship {
  id: string           // UUID
  name: string
  archivedAt?: string  // NULL = active
  deletedAt?: string   // NULL = not deleted (soft delete)
  createdAt: string
  updatedAt: string
}

interface RosterEntry {
  id: string           // UUID
  championshipId: string
  playerId: string
  preferredRole?: Role // overrides player's global preference for this championship
  createdAt: string
}

interface MatchDay {
  id: string           // UUID
  championshipId: string
  matchDayNumber: number
  playedAt: string     // date of the evening
  createdAt: string
}

interface Team {
  id: string           // UUID
  matchDayId: string
  attackerId: string   // references Player
  defenderId: string   // references Player
  teamNumber: number   // display order
}
```

### Design Principles

- **Players are centralized:** Referenced by ID, never duplicated across championships
- **Preferences are suggestions:** Never constraints on the algorithm
- **UUIDs everywhere:** Auto-increment IDs collide when syncing offline databases; UUIDs don't
- **Future-ready for accounts:** An Account entity can later be linked to a Player

---

## Database

### Storage Strategy

| Scenario | Storage | Connection |
|----------|---------|------------|
| Tauri desktop/mobile | SQLite (local file) | Offline |
| Web version (future) | PostgreSQL (server) | Online |
| Tauri with sync (future) | SQLite + sync layer | Offline + periodic sync |

Key decisions:
- **SQLite over localStorage:** The domain is inherently relational (foreign keys, joins, constraints). SQLite enforces data integrity and makes querying natural.
- **Repository pattern:** App code calls `championshipRepository.getById(id)`, doesn't care whether that hits SQLite or a REST API. Interfaces live in `packages/app/`, SQL implementations in `packages/storage-sql/` (with dialect abstraction for SQLite/PostgreSQL), REST implementation in `packages/storage-rest/` (future). Shells wire them together.
- **Raw SQL, no ORM:** Queries are written by hand using named parameters (`:paramName`). A thin dialect layer handles the differences — SQLite supports named parameters natively, PostgreSQL's dialect layer transforms `:paramName` → `$N` positional parameters automatically. Simple, transparent, no magic.
- **Async from day one:** Even local storage uses Promises, so the swap to API calls is seamless.
- **SQLite → PostgreSQL is a well-trodden path:** ~90% identical SQL. The schema investment pays off directly.

### Schema

```sql
CREATE TABLE players (
    id             TEXT PRIMARY KEY,
    first_name     TEXT NOT NULL,
    last_name      TEXT NOT NULL,
    display_name   TEXT NOT NULL,
    preferred_role TEXT,
    created_at     DATETIME NOT NULL,
    updated_at     DATETIME NOT NULL
);

CREATE TABLE championships (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    archived_at DATETIME,
    deleted_at  DATETIME,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL
);

CREATE TABLE roster_entries (
    id              TEXT PRIMARY KEY,
    championship_id TEXT NOT NULL REFERENCES championships(id),
    player_id       TEXT NOT NULL REFERENCES players(id),
    preferred_role  TEXT,
    created_at      DATETIME NOT NULL,

    UNIQUE(championship_id, player_id)
);

CREATE TABLE match_days (
    id                TEXT PRIMARY KEY,
    championship_id   TEXT NOT NULL REFERENCES championships(id),
    match_day_number  INTEGER NOT NULL,
    played_at         DATETIME NOT NULL,
    created_at        DATETIME NOT NULL,

    UNIQUE(championship_id, match_day_number)
);

CREATE TABLE teams (
    id           TEXT PRIMARY KEY,
    match_day_id TEXT NOT NULL REFERENCES match_days(id),
    attacker_id  TEXT NOT NULL REFERENCES players(id),
    defender_id  TEXT NOT NULL REFERENCES players(id),
    team_number  INTEGER NOT NULL,

    UNIQUE(match_day_id, team_number),
    CHECK(attacker_id != defender_id)
);
```

Notes:
- `DATETIME` columns store ISO 8601 strings; SQLite treats them as TEXT internally but the type declaration communicates intent and eases future PostgreSQL migration
- No `ON DELETE CASCADE` — deletion logic handled explicitly in the repository for safety
- Soft delete on championships only (`archived_at`, `deleted_at`); match days use hard delete (only the last one can be deleted, as an "undo mistake" action)

### Migrations

Database schema changes are managed through numbered SQL migration scripts that run in order on app startup. Each dialect (SQLite, PostgreSQL) has its own set of migration files.

#### Structure

```
packages/
  storage-sql/
    migrations/
      sqlite/
        001_initial_schema.sql
        002_add_player_nickname.sql
      postgres/
        001_initial_schema.sql
        002_add_player_nickname.sql
```

Migration files are separate per dialect because SQLite and PostgreSQL have different capabilities. The same logical change may require fundamentally different SQL:

```sql
-- SQLite: change column constraint (copy-and-replace)
BEGIN TRANSACTION;
CREATE TABLE players_new (
  id TEXT PRIMARY KEY,
  preferred_role TEXT NOT NULL DEFAULT 'attacker',
  ...
);
INSERT INTO players_new SELECT * FROM players;
DROP TABLE players;
ALTER TABLE players_new RENAME TO players;
COMMIT;

-- PostgreSQL: same change, one line
ALTER TABLE players
  ALTER COLUMN preferred_role SET NOT NULL,
  ALTER COLUMN preferred_role SET DEFAULT 'attacker';
```

Separate files embrace this reality. Each migration uses the idioms its database supports — no templating, no transformation.

In practice, most migrations will be nearly identical between dialects. When writing a new migration: write it for SQLite first (the primary target), test it, then copy to the postgres folder and adjust the few lines that differ.

The postgres folder can be added later when the web version becomes real. No premature abstraction needed.

#### Tracking table

```sql
CREATE TABLE schema_migrations (
    version    INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    applied_at DATETIME NOT NULL
);
```

#### How it works

On app startup, a simple migration runner:

1. Creates `schema_migrations` if it doesn't exist
2. Reads all migration files for the active dialect
3. Checks which have already been applied
4. Runs unapplied ones in order, inside a transaction
5. Records each successful migration in `schema_migrations`

If a migration fails, the transaction rolls back. The database stays at the last successful version.

#### Rules

- **Immutable once shipped:** Never edit a migration that has been applied to any user's database. Fix issues with a new migration.
- **Forward-only:** No down/rollback migrations. If something goes wrong, fix it with a new forward migration.
- **Small and focused:** One logical change per migration file.
- **Same version numbers across dialects:** Migration 002 in SQLite and 002 in PostgreSQL represent the same logical change.
- **Embedded in the app:** Migration SQL is bundled as static assets in the Tauri binary — no external files to manage.
- **Custom runner:** A simple 30–40 line runner rather than a heavy library. The migration needs are modest.

### Query Pattern — Named Parameters

All repository queries use named parameters (`:paramName`) for clarity and safety:

```typescript
// Readable and self-documenting
const player = await db.queryOne<Player>(
  `SELECT id, first_name, last_name, display_name, preferred_role
   FROM players WHERE id = :id`,
  { id: playerId }
)

// INSERT with many columns — no position counting
await db.execute(
  `INSERT INTO players (id, first_name, last_name, display_name, preferred_role)
   VALUES (:id, :firstName, :lastName, :displayName, :preferredRole)`,
  { id, firstName, lastName, displayName, preferredRole }
)
```

The dialect layer handles the translation:

| Dialect | What happens to `:id` | Parameters format |
|---|---|---|
| SQLite | Passed through as `:id` (native support) | `{ id: 'abc' }` object |
| PostgreSQL | Transformed to `$1` | `['abc']` ordered array |

The PostgreSQL transformation is ~15 lines of code: a regex finds `:paramName` tokens, replaces them with `$N`, and builds the parameter array in the correct order.

---

## Algorithm Interface

The team generation algorithm is the core domain logic. It is a pure function — no side effects, no database access. The repository fetches data, the algorithm interprets it.

### Input

```typescript
interface GenerationInput {
  attackerIds: string[]
  defenderIds: string[]
  history: MatchDayHistory[]  // all past match days, ordered oldest → newest
  seed: number
}

interface MatchDayHistory {
  matchDayNumber: number
  teams: { attackerId: string; defenderId: string }[]
}
```

### Output

```typescript
interface GenerationResult {
  teams: GeneratedTeam[]
  metrics: GenerationMetrics
}

interface GeneratedTeam {
  teamNumber: number
  attackerId: string
  defenderId: string
  lastOccurrence?: number  // match days ago (undefined = never used)
}

interface GenerationMetrics {
  freshMatchDays: number     // how far back without any repeats
  repeatedCount: number      // teams that are repeats
  totalCount: number         // total teams
  calculationTimeMs: number
}
```

### Function

```typescript
function generateTeams(input: GenerationInput): GenerationResult
```

### Preconditions

- `attackerIds.length === defenderIds.length`
- `attackerIds.length > 0`
- No duplicate IDs within or across the two lists

### Behavior

- The algorithm maximizes "freshness" — it avoids repeating attacker-defender combinations from recent match days
- When repetition is unavoidable (all combinations exhausted), it repeats the oldest combinations first
- All past match days are considered (no lookback window)
- **Deterministic:** same input + same seed = same output, always
- **Seed usage:** first generation uses a random seed; "Regenerate" picks a new seed to produce different teams of equal quality

### Execution Model — Web Worker with Progressive Results

The algorithm runs in a **Web Worker** (separate thread) so the UI is never blocked. The worker progressively reports its best result as it explores candidates, enabling the user to interrupt at any point and use the best result found so far.

**Inside the worker:**

```typescript
let bestSoFar: GenerationResult | null = null

for (const candidate of generateCandidates(input)) {
  if (isBetterThan(candidate, bestSoFar)) {
    bestSoFar = candidate
    postMessage({ type: 'progress', result: bestSoFar })
  }
}

postMessage({ type: 'done', result: bestSoFar })
```

**Main thread:**

```typescript
const worker = new Worker('./generateTeamsWorker.ts')
let bestResult: GenerationResult | null = null

worker.onmessage = (event) => {
  if (event.data.type === 'progress') {
    bestResult = event.data.result
  }
  if (event.data.type === 'done') {
    bestResult = event.data.result
    showFinalResult(bestResult)
  }
}

// User clicks "Stop" or timeout fires
function interrupt() {
  worker.terminate()
  if (bestResult) showFinalResult(bestResult)
}
```

**UX flow:**

1. User taps "Generate teams"
2. Loading state with live quality indicator ("3 match days fresh... 5... 7...")
3. Normal case (10–30 players): finishes in milliseconds, result appears instantly
4. Slow case: user sees quality improving and can tap "Stop — use current result"
5. Safety timeout (e.g., 5 seconds): auto-stops and uses best found

**Loading state UI:**

```
┌─────────────────────────────────────┐
│  Generating teams...                │
│                                     │
│  Current best: 5 match days fresh   │
│  ██████████░░░░░░░░░░               │
│                                     │
│  [Stop — use current result]        │
└─────────────────────────────────────┘
```

---

## Testing Strategy

### Framework

**Vitest** — the natural companion to Vite. Shares the same configuration and TypeScript pipeline, zero extra setup. API is nearly identical to Jest (`describe`, `it`, `expect`).

### Approach

Test-driven rewrite: port the 117 C# tests to TypeScript first, then implement the algorithm until all tests pass. The existing tests serve as a specification.

### Implementation Order

1. Scaffold a Vite + TypeScript project (algorithm library only, not the full Tauri app yet)
2. Add Vitest
3. Port the 117 C# tests to TypeScript
4. Implement the algorithm until all tests pass
5. Then build the Tauri app around it

---

## Routes

```
/                                      → Championship list (home)
/championships/:id                     → Championship detail
/championships/:id/roster              → Roster management
/championships/:id/match-days          → Match day history
/championships/:id/match-days/new      → Match day setup
/championships/:id/match-days/:id      → Match day result (read-only)
/players                               → Global player registry
```

---

## User Workflows

### Workflow 1: First Launch

1. Land on championship list → empty
2. Create a championship ("Monday Foosball 2025/26")
3. Add players (either via global registry first, or inline while building roster)
4. Set preferred roles
5. Ready for first match day

Players added inline during roster setup automatically appear in the global registry too.

### Workflow 2: New Match Day (Core — must be fast)

This happens once per week, with people waiting around the table.

1. Open the championship
2. Tap "New Match Day"
3. See all roster players (starting as "sitting out" with preference hints)
4. Assign who's here: swipe/click to set as attacker or defender
5. Optional: use "Auto-assign" button to pre-fill from preferences
6. Adjust as needed (late arrivals, balance roles)
7. Generate teams (requires equal number of attackers and defenders)
8. Review teams — accept or regenerate with different seed
9. Done. Teams displayed. People go play.

### Workflow 3: Mid-Match-Day Changes

- **New arrival:** Quick inline add — name, preferred role, added to both roster and global registry
- **Someone leaves:** Simply don't include them next match day (data preserved)

### Workflow 4: New Championship with Returning Players

1. Create new championship
2. Browse global player registry to build roster
3. Shortcut: "Copy roster from another championship"
4. Adjust as needed

### Workflow 5: Browsing History

- View past match days within a championship
- See which teams were generated on each date
- (Future: results, standings)

### Workflow 6: Managing Global Player Registry

Occasional maintenance: rename a player, change global preferred role. Low frequency, not time-sensitive.

---

## Screen Designs

### 1. Championship List (Home Screen)

```
┌─────────────────────────────────────┐
│  Foosball Fever                     │
│                                     │
│  YOUR CHAMPIONSHIPS                 │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Monday Foosball 2025/26       │  │
│  │ 12 match days · 14 players    │  │
│  │ Last played: Oct 27           │  │
│  └───────────────────────────────┘  │
│                                     │
│  [+ New championship]               │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  ARCHIVED (2)                       │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Monday Foosball 2024/25       │  │
│  │ 38 match days · 16 players    │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Monday Foosball 2023/24       │  │
│  │ 35 match days · 12 players    │  │
│  └───────────────────────────────┘  │
│                                     │
│  ─────────────────────────────────  │
│  [Players registry]                 │
└─────────────────────────────────────┘
```

- Active championships on top, archived in a collapsible secondary section
- Soft-deleted championships are completely hidden from UI
- Each card shows key stats at a glance
- Creating a championship: simple inline form or modal — just a name field
- No archive/delete actions on this screen — those live in championship detail

### 2. Championship Detail

```
┌─────────────────────────────────────┐
│  ← Back    Monday Foosball 2025/26 ⋮│
├─────────────────────────────────────┤
│                                     │
│  14 players · 12 match days         │
│                                     │
│  [+ New Match Day]                  │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  RECENT MATCH DAYS                  │
│                                     │
│  Match Day 12 — Oct 27              │
│    8 teams                          │
│                                     │
│  Match Day 11 — Oct 20              │
│    7 teams                          │
│                                     │
│  Match Day 10 — Oct 13              │
│    8 teams                          │
│                                     │
│  [View all match days]              │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  [Manage roster]                    │
│                                     │
└─────────────────────────────────────┘
```

- Big "New Match Day" button is the primary action
- Three most recent match days shown; "View all" links to full history
- Three-dot menu (⋮) contains: Rename, Archive, Delete
- Delete is styled as a destructive action (red text)
- Delete shows confirmation dialog: "Delete this championship? You can recover it later."
- Archive needs no confirmation (easily reversible)

### 3. Roster Management

```
┌─────────────────────────────────────┐
│  ← Back              Roster         │
│           Monday Foosball 2025/26   │
├─────────────────────────────────────┤
│                                     │
│  14 players    ⚔️ attacker 🛡️ defender │
│                                     │
│  🛡️ Anna                            │
│     Chiara                           │
│  🛡️ Davide                          │
│  ⚔️ Elena                           │
│  🛡️ Giulia                          │
│  ⚔️ Luca                            │
│  ⚔️ Marco                           │
│     Maria                            │
│     Matteo                           │
│  ⚔️ Paolo                           │
│     Pietro                           │
│  ⚔️ Roberto                         │
│  🛡️ Sara                            │
│  🛡️ Stefano                         │
│                                     │
│  [+ Add player]                     │
└─────────────────────────────────────┘
```

- Role legend at the top (shown once, not repeated per row)
- Icon before the name — forms a single visual unit, no eye-travel across the row
- Players without a preference show no icon (slight indent keeps names aligned)
- Alphabetically sorted
- Tapping a player: inline edit for role preference or remove from roster

**Add player flow:**

```
┌─────────────────────────────────────┐
│  Add player                         │
│                                     │
│  FROM REGISTRY                      │
│  ┌───────────────────────────────┐  │
│  │ 🔍 Search...                  │  │
│  └───────────────────────────────┘  │
│  Andrea                             │
│  Fabio                              │
│  Laura                              │
│                                     │
│  ─────────────────────────────────  │
│  [+ Create new player]             │
└─────────────────────────────────────┘
```

Only players not already in the roster appear. Creating a new player adds to both the registry and the roster.

### 4. Match Day Setup

This is the most important screen — speed is critical.

#### Desktop / Tablet Landscape (≥768px)

Three-column layout:

```
 DEFENDERS (4)     ALL PLAYERS            ATTACKERS (5)
┌──────────────┐  ┌────────────────────┐  ┌──────────────┐
│ 🛡️ Anna      │  │ 🛡️ Anna           │  │ ⚔️ Marco     │
│ 🛡️ Giulia    │  │ ⚔️ Marco          │  │ ⚔️ Luca      │
│ 🛡️ Stefano   │  │    Matteo    (⚔️)  │  │ ⚔️ Paolo     │
│ 🛡️ Davide    │  │ 🛡️ Giulia         │  │ ⚔️ Elena     │
│              │  │ ⚔️ Luca           │  │ ⚔️ Roberto   │
│              │  │ ...               │  │              │
└──────────────┘  └────────────────────┘  └──────────────┘

              [+ Add player]    [Auto-assign]

        ⚠ Unbalanced: 5 attackers, 4 defenders

                    [Generate teams] (disabled)
```

- Left column: defenders (read-only live summary)
- Center: all players (the interactive list — all interaction happens here)
- Right column: attackers (read-only live summary)
- Side columns match physical table position
- Preference hints: sitting-out players show `(⚔️)` or `(🛡️)` in parentheses, faded, next to their name
- Auto-assign button: places all players according to preferences
- Generate button disabled until attacker/defender counts are equal

#### Mobile / Tablet Portrait (<768px)

Single list with sticky bottom bar:

```
┌─────────────────────────────────────┐
│  ← Back          Match Day Setup    │
├─────────────────────────────────────┤
│  [Auto-assign]      [+ Add player]  │
├─────────────────────────────────────┤
│                                     │
│  🛡️ Anna                            │
│  ⚔️ Marco                           │
│     Matteo              (⚔️) faded   │
│  🛡️ Giulia                          │
│  ⚔️ Luca                            │
│  ...                                │
│                                     │
├─────────────────────────────────────┤
│ [🛡️ 4 def] [⚔️ 5 att] [3 out]     │
│ ⚠ Need equal attackers & defenders │
│                                     │
│ [Generate teams]                    │
└─────────────────────────────────────┘
```

Summary bar items act as toggle filters: tap "🛡️ 4 def" to show only defenders, tap again to show all.

#### Interaction Model

**Role states and transitions:**

```
       ←              ←              
 🛡️ Defender ←→    Sitting Out  ←→ ⚔️ Attacker
       →              →              
```

**Desktop keyboard shortcuts:**

| Key | Action |
|-----|--------|
| ↑ ↓ | Navigate the center list |
| ← → | Cycle role (defender ↔ sitting out ↔ attacker) |
| Delete / Backspace | Reset to sitting out |

| Current state | Press ← | Press → |
|---|---|---|
| 🛡️ Defender | *nothing (already leftmost)* | Sitting Out |
| Sitting Out | 🛡️ Defender | ⚔️ Attacker |
| ⚔️ Attacker | Sitting Out | *nothing (already rightmost)* |

**Mobile gestures:**

| Gesture | Action |
|---------|--------|
| Swipe left | Move toward defender (or sitting out if already attacker) |
| Swipe right | Move toward attacker (or sitting out if already defender) |

Swipe direction matches spatial layout: left = defender side, right = attacker side. Colored background revealed during swipe as visual feedback.

**Click on side column (desktop):** Focuses that player in the center list for keyboard interaction.

**Drag & drop:** Phase 2 enhancement, desktop only (conflicts with swipe on mobile).

#### Responsive Breakpoints

| Screen Width | Layout |
|--------------|--------|
| < 768px | Single list + summary bar |
| ≥ 768px | Three columns |

Same React components, different arrangement via CSS breakpoints.

### 5. Pairings Result Screen

Shown after tapping "Generate teams."

```
┌─────────────────────────────────────┐
│  ← Back       Match Day 12          │
│               Oct 27, 2025          │
├─────────────────────────────────────┤
│                                     │
│  #   ⚔️ Attacker    🛡️ Defender    │
│  ─────────────────────────────────  │
│  1   Marco           Anna           │
│  2   Luca            Giulia         │
│  3   Paolo           Stefano        │
│  4   Elena           Davide         │
│  5   Roberto         Sara           │
│  6   Fabio           Chiara         │
│  7   Andrea          Maria      ♻ 2 │
│  8   Pietro          Laura          │
│                                     │
├─────────────────────────────────────┤
│  ⏱ 12ms  │  3 match days fresh  │  1/8 repeated  │
│                                     │
│  [Regenerate]           [Accept]    │
└─────────────────────────────────────┘
```

- Compact table: one row per team, all visible at a glance
- ♻ 2 on a team means "this combination last occurred 2 match days ago" — only shown on repeated teams
- Metrics bar: calculation time, freshness depth, repeat count
- Regenerate: new seed, different teams of equal quality
- Accept: saves and returns to championship detail

**Read-only mode** (viewing past match days): same layout but no Regenerate/Accept buttons. The most recent match day shows a three-dot menu with a red "Delete" option (only available on the last match day).

### 6. Match Day History

```
┌─────────────────────────────────────┐
│  ← Back           Match Day History │
│           Monday Foosball 2025/26   │
├─────────────────────────────────────┤
│                                     │
│  Match Day 12 — Oct 27              │
│    8 teams                          │
│                                     │
│  Match Day 11 — Oct 20              │
│    7 teams                          │
│                                     │
│  Match Day 10 — Oct 13              │
│    8 teams                          │
│                                     │
│  Match Day 9 — Oct 6                │
│    6 teams                          │
│                                     │
│  ...                                │
│                                     │
│  Match Day 1 — Sep 8                │
│    5 teams                          │
│                                     │
└─────────────────────────────────────┘
```

Most recent first. Tapping a match day opens the pairings result screen in read-only mode.

### 7. Global Player Registry

```
┌─────────────────────────────────────┐
│  ← Back           Players Registry  │
├─────────────────────────────────────┤
│                                     │
│  16 players    ⚔️ attacker 🛡️ defender │
│                                     │
│  🛡️ Anna Rossi                      │
│     in: Monday 2025/26, Monday 24/25│
│                                     │
│  ⚔️ Andrea Bianchi                  │
│     in: Monday 2024/25              │
│                                     │
│     Chiara Conti                     │
│     in: Monday 2025/26              │
│                                     │
│  ...                                │
│                                     │
│  [+ New player]                     │
│                                     │
└─────────────────────────────────────┘
```

- Full names shown (administrative view)
- Each entry shows which championships the player belongs to
- Tapping a player: edit global info (names, display name, preferred role)

---

## Championship Lifecycle

### States

```
Active  →  Archived  →  Deleted (soft)
  ↑           │
  └───────────┘
     (restore)
```

- **Active:** Visible on home screen, fully interactive
- **Archived:** Visible in collapsible "Archived" section, read-only (can be restored)
- **Deleted (soft):** Hidden from UI, exists only in database (`deleted_at` timestamp), potentially recoverable

### Match Day Deletion

- Only the last match day in a championship can be deleted (hard delete)
- Deleting from the middle would break the freshness algorithm's history
- Confirmation dialog required
- After deletion, navigates back to championship detail

---

## Global Navigation Element

Every screen has a persistent 👤 icon in the top-right corner. It provides access to global settings (theme, future account settings) from anywhere in the app.

```
┌─────────────────────────────────────┐
│  ← Back    Monday Foosball 2025/26 👤│    ← always present
```

On screens with contextual actions (e.g., championship detail), the screen-specific ⋮ menu and the global 👤 icon coexist as separate elements:

```
┌─────────────────────────────────────┐
│  ← Back    Monday Foosball 2025/26 ⋮ 👤│
```

- **👤** = global actions (theme, settings). Always the same, everywhere.
- **⋮** = screen-specific actions (rename, archive, delete). Only on screens that need it.

They are kept separate so users build muscle memory for the global icon, and the meanings never blur.

Tapping 👤 opens a dropdown:

```
┌──────────────────┐
│  Theme            │
│  ┌──────────────┐ │
│  │ ◉ Classic     │ │
│  │ ○ Dark        │ │
│  │ ○ Sensible ⚽ │ │
│  └──────────────┘ │
│                    │
│  Settings          │
└──────────────────┘
```

Theme switching is instant — no page reload, no confirmation. CSS variables update on the root element and the app repaints immediately.

---

## Theming

### Architecture

The theming system is built on CSS variables. shadcn/ui components already reference these variables, so swapping a theme changes the entire app without touching component code.

```typescript
type ThemeName = 'classic' | 'classic-dark' | 'sensible-soccer'

// Switching theme = swapping a CSS class on the root element
document.documentElement.className = 'theme-sensible-soccer'
```

A `ThemeProvider` React component wraps the entire app. It reads the current theme from state, applies the CSS class, and exposes `setTheme()` via React context. The user's choice is persisted to the database.

### Initial Themes (Implemented in Phase 2)

These three themes validate different aspects of the theming system:

| Theme | What it proves |
|-------|---------------|
| Classic | Baseline — everything designed against this |
| Classic Dark | CSS variable swap works for colors |
| Sensible Soccer | Theming goes deeper — fonts, borders, personality |

**📋 Classic**

Clean, neutral, modern. The professional baseline.

- Light background (whites and grays)
- Standard sans-serif font
- Subtle shadows, gentle border-radius
- The "just works" option

**🌙 Classic Dark**

Same personality as Classic, inverted colors. Proves light/dark swap.

- Dark backgrounds, light text
- Same fonts, same spacing, same border-radius as Classic
- Only color variables change
- Many users expect dark mode

**🎮 Sensible Soccer (1992)**

Iconic top-down pixel art football. Proves deep theming (fonts, shapes, personality).

- Pixel font (e.g., Press Start 2P or Silkscreen)
- Bright green background tones — pixel pitch feel
- Sharp square corners everywhere (no border-radius — pixels don't curve)
- Bold flat primary colors: red, blue, yellow — no gradients
- Thick blocky borders
- UI feels like a 16-bit game menu

### Future Theme Roadmap

Additional themes to implement later, each with a distinct visual identity:

**⚽ FIFA 96** — Early EA Sports era. Dark navy/black backgrounds, gold/metallic accents, serif or bold sporty font, subtle '90s 3D gradients on buttons. Console game menu feel.

**⚡ Captain Tsubasa ('83 anime)** — Dynamic Japanese animation style. Speed lines and diagonal stripes as accents, bright saturated colors (vivid blue, fiery orange), bold rounded slightly-italic font suggesting motion, thick outlines on cards. Anime title card feel.

**📊 Championship Manager (1993–2005)** — The legendary text-based management sim. Dark blue/navy backgrounds, monospaced or small system font, dense compact layouts, green for positive / red for negative. Serious management tool feel.

**🏟️ Panini Sticker Album** — Collecting and trading football stickers. Cream/off-white paper texture, muted CMYK printed colors, slightly rounded sticker-edge corners, magazine caption typography. Warm worn nostalgia.

**⚡ Rocket League** — Futuristic neon football. Dark background with electric blue and orange accents, glowing neon border effects, bold geometric sans-serif, metallic and carbon fiber textures. High-tech competitive feel.

---

## Localization (i18n)

### Approach

All user-facing text lives in translation files, never hardcoded in components. The app uses **react-i18next** for internationalization.

```typescript
// In components — never raw text:
<button>{t('matchDay.generate')}</button>
```

### Supported Languages

Phase 1: English and Italian. Additional languages can be added later by creating new translation files.

Default behavior: detect the system language on first launch. If Italian, start in Italian. Otherwise default to English. The user can always change it.

### Language Selector

Lives in the global 👤 menu alongside the theme picker. Language switching is instant — no reload.

```
┌──────────────────┐
│  Theme            │
│  ◉ Classic        │
│  ○ Dark           │
│  ○ Sensible ⚽    │
│  ──────────────── │
│  Language          │
│  ◉ English        │
│  ○ Italiano       │
│  ──────────────── │
│  Settings          │
└──────────────────┘
```

### Terminology Mapping

| English | Italian |
|---|---|
| Foosball | Biliardino |
| Championship | Campionato |
| Match Day | Giornata |
| Team | Squadra |
| Roster | Rosa |
| Attacker | Attaccante |
| Defender | Difensore |
| Player | Giocatore |

### What Gets Translated vs. What Doesn't

| Translated | Not translated |
|---|---|
| All UI labels, buttons, headers | Player names (user-created) |
| Error messages | Championship names (user-created) |
| Placeholder text | |
| Tooltips and hints | |

Dates are not translated with strings but formatted according to locale using `Intl.DateTimeFormat`. "Oct 27, 2025" in English becomes "27 ott 2025" in Italian.

### Translation File Structure

```
src/
  i18n/
    en.json
    it.json
```

Example:

```json
// en.json
{
  "app.name": "Foosball Fever",
  "home.yourChampionships": "Your Championships",
  "home.newChampionship": "New Championship",
  "home.archived": "Archived",
  "matchDay.generate": "Generate teams",
  "matchDay.regenerate": "Regenerate",
  "matchDay.accept": "Accept",
  "roles.attacker": "Attacker",
  "roles.defender": "Defender"
}

// it.json
{
  "app.name": "Biliardino Fever",
  "home.yourChampionships": "I tuoi campionati",
  "home.newChampionship": "Nuovo campionato",
  "home.archived": "Archiviati",
  "matchDay.generate": "Genera squadre",
  "matchDay.regenerate": "Rigenera",
  "matchDay.accept": "Accetta",
  "roles.attacker": "Attaccante",
  "roles.defender": "Difensore"
}
```

### Implementation Timing

i18n setup happens in **Phase 2** (scaffolding), alongside the theme system. Install react-i18next, create the two translation files, wrap the app in the i18n provider. Every component built from Phase 4 onward uses translation keys from the start — no retrofitting.

---

## Implementation Order

Each phase produces something testable and working. Each layer is verified before building the next one on top.

```
Phase 1a  ████  Algorithm + tests (standalone)
Phase 1b  ██    CLI app (Ink — port from C#)
Phase 2   ████  Tauri/React scaffolding + theming (all 3 themes) + i18n
Phase 3   ███   Database layer + repositories
Phase 4   ██    Championship list (first vertical slice)
Phase 5   ███   Player registry + roster management
Phase 6   █████ Match day setup + generation (the big one)
Phase 7   ███   Pairings result + accept flow
Phase 8   ███   History, detail screens, archive/delete
```

### Project Structure

```
foosball-fever/
  DotNetAlgos/                        ← original C# (reference)
  packages/
    team-generator/                   ← algorithm + CLI testing tool
      src/
        generateTeams.ts
        types.ts                      ← GenerationInput, GenerationResult, etc.
      tests/                          ← Vitest tests
      cli/
        src/
          app.tsx
          screens/
          components/
          types.ts                    ← TournamentData, HistoricalRound (CLI-only)
          persistence.ts
    app/                              ← shared React app (UI layer)
      src/
        screens/
        components/
        hooks/
        i18n/
        theme/
        types/                        ← domain types: Player, Championship, MatchDay, Team
        repositories/
          PlayerRepository.ts         ← interface only
          ChampionshipRepository.ts
          RosterRepository.ts
          MatchDayRepository.ts
          index.ts                    ← re-exports all interfaces + Repositories type
    storage-sql/                        ← database layer (raw SQL, no ORM)
      src/
        database.ts                   ← Database interface + dialect abstraction
        dialects/
          sqlite.ts                   ← SQLite connection setup
          postgres.ts                 ← PostgreSQL connection setup (future)
        repositories/
          playerRepository.ts         ← raw SQL, named parameters
          championshipRepository.ts
          matchDayRepository.ts
        migrations/
          sqlite/
            001_initial_schema.sql
          postgres/                   ← added when web version is needed
            001_initial_schema.sql
        migrationRunner.ts            ← custom 30-40 line runner
      tests/
    storage-rest/                     ← REST client for web browser (future)
      src/
        repositories.ts              ← implements same interfaces via HTTP calls
      tests/
    tauri-shell/                      ← Tauri desktop app (wiring only)
      src-tauri/                      ← Rust backend (Tauri config, SQLite plugin)
      src/
        main.tsx                      ← imports App + storage-sql (SQLite dialect), done
    web-shell/                        ← browser web app (future, wiring only)
      src/
        main.tsx                      ← imports App + storage-rest, done
  docs/
    DESIGN.md
  CLAUDE.md
```

Each package has a single responsibility:

| Package | Responsibility |
|---|---|
| `team-generator` | Algorithm — pure logic, no I/O |
| `app` | UI — screens, components, hooks, types, repository *interfaces* |
| `storage-sql` | Database layer — raw SQL repositories + migrations, supports SQLite and PostgreSQL via dialect abstraction |
| `storage-rest` | REST client — implements repository interfaces via HTTP (future, for web browser) |
| `tauri-shell` | Wires `app` + `storage-sql` (SQLite dialect) into a Tauri desktop app |
| `web-shell` | Wires `app` + `storage-rest` into a browser app (future) |

The shells are intentionally thin — just entry points that wire the app to a storage implementation:

```typescript
// packages/tauri-shell/src/main.tsx
import { App } from '@foosball-fever/app'
import { createRepositories } from '@foosball-fever/storage-sql'
import { createSqliteDialect } from '@foosball-fever/storage-sql/dialects/sqlite'

const repositories = createRepositories(createSqliteDialect())
render(<App repositories={repositories} />)
```

The repository pattern enables this separation: `app` defines the interfaces, `storage-sql` and `storage-rest` provide implementations, shells pick which implementation to use.

- The `storage-sql` package uses raw SQL (no ORM) with named parameters (`:paramName`) — SQLite supports them natively, PostgreSQL's dialect layer transforms them to positional `$N` parameters automatically
- Migration files are separate per dialect because SQLite and PostgreSQL have different capabilities (e.g., SQLite requires copy-and-replace for schema changes that PostgreSQL handles with a simple ALTER)
- CLI types are isolated in `team-generator/cli/` and clearly distinct from the app's domain model
- Adding the web platform means adding `storage-rest` + `web-shell` — the UI doesn't change

### Phase 1a: Algorithm + Tests (standalone)

Port the C# algorithm to a standalone TypeScript library under `packages/team-generator/` with Vitest tests. No UI, no database, no Tauri. Port the tests first, then implement until they all pass.

Reference implementation: the original C# algorithm and tests are in the `DotNetAlgos/` folder in the repository. Use as specification for the TypeScript port.

Why first: it's the core value of the app, has a clear specification, and zero dependencies on anything else.

### Phase 1b: CLI App (Ink)

Port the C# CLI application to TypeScript using Ink (React for the terminal) and Ink UI under `packages/team-generator/cli/`. Same menu-driven flow: manage players, create match days, assign roles, generate teams, view history. Uses the algorithm library from Phase 1a directly.

Built with Ink because:
- Same React mental model as the Tauri app — skills transfer directly
- Shared code: types, algorithm interface, and potentially the repository layer
- Richer terminal UI than prompt-based alternatives (boxes, tables, colors, spinners)

CLI types (`TournamentData`, `HistoricalRound`, `TeamRecord`) are intentionally simpler than the app's domain model — no UUIDs, no relational structure, just player names and rounds in a JSON file. They are scoped to the CLI and should not be used by the Tauri app.

This gives a working interactive tool immediately, before the full Tauri app is built. Can be used for real foosball evenings if needed.

### Phase 2: Tauri + React Scaffolding

Set up `packages/app/` (shared React app) and `packages/tauri-shell/` (Tauri wiring). Install Tauri v2, Vite, React, React Router, shadcn/ui, Tailwind CSS, react-i18next. Placeholder routes, ThemeProvider with all three Phase 1 themes working (Classic, Classic Dark, Sensible Soccer), i18n provider with English and Italian translation files, global 👤 icon with theme and language selectors. Verify the build pipeline works and the app launches.

Including all three themes now validates the full theming architecture while the app is simple — Classic + Dark prove color swapping, Sensible Soccer proves deep theming (custom fonts, square corners, different personality). Easier to fix architectural gaps now than after 8 screens are built.

Why second: get the tooling pain out of the way before real code complicates debugging.

### Phase 3: Database Layer

Set up `packages/storage-sql/`. Custom migration runner, initial schema migration (SQLite dialect), Database interface with SQLite dialect implementation, repository implementations using raw SQL. Define repository interfaces in `packages/app/src/repositories/` (one file per repository). Integration tests against in-memory SQLite: create a player, create a championship, add roster entries, save a match day with teams, read them back. Wire `tauri-shell` to use `storage-sql` with SQLite dialect.

Why third: real persistence in place means everything built after this saves and loads real data.

### Phase 4: Championship List (First Vertical Slice)

Build the home screen and "create championship" flow in `packages/app/`. The simplest screen, but it proves the full vertical slice: UI → repository interface → SQLite implementation → back to UI. Shakes out architectural wiring issues.

### Phase 5: Player Registry + Roster Management

Global player registry and roster management screen. Creating players, adding them to a championship, setting preferences. Produces the data needed for the match day screen.

### Phase 6: Match Day Setup + Generation

The most important and complex screen. Wire match day setup UI to the algorithm via Web Worker: role assignment (keyboard + swipe), auto-assign, generate teams with progressive results and interrupt support. Build both desktop (three-column) and mobile (single-list) layouts.

### Phase 7: Pairings Result + Accept Flow

Result screen, metrics display, regenerate flow, accept and save to database. After this phase, the core workflow is complete end-to-end.

### Phase 8: History and Polish

Championship detail screen (with recent match days), match day history, read-only match day view, delete last match day, archive/delete championship. Simpler screens that mostly read and display data.

---

## Future Enhancements (Not in Initial Release)

- User accounts and authentication
- Role-based access (creator/manager/viewer per championship)
- Linking accounts to players
- Tracking game results within a match day
- Standings and statistics
- Team name generation
- "Display mode" for showing teams on a big screen (large text, no buttons)
- Import/export functionality
- Cloud sync (offline-first with server)
- Copy roster from another championship

---

## Key Design Principles

1. **Offline-first:** Works without internet, ready for future sync
2. **Repository pattern:** `app` defines interfaces, `storage-sql` provides SQL implementations (SQLite/PostgreSQL via dialect), `storage-rest` provides HTTP implementation (future), shells wire them together
3. **Async from day one:** Even local storage uses Promises
4. **Players are centralized:** Referenced by ID, never duplicated
5. **Preferences are suggestions:** Never constraints on the algorithm
6. **Speed matters:** Match day setup must be fast — people are waiting
7. **Responsive, not separate:** Same components, different layouts based on screen width
8. **Keyboard and touch:** Both fully supported with intuitive mappings
9. **Relational from the start:** SQLite now, PostgreSQL later — same schema investment
10. **UUIDs everywhere:** Safe for future multi-device sync
11. **Theming via CSS variables:** Components never reference colors/fonts directly; all styling flows through swappable theme variables
12. **i18n from day one:** All user-facing text in translation files, never hardcoded. English and Italian supported from the start
13. **Algorithm in Web Worker:** Generation runs off the main thread with progressive results, interruptible by the user
