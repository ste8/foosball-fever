using FoosballAlgos.Domain;
using FoosballAlgos.Services;
using FoosballAlgos.Tests.Oracle;
using FsCheck;
using FsCheck.Xunit;
using Property = FsCheck.Property;

namespace FoosballAlgos.Tests.PropertyBased;

[Trait("Category", "Property")]
public class MatchmakingPropertyTests
{
    private readonly MatchmakingService _sut = new();

    [Property(MaxTest = 100)]
    public Property ResultAlwaysHasSolution_ForValidInput()
    {
        return Prop.ForAll(
            ValidInputArb(),
            input =>
            {
                var result = _sut.GeneratePairs(
                    input.Attackers,
                    input.Defenders,
                    input.History,
                    TimeSpan.FromSeconds(5));

                return result.HasSolution;
            });
    }

    [Property(MaxTest = 100)]
    public Property TeamsCountEqualsPlayerCount()
    {
        return Prop.ForAll(
            ValidInputArb(),
            input =>
            {
                var result = _sut.GeneratePairs(
                    input.Attackers,
                    input.Defenders,
                    input.History,
                    TimeSpan.FromSeconds(5));

                return result.Teams.Count == input.Attackers.Length;
            });
    }

    [Property(MaxTest = 100)]
    public Property EveryDefenderAppearsExactlyOnce()
    {
        return Prop.ForAll(
            ValidInputArb(),
            input =>
            {
                var result = _sut.GeneratePairs(
                    input.Attackers,
                    input.Defenders,
                    input.History,
                    TimeSpan.FromSeconds(5));

                var usedDefenders = result.Teams.Select(t => t.Defender).ToList();

                return usedDefenders.Count == usedDefenders.Distinct().Count() &&
                       usedDefenders.ToHashSet().SetEquals(input.Defenders);
            });
    }

    [Property(MaxTest = 100)]
    public Property EveryAttackerAppearsExactlyOnce()
    {
        return Prop.ForAll(
            ValidInputArb(),
            input =>
            {
                var result = _sut.GeneratePairs(
                    input.Attackers,
                    input.Defenders,
                    input.History,
                    TimeSpan.FromSeconds(5));

                var usedAttackers = result.Teams.Select(t => t.Attacker).ToList();

                return usedAttackers.Count == usedAttackers.Distinct().Count() &&
                       usedAttackers.ToHashSet().SetEquals(input.Attackers);
            });
    }

    [Property(MaxTest = 100)]
    public Property NoTeamContainsUnknownIds()
    {
        return Prop.ForAll(
            ValidInputArb(),
            input =>
            {
                var result = _sut.GeneratePairs(
                    input.Attackers,
                    input.Defenders,
                    input.History,
                    TimeSpan.FromSeconds(5));

                var attackerSet = input.Attackers.ToHashSet();
                var defenderSet = input.Defenders.ToHashSet();

                return result.Teams.All(t =>
                    attackerSet.Contains(t.Attacker) &&
                    defenderSet.Contains(t.Defender));
            });
    }

    [Property(MaxTest = 100)]
    public Property NoRepeatDepthAchievedIsLessOrEqualToMaxNoRepeatDepth()
    {
        return Prop.ForAll(
            ValidInputArb(),
            input =>
            {
                var result = _sut.GeneratePairs(
                    input.Attackers,
                    input.Defenders,
                    input.History,
                    TimeSpan.FromSeconds(5));

                return result.NoRepeatDepthAchieved <= result.MaxNoRepeatDepth;
            });
    }

    [Property(MaxTest = 100)]
    public Property NoRepeatDepthAchievedEqualsMaxWhenCompleted()
    {
        return Prop.ForAll(
            ValidInputArb(),
            input =>
            {
                var result = _sut.GeneratePairs(
                    input.Attackers,
                    input.Defenders,
                    input.History,
                    TimeSpan.FromSeconds(5));

                return result.Outcome != RunOutcome.Completed ||
                       result.NoRepeatDepthAchieved == result.MaxNoRepeatDepth;
            });
    }

    [Property(MaxTest = 50)]
    public Property ResultMatchesOracleForSmallInputs()
    {
        return Prop.ForAll(
            SmallValidInputArb(),
            input =>
            {
                var result = _sut.GeneratePairs(
                    input.Attackers,
                    input.Defenders,
                    input.History,
                    TimeSpan.FromSeconds(10));

                var (oracleMaxDepth, _) = BruteForceOracle.FindOptimal(
                    input.Attackers, input.Defenders, input.History);

                return result.MaxNoRepeatDepth == oracleMaxDepth;
            });
    }

    [Property(MaxTest = 100)]
    public Property RepeatedPairsTotalIsNonNegative()
    {
        return Prop.ForAll(
            ValidInputArb(),
            input =>
            {
                var result = _sut.GeneratePairs(
                    input.Attackers,
                    input.Defenders,
                    input.History,
                    TimeSpan.FromSeconds(5));

                return result.RepeatedPairsTotal >= 0;
            });
    }

    [Property(MaxTest = 100)]
    public Property RepeatedPairsDoesNotExceedTeamCount()
    {
        return Prop.ForAll(
            ValidInputArb(),
            input =>
            {
                var result = _sut.GeneratePairs(
                    input.Attackers,
                    input.Defenders,
                    input.History,
                    TimeSpan.FromSeconds(5));

                return result.RepeatedPairsTotal <= result.Teams.Count;
            });
    }

    [Property(MaxTest = 100)]
    public Property MatchingIsValid()
    {
        return Prop.ForAll(
            ValidInputArb(),
            input =>
            {
                var result = _sut.GeneratePairs(
                    input.Attackers,
                    input.Defenders,
                    input.History,
                    TimeSpan.FromSeconds(5));

                return BruteForceOracle.IsValidMatching(
                    result.Teams, input.Attackers, input.Defenders);
            });
    }

    // Generator for valid matchmaking inputs
    private static Arbitrary<MatchmakingInput> ValidInputArb()
    {
        var gen =
            from size in Gen.Choose(1, 6)
            let attackers = Enumerable.Range(1, size).Select(i => $"A{i}").ToArray()
            let defenders = Enumerable.Range(1, size).Select(i => $"D{i}").ToArray()
            from historySize in Gen.Choose(0, 4)
            let history = GenerateRandomHistory(attackers, defenders, historySize)
            select new MatchmakingInput(attackers, defenders, history);

        return Arb.From(gen);
    }

    // Generator for small inputs (for oracle verification)
    private static Arbitrary<MatchmakingInput> SmallValidInputArb()
    {
        var gen =
            from size in Gen.Choose(2, 4)
            let attackers = Enumerable.Range(1, size).Select(i => $"A{i}").ToArray()
            let defenders = Enumerable.Range(1, size).Select(i => $"D{i}").ToArray()
            from historySize in Gen.Choose(0, 3)
            let history = GenerateRandomHistory(attackers, defenders, historySize)
            select new MatchmakingInput(attackers, defenders, history);

        return Arb.From(gen);
    }

    private static IReadOnlyList<Round> GenerateRandomHistory(
        string[] attackers, string[] defenders, int rounds)
    {
        var rng = new System.Random(42); // Fixed seed for reproducibility
        var history = new List<Round>();

        for (int r = 0; r < rounds; r++)
        {
            var shuffledDefenders = defenders.OrderBy(_ => rng.Next()).ToArray();
            var pairs = attackers.Zip(shuffledDefenders, (a, d) => new UnorderedPair(a, d)).ToList();
            history.Add(new Round(pairs));
        }

        return history;
    }

    private record MatchmakingInput(
        string[] Attackers,
        string[] Defenders,
        IReadOnlyList<Round> History);
}
