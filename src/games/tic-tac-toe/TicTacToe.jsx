import { useState } from "react";
import GameLayout from "../../layout/GameLayout";
import styles from "../../styles/TicTacToe.module.css";
import btnStyles from "../../styles/Button.module.css";
import inputStyles from "../../styles/Input.module.css";

function TicTacToe({ onBack }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState(["", ""]);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [scores, setScores] = useState({ 0: 0, 1: 0, draws: 0 });
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [isDraw, setIsDraw] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const symbols = ["❌", "⭕"];

  function handlePlayerNameChange(index, value) {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  }

  function startGame() {
    const validPlayers = players.filter(name => name.trim() !== "");
    if (validPlayers.length < 2) {
      alert("Please enter both player names!");
      return;
    }
    setPlayers(validPlayers);
    setGameStarted(true);
  }

  function checkWinner(board) {
    const lines = [
      [0, 1, 2], // Top row
      [3, 4, 5], // Middle row
      [6, 7, 8], // Bottom row
      [0, 3, 6], // Left column
      [1, 4, 7], // Middle column
      [2, 5, 8], // Right column
      [0, 4, 8], // Diagonal
      [2, 4, 6], // Diagonal
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line };
      }
    }

    // Check for draw
    if (board.every(cell => cell !== null)) {
      return { winner: "draw", line: [] };
    }

    return null;
  }

  function handleCellClick(index) {
    if (board[index] || winner || isDraw) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayerIndex;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      if (result.winner === "draw") {
        setIsDraw(true);
        setScores({ ...scores, draws: scores.draws + 1 });
      } else {
        setWinner(result.winner);
        setWinningLine(result.line);
        setScores({
          ...scores,
          [result.winner]: scores[result.winner] + 1,
        });
      }
    } else {
      setCurrentPlayerIndex(currentPlayerIndex === 0 ? 1 : 0);
    }
  }

  function resetBoard() {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine([]);
    setIsDraw(false);
    setCurrentPlayerIndex(0);
  }

  function resetGame() {
    setGameStarted(false);
    setPlayers(["", ""]);
    setBoard(Array(9).fill(null));
    setCurrentPlayerIndex(0);
    setScores({ 0: 0, 1: 0, draws: 0 });
    setWinner(null);
    setWinningLine([]);
    setIsDraw(false);
  }

  // Player Setup Screen
  if (!gameStarted) {
    return (
      <GameLayout title="⭕❌ Tic-Tac-Toe - Player Setup" onBack={onBack}>
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>
            Enter player names to begin. Take turns placing your symbols to get three in a row!
          </p>

          {/* Game Rules */}
          <div className={styles.rulesSection}>
            <button
              onClick={() => setShowRules(!showRules)}
              className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${btnStyles.btnSmall}`}
            >
              📖 {showRules ? "Hide Rules" : "Show Rules"}
            </button>
            {showRules && (
              <div className={styles.rulesContent}>
                <h4>How to Play:</h4>
                <ul>
                  <li>Players take turns placing their symbol (❌ or ⭕) on the 3x3 grid</li>
                  <li>The first player to get 3 of their symbols in a row wins</li>
                  <li>Rows can be horizontal, vertical, or diagonal</li>
                  <li>If all 9 squares are filled without a winner, it's a draw</li>
                  <li>Play multiple rounds and track your scores!</li>
                </ul>
              </div>
            )}
          </div>

          {players.map((player, index) => (
            <div key={index} className={styles.playerInputRow}>
              <span className={styles.playerLabel}>
                Player {index + 1} ({symbols[index]}):
              </span>
              <input
                type="text"
                value={player}
                onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                placeholder="Enter name"
                className={inputStyles.input}
                style={{ flex: 1 }}
              />
            </div>
          ))}

          <div className={styles.setupButtons}>
            <button
              onClick={startGame}
              className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`}
            >
              Start Game
            </button>
          </div>
        </div>
      </GameLayout>
    );
  }

  // Game Screen
  return (
    <GameLayout
      title="⭕❌ Tic-Tac-Toe"
      currentPlayer={winner !== null || isDraw ? null : players[currentPlayerIndex]}
      onBack={onBack}
    >
      <div className={styles.gameContainer}>
        {/* Game Rules Toggle */}
        <div className={styles.rulesToggle}>
          <button
            onClick={() => setShowRules(!showRules)}
            className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${btnStyles.btnSmall}`}
          >
            📖 {showRules ? "Hide" : "Rules"}
          </button>
          {showRules && (
            <div className={styles.rulesContentSmall}>
              <strong>Goal:</strong> Get 3 symbols in a row (horizontal, vertical, or diagonal) to win!
            </div>
          )}
        </div>

        {/* Scoreboard */}
        <div className={styles.scoreboard}>
          <div className={styles.scoreItem}>
            <span className={styles.playerName}>
              {symbols[0]} {players[0]}
            </span>
            <span className={styles.playerScore}>{scores[0]}</span>
          </div>
          <div className={styles.scoreItem}>
            <span className={styles.drawLabel}>Draws</span>
            <span className={styles.playerScore}>{scores.draws}</span>
          </div>
          <div className={styles.scoreItem}>
            <span className={styles.playerName}>
              {symbols[1]} {players[1]}
            </span>
            <span className={styles.playerScore}>{scores[1]}</span>
          </div>
        </div>

        {/* Current Turn Indicator */}
        {!winner && !isDraw && (
          <div className={styles.turnIndicator}>
            <p className={styles.turnText}>
              Current Turn: <span className={styles.currentPlayerBadge}>
                {symbols[currentPlayerIndex]} {players[currentPlayerIndex]}
              </span>
            </p>
          </div>
        )}

        {/* Game Board */}
        <div className={styles.board}>
          {board.map((cell, index) => (
            <div
              key={index}
              className={`${styles.cell} ${
                cell !== null ? styles.cellFilled : ""
              } ${
                winningLine.includes(index) ? styles.cellWinning : ""
              }`}
              onClick={() => handleCellClick(index)}
            >
              {cell !== null && (
                <span className={`${styles.symbol} ${cell === 0 ? styles.symbolX : styles.symbolO}`}>
                  {symbols[cell]}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Winner/Draw Message */}
        {winner !== null && (
          <div className={styles.resultCard}>
            <h2 className={styles.resultTitle}>
              🏆 {players[winner]} Wins!
            </h2>
            <button
              onClick={resetBoard}
              className={`${btnStyles.btn} ${btnStyles.btnSuccess} ${btnStyles.btnLarge}`}
            >
              Play Again
            </button>
          </div>
        )}

        {isDraw && (
          <div className={styles.resultCard}>
            <h2 className={styles.resultTitle}>🤝 It's a Draw!</h2>
            <button
              onClick={resetBoard}
              className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`}
            >
              Play Again
            </button>
          </div>
        )}

        {/* Reset Game Button */}
        <div className={styles.resetButtonContainer}>
          <button
            onClick={resetGame}
            className={`${btnStyles.btn} ${btnStyles.btnSecondary}`}
          >
            New Game
          </button>
        </div>
      </div>
    </GameLayout>
  );
}

export default TicTacToe;
