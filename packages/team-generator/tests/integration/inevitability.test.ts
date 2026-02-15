import { describe, it, expect } from 'vitest';
import { generateTeams } from '../../src/generateTeams.js';
import { unorderedPairKey } from '../../src/generateTeams.js';
import { assertValidResult } from '../helpers/assertions.js';
import { buildMatchDay, buildRotationHistory } from '../helpers/builders.js';

describe('Inevitability (forced repeats)', () => {
  const seed = 42;

  it('4v4 with all pairs covered — maxDepth is 3', () => {
    const attackerIds = ['A1', 'A2', 'A3', 'A4'];
    const defenderIds = ['D1', 'D2', 'D3', 'D4'];

    // 4 rounds covering all 16 possible pairs
    const history = buildRotationHistory(attackerIds, defenderIds, 4);

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    expect(result.metrics.freshMatchDays).toBe(3);
  });

  it('2v2 with 2 rounds must repeat', () => {
    const attackerIds = ['A1', 'A2'];
    const defenderIds = ['D1', 'D2'];

    // Both possible matchings in history (oldest→newest)
    const history = [
      buildMatchDay(1, ['A1', 'D2'], ['A2', 'D1']),
      buildMatchDay(2, ['A1', 'D1'], ['A2', 'D2']),
    ];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);

    // Can avoid most recent round by using the other matching
    expect(result.metrics.freshMatchDays).toBe(1);

    // But result must repeat from history (all pairs covered)
    expect(result.metrics.repeatedCount).toBe(2);
  });

  it('3v3 full rotation — maxDepth is 2', () => {
    const attackerIds = ['A1', 'A2', 'A3'];
    const defenderIds = ['D1', 'D2', 'D3'];

    // 3 rounds cover all 9 pairs
    const history = buildRotationHistory(attackerIds, defenderIds, 3);

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    expect(result.metrics.freshMatchDays).toBe(2);
  });

  it('when only one matching remains — finds it', () => {
    const attackerIds = ['A1', 'A2', 'A3'];
    const defenderIds = ['D1', 'D2', 'D3'];

    // History covers offsets 0 and 1, leaving only offset 2
    // Oldest→newest order
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

    // The only valid matching is offset 2: (A1,D3), (A2,D1), (A3,D2)
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

  it('sparse history allows high depth', () => {
    const attackerIds = ['A1', 'A2', 'A3', 'A4'];
    const defenderIds = ['D1', 'D2', 'D3', 'D4'];

    // Sparse history: only 2 pairs per round (oldest→newest)
    const history = [
      buildMatchDay(1, ['A3', 'D3'], ['A4', 'D4']),
      buildMatchDay(2, ['A1', 'D1'], ['A2', 'D2']),
    ];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    expect(result.metrics.freshMatchDays).toBe(2);

    // Verify no repeated pairs from history
    const teamPairKeys = new Set(
      result.teams.map((t) => unorderedPairKey(t.attackerId, t.defenderId)),
    );
    const historyKeys = new Set(
      history.flatMap((h) =>
        h.teams.map((t) => unorderedPairKey(t.attackerId, t.defenderId)),
      ),
    );

    for (const key of teamPairKeys) {
      expect(historyKeys.has(key)).toBe(false);
    }
  });
});
