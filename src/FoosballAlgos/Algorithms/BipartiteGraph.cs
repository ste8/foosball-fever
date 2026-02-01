namespace FoosballAlgos.Algorithms;

/// <summary>
/// Represents a bipartite graph for matching attackers (left) to defenders (right).
/// Uses adjacency list representation with 0-based indexing.
/// </summary>
internal sealed class BipartiteGraph
{
    private readonly List<int>[] _adjacency;

    /// <summary>Sentinel value representing unmatched vertex.</summary>
    public const int Nil = -1;

    /// <summary>Infinity value for BFS distances.</summary>
    public const int Infinity = int.MaxValue;

    /// <summary>Number of vertices in the left partition (attackers).</summary>
    public int LeftCount { get; }

    /// <summary>Number of vertices in the right partition (defenders).</summary>
    public int RightCount { get; }

    /// <summary>
    /// Creates a bipartite graph with specified partition sizes.
    /// </summary>
    /// <param name="leftCount">Number of vertices in left partition (attackers).</param>
    /// <param name="rightCount">Number of vertices in right partition (defenders).</param>
    public BipartiteGraph(int leftCount, int rightCount)
    {
        LeftCount = leftCount;
        RightCount = rightCount;

        _adjacency = new List<int>[leftCount];
        for (int i = 0; i < leftCount; i++)
        {
            _adjacency[i] = new List<int>();
        }
    }

    /// <summary>
    /// Adds an edge from a left vertex to a right vertex.
    /// </summary>
    /// <param name="left">Index in left partition (0 to LeftCount-1).</param>
    /// <param name="right">Index in right partition (0 to RightCount-1).</param>
    public void AddEdge(int left, int right)
    {
        _adjacency[left].Add(right);
    }

    /// <summary>
    /// Gets neighbors (right vertices) of a left vertex.
    /// </summary>
    /// <param name="left">Index in left partition.</param>
    /// <returns>List of adjacent right vertex indices.</returns>
    public IReadOnlyList<int> GetNeighbors(int left) => _adjacency[left];

    /// <summary>
    /// Gets the total number of edges in the graph.
    /// </summary>
    public int EdgeCount => _adjacency.Sum(adj => adj.Count);

    /// <summary>
    /// Shuffles adjacency lists so that Hopcroft-Karp explores edges in random order,
    /// producing different valid matchings for different seeds.
    /// </summary>
    public void Shuffle(Random rng)
    {
        foreach (var adj in _adjacency)
        {
            // Fisher-Yates shuffle
            for (int i = adj.Count - 1; i > 0; i--)
            {
                int j = rng.Next(i + 1);
                (adj[i], adj[j]) = (adj[j], adj[i]);
            }
        }
    }
}
