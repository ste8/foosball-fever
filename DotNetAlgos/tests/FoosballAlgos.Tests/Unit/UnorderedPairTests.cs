using FoosballAlgos.Domain;

namespace FoosballAlgos.Tests.Unit;

[Trait("Category", "Unit")]
public class UnorderedPairTests
{
    [Fact]
    public void Constructor_NormalizesOrder_WhenP1GreaterThanP2()
    {
        // Arrange & Act
        var pair = new UnorderedPair("B", "A");

        // Assert
        pair.P1.Should().Be("A");
        pair.P2.Should().Be("B");
    }

    [Fact]
    public void Constructor_PreservesOrder_WhenP1LessThanP2()
    {
        // Arrange & Act
        var pair = new UnorderedPair("A", "B");

        // Assert
        pair.P1.Should().Be("A");
        pair.P2.Should().Be("B");
    }

    [Fact]
    public void Constructor_PreservesOrder_WhenP1EqualsP2()
    {
        // Arrange & Act
        var pair = new UnorderedPair("A", "A");

        // Assert
        pair.P1.Should().Be("A");
        pair.P2.Should().Be("A");
    }

    [Fact]
    public void Equals_ReturnsTrue_ForSwappedInputs()
    {
        // Arrange
        var pair1 = new UnorderedPair("Alice", "Bob");
        var pair2 = new UnorderedPair("Bob", "Alice");

        // Act & Assert
        pair1.Should().Be(pair2);
    }

    [Fact]
    public void GetHashCode_ReturnsSameValue_ForSwappedInputs()
    {
        // Arrange
        var pair1 = new UnorderedPair("Alice", "Bob");
        var pair2 = new UnorderedPair("Bob", "Alice");

        // Act & Assert
        pair1.GetHashCode().Should().Be(pair2.GetHashCode());
    }

    [Fact]
    public void Equals_ReturnsFalse_ForDifferentPairs()
    {
        // Arrange
        var pair1 = new UnorderedPair("Alice", "Bob");
        var pair2 = new UnorderedPair("Alice", "Charlie");

        // Act & Assert
        pair1.Should().NotBe(pair2);
    }

    [Fact]
    public void CanBeUsedAsDictionaryKey()
    {
        // Arrange
        var dict = new Dictionary<UnorderedPair, int>();
        var pair1 = new UnorderedPair("A", "B");
        var pair2 = new UnorderedPair("B", "A"); // Same pair, swapped

        // Act
        dict[pair1] = 42;

        // Assert
        dict.Should().ContainKey(pair2);
        dict[pair2].Should().Be(42);
    }

    [Fact]
    public void CanBeUsedInHashSet()
    {
        // Arrange
        var set = new HashSet<UnorderedPair>();
        var pair1 = new UnorderedPair("X", "Y");
        var pair2 = new UnorderedPair("Y", "X"); // Same pair, swapped

        // Act
        set.Add(pair1);

        // Assert
        set.Should().Contain(pair2);
        set.Should().HaveCount(1);
    }

    [Theory]
    [InlineData(null, "B")]
    [InlineData("A", null)]
    public void Constructor_ThrowsArgumentException_ForNullInput(string? p1, string? p2)
    {
        // Act
        var act = () => new UnorderedPair(p1!, p2!);

        // Assert
        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("", "B")]
    [InlineData("A", "")]
    public void Constructor_ThrowsArgumentException_ForEmptyInput(string p1, string p2)
    {
        // Act
        var act = () => new UnorderedPair(p1, p2);

        // Assert
        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("  ", "B")]
    [InlineData("A", "   ")]
    public void Constructor_ThrowsArgumentException_ForWhitespaceInput(string p1, string p2)
    {
        // Act
        var act = () => new UnorderedPair(p1, p2);

        // Assert
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Constructor_FromTeam_CreatesNormalizedPair()
    {
        // Arrange
        var team = new Team(Defender: "Bob", Attacker: "Alice");

        // Act
        var pair = new UnorderedPair(team);

        // Assert
        pair.P1.Should().Be("Alice");
        pair.P2.Should().Be("Bob");
    }

    [Fact]
    public void Normalized_ReturnsSelf()
    {
        // Arrange
        var pair = new UnorderedPair("Z", "A");

        // Act
        var normalized = pair.Normalized();

        // Assert
        normalized.Should().Be(pair);
        normalized.P1.Should().Be("A");
        normalized.P2.Should().Be("Z");
    }

    [Fact]
    public void ToString_ReturnsFormattedString()
    {
        // Arrange
        var pair = new UnorderedPair("Alice", "Bob");

        // Act
        var str = pair.ToString();

        // Assert
        str.Should().Be("{Alice, Bob}");
    }

    [Fact]
    public void OrdinalComparison_WorksForCaseSensitiveStrings()
    {
        // Arrange - 'a' > 'A' in ordinal comparison
        var pair1 = new UnorderedPair("a", "A");
        var pair2 = new UnorderedPair("A", "a");

        // Assert
        pair1.Should().Be(pair2);
        pair1.P1.Should().Be("A"); // 'A' comes before 'a' ordinally
        pair1.P2.Should().Be("a");
    }
}
