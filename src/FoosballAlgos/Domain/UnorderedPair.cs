namespace FoosballAlgos.Domain;

/// <summary>
/// Represents an unordered pair of player IDs for repetition checking.
/// Automatically normalizes on construction so that {A,B} equals {B,A}.
/// </summary>
public readonly record struct UnorderedPair : IEquatable<UnorderedPair>
{
    /// <summary>
    /// First player ID (lexicographically smaller or equal to P2 after normalization).
    /// </summary>
    public string P1 { get; }

    /// <summary>
    /// Second player ID (lexicographically greater or equal to P1 after normalization).
    /// </summary>
    public string P2 { get; }

    /// <summary>
    /// Creates a new UnorderedPair from a team.
    /// </summary>
    public UnorderedPair(Team team) : this(team.Defender, team.Attacker)
    {
    }

    /// <summary>
    /// Creates a new UnorderedPair with automatic normalization.
    /// </summary>
    /// <param name="p1">First player ID.</param>
    /// <param name="p2">Second player ID.</param>
    public UnorderedPair(string p1, string p2)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(p1, nameof(p1));
        ArgumentException.ThrowIfNullOrWhiteSpace(p2, nameof(p2));

        // Normalize: ensure P1 <= P2 lexicographically using ordinal comparison
        if (string.CompareOrdinal(p1, p2) <= 0)
        {
            P1 = p1;
            P2 = p2;
        }
        else
        {
            P1 = p2;
            P2 = p1;
        }
    }

    /// <summary>
    /// Returns a normalized version of this pair (already normalized in constructor).
    /// Provided for API compatibility.
    /// </summary>
    public UnorderedPair Normalized() => this;

    /// <summary>
    /// Value-based equality comparing normalized P1 and P2.
    /// </summary>
    public bool Equals(UnorderedPair other) =>
        string.Equals(P1, other.P1, StringComparison.Ordinal) &&
        string.Equals(P2, other.P2, StringComparison.Ordinal);

    /// <summary>
    /// Returns hash code based on normalized P1 and P2.
    /// </summary>
    public override int GetHashCode() =>
        HashCode.Combine(
            P1.GetHashCode(StringComparison.Ordinal),
            P2.GetHashCode(StringComparison.Ordinal));

    /// <summary>
    /// Returns a string representation of the pair.
    /// </summary>
    public override string ToString() => $"{{{P1}, {P2}}}";
}
