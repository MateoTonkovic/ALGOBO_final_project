import { useCallback, useEffect, useState } from "react";
import { Graph } from "./App";

export function useDijkstra(graph: Graph, start: string, exits: string[]) {
  const [path, setPath] = useState<string[]>([]);
  const [executionTime, setExecutionTime] = useState<number>(0);

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

  const dijkstra = useCallback(() => {
    const startTime = performance.now();
    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    const queue: [number, string][] = [];

    for (const node in graph) {
      distances[node] = node === start ? 0 : Infinity;
      previous[node] = null;
    }

    minHeapPush(queue, [0, start]);

    while (queue.length > 0) {
      const [currentDistance, currentNode] = minHeapPop(queue);
      if (currentDistance > distances[currentNode]) continue;

      if (exits.includes(currentNode)) {
        const pathToExit: string[] = [];
        let node = currentNode;
        while (node) {
          pathToExit.unshift(node);
          node = previous[node] as string;
        }
        setPath(pathToExit);
        setExecutionTime(performance.now() - startTime);
        return;
      }

      for (const neighbor in graph[currentNode]) {
        const distance = currentDistance + graph[currentNode][neighbor];
        if (distance < distances[neighbor]) {
          distances[neighbor] = distance;
          previous[neighbor] = currentNode;
          minHeapPush(queue, [distance, neighbor]);
        }
      }
    }
    setExecutionTime(performance.now() - startTime);
  }, [graph, start, exits]);

  useEffect(() => {
    dijkstra();
  }, [dijkstra]);

  return { path, executionTime };
}
