namespace FoosballAlgos.Domain;

/// <summary>
/// Represents a completed round of matches containing unordered pairs of players.
/// </summary>
/// <param name="Pairs">The unordered pairs that played together in this round.</param>
public sealed record Round(IReadOnlyList<UnorderedPair> Pairs)
{
    /// <summary>
    /// Returns a HashSet of pairs for efficient lookup.
    /// </summary>
    public HashSet<UnorderedPair> ToPairSet() => Pairs.ToHashSet();
}
