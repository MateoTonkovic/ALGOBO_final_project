import { useCallback } from "react";
import { Graph } from "../App";

export function useDijkstraWithEikonal(
  graph: Graph,
  start: string,
  exits: string[],
  velocityFunction: (node: string) => number,
  fireSources: string[],
  updateCallback: (
    currentPath: string[],
    visited: Set<string>,
    executionTime: number,
    newFireTimes?: { [key: string]: number }
  ) => void
) {
  const calculate = useCallback(() => {
    const startTime = performance.now();

    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    const fireTimes: { [key: string]: number } = {};
    let queue: [number, string][] = [];
    const visited: Set<string> = new Set();

    for (const node in graph) {
      distances[node] = Infinity;
      previous[node] = null;
      fireTimes[node] = Infinity;
    }

    distances[start] = 0;
    queue.push([0, start]);
    for (const source of fireSources) {
      fireTimes[source] = 0;
    }

    const updateFireTimes = () => {
      const fireQueue: [number, string][] = fireSources.map((source) => [
        0,
        source,
      ]);

      while (fireQueue.length > 0) {
        fireQueue.sort((a, b) => a[0] - b[0]);
        const [currentFireTime, currentNode] = fireQueue.shift()!;

        for (const neighbor in graph[currentNode]) {
          const travelTime =
            graph[currentNode][neighbor] / velocityFunction(neighbor);
          const newFireTime = currentFireTime + travelTime;

          if (newFireTime < fireTimes[neighbor]) {
            fireTimes[neighbor] = newFireTime;
            fireQueue.push([newFireTime, neighbor]);
          }
        }
      }
    };

    updateFireTimes(); 

    const processNextNode = () => {
      if (queue.length === 0) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        updateCallback([], visited, executionTime, fireTimes);
        return;
      }

      queue.sort((a, b) => a[0] - b[0]);
      const [currentDistance, currentNode] = queue.shift()!;

      if (visited.has(currentNode)) {
        setTimeout(processNextNode, 0);
        return;
      }
      visited.add(currentNode);

      if (exits.includes(currentNode)) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        const path: string[] = [];
        let node: string | null = currentNode;
        while (node) {
          path.unshift(node);
          node = previous[node];
        }
        updateCallback(path, new Set(visited), executionTime, fireTimes);
        return;
      }

      for (const neighbor in graph[currentNode]) {
        const velocity = velocityFunction(neighbor);
        const travelTime = graph[currentNode][neighbor] / velocity;
        const arrivalTime = currentDistance + travelTime;

        if (arrivalTime >= fireTimes[neighbor]) continue;

        const tentativeDistance = currentDistance + travelTime;
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

      updateCallback(path, new Set(visited), executionTime, fireTimes);

      setTimeout(processNextNode, 50);
    };

    processNextNode();
  }, [graph, start, exits, fireSources, velocityFunction, updateCallback]);

  return { calculate };
}
