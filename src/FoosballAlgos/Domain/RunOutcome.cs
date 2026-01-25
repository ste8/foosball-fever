namespace FoosballAlgos.Domain;

/// <summary>
/// The outcome of the matchmaking algorithm run.
/// </summary>
public enum RunOutcome
{
    /// <summary>
    /// Algorithm completed successfully and achieved MaxNoRepeatDepth.
    /// </summary>
    Completed,

    /// <summary>
    /// Algorithm was stopped before completion (cancelled or timed out).
    /// </summary>
    Stopped
}
