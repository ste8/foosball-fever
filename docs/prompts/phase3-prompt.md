Read docs/DESIGN.md, focusing on "Database" (Schema, Migrations, Query Pattern — Named Parameters), "Domain Model", and "Phase 3: Database Layer".

Set up `packages/storage-sql/` and define repository interfaces in `packages/app/`.

## 1. Domain Types — `packages/app/src/types/`

Create the domain types from the design doc. These are the app's core data structures:

```typescript
// types/index.ts
type Role = 'attacker' | 'defender'

interface Player {
  id: string
  firstName: string
  lastName: string
  displayName: string
  preferredRole?: Role
  createdAt: string    // ISO 8601
  updatedAt: string
}

interface Championship {
  id: string
  name: string
  archivedAt?: string
  deletedAt?: string
  createdAt: string
  updatedAt: string
}

interface RosterEntry {
  id: string
  championshipId: string
  playerId: string
  preferredRole?: Role
  createdAt: string
}

interface MatchDay {
  id: string
  championshipId: string
  matchDayNumber: number
  playedAt: string
  createdAt: string
}

interface Team {
  id: string
  matchDayId: string
  attackerId: string
  defenderId: string
  teamNumber: number
}
```

## 2. Repository Interfaces — `packages/app/src/repositories/interfaces.ts`

Define abstract interfaces that the UI will call. These are the contract — `storage-sql` implements them, `storage-rest` (future) will too.

Design the methods based on what the screens need (see the screen designs in the doc). Key operations:

**PlayerRepository:**
- getAll() → Player[]
- getById(id) → Player | null
- create(data) → Player
- update(id, data) → Player
- delete(id) → void

**ChampionshipRepository:**
- getAll(includeArchived?: boolean) → Championship[]
- getById(id) → Championship | null
- create(data) → Championship
- update(id, data) → Championship
- archive(id) → void
- unarchive(id) → void
- delete(id) → void (soft delete)

**RosterRepository:**
- getByChampionshipId(championshipId) → RosterEntry[] (with player data joined)
- addPlayer(championshipId, playerId, preferredRole?) → RosterEntry
- updatePreferredRole(id, role?) → void
- removePlayer(id) → void

**MatchDayRepository:**
- getByChampionshipId(championshipId) → MatchDay[] (ordered by matchDayNumber desc)
- getById(id) → MatchDay | null (with teams + player data joined)
- create(championshipId, matchDayNumber, playedAt, teams) → MatchDay (transactional: inserts match_day + all teams)
- deleteLast(championshipId) → void (only the last match day can be deleted)
- getHistory(championshipId) → MatchDayHistory[] (for algorithm input: ordered oldest→newest)

All methods return Promises (async from day one).

## 3. Database Interface — `packages/storage-sql/src/database.ts`

A thin abstraction over the actual database connection:

```typescript
interface Database {
  execute(sql: string, params?: Record<string, any>): Promise<void>
  query<T>(sql: string, params?: Record<string, any>): Promise<T[]>
  queryOne<T>(sql: string, params?: Record<string, any>): Promise<T | null>
  transaction<T>(fn: (db: Database) => Promise<T>): Promise<T>
}
```

All methods accept named parameters (`:paramName` style). See "Query Pattern — Named Parameters" in the design doc.

## 4. SQLite Dialect — `packages/storage-sql/src/dialects/sqlite.ts`

Implements the Database interface using `better-sqlite3` for Node.js (tests) and `@tauri-apps/plugin-sql` for Tauri (runtime).

For Phase 3, implement the `better-sqlite3` variant only — this is what the tests use. The Tauri variant will be wired in when we integrate with `tauri-shell`.

The SQLite dialect passes `:paramName` parameters directly (SQLite supports them natively).

**Important:** Use `better-sqlite3` (synchronous, fast, great for testing). Wrap its synchronous API in Promises to match the async Database interface.

## 5. Migration Runner — `packages/storage-sql/src/migrationRunner.ts`

A simple ~30-40 line runner:

1. Creates `schema_migrations` table if it doesn't exist
2. Reads migration files for the active dialect (e.g., `migrations/sqlite/`)
3. Checks which have already been applied
4. Runs unapplied ones in order, inside a transaction
5. Records each successful migration in `schema_migrations`

Migrations are raw SQL files. The runner reads them from the filesystem (for tests) or from bundled strings (for Tauri — figure out the import strategy).

## 6. Initial Schema Migration — `packages/storage-sql/src/migrations/sqlite/001_initial_schema.sql`

The full schema from the design doc:

```sql
CREATE TABLE players (
    id             TEXT PRIMARY KEY,
    first_name     TEXT NOT NULL,
    last_name      TEXT NOT NULL,
    display_name   TEXT NOT NULL,
    preferred_role TEXT,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
);

CREATE TABLE championships (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    archived_at TEXT,
    deleted_at  TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE TABLE roster_entries (
    id              TEXT PRIMARY KEY,
    championship_id TEXT NOT NULL REFERENCES championships(id),
    player_id       TEXT NOT NULL REFERENCES players(id),
    preferred_role  TEXT,
    created_at      TEXT NOT NULL,
    UNIQUE(championship_id, player_id)
);

CREATE TABLE match_days (
    id                TEXT PRIMARY KEY,
    championship_id   TEXT NOT NULL REFERENCES championships(id),
    match_day_number  INTEGER NOT NULL,
    played_at         TEXT NOT NULL,
    created_at        TEXT NOT NULL,
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

Note: use TEXT for datetime columns in SQLite (stores ISO 8601 strings). Enable foreign keys with `PRAGMA foreign_keys = ON` on every connection.

## 7. Repository Implementations — `packages/storage-sql/src/repositories/`

Implement each repository interface using raw SQL with named parameters. Each file exports a factory function that takes a Database instance:

```typescript
// Example pattern
export function createPlayerRepository(db: Database): PlayerRepository {
  return {
    async getAll() {
      return db.query<Player>(
        `SELECT id, first_name, last_name, display_name, preferred_role, created_at, updated_at
         FROM players ORDER BY display_name`
      )
    },
    async create(data) {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      await db.execute(
        `INSERT INTO players (id, first_name, last_name, display_name, preferred_role, created_at, updated_at)
         VALUES (:id, :firstName, :lastName, :displayName, :preferredRole, :createdAt, :updatedAt)`,
        { id, firstName: data.firstName, ...etc, createdAt: now, updatedAt: now }
      )
      return { id, ...data, createdAt: now, updatedAt: now }
    },
    // ... etc
  }
}
```

**Column name mapping:** SQLite uses snake_case, TypeScript uses camelCase. The query results will have snake_case keys. Handle the mapping in the repository layer (map `first_name` → `firstName` etc). Keep it explicit, no magic auto-mapping.

**MatchDay creation is transactional:** INSERT match_day + all teams in a single transaction.

**Delete last match day:** verify it's actually the last one before deleting (by match_day_number), delete teams first, then match_day.

**getHistory for algorithm:** returns `MatchDayHistory[]` format matching the algorithm's `GenerationInput.history`.

## 8. Integration Tests — `packages/storage-sql/tests/`

Using Vitest with `better-sqlite3` in-memory databases (`:memory:`). Each test gets a fresh database with migrations applied.

Test scenarios:
- **Migration runner:** applies initial schema, tracks applied migrations, skips already-applied ones
- **Player CRUD:** create, read, update, delete a player
- **Championship lifecycle:** create, archive, unarchive, soft delete
- **Roster management:** add player to championship, update role preference, remove player, enforce uniqueness
- **Match day full flow:** create match day with teams (transactional), read back with teams and player data, delete last match day only
- **Algorithm history:** create multiple match days, verify getHistory returns correct format ordered oldest→newest
- **Foreign key enforcement:** cannot create roster entry for nonexistent player/championship
- **Named parameters:** verify :paramName style works correctly

## 9. Wire into tauri-shell

Update `packages/tauri-shell/` to:
- Add `@tauri-apps/plugin-sql` dependency
- Create a Tauri-specific SQLite dialect that wraps the Tauri SQL plugin (same Database interface, different driver)
- On app startup: create database, run migrations, create repositories, pass them to the App component via context/props
- The `packages/app/` App component should accept repositories as a prop or via a React context provider

## Target Structure

```
packages/
  app/src/
    types/
      index.ts                    ← domain types (Player, Championship, etc.)
    repositories/
      interfaces.ts               ← abstract repository interfaces
      RepositoryContext.tsx        ← React context to provide repositories to components
  storage-sql/
    src/
      database.ts                 ← Database interface
      dialects/
        sqlite.ts                 ← better-sqlite3 implementation (for tests)
        tauri-sqlite.ts           ← Tauri plugin implementation (for runtime)
      repositories/
        playerRepository.ts
        championshipRepository.ts
        rosterRepository.ts
        matchDayRepository.ts
        index.ts                  ← createRepositories(db) factory
      migrations/
        sqlite/
          001_initial_schema.sql
      migrationRunner.ts
      index.ts                    ← public API
    tests/
      migration.test.ts
      playerRepository.test.ts
      championshipRepository.test.ts
      rosterRepository.test.ts
      matchDayRepository.test.ts
    package.json
    tsconfig.json
```

## Verification

1. All integration tests pass
2. Migration runner creates all tables correctly
3. Full CRUD works for players and championships
4. Roster management with uniqueness constraint works
5. Match day creation is transactional (if team insert fails, match day rolls back)
6. Delete last match day works, deleting non-last fails
7. getHistory returns correct algorithm input format
8. Named parameters work throughout
9. Foreign keys are enforced
10. Tauri app launches and connects to SQLite database
11. Existing algorithm and CLI tests still pass (no regressions)
