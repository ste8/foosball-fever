import { describe, it, expect } from 'vitest';
import { generateTeams } from '../../src/generateTeams.js';
import { unorderedPairKey } from '../../src/generateTeams.js';
import { assertValidResult } from '../helpers/assertions.js';
import { buildMatchDay } from '../helpers/builders.js';

describe('Depth two', () => {
  const seed = 42;

  it('3v3 achieves depth 2', () => {
    const attackerIds = ['A1', 'A2', 'A3'];
    const defenderIds = ['D1', 'D2', 'D3'];

    // History (oldest→newest):
    // Match day 1: offset 1
    // Match day 2: offset 0 (most recent)
    const history = [
      buildMatchDay(1, ['A1', 'D2'], ['A2', 'D3'], ['A3', 'D1']),
      buildMatchDay(2, ['A1', 'D1'], ['A2', 'D2'], ['A3', 'D3']),
    ];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    expect(result.metrics.freshMatchDays).toBe(2);

    // Verify the matching uses offset 2 pairs: (A1,D3), (A2,D1), (A3,D2)
    const teamPairKeys = new Set(
      result.teams.map((t) => unorderedPairKey(t.attackerId, t.defenderId)),
    );
    const expectedKeys = new Set([
      unorderedPairKey('A1', 'D3'),
      unorderedPairKey('A2', 'D1'),
      unorderedPairKey('A3', 'D2'),
    ]);
    expect(teamPairKeys).toEqual(expectedKeys);
  });

  it('4v4 achieves depth 2', () => {
    const attackerIds = ['A1', 'A2', 'A3', 'A4'];
    const defenderIds = ['D1', 'D2', 'D3', 'D4'];

    // History (oldest→newest):
    // Match day 1: offset 1
    // Match day 2: offset 0 (most recent)
    const history = [
      buildMatchDay(
        1,
        ['A1', 'D2'],
        ['A2', 'D3'],
        ['A3', 'D4'],
        ['A4', 'D1'],
      ),
      buildMatchDay(
        2,
        ['A1', 'D1'],
        ['A2', 'D2'],
        ['A3', 'D3'],
        ['A4', 'D4'],
      ),
    ];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    expect(result.metrics.freshMatchDays).toBe(2);

    // Verify no pairs from either history round are used
    const teamPairKeys = new Set(
      result.teams.map((t) => unorderedPairKey(t.attackerId, t.defenderId)),
    );
    const forbiddenKeys = new Set(
      history.flatMap((h) =>
        h.teams.map((t) => unorderedPairKey(t.attackerId, t.defenderId)),
      ),
    );

    for (const key of teamPairKeys) {
      expect(forbiddenKeys.has(key)).toBe(false);
    }
  });

  it('depth two — all invariants hold', () => {
    const attackerIds = ['Alice', 'Bob', 'Charlie'];
    const defenderIds = ['Dave', 'Eve', 'Frank'];

    const history = [
      buildMatchDay(
        1,
        ['Alice', 'Eve'],
        ['Bob', 'Frank'],
        ['Charlie', 'Dave'],
      ),
      buildMatchDay(
        2,
        ['Alice', 'Dave'],
        ['Bob', 'Eve'],
        ['Charlie', 'Frank'],
      ),
    ];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
  });

  it('depth two — repeatedCount is 0', () => {
    const attackerIds = ['A1', 'A2', 'A3'];
    const defenderIds = ['D1', 'D2', 'D3'];

    // 2 rounds covering 6 of 9 pairs — remaining 3 form a valid matching
    const history = [
      buildMatchDay(1, ['A1', 'D2'], ['A2', 'D3'], ['A3', 'D1']),
      buildMatchDay(2, ['A1', 'D1'], ['A2', 'D2'], ['A3', 'D3']),
    ];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    expect(result.metrics.freshMatchDays).toBe(2);
    expect(result.metrics.repeatedCount).toBe(0);
  });
});
