import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Tooltip,
} from "@mui/material";
import { useEffect, useState } from "react";
import Vertex from "./Components/Vertex";
import { graphHelper } from "./grafHelper";
import { useDijkstra } from "./useDijkstra";

export type Graph = { [key: string]: { [key: string]: number } };

export default function App() {
  const [apexsAmounts, setApexesAmount] = useState<number>(10);
  const [graphData, setGraphData] = useState<{
    graph: Graph;
    nodePositions: { [key: string]: { x: number; y: number } };
    gridSize: number;
  } | null>(null);
  const [start, setStart] = useState<string>("");
  const [exits, setExits] = useState<string[]>([]);
  const [showPath, setShowPath] = useState(true);
  const [path, setPath] = useState<string[]>([]);

  const { path: dijkstraPath, executionTime } = useDijkstra(
    graphData ? graphData.graph : {},
    start,
    exits
  );

  useEffect(() => {
    const { graph, nodePositions, gridSize } =
      graphHelper.generateBuildingGraph(apexsAmounts);
    setGraphData({ graph, nodePositions, gridSize });

    const vertices = Object.keys(graph);
    setStart(vertices[0]);
    setExits([vertices[vertices.length - 1]]);
  }, [apexsAmounts]);

  if (!graphData) return <div>Loading...</div>;

  const { graph, nodePositions, gridSize } = graphData;

  const getNodeBackgroundColor = (vertex: string) => {
    if (vertex === start) return "blue";
    if (exits.includes(vertex)) return "green";
    if (showPath && path.includes(vertex)) return "yellow";
    return "gray";
  };

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

  const handleShowPath = () => {
    setPath(dijkstraPath);
    setShowPath(true);
  };

  const handleResetPath = () => {
    setShowPath(false);
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
          </div>

          <div
            style={{
              position: "relative",
              width: `${gridSize * 100}px`,
              height: `${gridSize * 100}px`,
              margin: "0 auto",
            }}
          >
            {Object.keys(graph).map((vertex) => {
              const { x, y } = nodePositions[vertex];
              return (
                <div
                  key={vertex}
                  style={{
                    position: "absolute",
                    width: "80px",
                    height: "80px",
                    border: "2px solid black",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    left: `${x * 100}px`,
                    top: `${y * 100}px`,
                    backgroundColor: getNodeBackgroundColor(vertex),
                  }}
                >
                  <Vertex vertex={vertex} />
                </div>
              );
            })}

            {Object.keys(graph).map((vertex) => {
              const { x: x1, y: y1 } = nodePositions[vertex];
              return Object.keys(graph[vertex]).map((neighbor) => {
                const { x: x2, y: y2 } = nodePositions[neighbor];
                const weight = graph[vertex][neighbor];
                if (vertex < neighbor) {
                  const xOffset = 40;
                  const yOffset = 40;
                  const xStart = x1 * 100 + xOffset;
                  const yStart = y1 * 100 + yOffset;
                  const xEnd = x2 * 100 + xOffset;
                  const yEnd = y2 * 100 + yOffset;
                  return (
                    <>
                      <svg
                        key={`${vertex}-${neighbor}`}
                        style={{ position: "absolute", left: 0, top: 0 }}
                        width={gridSize * 100}
                        height={gridSize * 100}
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
              <Button
                color="success"
                variant="contained"
                onClick={handleShowPath}
              >
                Dijkstra
              </Button>
              <Tooltip title="Todavía no está :/">
                <span>
                  <Button color="success" variant="contained" disabled>
                    A*
                  </Button>
                </span>
              </Tooltip>
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
        <h3 style={{ color: "black" }}>Tiempo de Ejecución:</h3>
        <p style={{ color: "black" }}>{`Dijkstra: ${executionTime} ms`}</p>
        <p style={{ color: "black" }}>{`A*: 🤌`}</p>
      </Box>
    </div>
  );
}
