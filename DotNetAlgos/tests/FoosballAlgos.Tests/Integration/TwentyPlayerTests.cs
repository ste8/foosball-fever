using FoosballAlgos.Domain;
using FoosballAlgos.Services;
using FoosballAlgos.Tests.Helpers;

namespace FoosballAlgos.Tests.Integration;

[Trait("Category", "Integration")]
public class TwentyPlayerTests
{
    private readonly MatchmakingService _sut = new();

    [Fact]
    public void GeneratePairs_10v10_AchievesDepthAtLeast8()
    {
        // Arrange: 10 attackers, 10 defenders
        var attackers = Enumerable.Range(1, 10).Select(i => $"A{i}").ToArray();
        var defenders = Enumerable.Range(1, 10).Select(i => $"D{i}").ToArray();

        // Build history with 8 rounds using rotation pattern
        // Round r pairs Ai with D((i+r) mod 10)
        var history = BuildRotationHistory(attackers, defenders, 8);

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(30), seed: 42);

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);
        result.MaxNoRepeatDepth.Should().BeGreaterOrEqualTo(8);
        result.NoRepeatDepthAchieved.Should().Be(result.MaxNoRepeatDepth);
    }

    [Fact]
    public void GeneratePairs_10v10_WithRotationHistory_EachPlayerAppearsOnce()
    {
        // Arrange
        var attackers = Enumerable.Range(1, 10).Select(i => $"A{i}").ToArray();
        var defenders = Enumerable.Range(1, 10).Select(i => $"D{i}").ToArray();
        var history = BuildRotationHistory(attackers, defenders, 8);

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(30));

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);
        result.Teams.Should().HaveCount(10);
    }

    [Fact]
    public void GeneratePairs_10v10_WithRotationHistory_NoRepeatsFromRecent8Rounds()
    {
        // Arrange
        var attackers = Enumerable.Range(1, 10).Select(i => $"A{i}").ToArray();
        var defenders = Enumerable.Range(1, 10).Select(i => $"D{i}").ToArray();
        var history = BuildRotationHistory(attackers, defenders, 8);

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(30));

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);

        // Explicitly verify no pair from the first 8 rounds appears in result
        var teamPairs = result.Teams.Select(t => t.ToUnorderedPair()).ToHashSet();
        for (int r = 0; r < 8; r++)
        {
            var roundPairs = history[r].ToPairSet();
            teamPairs.Should().NotIntersectWith(roundPairs,
                because: $"depth {result.NoRepeatDepthAchieved} means no pairs from round {r}");
        }
    }

    [Fact]
    public void GeneratePairs_10v10_MaxDepthIs8_WhenOnly8RoundsInHistory()
    {
        // Arrange
        var attackers = Enumerable.Range(1, 10).Select(i => $"A{i}").ToArray();
        var defenders = Enumerable.Range(1, 10).Select(i => $"D{i}").ToArray();

        // With 10 players per side, there are 10 possible offsets (0-9)
        // 8 rounds cover offsets 0-7, leaving offsets 8,9 available
        var history = BuildRotationHistory(attackers, defenders, 8);

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(30));

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);
        result.MaxNoRepeatDepth.Should().Be(8);
        result.NoRepeatDepthAchieved.Should().Be(8);
    }

    [Fact]
    public void GeneratePairs_10v10_With10Rounds_MaxDepthIs9()
    {
        // Arrange
        var attackers = Enumerable.Range(1, 10).Select(i => $"A{i}").ToArray();
        var defenders = Enumerable.Range(1, 10).Select(i => $"D{i}").ToArray();

        // 10 rounds cover offsets 0-9, but there are exactly 10 offsets
        // So only offset 9 remains if we need to avoid 0-8 (depth 9)
        var history = BuildRotationHistory(attackers, defenders, 10);

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(30));

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);
        // Offsets 0-9 cover all possibilities, so we can achieve depth 9
        // (avoid rounds 0-8, use offset 9 which is round 9)
        result.MaxNoRepeatDepth.Should().Be(9);
        result.NoRepeatDepthAchieved.Should().Be(9);
    }

    [Fact]
    public void GeneratePairs_LargeInput_CompletesWithinReasonableTime()
    {
        // Arrange - 20 players per side (larger test)
        var attackers = Enumerable.Range(1, 20).Select(i => $"Attacker{i:D2}").ToArray();
        var defenders = Enumerable.Range(1, 20).Select(i => $"Defender{i:D2}").ToArray();
        var history = BuildRotationHistory(attackers, defenders, 15);

        // Act
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(60));
        sw.Stop();

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);
        result.Teams.Should().HaveCount(20);

        // Should complete in reasonable time (algorithm is O(E*sqrt(V)))
        sw.Elapsed.Should().BeLessThan(TimeSpan.FromSeconds(30));
    }

    private static IReadOnlyList<Round> BuildRotationHistory(
        string[] attackers, string[] defenders, int rounds)
    {
        var history = new List<Round>();
        int n = attackers.Length;

        for (int r = 0; r < rounds; r++)
        {
            var pairs = new List<UnorderedPair>();
            for (int i = 0; i < n; i++)
            {
                int defIdx = (i + r) % n;
                pairs.Add(new UnorderedPair(attackers[i], defenders[defIdx]));
            }
            history.Add(new Round(pairs));
        }

        return history;
    }
}
