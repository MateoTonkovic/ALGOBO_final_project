import { Graph } from "../App";
import { timeoutTime } from "../constants";

export function useDijkstra(
  graph: Graph,
  start: string,
  exits: string[],
  updateCallback: (
    currentPath: string[],
    visited: Set<string>,
    executionTime: number
  ) => void
) {
  const calculate = () => {
    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    const queue: [number, string][] = [];
    const visited: Set<string> = new Set();

    let startTime: number;
    let endTime: number;

    for (const node in graph) {
      distances[node] = Infinity;
      previous[node] = null;
    }
    distances[start] = 0;
    queue.push([0, start]);

    const processNextNode = () => {
      if (queue.length === 0) {
        endTime = performance.now();
        const executionTime = endTime - startTime;
        updateCallback([], visited, executionTime);
        return;
      }

      queue.sort((a, b) => a[0] - b[0]);
      const [currentDistance, currentNode] = queue.shift()!;

      if (visited.has(currentNode)) {
        setTimeout(processNextNode, timeoutTime);
        return;
      }

      visited.add(currentNode);

      if (exits.includes(currentNode)) {
        endTime = performance.now();
        const executionTime = endTime - startTime;
        const path: string[] = [];
        let node: string | null = currentNode;

        while (node) {
          path.unshift(node);
          node = previous[node];
        }

        updateCallback(path, new Set(visited), executionTime);
        return;
      }

      for (const neighbor in graph[currentNode]) {
        const tentativeDistance =
          currentDistance + graph[currentNode][neighbor];

        if (tentativeDistance < distances[neighbor]) {
          distances[neighbor] = tentativeDistance;
          previous[neighbor] = currentNode;
          queue.push([tentativeDistance, neighbor]);
        }
      }

      const path: string[] = [];
      let node: string | null = currentNode;
      while (node) {
        path.unshift(node);
        node = previous[node];
      }

      const currentTime = performance.now();
      const executionTime = currentTime - startTime;

      updateCallback(path, new Set(visited), executionTime);

      setTimeout(processNextNode, timeoutTime);
    };

    startTime = performance.now();
    processNextNode();
  };

  return { calculate };
}
