Read docs/DESIGN.md, focusing on "4. Match Day Setup" (both desktop and mobile layouts), "Interaction Model", "Execution Model — Web Worker with Progressive Results", "Algorithm Interface", "Workflow 2: New Match Day", "Workflow 3: Mid-Match-Day Changes", and "Phase 6: Match Day Setup + Generation".

This is the most important screen in the app — it's used weekly with people waiting around the table. Speed and usability are critical.

## Screen to Build

### Match Day Setup — route: `/championships/:id/match-days/new`

Accessed from the "+ New Match Day" button on the championship detail screen.

#### Initial State

On load, show all roster players starting as "Sitting Out". Their preference hints are shown faded in parentheses (e.g., `Matteo (⚔️)`) to suggest their preferred role without assigning it.

#### Desktop / Tablet Landscape (≥768px) — Three-Column Layout

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

- Left column: DEFENDERS — read-only live summary of assigned defenders
- Center: ALL PLAYERS — the interactive list where all assignment happens
- Right column: ATTACKERS — read-only live summary of assigned attackers
- Side columns match physical table position (defenders on left, attackers on right)
- Clicking a player in a side column focuses that player in the center list

#### Mobile / Tablet Portrait (<768px) — Single List + Sticky Bottom Bar

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

- Summary bar items act as toggle filters: tap "🛡️ 4 def" to show only defenders, tap again to show all
- Sticky bottom bar always visible

#### Breakpoint: < 768px = mobile layout, ≥ 768px = three-column layout

Same React components, different arrangement via CSS/Tailwind breakpoints.

## Interaction Model

**Role states and transitions:**

```
 🛡️ Defender  ←→  Sitting Out  ←→  ⚔️ Attacker
```

**Desktop keyboard shortcuts:**

| Key | Action |
|-----|--------|
| ↑ ↓ | Navigate the center player list |
| ← | Move toward defender (defender→nothing, sitting out→defender, attacker→sitting out) |
| → | Move toward attacker (attacker→nothing, sitting out→attacker, defender→sitting out) |
| Delete / Backspace | Reset to sitting out |

The focused player should have a clear visual highlight. Keyboard navigation should feel instant.

**Mobile gestures:**

| Gesture | Action |
|---------|--------|
| Swipe left | Move toward defender |
| Swipe right | Move toward attacker |

During swipe, show colored background as feedback (defender color on left swipe, attacker color on right swipe). Use a simple swipe detection — a touch library is fine if needed, or implement basic touch handlers (touchstart/touchmove/touchend with a threshold).

**Click/tap on player name:** Cycles through: sitting out → attacker → defender → sitting out (for quick mouse/touch assignment without keyboard or swipe).

## Buttons

**Auto-assign:** Assigns all currently "sitting out" players to their preferred role (from championship roster preference, falling back to global preference). Players already assigned to a role are not moved. Players with no preference stay sitting out.

**+ Add player:** Same flow as roster "add player" — search existing registry players not in roster, or create new. Adding here adds to both roster and the current match day as "sitting out". This handles the "new arrival" workflow (someone shows up unexpectedly).

**Generate teams:** 
- Disabled until attackers count equals defenders count AND count > 0
- When disabled, show a message: "Need equal attackers & defenders" or "⚠ Unbalanced: 5 attackers, 4 defenders"
- When enabled and tapped, triggers the algorithm via Web Worker

## Web Worker Integration

The algorithm from `packages/team-generator` runs in a Web Worker.

**Setup:**
- Create a worker file that imports `generateTeams` from `@foosball-fever/team-generator`
- Worker receives `GenerationInput` via postMessage
- Worker posts back `{ type: 'progress', result }` as it finds better results
- Worker posts `{ type: 'done', result }` when finished

**Main thread:**
- On "Generate teams" tap: gather `GenerationInput` (attackerIds, defenderIds, history from repository, random seed)
- Post input to worker
- Show loading UI with progressive quality indicator

**Loading UI:**

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

- Show as a modal/overlay on top of the setup screen
- "Current best: N match days fresh" updates live from worker progress messages
- Progress bar is approximate (based on freshMatchDays relative to total history)
- "Stop — use current result" terminates worker and uses best result so far
- Safety timeout: 5 seconds auto-stops and uses best result
- Normal case (10-30 players): finishes in milliseconds, loading is barely visible — but the UI should handle it gracefully

**On completion (or stop):**
- Navigate to the Pairings Result screen (Phase 7) with the `GenerationResult`
- Pass the result via React state/context (not URL) since it's a complex object
- The result is NOT saved to the database yet — that happens on "Accept" in Phase 7

**Regenerate:** When coming back from the result screen to regenerate, use a new random seed (different from the previous one) to get different teams.

## Building the GenerationInput

To call the algorithm, you need to assemble `GenerationInput`:

```typescript
{
  attackerIds: string[]      // IDs of players assigned as attacker on this screen
  defenderIds: string[]      // IDs of players assigned as defender on this screen
  history: MatchDayHistory[] // all past match days for this championship, oldest→newest
  seed: number               // random number for first generation
}
```

- `attackerIds` and `defenderIds` come from the current screen state
- `history` comes from the MatchDay repository: `getHistory(championshipId)`
- `seed` is `Math.floor(Math.random() * 2147483647)` for first generation, new random for regeneration

## i18n — add translation keys

- "matchDay.setup.title", "matchDay.setup.allPlayers"
- "matchDay.setup.defenders", "matchDay.setup.attackers", "matchDay.setup.sittingOut"
- "matchDay.setup.autoAssign", "matchDay.setup.addPlayer"
- "matchDay.setup.generateTeams", "matchDay.setup.unbalanced"
- "matchDay.setup.needEqual"
- "matchDay.generating.title", "matchDay.generating.currentBest", "matchDay.generating.freshDays"
- "matchDay.generating.stop"

## Verification

1. Navigating from championship detail "New Match Day" opens the setup screen
2. All roster players appear, initially as "sitting out" with preference hints faded
3. **Desktop keyboard:** ↑↓ navigates list, ←→ assigns roles, Delete resets — feels instant
4. **Mobile swipe:** swipe left = defender, swipe right = attacker, colored feedback during swipe
5. **Click/tap:** cycles through sitting out → attacker → defender → sitting out
6. Side columns (desktop) update live as roles are assigned
7. Summary bar (mobile) updates live with counts
8. Auto-assign respects preferences (championship → global fallback)
9. Add player works (existing from registry + create new)
10. Generate button disabled when unbalanced, shows message
11. Generate button enabled when equal attackers/defenders
12. Tapping Generate runs the algorithm in a Web Worker
13. Loading UI shows with progressive "match days fresh" indicator
14. Normal case: result appears nearly instantly
15. Safety timeout: auto-stops after 5 seconds
16. Stop button works and uses best result so far
17. Result is passed to the next screen (navigates to result route — can be placeholder for now)
18. Both layouts work: three-column on desktop, single list on mobile
19. All text translated (switch to Italian and verify)
20. All 3 themes render correctly
21. Existing tests still pass
