Read docs/DESIGN.md, focusing on "7. Global Player Registry", "3. Roster Management", "Workflow 1: First Launch", "Workflow 4: New Championship with Returning Players", "Workflow 6: Managing Global Player Registry", and "Phase 5: Player Registry + Roster Management".

Build two screens that produce the data needed for match day generation.

## Screens to Build

### 1. Global Player Registry — route: `/players`

Accessed from the "Players registry" link at the bottom of the championship list (home screen).

**Layout:**
- Header: ← Back, "Players Registry" title, 👤 global icon
- Player count + role legend: "16 players ⚔️ attacker 🛡️ defender"
- Player list, alphabetically sorted by display name, each entry showing:
  - Role icon (⚔️ or 🛡️) before the name, or indented blank if no preference
  - Full name (first + last) — this is the administrative view
  - Below the name: which championships the player belongs to (e.g., "in: Monday 2025/26, Monday 24/25")
- "+ New player" button at the bottom

**Tap a player → edit dialog/panel:**
- First name, last name, display name fields
- Global preferred role selector: Attacker / Defender / No preference
- Save / Cancel
- Delete player (destructive, with confirmation — only if not in any active championship roster)

**Create new player dialog:**
- First name, last name fields
- Display name auto-generated as first name (editable)
- Optional: global preferred role
- Save creates the player in the global registry

**Empty state:** friendly message encouraging to create the first player or add players via a championship roster.

### 2. Roster Management — route: `/championships/:id/roster`

Accessed from "Manage roster" on the championship detail screen.

**Layout:**
- Header: ← Back, "Roster" title + championship name subtitle, 👤 global icon
- Player count + role legend: "14 players ⚔️ attacker 🛡️ defender"
- Player list, alphabetically sorted by display name:
  - Role icon (⚔️ or 🛡️) before the name — this is the **championship-level** preference (overrides global)
  - Display name only (not full name — this is the player-facing view)
  - Players without a championship-level preference show no icon (indented to keep alignment)
- "+ Add player" button at the bottom

**Tap a player → inline edit or dialog:**
- Championship role preference: Attacker / Defender / No preference (this overrides the global preference for this championship only)
- Remove from roster (with confirmation)
- Note: this does NOT delete the player from the global registry

**Add player flow (dialog/sheet):**
- "FROM REGISTRY" section: searchable list of players NOT already in this championship's roster
- Search field filters by name
- Tapping a player adds them to the roster immediately
- Separator, then "+ Create new player" option at the bottom
- Creating a new player here adds them to BOTH the global registry AND this championship's roster

**Preference display logic:**
- The role icon shown in the roster is the championship-level preference (`roster_entries.preferred_role`)
- If the roster entry has no preference set, fall back to the player's global preference for display (but visually distinguish it — e.g., show it faded/parenthesized to indicate it's inherited, not explicitly set)

## Implementation Details

**Repository methods needed:**
- Verify these exist (they should from Phase 3): PlayerRepository.getAll(), create(), update(), delete()
- Verify RosterRepository: getByChampionshipId() should return roster entries with player data joined (display name, names, global preference)
- May need: PlayerRepository.getWithChampionships() — returns players with their championship memberships for the registry view
- May need: PlayerRepository.getNotInChampionship(championshipId) — for the "add player" dialog (players not already in roster)
- Add any missing repository interface methods + their SQL implementations

**i18n — add translation keys to both en.json and it.json:**
- "players.title", "players.count", "players.newPlayer", "players.editPlayer", "players.deletePlayer"
- "players.deleteConfirmTitle", "players.deleteConfirmMessage", "players.cannotDelete" (in active rosters)
- "players.firstName", "players.lastName", "players.displayName", "players.preferredRole"
- "players.inChampionships" (for "in: ..." line)
- "players.emptyState"
- "roster.title", "roster.playerCount", "roster.addPlayer", "roster.removePlayer"
- "roster.removeConfirmTitle", "roster.removeConfirmMessage"
- "roster.fromRegistry", "roster.createNewPlayer", "roster.searchPlaceholder"
- "roster.inheritedPreference" (tooltip or label for faded inherited preference)
- "roles.attacker", "roles.defender", "roles.noPreference"

**Theming:**
- All new components use theme CSS variables
- Test all 3 themes on both screens

**Navigation:**
- Home → "Players registry" link → Player Registry → ← Back → Home
- Championship Detail → "Manage roster" → Roster Management → ← Back → Championship Detail
- Roster "Add player" → "Create new player" → creates player in registry + adds to roster → back to roster

## Verification

1. Can create a new player from the global registry
2. Player appears in registry list with correct info
3. Can edit a player's name and global preference
4. Can delete a player (only if not in any active roster)
5. Registry shows which championships each player belongs to
6. Can navigate to roster from championship detail
7. Roster shows players with championship-level preferences
8. Can add an existing player from registry to roster
9. Search/filter works in the "add player" dialog
10. Can create a new player inline from roster (adds to both registry and roster)
11. Can change a player's championship preference (separate from global)
12. Can remove a player from roster (doesn't delete from registry)
13. Inherited preference (global → championship) displays distinctly (faded/parenthesized)
14. All text translated (switch to Italian and verify)
15. All 3 themes render correctly
16. Existing tests still pass (no regressions)
