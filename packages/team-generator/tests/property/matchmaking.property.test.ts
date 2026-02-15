import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateTeams } from '../../src/generateTeams.js';
import {
  findOptimal,
  isValidMatching,
} from '../oracle/bruteForceOracle.js';
import type { GenerationInput, MatchDayHistory } from '../../src/types.js';

function validInputArb(): fc.Arbitrary<GenerationInput> {
  return fc
    .integer({ min: 1, max: 6 })
    .chain((size) =>
      fc.integer({ min: 0, max: 4 }).map((historySize) => {
        const attackerIds = Array.from(
          { length: size },
          (_, i) => `A${i + 1}`,
        );
        const defenderIds = Array.from(
          { length: size },
          (_, i) => `D${i + 1}`,
        );
        const history = generateRandomHistory(
          attackerIds,
          defenderIds,
          historySize,
        );
        return {
          attackerIds,
          defenderIds,
          history,
          seed: 42,
        };
      }),
    );
}

function smallValidInputArb(): fc.Arbitrary<GenerationInput> {
  return fc
    .integer({ min: 2, max: 4 })
    .chain((size) =>
      fc.integer({ min: 0, max: 3 }).map((historySize) => {
        const attackerIds = Array.from(
          { length: size },
          (_, i) => `A${i + 1}`,
        );
        const defenderIds = Array.from(
          { length: size },
          (_, i) => `D${i + 1}`,
        );
        const history = generateRandomHistory(
          attackerIds,
          defenderIds,
          historySize,
        );
        return {
          attackerIds,
          defenderIds,
          history,
          seed: 42,
        };
      }),
    );
}

function generateRandomHistory(
  attackerIds: string[],
  defenderIds: string[],
  rounds: number,
): MatchDayHistory[] {
  // Deterministic "random" shuffle using a simple seed
  let s = 42;
  const nextRandom = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const history: MatchDayHistory[] = [];
  for (let r = 0; r < rounds; r++) {
    const shuffled = [...defenderIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(nextRandom() * (i + 1));
      const tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    history.push({
      matchDayNumber: r + 1,
      teams: attackerIds.map((a, i) => ({
        attackerId: a,
        defenderId: shuffled[i],
      })),
    });
  }
  return history;
}

describe('Property-based tests', () => {
  it('result always has teams for valid input', () => {
    fc.assert(
      fc.property(validInputArb(), (input) => {
        const result = generateTeams(input);
        expect(result.teams.length).toBe(input.attackerIds.length);
      }),
      { numRuns: 100 },
    );
  });

  it('teams count equals player count', () => {
    fc.assert(
      fc.property(validInputArb(), (input) => {
        const result = generateTeams(input);
        expect(result.teams.length).toBe(input.attackerIds.length);
      }),
      { numRuns: 100 },
    );
  });

  it('every defender appears exactly once', () => {
    fc.assert(
      fc.property(validInputArb(), (input) => {
        const result = generateTeams(input);
        const usedDefenders = result.teams.map((t) => t.defenderId);
        expect(new Set(usedDefenders).size).toBe(usedDefenders.length);
        expect(new Set(usedDefenders)).toEqual(new Set(input.defenderIds));
      }),
      { numRuns: 100 },
    );
  });

  it('every attacker appears exactly once', () => {
    fc.assert(
      fc.property(validInputArb(), (input) => {
        const result = generateTeams(input);
        const usedAttackers = result.teams.map((t) => t.attackerId);
        expect(new Set(usedAttackers).size).toBe(usedAttackers.length);
        expect(new Set(usedAttackers)).toEqual(new Set(input.attackerIds));
      }),
      { numRuns: 100 },
    );
  });

  it('no team contains unknown IDs', () => {
    fc.assert(
      fc.property(validInputArb(), (input) => {
        const result = generateTeams(input);
        const attackerSet = new Set(input.attackerIds);
        const defenderSet = new Set(input.defenderIds);
        for (const team of result.teams) {
          expect(attackerSet.has(team.attackerId)).toBe(true);
          expect(defenderSet.has(team.defenderId)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('freshMatchDays is non-negative', () => {
    fc.assert(
      fc.property(validInputArb(), (input) => {
        const result = generateTeams(input);
        expect(result.metrics.freshMatchDays).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 },
    );
  });

  it('result matches oracle for small inputs', () => {
    fc.assert(
      fc.property(smallValidInputArb(), (input) => {
        const result = generateTeams(input);
        const { maxDepth: oracleMaxDepth } = findOptimal(
          input.attackerIds,
          input.defenderIds,
          input.history,
        );
        expect(result.metrics.freshMatchDays).toBe(oracleMaxDepth);
      }),
      { numRuns: 50 },
    );
  });

  it('repeatedCount is non-negative', () => {
    fc.assert(
      fc.property(validInputArb(), (input) => {
        const result = generateTeams(input);
        expect(result.metrics.repeatedCount).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 },
    );
  });

  it('repeatedCount does not exceed team count', () => {
    fc.assert(
      fc.property(validInputArb(), (input) => {
        const result = generateTeams(input);
        expect(result.metrics.repeatedCount).toBeLessThanOrEqual(
          result.teams.length,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('matching is valid', () => {
    fc.assert(
      fc.property(validInputArb(), (input) => {
        const result = generateTeams(input);
        expect(
          isValidMatching(
            result.teams.map((t) => ({
              attackerId: t.attackerId,
              defenderId: t.defenderId,
            })),
            input.attackerIds,
            input.defenderIds,
          ),
        ).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('deterministic — same seed produces same output', () => {
    fc.assert(
      fc.property(validInputArb(), (input) => {
        const result1 = generateTeams(input);
        const result2 = generateTeams(input);

        expect(result1.teams.map((t) => t.attackerId)).toEqual(
          result2.teams.map((t) => t.attackerId),
        );
        expect(result1.teams.map((t) => t.defenderId)).toEqual(
          result2.teams.map((t) => t.defenderId),
        );
        expect(result1.metrics.freshMatchDays).toBe(
          result2.metrics.freshMatchDays,
        );
      }),
      { numRuns: 50 },
    );
  });
});
