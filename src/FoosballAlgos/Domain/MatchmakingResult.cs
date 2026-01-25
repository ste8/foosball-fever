namespace FoosballAlgos.Domain;

/// <summary>
/// The result of the matchmaking algorithm including solution and metrics.
/// </summary>
/// <param name="HasSolution">Whether a valid solution was found.</param>
/// <param name="Outcome">Whether the algorithm completed or was stopped.</param>
/// <param name="StopReason">The specific reason for stopping.</param>
/// <param name="Teams">The generated teams (empty if no solution).</param>
/// <param name="NoRepeatDepthAchieved">The no-repeat depth achieved by the solution.</param>
/// <param name="MaxNoRepeatDepth">The maximum possible no-repeat depth for the input.</param>
/// <param name="RepeatedPairsTotal">Number of pairs that appear at least once in history.</param>
public sealed record MatchmakingResult(
    bool HasSolution,
    RunOutcome Outcome,
    StopReason StopReason,
    IReadOnlyList<Team> Teams,
    int NoRepeatDepthAchieved,
    int MaxNoRepeatDepth,
    int RepeatedPairsTotal)
{
    /// <summary>
    /// Creates a successful completed result.
    /// </summary>
    public static MatchmakingResult Completed(
        IReadOnlyList<Team> teams,
        int noRepeatDepthAchieved,
        int maxNoRepeatDepth,
        int repeatedPairsTotal) => new(
        HasSolution: true,
        Outcome: RunOutcome.Completed,
        StopReason: StopReason.None,
        Teams: teams,
        NoRepeatDepthAchieved: noRepeatDepthAchieved,
        MaxNoRepeatDepth: maxNoRepeatDepth,
        RepeatedPairsTotal: repeatedPairsTotal);

    /// <summary>
    /// Creates a stopped result due to cancellation with optional partial solution.
    /// </summary>
    public static MatchmakingResult Cancelled(
        IReadOnlyList<Team>? partialTeams = null,
        int noRepeatDepthAchieved = 0,
        int maxNoRepeatDepth = 0,
        int repeatedPairsTotal = 0) => new(
        HasSolution: partialTeams is { Count: > 0 },
        Outcome: RunOutcome.Stopped,
        StopReason: StopReason.CancelledByUser,
        Teams: partialTeams ?? Array.Empty<Team>(),
        NoRepeatDepthAchieved: noRepeatDepthAchieved,
        MaxNoRepeatDepth: maxNoRepeatDepth,
        RepeatedPairsTotal: repeatedPairsTotal);

    /// <summary>
    /// Creates a stopped result due to timeout with optional partial solution.
    /// </summary>
    public static MatchmakingResult TimedOut(
        IReadOnlyList<Team>? partialTeams = null,
        int noRepeatDepthAchieved = 0,
        int maxNoRepeatDepth = 0,
        int repeatedPairsTotal = 0) => new(
        HasSolution: partialTeams is { Count: > 0 },
        Outcome: RunOutcome.Stopped,
        StopReason: StopReason.Timeout,
        Teams: partialTeams ?? Array.Empty<Team>(),
        NoRepeatDepthAchieved: noRepeatDepthAchieved,
        MaxNoRepeatDepth: maxNoRepeatDepth,
        RepeatedPairsTotal: repeatedPairsTotal);

    /// <summary>
    /// Creates a no-solution result (stopped without finding any valid matching).
    /// </summary>
    public static MatchmakingResult NoSolution(StopReason reason) => new(
        HasSolution: false,
        Outcome: RunOutcome.Stopped,
        StopReason: reason,
        Teams: Array.Empty<Team>(),
        NoRepeatDepthAchieved: 0,
        MaxNoRepeatDepth: 0,
        RepeatedPairsTotal: 0);
}
