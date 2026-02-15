import { expect } from 'vitest';
import type {
  GenerationResult,
  MatchDayHistory,
} from '../../src/types.js';
import { unorderedPairKey } from '../../src/generateTeams.js';

/**
 * Asserts that all standard invariants hold for a successful generation result.
 */
export function assertValidResult(
  result: GenerationResult,
  attackerIds: string[],
  defenderIds: string[],
  history: MatchDayHistory[],
): void {
  // All attackers appear exactly once
  const usedAttackers = result.teams.map((t) => t.attackerId);
  expect(usedAttackers).toHaveLength(attackerIds.length);
  expect(new Set(usedAttackers).size).toBe(attackerIds.length);
  expect(new Set(usedAttackers)).toEqual(new Set(attackerIds));

  // All defenders appear exactly once
  const usedDefenders = result.teams.map((t) => t.defenderId);
  expect(usedDefenders).toHaveLength(defenderIds.length);
  expect(new Set(usedDefenders).size).toBe(defenderIds.length);
  expect(new Set(usedDefenders)).toEqual(new Set(defenderIds));

  // All teams are distinct (no duplicate pairs)
  const pairKeys = result.teams.map((t) =>
    unorderedPairKey(t.attackerId, t.defenderId),
  );
  expect(new Set(pairKeys).size).toBe(pairKeys.length);

  // No pairs from recent rounds up to freshMatchDays depth
  assertNoPairsFromRecentRounds(result, history);

  // Repeated count consistent with depth
  assertRepeatedCountConsistentWithDepth(result, history);

  // Metrics invariants
  expect(result.metrics.repeatedCount).toBeGreaterThanOrEqual(0);
  expect(result.metrics.repeatedCount).toBeLessThanOrEqual(
    result.teams.length,
  );
  expect(result.metrics.totalCount).toBe(result.teams.length);
  expect(result.metrics.calculationTimeMs).toBeGreaterThanOrEqual(0);
}

/**
 * Asserts that no pairs from the N most recent history entries appear in the result,
 * where N = freshMatchDays.
 */
function assertNoPairsFromRecentRounds(
  result: GenerationResult,
  history: MatchDayHistory[],
): void {
  if (result.metrics.freshMatchDays === 0) return;

  const teamPairKeys = new Set(
    result.teams.map((t) => unorderedPairKey(t.attackerId, t.defenderId)),
  );

  // History is oldest→newest, so most recent rounds are at the end
  for (
    let i = 0;
    i < result.metrics.freshMatchDays && i < history.length;
    i++
  ) {
    const roundIndex = history.length - 1 - i;
    const roundPairKeys = new Set(
      history[roundIndex].teams.map((t) =>
        unorderedPairKey(t.attackerId, t.defenderId),
      ),
    );

    for (const key of teamPairKeys) {
      expect(roundPairKeys.has(key)).toBe(false);
    }
  }
}

/**
 * If freshMatchDays equals history length, repeatedCount should be 0.
 */
function assertRepeatedCountConsistentWithDepth(
  result: GenerationResult,
  history: MatchDayHistory[],
): void {
  if (result.metrics.freshMatchDays === history.length) {
    expect(result.metrics.repeatedCount).toBe(0);
  }
}
