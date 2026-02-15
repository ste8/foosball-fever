import { describe, it, expect } from 'vitest';
import { generateTeams } from '../../src/generateTeams.js';
import { unorderedPairKey } from '../../src/generateTeams.js';
import { assertValidResult } from '../helpers/assertions.js';
import { buildRotationHistory } from '../helpers/builders.js';

describe('Twenty player (10v10)', () => {
  const seed = 42;

  it('10v10 achieves depth >= 8', () => {
    const attackerIds = Array.from({ length: 10 }, (_, i) => `A${i + 1}`);
    const defenderIds = Array.from({ length: 10 }, (_, i) => `D${i + 1}`);
    const history = buildRotationHistory(attackerIds, defenderIds, 8);

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    expect(result.metrics.freshMatchDays).toBeGreaterThanOrEqual(8);
  });

  it('10v10 each player appears once', () => {
    const attackerIds = Array.from({ length: 10 }, (_, i) => `A${i + 1}`);
    const defenderIds = Array.from({ length: 10 }, (_, i) => `D${i + 1}`);
    const history = buildRotationHistory(attackerIds, defenderIds, 8);

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    expect(result.teams).toHaveLength(10);
  });

  it('10v10 no repeats from recent 8 rounds', () => {
    const attackerIds = Array.from({ length: 10 }, (_, i) => `A${i + 1}`);
    const defenderIds = Array.from({ length: 10 }, (_, i) => `D${i + 1}`);
    const history = buildRotationHistory(attackerIds, defenderIds, 8);

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);

    // Verify no pair from any of the 8 history rounds appears in result
    const teamPairKeys = new Set(
      result.teams.map((t) => unorderedPairKey(t.attackerId, t.defenderId)),
    );
    for (let r = 0; r < 8; r++) {
      const roundKeys = new Set(
        history[r].teams.map((t) =>
          unorderedPairKey(t.attackerId, t.defenderId),
        ),
      );
      for (const key of teamPairKeys) {
        expect(roundKeys.has(key)).toBe(false);
      }
    }
  });

  it('10v10 maxDepth is 8 when only 8 rounds in history', () => {
    const attackerIds = Array.from({ length: 10 }, (_, i) => `A${i + 1}`);
    const defenderIds = Array.from({ length: 10 }, (_, i) => `D${i + 1}`);
    const history = buildRotationHistory(attackerIds, defenderIds, 8);

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    expect(result.metrics.freshMatchDays).toBe(8);
  });

  it('10v10 with 10 rounds — maxDepth is 9', () => {
    const attackerIds = Array.from({ length: 10 }, (_, i) => `A${i + 1}`);
    const defenderIds = Array.from({ length: 10 }, (_, i) => `D${i + 1}`);
    const history = buildRotationHistory(attackerIds, defenderIds, 10);

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    expect(result.metrics.freshMatchDays).toBe(9);
  });

  it('20v20 completes within reasonable time', () => {
    const attackerIds = Array.from(
      { length: 20 },
      (_, i) => `Attacker${String(i + 1).padStart(2, '0')}`,
    );
    const defenderIds = Array.from(
      { length: 20 },
      (_, i) => `Defender${String(i + 1).padStart(2, '0')}`,
    );
    const history = buildRotationHistory(attackerIds, defenderIds, 15);

    const start = performance.now();
    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });
    const elapsed = performance.now() - start;

    assertValidResult(result, attackerIds, defenderIds, history);
    expect(result.teams).toHaveLength(20);
    expect(elapsed).toBeLessThan(30_000);
  });
});
