using FoosballAlgos.Domain;

namespace FoosballAlgos.Services;

/// <summary>
/// Validates input parameters for the matchmaking service.
/// </summary>
internal static class InputValidator
{
    /// <summary>
    /// Validates the input parameters and throws ArgumentException if invalid.
    /// </summary>
    /// <exception cref="ArgumentNullException">If any parameter is null.</exception>
    /// <exception cref="ArgumentException">If validation fails.</exception>
    public static void Validate(
        IReadOnlyList<string> attackers,
        IReadOnlyList<string> defenders,
        IReadOnlyList<Round> history)
    {
        ArgumentNullException.ThrowIfNull(attackers);
        ArgumentNullException.ThrowIfNull(defenders);
        ArgumentNullException.ThrowIfNull(history);

        // Check equal counts
        if (attackers.Count != defenders.Count)
        {
            throw new ArgumentException(
                $"Attacker count ({attackers.Count}) must equal defender count ({defenders.Count}).",
                nameof(attackers));
        }

        // Check for null/empty/whitespace IDs in attackers
        ValidatePlayerIds(attackers, nameof(attackers));

        // Check for null/empty/whitespace IDs in defenders
        ValidatePlayerIds(defenders, nameof(defenders));

        // Check for duplicates within attackers
        var attackerSet = new HashSet<string>(StringComparer.Ordinal);
        foreach (var attacker in attackers)
        {
            if (!attackerSet.Add(attacker))
            {
                throw new ArgumentException(
                    $"Duplicate attacker ID: '{attacker}'.",
                    nameof(attackers));
            }
        }

        // Check for duplicates within defenders
        var defenderSet = new HashSet<string>(StringComparer.Ordinal);
        foreach (var defender in defenders)
        {
            if (!defenderSet.Add(defender))
            {
                throw new ArgumentException(
                    $"Duplicate defender ID: '{defender}'.",
                    nameof(defenders));
            }
        }

        // Check for same ID in both lists
        foreach (var attacker in attackers)
        {
            if (defenderSet.Contains(attacker))
            {
                throw new ArgumentException(
                    $"Player ID '{attacker}' appears in both attackers and defenders.",
                    nameof(attackers));
            }
        }
    }

    private static void ValidatePlayerIds(IReadOnlyList<string> ids, string paramName)
    {
        for (int i = 0; i < ids.Count; i++)
        {
            if (string.IsNullOrWhiteSpace(ids[i]))
            {
                throw new ArgumentException(
                    $"Player ID at index {i} is null, empty, or whitespace.",
                    paramName);
            }
        }
    }
}
