const NIL = -1;
const INF = Infinity;

export { NIL, INF };

export class BipartiteGraph {
  readonly leftCount: number;
  readonly rightCount: number;
  private readonly adjacency: number[][];

  constructor(leftCount: number, rightCount: number) {
    this.leftCount = leftCount;
    this.rightCount = rightCount;
    this.adjacency = Array.from({ length: leftCount }, () => []);
  }

  addEdge(left: number, right: number): void {
    this.adjacency[left].push(right);
  }

  getNeighbors(left: number): readonly number[] {
    return this.adjacency[left];
  }

  shuffle(nextRandom: () => number): void {
    for (const adj of this.adjacency) {
      for (let i = adj.length - 1; i > 0; i--) {
        const j = Math.floor(nextRandom() * (i + 1));
        const tmp = adj[i];
        adj[i] = adj[j];
        adj[j] = tmp;
      }
    }
  }
}
