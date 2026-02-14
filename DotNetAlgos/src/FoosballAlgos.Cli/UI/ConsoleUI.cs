using FoosballAlgos.Cli.Models;
using FoosballAlgos.Domain;

namespace FoosballAlgos.Cli.UI;

/// <summary>
/// Console display helpers for consistent formatting.
/// </summary>
public static class ConsoleUI
{
    public static void ShowHeader(string text)
    {
        Console.WriteLine();
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine($"=== {text} ===");
        Console.ResetColor();
        Console.WriteLine();
    }

    public static void ShowPlayers(IReadOnlyList<string> players, bool numbered = true)
    {
        if (players.Count == 0)
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("No players registered.");
            Console.ResetColor();
            return;
        }

        // Display in columns for better readability
        const int columnsPerRow = 4;
        int maxNameLength = players.Max(p => p.Length);
        int columnWidth = maxNameLength + 6; // space for "XX. " prefix

        for (int i = 0; i < players.Count; i++)
        {
            string entry = numbered
                ? $"{i + 1,2}. {players[i]}"
                : players[i];

            Console.Write(entry.PadRight(columnWidth));

            if ((i + 1) % columnsPerRow == 0 || i == players.Count - 1)
            {
                Console.WriteLine();
            }
        }
    }

    public static void ShowTeams(IReadOnlyList<Team> teams, MatchmakingResult result)
    {
        Console.WriteLine();
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("Generated Teams:");
        Console.ResetColor();

        for (int i = 0; i < teams.Count; i++)
        {
            Console.WriteLine($"  Team {i + 1}: {teams[i].Attacker} (ATK) + {teams[i].Defender} (DEF)");
        }

        Console.WriteLine();
        Console.ForegroundColor = ConsoleColor.DarkGray;
        Console.WriteLine($"Depth achieved: {result.NoRepeatDepthAchieved}/{result.MaxNoRepeatDepth} | Repeated pairs: {result.RepeatedPairsTotal}");
        Console.ResetColor();
    }

    public static void ShowHistory(IReadOnlyList<HistoricalRound> rounds, int limit = 5)
    {
        if (rounds.Count == 0)
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("No rounds in history.");
            Console.ResetColor();
            return;
        }

        int startIndex = Math.Max(0, rounds.Count - limit);
        int displayCount = rounds.Count - startIndex;

        Console.WriteLine($"Showing last {displayCount} round(s) (total: {rounds.Count}):");
        Console.WriteLine();

        for (int i = rounds.Count - 1; i >= startIndex; i--)
        {
            var round = rounds[i];
            Console.ForegroundColor = ConsoleColor.White;
            Console.WriteLine($"Round {i + 1} - {round.Timestamp:yyyy-MM-dd HH:mm}");
            Console.ResetColor();

            Console.ForegroundColor = ConsoleColor.DarkGray;
            Console.WriteLine($"  Attackers: {string.Join(", ", round.Attackers)}");
            Console.WriteLine($"  Defenders: {string.Join(", ", round.Defenders)}");
            Console.ResetColor();

            Console.WriteLine("  Teams:");
            foreach (var team in round.Teams)
            {
                Console.WriteLine($"    {team.Attacker} (ATK) + {team.Defender} (DEF)");
            }
            Console.WriteLine();
        }
    }

    public static string Prompt(string message)
    {
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.Write($"{message} > ");
        Console.ResetColor();
        return Console.ReadLine()?.Trim() ?? "";
    }

    public static bool Confirm(string message)
    {
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.Write($"{message} (y/n) > ");
        Console.ResetColor();
        var response = Console.ReadLine()?.Trim().ToLowerInvariant();
        return response == "y" || response == "yes";
    }

    public static void ShowError(string message)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine($"Error: {message}");
        Console.ResetColor();
    }

    public static void ShowSuccess(string message)
    {
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine(message);
        Console.ResetColor();
    }

    public static void ShowInfo(string message)
    {
        Console.ForegroundColor = ConsoleColor.DarkGray;
        Console.WriteLine(message);
        Console.ResetColor();
    }
}
