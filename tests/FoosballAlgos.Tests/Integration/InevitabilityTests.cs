using FoosballAlgos.Domain;
using FoosballAlgos.Services;

namespace FoosballAlgos.Tests.Integration;

[Trait("Category", "Integration")]
public class InevitabilityTests
{
    private readonly MatchmakingService _sut = new();

    [Fact]
    public void GeneratePairs_4v4_WithAllPairsCovered_MaxDepthIsLimited()
    {
        // Arrange - 4 attackers, 4 defenders
        // 4x4 = 16 possible pairs
        // A perfect matching uses 4 pairs
        // 4 rounds of rotations cover all 16 pairs

        var attackers = new[] { "A1", "A2", "A3", "A4" };
        var defenders = new[] { "D1", "D2", "D3", "D4" };

        // Build 4 rounds covering all possible pairs
        var history = BuildRotationHistory(attackers, defenders, 4);

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        result.HasSolution.Should().BeTrue();
        result.Outcome.Should().Be(RunOutcome.Completed);

        // With 4 rounds, offsets 0,1,2,3 are covered
        // We can avoid 0,1,2 by using offset 3 -> depth 3
        result.MaxNoRepeatDepth.Should().Be(3);
        result.NoRepeatDepthAchieved.Should().Be(3);
    }

    [Fact]
    public void GeneratePairs_2v2_With2Rounds_MustRepeat()
    {
        // Arrange - 2x2 has only 2 possible perfect matchings
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1", "D2" };

        // Both possible matchings in history
        var history = new[]
        {
            // Matching 1: (A1,D1), (A2,D2)
            new Round(new[]
            {
                new UnorderedPair("A1", "D1"),
                new UnorderedPair("A2", "D2")
            }),
            // Matching 2: (A1,D2), (A2,D1)
            new Round(new[]
            {
                new UnorderedPair("A1", "D2"),
                new UnorderedPair("A2", "D1")
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        result.HasSolution.Should().BeTrue();
        result.Outcome.Should().Be(RunOutcome.Completed);

        // We can avoid round 0 by using round 1's matching, so depth 1
        result.MaxNoRepeatDepth.Should().Be(1);
        result.NoRepeatDepthAchieved.Should().Be(1);

        // But we will have repeated pairs (from round 1)
        result.RepeatedPairsTotal.Should().Be(2);
    }

    [Fact]
    public void GeneratePairs_3v3_FullRotation_MaxDepthIs2()
    {
        // Arrange - 3x3 with all 3 rotation offsets covered
        var attackers = new[] { "A1", "A2", "A3" };
        var defenders = new[] { "D1", "D2", "D3" };

        // 3 rounds cover all 9 pairs
        var history = BuildRotationHistory(attackers, defenders, 3);

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        result.HasSolution.Should().BeTrue();
        result.Outcome.Should().Be(RunOutcome.Completed);

        // Can avoid rounds 0,1 by using offset 2 (round 2's matching)
        result.MaxNoRepeatDepth.Should().Be(2);
        result.NoRepeatDepthAchieved.Should().Be(2);
    }

    [Fact]
    public void GeneratePairs_WhenOnlyOneMatchingRemains_FindsIt()
    {
        // Arrange - Construct history such that only one matching remains
        var attackers = new[] { "A1", "A2", "A3" };
        var defenders = new[] { "D1", "D2", "D3" };

        // History covers offsets 0 and 1, leaving only offset 2
        var history = new[]
        {
            // Offset 0
            new Round(new[]
            {
                new UnorderedPair("A1", "D1"),
                new UnorderedPair("A2", "D2"),
                new UnorderedPair("A3", "D3")
            }),
            // Offset 1
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

        // The only valid matching at depth 2 is offset 2: (A1,D3), (A2,D1), (A3,D2)
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
    public void GeneratePairs_SparseHistory_HigherDepthAchievable()
    {
        // Arrange - History that doesn't cover many pairs
        var attackers = new[] { "A1", "A2", "A3", "A4" };
        var defenders = new[] { "D1", "D2", "D3", "D4" };

        // Sparse history: only 2 pairs per round
        var history = new[]
        {
            new Round(new[]
            {
                new UnorderedPair("A1", "D1"),
                new UnorderedPair("A2", "D2")
            }),
            new Round(new[]
            {
                new UnorderedPair("A3", "D3"),
                new UnorderedPair("A4", "D4")
            })
        };

        // Act
        var result = _sut.GeneratePairs(attackers, defenders, history, TimeSpan.FromSeconds(5));

        // Assert
        result.HasSolution.Should().BeTrue();
        result.Outcome.Should().Be(RunOutcome.Completed);

        // Many pairs are not covered, so high depth is achievable
        // Forbidden: (A1,D1), (A2,D2), (A3,D3), (A4,D4)
        // Valid matching exists avoiding all of these, e.g.: (A1,D2), (A2,D1), (A3,D4), (A4,D3)
        result.NoRepeatDepthAchieved.Should().Be(2);
        result.MaxNoRepeatDepth.Should().Be(2);
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
