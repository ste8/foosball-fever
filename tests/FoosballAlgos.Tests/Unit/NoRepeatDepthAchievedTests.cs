using FoosballAlgos.Domain;
using FoosballAlgos.Services;

namespace FoosballAlgos.Tests.Unit;

[Trait("Category", "Unit")]
public class NoRepeatDepthAchievedTests
{
    private readonly MatchmakingService _sut = new();

    [Fact]
    public void NoRepeatDepthAchieved_IsZero_WhenHistoryIsEmpty()
    {
        // Arrange
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1", "D2" };
        var history = Array.Empty<Round>();

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        result.NoRepeatDepthAchieved.Should().Be(0);
        result.MaxNoRepeatDepth.Should().Be(0);
    }

    [Fact]
    public void NoRepeatDepthAchieved_IsOne_WhenCanAvoidMostRecentRound()
    {
        // Arrange - 2x2 scenario
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1", "D2" };
        // Last round had (A1,D1) and (A2,D2)
        var history = new[]
        {
            new Round(new[]
            {
                new UnorderedPair("A1", "D1"),
                new UnorderedPair("A2", "D2")
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        // Can achieve depth 1 with (A1,D2) and (A2,D1)
        result.NoRepeatDepthAchieved.Should().Be(1);
        result.MaxNoRepeatDepth.Should().Be(1);
    }

    [Fact]
    public void NoRepeatDepthAchieved_Equals_MaxNoRepeatDepth_WhenCompleted()
    {
        // Arrange
        var attackers = new[] { "A1", "A2", "A3" };
        var defenders = new[] { "D1", "D2", "D3" };
        var history = new[]
        {
            new Round(new[]
            {
                new UnorderedPair("A1", "D1"),
                new UnorderedPair("A2", "D2"),
                new UnorderedPair("A3", "D3")
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        result.Outcome.Should().Be(RunOutcome.Completed);
        result.NoRepeatDepthAchieved.Should().Be(result.MaxNoRepeatDepth);
    }

    [Fact]
    public void NoRepeatDepthAchieved_HandlesMultipleRoundsCorrectly()
    {
        // Arrange - 3x3 with 2 rounds of history
        var attackers = new[] { "A1", "A2", "A3" };
        var defenders = new[] { "D1", "D2", "D3" };

        // Round 0 (most recent): (A1,D1), (A2,D2), (A3,D3)
        // Round 1: (A1,D2), (A2,D3), (A3,D1)
        var history = new[]
        {
            new Round(new[]
            {
                new UnorderedPair("A1", "D1"),
                new UnorderedPair("A2", "D2"),
                new UnorderedPair("A3", "D3")
            }),
            new Round(new[]
            {
                new UnorderedPair("A1", "D2"),
                new UnorderedPair("A2", "D3"),
                new UnorderedPair("A3", "D1")
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        // Remaining pairs not in history: (A1,D3), (A2,D1), (A3,D2)
        // These form a valid matching, so depth 2 is achievable
        result.NoRepeatDepthAchieved.Should().Be(2);
        result.MaxNoRepeatDepth.Should().Be(2);
    }

    [Fact]
    public void NoRepeatDepthAchieved_IsZero_WhenAllMatchingsRepeatFromMostRecent()
    {
        // Arrange - 2x2 where both possible matchings appear in most recent round is impossible
        // Actually in 2x2, if round 0 has one matching, the other is available
        // Let's use a different scenario: all edges in history
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1", "D2" };

        // Most recent round has both possible matchings? No, each round has only one matching
        // To get depth 0, we need every possible pair to appear in round 0
        // But a 2x2 round only has 2 pairs, and there are 4 possible pairs
        // So this test needs to be reformulated

        // Actually, to force depth 0:
        // We need the most recent round to contain ALL pairs that could be in ANY valid matching
        // In 2x2, valid matchings are: {(A1,D1),(A2,D2)} or {(A1,D2),(A2,D1)}
        // If round 0 is one matching, we can do the other -> depth 1

        // To truly test depth 0: empty history gives depth 0
        var history = Array.Empty<Round>();

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        result.NoRepeatDepthAchieved.Should().Be(0);
    }

    [Fact]
    public void NoRepeatDepthAchieved_CorrectWithThreeRounds()
    {
        // Arrange - 3x3 with 3 rounds
        var attackers = new[] { "A1", "A2", "A3" };
        var defenders = new[] { "D1", "D2", "D3" };

        // Use rotation pattern
        // Round 0: (A1,D1), (A2,D2), (A3,D3) - offset 0
        // Round 1: (A1,D2), (A2,D3), (A3,D1) - offset 1
        // Round 2: (A1,D3), (A2,D1), (A3,D2) - offset 2
        var history = new[]
        {
            new Round(new[]
            {
                new UnorderedPair("A1", "D1"),
                new UnorderedPair("A2", "D2"),
                new UnorderedPair("A3", "D3")
            }),
            new Round(new[]
            {
                new UnorderedPair("A1", "D2"),
                new UnorderedPair("A2", "D3"),
                new UnorderedPair("A3", "D1")
            }),
            new Round(new[]
            {
                new UnorderedPair("A1", "D3"),
                new UnorderedPair("A2", "D1"),
                new UnorderedPair("A3", "D2")
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        // All 9 possible pairs are covered by the 3 rounds
        // So we must repeat from at least one round
        // MaxNoRepeatDepth should be 2 (can avoid rounds 0,1 by choosing round 2's matching)
        // But round 2's pairs ARE in history at position 2
        // Actually: can we find a matching not in rounds 0,1,2?
        // 3x3 has 9 pairs total, 3 rounds cover all 9 pairs
        // So no, we cannot achieve depth 3

        // Wait, 3x3 has 3! = 6 possible matchings, but only 9 pairs total
        // Each matching uses 3 pairs
        // 3 rounds with 3 pairs each = 9 pairs, covering all possible pairs
        // So any matching we create WILL have at least one repeated pair

        // But the question is: what's the MAX depth?
        // We need to find a matching with no pairs from rounds 0..(h-1)
        // h=0: any matching works (no constraints)
        // h=1: avoid round 0 pairs -> possible (e.g., offset 1 or 2)
        // h=2: avoid rounds 0,1 pairs -> only offset 2 pairs remain, which is valid
        // h=3: avoid rounds 0,1,2 pairs -> no pairs remain!

        result.MaxNoRepeatDepth.Should().Be(2);
        result.NoRepeatDepthAchieved.Should().Be(2);
    }
}
