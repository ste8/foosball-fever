import { BipartiteGraph, NIL, INF } from './bipartiteGraph.js';

export function hopcroftKarp(graph: BipartiteGraph): Map<number, number> {
  const pairLeft = new Array<number>(graph.leftCount).fill(NIL);
  const pairRight = new Array<number>(graph.rightCount).fill(NIL);
  const dist = new Array<number>(graph.leftCount + 1); // +1 for NIL sentinel

  function bfs(): boolean {
    const queue: number[] = [];

    for (let u = 0; u < graph.leftCount; u++) {
      if (pairLeft[u] === NIL) {
        dist[u] = 0;
        queue.push(u);
      } else {
        dist[u] = INF;
      }
    }

    dist[graph.leftCount] = INF; // NIL sentinel

    let head = 0;
    while (head < queue.length) {
      const u = queue[head++];

      if (dist[u] < dist[graph.leftCount]) {
        for (const v of graph.getNeighbors(u)) {
          const uPrime = pairRight[v];
          const distIndex = uPrime === NIL ? graph.leftCount : uPrime;

          if (dist[distIndex] === INF) {
            dist[distIndex] = dist[u] + 1;
            if (uPrime !== NIL) {
              queue.push(uPrime);
            }
          }
        }
      }
    }

    return dist[graph.leftCount] !== INF;
  }

  function dfs(u: number): boolean {
    if (u === NIL) return true;

    for (const v of graph.getNeighbors(u)) {
      const uPrime = pairRight[v];
      const distIndex = uPrime === NIL ? graph.leftCount : uPrime;

      if (dist[distIndex] === dist[u] + 1) {
        if (dfs(uPrime === NIL ? NIL : uPrime)) {
          pairRight[v] = u;
          pairLeft[u] = v;
          return true;
        }
      }
    }

    dist[u] = INF;
    return false;
  }

  while (bfs()) {
    for (let u = 0; u < graph.leftCount; u++) {
      if (pairLeft[u] === NIL) {
        dfs(u);
      }
    }
  }

  const matching = new Map<number, number>();
  for (let u = 0; u < graph.leftCount; u++) {
    if (pairLeft[u] !== NIL) {
      matching.set(u, pairLeft[u]);
    }
  }

  return matching;
}
