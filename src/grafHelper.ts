function generateBuildingGraph(numApexs: number) {
  const apexs: string[] = [];

  for (let i = 0; i < numApexs; i++) {
    apexs.push(`V${i}`);
  }

  const graph: { [key: string]: { [key: string]: number } } = {};
  apexs.forEach((vertex) => {
    graph[vertex] = {};
  });

  const columns = 10; 
  const rows = Math.ceil(numApexs / columns); 

  const nodePositions: { [key: string]: { x: number; y: number } } = {};

  apexs.forEach((vertex, index) => {
    const x = index % columns; 
    const y = Math.floor(index / columns); 
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

      if (nx >= 0 && ny >= 0 && nx < columns && ny < rows) {
        const neighborVertex = apexs[ny * columns + nx];
        const isWall = Math.random() < 0.3;
        if (neighborVertex && !isWall && !(neighborVertex in graph[vertex])) {
          const weight = Math.floor(Math.random() * 10) + 1;
          graph[vertex][neighborVertex] = weight;
          graph[neighborVertex][vertex] = weight;
        }
      }
    }
  });

  return { graph, nodePositions, gridSize: { rows, columns } };
}

export const graphHelper = {
  generateBuildingGraph,
};
