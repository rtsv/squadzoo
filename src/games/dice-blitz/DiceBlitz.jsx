import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import GameLayout from "../../layout/GameLayout";
import GameModeSelector from "../../components/GameModeSelector";
import OnlineRoomSetup from "../../components/OnlineRoomSetup";
import OnlineRoomExample from "../../components/OnlineRoomExample";
import PlayerNameInput from "../../components/PlayerNameInput";
import GameRules from "../../components/GameRules";
import CustomAlert from "../../components/CustomAlert";
import VoiceChat from "../../components/VoiceChat";
import roomService from "../../services/roomService";
import MatchHistorySidebar from "../../components/MatchHistorySidebar";
import btnStyles from "../../styles/Button.module.css";
import styles from "../../styles/DiceBlitz.module.css";

// ====== CONSTANTS ======
const GRID_SIZE = 3;
const PLAYER_COLORS = [
  { id: "red", hex: "#e53e3e", label: "Red", emoji: "🔴" },
  { id: "blue", hex: "#3182ce", label: "Blue", emoji: "🔵" },
  { id: "green", hex: "#38a169", label: "Green", emoji: "🟢" },
  { id: "yellow", hex: "#d69e2e", label: "Yellow", emoji: "🟡" },
];

// ====== HELPER FUNCTIONS ======
const generateGrid = () => {
  const grid = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    const row = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      row.push({
        value: Math.floor(Math.random() * 6) + 1,
        isCrossed: false,
        id: Math.random().toString(36).substr(2, 9),
      });
    }
    grid.push(row);
  }
  return grid;
};

const checkWin = (grid) => {
  return grid.flat().every((cell) => cell.isCrossed);
};

// ====== COMPONENT ======
function DiceBlitz({ onBack, initialRoomCode, onGameStart, isPlayMode = false }) {
  const location = useLocation();
  const gameState = location.state || {};

  // ====== FLOW STATE ======
  const [gameMode, setGameMode] = useState(isPlayMode ? (gameState.gameMode || "local") : null);
  const [gameStarted, setGameStarted] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Setup
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState(["", ""]);

  // Online
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [myPlayerIndex, setMyPlayerIndex] = useState(null);

  // ====== GAME STATE ======
  const [grids, setGrids] = useState([]); // Array of 3x3 grids
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [winner, setWinner] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [lastAction, setLastAction] = useState(null);

  // Refs for closure-safe access
  const gridsRef = useRef([]);
  const currentPlayerRef = useRef(0);
  const diceValueRef = useRef(1);

  useEffect(() => { gridsRef.current = grids; }, [grids]);
  useEffect(() => { currentPlayerRef.current = currentPlayerIndex; }, [currentPlayerIndex]);
  useEffect(() => { diceValueRef.current = diceValue; }, [diceValue]);

  // ====== SOUNDS ======
  const playDiceSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }, []);

  const playStrikeSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }, []);

  // ====== ONLINE HANDLERS ======
  const handleRemoteGameStart = useCallback((payload) => {
    const { players, initialGrids, numPlayers: np } = payload;
    setPlayerNames(players);
    setNumPlayers(np);
    setGrids(initialGrids);
    setCurrentPlayerIndex(0);
    setDiceValue(1);
    setWinner(null);
    setGameOver(false);
    setWaitingForPlayers(false);
    setGameStarted(true);
    const myIdx = players.indexOf(roomService.playerName);
    setMyPlayerIndex(myIdx);
    if (onGameStart && !isPlayMode) onGameStart();
  }, [onGameStart, isPlayMode]);

  const handleRemoteDiceRoll = useCallback((payload) => {
    const { roll } = payload;
    setIsRolling(true);
    playDiceSound();
    setTimeout(() => {
      setDiceValue(roll);
      setIsRolling(false);
      // Auto-apply attack for binary results
      applyAttack(roll);
    }, 1000);
  }, []);

  const handleRemoteAttack = useCallback((payload) => {
    const { grids: newGrids, nextPlayer, lastAction: msg, winner: w, gameOver: go } = payload;
    setGrids(newGrids);
    setCurrentPlayerIndex(nextPlayer);
    setLastAction(msg);
    if (w !== null) {
      setWinner(w);
      setGameOver(go);
      setScores(prev => {
        const s = [...prev];
        s[w]++;
        return s;
      });
      setMatchHistory(prev => [...prev, { winner: w, date: Date.now() }]);
    }
  }, []);

  useEffect(() => {
    if (!isOnlineMode || !isInRoom) return;

    const handleError = (msg) => setAlertMessage(msg);
    const handlePlayerJoined = () => setConnectedPlayers([...roomService.getConnectedPlayers()]);
    const handlePlayerLeft = (data) => {
      setConnectedPlayers([...roomService.getConnectedPlayers()]);
      if (gameStarted) {
        setAlertMessage(`${data.playerName || "A player"} disconnected!`);
        setTimeout(() => handleBackToMenu(), 3000);
      }
    };

    const handleGameAction = (data) => {
      switch (data.action) {
        case "game-start": handleRemoteGameStart(data.payload); break;
        case "dice-roll": handleRemoteDiceRoll(data.payload); break;
        case "apply-attack": handleRemoteAttack(data.payload); break;
        case "restart-game":
          setGameStarted(false);
          setWaitingForPlayers(true);
          setWinner(null);
          setGameOver(false);
          setAlertMessage("Game restarted!");
          break;
      }
    };

    roomService.on("onError", handleError);
    roomService.on("onPlayerJoined", handlePlayerJoined);
    roomService.on("onPlayerLeft", handlePlayerLeft);
    roomService.on("onGameAction", handleGameAction);

    return () => {
      if (roomService.isConnected()) roomService.leaveRoom();
    };
  }, [isOnlineMode, isInRoom, gameStarted, handleRemoteGameStart, handleRemoteDiceRoll, handleRemoteAttack]);

  // ====== CORE LOGIC ======
  const applyAttack = (roll) => {
    const currentIdx = currentPlayerRef.current;
    const currentGrids = [...gridsRef.current];
    let hitFound = false;
    let eliminatedIndices = [];

    // Attack all opponents
    currentGrids.forEach((grid, idx) => {
      if (idx === currentIdx) return;
      
      let gridHit = false;
      const newGrid = grid.map(row => 
        row.map(cell => {
          if (cell.value === roll && !cell.isCrossed) {
            hitFound = true;
            gridHit = true;
            return { ...cell, isCrossed: true };
          }
          return cell;
        })
      );
      
      currentGrids[idx] = newGrid;
      if (gridHit) playStrikeSound();
    });

    const winIdx = currentGrids.findIndex((g, i) => i !== currentIdx && checkWin(g));
    const nextPlayer = (currentIdx + 1) % grids.length;
    const actionMsg = hitFound ? `${playerNames[currentIdx]} struck the grids with a ${roll}!` : `${playerNames[currentIdx]} rolled a ${roll} but missed!`;

    if (isOnlineMode && isHost) {
      // Host usually manages the transition in non-authoritative shared apps, 
      // but here we let the actor decide to keep latency low.
    }

    setGrids(currentGrids);
    setLastAction(actionMsg);

    if (winIdx !== -1) {
      // The person who cleared an opponent wins!
      setWinner(currentIdx);
      setGameOver(true);
      setScores(prev => {
        const s = [...prev];
        s[currentIdx]++;
        return s;
      });
      setMatchHistory(prev => [...prev, { winner: currentIdx, date: Date.now() }]);
    } else {
      setTimeout(() => {
        setCurrentPlayerIndex(nextPlayer);
        setDiceValue(1);
      }, 1500);
    }

    if (isOnlineMode && myPlayerIndex === currentIdx) {
      roomService.sendGameAction("apply-attack", {
        grids: currentGrids,
        nextPlayer,
        lastAction: actionMsg,
        winner: winIdx !== -1 ? currentIdx : null,
        gameOver: winIdx !== -1
      });
    }
  };

  const rollDice = () => {
    if (isRolling || gameOver) return;
    if (isOnlineMode && myPlayerIndex !== currentPlayerIndex) return;

    setIsRolling(true);
    playDiceSound();

    if (isOnlineMode) {
      const roll = Math.floor(Math.random() * 6) + 1;
      roomService.sendGameAction("dice-roll", { roll });
      // Local sync
      setTimeout(() => {
        setDiceValue(roll);
        setIsRolling(false);
        applyAttack(roll);
      }, 1000);
    } else {
      setTimeout(() => {
        const roll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(roll);
        setIsRolling(false);
        applyAttack(roll);
      }, 1000);
    }
  };

  // ====== SETUP FUNCTIONS ======
  const handleBackToMenu = () => {
    if (roomService.isConnected()) roomService.leaveRoom();
    setGameMode(null);
    setGameStarted(false);
    setIsOnlineMode(false);
    setIsInRoom(false);
    setGrids([]);
    setWinner(null);
    setGameOver(false);
    setAlertMessage(null);
  };

  const startLocalGame = () => {
    if (playerNames.some(n => !n.trim())) {
      setAlertMessage("Please enter all player names!");
      return;
    }
    const initialGrids = Array(numPlayers).fill(null).map(() => generateGrid());
    setGrids(initialGrids);
    setGameStarted(true);
    if (onGameStart && !isPlayMode) onGameStart();
  };

  const handleCreateOnlineRoom = async () => {
    if (!playerName.trim()) { setAlertMessage("Enter your name!"); return; }
    try {
      roomService.playerName = playerName;
      const { roomCode: code } = await roomService.createRoom();
      setRoomCode(code);
      setIsHost(true);
      setIsInRoom(true);
      setWaitingForPlayers(true);
      setConnectedPlayers(roomService.getConnectedPlayers());
    } catch (e) { setAlertMessage("Failed to create room."); }
  };

  const handleJoinOnlineRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) { setAlertMessage("Enter name and code!"); return; }
    try {
      roomService.playerName = playerName;
      await roomService.joinRoom(roomCode);
      setIsInRoom(true);
      setWaitingForPlayers(true);
      setConnectedPlayers(roomService.getConnectedPlayers());
    } catch (e) { setAlertMessage("Room not found."); }
  };

  const handleStartOnlineGame = () => {
    const names = connectedPlayers.map(p => p.playerName);
    const np = names.length;
    const initialGrids = Array(np).fill(null).map(() => generateGrid());
    roomService.sendGameAction("game-start", {
      players: names,
      initialGrids,
      numPlayers: np
    });
    setPlayerNames(names);
    setNumPlayers(np);
    setGrids(initialGrids);
    setGameStarted(true);
    setIsHost(true);
  };

  // ====== RENDER ======
  if (!gameMode) {
    return (
      <GameModeSelector
        onSelect={(mode) => {
          setGameMode(mode);
          if (mode === "online") setIsOnlineMode(true);
        }}
        onBack={onBack}
      />
    );
  }

  if (isOnlineMode && !isInRoom) {
    return (
      <OnlineRoomSetup
        playerName={playerName}
        setPlayerName={setPlayerName}
        roomCode={roomCode}
        setRoomCode={setRoomCode}
        onCreateRoom={handleCreateOnlineRoom}
        onJoinRoom={handleJoinOnlineRoom}
        onBack={() => setGameMode(null)}
      />
    );
  }

  if (isOnlineMode && waitingForPlayers) {
    return (
      <OnlineRoomExample
        roomCode={roomCode}
        connectedPlayers={connectedPlayers}
        isHost={isHost}
        onStart={handleStartOnlineGame}
        onBack={handleBackToMenu}
      />
    );
  }

  if (!gameStarted && !isOnlineMode) {
    return (
      <div className={styles.container}>
        <PlayerNameInput
          numPlayers={numPlayers}
          setNumPlayers={setNumPlayers}
          playerNames={playerNames}
          setPlayerNames={setPlayerNames}
          onStart={startLocalGame}
          onBack={() => setGameMode(null)}
          maxPlayers={4}
        />
      </div>
    );
  }

  const gameRules = [
    "Each player has a 3x3 grid of random numbers (1-6).",
    "Take turns rolling a single die.",
    "If you roll a number, that number is 'crossed out' on ALL your opponents' grids.",
    "The first player to completely clear any opponent's grid wins the game!",
    "Strategy: Hope for rolls that clear multiple cells on your target opponent's grid."
  ];

  return (
    <GameLayout
      onBack={handleBackToMenu}
      gameTitle="Dice Blitz"
      sidebar={
        <>
          <MatchHistorySidebar
            scores={scores}
            playerNames={playerNames}
            matchHistory={matchHistory}
          />
          <GameRules rules={gameRules} />
          {isOnlineMode && <VoiceChat roomCode={roomCode} />}
        </>
      }
    >
      <div className={styles.container}>
        <div className={styles.gameHeader}>
          <h1 className={styles.title}>Dice Blitz</h1>
          <p className={styles.subtitle}>Eliminate the enemy grids!</p>
          {lastAction && <div className={styles.turnBanner}>{lastAction}</div>}
        </div>

        <div className={styles.gridsContainer}>
          {grids.map((grid, pIdx) => (
            <div 
              key={pIdx} 
              className={`${styles.playerCard} ${pIdx === currentPlayerIndex ? styles.activePlayer : ""}`}
              style={{ opacity: gameOver && winner !== pIdx ? 0.6 : 1 }}
            >
              <div className={styles.playerName}>
                {PLAYER_COLORS[pIdx].emoji} {playerNames[pIdx]}
              </div>
              <div className={styles.grid}>
                {grid.map((row, rIdx) => 
                  row.map((cell, cIdx) => (
                    <div key={cell.id} className={`${styles.cell} ${cell.isCrossed ? styles.crossed : ""}`}>
                      {cell.value}
                      {cell.isCrossed && (
                        <div className={styles.crossOverlay}>❌</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.controls}>
          <div className={styles.diceWrapper} onClick={rollDice}>
            <div className={`${styles.dice} ${isRolling ? styles.diceRolling : ""}`}>
              <div className={`${styles.diceFace} ${styles[`face${diceValue}`]}`}>
                <div className={styles.dotContainer}>
                  {[...Array(diceValue)].map((_, i) => (
                    <div key={i} className={styles.dot} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <button 
            className={styles.rollButton}
            onClick={rollDice}
            disabled={isRolling || (isOnlineMode && myPlayerIndex !== currentPlayerIndex) || gameOver}
          >
            {isRolling ? "Rolling..." : "Roll Dice"}
          </button>

          {!gameOver && (
            <div className={styles.turnBanner}>
              {playerNames[currentPlayerIndex]}'s Turn
            </div>
          )}
        </div>

        {gameOver && (
          <div className={styles.winnerOverlay}>
            <h2 className={styles.winnerTitle}>{playerNames[winner]} Wins! 🎉</h2>
            <button className={btnStyles.primary} onClick={handleBackToMenu}>
              Play Again
            </button>
          </div>
        )}

        {alertMessage && (
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
      </div>
    </GameLayout>
  );
}

export default DiceBlitz;
