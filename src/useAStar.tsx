import { useState, useCallback, useEffect } from "react";
import { Graph } from "./App";

export function useAStar(
  graph: Graph,
  start: string,
  exits: string[],
  nodePositions: { [key: string]: { x: number; y: number } }
) {
  const [path, setPath] = useState<string[]>([]);
  const [executionTime, setExecutionTime] = useState<number>(0);

  function calculateHeuristic(
    current: { x: number; y: number } | undefined,
    goal: { x: number; y: number } | undefined
  ): number {
    if (!current || !goal) {
      console.error("Node positions missing for:", { current, goal });
      return Infinity;
    }

    return Math.abs(goal.x - current.x) + Math.abs(goal.y - current.y);
  }

  const minHeapPush = (heap: [number, string][], node: [number, string]) => {
    heap.push(node);
    let i = heap.length - 1;

    while (i > 0) {
      const parentIdx = Math.floor((i - 1) / 2);
      if (heap[i][0] >= heap[parentIdx][0]) break;
      [heap[i], heap[parentIdx]] = [heap[parentIdx], heap[i]];
      i = parentIdx;
    }
  };

  const minHeapPop = (heap: [number, string][]) => {
    if (heap.length === 1) return heap.pop()!;
    const top = heap[0];

    heap[0] = heap.pop()!;

    let i = 0;

    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;
      if (left < heap.length && heap[left][0] < heap[smallest][0]) {
        smallest = left;
      }
      if (right < heap.length && heap[right][0] < heap[smallest][0]) {
        smallest = right;
      }
      if (smallest === i) break;

      [heap[i], heap[smallest]] = [heap[smallest], heap[i]];

      i = smallest;
    }
    return top;
  };

  const aStar = useCallback(() => {
    const startTime = performance.now();

    const openSet: [number, string][] = []; 
    const cameFrom: { [key: string]: string | null } = {};

    const gScore: { [key: string]: number } = {};
    const fScore: { [key: string]: number } = {};

    for (const node in graph) {
      gScore[node] = Infinity;
      fScore[node] = Infinity;
    }

    gScore[start] = 0;
    fScore[start] = calculateHeuristic(
      nodePositions[start],
      nodePositions[exits[0]]
    );

    minHeapPush(openSet, [fScore[start], start]);

    while (openSet.length > 0) {
      const [, current] = minHeapPop(openSet);

      if (exits.includes(current)) {
        const pathToExit: string[] = [];
        let node: string | null = current;
        while (node) {
          pathToExit.unshift(node);
          node = cameFrom[node];
        }
        setPath(pathToExit);
        setExecutionTime(performance.now() - startTime);
        return;
      }

      for (const neighbor in graph[current]) {
        const tentativeGScore = gScore[current] + graph[current][neighbor];

        if (tentativeGScore < gScore[neighbor]) {
          cameFrom[neighbor] = current;
          gScore[neighbor] = tentativeGScore;
          fScore[neighbor] =
            gScore[neighbor] +
            calculateHeuristic(
              nodePositions[neighbor],
              nodePositions[exits[0]]
            );

          minHeapPush(openSet, [fScore[neighbor], neighbor]);
        }
      }
    }

    setPath([]);
    setExecutionTime(performance.now() - startTime);
  }, [graph, start, exits, nodePositions]);

  useEffect(() => {
    aStar();
  }, [aStar]);

  return { path, executionTime };
}
