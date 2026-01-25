namespace FoosballAlgos.Domain;

/// <summary>
/// The reason for algorithm termination.
/// </summary>
public enum StopReason
{
    /// <summary>
    /// Algorithm completed normally (Outcome = Completed).
    /// </summary>
    None,

    /// <summary>
    /// Algorithm was stopped due to cancellation token being triggered.
    /// </summary>
    CancelledByUser,

    /// <summary>
    /// Algorithm was stopped due to time budget being exhausted.
    /// </summary>
    Timeout
}
