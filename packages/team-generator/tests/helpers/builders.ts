import type { MatchDayHistory } from '../../src/types.js';

/**
 * Builds history using rotation pattern.
 * Round r pairs Ai with D((i+r) mod n).
 * Returns in oldest→newest order.
 */
export function buildRotationHistory(
  attackers: string[],
  defenders: string[],
  rounds: number,
): MatchDayHistory[] {
  const history: MatchDayHistory[] = [];
  const n = attackers.length;

  for (let r = 0; r < rounds; r++) {
    const teams: { attackerId: string; defenderId: string }[] = [];
    for (let i = 0; i < n; i++) {
      const defIdx = (i + r) % n;
      teams.push({ attackerId: attackers[i], defenderId: defenders[defIdx] });
    }
    history.push({ matchDayNumber: r + 1, teams });
  }

  return history;
}

/**
 * Builds history with seeded random matchings.
 */
export function buildRandomHistory(
  attackers: string[],
  defenders: string[],
  rounds: number,
  seed = 42,
): MatchDayHistory[] {
  // Simple seeded shuffle using mulberry32
  let s = seed | 0;
  const nextRandom = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const history: MatchDayHistory[] = [];

  for (let r = 0; r < rounds; r++) {
    // Fisher-Yates shuffle of defenders
    const shuffled = [...defenders];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(nextRandom() * (i + 1));
      const tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }

    const teams = attackers.map((a, i) => ({
      attackerId: a,
      defenderId: shuffled[i],
    }));
    history.push({ matchDayNumber: r + 1, teams });
  }

  return history;
}

/**
 * Creates a MatchDayHistory from attacker-defender pair tuples.
 */
export function buildMatchDay(
  matchDayNumber: number,
  ...pairs: [string, string][]
): MatchDayHistory {
  return {
    matchDayNumber,
    teams: pairs.map(([a, d]) => ({ attackerId: a, defenderId: d })),
  };
}
