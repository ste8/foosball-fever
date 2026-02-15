import type {
  GenerationInput,
  GenerationResult,
  GeneratedTeam,
  MatchDayHistory,
} from './types.js';
import { BipartiteGraph } from './bipartiteGraph.js';
import { hopcroftKarp } from './hopcroftKarp.js';

// ── Public API ──────────────────────────────────────────────────────

export function generateTeams(input: GenerationInput): GenerationResult {
  const start = performance.now();

  const { attackerIds, defenderIds, history, seed } = input;

  validate(attackerIds, defenderIds);

  const rng = mulberry32(seed);

  const attackerIndex = buildIndexMap(attackerIds);
  const defenderIndex = buildIndexMap(defenderIds);

  // Reverse history so forbiddenByRound[0] = most recent match day
  const reversedHistory = [...history].reverse();
  const forbiddenByRound = precomputeForbiddenPairs(
    reversedHistory,
    attackerIndex,
    defenderIndex,
  );

  // Binary search for maximum no-repeat depth
  let lo = 0;
  let hi = reversedHistory.length;
  let bestMatching: Map<number, number> | null = null;
  let bestDepth = 0;

  // Depth 0 (no forbidden pairs) — must always succeed
  bestMatching = tryMatchAtDepth(
    attackerIds.length,
    defenderIds.length,
    0,
    forbiddenByRound,
    rng,
  );
  bestDepth = 0;

  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    const matching = tryMatchAtDepth(
      attackerIds.length,
      defenderIds.length,
      mid,
      forbiddenByRound,
      rng,
    );

    if (matching !== null && matching.size === attackerIds.length) {
      bestMatching = matching;
      bestDepth = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  const teams = buildTeams(bestMatching!, attackerIds, defenderIds);
  const repeatedCount = countRepeatedPairs(teams, history);
  const lastOccurrences = computeLastOccurrences(teams, history);

  const generatedTeams: GeneratedTeam[] = teams.map((t, i) => ({
    teamNumber: i + 1,
    attackerId: t.attackerId,
    defenderId: t.defenderId,
    lastOccurrence: lastOccurrences[i],
  }));

  const calculationTimeMs = performance.now() - start;

  return {
    teams: generatedTeams,
    metrics: {
      freshMatchDays: bestDepth,
      repeatedCount,
      totalCount: generatedTeams.length,
      calculationTimeMs,
    },
  };
}

// ── Validation ──────────────────────────────────────────────────────

function validate(attackerIds: string[], defenderIds: string[]): void {
  if (attackerIds.length === 0) {
    throw new Error('attackerIds must not be empty.');
  }

  if (attackerIds.length !== defenderIds.length) {
    throw new Error(
      `Attacker count (${attackerIds.length}) must equal defender count (${defenderIds.length}).`,
    );
  }

  for (let i = 0; i < attackerIds.length; i++) {
    if (!attackerIds[i] || attackerIds[i].trim() === '') {
      throw new Error(
        `Attacker ID at index ${i} is empty or whitespace.`,
      );
    }
  }

  for (let i = 0; i < defenderIds.length; i++) {
    if (!defenderIds[i] || defenderIds[i].trim() === '') {
      throw new Error(
        `Defender ID at index ${i} is empty or whitespace.`,
      );
    }
  }

  const attackerSet = new Set<string>();
  for (const id of attackerIds) {
    if (attackerSet.has(id)) {
      throw new Error(`Duplicate attacker ID: '${id}'.`);
    }
    attackerSet.add(id);
  }

  const defenderSet = new Set<string>();
  for (const id of defenderIds) {
    if (defenderSet.has(id)) {
      throw new Error(`Duplicate defender ID: '${id}'.`);
    }
    defenderSet.add(id);
  }

  for (const id of attackerIds) {
    if (defenderSet.has(id)) {
      throw new Error(
        `Player ID '${id}' appears in both attackers and defenders.`,
      );
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

export function unorderedPairKey(a: string, b: string): string {
  return a < b ? `${a}\0${b}` : `${b}\0${a}`;
}

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildIndexMap(ids: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < ids.length; i++) {
    map.set(ids[i], i);
  }
  return map;
}

function precomputeForbiddenPairs(
  reversedHistory: MatchDayHistory[],
  attackerIndex: Map<string, number>,
  defenderIndex: Map<string, number>,
): Set<string>[] {
  return reversedHistory.map((matchDay) => {
    const forbidden = new Set<string>();

    for (const team of matchDay.teams) {
      const { attackerId, defenderId } = team;

      // Try attackerId as attacker, defenderId as defender
      const a1 = attackerIndex.get(attackerId);
      const d1 = defenderIndex.get(defenderId);
      if (a1 !== undefined && d1 !== undefined) {
        forbidden.add(`${a1},${d1}`);
      }

      // Try defenderId as attacker, attackerId as defender
      const a2 = attackerIndex.get(defenderId);
      const d2 = defenderIndex.get(attackerId);
      if (a2 !== undefined && d2 !== undefined) {
        forbidden.add(`${a2},${d2}`);
      }
    }

    return forbidden;
  });
}

function tryMatchAtDepth(
  attackerCount: number,
  defenderCount: number,
  depth: number,
  forbiddenByRound: Set<string>[],
  rng: () => number,
): Map<number, number> | null {
  // Union of forbidden pairs from rounds 0..depth-1
  const forbidden = new Set<string>();
  for (let r = 0; r < depth && r < forbiddenByRound.length; r++) {
    for (const pair of forbiddenByRound[r]) {
      forbidden.add(pair);
    }
  }

  const graph = new BipartiteGraph(attackerCount, defenderCount);
  for (let a = 0; a < attackerCount; a++) {
    for (let d = 0; d < defenderCount; d++) {
      if (!forbidden.has(`${a},${d}`)) {
        graph.addEdge(a, d);
      }
    }
  }

  graph.shuffle(rng);

  const matching = hopcroftKarp(graph);
  if (matching.size !== attackerCount) {
    return null;
  }
  return matching;
}

function buildTeams(
  matching: Map<number, number>,
  attackerIds: string[],
  defenderIds: string[],
): { attackerId: string; defenderId: string }[] {
  const teams: { attackerId: string; defenderId: string }[] = [];
  for (const [attackerIdx, defenderIdx] of matching) {
    teams.push({
      attackerId: attackerIds[attackerIdx],
      defenderId: defenderIds[defenderIdx],
    });
  }
  return teams;
}

function countRepeatedPairs(
  teams: { attackerId: string; defenderId: string }[],
  history: MatchDayHistory[],
): number {
  const historyPairs = new Set<string>();
  for (const matchDay of history) {
    for (const team of matchDay.teams) {
      historyPairs.add(unorderedPairKey(team.attackerId, team.defenderId));
    }
  }

  let count = 0;
  for (const team of teams) {
    if (historyPairs.has(unorderedPairKey(team.attackerId, team.defenderId))) {
      count++;
    }
  }
  return count;
}

function computeLastOccurrences(
  teams: { attackerId: string; defenderId: string }[],
  history: MatchDayHistory[],
): (number | undefined)[] {
  return teams.map((team) => {
    const key = unorderedPairKey(team.attackerId, team.defenderId);

    // Scan from newest to oldest to find most recent occurrence
    for (let j = history.length - 1; j >= 0; j--) {
      for (const ht of history[j].teams) {
        if (unorderedPairKey(ht.attackerId, ht.defenderId) === key) {
          return history.length - j;
        }
      }
    }

    return undefined;
  });
}
