Read docs/DESIGN.md, focusing on "1. Championship List (Home Screen)", "2. Championship Detail", "Championship Lifecycle", "Global Navigation Element", and "Phase 4: Championship List (First Vertical Slice)".

This is the first vertical slice: real UI → repository interfaces → SQLite → back to UI. The goal is to prove the full wiring works end-to-end.

## Screens to Build

### 1. Championship List (Home Screen) — route: `/`

This is the app's landing page.

**Layout:**
- App title ("Foosball Fever" / "Biliardino Fever" depending on language) at the top
- "YOUR CHAMPIONSHIPS" section with active championships as cards
- Each card shows: name, number of match days, number of players, last played date
- Tapping a card navigates to Championship Detail (`/championships/:id`)
- "+ New championship" button below the active list
- Separator, then collapsible "ARCHIVED (n)" section showing archived championships
- Soft-deleted championships are completely hidden
- At the bottom: "Players registry" link navigating to `/players`

**Create championship flow:**
- Simple modal/dialog with just a name field (use shadcn/ui Dialog)
- On submit: creates championship via repository, navigates to its detail page
- Name field auto-focused, submit on Enter

**Empty state:**
- When no championships exist, show a friendly empty state with the "+ New championship" button prominent

### 2. Championship Detail — route: `/championships/:id`

**Layout:**
- Header: ← Back button, championship name, ⋮ menu, 👤 global icon
- Stats line: "14 players · 12 match days"
- Big "+ New Match Day" button (primary action) — disabled for now (Phase 6), but visible
- "RECENT MATCH DAYS" section: last 3 match days, each showing match day number, date, team count
- "View all match days" link (navigates to `/championships/:id/match-days`) — placeholder for now
- "Manage roster" button (navigates to `/championships/:id/roster`) — placeholder for now

**⋮ Context menu (shadcn/ui DropdownMenu):**
- Rename — opens dialog with current name pre-filled
- Archive / Unarchive (depending on current state)
- Delete — red/destructive text, opens confirmation dialog: "Delete this championship? This action cannot be undone."

**Behaviors:**
- Archive: sets `archived_at`, navigates back to home (championship moves to archived section)
- Unarchive: clears `archived_at`, championship moves back to active section
- Delete: soft delete (sets `deleted_at`), navigates back to home (championship disappears)
- Rename: updates name, stays on same screen

## Implementation Details

**Data loading:**
- Use React hooks for data fetching from repositories
- Create a custom hook like `useChampionships()` that loads championships + their stats (match day count, player count, last played date)
- Stats require joins/counts — add any needed methods to repository interfaces if not already there (e.g., `getChampionshipsWithStats()` or compute stats from existing methods)

**All user-facing text must use i18n translation keys.** Add new keys to both `en.json` and `it.json`:
- "home.title" (app name), "home.yourChampionships", "home.newChampionship", "home.archived", "home.playersRegistry"
- "championship.matchDays", "championship.players", "championship.lastPlayed", "championship.newMatchDay"
- "championship.rename", "championship.archive", "championship.unarchive", "championship.delete"
- "championship.deleteConfirmTitle", "championship.deleteConfirmMessage"
- "championship.createTitle", "championship.namePlaceholder"
- "common.back", "common.cancel", "common.save", "common.delete"

**Theming:**
- All components should use theme CSS variables (no hardcoded colors)
- Cards, buttons, dialogs should look correct in all 3 themes (Classic, Dark, Sensible Soccer)
- Test that theme switching still works on these new screens

**Date formatting:**
- Use `Intl.DateTimeFormat` with the current locale
- "Last played: Oct 27" format for English, appropriate format for Italian

**Navigation:**
- Championship list → tap card → Championship detail
- Championship detail → ← Back → Championship list
- Championship detail → "+ New Match Day" → disabled/placeholder for now
- Championship detail → "View all match days" → placeholder screen
- Championship detail → "Manage roster" → placeholder screen

## Verification

1. App launches and shows championship list (empty state if no championships)
2. Can create a new championship via modal dialog
3. New championship appears in the active list with correct stats (0 match days, 0 players)
4. Tapping a championship card navigates to its detail page
5. ← Back returns to championship list
6. Rename works via ⋮ menu
7. Archive moves championship to the archived section
8. Unarchive restores it to active
9. Delete (soft) removes it from the list entirely
10. All text is translated (switch to Italian and verify)
11. All 3 themes render correctly on both screens
12. Empty state looks good
13. Data persists across app restarts (SQLite working end-to-end)
14. Existing tests still pass (no regressions)
