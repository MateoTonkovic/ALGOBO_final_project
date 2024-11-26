import { Graph } from "../App";

export function useAStar(
  graph: Graph,
  start: string,
  exits: string[],
  nodePositions: { [key: string]: { x: number; y: number } },
  updateCallback: (
    currentPath: string[],
    visited: Set<string>,
    executionTime: number 
  ) => void
) {
  const calculate = () => {
    const startTime = performance.now();

    const openSet: Set<string> = new Set([start]);
    const cameFrom: { [key: string]: string | null } = {};
    const gScore: { [key: string]: number } = {};
    const fScore: { [key: string]: number } = {};
    const visited: Set<string> = new Set();

    for (const node in graph) {
      gScore[node] = Infinity;
      fScore[node] = Infinity;
    }

    gScore[start] = 0;
    fScore[start] = 0;

    const processNextNode = () => {
      if (openSet.size === 0) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        updateCallback([], visited, executionTime);
        return;
      }

      const current = Array.from(openSet).reduce((a, b) =>
        fScore[a] < fScore[b] ? a : b
      );

      if (exits.includes(current)) {
        const endTime = performance.now(); 
        const executionTime = endTime - startTime;
        const path: string[] = [];
        let node: string | null = current;

        while (node) {
          path.unshift(node);
          node = cameFrom[node];
        }

        updateCallback(path, visited, executionTime);
        return;
      }

      openSet.delete(current);
      visited.add(current);


      for (const neighbor in graph[current]) {
        const tentativeGScore = gScore[current] + graph[current][neighbor];

        if (tentativeGScore < gScore[neighbor]) {
          cameFrom[neighbor] = current;
          gScore[neighbor] = tentativeGScore;

          const heuristic =
            Math.abs(nodePositions[neighbor].x - nodePositions[exits[0]].x) +
            Math.abs(nodePositions[neighbor].y - nodePositions[exits[0]].y);

          fScore[neighbor] = gScore[neighbor] + heuristic;

          if (!visited.has(neighbor)) {
            openSet.add(neighbor);
          }
        }
      }

      updateCallback([], visited, 0);

      setTimeout(processNextNode, 50);
    };

    processNextNode();
  };

  return { calculate };
}
