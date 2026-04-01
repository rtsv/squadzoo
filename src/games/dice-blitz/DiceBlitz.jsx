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
const MAX_PLAYERS = 2; // Rules specified exactly 2 players
const PLAYER_COLORS = [
  { id: "red", hex: "#e53e3e", label: "Red", emoji: "🔴" },
  { id: "blue", hex: "#3182ce", label: "Blue", emoji: "🔵" },
];
const DICE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const PIP_POSITIONS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

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

  // Setup (Locked to 2 players)
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
  const [grids, setGrids] = useState([]); // Array of 3x3 grids (Exactly 2)
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [pendingRoll, setPendingRoll] = useState(null);
  const [winner, setWinner] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [scores, setScores] = useState([0, 0]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [lastAction, setLastAction] = useState(null);

  // Refs for closure-safe access
  const gridsRef = useRef([]);
  const currentPlayerRef = useRef(0);
  const pendingRollRef = useRef(null);
  const gameOverRef = useRef(false);

  useEffect(() => { gridsRef.current = grids; }, [grids]);
  useEffect(() => { currentPlayerRef.current = currentPlayerIndex; }, [currentPlayerIndex]);
  useEffect(() => { pendingRollRef.current = pendingRoll; }, [pendingRoll]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

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
    const { players, initialGrids } = payload;
    setPlayerNames(players);
    setNumPlayers(players.length);
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
      setPendingRoll(roll);
      setIsRolling(false);
    }, 1000);
  }, [playDiceSound]);

  const handleRemoteSync = useCallback((payload) => {
    const {
      grids: newGrids,
      nextPlayer,
      lastAction: msg,
      winner: w,
      gameOver: go,
      scores: newScores,
      matchHistory: newHistory,
      pendingRoll: nextPendingRoll,
      diceValue: nextDiceValue,
    } = payload;
    setGrids(newGrids);
    setCurrentPlayerIndex(nextPlayer);
    setLastAction(msg);
    setWinner(w);
    setGameOver(go);
    if (Array.isArray(newScores)) setScores(newScores);
    if (Array.isArray(newHistory)) setMatchHistory(newHistory);
    setPendingRoll(nextPendingRoll ?? null);
    if (typeof nextDiceValue === "number") setDiceValue(nextDiceValue);
  }, []);

  const pushHostState = useCallback((overrides = {}) => {
    const payload = {
      grids: overrides.grids ?? gridsRef.current,
      nextPlayer: overrides.nextPlayer ?? currentPlayerRef.current,
      lastAction: overrides.lastAction ?? lastAction,
      winner: overrides.winner ?? winner,
      gameOver: overrides.gameOver ?? gameOverRef.current,
      scores: overrides.scores ?? scores,
      matchHistory: overrides.matchHistory ?? matchHistory,
      pendingRoll: overrides.pendingRoll ?? pendingRollRef.current,
      diceValue: overrides.diceValue ?? diceValue,
    };
    roomService.sendGameAction("sync-state", payload);
  }, [diceValue, gameOver, lastAction, matchHistory, scores, winner]);

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
        case "request-roll":
          if (isHost && !gameOverRef.current && currentPlayerRef.current === data.payload?.playerIndex) {
            const roll = Math.floor(Math.random() * 6) + 1;
            roomService.sendGameAction("dice-roll", { roll, playerIndex: currentPlayerRef.current });
            setDiceValue(roll);
            setPendingRoll(roll);
          }
          break;
        case "select-cell":
          if (isHost && !gameOverRef.current) {
            const { playerIndex, row, col } = data.payload || {};
            if (playerIndex !== currentPlayerRef.current || !Number.isInteger(row) || !Number.isInteger(col)) break;
            if (pendingRollRef.current === null) break;
            const attackerIdx = playerIndex;
            const defenderIdx = attackerIdx === 0 ? 1 : 0;
            const nextGrids = [...gridsRef.current];
            const targetRow = [...nextGrids[defenderIdx][row]];
            const targetCell = targetRow[col];
            if (!targetCell || targetCell.isCrossed || targetCell.value !== pendingRollRef.current) break;
            targetRow[col] = { ...targetCell, isCrossed: true };
            nextGrids[defenderIdx] = [...nextGrids[defenderIdx]];
            nextGrids[defenderIdx][row] = targetRow;

            const defenderCleared = checkWin(nextGrids[defenderIdx]);
            const extraTurn = pendingRollRef.current === 6;
            const nextPlayer = extraTurn ? attackerIdx : (attackerIdx + 1) % MAX_PLAYERS;
            const actionMsg = defenderCleared
              ? `${playerNames[attackerIdx]} wins by clearing ${playerNames[defenderIdx]}'s grid!`
              : `${playerNames[attackerIdx]} crossed ${pendingRollRef.current}${extraTurn ? " and gets an extra turn!" : "!"}`;

            setGrids(nextGrids);
            setLastAction(actionMsg);
            setPendingRoll(null);
            setCurrentPlayerIndex(nextPlayer);

            if (defenderCleared) {
              const nextWinner = attackerIdx;
              const nextScores = [...scores];
              nextScores[nextWinner] += 1;
              const nextHistory = [...matchHistory, { winner: nextWinner, date: Date.now() }];
              setWinner(nextWinner);
              setGameOver(true);
              setScores(nextScores);
              setMatchHistory(nextHistory);
              pushHostState({
                grids: nextGrids,
                nextPlayer,
                lastAction: actionMsg,
                winner: nextWinner,
                gameOver: true,
                scores: nextScores,
                matchHistory: nextHistory,
                pendingRoll: null,
              });
            } else {
              pushHostState({
                grids: nextGrids,
                nextPlayer,
                lastAction: actionMsg,
                pendingRoll: null,
              });
            }
          }
          break;
        case "sync-state": handleRemoteSync(data.payload); break;
        case "restart-game":
          setGrids(data.payload?.grids || [generateGrid(), generateGrid()]);
          setCurrentPlayerIndex(0);
          setDiceValue(1);
          setPendingRoll(null);
          setWinner(null);
          setGameOver(false);
          setLastAction("New round started!");
          break;
      }
    };

    roomService.on("onError", handleError);
    roomService.on("onPlayerJoined", handlePlayerJoined);
    roomService.on("onPlayerLeft", handlePlayerLeft);
    roomService.on("onGameAction", handleGameAction);

    return () => {
      // Keep PartyKit connection alive across remount/navigation to play mode.
      // Explicit room leave is handled in handleBackToMenu.
      delete roomService.callbacks.onError;
      delete roomService.callbacks.onPlayerJoined;
      delete roomService.callbacks.onPlayerLeft;
      delete roomService.callbacks.onGameAction;
    };
  }, [isOnlineMode, isInRoom, gameStarted, handleRemoteGameStart, handleRemoteDiceRoll, handleRemoteSync]);

  // ====== CORE LOGIC ======
  const hasMatchingCell = useCallback((targetGrid, roll) => {
    return targetGrid.some((row) => row.some((cell) => !cell.isCrossed && cell.value === roll));
  }, []);

  const rollDice = () => {
    if (isRolling || gameOver || pendingRoll !== null) return;
    if (isOnlineMode && myPlayerIndex !== currentPlayerIndex) return;

    setIsRolling(true);
    playDiceSound();
    const resolveRoll = (roll) => {
      setDiceValue(roll);
      setPendingRoll(roll);
      setIsRolling(false);

      const attackerIdx = currentPlayerRef.current;
      const defenderIdx = attackerIdx === 0 ? 1 : 0;
      const canHit = hasMatchingCell(gridsRef.current[defenderIdx], roll);
      if (!canHit) {
        const nextPlayer = roll === 6 ? attackerIdx : defenderIdx;
        const msg = `${playerNames[attackerIdx]} rolled ${roll} but no matching opponent cell.${roll === 6 ? " Extra turn." : ""}`;
        setLastAction(msg);
        setPendingRoll(null);
        setCurrentPlayerIndex(nextPlayer);
        if (isOnlineMode && isHost) {
          pushHostState({ nextPlayer, lastAction: msg, pendingRoll: null });
        }
      } else {
        const msg = `${playerNames[attackerIdx]} rolled ${roll}. Select one matching cell on ${playerNames[defenderIdx]}'s grid.`;
        setLastAction(msg);
        if (isOnlineMode && isHost) {
          pushHostState({ lastAction: msg, pendingRoll: roll, diceValue: roll });
        }
      }
    };

    if (isOnlineMode) {
      if (isHost) {
        const roll = Math.floor(Math.random() * 6) + 1;
        roomService.sendGameAction("dice-roll", { roll, playerIndex: currentPlayerRef.current });
        setTimeout(() => resolveRoll(roll), 1000);
      } else {
        roomService.sendGameAction("request-roll", { playerIndex: myPlayerIndex });
        setTimeout(() => setIsRolling(false), 1000);
      }
      return;
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    setTimeout(() => resolveRoll(roll), 1000);
  };

  const handleCellSelect = (playerIdx, rowIdx, colIdx) => {
    if (gameOver || pendingRoll === null || isRolling) return;
    if (playerIdx === currentPlayerIndex) return;
    if (isOnlineMode && myPlayerIndex !== currentPlayerIndex) return;

    const targetCell = grids[playerIdx]?.[rowIdx]?.[colIdx];
    if (!targetCell || targetCell.isCrossed || targetCell.value !== pendingRoll) return;

    if (isOnlineMode) {
      if (isHost) {
        const attackerIdx = currentPlayerIndex;
        const defenderIdx = attackerIdx === 0 ? 1 : 0;
        if (playerIdx !== defenderIdx) return;
        const nextGrids = [...gridsRef.current];
        const nextRow = [...nextGrids[defenderIdx][rowIdx]];
        nextRow[colIdx] = { ...nextRow[colIdx], isCrossed: true };
        nextGrids[defenderIdx] = [...nextGrids[defenderIdx]];
        nextGrids[defenderIdx][rowIdx] = nextRow;
        setGrids(nextGrids);
        playStrikeSound();

        const defenderCleared = checkWin(nextGrids[defenderIdx]);
        const extraTurn = pendingRollRef.current === 6;
        const nextPlayer = extraTurn ? attackerIdx : defenderIdx;
        const actionMsg = defenderCleared
          ? `${playerNames[attackerIdx]} wins by clearing ${playerNames[defenderIdx]}'s grid!`
          : `${playerNames[attackerIdx]} crossed ${pendingRollRef.current}${extraTurn ? " and gets an extra turn!" : "!"}`;
        setLastAction(actionMsg);
        setPendingRoll(null);
        setCurrentPlayerIndex(nextPlayer);

        if (defenderCleared) {
          const nextWinner = attackerIdx;
          const nextScores = [...scores];
          nextScores[nextWinner] += 1;
          const nextHistory = [...matchHistory, { winner: nextWinner, date: Date.now() }];
          setWinner(nextWinner);
          setGameOver(true);
          setScores(nextScores);
          setMatchHistory(nextHistory);
          pushHostState({
            grids: nextGrids,
            nextPlayer,
            lastAction: actionMsg,
            winner: nextWinner,
            gameOver: true,
            scores: nextScores,
            matchHistory: nextHistory,
            pendingRoll: null,
          });
        } else {
          pushHostState({
            grids: nextGrids,
            nextPlayer,
            lastAction: actionMsg,
            pendingRoll: null,
          });
        }
      } else {
        roomService.sendGameAction("select-cell", {
          playerIndex: myPlayerIndex,
          row: rowIdx,
          col: colIdx,
        });
      }
      return;
    }

    const attackerIdx = currentPlayerIndex;
    const defenderIdx = attackerIdx === 0 ? 1 : 0;
    if (playerIdx !== defenderIdx) return;
    const nextGrids = [...grids];
    const nextRow = [...nextGrids[defenderIdx][rowIdx]];
    nextRow[colIdx] = { ...nextRow[colIdx], isCrossed: true };
    nextGrids[defenderIdx] = [...nextGrids[defenderIdx]];
    nextGrids[defenderIdx][rowIdx] = nextRow;
    setGrids(nextGrids);
    playStrikeSound();

    const defenderCleared = checkWin(nextGrids[defenderIdx]);
    const extraTurn = pendingRoll === 6;
    const nextPlayer = extraTurn ? attackerIdx : defenderIdx;
    const actionMsg = defenderCleared
      ? `${playerNames[attackerIdx]} wins by clearing ${playerNames[defenderIdx]}'s grid!`
      : `${playerNames[attackerIdx]} crossed ${pendingRoll}${extraTurn ? " and gets an extra turn!" : "!"}`;
    setLastAction(actionMsg);
    setPendingRoll(null);

    if (defenderCleared) {
      setWinner(attackerIdx);
      setGameOver(true);
      setScores((prev) => {
        const next = [...prev];
        next[attackerIdx] += 1;
        return next;
      });
      setMatchHistory((prev) => [...prev, { winner: attackerIdx, date: Date.now() }]);
      return;
    }

    setCurrentPlayerIndex(nextPlayer);
  };

  const renderCellDice = (value) => {
    const active = new Set(PIP_POSITIONS[value] || []);
    return (
      <div className={styles.cellDiceFace}>
        {Array.from({ length: 9 }).map((_, idx) => (
          <span
            key={idx}
            className={`${styles.cellDot} ${active.has(idx) ? styles.cellDotActive : ""}`}
          />
        ))}
      </div>
    );
  };

  const canRollNow =
    !gameOver &&
    !isRolling &&
    pendingRoll === null &&
    (!isOnlineMode || myPlayerIndex === currentPlayerIndex);

  const getInstruction = () => {
    if (gameOver) return "";
    if (isOnlineMode && myPlayerIndex !== currentPlayerIndex) {
      return `Waiting for ${playerNames[currentPlayerIndex]}...`;
    }
    if (isRolling) return "Rolling...";
    if (pendingRoll !== null) {
      return `Rolled ${pendingRoll}. Select one matching opponent cell.`;
    }
    return "Tap the dice to roll!";
  };

  // ====== SETUP FUNCTIONS ======
  const handleBackToMenu = useCallback(() => {
    if (roomService.isConnected()) roomService.leaveRoom();
    setGameMode(null);
    setGameStarted(false);
    setIsOnlineMode(false);
    setIsInRoom(false);
    setGrids([]);
    setWinner(null);
    setGameOver(false);
    setAlertMessage(null);
  }, []);

  const startLocalGame = () => {
    if (playerNames.some(n => !n.trim())) {
      setAlertMessage("Please enter both player names!");
      return;
    }
    const initialGrids = [generateGrid(), generateGrid()];
    setGrids(initialGrids);
    setCurrentPlayerIndex(0);
    setPendingRoll(null);
    setDiceValue(1);
    setGameOver(false);
    setWinner(null);
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
      setMyPlayerIndex(0);
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
      setIsHost(false);
      setWaitingForPlayers(true);
      const players = roomService.getConnectedPlayers();
      setConnectedPlayers(players);
      // Guest should be player 2 in this 2-player game.
      setMyPlayerIndex(players.findIndex((p) => p.playerName === roomService.playerName));
    } catch (e) { setAlertMessage("Room not found."); }
  };

  const handleStartOnlineGame = () => {
    const names = connectedPlayers.map(p => p.playerName);
    if (names.length !== 2) { setAlertMessage("Dice Blitz is exactly for 2 players!"); return; }
    const initialGrids = [generateGrid(), generateGrid()];
    roomService.sendGameAction("game-start", {
      players: names,
      initialGrids
    });
    setPlayerNames(names);
    setGrids(initialGrids);
    setCurrentPlayerIndex(0);
    setPendingRoll(null);
    setDiceValue(1);
    setGameOver(false);
    setWinner(null);
    setGameStarted(true);
    setWaitingForPlayers(false);
    setIsHost(true);
    // Host must set their player index — without this, myPlayerIndex stays null
    // and the guard (myPlayerIndex !== currentPlayerIndex) blocks the host from rolling
    const myIdx = names.indexOf(roomService.playerName);
    setMyPlayerIndex(myIdx >= 0 ? myIdx : 0);
  };

  // ====== RENDER ======
  if (!gameMode) {
    return (
      <GameLayout title="🎲 Dice Blitz - Select Mode" onBack={onBack}>
        {alertMessage && (
          <CustomAlert
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
          />
        )}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>Choose how you want to play Dice Blitz</p>
          <GameModeSelector
            onSelectLocal={() => {
              setGameMode("local");
              setIsOnlineMode(false);
            }}
            onSelectOnline={() => {
              setGameMode("online");
              setIsOnlineMode(true);
            }}
            localLabel="Local Play"
            onlineLabel="Online Multiplayer"
            maxPlayers="2 players"
          />
        </div>
      </GameLayout>
    );
  }

  if (isOnlineMode && !isInRoom) {
    return (
      <GameLayout title="🎲 Dice Blitz - Online Setup" onBack={handleBackToMenu}>
        {alertMessage && (
          <CustomAlert
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
          />
        )}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>
            Create a room or join an existing one to play online
          </p>
          <OnlineRoomSetup
            playerName={playerName}
            setPlayerName={setPlayerName}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            onCreateRoom={handleCreateOnlineRoom}
            onJoinRoom={handleJoinOnlineRoom}
            onBack={() => {
              setGameMode(null);
              setIsOnlineMode(false);
              setIsInRoom(false);
              setWaitingForPlayers(false);
              setConnectedPlayers([]);
              setMyPlayerIndex(null);
            }}
          />
        </div>
      </GameLayout>
    );
  }

  if (isOnlineMode && waitingForPlayers) {
    return (
      <GameLayout title="🎲 Dice Blitz - Waiting Room" onBack={handleBackToMenu}>
        {alertMessage && (
          <CustomAlert
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
          />
        )}
        <OnlineRoomExample
          roomCode={roomCode}
          connectedPlayers={connectedPlayers}
          isHost={isHost}
          onStartGame={handleStartOnlineGame}
          onBack={handleBackToMenu}
        />
      </GameLayout>
    );
  }

  if (!gameStarted && !isOnlineMode) {
    return (
      <GameLayout title="🎲 Dice Blitz - Player Setup" onBack={() => setGameMode(null)}>
        {alertMessage && (
          <CustomAlert
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
          />
        )}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>
            Enter player names to begin!
          </p>
          <GameRules
            rules={[
              "Race to clear your own 3x3 grid first!",
              "Take turns rolling a die.",
              "Rolled number is crossed on YOUR grid if present.",
              "First player to clear all cells wins."
            ]}
          />
          <PlayerNameInput
            players={playerNames}
            onPlayerChange={(index, value) => {
              const next = [...playerNames];
              next[index] = value;
              setPlayerNames(next);
            }}
            minPlayers={2}
            showSymbols={true}
            symbols={PLAYER_COLORS.map((p) => `${p.emoji} ${p.label}`)}
          />
          <div className={styles.setupButtons}>
            <button
              className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`}
              onClick={startLocalGame}
            >
              Start Game
            </button>
          </div>
        </div>
      </GameLayout>
    );
  }

  const gameRules = [
    "Roll the dice and target ONE matching cell on your opponent's grid.",
    "You can only select an uncrossed opponent cell matching the rolled number.",
    "Rolling 6 gives you an extra turn.",
    "First player to fully clear opponent grid wins."
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
          {isOnlineMode && <VoiceChat enabled={isOnlineMode && gameStarted} myId={roomService.playerId} roomCode={roomCode} />}
        </>
      }
    >
      <div className={styles.container}>
        <div className={styles.gameHeader}>
          <h1 className={styles.title}>Dice Blitz</h1>
          <p className={styles.subtitle}>Race to clear your grid!</p>
        </div>

        <div className={styles.controls}>
          {!gameOver && (
            <div className={styles.turnBanner}>
              {playerNames[currentPlayerIndex]}'s Turn
              {pendingRoll !== null ? ` • Rolled ${pendingRoll} - select opponent cell` : ""}
            </div>
          )}
          <div className={styles.diceArea}>
            <div
              className={`${styles.dice} ${isRolling ? styles.diceRolling : ""} ${diceValue && !isRolling ? styles.diceShow : ""}`}
              onClick={canRollNow ? rollDice : undefined}
              style={{ cursor: canRollNow ? "pointer" : "default" }}
            >
              {DICE_FACES[diceValue] || "🎲"}
            </div>
            <p className={styles.diceHint}>{getInstruction()}</p>
            {lastAction && <p className={styles.lastAction}>{lastAction}</p>}
          </div>
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
                    (() => {
                      const canSelect =
                        !gameOver &&
                        pendingRoll !== null &&
                        pIdx !== currentPlayerIndex &&
                        !cell.isCrossed &&
                        cell.value === pendingRoll &&
                        (!isOnlineMode || myPlayerIndex === currentPlayerIndex);
                      return (
                    <div
                      key={cell.id}
                      className={`${styles.cell} ${cell.isCrossed ? styles.crossed : ""} ${canSelect ? styles.cellSelectable : ""}`}
                      onClick={canSelect ? () => handleCellSelect(pIdx, rIdx, cIdx) : undefined}
                      style={{ cursor: canSelect ? "pointer" : "default" }}
                    >
                      {renderCellDice(cell.value)}
                      {cell.isCrossed && (
                        <div className={styles.crossOverlay}>❌</div>
                      )}
                    </div>
                      );
                    })()
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {gameOver && (
          <div className={styles.winnerOverlay}>
            <h2 className={styles.winnerTitle}>{playerNames[winner]} Wins! 🎉</h2>
            <button
              className={btnStyles.primary}
              onClick={() => {
                const nextGrids = [generateGrid(), generateGrid()];
                setGrids(nextGrids);
                setCurrentPlayerIndex(0);
                setDiceValue(1);
                setPendingRoll(null);
                setWinner(null);
                setGameOver(false);
                setLastAction(null);
                if (isOnlineMode && isHost) {
                  roomService.sendGameAction("restart-game", { grids: nextGrids });
                  pushHostState({
                    grids: nextGrids,
                    nextPlayer: 0,
                    winner: null,
                    gameOver: false,
                    pendingRoll: null,
                    lastAction: "New round started!",
                    diceValue: 1,
                  });
                }
              }}
            >
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
