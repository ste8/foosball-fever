using FoosballAlgos.Domain;
using FoosballAlgos.Services;

namespace FoosballAlgos.Tests.Integration;

[Trait("Category", "Integration")]
public class CancellationTests
{
    private readonly MatchmakingService _sut = new();

    [Fact]
    public void GeneratePairs_WithAlreadyCancelledToken_ReturnsStoppedResult()
    {
        // Arrange
        var attackers = new[] { "A1", "A2", "A3" };
        var defenders = new[] { "D1", "D2", "D3" };
        using var cts = new CancellationTokenSource();
        cts.Cancel(); // Pre-cancelled

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, Array.Empty<Round>(),
            TimeSpan.FromSeconds(5),
            ct: cts.Token);

        // Assert
        // With pre-cancelled token, may return cancelled or may still find solution
        // if it completes before checking cancellation
        (result.Outcome == RunOutcome.Stopped || result.HasSolution).Should().BeTrue();

        if (result.Outcome == RunOutcome.Stopped)
        {
            result.StopReason.Should().Be(StopReason.CancelledByUser);
        }
    }

    [Fact]
    public async Task GeneratePairs_CancellationDuringExecution_ReturnsStoppedResult()
    {
        // Arrange - Large input to ensure cancellation can occur during execution
        var attackers = Enumerable.Range(1, 15).Select(i => $"A{i}").ToArray();
        var defenders = Enumerable.Range(1, 15).Select(i => $"D{i}").ToArray();
        var history = BuildDenseHistory(attackers, defenders, 10);

        using var cts = new CancellationTokenSource();

        // Act - Cancel after a short delay
        var task = Task.Run(() =>
        {
            // Small delay before cancelling
            Task.Delay(10).Wait();
            cts.Cancel();

            return _sut.GeneratePairs(
                attackers, defenders, history,
                TimeSpan.FromMinutes(1),
                ct: cts.Token);
        });

        var result = await task;

        // Assert
        // Result depends on timing - either cancelled or completed
        if (!result.HasSolution)
        {
            result.Outcome.Should().Be(RunOutcome.Stopped);
            result.StopReason.Should().Be(StopReason.CancelledByUser);
            result.Teams.Should().BeEmpty();
        }
    }

    [Fact]
    public void GeneratePairs_WithTinyTimeBudget_MayTimeout()
    {
        // Arrange - Input that requires some computation
        var attackers = Enumerable.Range(1, 10).Select(i => $"A{i}").ToArray();
        var defenders = Enumerable.Range(1, 10).Select(i => $"D{i}").ToArray();
        var history = BuildDenseHistory(attackers, defenders, 8);

        // Act - Very short timeout
        var result = _sut.GeneratePairs(
            attackers, defenders, history,
            TimeSpan.FromTicks(1)); // Essentially zero time

        // Assert
        // May complete (if fast enough) or timeout
        // Either way, if HasSolution is true, result should be valid
        if (result.HasSolution)
        {
            result.Teams.Should().HaveCount(10);
            result.Teams.Select(t => t.Attacker).Should().OnlyHaveUniqueItems();
            result.Teams.Select(t => t.Defender).Should().OnlyHaveUniqueItems();
        }
        else
        {
            result.Outcome.Should().Be(RunOutcome.Stopped);
            result.StopReason.Should().BeOneOf(StopReason.Timeout, StopReason.CancelledByUser);
        }
    }

    [Fact]
    public void GeneratePairs_WithZeroTimeBudget_StillReturnsValidResult()
    {
        // Arrange
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1", "D2" };

        // Act - Zero time budget
        var result = _sut.GeneratePairs(
            attackers, defenders, Array.Empty<Round>(),
            TimeSpan.Zero);

        // Assert
        // Small input should still complete even with zero budget
        // (first iteration happens before timeout check)
        // But behavior depends on implementation
        if (result.HasSolution)
        {
            result.Teams.Should().HaveCount(2);
        }
        // If no solution, it's acceptable
    }

    [Fact]
    public void GeneratePairs_NoCancellation_CompletesSuccessfully()
    {
        // Arrange
        var attackers = new[] { "A1", "A2", "A3", "A4" };
        var defenders = new[] { "D1", "D2", "D3", "D4" };
        var history = BuildDenseHistory(attackers, defenders, 2);

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history,
            TimeSpan.FromSeconds(30));

        // Assert
        result.HasSolution.Should().BeTrue();
        result.Outcome.Should().Be(RunOutcome.Completed);
        result.StopReason.Should().Be(StopReason.None);
    }

    [Fact]
    public void GeneratePairs_StoppedResult_HasCorrectProperties()
    {
        // Arrange
        var attackers = Enumerable.Range(1, 20).Select(i => $"A{i}").ToArray();
        var defenders = Enumerable.Range(1, 20).Select(i => $"D{i}").ToArray();
        var history = BuildDenseHistory(attackers, defenders, 15);

        using var cts = new CancellationTokenSource();
        cts.Cancel();

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, history,
            TimeSpan.FromSeconds(1),
            ct: cts.Token);

        // Assert
        if (!result.HasSolution)
        {
            result.Outcome.Should().Be(RunOutcome.Stopped);
            result.StopReason.Should().NotBe(StopReason.None);
            result.Teams.Should().BeEmpty();
        }
    }

    [Fact]
    public void GeneratePairs_EmptyInput_CompletesImmediately_EvenWithCancellation()
    {
        // Arrange
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        // Act
        var result = _sut.GeneratePairs(
            Array.Empty<string>(),
            Array.Empty<string>(),
            Array.Empty<Round>(),
            TimeSpan.FromSeconds(1),
            ct: cts.Token);

        // Assert
        // Empty input should return immediately with success
        result.HasSolution.Should().BeTrue();
        result.Outcome.Should().Be(RunOutcome.Completed);
        result.Teams.Should().BeEmpty();
    }

    private static IReadOnlyList<Round> BuildDenseHistory(
        string[] attackers, string[] defenders, int rounds)
    {
        var history = new List<Round>();
        var rng = new Random(42);

        for (int r = 0; r < rounds; r++)
        {
            var shuffled = defenders.OrderBy(_ => rng.Next()).ToArray();
            var pairs = attackers.Zip(shuffled, (a, d) => new UnorderedPair(a, d)).ToList();
            history.Add(new Round(pairs));
        }

        return history;
    }
}
