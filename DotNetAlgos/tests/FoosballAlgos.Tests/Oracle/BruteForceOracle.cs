using FoosballAlgos.Domain;

namespace FoosballAlgos.Tests.Oracle;

/// <summary>
/// Brute-force oracle for verifying matchmaking results.
/// Enumerates all possible perfect matchings and finds the optimal one.
/// Only suitable for small inputs (4-5 players per side).
/// </summary>
internal static class BruteForceOracle
{
    /// <summary>
    /// Finds the maximum no-repeat depth using brute force enumeration.
    /// </summary>
    /// <param name="attackers">List of attacker IDs.</param>
    /// <param name="defenders">List of defender IDs.</param>
    /// <param name="history">History of previous rounds.</param>
    /// <returns>Tuple of (MaxDepth, BestMatching).</returns>
    public static (int MaxDepth, IReadOnlyList<Team>? BestMatching) FindOptimal(
        IReadOnlyList<string> attackers,
        IReadOnlyList<string> defenders,
        IReadOnlyList<Round> history)
    {
        if (attackers.Count == 0)
        {
            return (0, Array.Empty<Team>());
        }

        var allMatchings = GenerateAllPerfectMatchings(attackers, defenders).ToList();

        int bestDepth = -1;
        IReadOnlyList<Team>? bestMatching = null;

        foreach (var matching in allMatchings)
        {
            int depth = CalculateNoRepeatDepth(matching, history, attackers, defenders);
            if (depth > bestDepth)
            {
                bestDepth = depth;
                bestMatching = matching;
            }
        }

        return (bestDepth, bestMatching);
    }

    /// <summary>
    /// Generates all possible perfect matchings.
    /// </summary>
    private static IEnumerable<IReadOnlyList<Team>> GenerateAllPerfectMatchings(
        IReadOnlyList<string> attackers,
        IReadOnlyList<string> defenders)
    {
        // Generate all permutations of defenders
        foreach (var defenderPerm in Permutations(defenders.ToList()))
        {
            var teams = new List<Team>();
            for (int i = 0; i < attackers.Count; i++)
            {
                teams.Add(new Team(defenderPerm[i], attackers[i]));
            }
            yield return teams;
        }
    }

    /// <summary>
    /// Generates all permutations of a list.
    /// </summary>
    private static IEnumerable<List<T>> Permutations<T>(List<T> list)
    {
        if (list.Count <= 1)
        {
            yield return new List<T>(list);
            yield break;
        }

        for (int i = 0; i < list.Count; i++)
        {
            var element = list[i];
            var remaining = list.Where((_, idx) => idx != i).ToList();
            foreach (var perm in Permutations(remaining))
            {
                perm.Insert(0, element);
                yield return perm;
            }
        }
    }

    /// <summary>
    /// Calculates the no-repeat depth for a given matching.
    /// Filters history pairs to only those involving players in the current pool.
    /// </summary>
    public static int CalculateNoRepeatDepth(
        IReadOnlyList<Team> matching,
        IReadOnlyList<Round> history,
        IReadOnlyList<string> attackers,
        IReadOnlyList<string> defenders)
    {
        var matchingPairs = matching.Select(t => t.ToUnorderedPair()).ToHashSet();
        var currentPlayers = attackers.Concat(defenders).ToHashSet();

        for (int depth = 0; depth < history.Count; depth++)
        {
            // Filter round pairs to only include those where both players are in current pool
            var roundPairs = history[depth].Pairs
                .Where(p => currentPlayers.Contains(p.P1) && currentPlayers.Contains(p.P2))
                .ToHashSet();

            if (matchingPairs.Overlaps(roundPairs))
            {
                return depth;
            }
        }

        return history.Count; // No overlap with any history
    }

    /// <summary>
    /// Counts how many pairs in the matching appear anywhere in history.
    /// </summary>
    public static int CountRepeatedPairs(
        IReadOnlyList<Team> matching,
        IReadOnlyList<Round> history)
    {
        var historyPairs = history
            .SelectMany(r => r.Pairs)
            .ToHashSet();

        return matching.Count(t => historyPairs.Contains(t.ToUnorderedPair()));
    }

    /// <summary>
    /// Verifies that a matching is valid (perfect bipartite matching).
    /// </summary>
    public static bool IsValidMatching(
        IReadOnlyList<Team> teams,
        IReadOnlyList<string> attackers,
        IReadOnlyList<string> defenders)
    {
        if (teams.Count != attackers.Count)
            return false;

        var usedAttackers = new HashSet<string>();
        var usedDefenders = new HashSet<string>();
        var attackerSet = attackers.ToHashSet();
        var defenderSet = defenders.ToHashSet();

        foreach (var team in teams)
        {
            // Check attacker is valid and not used
            if (!attackerSet.Contains(team.Attacker))
                return false;
            if (!usedAttackers.Add(team.Attacker))
                return false;

            // Check defender is valid and not used
            if (!defenderSet.Contains(team.Defender))
                return false;
            if (!usedDefenders.Add(team.Defender))
                return false;
        }

        return true;
    }
}
