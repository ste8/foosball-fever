Read docs/DESIGN.md, focusing on "2. Championship Detail" (the RECENT MATCH DAYS section), "6. Match Day History", "5. Pairings Result Screen" (read-only mode), "Match Day Deletion", and "Phase 8: History and Polish".

This is the final phase. After this, the app is feature-complete. These screens mostly read and display data — simpler than what came before.

## Screens to Build / Complete

### 1. Championship Detail — wire up the "Recent Match Days" section

The championship detail screen was built in Phase 4 but the recent match days section was placeholder. Now wire it up:

- Show the 3 most recent match days, each displaying: match day number, date, team count
- Tapping a match day navigates to `/championships/:id/match-days/:matchDayId` (read-only view)
- "View all match days" link navigates to `/championships/:id/match-days` (full history)
- If no match days exist, don't show the section at all

### 2. Match Day History — route: `/championships/:id/match-days`

Full list of all match days for a championship.

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
│  ...                                │
│                                     │
│  Match Day 1 — Sep 8                │
│    5 teams                          │
│                                     │
└─────────────────────────────────────┘
```

- Header: ← Back, "Match Day History" title, championship name subtitle, 👤 global icon
- Most recent first (ordered by matchDayNumber descending)
- Each entry: match day number, date (formatted by locale), team count
- Tapping an entry navigates to `/championships/:id/match-days/:matchDayId` (read-only view)
- Empty state if no match days yet

### 3. Read-Only Match Day View — route: `/championships/:id/match-days/:matchDayId`

Reuses the Pairings Result screen component from Phase 7, but in **read-only mode**.

- Same team table layout: #, ⚔️ Attacker, 🛡️ Defender
- No Regenerate or Accept buttons
- No metrics bar (metrics are not stored in the database)
- Header: ← Back, "Match Day N" title, date subtitle
- Data loaded from database via `MatchDayRepository.getById(matchDayId)` — returns match day with teams and player display names joined

**Delete last match day:**
- Only the most recent match day (highest matchDayNumber) shows a ⋮ menu with a red "Delete" option
- Non-last match days have no ⋮ menu at all
- Delete shows confirmation dialog: "Delete this match day? This cannot be undone."
- On confirm: hard delete via `MatchDayRepository.deleteLast(championshipId)` — deletes teams first, then match day
- After deletion: navigate back to championship detail
- Important: verify it's actually the last match day before showing the delete option (compare matchDayNumber with the max for this championship)

### 4. Navigation Wiring

Make sure all navigation paths work end-to-end:

- Championship Detail → tap recent match day → Read-Only Match Day View → ← Back → Championship Detail
- Championship Detail → "View all match days" → Match Day History → tap entry → Read-Only Match Day View → ← Back → Match Day History
- Championship Detail → "+ New Match Day" → Setup → Generate → Result → Accept → Championship Detail (this should already work from Phase 6+7, but verify the championship detail refreshes and shows the new match day)
- Read-Only Match Day View (last) → ⋮ Delete → confirm → Championship Detail (match day gone)

## Implementation Details

**Repository methods needed:**
- `MatchDayRepository.getByChampionshipId(championshipId)` — returns all match days with team counts, ordered by matchDayNumber desc
- `MatchDayRepository.getById(matchDayId)` — returns match day with full team data (attacker/defender display names joined)
- `MatchDayRepository.deleteLast(championshipId)` — hard deletes the last match day + its teams
- These should already exist from Phase 3. If the team count or player names aren't included in existing queries, update the repository implementations.

**Reuse the Pairings Result component:**
- The Phase 7 result screen should accept a `mode` prop or similar: `'generate'` (with Regenerate/Accept) vs `'readonly'` (no action buttons, data from DB)
- In generate mode: data comes from React state/context (the generation result)
- In read-only mode: data comes from a DB query using the matchDayId from the URL
- Factor out the team table as a shared component if not already done

**Date formatting:**
- Use `Intl.DateTimeFormat` with current locale throughout
- Match day dates: "Oct 27" short format in lists, "Oct 27, 2025" fuller format in detail view

## i18n — add translation keys

- "matchDay.history.title"
- "matchDay.history.teams" (e.g., "8 teams")
- "matchDay.history.empty"
- "matchDay.detail.deleteTitle", "matchDay.detail.deleteMessage", "matchDay.detail.deleteConfirm"
- "championship.recentMatchDays", "championship.viewAllMatchDays"

## Verification

1. Championship detail shows 3 most recent match days with correct data
2. "View all match days" navigates to full history
3. Match day history lists all match days, most recent first
4. Tapping a match day in history opens read-only view with correct teams
5. Read-only view shows team table without Regenerate/Accept buttons
6. Only the last match day shows ⋮ menu with Delete option
7. Delete confirmation dialog appears
8. Deleting removes the match day and navigates to championship detail
9. After deletion, the previously-second-last match day is now the last (and gets the delete option)
10. Full flow works: create match day → accept → see it in recent match days → tap → view read-only → back
11. Championship detail refreshes correctly after accepting a new match day
12. All text translated (switch to Italian and verify)
13. All 3 themes render correctly
14. Existing tests still pass
