using System.Diagnostics;
using FoosballAlgos.Algorithms;
using FoosballAlgos.Domain;

namespace FoosballAlgos.Services;

/// <summary>
/// Service for generating optimal foosball tournament pairings.
/// Uses Hopcroft-Karp algorithm to find maximum bipartite matchings
/// while maximizing "no-repeat depth" from historical rounds.
/// </summary>
public sealed class MatchmakingService
{
    private readonly HopcroftKarpMatching _matcher = new();

    /// <summary>
    /// Generates optimal team pairings for a foosball tournament round.
    /// </summary>
    /// <param name="attackers">List of player IDs for attacker positions.</param>
    /// <param name="defenders">List of player IDs for defender positions.</param>
    /// <param name="history">Previous rounds to avoid repeating pairings (most recent first).</param>
    /// <param name="timeBudget">Maximum time allowed for computation.</param>
    /// <param name="seed">Optional random seed for reproducibility.</param>
    /// <param name="ct">Cancellation token for early termination.</param>
    /// <returns>The matchmaking result with teams and metrics.</returns>
    /// <exception cref="ArgumentException">If input validation fails.</exception>
    public MatchmakingResult GeneratePairs(
        IReadOnlyList<string> attackers,
        IReadOnlyList<string> defenders,
        IReadOnlyList<Round> history,
        TimeSpan timeBudget,
        int? seed = null,
        CancellationToken ct = default)
    {
        // Validate input (throws ArgumentException if invalid)
        InputValidator.Validate(attackers, defenders, history);

        var stopwatch = Stopwatch.StartNew();

        // Handle empty input - trivially completed
        if (attackers.Count == 0)
        {
            return MatchmakingResult.Completed(
                teams: Array.Empty<Team>(),
                noRepeatDepthAchieved: 0,
                maxNoRepeatDepth: 0,
                repeatedPairsTotal: 0);
        }

        // Build index maps for players
        var attackerIndex = BuildIndexMap(attackers);
        var defenderIndex = BuildIndexMap(defenders);

        // Precompute forbidden pairs for each history round (filtered to current player pool)
        var forbiddenByRound = PrecomputeForbiddenPairs(history, attackerIndex, defenderIndex);

        // Find MaxNoRepeatDepth using binary search
        int maxDepth = history.Count;
        int lo = 0;
        int hi = maxDepth;

        Dictionary<int, int>? bestMatching = null;
        int bestDepth = 0;

        // First try depth 0 (no forbidden pairs) to ensure we can find any matching
        var baseMatching = TryMatchAtDepth(attackers.Count, defenders.Count, 0, forbiddenByRound, ct);
        if (ct.IsCancellationRequested)
            return MatchmakingResult.Cancelled();

        if (baseMatching == null || baseMatching.Count != attackers.Count)
        {
            // Should never happen with valid input (complete bipartite graph at depth 0)
            return MatchmakingResult.NoSolution(StopReason.None);
        }

        bestMatching = baseMatching;
        bestDepth = 0;

        // Binary search for maximum achievable depth
        while (lo <= hi)
        {
            if (ct.IsCancellationRequested)
            {
                return BuildStoppedResult(bestMatching, bestDepth, attackers, defenders,
                    history, forbiddenByRound, StopReason.CancelledByUser);
            }

            if (stopwatch.Elapsed >= timeBudget)
            {
                return BuildStoppedResult(bestMatching, bestDepth, attackers, defenders,
                    history, forbiddenByRound, StopReason.Timeout);
            }

            int mid = lo + (hi - lo) / 2;

            var matching = TryMatchAtDepth(attackers.Count, defenders.Count, mid, forbiddenByRound, ct);

            if (ct.IsCancellationRequested)
            {
                return BuildStoppedResult(bestMatching, bestDepth, attackers, defenders,
                    history, forbiddenByRound, StopReason.CancelledByUser);
            }

            if (matching != null && matching.Count == attackers.Count)
            {
                // Perfect matching found at this depth
                bestMatching = matching;
                bestDepth = mid;
                lo = mid + 1; // Try higher depth
            }
            else
            {
                hi = mid - 1; // Try lower depth
            }
        }

        // At this point bestDepth is the maximum achievable depth
        int maxNoRepeatDepth = bestDepth;

        // Build final teams
        var teams = BuildTeams(bestMatching!, attackers, defenders);

        // Calculate repeated pairs total
        int repeatedPairsTotal = CountRepeatedPairs(teams, history);

        return MatchmakingResult.Completed(
            teams: teams,
            noRepeatDepthAchieved: bestDepth,
            maxNoRepeatDepth: maxNoRepeatDepth,
            repeatedPairsTotal: repeatedPairsTotal);
    }

    /// <summary>
    /// Attempts to find a perfect matching at the given depth.
    /// </summary>
    private Dictionary<int, int>? TryMatchAtDepth(
        int attackerCount,
        int defenderCount,
        int depth,
        List<HashSet<(int Attacker, int Defender)>> forbiddenByRound,
        CancellationToken ct)
    {
        // Build forbidden set: union of pairs from rounds 0..depth-1
        var forbidden = new HashSet<(int, int)>();
        for (int r = 0; r < depth && r < forbiddenByRound.Count; r++)
        {
            foreach (var pair in forbiddenByRound[r])
            {
                forbidden.Add(pair);
            }
        }

        // Build bipartite graph with only allowed edges
        var graph = new BipartiteGraph(attackerCount, defenderCount);
        for (int a = 0; a < attackerCount; a++)
        {
            for (int d = 0; d < defenderCount; d++)
            {
                if (!forbidden.Contains((a, d)))
                {
                    graph.AddEdge(a, d);
                }
            }
        }

        return _matcher.FindMaximumMatching(graph, ct);
    }

    /// <summary>
    /// Builds index map for quick player ID to index lookup.
    /// </summary>
    private static Dictionary<string, int> BuildIndexMap(IReadOnlyList<string> players)
    {
        var map = new Dictionary<string, int>(StringComparer.Ordinal);
        for (int i = 0; i < players.Count; i++)
        {
            map[players[i]] = i;
        }
        return map;
    }

    /// <summary>
    /// Precomputes forbidden (attacker index, defender index) pairs for each history round.
    /// Only includes pairs where both players are in the current player pool.
    /// </summary>
    private static List<HashSet<(int Attacker, int Defender)>> PrecomputeForbiddenPairs(
        IReadOnlyList<Round> history,
        Dictionary<string, int> attackerIndex,
        Dictionary<string, int> defenderIndex)
    {
        var result = new List<HashSet<(int, int)>>();

        foreach (var round in history)
        {
            var forbidden = new HashSet<(int, int)>();

            foreach (var pair in round.Pairs)
            {
                // The pair is unordered, so we need to check both orientations:
                // pair.P1 could be attacker and pair.P2 could be defender, or vice versa

                // Try P1 as attacker, P2 as defender
                if (attackerIndex.TryGetValue(pair.P1, out int a1) &&
                    defenderIndex.TryGetValue(pair.P2, out int d1))
                {
                    forbidden.Add((a1, d1));
                }

                // Try P2 as attacker, P1 as defender
                if (attackerIndex.TryGetValue(pair.P2, out int a2) &&
                    defenderIndex.TryGetValue(pair.P1, out int d2))
                {
                    forbidden.Add((a2, d2));
                }
            }

            result.Add(forbidden);
        }

        return result;
    }

    /// <summary>
    /// Builds Team list from matching dictionary.
    /// </summary>
    private static IReadOnlyList<Team> BuildTeams(
        Dictionary<int, int> matching,
        IReadOnlyList<string> attackers,
        IReadOnlyList<string> defenders)
    {
        var teams = new List<Team>(matching.Count);
        foreach (var (attackerIdx, defenderIdx) in matching)
        {
            teams.Add(new Team(
                Defender: defenders[defenderIdx],
                Attacker: attackers[attackerIdx]));
        }
        return teams;
    }

    /// <summary>
    /// Counts how many pairs in teams appear at least once anywhere in history.
    /// </summary>
    private static int CountRepeatedPairs(
        IReadOnlyList<Team> teams,
        IReadOnlyList<Round> history)
    {
        // Build set of all historical pairs
        var historyPairs = new HashSet<UnorderedPair>();
        foreach (var round in history)
        {
            foreach (var pair in round.Pairs)
            {
                historyPairs.Add(pair);
            }
        }

        // Count how many current pairs appear in history
        int count = 0;
        foreach (var team in teams)
        {
            if (historyPairs.Contains(team.ToUnorderedPair()))
            {
                count++;
            }
        }
        return count;
    }

    /// <summary>
    /// Builds a stopped result with partial solution if available.
    /// </summary>
    private static MatchmakingResult BuildStoppedResult(
        Dictionary<int, int>? matching,
        int depth,
        IReadOnlyList<string> attackers,
        IReadOnlyList<string> defenders,
        IReadOnlyList<Round> history,
        List<HashSet<(int, int)>> forbiddenByRound,
        StopReason reason)
    {
        if (matching == null || matching.Count != attackers.Count)
        {
            return MatchmakingResult.NoSolution(reason);
        }

        var teams = BuildTeams(matching, attackers, defenders);
        int repeatedPairs = CountRepeatedPairs(teams, history);

        return reason switch
        {
            StopReason.CancelledByUser => MatchmakingResult.Cancelled(
                partialTeams: teams,
                noRepeatDepthAchieved: depth,
                maxNoRepeatDepth: depth, // Best known so far
                repeatedPairsTotal: repeatedPairs),
            StopReason.Timeout => MatchmakingResult.TimedOut(
                partialTeams: teams,
                noRepeatDepthAchieved: depth,
                maxNoRepeatDepth: depth, // Best known so far
                repeatedPairsTotal: repeatedPairs),
            _ => throw new ArgumentOutOfRangeException(nameof(reason))
        };
    }
}
