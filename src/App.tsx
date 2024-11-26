import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
} from "@mui/material";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Vertex from "./Components/Vertex";
import { graphHelper } from "./grafHelper";
import { useDijkstra } from "./hooks/useDijkstra";
import { useAStar } from "./hooks/useAStar";
import { useDijkstraWithEikonal } from "./hooks/useDijkstraWithEikonal";
import { useAStarWithEikonal } from "./hooks/useAStarWithEikonal";
import calculateFireTimes from "./Eikonal.helper";

export type Graph = { [key: string]: { [key: string]: number } };

export default function App() {
  const [apexsAmounts, setApexesAmount] = useState<number>(10);
  const [graphData, setGraphData] = useState<{
    graph: Graph;
    nodePositions: { [key: string]: { x: number; y: number } };
    gridSize: { rows: number; columns: number };
  } | null>(null);
  const [start, setStart] = useState<string>("");
  const [exits, setExits] = useState<string[]>([]);
  const [algorithm, setAlgorithm] = useState("Dijkstra");
  const [fireTimes, setFireTimes] = useState<{ [key: string]: number }>({});
  const [fireSources, setFireSources] = useState<string[]>([]);
  const [path, setPath] = useState<string[]>([]);
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
  const isCalculating = useRef(false);

  const [executionTime, setExecutionTime] = useState<number>(0);

  const velocityFunction = useCallback((node: string) => 0.0001, []);

  const handlePathUpdate = (
    currentPath: string[],
    visited: Set<string>,
    newExecutionTime: number,
    newFireTimes?: { [key: string]: number }
  ) => {
    setPath(currentPath);
    setVisitedNodes(visited);
    setExecutionTime(newExecutionTime || 0);
    if (newFireTimes) setFireTimes(newFireTimes);
  };

  const { calculate: calculateDijkstra } = useDijkstra(
    graphData?.graph!,
    start,
    exits,
    handlePathUpdate
  );
  const { calculate: calculateAStar } = useAStar(
    graphData?.graph!,
    start,
    exits,
    graphData?.nodePositions!,
    handlePathUpdate
  );
  const { calculate: calculateDijkstraWithEikonal } = useDijkstraWithEikonal(
    graphData?.graph!,
    start,
    exits,
    velocityFunction,
    fireSources,
    handlePathUpdate
  );
  const { calculate: calculateAStarWithEikonal } = useAStarWithEikonal(
    graphData?.graph!,
    start,
    exits,
    velocityFunction,
    fireSources,
    graphData?.nodePositions!,
    handlePathUpdate,
    isCalculating
  );

  useEffect(() => {
    if (!graphData?.graph) return;

    if (
      algorithm === "Dijkstra with Eikonal" &&
      Object.keys(fireTimes).length === 0
    ) {
      return;
    }

    switch (algorithm) {
      case "Dijkstra":
        calculateDijkstra();
        break;
      case "A*":
        calculateAStar();
        break;
      case "Dijkstra with Eikonal":
        calculateDijkstraWithEikonal();
        break;
      case "A* with Eikonal":
        calculateAStarWithEikonal();
        break;
      default:
        break;
    }
  }, [
    algorithm,
    graphData?.graph,
    start,
    exits,
    fireSources,
    graphData?.nodePositions,
    velocityFunction,
  ]);

  const getNodeBackgroundColor = useCallback(
    (vertex: string) => {
      if (vertex === start) return "blue";
      if (exits.includes(vertex)) return "green";
      if (path.includes(vertex)) return "purple";
      if (visitedNodes.has(vertex)) return "yellow";
      if (fireSources.length > 0 && fireTimes[vertex] === 0) return "red";
      if (fireSources.length > 0 && fireTimes[vertex] < Infinity) {
        const maxFireTime = Math.max(
          ...Object.values(fireTimes).filter((t) => t < Infinity)
        );
        const normalizedFireTime = fireTimes[vertex] / maxFireTime;
        const alpha = Math.pow(1 - normalizedFireTime, 2);
        return `rgba(255, 69, 0, ${alpha})`;
      }
      return "gray";
    },
    [start, exits, path, visitedNodes, fireSources, fireTimes]
  );

  const handleStartChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStart(event.target.value);
  };

  const handleExitsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const exitsArray = event.target.value.split(",").map((exit) => exit.trim());
    setExits(exitsArray);
  };

  const handleChangeApexsAmount = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const numApexs = isNaN(parseInt(event.target.value))
      ? 10
      : parseInt(event.target.value);

    setApexesAmount(numApexs);
  };

  const handleFireSourcesChange = (input: string) => {
    if (input.trim() === "") {
      setFireSources([]);
    } else {
      const sources = input.split(",").map((source) => source.trim());
      setFireSources(sources);
    }
  };

  useEffect(() => {
    const { graph, nodePositions, gridSize } =
      graphHelper.generateBuildingGraph(apexsAmounts);
    setGraphData({ graph, nodePositions, gridSize });

    const vertices = Object.keys(graph);
    setStart(vertices[0]);
    setExits([vertices[vertices.length - 1]]);
  }, [apexsAmounts]);

  useEffect(() => {
    if (!graphData || fireSources.length === 0) {
      setFireTimes({});
      return;
    }

    const computeFireTimes = async () => {
      const fires = await calculateFireTimes(
        graphData.graph,
        fireSources,
        velocityFunction
      );
      setFireTimes(fires);
    };

    computeFireTimes();
  }, [graphData?.graph, fireSources, velocityFunction]);

  const cellSize = 80;

  if (!graphData) return <div>Loading...</div>;

  const handleResetPath = () => {
    setStart("V0");
    setExits(["V10"]);
    setFireSources([]);
    setExecutionTime(0);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100vw",
      }}
    >
      <Card style={{ maxWidth: "1200px" }}>
        <CardHeader>
          <h1>Salidas de emergencia</h1>
        </CardHeader>
        <CardContent>
          <div style={{ marginBottom: "20px", display: "flex", gap: "1rem" }}>
            <TextField
              label="Ubicación actual"
              value={start}
              onChange={handleStartChange}
              variant="outlined"
              fullWidth
              size="small"
              style={{ marginBottom: "10px" }}
            />
            <TextField
              label="Salidas (Separar por coma)"
              value={exits.join(",")}
              onChange={handleExitsChange}
              variant="outlined"
              size="small"
              fullWidth
            />
            <TextField
              label="Número de habitaciones"
              value={apexsAmounts}
              variant="outlined"
              size="small"
              onChange={handleChangeApexsAmount}
              fullWidth
            />
            <TextField
              label="Focos de Incendio (Separar por coma)"
              placeholder="Ej: V0,V10"
              onChange={(e) => handleFireSourcesChange(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
            />
          </div>

          <div
            style={{
              position: "relative",
              width: `${10 * cellSize}px`,
              height: `${graphData.gridSize.rows * cellSize}px`,
              margin: "0 auto",
              overflow: "auto",
            }}
          >
            {Object.keys(graphData.graph).map((vertex) => {
              const { x, y } = graphData.nodePositions[vertex];
              return (
                <div
                  key={vertex}
                  style={{
                    position: "absolute",
                    width: `${cellSize - 10}px`,
                    height: `${cellSize - 10}px`,
                    border: "2px solid black",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    left: `${x * cellSize}px`,
                    top: `${y * cellSize}px`,
                    backgroundColor: getNodeBackgroundColor(vertex),
                  }}
                >
                  <Vertex vertex={vertex} />
                </div>
              );
            })}

            {Object.keys(graphData.graph).map((vertex) => {
              const { x: x1, y: y1 } = graphData.nodePositions[vertex];
              return Object.keys(graphData.graph[vertex]).map((neighbor) => {
                const { x: x2, y: y2 } = graphData.nodePositions[neighbor];
                const weight = graphData.graph[vertex][neighbor];
                if (vertex < neighbor) {
                  const xOffset = cellSize / 2;
                  const yOffset = cellSize / 2;
                  const xStart = x1 * cellSize + xOffset;
                  const yStart = y1 * cellSize + yOffset;
                  const xEnd = x2 * cellSize + xOffset;
                  const yEnd = y2 * cellSize + yOffset;
                  return (
                    <>
                      <svg
                        key={`${vertex}-${neighbor}`}
                        style={{ position: "absolute", left: 0, top: 0 }}
                        width={10 * cellSize}
                        height={graphData.gridSize.rows * cellSize}
                      >
                        <line
                          x1={xStart}
                          y1={yStart}
                          x2={xEnd}
                          y2={yEnd}
                          stroke="black"
                          strokeWidth={2}
                        />
                      </svg>
                      <div
                        key={`${vertex}-${neighbor}-weight`}
                        style={{
                          position: "absolute",
                          left: `${(xStart + xEnd) / 2 - 5}px`,
                          top: `${(yStart + yEnd) / 2 - 10}px`,
                          backgroundColor: "orange",
                          color: "white",
                          padding: "2px",
                          borderRadius: "5px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {weight}
                      </div>
                    </>
                  );
                }
                return null;
              });
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
            <Button variant="contained" color="error" onClick={handleResetPath}>
              Resetear
            </Button>
            <div style={{ display: "flex", gap: "1rem" }}>
              <Button onClick={() => setAlgorithm("Dijkstra")}>Dijkstra</Button>
              <Button onClick={() => setAlgorithm("A*")}>A*</Button>
              <Button onClick={() => setAlgorithm("Dijkstra with Eikonal")}>
                Dijkstra + Fuego
              </Button>
              <Button onClick={() => setAlgorithm("A* with Eikonal")}>
                A* + Fuego
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Box
        sx={{
          position: "absolute",
          top: "2%",
          right: "2%",
          width: 200,
          bgcolor: "white",
          boxShadow: 24,
          p: 2,
          borderRadius: "10px",
        }}
      >
        <Box>
          <h3 style={{ color: "black" }}>Tiempo de Ejecución:</h3>
          <p style={{ color: "black" }}>{`${algorithm}: ${
            executionTime || 0
          } ms`}</p>
        </Box>
      </Box>
    </div>
  );
}
