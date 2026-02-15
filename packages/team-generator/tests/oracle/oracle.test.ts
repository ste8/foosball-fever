import { describe, it, expect } from 'vitest';
import { generateTeams } from '../../src/generateTeams.js';
import {
  findOptimal,
  calculateNoRepeatDepth,
  isValidMatching,
} from './bruteForceOracle.js';
import { buildMatchDay } from '../helpers/builders.js';
import type { MatchDayHistory } from '../../src/types.js';

const seed = 42;

// ── 4x4 test cases ─────────────────────────────────────────────────

const fourByFourCases: {
  name: string;
  attackerIds: string[];
  defenderIds: string[];
  history: MatchDayHistory[];
}[] = [
  {
    name: 'Empty history',
    attackerIds: ['A1', 'A2', 'A3', 'A4'],
    defenderIds: ['D1', 'D2', 'D3', 'D4'],
    history: [],
  },
  {
    name: 'Single round — offset 0',
    attackerIds: ['A1', 'A2', 'A3', 'A4'],
    defenderIds: ['D1', 'D2', 'D3', 'D4'],
    history: [
      buildMatchDay(
        1,
        ['A1', 'D1'],
        ['A2', 'D2'],
        ['A3', 'D3'],
        ['A4', 'D4'],
      ),
    ],
  },
  {
    name: 'Two rounds — offsets 0,1',
    attackerIds: ['A1', 'A2', 'A3', 'A4'],
    defenderIds: ['D1', 'D2', 'D3', 'D4'],
    history: [
      buildMatchDay(
        1,
        ['A1', 'D1'],
        ['A2', 'D2'],
        ['A3', 'D3'],
        ['A4', 'D4'],
      ),
      buildMatchDay(
        2,
        ['A1', 'D2'],
        ['A2', 'D3'],
        ['A3', 'D4'],
        ['A4', 'D1'],
      ),
    ],
  },
  {
    name: 'Three rounds — offsets 0,1,2',
    attackerIds: ['A1', 'A2', 'A3', 'A4'],
    defenderIds: ['D1', 'D2', 'D3', 'D4'],
    history: [
      buildMatchDay(
        1,
        ['A1', 'D1'],
        ['A2', 'D2'],
        ['A3', 'D3'],
        ['A4', 'D4'],
      ),
      buildMatchDay(
        2,
        ['A1', 'D2'],
        ['A2', 'D3'],
        ['A3', 'D4'],
        ['A4', 'D1'],
      ),
      buildMatchDay(
        3,
        ['A1', 'D3'],
        ['A2', 'D4'],
        ['A3', 'D1'],
        ['A4', 'D2'],
      ),
    ],
  },
  {
    name: 'Four rounds — all offsets',
    attackerIds: ['A1', 'A2', 'A3', 'A4'],
    defenderIds: ['D1', 'D2', 'D3', 'D4'],
    history: [
      buildMatchDay(
        1,
        ['A1', 'D1'],
        ['A2', 'D2'],
        ['A3', 'D3'],
        ['A4', 'D4'],
      ),
      buildMatchDay(
        2,
        ['A1', 'D2'],
        ['A2', 'D3'],
        ['A3', 'D4'],
        ['A4', 'D1'],
      ),
      buildMatchDay(
        3,
        ['A1', 'D3'],
        ['A2', 'D4'],
        ['A3', 'D1'],
        ['A4', 'D2'],
      ),
      buildMatchDay(
        4,
        ['A1', 'D4'],
        ['A2', 'D1'],
        ['A3', 'D2'],
        ['A4', 'D3'],
      ),
    ],
  },
  {
    name: 'Sparse history',
    attackerIds: ['A1', 'A2', 'A3', 'A4'],
    defenderIds: ['D1', 'D2', 'D3', 'D4'],
    history: [
      buildMatchDay(1, ['A1', 'D1'], ['A2', 'D2']),
      buildMatchDay(2, ['A3', 'D3'], ['A4', 'D4']),
    ],
  },
  {
    name: 'History with irrelevant pairs',
    attackerIds: ['A1', 'A2', 'A3', 'A4'],
    defenderIds: ['D1', 'D2', 'D3', 'D4'],
    history: [
      buildMatchDay(
        1,
        ['A1', 'D1'],
        ['OldA', 'OldD'],
        ['A2', 'D2'],
        ['A3', 'D3'],
        ['A4', 'D4'],
      ),
    ],
  },
];

describe('Oracle — 4v4 matches oracle max depth', () => {
  it.each(fourByFourCases)('$name', ({ attackerIds, defenderIds, history }) => {
    const { maxDepth: expectedMaxDepth } = findOptimal(
      attackerIds,
      defenderIds,
      history,
    );

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    expect(result.metrics.freshMatchDays).toBe(expectedMaxDepth);
  });
});

describe('Oracle — 4v4 produces valid matching', () => {
  it.each(fourByFourCases)('$name', ({ attackerIds, defenderIds, history }) => {
    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    expect(
      isValidMatching(
        result.teams.map((t) => ({
          attackerId: t.attackerId,
          defenderId: t.defenderId,
        })),
        attackerIds,
        defenderIds,
      ),
    ).toBe(true);
  });
});

describe('Oracle — 4v4 achieved depth is correct', () => {
  it.each(fourByFourCases)('$name', ({ attackerIds, defenderIds, history }) => {
    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    const actualDepth = calculateNoRepeatDepth(
      result.teams.map((t) => ({
        attackerId: t.attackerId,
        defenderId: t.defenderId,
      })),
      history,
      attackerIds,
      defenderIds,
    );

    expect(result.metrics.freshMatchDays).toBe(actualDepth);
  });
});

describe('Oracle — 5v5', () => {
  it('matches oracle max depth', () => {
    const attackerIds = ['A1', 'A2', 'A3', 'A4', 'A5'];
    const defenderIds = ['D1', 'D2', 'D3', 'D4', 'D5'];

    const history = [
      buildMatchDay(
        1,
        ['A1', 'D1'],
        ['A2', 'D2'],
        ['A3', 'D3'],
        ['A4', 'D4'],
        ['A5', 'D5'],
      ),
      buildMatchDay(
        2,
        ['A1', 'D2'],
        ['A2', 'D3'],
        ['A3', 'D4'],
        ['A4', 'D5'],
        ['A5', 'D1'],
      ),
    ];

    const { maxDepth: expectedMaxDepth } = findOptimal(
      attackerIds,
      defenderIds,
      history,
    );

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    expect(result.metrics.freshMatchDays).toBe(expectedMaxDepth);
  });

  it('with dense history matches oracle', () => {
    const attackerIds = ['A1', 'A2', 'A3', 'A4', 'A5'];
    const defenderIds = ['D1', 'D2', 'D3', 'D4', 'D5'];

    // Build rotation history for 4 rounds
    const history: MatchDayHistory[] = [];
    for (let r = 0; r < 4; r++) {
      const teams = attackerIds.map((a, i) => ({
        attackerId: a,
        defenderId: defenderIds[(i + r) % 5],
      }));
      history.push({ matchDayNumber: r + 1, teams });
    }

    const { maxDepth: expectedMaxDepth } = findOptimal(
      attackerIds,
      defenderIds,
      history,
    );

    const result = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });

    expect(result.metrics.freshMatchDays).toBe(expectedMaxDepth);

    // Verify by oracle
    const actualDepth = calculateNoRepeatDepth(
      result.teams.map((t) => ({
        attackerId: t.attackerId,
        defenderId: t.defenderId,
      })),
      history,
      attackerIds,
      defenderIds,
    );
    expect(actualDepth).toBe(expectedMaxDepth);
  });
});
