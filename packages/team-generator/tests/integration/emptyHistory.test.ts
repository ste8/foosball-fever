import { describe, it, expect } from 'vitest';
import { generateTeams } from '../../src/generateTeams.js';
import { assertValidResult } from '../helpers/assertions.js';

describe('Empty history', () => {
  const seed = 42;

  it('returns valid matching with empty history', () => {
    const attackerIds = ['A1', 'A2', 'A3'];
    const defenderIds = ['D1', 'D2', 'D3'];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history: [],
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, []);
    expect(result.teams).toHaveLength(3);
  });

  it('freshMatchDays is 0 with empty history', () => {
    const attackerIds = ['A1', 'A2'];
    const defenderIds = ['D1', 'D2'];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history: [],
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, []);
    expect(result.metrics.freshMatchDays).toBe(0);
  });

  it('repeatedCount is 0 with empty history', () => {
    const attackerIds = ['A1', 'A2', 'A3', 'A4'];
    const defenderIds = ['D1', 'D2', 'D3', 'D4'];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history: [],
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, []);
    expect(result.metrics.repeatedCount).toBe(0);
  });

  it('each player appears exactly once', () => {
    const attackerIds = ['A1', 'A2', 'A3'];
    const defenderIds = ['D1', 'D2', 'D3'];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history: [],
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, []);
  });

  it.each([1, 2, 5, 10])('works for size %i', (size) => {
    const attackerIds = Array.from({ length: size }, (_, i) => `A${i + 1}`);
    const defenderIds = Array.from({ length: size }, (_, i) => `D${i + 1}`);

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history: [],
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, []);
    expect(result.teams).toHaveLength(size);
  });

  it('assigns sequential teamNumber starting from 1', () => {
    const result = generateTeams({
      attackerIds: ['A1', 'A2', 'A3'],
      defenderIds: ['D1', 'D2', 'D3'],
      history: [],
      seed,
    });

    const numbers = result.teams.map((t) => t.teamNumber);
    expect(numbers).toEqual([1, 2, 3]);
  });

  it('reports totalCount matching teams length', () => {
    const result = generateTeams({
      attackerIds: ['A1', 'A2'],
      defenderIds: ['D1', 'D2'],
      history: [],
      seed,
    });

    expect(result.metrics.totalCount).toBe(result.teams.length);
  });

  it('reports calculationTimeMs >= 0', () => {
    const result = generateTeams({
      attackerIds: ['A1', 'A2'],
      defenderIds: ['D1', 'D2'],
      history: [],
      seed,
    });

    expect(result.metrics.calculationTimeMs).toBeGreaterThanOrEqual(0);
  });
});
