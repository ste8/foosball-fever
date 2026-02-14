using FoosballAlgos.Domain;
using FoosballAlgos.Services;

namespace FoosballAlgos.Tests.Unit;

[Trait("Category", "Unit")]
public class RepeatedPairsTotalTests
{
    private readonly MatchmakingService _sut = new();

    [Fact]
    public void RepeatedPairsTotal_IsZero_WhenHistoryIsEmpty()
    {
        // Arrange
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1", "D2" };
        var history = Array.Empty<Round>();

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        result.RepeatedPairsTotal.Should().Be(0);
    }

    [Fact]
    public void RepeatedPairsTotal_IsZero_WhenNoPairsRepeat()
    {
        // Arrange
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1", "D2" };
        // History has (A1,D1) and (A2,D2)
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
        // The algorithm should find (A1,D2) and (A2,D1) which don't repeat
        result.RepeatedPairsTotal.Should().Be(0);
        result.NoRepeatDepthAchieved.Should().Be(1);
    }

    [Fact]
    public void RepeatedPairsTotal_CountsAllHistoryRounds()
    {
        // Arrange - 2x2 with all 4 possible pairings in history
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1", "D2" };
        var history = new[]
        {
            new Round(new[]
            {
                new UnorderedPair("A1", "D1"),
                new UnorderedPair("A2", "D2")
            }),
            new Round(new[]
            {
                new UnorderedPair("A1", "D2"),
                new UnorderedPair("A2", "D1")
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        // Any matching will have 2 repeated pairs (all pairs are in history)
        result.RepeatedPairsTotal.Should().Be(2);
    }

    [Fact]
    public void RepeatedPairsTotal_CountsCorrectly_WithPartialOverlap()
    {
        // Arrange - 3x3 where only some pairs are in history
        var attackers = new[] { "A1", "A2", "A3" };
        var defenders = new[] { "D1", "D2", "D3" };
        // History has 3 pairs, leaving 6 pairs not in history
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
        // The algorithm should find a matching that avoids the historical pairs
        result.NoRepeatDepthAchieved.Should().Be(1);
        result.RepeatedPairsTotal.Should().Be(0);
    }

    [Fact]
    public void RepeatedPairsTotal_IsRoleAgnostic()
    {
        // Arrange
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1", "D2" };
        // History has the pair but with roles swapped conceptually
        // {D1, A1} should match {A1, D1} after normalization
        var history = new[]
        {
            new Round(new[]
            {
                new UnorderedPair("D1", "A1"), // Same pair as (A1, D1)
                new UnorderedPair("D2", "A2")  // Same pair as (A2, D2)
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        // Should recognize these as the same pairs regardless of order
        result.NoRepeatDepthAchieved.Should().Be(1);
        result.RepeatedPairsTotal.Should().Be(0);
    }

    [Fact]
    public void RepeatedPairsTotal_IgnoresPairsWithPlayersNotInCurrentRound()
    {
        // Arrange
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1", "D2" };
        // History has pairs with players not in current round
        var history = new[]
        {
            new Round(new[]
            {
                new UnorderedPair("A1", "D1"),
                new UnorderedPair("OldPlayer1", "OldPlayer2"), // Not in current round
                new UnorderedPair("A2", "NotPresent") // Only one player present
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        // Only (A1, D1) is a valid historical pair for current pool
        // The algorithm can avoid it with (A1, D2) and (A2, D1)
        result.HasSolution.Should().BeTrue();
    }
}
