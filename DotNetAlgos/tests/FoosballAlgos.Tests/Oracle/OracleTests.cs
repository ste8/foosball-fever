using FoosballAlgos.Domain;
using FoosballAlgos.Services;

namespace FoosballAlgos.Tests.Oracle;

[Trait("Category", "Oracle")]
public class OracleTests
{
    private readonly MatchmakingService _sut = new();

    [Theory]
    [MemberData(nameof(FourByFourTestCases))]
    public void GeneratePairs_4v4_MatchesOracleMaxDepth(
        string[] attackers,
        string[] defenders,
        Round[] history,
        string testName)
    {
        // Arrange
        var (expectedMaxDepth, _) = BruteForceOracle.FindOptimal(attackers, defenders, history);

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(10));

        // Assert
        result.HasSolution.Should().BeTrue($"Test case: {testName}");
        result.MaxNoRepeatDepth.Should().Be(expectedMaxDepth,
            $"Test case: {testName} - Oracle found max depth {expectedMaxDepth}");
        result.NoRepeatDepthAchieved.Should().Be(expectedMaxDepth,
            $"Test case: {testName} - Should achieve max depth when completed");
    }

    [Theory]
    [MemberData(nameof(FourByFourTestCases))]
    public void GeneratePairs_4v4_ProducesValidMatching(
        string[] attackers,
        string[] defenders,
        Round[] history,
        string testName)
    {
        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(10));

        // Assert
        BruteForceOracle.IsValidMatching(result.Teams, attackers, defenders)
            .Should().BeTrue($"Test case: {testName}");
    }

    [Theory]
    [MemberData(nameof(FourByFourTestCases))]
    public void GeneratePairs_4v4_AchievedDepthIsCorrect(
        string[] attackers,
        string[] defenders,
        Round[] history,
        string testName)
    {
        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(10));

        // Assert - Verify the achieved depth is actually correct
        var actualDepth = BruteForceOracle.CalculateNoRepeatDepth(
            result.Teams, history, attackers, defenders);

        result.NoRepeatDepthAchieved.Should().Be(actualDepth,
            $"Test case: {testName}");
    }

    [Fact]
    public void GeneratePairs_5v5_MatchesOracleMaxDepth()
    {
        // Arrange - 5v5 with random history
        var attackers = new[] { "A1", "A2", "A3", "A4", "A5" };
        var defenders = new[] { "D1", "D2", "D3", "D4", "D5" };

        var history = new[]
        {
            new Round(new[]
            {
                new UnorderedPair("A1", "D1"),
                new UnorderedPair("A2", "D2"),
                new UnorderedPair("A3", "D3"),
                new UnorderedPair("A4", "D4"),
                new UnorderedPair("A5", "D5")
            }),
            new Round(new[]
            {
                new UnorderedPair("A1", "D2"),
                new UnorderedPair("A2", "D3"),
                new UnorderedPair("A3", "D4"),
                new UnorderedPair("A4", "D5"),
                new UnorderedPair("A5", "D1")
            })
        };

        var (expectedMaxDepth, _) = BruteForceOracle.FindOptimal(attackers, defenders, history);

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history, TimeSpan.FromSeconds(30));

        // Assert
        result.HasSolution.Should().BeTrue();
        result.MaxNoRepeatDepth.Should().Be(expectedMaxDepth);
        result.NoRepeatDepthAchieved.Should().Be(expectedMaxDepth);
    }

    [Fact]
    public void GeneratePairs_5v5_WithDenseHistory_MatchesOracle()
    {
        // Arrange - 5v5 with more history rounds
        var attackers = new[] { "A1", "A2", "A3", "A4", "A5" };
        var defenders = new[] { "D1", "D2", "D3", "D4", "D5" };

        // Build rotation history
        var history = new List<Round>();
        for (int r = 0; r < 4; r++)
        {
            var pairs = new List<UnorderedPair>();
            for (int i = 0; i < 5; i++)
            {
                pairs.Add(new UnorderedPair(attackers[i], defenders[(i + r) % 5]));
            }
            history.Add(new Round(pairs));
        }

        var (expectedMaxDepth, _) = BruteForceOracle.FindOptimal(attackers, defenders, history);

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history.ToArray(), TimeSpan.FromSeconds(30));

        // Assert
        result.HasSolution.Should().BeTrue();
        result.MaxNoRepeatDepth.Should().Be(expectedMaxDepth);
        result.NoRepeatDepthAchieved.Should().Be(expectedMaxDepth);

        // Verify by oracle
        var actualDepth = BruteForceOracle.CalculateNoRepeatDepth(
            result.Teams, history, attackers, defenders);
        actualDepth.Should().Be(expectedMaxDepth);
    }

    public static IEnumerable<object[]> FourByFourTestCases()
    {
        var attackers = new[] { "A1", "A2", "A3", "A4" };
        var defenders = new[] { "D1", "D2", "D3", "D4" };

        // Test case 1: Empty history
        yield return new object[]
        {
            attackers,
            defenders,
            Array.Empty<Round>(),
            "Empty history"
        };

        // Test case 2: Single round history (offset 0)
        yield return new object[]
        {
            attackers,
            defenders,
            new[]
            {
                new Round(new[]
                {
                    new UnorderedPair("A1", "D1"),
                    new UnorderedPair("A2", "D2"),
                    new UnorderedPair("A3", "D3"),
                    new UnorderedPair("A4", "D4")
                })
            },
            "Single round - offset 0"
        };

        // Test case 3: Two rounds history
        yield return new object[]
        {
            attackers,
            defenders,
            new[]
            {
                new Round(new[]
                {
                    new UnorderedPair("A1", "D1"),
                    new UnorderedPair("A2", "D2"),
                    new UnorderedPair("A3", "D3"),
                    new UnorderedPair("A4", "D4")
                }),
                new Round(new[]
                {
                    new UnorderedPair("A1", "D2"),
                    new UnorderedPair("A2", "D3"),
                    new UnorderedPair("A3", "D4"),
                    new UnorderedPair("A4", "D1")
                })
            },
            "Two rounds - offsets 0,1"
        };

        // Test case 4: Three rounds history
        yield return new object[]
        {
            attackers,
            defenders,
            new[]
            {
                new Round(new[]
                {
                    new UnorderedPair("A1", "D1"),
                    new UnorderedPair("A2", "D2"),
                    new UnorderedPair("A3", "D3"),
                    new UnorderedPair("A4", "D4")
                }),
                new Round(new[]
                {
                    new UnorderedPair("A1", "D2"),
                    new UnorderedPair("A2", "D3"),
                    new UnorderedPair("A3", "D4"),
                    new UnorderedPair("A4", "D1")
                }),
                new Round(new[]
                {
                    new UnorderedPair("A1", "D3"),
                    new UnorderedPair("A2", "D4"),
                    new UnorderedPair("A3", "D1"),
                    new UnorderedPair("A4", "D2")
                })
            },
            "Three rounds - offsets 0,1,2"
        };

        // Test case 5: Four rounds history (all offsets covered)
        yield return new object[]
        {
            attackers,
            defenders,
            new[]
            {
                new Round(new[]
                {
                    new UnorderedPair("A1", "D1"),
                    new UnorderedPair("A2", "D2"),
                    new UnorderedPair("A3", "D3"),
                    new UnorderedPair("A4", "D4")
                }),
                new Round(new[]
                {
                    new UnorderedPair("A1", "D2"),
                    new UnorderedPair("A2", "D3"),
                    new UnorderedPair("A3", "D4"),
                    new UnorderedPair("A4", "D1")
                }),
                new Round(new[]
                {
                    new UnorderedPair("A1", "D3"),
                    new UnorderedPair("A2", "D4"),
                    new UnorderedPair("A3", "D1"),
                    new UnorderedPair("A4", "D2")
                }),
                new Round(new[]
                {
                    new UnorderedPair("A1", "D4"),
                    new UnorderedPair("A2", "D1"),
                    new UnorderedPair("A3", "D2"),
                    new UnorderedPair("A4", "D3")
                })
            },
            "Four rounds - all offsets"
        };

        // Test case 6: Sparse history (not all pairs in a round)
        yield return new object[]
        {
            attackers,
            defenders,
            new[]
            {
                new Round(new[]
                {
                    new UnorderedPair("A1", "D1"),
                    new UnorderedPair("A2", "D2")
                    // Only 2 pairs instead of 4
                }),
                new Round(new[]
                {
                    new UnorderedPair("A3", "D3"),
                    new UnorderedPair("A4", "D4")
                })
            },
            "Sparse history"
        };

        // Test case 7: History with irrelevant pairs
        yield return new object[]
        {
            attackers,
            defenders,
            new[]
            {
                new Round(new[]
                {
                    new UnorderedPair("A1", "D1"),
                    new UnorderedPair("OldA", "OldD"), // Irrelevant
                    new UnorderedPair("A2", "D2"),
                    new UnorderedPair("A3", "D3"),
                    new UnorderedPair("A4", "D4")
                })
            },
            "History with irrelevant pairs"
        };
    }
}
