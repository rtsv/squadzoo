import { useState } from "react";
import GameLayout from "../../layout/GameLayout";
import styles from "../../styles/Battleship.module.css";
import btnStyles from "../../styles/Button.module.css";
import inputStyles from "../../styles/Input.module.css";

const GRID_SIZE = 8; // Reduced from 10 to 8
const SHIPS = [
  { name: "Battleship", size: 4, icon: "🚢" },
  { name: "Cruiser", size: 3, icon: "⚓" },
  { name: "Destroyer", size: 2, icon: "⛵" },
];

function Battleship({ onBack }) {
  const [gamePhase, setGamePhase] = useState("setup"); // setup, placement, battle, gameover
  const [players, setPlayers] = useState(["", ""]);
  const [currentSetupPlayer, setCurrentSetupPlayer] = useState(0);
  const [currentBattlePlayer, setCurrentBattlePlayer] = useState(0);
  const [showRules, setShowRules] = useState(false);
  
  // Player boards: null = empty, 'ship' = ship placed, 'hit' = ship hit, 'miss' = missed shot
  const [playerBoards, setPlayerBoards] = useState([
    Array(GRID_SIZE * GRID_SIZE).fill(null),
    Array(GRID_SIZE * GRID_SIZE).fill(null),
  ]);
  
  // Track which ships are placed for each player
  const [playerShips, setPlayerShips] = useState([[], []]);
  
  // Current ship being placed
  const [placingShip, setPlacingShip] = useState(0);
  const [shipOrientation, setShipOrientation] = useState("horizontal");
  const [hoverCells, setHoverCells] = useState([]);
  
  // Battle phase
  const [shotsFired, setShotsFired] = useState([[], []]);
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ 0: 0, 1: 0 });

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
    setGamePhase("placement");
  }

  function getShipCells(startIndex, ship, orientation) {
    const cells = [];
    const row = Math.floor(startIndex / GRID_SIZE);
    const col = startIndex % GRID_SIZE;

    for (let i = 0; i < ship.size; i++) {
      if (orientation === "horizontal") {
        if (col + i >= GRID_SIZE) return null; // Out of bounds
        cells.push(startIndex + i);
      } else {
        if (row + i >= GRID_SIZE) return null; // Out of bounds
        cells.push(startIndex + i * GRID_SIZE);
      }
    }

    // Check if cells are already occupied
    const board = playerBoards[currentSetupPlayer];
    for (let cell of cells) {
      if (board[cell] !== null) return null;
    }

    return cells;
  }

  function handleCellHover(index) {
    if (gamePhase !== "placement" || placingShip >= SHIPS.length) return;
    
    const ship = SHIPS[placingShip];
    const cells = getShipCells(index, ship, shipOrientation);
    setHoverCells(cells || []);
  }

  function handleShipPlacement(index) {
    if (gamePhase !== "placement" || placingShip >= SHIPS.length) return;

    const ship = SHIPS[placingShip];
    const cells = getShipCells(index, ship, shipOrientation);

    if (!cells) return; // Invalid placement

    // Place the ship
    const newBoards = [...playerBoards];
    const newShips = [...playerShips];
    
    cells.forEach(cell => {
      newBoards[currentSetupPlayer][cell] = "ship";
    });

    newShips[currentSetupPlayer].push({
      ...ship,
      cells,
      hits: [],
    });

    setPlayerBoards(newBoards);
    setPlayerShips(newShips);
    setPlacingShip(placingShip + 1);
    setHoverCells([]);

    // Check if all ships are placed
    if (placingShip + 1 >= SHIPS.length) {
      if (currentSetupPlayer === 0) {
        // Move to player 2 setup
        setCurrentSetupPlayer(1);
        setPlacingShip(0);
      } else {
        // Start battle
        setGamePhase("battle");
        setCurrentBattlePlayer(0);
      }
    }
  }

  function handleFire(index) {
    if (gamePhase !== "battle") return;

    const opponentIndex = currentBattlePlayer === 0 ? 1 : 0;
    const opponentBoard = playerBoards[opponentIndex];

    // Check if already fired at this cell
    const alreadyFired = shotsFired[currentBattlePlayer].includes(index);
    if (alreadyFired) return;

    const newShotsFired = [...shotsFired];
    newShotsFired[currentBattlePlayer].push(index);
    setShotsFired(newShotsFired);

    const newBoards = [...playerBoards];
    const newShips = [...playerShips];

    if (opponentBoard[index] === "ship") {
      // Hit!
      newBoards[opponentIndex][index] = "hit";
      
      // Update ship hits
      const ship = newShips[opponentIndex].find(s => s.cells.includes(index));
      if (ship) {
        ship.hits.push(index);
      }

      setPlayerBoards(newBoards);
      setPlayerShips(newShips);

      // Check if all ships are destroyed
      const allShipsDestroyed = newShips[opponentIndex].every(
        ship => ship.hits.length === ship.size
      );

      if (allShipsDestroyed) {
        setWinner(currentBattlePlayer);
        setGamePhase("gameover");
        setScores({
          ...scores,
          [currentBattlePlayer]: scores[currentBattlePlayer] + 1,
        });
        return;
      }
    } else {
      // Miss
      newBoards[opponentIndex][index] = "miss";
      setPlayerBoards(newBoards);
    }

    // Switch turns
    setCurrentBattlePlayer(opponentIndex);
  }

  function resetGame() {
    setGamePhase("setup");
    setPlayers(["", ""]);
    setCurrentSetupPlayer(0);
    setCurrentBattlePlayer(0);
    setPlayerBoards([
      Array(GRID_SIZE * GRID_SIZE).fill(null),
      Array(GRID_SIZE * GRID_SIZE).fill(null),
    ]);
    setPlayerShips([[], []]);
    setPlacingShip(0);
    setShipOrientation("horizontal");
    setHoverCells([]);
    setShotsFired([[], []]);
    setWinner(null);
  }

  function playAgain() {
    setCurrentSetupPlayer(0);
    setCurrentBattlePlayer(0);
    setPlayerBoards([
      Array(GRID_SIZE * GRID_SIZE).fill(null),
      Array(GRID_SIZE * GRID_SIZE).fill(null),
    ]);
    setPlayerShips([[], []]);
    setPlacingShip(0);
    setShipOrientation("horizontal");
    setHoverCells([]);
    setShotsFired([[], []]);
    setWinner(null);
    setGamePhase("placement");
  }

  // Player Setup Screen
  if (gamePhase === "setup") {
    return (
      <GameLayout title="🚢 Battleship - Player Setup" onBack={onBack}>
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>
            Place ships and sink your opponent's fleet!
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
                  <li><strong>Setup Phase:</strong> Each player places 3 ships on their 8x8 grid</li>
                  <li>Ships: Battleship (4 cells), Cruiser (3 cells), Destroyer (2 cells)</li>
                  <li>Click the rotate button to change ship orientation (horizontal/vertical)</li>
                  <li><strong>Battle Phase:</strong> Take turns firing at opponent's grid</li>
                  <li>💥 = Hit a ship, 💨 = Missed</li>
                  <li>Sink all enemy ships to win!</li>
                  <li>Your ships are hidden from your opponent</li>
                </ul>
              </div>
            )}
          </div>

          {players.map((player, index) => (
            <div key={index} className={styles.playerInputRow}>
              <span className={styles.playerLabel}>
                Player {index + 1}:
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

  // Ship Placement Screen
  if (gamePhase === "placement") {
    const currentShip = SHIPS[placingShip];
    
    return (
      <GameLayout 
        title={`🚢 Battleship - ${players[currentSetupPlayer]}'s Turn`}
        currentPlayer={players[currentSetupPlayer]}
        onBack={onBack}
      >
        <div className={styles.placementContainer}>
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
                <strong>Tip:</strong> Place your ships strategically! Click rotate to change direction, then click the grid to place.
              </div>
            )}
          </div>

          <div className={styles.placementHeader}>
            <h3 className={styles.placementTitle}>
              Place your ships on the grid
            </h3>
            {placingShip < SHIPS.length && (
              <div className={styles.currentShipInfo}>
                <span className={styles.shipIcon}>{currentShip.icon}</span>
                <span className={styles.shipName}>{currentShip.name}</span>
                <span className={styles.shipSize}>({currentShip.size} cells)</span>
              </div>
            )}
          </div>

          {placingShip < SHIPS.length && (
            <div className={styles.orientationControl}>
              <button
                onClick={() => setShipOrientation(shipOrientation === "horizontal" ? "vertical" : "horizontal")}
                className={`${btnStyles.btn} ${btnStyles.btnSecondary}`}
              >
                Rotate Ship ({shipOrientation === "horizontal" ? "→" : "↓"})
              </button>
            </div>
          )}

          <div className={styles.gridContainer}>
            <div className={styles.gridLabels}>
              <div className={styles.cornerLabel}></div>
              {Array.from({ length: GRID_SIZE }, (_, i) => (
                <div key={i} className={styles.colLabel}>{i + 1}</div>
              ))}
            </div>
            <div className={styles.gridWithRowLabels}>
              <div className={styles.rowLabels}>
                {Array.from({ length: GRID_SIZE }, (_, i) => (
                  <div key={i} className={styles.rowLabel}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className={styles.grid}>
                {playerBoards[currentSetupPlayer].map((cell, index) => (
                  <div
                    key={index}
                    className={`${styles.cell} ${
                      cell === "ship" ? styles.cellShip : ""
                    } ${
                      hoverCells.includes(index) ? styles.cellHover : ""
                    }`}
                    onMouseEnter={() => handleCellHover(index)}
                    onMouseLeave={() => setHoverCells([])}
                    onClick={() => handleShipPlacement(index)}
                  >
                    {cell === "ship" && <span className={styles.shipMarker}>🚢</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.shipsToPlace}>
            <h4 className={styles.shipsToPlaceTitle}>Ships to Place:</h4>
            <div className={styles.shipsList}>
              {SHIPS.map((ship, index) => (
                <div
                  key={index}
                  className={`${styles.shipItem} ${
                    index < placingShip ? styles.shipPlaced : ""
                  } ${
                    index === placingShip ? styles.shipActive : ""
                  }`}
                >
                  <span className={styles.shipItemIcon}>{ship.icon}</span>
                  <span className={styles.shipItemName}>{ship.name}</span>
                  <span className={styles.shipItemSize}>({ship.size})</span>
                  {index < placingShip && <span className={styles.checkMark}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </GameLayout>
    );
  }

  // Battle Screen
  if (gamePhase === "battle" || gamePhase === "gameover") {
    const opponentIndex = currentBattlePlayer === 0 ? 1 : 0;
    const opponentBoard = playerBoards[opponentIndex];
    
    return (
      <GameLayout
        title="🚢 Battleship - Battle"
        currentPlayer={gamePhase === "battle" ? players[currentBattlePlayer] : null}
        onBack={onBack}
      >
        <div className={styles.battleContainer}>
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
                <strong>Battle:</strong> Click a cell to fire! 💥 = Hit, 💨 = Miss. Sink all ships to win!
              </div>
            )}
          </div>

          {/* Scoreboard */}
          <div className={styles.scoreboard}>
            <div className={styles.scoreItem}>
              <span className={styles.playerName}>{players[0]}</span>
              <span className={styles.playerScore}>{scores[0]}</span>
            </div>
            <div className={styles.scoreItem}>
              <span className={styles.playerName}>{players[1]}</span>
              <span className={styles.playerScore}>{scores[1]}</span>
            </div>
          </div>

          {gamePhase === "battle" && (
            <div className={styles.battleInfo}>
              <p className={styles.battleText}>
                {players[currentBattlePlayer]}, select a cell to fire at!
              </p>
            </div>
          )}

          {/* Opponent's Board (Hidden ships) */}
          <div className={styles.boardSection}>
            <h3 className={styles.boardTitle}>
              {gamePhase === "gameover" ? `${players[opponentIndex]}'s Board` : "Fire at opponent"}
            </h3>
            <div className={styles.gridContainer}>
              <div className={styles.gridLabels}>
                <div className={styles.cornerLabel}></div>
                {Array.from({ length: GRID_SIZE }, (_, i) => (
                  <div key={i} className={styles.colLabel}>{i + 1}</div>
                ))}
              </div>
              <div className={styles.gridWithRowLabels}>
                <div className={styles.rowLabels}>
                  {Array.from({ length: GRID_SIZE }, (_, i) => (
                    <div key={i} className={styles.rowLabel}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className={styles.grid}>
                  {opponentBoard.map((cell, index) => {
                    const isFired = shotsFired[currentBattlePlayer].includes(index);
                    const isHit = cell === "hit";
                    const isMiss = cell === "miss";
                    const showShip = gamePhase === "gameover" && cell === "ship";
                    
                    return (
                      <div
                        key={index}
                        className={`${styles.cell} ${
                          isFired ? styles.cellFired : ""
                        } ${
                          isHit ? styles.cellHit : ""
                        } ${
                          isMiss ? styles.cellMiss : ""
                        } ${
                          showShip ? styles.cellShip : ""
                        } ${
                          !isFired && gamePhase === "battle" ? styles.cellClickable : ""
                        }`}
                        onClick={() => handleFire(index)}
                      >
                        {isHit && <span className={styles.hitMarker}>💥</span>}
                        {isMiss && <span className={styles.missMarker}>💨</span>}
                        {showShip && <span className={styles.shipMarker}>🚢</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Ships Status */}
          <div className={styles.shipsStatus}>
            <h4 className={styles.shipsStatusTitle}>
              {players[opponentIndex]}'s Fleet:
            </h4>
            <div className={styles.shipsList}>
              {playerShips[opponentIndex].map((ship, index) => {
                const isDestroyed = ship.hits.length === ship.size;
                return (
                  <div
                    key={index}
                    className={`${styles.shipItem} ${
                      isDestroyed ? styles.shipDestroyed : ""
                    }`}
                  >
                    <span className={styles.shipItemIcon}>{ship.icon}</span>
                    <span className={styles.shipItemName}>{ship.name}</span>
                    <div className={styles.shipHealth}>
                      {Array.from({ length: ship.size }, (_, i) => (
                        <span
                          key={i}
                          className={`${styles.healthDot} ${
                            i < ship.hits.length ? styles.healthDotHit : ""
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Game Over */}
          {gamePhase === "gameover" && (
            <div className={styles.resultCard}>
              <h2 className={styles.resultTitle}>
                🏆 {players[winner]} Wins!
              </h2>
              <p className={styles.resultText}>
                All enemy ships have been destroyed!
              </p>
              <div className={styles.resultButtons}>
                <button
                  onClick={playAgain}
                  className={`${btnStyles.btn} ${btnStyles.btnSuccess} ${btnStyles.btnLarge}`}
                >
                  Play Again
                </button>
                <button
                  onClick={resetGame}
                  className={`${btnStyles.btn} ${btnStyles.btnSecondary}`}
                >
                  New Game
                </button>
              </div>
            </div>
          )}
        </div>
      </GameLayout>
    );
  }

  return null;
}

export default Battleship;
