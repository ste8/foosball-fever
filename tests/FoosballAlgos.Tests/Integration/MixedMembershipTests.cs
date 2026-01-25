using FoosballAlgos.Domain;
using FoosballAlgos.Services;
using FoosballAlgos.Tests.Helpers;

namespace FoosballAlgos.Tests.Integration;

[Trait("Category", "Integration")]
public class MixedMembershipTests
{
    private readonly MatchmakingService _sut = new();

    [Fact]
    public void GeneratePairs_IgnoresHistoryPairsWithMissingPlayers()
    {
        // Arrange
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1", "D2" };

        // History has pairs with players not in current round
        var history = new[]
        {
            new Round(new[]
            {
                new UnorderedPair("A1", "D1"),           // Both present
                new UnorderedPair("OldAttacker", "OldDefender"), // Neither present
                new UnorderedPair("A2", "MissingPlayer")  // Only A2 present
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);

        // Only (A1, D1) from history is relevant
        // So we can achieve depth 1 with (A1, D2) and (A2, D1)
        result.NoRepeatDepthAchieved.Should().Be(1);
    }

    [Fact]
    public void GeneratePairs_NewPlayersNotInHistory_WorksCorrectly()
    {
        // Arrange - Current round has players not in any history
        var attackers = new[] { "NewA1", "NewA2", "A3" };
        var defenders = new[] { "NewD1", "NewD2", "D3" };

        // History only has pairs with A3 and D3
        var history = new[]
        {
            new Round(new[]
            {
                new UnorderedPair("A3", "D3"),
                new UnorderedPair("OldA1", "OldD1"),
                new UnorderedPair("OldA2", "OldD2")
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);

        // Only (A3, D3) is a constraint from history
        // We can avoid it by matching A3 with NewD1 or NewD2
        result.NoRepeatDepthAchieved.Should().Be(1);
    }

    [Fact]
    public void GeneratePairs_CompletelyNewRoster_IgnoresAllHistory()
    {
        // Arrange - All players in current round are new
        var attackers = new[] { "NewA1", "NewA2" };
        var defenders = new[] { "NewD1", "NewD2" };

        // History with completely different players
        var history = new[]
        {
            new Round(new[]
            {
                new UnorderedPair("OldA1", "OldD1"),
                new UnorderedPair("OldA2", "OldD2")
            }),
            new Round(new[]
            {
                new UnorderedPair("OldA1", "OldD2"),
                new UnorderedPair("OldA2", "OldD1")
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);

        // No history pairs are relevant, so we can achieve full depth
        result.NoRepeatDepthAchieved.Should().Be(2);
        result.MaxNoRepeatDepth.Should().Be(2);
        result.RepeatedPairsTotal.Should().Be(0,
            because: "no history pairs involve current players");
    }

    [Fact]
    public void GeneratePairs_PartialOverlap_HandlesCorrectly()
    {
        // Arrange - Some players from history, some new
        var attackers = new[] { "A1", "A2", "NewA3" };
        var defenders = new[] { "D1", "NewD2", "NewD3" };

        // History with mix of current and old players
        var history = new[]
        {
            new Round(new[]
            {
                new UnorderedPair("A1", "D1"),    // Both in current
                new UnorderedPair("A2", "OldD2"), // A2 in current, OldD2 not
                new UnorderedPair("OldA3", "D1")  // OldA3 not in current, D1 is
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);

        // Only (A1, D1) is fully relevant
        // Can achieve depth 1 by avoiding (A1, D1)
        result.NoRepeatDepthAchieved.Should().Be(1);
    }

    [Fact]
    public void GeneratePairs_HistoryWithSamePlayerInDifferentRoles_HandledCorrectly()
    {
        // Arrange
        // In history, player "X" was an attacker paired with "D1"
        // Now "X" is a defender
        // The pair (X, D1) in history should not affect (A1, X) matching

        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "X", "D2" };  // X was an attacker before

        // History where X was attacker
        var history = new[]
        {
            new Round(new[]
            {
                new UnorderedPair("X", "OldD1"),  // X as attacker
                new UnorderedPair("A1", "OldD2")  // A1 was attacker before
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);

        // (X, OldD1) doesn't constrain us because OldD1 is not present
        // (A1, OldD2) doesn't constrain us because OldD2 is not present
        result.NoRepeatDepthAchieved.Should().Be(1);
        result.MaxNoRepeatDepth.Should().Be(1);
    }

    [Fact]
    public void GeneratePairs_EmptyHistoryRounds_AreHandled()
    {
        // Arrange
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1", "D2" };

        // History with empty round (no pairs)
        var history = new[]
        {
            new Round(Array.Empty<UnorderedPair>()),
            new Round(new[]
            {
                new UnorderedPair("A1", "D1"),
                new UnorderedPair("A2", "D2")
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        MatchmakingAssertions.AssertValidCompletedResult(result, attackers, defenders, history);

        // Round 0 is empty, round 1 has constraints
        // We can achieve depth 2 by avoiding round 1's pairs
        result.NoRepeatDepthAchieved.Should().Be(2);
    }
}
