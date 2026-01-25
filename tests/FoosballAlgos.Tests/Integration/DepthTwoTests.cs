using FoosballAlgos.Domain;
using FoosballAlgos.Services;

namespace FoosballAlgos.Tests.Integration;

[Trait("Category", "Integration")]
public class DepthTwoTests
{
    private readonly MatchmakingService _sut = new();

    [Fact]
    public void GeneratePairs_3v3_AchievesDepthTwo()
    {
        // Arrange - 3 attackers, 3 defenders with 2 rounds of history
        var attackers = new[] { "A1", "A2", "A3" };
        var defenders = new[] { "D1", "D2", "D3" };

        // Round 0 (most recent): offset 0
        // Round 1: offset 1
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
        result.HasSolution.Should().BeTrue();
        result.Outcome.Should().Be(RunOutcome.Completed);
        result.NoRepeatDepthAchieved.Should().Be(2);
        result.MaxNoRepeatDepth.Should().Be(2);

        // Verify the matching uses offset 2 pairs: (A1,D3), (A2,D1), (A3,D2)
        var teamPairs = result.Teams.Select(t => t.ToUnorderedPair()).ToHashSet();
        var expectedPairs = new HashSet<UnorderedPair>
        {
            new("A1", "D3"),
            new("A2", "D1"),
            new("A3", "D2")
        };
        teamPairs.Should().BeEquivalentTo(expectedPairs);
    }

    [Fact]
    public void GeneratePairs_4v4_AchievesDepthTwo()
    {
        // Arrange - 4 attackers, 4 defenders with 2 rounds of history
        var attackers = new[] { "A1", "A2", "A3", "A4" };
        var defenders = new[] { "D1", "D2", "D3", "D4" };

        var history = new[]
        {
            // Round 0: offset 0
            new Round(new[]
            {
                new UnorderedPair("A1", "D1"),
                new UnorderedPair("A2", "D2"),
                new UnorderedPair("A3", "D3"),
                new UnorderedPair("A4", "D4")
            }),
            // Round 1: offset 1
            new Round(new[]
            {
                new UnorderedPair("A1", "D2"),
                new UnorderedPair("A2", "D3"),
                new UnorderedPair("A3", "D4"),
                new UnorderedPair("A4", "D1")
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        result.HasSolution.Should().BeTrue();
        result.Outcome.Should().Be(RunOutcome.Completed);
        result.NoRepeatDepthAchieved.Should().Be(2);
        result.MaxNoRepeatDepth.Should().Be(2);

        // Verify no pairs from history[0] or history[1] are used
        var teamPairs = result.Teams.Select(t => t.ToUnorderedPair()).ToHashSet();
        var forbiddenPairs = history.SelectMany(r => r.Pairs).ToHashSet();

        teamPairs.Should().NotIntersectWith(forbiddenPairs);
    }

    [Fact]
    public void GeneratePairs_DepthTwo_AllInvariantsHold()
    {
        // Arrange
        var attackers = new[] { "Alice", "Bob", "Charlie" };
        var defenders = new[] { "Dave", "Eve", "Frank" };

        var history = new[]
        {
            new Round(new[]
            {
                new UnorderedPair("Alice", "Dave"),
                new UnorderedPair("Bob", "Eve"),
                new UnorderedPair("Charlie", "Frank")
            }),
            new Round(new[]
            {
                new UnorderedPair("Alice", "Eve"),
                new UnorderedPair("Bob", "Frank"),
                new UnorderedPair("Charlie", "Dave")
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        result.HasSolution.Should().BeTrue();
        result.Outcome.Should().Be(RunOutcome.Completed);
        result.StopReason.Should().Be(StopReason.None);

        // Each defender appears exactly once
        result.Teams.Select(t => t.Defender).Should().OnlyHaveUniqueItems();
        result.Teams.Select(t => t.Defender).Should().BeEquivalentTo(defenders);

        // Each attacker appears exactly once
        result.Teams.Select(t => t.Attacker).Should().OnlyHaveUniqueItems();
        result.Teams.Select(t => t.Attacker).Should().BeEquivalentTo(attackers);

        // NoRepeatDepthAchieved equals MaxNoRepeatDepth
        result.NoRepeatDepthAchieved.Should().Be(result.MaxNoRepeatDepth);
    }

    [Fact]
    public void GeneratePairs_DepthTwo_RepeatedPairsIsZero()
    {
        // Arrange - Setup where depth 2 means 0 repeated pairs
        var attackers = new[] { "A1", "A2", "A3" };
        var defenders = new[] { "D1", "D2", "D3" };

        // Only 2 rounds in history, and we can avoid both
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
        result.NoRepeatDepthAchieved.Should().Be(2);
        result.RepeatedPairsTotal.Should().Be(0);
    }
}
