using FoosballAlgos.Cli.Commands;
using FoosballAlgos.Cli.Models;
using FoosballAlgos.Cli.Persistence;
using FoosballAlgos.Cli.UI;

const string DataFile = "tournament.json";

// Load data
var data = JsonStorage.Load(DataFile);

// Handle Ctrl+C gracefully
Console.CancelKeyPress += (_, e) =>
{
    e.Cancel = true;
    Console.WriteLine();
    ConsoleUI.ShowInfo("Use menu option 5 to exit.");
};

// Main loop
while (true)
{
    Console.Clear();
    ConsoleUI.ShowHeader("Foosball Tournament Manager");

    Console.WriteLine($"Players: {data.Players.Count} | History: {data.Rounds.Count} round(s)");
    Console.WriteLine();
    Console.WriteLine("[1] New Round");
    Console.WriteLine("[2] View History");
    Console.WriteLine("[3] Manage Players");
    Console.WriteLine("[4] Undo Last Round");
    Console.WriteLine("[5] Exit");
    Console.WriteLine();

    var choice = ConsoleUI.Prompt("Choice");

    bool changed = false;

    switch (choice)
    {
        case "1":
            changed = NewRoundCommand.Execute(data);
            break;

        case "2":
            ViewHistoryCommand.Execute(data);
            break;

        case "3":
            changed = ManagePlayersCommand.Execute(data);
            break;

        case "4":
            changed = UndoCommand.Execute(data);
            break;

        case "5":
        case "q":
        case "quit":
        case "exit":
            ConsoleUI.ShowInfo("Goodbye!");
            return;

        default:
            ConsoleUI.ShowError("Invalid choice. Enter 1-5.");
            break;
    }

    // Auto-save if data changed
    if (changed)
    {
        JsonStorage.Save(DataFile, data);
        ConsoleUI.ShowInfo($"Data saved to {DataFile}");
    }

    if (choice != "1") // New round already shows its own output
    {
        Console.WriteLine();
        ConsoleUI.Prompt("Press Enter to continue");
    }
}
