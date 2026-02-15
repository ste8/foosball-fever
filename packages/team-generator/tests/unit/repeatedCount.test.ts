import { describe, it, expect } from 'vitest';
import { generateTeams } from '../../src/generateTeams.js';
import { buildMatchDay } from '../helpers/builders.js';

describe('metrics.repeatedCount', () => {
  const seed = 42;

  it('is 0 when history is empty', () => {
    const result = generateTeams({
      attackerIds: ['A1', 'A2'],
      defenderIds: ['D1', 'D2'],
      history: [],
      seed,
    });

    expect(result.metrics.repeatedCount).toBe(0);
  });

  it('is 0 when no pairs repeat', () => {
    // History has (A1,D1) and (A2,D2)
    const history = [
      buildMatchDay(1, ['A1', 'D1'], ['A2', 'D2']),
    ];

    const result = generateTeams({
      attackerIds: ['A1', 'A2'],
      defenderIds: ['D1', 'D2'],
      history,
      seed,
    });

    // Algorithm should find (A1,D2) and (A2,D1) which don't repeat
    expect(result.metrics.repeatedCount).toBe(0);
    expect(result.metrics.freshMatchDays).toBe(1);
  });

  it('counts all history rounds', () => {
    // 2x2 with all 4 possible pairings in history
    const history = [
      buildMatchDay(1, ['A1', 'D1'], ['A2', 'D2']),
      buildMatchDay(2, ['A1', 'D2'], ['A2', 'D1']),
    ];

    const result = generateTeams({
      attackerIds: ['A1', 'A2'],
      defenderIds: ['D1', 'D2'],
      history,
      seed,
    });

    // Any matching will have 2 repeated pairs
    expect(result.metrics.repeatedCount).toBe(2);
  });

  it('counts correctly with partial overlap', () => {
    // 3x3 where only some pairs are in history
    const history = [
      buildMatchDay(1, ['A1', 'D1'], ['A2', 'D2'], ['A3', 'D3']),
    ];

    const result = generateTeams({
      attackerIds: ['A1', 'A2', 'A3'],
      defenderIds: ['D1', 'D2', 'D3'],
      history,
      seed,
    });

    // Algorithm can avoid all 3 historical pairs
    expect(result.metrics.freshMatchDays).toBe(1);
    expect(result.metrics.repeatedCount).toBe(0);
  });

  it('is role-agnostic (unordered comparison)', () => {
    // History has the pair but with roles conceptually swapped
    // {D1, A1} should match {A1, D1} after normalization
    const history = [
      buildMatchDay(1, ['D1', 'A1'], ['D2', 'A2']),
    ];

    const result = generateTeams({
      attackerIds: ['A1', 'A2'],
      defenderIds: ['D1', 'D2'],
      history,
      seed,
    });

    // Should recognize these as the same pairs regardless of order
    expect(result.metrics.freshMatchDays).toBe(1);
    expect(result.metrics.repeatedCount).toBe(0);
  });

  it('ignores pairs with players not in current round', () => {
    const history = [
      buildMatchDay(
        1,
        ['A1', 'D1'],
        ['OldPlayer1', 'OldPlayer2'],
        ['A2', 'NotPresent'],
      ),
    ];

    const result = generateTeams({
      attackerIds: ['A1', 'A2'],
      defenderIds: ['D1', 'D2'],
      history,
      seed,
    });

    expect(result.teams).toHaveLength(2);
  });
});
