using FoosballAlgos.Domain;

namespace FoosballAlgos.Tests.Helpers;

/// <summary>
/// Custom assertions for matchmaking results.
/// </summary>
public static class MatchmakingAssertions
{
    /// <summary>
    /// Asserts that all teams in the result are distinct (no duplicate pairs).
    /// </summary>
    public static void AssertAllTeamsAreDistinct(MatchmakingResult result)
    {
        var pairs = result.Teams.Select(t => t.ToUnorderedPair()).ToList();
        pairs.Should().OnlyHaveUniqueItems(
            because: "each team pairing should be unique");
    }

    /// <summary>
    /// Asserts that no pairs from history[0..NoRepeatDepthAchieved-1] appear in the result.
    /// This verifies that the claimed NoRepeatDepthAchieved is correct.
    /// </summary>
    public static void AssertNoPairsFromRecentRounds(
        MatchmakingResult result,
        IReadOnlyList<Round> history)
    {
        if (!result.HasSolution || result.NoRepeatDepthAchieved == 0)
            return;

        var teamPairs = result.Teams.Select(t => t.ToUnorderedPair()).ToHashSet();

        for (int i = 0; i < result.NoRepeatDepthAchieved && i < history.Count; i++)
        {
            var roundPairs = history[i].ToPairSet();
            var intersection = teamPairs.Intersect(roundPairs).ToList();

            intersection.Should().BeEmpty(
                because: $"NoRepeatDepthAchieved={result.NoRepeatDepthAchieved} means no pairs from history[0..{result.NoRepeatDepthAchieved - 1}] should appear, but found {string.Join(", ", intersection)} in round {i}");
        }
    }

    /// <summary>
    /// Asserts that when NoRepeatDepthAchieved equals the history count,
    /// RepeatedPairsTotal should be 0 (no pairs repeat from anywhere in history).
    /// </summary>
    public static void AssertRepeatedPairsConsistentWithDepth(
        MatchmakingResult result,
        IReadOnlyList<Round> history)
    {
        if (!result.HasSolution)
            return;

        // If we achieved full depth (avoided all history), repeated pairs should be 0
        if (result.NoRepeatDepthAchieved == history.Count)
        {
            result.RepeatedPairsTotal.Should().Be(0,
                because: $"NoRepeatDepthAchieved ({result.NoRepeatDepthAchieved}) equals history count ({history.Count}), so no pairs should repeat");
        }
    }

    /// <summary>
    /// Performs all standard assertions for a successful matchmaking result.
    /// </summary>
    public static void AssertValidSuccessfulResult(
        MatchmakingResult result,
        IReadOnlyList<string> attackers,
        IReadOnlyList<string> defenders,
        IReadOnlyList<Round> history)
    {
        result.HasSolution.Should().BeTrue();

        // All attackers appear exactly once
        result.Teams.Select(t => t.Attacker).Should()
            .OnlyHaveUniqueItems()
            .And.BeEquivalentTo(attackers);

        // All defenders appear exactly once
        result.Teams.Select(t => t.Defender).Should()
            .OnlyHaveUniqueItems()
            .And.BeEquivalentTo(defenders);

        // All teams are distinct
        AssertAllTeamsAreDistinct(result);

        // No pairs from recent rounds (up to achieved depth)
        AssertNoPairsFromRecentRounds(result, history);

        // Repeated pairs count is consistent with depth
        AssertRepeatedPairsConsistentWithDepth(result, history);

        // NoRepeatDepthAchieved should be <= MaxNoRepeatDepth
        result.NoRepeatDepthAchieved.Should().BeLessOrEqualTo(result.MaxNoRepeatDepth);

        // RepeatedPairsTotal should be non-negative and <= team count
        result.RepeatedPairsTotal.Should().BeGreaterOrEqualTo(0)
            .And.BeLessOrEqualTo(result.Teams.Count);
    }

    /// <summary>
    /// Performs all standard assertions for a completed matchmaking result.
    /// </summary>
    public static void AssertValidCompletedResult(
        MatchmakingResult result,
        IReadOnlyList<string> attackers,
        IReadOnlyList<string> defenders,
        IReadOnlyList<Round> history)
    {
        AssertValidSuccessfulResult(result, attackers, defenders, history);

        result.Outcome.Should().Be(RunOutcome.Completed);
        result.StopReason.Should().Be(StopReason.None);
        result.NoRepeatDepthAchieved.Should().Be(result.MaxNoRepeatDepth,
            because: "completed results should achieve maximum depth");
    }
}
