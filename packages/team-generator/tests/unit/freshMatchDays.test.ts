import { describe, it, expect } from 'vitest';
import { generateTeams } from '../../src/generateTeams.js';
import { buildMatchDay } from '../helpers/builders.js';

describe('metrics.freshMatchDays', () => {
  const seed = 42;

  it('is 0 when history is empty', () => {
    const result = generateTeams({
      attackerIds: ['A1', 'A2'],
      defenderIds: ['D1', 'D2'],
      history: [],
      seed,
    });

    expect(result.metrics.freshMatchDays).toBe(0);
  });

  it('is 1 when can avoid most recent match day', () => {
    // History (oldest→newest): last match had (A1,D1) and (A2,D2)
    const history = [
      buildMatchDay(1, ['A1', 'D1'], ['A2', 'D2']),
    ];

    const result = generateTeams({
      attackerIds: ['A1', 'A2'],
      defenderIds: ['D1', 'D2'],
      history,
      seed,
    });

    // Can achieve depth 1 with (A1,D2) and (A2,D1)
    expect(result.metrics.freshMatchDays).toBe(1);
  });

  it('handles multiple rounds correctly', () => {
    // 3x3 with 2 rounds of history (oldest→newest)
    // Match day 1: offset 1 — (A1,D2), (A2,D3), (A3,D1)
    // Match day 2: offset 0 — (A1,D1), (A2,D2), (A3,D3)
    const history = [
      buildMatchDay(1, ['A1', 'D2'], ['A2', 'D3'], ['A3', 'D1']),
      buildMatchDay(2, ['A1', 'D1'], ['A2', 'D2'], ['A3', 'D3']),
    ];

    const result = generateTeams({
      attackerIds: ['A1', 'A2', 'A3'],
      defenderIds: ['D1', 'D2', 'D3'],
      history,
      seed,
    });

    // Remaining pairs not in history: (A1,D3), (A2,D1), (A3,D2)
    // These form a valid matching, so depth 2 is achievable
    expect(result.metrics.freshMatchDays).toBe(2);
  });

  it('is 0 with empty history', () => {
    const result = generateTeams({
      attackerIds: ['A1', 'A2'],
      defenderIds: ['D1', 'D2'],
      history: [],
      seed,
    });

    expect(result.metrics.freshMatchDays).toBe(0);
  });

  it('correct with three rounds', () => {
    // 3x3 with 3 rounds (oldest→newest)
    // Match day 1: offset 2 — (A1,D3), (A2,D1), (A3,D2)
    // Match day 2: offset 1 — (A1,D2), (A2,D3), (A3,D1)
    // Match day 3: offset 0 — (A1,D1), (A2,D2), (A3,D3)
    const history = [
      buildMatchDay(1, ['A1', 'D3'], ['A2', 'D1'], ['A3', 'D2']),
      buildMatchDay(2, ['A1', 'D2'], ['A2', 'D3'], ['A3', 'D1']),
      buildMatchDay(3, ['A1', 'D1'], ['A2', 'D2'], ['A3', 'D3']),
    ];

    const result = generateTeams({
      attackerIds: ['A1', 'A2', 'A3'],
      defenderIds: ['D1', 'D2', 'D3'],
      history,
      seed,
    });

    // All 9 possible pairs covered by 3 rounds
    // Can avoid 2 most recent rounds by using round 1 (offset 2)
    expect(result.metrics.freshMatchDays).toBe(2);
  });

  it('equals freshMatchDays when completed', () => {
    const history = [
      buildMatchDay(1, ['A1', 'D1'], ['A2', 'D2'], ['A3', 'D3']),
    ];

    const result = generateTeams({
      attackerIds: ['A1', 'A2', 'A3'],
      defenderIds: ['D1', 'D2', 'D3'],
      history,
      seed,
    });

    // freshMatchDays should be the maximum achievable
    expect(result.metrics.freshMatchDays).toBeGreaterThan(0);
  });
});
