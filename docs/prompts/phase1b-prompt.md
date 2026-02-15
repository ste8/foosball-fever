Read docs/DESIGN.md, focusing on "Phase 1b: CLI App (Ink)" and the "Project Structure" section.

Port the C# CLI application from DotNetAlgos/ to TypeScript using Ink (React for the terminal) and the @inkjs/ui component library. The CLI lives under packages/team-generator/cli/ and uses the algorithm library from Phase 1a (packages/team-generator/src/).

The target structure:
```
packages/
  team-generator/
    src/                  ← algorithm (already implemented in Phase 1a)
    tests/                ← algorithm tests (already implemented in Phase 1a)
    cli/
      src/
        index.tsx         ← entry point
        app.tsx           ← root component, screen router
        types.ts          ← TournamentData, HistoricalRound (CLI-specific, NOT shared with the Tauri app)
        persistence.ts    ← JSON file read/write
        screens/
        components/
      package.json
      tsconfig.json
```

Requirements:
- Same menu-driven interactive flow as the C# CLI: manage players, create match days, assign roles (attacker/defender), generate teams, view history, undo last match day
- Use Ink components (Box, Text) for layout and @inkjs/ui components (Select, TextInput, ConfirmInput, MultiSelect, etc.) for user interactions
- Display generated teams in a formatted table with borders, showing the ⚔️/🛡️ role icons
- Show generation metrics (freshness, repeated count, calculation time)
- Support regeneration with different seeds and accepting results
- Persist data to a local JSON file (same approach as the C# CLI — this is a testing tool, not the final app)
- Import and use the algorithm types (GenerationInput, GenerationResult, etc.) from packages/team-generator/src/types.ts
- CLI-specific types (TournamentData, HistoricalRound, TeamRecord) stay in cli/src/types.ts — they are intentionally simpler than the app's domain model

Reference the C# CLI in DotNetAlgos/ for the exact menu structure and user flow, but adapt to Ink's React component model rather than doing a literal line-by-line port.
