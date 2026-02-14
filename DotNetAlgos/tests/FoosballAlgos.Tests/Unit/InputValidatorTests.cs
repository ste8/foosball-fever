using FoosballAlgos.Domain;
using FoosballAlgos.Services;

namespace FoosballAlgos.Tests.Unit;

[Trait("Category", "Unit")]
public class InputValidatorTests
{
    private readonly MatchmakingService _sut = new();

    [Fact]
    public void GeneratePairs_ThrowsArgumentException_WhenCountsMismatch_MoreAttackers()
    {
        // Arrange
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1" };

        // Act
        var act = () => _sut.GeneratePairs(
            attackers, defenders, Array.Empty<Round>(), TimeSpan.FromSeconds(1));

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithParameterName("attackers")
            .WithMessage("*count*");
    }

    [Fact]
    public void GeneratePairs_ThrowsArgumentException_WhenCountsMismatch_MoreDefenders()
    {
        // Arrange
        var attackers = new[] { "A1" };
        var defenders = new[] { "D1", "D2" };

        // Act
        var act = () => _sut.GeneratePairs(
            attackers, defenders, Array.Empty<Round>(), TimeSpan.FromSeconds(1));

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithParameterName("attackers")
            .WithMessage("*count*");
    }

    [Fact]
    public void GeneratePairs_ThrowsArgumentException_WhenDuplicateInAttackers()
    {
        // Arrange
        var attackers = new[] { "A1", "A1" };
        var defenders = new[] { "D1", "D2" };

        // Act
        var act = () => _sut.GeneratePairs(
            attackers, defenders, Array.Empty<Round>(), TimeSpan.FromSeconds(1));

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithParameterName("attackers")
            .WithMessage("*Duplicate*A1*");
    }

    [Fact]
    public void GeneratePairs_ThrowsArgumentException_WhenDuplicateInDefenders()
    {
        // Arrange
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1", "D1" };

        // Act
        var act = () => _sut.GeneratePairs(
            attackers, defenders, Array.Empty<Round>(), TimeSpan.FromSeconds(1));

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithParameterName("defenders")
            .WithMessage("*Duplicate*D1*");
    }

    [Fact]
    public void GeneratePairs_ThrowsArgumentException_WhenSameIdInBothLists()
    {
        // Arrange
        var attackers = new[] { "Player1", "Player2" };
        var defenders = new[] { "Player1", "Player3" };

        // Act
        var act = () => _sut.GeneratePairs(
            attackers, defenders, Array.Empty<Round>(), TimeSpan.FromSeconds(1));

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithParameterName("attackers")
            .WithMessage("*Player1*appears in both*");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    public void GeneratePairs_ThrowsArgumentException_WhenAttackerIdIsNull(int index)
    {
        // Arrange
        var attackers = new[] { "A1", "A2" };
        attackers[index] = null!;
        var defenders = new[] { "D1", "D2" };

        // Act
        var act = () => _sut.GeneratePairs(
            attackers, defenders, Array.Empty<Round>(), TimeSpan.FromSeconds(1));

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithParameterName("attackers")
            .WithMessage($"*index {index}*null*");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    public void GeneratePairs_ThrowsArgumentException_WhenDefenderIdIsNull(int index)
    {
        // Arrange
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "D1", "D2" };
        defenders[index] = null!;

        // Act
        var act = () => _sut.GeneratePairs(
            attackers, defenders, Array.Empty<Round>(), TimeSpan.FromSeconds(1));

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithParameterName("defenders")
            .WithMessage($"*index {index}*null*");
    }

    [Fact]
    public void GeneratePairs_ThrowsArgumentException_WhenAttackerIdIsEmpty()
    {
        // Arrange
        var attackers = new[] { "", "A2" };
        var defenders = new[] { "D1", "D2" };

        // Act
        var act = () => _sut.GeneratePairs(
            attackers, defenders, Array.Empty<Round>(), TimeSpan.FromSeconds(1));

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithParameterName("attackers");
    }

    [Fact]
    public void GeneratePairs_ThrowsArgumentException_WhenDefenderIdIsWhitespace()
    {
        // Arrange
        var attackers = new[] { "A1", "A2" };
        var defenders = new[] { "   ", "D2" };

        // Act
        var act = () => _sut.GeneratePairs(
            attackers, defenders, Array.Empty<Round>(), TimeSpan.FromSeconds(1));

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithParameterName("defenders");
    }

    [Fact]
    public void GeneratePairs_ThrowsArgumentNullException_WhenAttackersIsNull()
    {
        // Act
        var act = () => _sut.GeneratePairs(
            null!, new[] { "D1" }, Array.Empty<Round>(), TimeSpan.FromSeconds(1));

        // Assert
        act.Should().Throw<ArgumentNullException>()
            .WithParameterName("attackers");
    }

    [Fact]
    public void GeneratePairs_ThrowsArgumentNullException_WhenDefendersIsNull()
    {
        // Act
        var act = () => _sut.GeneratePairs(
            new[] { "A1" }, null!, Array.Empty<Round>(), TimeSpan.FromSeconds(1));

        // Assert
        act.Should().Throw<ArgumentNullException>()
            .WithParameterName("defenders");
    }

    [Fact]
    public void GeneratePairs_ThrowsArgumentNullException_WhenHistoryIsNull()
    {
        // Act
        var act = () => _sut.GeneratePairs(
            new[] { "A1" }, new[] { "D1" }, null!, TimeSpan.FromSeconds(1));

        // Assert
        act.Should().Throw<ArgumentNullException>()
            .WithParameterName("history");
    }

    [Fact]
    public void GeneratePairs_AcceptsEmptyLists()
    {
        // Act
        var result = _sut.GeneratePairs(
            Array.Empty<string>(),
            Array.Empty<string>(),
            Array.Empty<Round>(),
            TimeSpan.FromSeconds(1));

        // Assert
        result.HasSolution.Should().BeTrue();
        result.Teams.Should().BeEmpty();
    }

    [Fact]
    public void GeneratePairs_AcceptsValidInput()
    {
        // Arrange
        var attackers = new[] { "A1", "A2", "A3" };
        var defenders = new[] { "D1", "D2", "D3" };

        // Act
        var result = _sut.GeneratePairs(
            attackers, defenders, Array.Empty<Round>(), TimeSpan.FromSeconds(1));

        // Assert
        result.HasSolution.Should().BeTrue();
        result.Teams.Should().HaveCount(3);
    }
}
