# FoosballAlgos

A C# .NET 10 library for generating optimal foosball tournament pairings using the Hopcroft-Karp bipartite matching algorithm.

## Overview

This library solves the problem of pairing defenders with attackers in a foosball tournament while maximizing "no-repeat depth" - avoiding repeated pairings from recent rounds as much as mathematically possible.

## Features

- **Optimal matching**: Uses Hopcroft-Karp algorithm with O(E√V) time complexity
- **No-repeat depth maximization**: Finds the maximum depth h such that no pairs from the last h rounds repeat
- **Role-agnostic history**: Pairs are compared regardless of which role each player had
- **Time budget and cancellation support**: Algorithm respects time limits and cancellation tokens
- **Reproducible results**: Optional seed parameter for deterministic behavior

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)

## Building

```bash
# Clone the repository
git clone <repository-url>
cd foosball-algos

# Build the solution
dotnet build

# Build in Release mode
dotnet build -c Release
```

## Running Tests

```bash
# Run all tests
dotnet test

# Run with detailed output
dotnet test --logger "console;verbosity=detailed"

# Run specific test categories
dotnet test --filter "Category=Unit"
dotnet test --filter "Category=Integration"
dotnet test --filter "Category=Oracle"
dotnet test --filter "Category=Property"

# Run with coverage (requires coverlet)
dotnet test --collect:"XPlat Code Coverage"
```

## Usage

```csharp
using FoosballAlgos.Domain;
using FoosballAlgos.Services;

// Create the service
var matchmakingService = new MatchmakingService();

// Define players
var attackers = new[] { "Alice", "Bob", "Charlie", "Diana" };
var defenders = new[] { "Eve", "Frank", "Grace", "Henry" };

// Define previous rounds (history) - most recent first
var history = new[]
{
    new Round(new[]
    {
        new UnorderedPair("Alice", "Eve"),
        new UnorderedPair("Bob", "Frank"),
        new UnorderedPair("Charlie", "Grace"),
        new UnorderedPair("Diana", "Henry")
    })
};

// Generate new pairings
var result = matchmakingService.GeneratePairs(
    attackers,
    defenders,
    history,
    timeBudget: TimeSpan.FromSeconds(5),
    seed: 42);  // Optional: for reproducibility

if (result.HasSolution)
{
    Console.WriteLine($"Solution found!");
    Console.WriteLine($"No-repeat depth achieved: {result.NoRepeatDepthAchieved}");
    Console.WriteLine($"Max no-repeat depth: {result.MaxNoRepeatDepth}");
    Console.WriteLine($"Repeated pairs total: {result.RepeatedPairsTotal}");
    Console.WriteLine();
    Console.WriteLine("Teams:");
    foreach (var team in result.Teams)
    {
        Console.WriteLine($"  {team.Attacker} (ATK) + {team.Defender} (DEF)");
    }
}
```

## API Reference

### `MatchmakingService.GeneratePairs`

```csharp
MatchmakingResult GeneratePairs(
    IReadOnlyList<string> attackers,
    IReadOnlyList<string> defenders,
    IReadOnlyList<Round> history,
    TimeSpan timeBudget,
    int? seed = null,
    CancellationToken ct = default);
```

**Parameters:**
- `attackers`: List of player IDs for attacker positions
- `defenders`: List of player IDs for defender positions
- `history`: Previous rounds (most recent first), used to avoid repeated pairings
- `timeBudget`: Maximum time allowed for computation
- `seed`: Optional random seed for reproducibility
- `ct`: Cancellation token for early termination

**Returns:** `MatchmakingResult` with:
- `HasSolution`: Whether a valid solution was found
- `Outcome`: `Completed` or `Stopped`
- `StopReason`: `None`, `CancelledByUser`, or `Timeout`
- `Teams`: The generated teams (Defender, Attacker pairs)
- `NoRepeatDepthAchieved`: The no-repeat depth achieved
- `MaxNoRepeatDepth`: The maximum possible no-repeat depth
- `RepeatedPairsTotal`: Number of pairs appearing anywhere in history

**Throws:** `ArgumentException` if:
- Attacker count doesn't equal defender count
- Any list contains duplicates
- Any player ID is null, empty, or whitespace
- Any player ID appears in both attackers and defenders

## Domain Models

### Team
```csharp
public readonly record struct Team(string Defender, string Attacker);
```

### UnorderedPair
```csharp
public readonly record struct UnorderedPair(string P1, string P2);
```
Auto-normalizes on construction so that `{A,B}` equals `{B,A}`.

### Round
```csharp
public sealed record Round(IReadOnlyList<UnorderedPair> Pairs);
```

## Project Structure

```
foosball-algos/
├── FoosballAlgos.sln
├── README.md
├── src/FoosballAlgos/
│   ├── Domain/                 # Team, UnorderedPair, Round, etc.
│   ├── Algorithms/             # Hopcroft-Karp implementation
│   └── Services/               # MatchmakingService
└── tests/FoosballAlgos.Tests/
    ├── Unit/                   # Unit tests
    ├── Integration/            # Integration tests
    ├── Oracle/                 # Brute-force verification tests
    └── Property/               # FsCheck property-based tests
```

## Algorithm

The library uses the **Hopcroft-Karp algorithm** for maximum bipartite matching:

1. **Input validation**: Verify all constraints (equal counts, no duplicates, etc.)
2. **Build forbidden pairs**: For each history round, compute forbidden (attacker, defender) pairs
3. **Binary search for MaxNoRepeatDepth**: Find the maximum depth h such that a perfect matching exists avoiding pairs from history[0..h-1]
4. **Construct matching**: Use Hopcroft-Karp to find a perfect matching in the allowed bipartite graph
5. **Return result**: Include the matching and all computed metrics

### Complexity

- Time: O(E × √V) per matching attempt, where E = edges and V = vertices
- Space: O(V + E) for graph representation

## License

MIT License
