using FoosballAlgos.Cli.Models;
using FoosballAlgos.Cli.UI;
using FoosballAlgos.Domain;
using FoosballAlgos.Services;

namespace FoosballAlgos.Cli.Commands;

/// <summary>
/// Handles creating a new round with team generation.
/// </summary>
public static class NewRoundCommand
{
    private static readonly MatchmakingService MatchmakingService = new();
    private static readonly Random SeedGenerator = new();

    public static bool Execute(TournamentData data)
    {
        ConsoleUI.ShowHeader("New Round");

        if (data.Players.Count < 2)
        {
            ConsoleUI.ShowError("Need at least 2 players. Use 'Manage Players' to add some.");
            return false;
        }

        ConsoleUI.ShowInfo("Available players:");
        ConsoleUI.ShowPlayers(data.Players);
        Console.WriteLine();
        ConsoleUI.ShowInfo("Selection: numbers (1,3,5), ranges (1-3), prefix (Al), all (*), exclude (* -2), add (+Name)");
        Console.WriteLine();

        // Get selection - support both single-line and sequential
        string? attackerInput;
        string? defenderInput;

        var input = ConsoleUI.Prompt("Round (ATK | DEF) or Attackers");

        if (string.IsNullOrWhiteSpace(input))
        {
            return false;
        }

        var singleLine = PlayerSelector.ParseSingleLine(input);
        if (singleLine.HasValue)
        {
            attackerInput = singleLine.Value.attackers;
            defenderInput = singleLine.Value.defenders;
        }
        else
        {
            attackerInput = input;
            defenderInput = ConsoleUI.Prompt("Defenders");

            if (string.IsNullOrWhiteSpace(defenderInput))
            {
                return false;
            }
        }

        // Parse attacker selection
        var attackerResult = PlayerSelector.Parse(attackerInput, data.Players);
        if (!attackerResult.IsValid)
        {
            ConsoleUI.ShowError($"Attackers: {attackerResult.ErrorMessage}");
            return false;
        }

        // Add any new players from attacker selection
        var workingPlayers = data.Players.ToList();
        workingPlayers.AddRange(attackerResult.NewPlayers);

        // Parse defender selection (with updated player list)
        var defenderResult = PlayerSelector.Parse(defenderInput, workingPlayers);
        if (!defenderResult.IsValid)
        {
            ConsoleUI.ShowError($"Defenders: {defenderResult.ErrorMessage}");
            return false;
        }

        // Add any new players from defender selection
        workingPlayers.AddRange(defenderResult.NewPlayers);

        // Validate selections
        var attackerIndices = attackerResult.SelectedIndices;
        var defenderIndices = defenderResult.SelectedIndices;

        if (attackerIndices.Count == 0)
        {
            ConsoleUI.ShowError("No attackers selected");
            return false;
        }

        if (defenderIndices.Count == 0)
        {
            ConsoleUI.ShowError("No defenders selected");
            return false;
        }

        if (attackerIndices.Count != defenderIndices.Count)
        {
            ConsoleUI.ShowError($"Attacker count ({attackerIndices.Count}) must equal defender count ({defenderIndices.Count})");
            return false;
        }

        var overlap = attackerIndices.Intersect(defenderIndices).ToList();
        if (overlap.Count > 0)
        {
            var names = overlap.Select(i => workingPlayers[i]);
            ConsoleUI.ShowError($"Players cannot be both attacker and defender: {string.Join(", ", names)}");
            return false;
        }

        // Build player lists
        var attackers = attackerIndices.Select(i => workingPlayers[i]).ToArray();
        var defenders = defenderIndices.Select(i => workingPlayers[i]).ToArray();

        // Convert history for library (most recent first, as required by MatchmakingService)
        var history = data.Rounds
            .Select(r => new Round(
                r.Teams.Select(t => new UnorderedPair(t.Attacker, t.Defender)).ToList()))
            .Reverse()
            .ToList();

        // Generate/Regenerate loop
        int seed = SeedGenerator.Next();
        while (true)
        {
            var result = MatchmakingService.GeneratePairs(
                attackers, defenders, history,
                TimeSpan.FromSeconds(10),
                seed: seed);

            if (!result.HasSolution)
            {
                ConsoleUI.ShowError("No valid matching found!");
                return false;
            }

            ConsoleUI.ShowTeams(result.Teams, result);
            Console.WriteLine();

            var action = ConsoleUI.Prompt("[A]ccept [R]egenerate [C]ancel").ToLowerInvariant();

            switch (action)
            {
                case "a":
                case "accept":
                    // Save new players to roster
                    foreach (var newPlayer in attackerResult.NewPlayers.Concat(defenderResult.NewPlayers))
                    {
                        if (!data.Players.Contains(newPlayer))
                        {
                            data.Players.Add(newPlayer);
                        }
                    }

                    // Save round to history
                    var record = new HistoricalRound
                    {
                        Timestamp = DateTime.UtcNow,
                        Attackers = attackers.ToList(),
                        Defenders = defenders.ToList(),
                        Teams = result.Teams.Select(t => new TeamRecord
                        {
                            Attacker = t.Attacker,
                            Defender = t.Defender
                        }).ToList()
                    };
                    data.Rounds.Add(record);

                    ConsoleUI.ShowSuccess("Round saved!");
                    return true;

                case "r":
                case "regenerate":
                    seed = SeedGenerator.Next();
                    Console.WriteLine();
                    ConsoleUI.ShowInfo("Regenerating with new seed...");
                    continue;

                case "c":
                case "cancel":
                case "":
                    ConsoleUI.ShowInfo("Cancelled.");
                    return false;

                default:
                    ConsoleUI.ShowError("Invalid choice. Use A, R, or C.");
                    continue;
            }
        }
    }
}
