using FoosballAlgos.Domain;

namespace FoosballAlgos.Tests.Helpers;

/// <summary>
/// Helper class for building test data.
/// </summary>
public static class TestDataBuilder
{
    /// <summary>
    /// Creates a list of attacker IDs.
    /// </summary>
    public static string[] CreateAttackers(int count, string prefix = "A")
    {
        return Enumerable.Range(1, count).Select(i => $"{prefix}{i}").ToArray();
    }

    /// <summary>
    /// Creates a list of defender IDs.
    /// </summary>
    public static string[] CreateDefenders(int count, string prefix = "D")
    {
        return Enumerable.Range(1, count).Select(i => $"{prefix}{i}").ToArray();
    }

    /// <summary>
    /// Builds history using rotation pattern.
    /// Round r pairs Ai with D((i+r) mod n).
    /// </summary>
    public static IReadOnlyList<Round> BuildRotationHistory(
        string[] attackers, string[] defenders, int rounds)
    {
        var history = new List<Round>();
        int n = attackers.Length;

        for (int r = 0; r < rounds; r++)
        {
            var pairs = new List<UnorderedPair>();
            for (int i = 0; i < n; i++)
            {
                int defIdx = (i + r) % n;
                pairs.Add(new UnorderedPair(attackers[i], defenders[defIdx]));
            }
            history.Add(new Round(pairs));
        }

        return history;
    }

    /// <summary>
    /// Builds history with random matchings.
    /// </summary>
    public static IReadOnlyList<Round> BuildRandomHistory(
        string[] attackers, string[] defenders, int rounds, int? seed = null)
    {
        var rng = seed.HasValue ? new Random(seed.Value) : new Random();
        var history = new List<Round>();

        for (int r = 0; r < rounds; r++)
        {
            var shuffled = defenders.OrderBy(_ => rng.Next()).ToArray();
            var pairs = attackers.Zip(shuffled, (a, d) => new UnorderedPair(a, d)).ToList();
            history.Add(new Round(pairs));
        }

        return history;
    }

    /// <summary>
    /// Builds a round with specific pairings.
    /// </summary>
    public static Round BuildRound(params (string A, string D)[] pairings)
    {
        var pairs = pairings.Select(p => new UnorderedPair(p.A, p.D)).ToList();
        return new Round(pairs);
    }

    /// <summary>
    /// Builds a sparse round with only some pairings.
    /// </summary>
    public static Round BuildSparseRound(string[] attackers, string[] defenders, int pairCount, int offset = 0)
    {
        var pairs = new List<UnorderedPair>();
        for (int i = 0; i < pairCount && i < attackers.Length; i++)
        {
            int defIdx = (i + offset) % defenders.Length;
            pairs.Add(new UnorderedPair(attackers[i], defenders[defIdx]));
        }
        return new Round(pairs);
    }
}
