using FoosballAlgos.Cli.Models;
using FoosballAlgos.Cli.UI;

namespace FoosballAlgos.Cli.Commands;

/// <summary>
/// Handles displaying round history.
/// </summary>
public static class ViewHistoryCommand
{
    public static void Execute(TournamentData data)
    {
        ConsoleUI.ShowHeader("Round History");

        if (data.Rounds.Count == 0)
        {
            ConsoleUI.ShowInfo("No rounds played yet.");
            return;
        }

        ConsoleUI.ShowHistory(data.Rounds, limit: 10);

        if (data.Rounds.Count > 10)
        {
            var showAll = ConsoleUI.Confirm($"Show all {data.Rounds.Count} rounds?");
            if (showAll)
            {
                ConsoleUI.ShowHistory(data.Rounds, limit: data.Rounds.Count);
            }
        }
    }
}
