Read docs/DESIGN.md, focusing on "5. Pairings Result Screen" and "Phase 7: Pairings Result + Accept Flow".

After this phase, the core workflow is complete end-to-end: create championship → add players → assign roles → generate teams → accept.

## Screen to Build

### Pairings Result — route: `/championships/:id/match-days/result`

This screen has TWO modes:

#### A) Generate Mode (coming from Match Day Setup)

Shown after the algorithm completes. Receives the `GenerationResult` + the setup context (attackerIds, defenderIds, championshipId, matchDayNumber, playedAt) via React state/context — NOT from the database (it hasn't been saved yet).

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

**Team table:**
- Compact table: one row per team, all visible at a glance
- Columns: team number (#), ⚔️ Attacker name, 🛡️ Defender name
- Display names (not full names)
- `♻ N` shown on the right of any repeated team — means "this attacker-defender combination last occurred N match days ago"
- Only shown on repeated teams (where `lastOccurrence` is defined in `GeneratedTeam`)
- Teams ordered by `teamNumber`

**Metrics bar:**
- Calculation time: `⏱ 12ms` (from `metrics.calculationTimeMs`)
- Freshness: `3 match days fresh` (from `metrics.freshMatchDays`)
- Repeats: `1/8 repeated` (from `metrics.repeatedCount` / `metrics.totalCount`)
- Show as a compact horizontal bar below the team table

**Regenerate button:**
- Goes back to the match day setup screen's generation flow with a NEW random seed
- The setup screen state (role assignments) should be preserved — only the seed changes
- This means: navigate back to setup, immediately trigger generation with new seed
- OR: stay on this screen, re-run the worker with new seed and update results in place (simpler UX — preferred approach)
- Show the loading UI again while regenerating

**Accept button:**
- Saves the match day to the database (transactional: match_day + all teams)
- Uses `MatchDayRepository.create(championshipId, matchDayNumber, playedAt, teams)`
- After save: navigate to championship detail screen
- Use `useOptimistic` or show a brief saving indicator

**← Back button:**
- Goes back to the match day setup screen (preserving role assignments)
- Confirmation dialog: "Discard these teams?" since the result hasn't been saved yet

#### B) Read-Only Mode (viewing a saved match day — Phase 8 will use this)

Route: `/championships/:id/match-days/:matchDayId`

For now, just ensure the component can render in read-only mode:
- Same team table layout
- No Regenerate or Accept buttons
- No metrics bar (the metrics aren't stored in the database)
- Header shows match day number and date
- This will be wired up fully in Phase 8

## Data Flow

**Generate mode data comes from Phase 6 (Match Day Setup):**

The setup screen needs to pass to this screen:
- `GenerationResult` (teams + metrics) from the Web Worker
- `championshipId`
- `matchDayNumber` (next sequential number — calculate from last match day + 1)
- `playedAt` (today's date as ISO string)
- The current role assignments (attackerIds, defenderIds) for regeneration
- A map of player IDs → display names (to show names in the table)

Use React Router state, a shared context, or a simple store to pass this data. If the user navigates directly to the result URL (e.g., page refresh), redirect back to the championship detail since the generation data is lost.

**Assembling teams for database save:**

Map `GenerationResult.teams` to the format `MatchDayRepository.create()` expects:
```typescript
teams: result.teams.map(t => ({
  attackerId: t.attackerId,
  defenderId: t.defenderId,
  teamNumber: t.teamNumber
}))
```

## Regenerate Implementation

Preferred approach — regenerate in place on this screen:

1. User taps "Regenerate"
2. Show loading overlay (same as Phase 6 generating UI)
3. Create new Web Worker with same `GenerationInput` but new random seed
4. On completion, update the result on screen
5. Loading disappears, new teams displayed

This avoids navigating back and forth. The setup state (role assignments) is preserved in the context/store.

## i18n — add translation keys

- "matchDay.result.title" (Match Day N)
- "matchDay.result.team", "matchDay.result.attacker", "matchDay.result.defender"
- "matchDay.result.repeated" (♻ N)
- "matchDay.result.calculationTime", "matchDay.result.freshDays", "matchDay.result.repeatedCount"
- "matchDay.result.regenerate", "matchDay.result.accept"
- "matchDay.result.saving", "matchDay.result.saved"
- "matchDay.result.discardConfirmTitle", "matchDay.result.discardConfirmMessage"
- "matchDay.result.discard", "matchDay.result.keepViewing"

## Verification

1. After generating teams in Phase 6, navigates to this screen with results displayed
2. Team table shows all teams with correct attacker/defender display names
3. Repeated teams show ♻ N indicator with correct match day count
4. Metrics bar shows calculation time, freshness, and repeat count
5. Regenerate runs the algorithm again with a new seed
6. Regenerate produces different teams (unless there's only one possible arrangement)
7. Loading UI shows during regeneration
8. Accept saves to database and navigates to championship detail
9. New match day appears in championship detail's "Recent Match Days"
10. ← Back shows discard confirmation, then returns to setup with preserved role assignments
11. Direct URL access to result page (without generation data) redirects gracefully
12. All text translated (switch to Italian and verify)
13. All 3 themes render correctly
14. Existing tests still pass
