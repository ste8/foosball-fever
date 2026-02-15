import { describe, it, expect } from 'vitest';
import { generateTeams } from '../../src/generateTeams.js';
import { assertValidResult } from '../helpers/assertions.js';
import { buildMatchDay } from '../helpers/builders.js';

describe('Mixed membership', () => {
  const seed = 42;

  it('ignores history pairs with missing players', () => {
    const attackerIds = ['A1', 'A2'];
    const defenderIds = ['D1', 'D2'];

    const history = [
      buildMatchDay(
        1,
        ['A1', 'D1'],
        ['OldAttacker', 'OldDefender'],
        ['A2', 'MissingPlayer'],
      ),
    ];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    // Only (A1, D1) from history is relevant
    expect(result.metrics.freshMatchDays).toBe(1);
  });

  it('new players not in history work correctly', () => {
    const attackerIds = ['NewA1', 'NewA2', 'A3'];
    const defenderIds = ['NewD1', 'NewD2', 'D3'];

    const history = [
      buildMatchDay(1, ['A3', 'D3'], ['OldA1', 'OldD1'], ['OldA2', 'OldD2']),
    ];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    // Only (A3, D3) is a constraint from history
    expect(result.metrics.freshMatchDays).toBe(1);
  });

  it('completely new roster ignores all history', () => {
    const attackerIds = ['NewA1', 'NewA2'];
    const defenderIds = ['NewD1', 'NewD2'];

    const history = [
      buildMatchDay(1, ['OldA1', 'OldD1'], ['OldA2', 'OldD2']),
      buildMatchDay(2, ['OldA1', 'OldD2'], ['OldA2', 'OldD1']),
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

  it('partial overlap handled correctly', () => {
    const attackerIds = ['A1', 'A2', 'NewA3'];
    const defenderIds = ['D1', 'NewD2', 'NewD3'];

    const history = [
      buildMatchDay(1, ['A1', 'D1'], ['A2', 'OldD2'], ['OldA3', 'D1']),
    ];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    // Only (A1, D1) is fully relevant
    expect(result.metrics.freshMatchDays).toBe(1);
  });

  it('history with same player in different roles handled correctly', () => {
    // In history, player "X" was an attacker paired with "OldD1"
    // Now "X" is a defender
    const attackerIds = ['A1', 'A2'];
    const defenderIds = ['X', 'D2'];

    const history = [
      buildMatchDay(1, ['X', 'OldD1'], ['A1', 'OldD2']),
    ];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    // Historical pairs don't constrain since OldD1/OldD2 not present
    expect(result.metrics.freshMatchDays).toBe(1);
  });

  it('empty history rounds are handled', () => {
    const attackerIds = ['A1', 'A2'];
    const defenderIds = ['D1', 'D2'];

    // History (oldest→newest):
    // Match day 1 (oldest): has constraints
    // Match day 2 (most recent): empty round
    const history = [
      buildMatchDay(1, ['A1', 'D1'], ['A2', 'D2']),
      { matchDayNumber: 2, teams: [] },
    ];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    // Most recent round is empty, next round has constraints we can avoid
    expect(result.metrics.freshMatchDays).toBe(2);
  });

  it('achieves correct depth with new players', () => {
    // Mix of old and new players
    const attackerIds = ['A1', 'A2', 'NewA'];
    const defenderIds = ['D1', 'D2', 'NewD'];

    const history = [
      buildMatchDay(1, ['A1', 'D1'], ['A2', 'D2'], ['OldA', 'OldD']),
    ];

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    assertValidResult(result, attackerIds, defenderIds, history);
    expect(result.metrics.freshMatchDays).toBe(1);
  });
});
