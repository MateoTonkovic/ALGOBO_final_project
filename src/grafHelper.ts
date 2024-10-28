function generateBuildingGraph(numApexs: number) {
  const apexs: string[] = [];
  //   const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 0; i < numApexs; i++) {
    apexs.push(`V${i}`);
  }

  const graph: { [key: string]: { [key: string]: number } } = {};
  apexs.forEach((vertex) => {
    graph[vertex] = {};
  });

  const gridSize = Math.ceil(Math.sqrt(numApexs));

  const nodePositions: { [key: string]: { x: number; y: number } } = {};

  apexs.forEach((vertex, index) => {
    const x = index % gridSize;
    const y = Math.floor(index / gridSize);
    nodePositions[vertex] = { x, y };
  });

  apexs.forEach((vertex) => {
    const { x, y } = nodePositions[vertex];

    const directions = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
    ];

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      if (nx >= 0 && ny >= 0 && nx < gridSize && ny < gridSize) {
        const neighborVertex = apexs[ny * gridSize + nx];
        const isWall = Math.random() < 0.3;
        if (neighborVertex && !isWall && !(neighborVertex in graph[vertex])) {
          const weight = Math.floor(Math.random() * 10) + 1;
          graph[vertex][neighborVertex] = weight;
          graph[neighborVertex][vertex] = weight;
        }
      }
    }
  });

  return { graph, nodePositions, gridSize };
}

export const graphHelper = {
  generateBuildingGraph,
};
