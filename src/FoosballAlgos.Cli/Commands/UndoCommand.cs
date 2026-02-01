using FoosballAlgos.Cli.Models;
using FoosballAlgos.Cli.UI;

namespace FoosballAlgos.Cli.Commands;

/// <summary>
/// Handles undoing (removing) the last round.
/// </summary>
public static class UndoCommand
{
    public static bool Execute(TournamentData data)
    {
        ConsoleUI.ShowHeader("Undo Last Round");

        if (data.Rounds.Count == 0)
        {
            ConsoleUI.ShowInfo("No rounds to undo.");
            return false;
        }

        var lastRound = data.Rounds[^1];

        Console.WriteLine($"Last round ({lastRound.Timestamp:yyyy-MM-dd HH:mm}):");
        Console.WriteLine($"  Attackers: {string.Join(", ", lastRound.Attackers)}");
        Console.WriteLine($"  Defenders: {string.Join(", ", lastRound.Defenders)}");
        Console.WriteLine("  Teams:");
        foreach (var team in lastRound.Teams)
        {
            Console.WriteLine($"    {team.Attacker} (ATK) + {team.Defender} (DEF)");
        }
        Console.WriteLine();

        if (!ConsoleUI.Confirm("Remove this round from history?"))
        {
            return false;
        }

        data.Rounds.RemoveAt(data.Rounds.Count - 1);
        ConsoleUI.ShowSuccess("Round removed from history.");
        return true;
    }
}
