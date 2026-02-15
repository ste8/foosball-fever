Read docs/DESIGN.md, focusing on "Phase 1a: Algorithm + Tests", the "Algorithm Interface" section, and the "Project Structure" section.

Port the C# algorithm and tests from DotNetAlgos/ to TypeScript under packages/team-generator/.

The target structure:
```
packages/
  team-generator/
    src/
      generateTeams.ts
      types.ts            ← GenerationInput, GenerationResult, GeneratedTeam, etc.
    tests/                ← 117 Vitest tests
    package.json
    tsconfig.json
```

Steps:
1. Set up the packages/team-generator/ TypeScript project with Vitest
2. Define the algorithm interface types exactly as specified in the design doc: GenerationInput, MatchDayHistory, GenerationResult, GeneratedTeam, GenerationMetrics
3. Port the 117 C# tests to Vitest first — these are the specification
4. Implement the generateTeams function until all tests pass

Key rules from the design doc:
- The function is pure and synchronous (no side effects, no database access)
- Deterministic: same input + same seed = same output
- History is ordered oldest → newest
- Maximizes freshness: avoids repeating attacker-defender combinations from recent match days
- When repetition is unavoidable, repeats the oldest combinations first
- All past match days are considered (no lookback window)

Preconditions the function must enforce:
- attackerIds.length === defenderIds.length
- attackerIds.length > 0
- No duplicate IDs within or across the two lists

Reference the C# implementation in DotNetAlgos/ for the algorithm logic, but adapt to idiomatic TypeScript rather than doing a literal line-by-line port.
