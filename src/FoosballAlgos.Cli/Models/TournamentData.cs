namespace FoosballAlgos.Cli.Models;

/// <summary>
/// Root data structure for tournament persistence.
/// </summary>
public sealed class TournamentData
{
    public List<string> Players { get; set; } = new();
    public List<HistoricalRound> Rounds { get; set; } = new();
}

/// <summary>
/// A completed round stored in history.
/// </summary>
public sealed class HistoricalRound
{
    public DateTime Timestamp { get; set; }
    public List<string> Attackers { get; set; } = new();
    public List<string> Defenders { get; set; } = new();
    public List<TeamRecord> Teams { get; set; } = new();
}

/// <summary>
/// A team pairing (attacker + defender) for persistence.
/// </summary>
public sealed class TeamRecord
{
    public string Attacker { get; set; } = "";
    public string Defender { get; set; } = "";
}
