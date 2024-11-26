import { Graph } from "./App";

export default function calculateFireTimes(
  graph: Graph,
  fireSources: string[],
  velocityFunction: (node: string) => number
): Promise<{ [key: string]: number }> {
  return new Promise((resolve) => {
    const fireTimes: { [key: string]: number } = {};
    const queue: [number, string, number][] = [];
    const fireSlowdownFactor = 20;
    const maxDepth = 3;

    for (const node in graph) {
      fireTimes[node] = Infinity;
    }

    for (const source of fireSources) {
      fireTimes[source] = 0;
      queue.push([0, source, 0]);
    }

    const processNextNode = () => {
      if (queue.length === 0) {
        resolve(fireTimes);
        return;
      }

      queue.sort((a, b) => a[0] - b[0]);
      const [currentFireTime, currentNode, currentDepth] = queue.shift()!;

      if (currentDepth >= maxDepth) {
        setTimeout(processNextNode, 50);
        return;
      }

      for (const neighbor in graph[currentNode]) {
        const baseTravelTime =
          graph[currentNode][neighbor] / velocityFunction(neighbor);
        const adjustedTravelTime = baseTravelTime * fireSlowdownFactor;
        const newFireTime = currentFireTime + adjustedTravelTime;
        const neighborDepth = currentDepth + 1;

        if (newFireTime < fireTimes[neighbor]) {
          fireTimes[neighbor] = newFireTime;
          queue.push([newFireTime, neighbor, neighborDepth]);
        }
      }

      setTimeout(processNextNode, 50);
    };

    processNextNode();
  });
}
