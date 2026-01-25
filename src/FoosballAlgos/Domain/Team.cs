namespace FoosballAlgos.Domain;

/// <summary>
/// Represents a foosball team with a defender and attacker for the current round.
/// </summary>
/// <param name="Defender">The player ID in the defender position.</param>
/// <param name="Attacker">The player ID in the attacker position.</param>
public readonly record struct Team(string Defender, string Attacker)
{
    /// <summary>
    /// Creates an UnorderedPair from this team for historical comparison purposes.
    /// </summary>
    public UnorderedPair ToUnorderedPair() => new(Defender, Attacker);
}
