import { describe, it, expect } from 'vitest';
import { generateTeams } from '../../src/generateTeams.js';

describe('Input validation', () => {
  const seed = 42;

  it('throws when attacker count > defender count', () => {
    expect(() =>
      generateTeams({
        attackerIds: ['A1', 'A2'],
        defenderIds: ['D1'],
        history: [],
        seed,
      }),
    ).toThrow(/count/i);
  });

  it('throws when defender count > attacker count', () => {
    expect(() =>
      generateTeams({
        attackerIds: ['A1'],
        defenderIds: ['D1', 'D2'],
        history: [],
        seed,
      }),
    ).toThrow(/count/i);
  });

  it('throws when duplicate in attackers', () => {
    expect(() =>
      generateTeams({
        attackerIds: ['A1', 'A1'],
        defenderIds: ['D1', 'D2'],
        history: [],
        seed,
      }),
    ).toThrow(/Duplicate.*A1/);
  });

  it('throws when duplicate in defenders', () => {
    expect(() =>
      generateTeams({
        attackerIds: ['A1', 'A2'],
        defenderIds: ['D1', 'D1'],
        history: [],
        seed,
      }),
    ).toThrow(/Duplicate.*D1/);
  });

  it('throws when same ID appears in both lists', () => {
    expect(() =>
      generateTeams({
        attackerIds: ['Player1', 'Player2'],
        defenderIds: ['Player1', 'Player3'],
        history: [],
        seed,
      }),
    ).toThrow(/Player1.*both/);
  });

  it('throws when attacker ID is empty string', () => {
    expect(() =>
      generateTeams({
        attackerIds: ['', 'A2'],
        defenderIds: ['D1', 'D2'],
        history: [],
        seed,
      }),
    ).toThrow(/Attacker.*index 0/i);
  });

  it('throws when attacker ID at index 1 is empty', () => {
    expect(() =>
      generateTeams({
        attackerIds: ['A1', ''],
        defenderIds: ['D1', 'D2'],
        history: [],
        seed,
      }),
    ).toThrow(/Attacker.*index 1/i);
  });

  it('throws when defender ID is whitespace', () => {
    expect(() =>
      generateTeams({
        attackerIds: ['A1', 'A2'],
        defenderIds: ['   ', 'D2'],
        history: [],
        seed,
      }),
    ).toThrow(/Defender.*index 0/i);
  });

  it('throws when defender ID at index 1 is whitespace', () => {
    expect(() =>
      generateTeams({
        attackerIds: ['A1', 'A2'],
        defenderIds: ['D1', '   '],
        history: [],
        seed,
      }),
    ).toThrow(/Defender.*index 1/i);
  });

  it('throws when attacker list is empty', () => {
    expect(() =>
      generateTeams({
        attackerIds: [],
        defenderIds: [],
        history: [],
        seed,
      }),
    ).toThrow(/empty/i);
  });

  it('accepts valid input', () => {
    const result = generateTeams({
      attackerIds: ['A1', 'A2', 'A3'],
      defenderIds: ['D1', 'D2', 'D3'],
      history: [],
      seed,
    });

    expect(result.teams).toHaveLength(3);
  });
});
