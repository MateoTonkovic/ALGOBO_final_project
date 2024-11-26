import { useCallback } from "react";
import { Graph } from "../App";
import { timeoutTime } from "../constants";

export function useAStarWithEikonal(
  graph: Graph,
  start: string,
  exits: string[],
  velocityFunction: (node: string) => number,
  fireSources: string[],
  nodePositions: { [key: string]: { x: number; y: number } },
  updateCallback: (
    currentPath: string[],
    visited: Set<string>,
    executionTime: number,
    newFireTimes?: { [key: string]: number }
  ) => void,
  isCalculatingRef: React.MutableRefObject<boolean>
) {
  const calculate = useCallback(() => {
    if (isCalculatingRef.current) {
      console.log("El algoritmo ya está en ejecución");
      return;
    }
    isCalculatingRef.current = true;

    const startTime = performance.now();

    const fireTimes: { [key: string]: number } = {};
    const openSet: Set<string> = new Set([start]);
    const cameFrom: { [key: string]: string | null } = {};
    const gScore: { [key: string]: number } = {};
    const fScore: { [key: string]: number } = {};
    const visited: Set<string> = new Set();

    for (const node in graph) {
      gScore[node] = Infinity;
      fScore[node] = Infinity;
      fireTimes[node] = Infinity;
    }

    const heuristicCostEstimate = (node: string): number => {
      const exitPositions = exits.map((exit) => nodePositions[exit]);
      const nodePosition = nodePositions[node];

      const distances = exitPositions.map(
        (exitPos) =>
          Math.abs(nodePosition.x - exitPos.x) +
          Math.abs(nodePosition.y - exitPos.y)
      );
      return Math.min(...distances);
    };

    gScore[start] = 0;
    fScore[start] = heuristicCostEstimate(start);

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
      if (openSet.size === 0) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        updateCallback([], visited, executionTime, fireTimes);
        isCalculatingRef.current = false;
        return;
      }

      let current = "";
      let minFScore = Infinity;
      for (const node of openSet) {
        if (fScore[node] < minFScore) {
          minFScore = fScore[node];
          current = node;
        }
      }

      if (exits.includes(current)) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        const path: string[] = [];
        let node: string | null = current;
        while (node) {
          path.unshift(node);
          node = cameFrom[node];
        }

        updateCallback(path, new Set(visited), executionTime, fireTimes);
        isCalculatingRef.current = false;
        return;
      }

      openSet.delete(current);
      visited.add(current);

      for (const neighbor in graph[current]) {
        if (visited.has(neighbor)) continue;

        const velocity = velocityFunction(neighbor);
        const travelTime = graph[current][neighbor] / velocity;
        const tentativeGScore = gScore[current] + travelTime;

        if (tentativeGScore >= fireTimes[neighbor]) continue;

        if (tentativeGScore < gScore[neighbor]) {
          cameFrom[neighbor] = current;
          gScore[neighbor] = tentativeGScore;
          fScore[neighbor] = tentativeGScore + heuristicCostEstimate(neighbor);
          openSet.add(neighbor);
        }
      }

      const path: string[] = [];
      let tempNode: string | null = current;
      while (tempNode) {
        path.unshift(tempNode);
        tempNode = cameFrom[tempNode];
      }
      const currentTime = performance.now();
      const executionTime = currentTime - startTime;

      updateCallback(path, new Set(visited), executionTime, fireTimes);

      setTimeout(processNextNode, timeoutTime);
    };

    processNextNode();
  }, [
    graph,
    start,
    exits,
    fireSources,
    nodePositions,
    velocityFunction,
    updateCallback,
    isCalculatingRef,
  ]);

  return { calculate };
}
