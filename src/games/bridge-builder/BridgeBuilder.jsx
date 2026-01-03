import { useState } from "react";
import GameLayout from "../../layout/GameLayout";
import levels from "./levels";
import LevelSelect from "./LevelSelect";

const players = ["Red", "Blue", "Green"];

function BridgeBuilder({ onBack }) {
    const [levelIndex, setLevelIndex] = useState(null);
  const [grid, setGrid] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [bridgesUsed, setBridgesUsed] = useState(players.map(() => 0));
  const [won, setWon] = useState(false);

  if (levelIndex === null) {
    return (
      <LevelSelect
        onBack={onBack}
        onSelectLevel={(index) => {
          const level = levels[index];
          setLevelIndex(index);
          setGrid(level.grid);
          setCurrentPlayer(0);
          setBridgesUsed(players.map(() => 0));
          setWon(false);
        }}
      />
    );
  }

    const level = levels[levelIndex];
    

//   const [grid, setGrid] = useState(level.grid);
//   const [currentPlayer, setCurrentPlayer] = useState(0);
//   const [bridgesUsed, setBridgesUsed] = useState(
//     players.map(() => 0)
//   );
//   const [won, setWon] = useState(false);

function placeBridge(row, col) {
    if (won) return;
    if (grid[row][col] !== "R") return;
    if (bridgesUsed[currentPlayer] >= level.maxBridgesPerPlayer) return;

    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = "B";

    const newBridges = [...bridgesUsed];
    newBridges[currentPlayer]++;

    setGrid(newGrid);
    setBridgesUsed(newBridges);

    if (hasPath(newGrid)) {
      setWon(true);
    } else {
      setCurrentPlayer((currentPlayer + 1) % players.length);
    }
  }

  function nextTurn() {
    setCurrentPlayer((currentPlayer + 1) % players.length);
  }

  function nextLevel() {
    const nextIndex = levelIndex + 1;
  
    if (nextIndex < levels.length) {
      setLevelIndex(nextIndex);
      setGrid(level.grid);
      setBridgesUsed(players.map(() => 0));
      setCurrentPlayer(0);
      setWon(false);
    } else {
      alert("🎉 You completed all levels!");
setLevelIndex(null);
    }
  }
  
  function restart() {
    setGrid(level.grid);
    setCurrentPlayer(0);
    setBridgesUsed(players.map(() => 0));
    setWon(false);
  }
  

  return (
    <GameLayout
      title="Bridge Builder"
      currentPlayer={players[currentPlayer]}
      onBack={onBack}
    >
        <p>
  Level {level.id}: <b>{level.name}</b> ({level.difficulty})
</p>

      {won && (
        <div style={winStyle}>
          🎉 Bridge Completed!
        </div>
      )}

<div style={{ display: "grid", gap: "8px" }}>
        {grid.map((row, rIndex) => (
          <div key={rIndex} style={{ display: "flex", gap: "8px" }}>
            {row.map((cell, cIndex) => (
              <Cell
                key={cIndex}
                value={cell}
                onClick={() => placeBridge(rIndex, cIndex)}
              />
            ))}
          </div>
        ))}
      </div>

      <p>
        {players[currentPlayer]} bridges left:{" "}
        {level.maxBridgesPerPlayer - bridgesUsed[currentPlayer]}
      </p>

      {won && (
        <button onClick={restart} style={{ marginTop: "12px" }}>
          🔄 Restart Level
        </button>
      )}

    </GameLayout>
  );
}

function Cell({ value, onClick }) {
    const isRiver = value === "R";
    const isBridge = value === "B";
  
    const styles = {
      width: 60,
      height: 60,
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: isRiver ? "pointer" : "default",
      fontSize: "26px",
  
      background: isRiver
        ? "linear-gradient(135deg, #4da6ff, #6fbaff)"
        : isBridge
        ? "#c2a476"
        : "#7cc67c",
  
      backgroundSize: isRiver ? "200% 200%" : "100% 100%",
      animation: isRiver ? "wave 2.5s ease-in-out infinite" : "none",
  
      transition: "transform 0.25s ease",
      transform: isBridge ? "scale(1.1)" : "scale(1)"
    };
  
    return (
      <div style={styles} onClick={onClick}>
        {isBridge && "🧱"}
      </div>
    );
  }
  
  

  const winStyle = {
    padding: "12px",
    marginBottom: "12px",
    background: "linear-gradient(135deg, #d4f8d4, #a8e6cf)",
    borderRadius: "10px",
    textAlign: "center",
    fontSize: "20px",
    animation: "pop 0.5s ease"
  };
  

// --- PATH CHECK ---
function hasPath(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  const queue = [];

  for (let r = 0; r < rows; r++) {
    if (grid[r][0] !== "R") {
      queue.push([r, 0]);
      visited[r][0] = true;
    }
  }

  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  while (queue.length) {
    const [r, c] = queue.shift();
    if (c === cols - 1) return true;

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (
        nr >= 0 && nr < rows &&
        nc >= 0 && nc < cols &&
        !visited[nr][nc] &&
        grid[nr][nc] !== "R"
      ) {
        visited[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }
  return false;
}

export default BridgeBuilder;
