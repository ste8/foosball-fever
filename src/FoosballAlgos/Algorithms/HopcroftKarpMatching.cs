namespace FoosballAlgos.Algorithms;

/// <summary>
/// Implements the Hopcroft-Karp algorithm for maximum bipartite matching.
/// Time complexity: O(E * sqrt(V)) where E is edges and V is vertices.
/// </summary>
internal sealed class HopcroftKarpMatching
{
    private BipartiteGraph _graph = null!;
    private int[] _pairLeft = null!;   // pairLeft[u] = matched right vertex (or NIL)
    private int[] _pairRight = null!;  // pairRight[v] = matched left vertex (or NIL)
    private int[] _dist = null!;       // Distance labels for BFS

    /// <summary>
    /// Finds a maximum cardinality matching in the bipartite graph.
    /// </summary>
    /// <param name="graph">The bipartite graph to find matching in.</param>
    /// <param name="ct">Cancellation token for early termination.</param>
    /// <returns>
    /// Dictionary mapping left vertex indices to matched right vertex indices.
    /// Returns null if cancelled.
    /// </returns>
    public Dictionary<int, int>? FindMaximumMatching(
        BipartiteGraph graph,
        CancellationToken ct = default)
    {
        _graph = graph;

        // Initialize matching (all vertices unmatched)
        _pairLeft = new int[graph.LeftCount];
        _pairRight = new int[graph.RightCount];
        _dist = new int[graph.LeftCount + 1]; // +1 for NIL sentinel index

        Array.Fill(_pairLeft, BipartiteGraph.Nil);
        Array.Fill(_pairRight, BipartiteGraph.Nil);

        // Main loop: while augmenting paths exist
        while (Bfs(ct))
        {
            if (ct.IsCancellationRequested)
                return null;

            // For each unmatched left vertex, try to find augmenting path
            for (int u = 0; u < graph.LeftCount; u++)
            {
                if (ct.IsCancellationRequested)
                    return null;

                if (_pairLeft[u] == BipartiteGraph.Nil)
                {
                    Dfs(u);
                }
            }
        }

        if (ct.IsCancellationRequested)
            return null;

        // Build result dictionary
        var matching = new Dictionary<int, int>();
        for (int u = 0; u < graph.LeftCount; u++)
        {
            if (_pairLeft[u] != BipartiteGraph.Nil)
            {
                matching[u] = _pairLeft[u];
            }
        }

        return matching;
    }

    /// <summary>
    /// Checks if a perfect matching exists (all left vertices matched).
    /// </summary>
    /// <param name="graph">The bipartite graph.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if a perfect matching exists, false otherwise, null if cancelled.</returns>
    public bool? HasPerfectMatching(BipartiteGraph graph, CancellationToken ct = default)
    {
        var matching = FindMaximumMatching(graph, ct);
        if (matching == null)
            return null; // Cancelled

        return matching.Count == graph.LeftCount && matching.Count == graph.RightCount;
    }

    /// <summary>
    /// BFS phase: builds level graph and checks for augmenting paths.
    /// Returns true if at least one augmenting path exists.
    /// </summary>
    private bool Bfs(CancellationToken ct)
    {
        var queue = new Queue<int>();

        // Initialize distances: unmatched left vertices start at distance 0
        for (int u = 0; u < _graph.LeftCount; u++)
        {
            if (_pairLeft[u] == BipartiteGraph.Nil)
            {
                _dist[u] = 0;
                queue.Enqueue(u);
            }
            else
            {
                _dist[u] = BipartiteGraph.Infinity;
            }
        }

        // Distance to NIL (sentinel for unmatched right vertices)
        // Index _graph.LeftCount is used for NIL
        _dist[_graph.LeftCount] = BipartiteGraph.Infinity;

        while (queue.Count > 0)
        {
            if (ct.IsCancellationRequested)
                return false;

            int u = queue.Dequeue();

            // Only explore if we haven't found shortest path to NIL yet
            if (_dist[u] < _dist[_graph.LeftCount])
            {
                foreach (int v in _graph.GetNeighbors(u))
                {
                    // Get the left vertex currently matched to v (or use NIL index)
                    int uPrime = _pairRight[v];
                    int distIndex = uPrime == BipartiteGraph.Nil
                        ? _graph.LeftCount  // NIL index
                        : uPrime;

                    if (_dist[distIndex] == BipartiteGraph.Infinity)
                    {
                        _dist[distIndex] = _dist[u] + 1;

                        if (uPrime != BipartiteGraph.Nil)
                        {
                            queue.Enqueue(uPrime);
                        }
                    }
                }
            }
        }

        // Return true if we found a path to an unmatched right vertex
        return _dist[_graph.LeftCount] != BipartiteGraph.Infinity;
    }

    /// <summary>
    /// DFS phase: finds and augments along shortest augmenting path.
    /// Returns true if an augmenting path was found starting from u.
    /// </summary>
    private bool Dfs(int u)
    {
        if (u == BipartiteGraph.Nil)
            return true;

        foreach (int v in _graph.GetNeighbors(u))
        {
            int uPrime = _pairRight[v];
            int distIndex = uPrime == BipartiteGraph.Nil
                ? _graph.LeftCount
                : uPrime;

            // Follow edge if it leads to next level in BFS tree
            if (_dist[distIndex] == _dist[u] + 1)
            {
                int nextU = uPrime == BipartiteGraph.Nil ? BipartiteGraph.Nil : uPrime;
                if (Dfs(nextU))
                {
                    // Augment: add (u, v) to matching
                    _pairRight[v] = u;
                    _pairLeft[u] = v;
                    return true;
                }
            }
        }

        // No augmenting path found through u; mark as dead end
        _dist[u] = BipartiteGraph.Infinity;
        return false;
    }
}
