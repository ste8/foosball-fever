using FoosballAlgos.Cli.Models;
using FoosballAlgos.Cli.UI;

namespace FoosballAlgos.Cli.Commands;

/// <summary>
/// Handles player roster management.
/// </summary>
public static class ManagePlayersCommand
{
    public static bool Execute(TournamentData data)
    {
        while (true)
        {
            ConsoleUI.ShowHeader("Manage Players");

            if (data.Players.Count > 0)
            {
                ConsoleUI.ShowPlayers(data.Players);
            }
            else
            {
                ConsoleUI.ShowInfo("No players registered.");
            }

            Console.WriteLine();
            Console.WriteLine("[1] Add player(s)");
            Console.WriteLine("[2] Remove player(s)");
            Console.WriteLine("[3] Rename player");
            Console.WriteLine("[4] Back to main menu");
            Console.WriteLine();

            var choice = ConsoleUI.Prompt("Choice");

            switch (choice)
            {
                case "1":
                    return AddPlayers(data);

                case "2":
                    return RemovePlayers(data);

                case "3":
                    return RenamePlayer(data);

                case "4":
                case "":
                    return false;

                default:
                    ConsoleUI.ShowError("Invalid choice.");
                    continue;
            }
        }
    }

    private static bool AddPlayers(TournamentData data)
    {
        Console.WriteLine();
        ConsoleUI.ShowInfo("Enter player names (comma-separated):");
        var input = ConsoleUI.Prompt("Names");

        if (string.IsNullOrWhiteSpace(input))
        {
            return false;
        }

        var names = input.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        int added = 0;

        foreach (var name in names)
        {
            if (data.Players.Contains(name, StringComparer.OrdinalIgnoreCase))
            {
                ConsoleUI.ShowInfo($"'{name}' already exists, skipped.");
            }
            else
            {
                data.Players.Add(name);
                added++;
            }
        }

        if (added > 0)
        {
            ConsoleUI.ShowSuccess($"Added {added} player(s).");
            return true;
        }

        return false;
    }

    private static bool RemovePlayers(TournamentData data)
    {
        if (data.Players.Count == 0)
        {
            ConsoleUI.ShowInfo("No players to remove.");
            return false;
        }

        Console.WriteLine();
        var result = PlayerSelector.Parse(ConsoleUI.Prompt("Players to remove"), data.Players);

        if (!result.IsValid)
        {
            ConsoleUI.ShowError(result.ErrorMessage!);
            return false;
        }

        if (result.SelectedIndices.Count == 0)
        {
            return false;
        }

        var toRemove = result.SelectedIndices.Select(i => data.Players[i]).ToList();
        var confirm = ConsoleUI.Confirm($"Remove {string.Join(", ", toRemove)}?");

        if (!confirm)
        {
            return false;
        }

        foreach (var name in toRemove)
        {
            data.Players.Remove(name);
        }

        ConsoleUI.ShowSuccess($"Removed {toRemove.Count} player(s).");
        return true;
    }

    private static bool RenamePlayer(TournamentData data)
    {
        if (data.Players.Count == 0)
        {
            ConsoleUI.ShowInfo("No players to rename.");
            return false;
        }

        Console.WriteLine();
        var result = PlayerSelector.Parse(ConsoleUI.Prompt("Player to rename"), data.Players);

        if (!result.IsValid)
        {
            ConsoleUI.ShowError(result.ErrorMessage!);
            return false;
        }

        if (result.SelectedIndices.Count != 1)
        {
            ConsoleUI.ShowError("Select exactly one player to rename.");
            return false;
        }

        var index = result.SelectedIndices[0];
        var oldName = data.Players[index];

        var newName = ConsoleUI.Prompt($"New name for '{oldName}'");

        if (string.IsNullOrWhiteSpace(newName))
        {
            return false;
        }

        if (data.Players.Contains(newName, StringComparer.OrdinalIgnoreCase))
        {
            ConsoleUI.ShowError($"'{newName}' already exists.");
            return false;
        }

        data.Players[index] = newName;
        ConsoleUI.ShowSuccess($"Renamed '{oldName}' to '{newName}'.");
        return true;
    }
}
