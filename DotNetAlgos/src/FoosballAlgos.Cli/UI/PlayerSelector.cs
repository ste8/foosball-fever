namespace FoosballAlgos.Cli.UI;

/// <summary>
/// Result of parsing player selection input.
/// </summary>
public sealed record SelectionResult(
    List<int> SelectedIndices,
    List<string> NewPlayers,
    string? ErrorMessage)
{
    public bool IsValid => ErrorMessage == null;

    public static SelectionResult Success(List<int> indices, List<string>? newPlayers = null)
        => new(indices, newPlayers ?? new(), null);

    public static SelectionResult Error(string message)
        => new(new(), new(), message);
}

/// <summary>
/// Parses player selection shortcuts.
/// Supports: numbers, ranges (1-3), comma-separated (1,3,5), all (*),
/// exclusions (* -2,3), name prefixes, and add new (+Name).
/// </summary>
public static class PlayerSelector
{
    public static SelectionResult Parse(string input, IReadOnlyList<string> availablePlayers)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return SelectionResult.Error("Empty input");
        }

        var selectedIndices = new HashSet<int>();
        var newPlayers = new List<string>();
        var exclusions = new HashSet<int>();

        // Check for exclusion pattern: "* -2,3" or "1-5 -3"
        string mainPart = input;
        string? exclusionPart = null;

        var exclusionIndex = input.IndexOf(" -", StringComparison.Ordinal);
        if (exclusionIndex > 0)
        {
            mainPart = input[..exclusionIndex].Trim();
            exclusionPart = input[(exclusionIndex + 2)..].Trim();

            // Parse exclusions
            var exclResult = ParseTokens(exclusionPart, availablePlayers, allowNewPlayers: false);
            if (!exclResult.IsValid)
            {
                return SelectionResult.Error($"Invalid exclusion: {exclResult.ErrorMessage}");
            }
            exclusions = exclResult.SelectedIndices.ToHashSet();
        }

        // Handle "all" selector
        if (mainPart == "*")
        {
            for (int i = 0; i < availablePlayers.Count; i++)
            {
                if (!exclusions.Contains(i))
                {
                    selectedIndices.Add(i);
                }
            }
            return SelectionResult.Success(selectedIndices.OrderBy(x => x).ToList(), newPlayers);
        }

        // Parse main selection tokens
        var result = ParseTokens(mainPart, availablePlayers, allowNewPlayers: true);
        if (!result.IsValid)
        {
            return result;
        }

        foreach (var idx in result.SelectedIndices)
        {
            if (!exclusions.Contains(idx))
            {
                selectedIndices.Add(idx);
            }
        }

        newPlayers.AddRange(result.NewPlayers);

        return SelectionResult.Success(selectedIndices.OrderBy(x => x).ToList(), newPlayers);
    }

    private static SelectionResult ParseTokens(
        string input,
        IReadOnlyList<string> availablePlayers,
        bool allowNewPlayers)
    {
        var selectedIndices = new List<int>();
        var newPlayers = new List<string>();

        // Split by comma
        var tokens = input.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var token in tokens)
        {
            // Check for new player syntax: +Name
            if (token.StartsWith('+'))
            {
                if (!allowNewPlayers)
                {
                    return SelectionResult.Error("Cannot add new players in exclusion list");
                }

                var newName = token[1..].Trim();
                if (string.IsNullOrWhiteSpace(newName))
                {
                    return SelectionResult.Error("Empty player name after '+'");
                }

                newPlayers.Add(newName);
                // New players will be added to the end of the list
                selectedIndices.Add(availablePlayers.Count + newPlayers.Count - 1);
                continue;
            }

            // Check for range: 1-5
            if (token.Contains('-') && !token.StartsWith('-'))
            {
                var rangeParts = token.Split('-');
                if (rangeParts.Length == 2 &&
                    int.TryParse(rangeParts[0], out int start) &&
                    int.TryParse(rangeParts[1], out int end))
                {
                    if (start < 1 || end < 1)
                    {
                        return SelectionResult.Error($"Invalid range: {token} (must be positive)");
                    }
                    if (start > end)
                    {
                        return SelectionResult.Error($"Invalid range: {token} (start > end)");
                    }
                    if (end > availablePlayers.Count)
                    {
                        return SelectionResult.Error($"Invalid range: {token} (max is {availablePlayers.Count})");
                    }

                    for (int i = start; i <= end; i++)
                    {
                        selectedIndices.Add(i - 1); // Convert to 0-based
                    }
                    continue;
                }
            }

            // Try as number
            if (int.TryParse(token, out int number))
            {
                if (number < 1 || number > availablePlayers.Count)
                {
                    return SelectionResult.Error($"Invalid player number: {number} (valid: 1-{availablePlayers.Count})");
                }
                selectedIndices.Add(number - 1); // Convert to 0-based
                continue;
            }

            // Try as name prefix
            var matches = availablePlayers
                .Select((name, idx) => (name, idx))
                .Where(x => x.name.StartsWith(token, StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (matches.Count == 0)
            {
                return SelectionResult.Error($"No player matches '{token}'");
            }
            if (matches.Count > 1)
            {
                var names = string.Join(", ", matches.Select(m => m.name));
                return SelectionResult.Error($"Ambiguous prefix '{token}' matches: {names}");
            }

            selectedIndices.Add(matches[0].idx);
        }

        return SelectionResult.Success(selectedIndices, newPlayers);
    }

    /// <summary>
    /// Parses single-line input with pipe separator for attacker|defender.
    /// Returns (attackerInput, defenderInput) or null if no pipe found.
    /// </summary>
    public static (string attackers, string defenders)? ParseSingleLine(string input)
    {
        var pipeIndex = input.IndexOf('|');
        if (pipeIndex < 0)
        {
            return null;
        }

        var attackers = input[..pipeIndex].Trim();
        var defenders = input[(pipeIndex + 1)..].Trim();

        return (attackers, defenders);
    }
}
