import type { MatchDayHistory } from '../../src/types.js';
import { unorderedPairKey } from '../../src/generateTeams.js';

interface SimpleTeam {
  attackerId: string;
  defenderId: string;
}

/**
 * Brute-force oracle: enumerates all n! perfect matchings to find the one
 * with maximum no-repeat depth. Only practical for small inputs (n ≤ 5).
 */
export function findOptimal(
  attackerIds: string[],
  defenderIds: string[],
  history: MatchDayHistory[],
): { maxDepth: number; bestMatching: SimpleTeam[] | null } {
  if (attackerIds.length === 0) {
    return { maxDepth: 0, bestMatching: [] };
  }

  const allMatchings = generateAllPerfectMatchings(attackerIds, defenderIds);

  let bestDepth = -1;
  let bestMatching: SimpleTeam[] | null = null;

  for (const matching of allMatchings) {
    const depth = calculateNoRepeatDepth(
      matching,
      history,
      attackerIds,
      defenderIds,
    );
    if (depth > bestDepth) {
      bestDepth = depth;
      bestMatching = matching;
    }
  }

  return { maxDepth: bestDepth, bestMatching };
}

/**
 * Calculates the no-repeat depth for a given matching.
 * History is oldest→newest, so the most recent round is at the end.
 * Depth = how many recent rounds can be avoided.
 */
export function calculateNoRepeatDepth(
  matching: SimpleTeam[],
  history: MatchDayHistory[],
  attackerIds: string[],
  defenderIds: string[],
): number {
  const matchingKeys = new Set(
    matching.map((t) => unorderedPairKey(t.attackerId, t.defenderId)),
  );
  const currentPlayers = new Set([...attackerIds, ...defenderIds]);

  // Check from most recent (end) to oldest (start)
  for (let i = history.length - 1; i >= 0; i--) {
    const roundKeys = history[i].teams
      .filter(
        (t) =>
          currentPlayers.has(t.attackerId) &&
          currentPlayers.has(t.defenderId),
      )
      .map((t) => unorderedPairKey(t.attackerId, t.defenderId));

    const hasOverlap = roundKeys.some((k) => matchingKeys.has(k));
    if (hasOverlap) {
      return history.length - 1 - i;
    }
  }

  return history.length;
}

/**
 * Counts how many pairs in the matching appear anywhere in history.
 */
export function countRepeatedPairs(
  matching: SimpleTeam[],
  history: MatchDayHistory[],
): number {
  const historyKeys = new Set<string>();
  for (const matchDay of history) {
    for (const team of matchDay.teams) {
      historyKeys.add(unorderedPairKey(team.attackerId, team.defenderId));
    }
  }

  return matching.filter((t) =>
    historyKeys.has(unorderedPairKey(t.attackerId, t.defenderId)),
  ).length;
}

/**
 * Verifies that a matching is valid (perfect bipartite matching).
 */
export function isValidMatching(
  teams: SimpleTeam[],
  attackerIds: string[],
  defenderIds: string[],
): boolean {
  if (teams.length !== attackerIds.length) return false;

  const attackerSet = new Set(attackerIds);
  const defenderSet = new Set(defenderIds);
  const usedAttackers = new Set<string>();
  const usedDefenders = new Set<string>();

  for (const team of teams) {
    if (!attackerSet.has(team.attackerId)) return false;
    if (!usedAttackers.add(team.attackerId)) return false;
    if (!defenderSet.has(team.defenderId)) return false;
    if (!usedDefenders.add(team.defenderId)) return false;
  }

  return true;
}

function generateAllPerfectMatchings(
  attackerIds: string[],
  defenderIds: string[],
): SimpleTeam[][] {
  const results: SimpleTeam[][] = [];

  for (const perm of permutations([...defenderIds])) {
    const teams: SimpleTeam[] = attackerIds.map((a, i) => ({
      attackerId: a,
      defenderId: perm[i],
    }));
    results.push(teams);
  }

  return results;
}

function* permutations<T>(arr: T[]): Generator<T[]> {
  if (arr.length <= 1) {
    yield [...arr];
    return;
  }

  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      yield [arr[i], ...perm];
    }
  }
}
