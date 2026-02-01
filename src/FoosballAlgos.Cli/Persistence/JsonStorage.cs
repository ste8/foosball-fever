using System.Text.Json;
using FoosballAlgos.Cli.Models;

namespace FoosballAlgos.Cli.Persistence;

/// <summary>
/// Handles JSON file persistence for tournament data.
/// </summary>
public static class JsonStorage
{
    private static readonly JsonSerializerOptions Options = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    /// <summary>
    /// Loads tournament data from file. Creates empty data if file doesn't exist.
    /// </summary>
    public static TournamentData Load(string path)
    {
        if (!File.Exists(path))
        {
            return new TournamentData();
        }

        var json = File.ReadAllText(path);
        return JsonSerializer.Deserialize<TournamentData>(json, Options) ?? new TournamentData();
    }

    /// <summary>
    /// Saves tournament data to file using atomic write pattern.
    /// </summary>
    public static void Save(string path, TournamentData data)
    {
        var json = JsonSerializer.Serialize(data, Options);
        var tempPath = path + ".tmp";

        // Write to temp file first
        File.WriteAllText(tempPath, json);

        // Atomic rename (overwrites existing)
        File.Move(tempPath, path, overwrite: true);
    }
}
