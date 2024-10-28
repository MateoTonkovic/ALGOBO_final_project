const style = {
  zIndex: 3,
  backgroundColor: "red",
  padding: "0.5rem",
  borderRadius: "50%",
};

function Vertex({ vertex }: { vertex: string }) {
  return <p style={style}>{vertex}</p>;
}

export default Vertex;
