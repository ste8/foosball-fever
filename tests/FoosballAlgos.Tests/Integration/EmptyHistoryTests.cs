using FoosballAlgos.Domain;
using FoosballAlgos.Services;
using FoosballAlgos.Tests.Helpers;

namespace FoosballAlgos.Tests.Integration;

[Trait("Category", "Integration")]
public class EmptyHistoryTests
{
    private readonly MatchmakingService _sut = new();

    [Fact]
    public void GeneratePairs_WithEmptyHistory_ReturnsValidMatching()
    {
        // Arrange
        var attackers = new[] { "A1", "A2", "A3" };
        var defenders = new[] { "D1", "D2", "D3" };
        var history = Array.Empty<Round>();

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);
        result.Teams.Should().HaveCount(3);
    }

    [Fact]
    public void GeneratePairs_WithEmptyHistory_MaxNoRepeatDepthIsZero()
    {
        // Arrange
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1", "D2" };
        var history = Array.Empty<Round>();

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);
        // With empty history, MaxNoRepeatDepth is 0 (no rounds to avoid)
        result.MaxNoRepeatDepth.Should().Be(0);
        result.NoRepeatDepthAchieved.Should().Be(0);
    }

    [Fact]
    public void GeneratePairs_WithEmptyHistory_RepeatedPairsTotalIsZero()
    {
        // Arrange
        var attackers = new[] { "A1", "A2", "A3", "A4" };
        var defenders = new[] { "D1", "D2", "D3", "D4" };
        var history = Array.Empty<Round>();

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);
        result.RepeatedPairsTotal.Should().Be(0);
    }

    [Fact]
    public void GeneratePairs_WithEmptyHistory_EachPlayerAppearsOnce()
    {
        // Arrange
        var attackers = new[] { "A1", "A2", "A3" };
        var defenders = new[] { "D1", "D2", "D3" };
        var history = Array.Empty<Round>();

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(5)]
    [InlineData(10)]
    public void GeneratePairs_WithEmptyHistory_WorksForVariousSizes(int size)
    {
        // Arrange
        var attackers = Enumerable.Range(1, size).Select(i => $"A{i}").ToArray();
        var defenders = Enumerable.Range(1, size).Select(i => $"D{i}").ToArray();
        var history = Array.Empty<Round>();

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);
        result.Teams.Should().HaveCount(size);
    }

    [Fact]
    public void GeneratePairs_WithEmptyAttackersAndDefenders_ReturnsEmptyTeams()
    {
        // Arrange
        var attackers = Array.Empty<string>();
        var defenders = Array.Empty<string>();
        var history = Array.Empty<Round>();

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        result.HasSolution.Should().BeTrue();
        result.Outcome.Should().Be(RunOutcome.Completed);
        result.Teams.Should().BeEmpty();
        result.NoRepeatDepthAchieved.Should().Be(0);
        result.MaxNoRepeatDepth.Should().Be(0);
        result.RepeatedPairsTotal.Should().Be(0);
    }
}
