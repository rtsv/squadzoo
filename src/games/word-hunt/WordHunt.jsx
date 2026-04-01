import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import GameLayout from "../../layout/GameLayout";
import GameModeSelector from "../../components/GameModeSelector";
import OnlineRoomSetup from "../../components/OnlineRoomSetup";
import OnlineRoomExample from "../../components/OnlineRoomExample";
import PlayerNameInput from "../../components/PlayerNameInput";
import GameRules from "../../components/GameRules";
import CustomAlert from "../../components/CustomAlert";
import MatchHistorySidebar from "../../components/MatchHistorySidebar";
import VoiceChat from "../../components/VoiceChat";
import roomService from "../../services/roomService";
import btnStyles from "../../styles/Button.module.css";
import styles from "../../styles/WordHunt.module.css";
import {
  GRID_SIZE,
  generateGridFromTargets,
  pickTargetWords,
  findMatchingWordIndex,
  isValidStraightPath,
  pathToWord,
  tryAppendToPath,
  bridgePath,
} from "./wordHuntLogic";

const TIMER_SEC = 180;
const MAX_PLAYERS = 4;
const MIN_PLAYERS = 2;

const PLAYER_COLORS = [
  { id: "red", emoji: "🔴", color: "#e53e3e", light: "#fc8181" },
  { id: "blue", emoji: "🔵", color: "#3182ce", light: "#63b3ed" },
  { id: "green", emoji: "🟢", color: "#38a169", light: "#68d391" },
  { id: "yellow", emoji: "🟡", color: "#d69e2e", light: "#f6e05e" },
];

const ACTIONS = {
  GAME_START: "GAME_START",
  SUBMIT_WORD: "SUBMIT_WORD",
  UPDATE_STATE: "UPDATE_STATE",
  GAME_OVER: "GAME_OVER",
  RESTART_GAME: "RESTART_GAME",
};

function emptyWords(n) {
  return Array.from({ length: n }, () => []);
}

function allTargetsClaimed(wordTargets) {
  return (
    wordTargets.length > 0 &&
    wordTargets.every((w) => w.foundBy !== null && w.foundBy !== undefined)
  );
}

/** Snapshot grid path for persistence (found words stay highlighted) */
function snapshotPath(path) {
  return path.map(([r, c]) => [r, c]);
}

function buildFreshState(playerCount) {
  const now = Date.now();
  const targets = pickTargetWords(12);
  const { grid, words: wordTargets } = generateGridFromTargets(targets);
  return {
    grid,
    wordTargets,
    scores: Array(playerCount).fill(0),
    playerWords: emptyWords(playerCount),
    gameEndAt: now + TIMER_SEC * 1000,
    gameOver: false,
    winnerIndex: null,
    currentPlayerIndex: 0,
  };
}

export default function WordHunt({ onBack, initialRoomCode, onGameStart, isPlayMode = false }) {
  const location = useLocation();
  const gameState = location.state || {};

  const [gameMode, setGameMode] = useState(isPlayMode ? gameState.gameMode || "local" : null);
  const [gameStarted, setGameStarted] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState(["", ""]);
  const [localParallel, setLocalParallel] = useState(true);

  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [myPlayerIndex, setMyPlayerIndex] = useState(null);

  const puzzleSeed = useMemo(() => generateGridFromTargets(pickTargetWords(12)), []);
  const [grid, setGrid] = useState(() => puzzleSeed.grid);
  const [wordTargets, setWordTargets] = useState(() => puzzleSeed.words);
  const [scores, setScores] = useState([0, 0]);
  const [playerWords, setPlayerWords] = useState(() => emptyWords(2));
  const [gameEndAt, setGameEndAt] = useState(() => Date.now() + TIMER_SEC * 1000);
  const [timeLeft, setTimeLeft] = useState(TIMER_SEC);
  const [gameOver, setGameOver] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [matchHistory, setMatchHistory] = useState([]);

  const [selectedPath, setSelectedPath] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const dragActiveRef = useRef(false);

  const lastSubmitRef = useRef(0);
  const hostBusyRef = useRef(false);
  const gridRef = useRef(grid);
  const playerNamesRef = useRef(playerNames);
  const gameOverRef = useRef(gameOver);
  const wordTargetsRef = useRef(wordTargets);
  const scoresRef = useRef(scores);
  const playerWordsRef = useRef(playerWords);
  const gameEndAtRef = useRef(gameEndAt);
  const localParallelRef = useRef(localParallel);
  const currentPlayerRef = useRef(currentPlayerIndex);
  const isOnlineModeRef = useRef(isOnlineMode);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);
  useEffect(() => {
    playerNamesRef.current = playerNames;
  }, [playerNames]);
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);
  useEffect(() => {
    wordTargetsRef.current = wordTargets;
  }, [wordTargets]);
  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);
  useEffect(() => {
    playerWordsRef.current = playerWords;
  }, [playerWords]);
  useEffect(() => {
    gameEndAtRef.current = gameEndAt;
  }, [gameEndAt]);
  useEffect(() => {
    localParallelRef.current = localParallel;
  }, [localParallel]);
  useEffect(() => {
    currentPlayerRef.current = currentPlayerIndex;
  }, [currentPlayerIndex]);
  useEffect(() => {
    isOnlineModeRef.current = isOnlineMode;
  }, [isOnlineMode]);

  const applyStateFromHost = useCallback((state) => {
    if (!state) return;
    if (state.grid) setGrid(state.grid);
    if (Array.isArray(state.wordTargets)) setWordTargets(state.wordTargets);
    if (Array.isArray(state.scores)) setScores(state.scores);
    if (Array.isArray(state.playerWords)) setPlayerWords(state.playerWords);
    if (typeof state.gameEndAt === "number") setGameEndAt(state.gameEndAt);
    setGameOver(!!state.gameOver);
    setWinnerIndex(state.winnerIndex ?? null);
    if (typeof state.currentPlayerIndex === "number") setCurrentPlayerIndex(state.currentPlayerIndex);
  }, []);

  const getStatePayload = useCallback(
    (overrides = {}) => ({
      grid: overrides.grid ?? gridRef.current,
      wordTargets: overrides.wordTargets ?? wordTargetsRef.current,
      scores: overrides.scores ?? scoresRef.current,
      playerWords: overrides.playerWords ?? playerWordsRef.current,
      gameEndAt: overrides.gameEndAt ?? gameEndAtRef.current,
      gameOver: overrides.gameOver ?? gameOverRef.current,
      winnerIndex: overrides.winnerIndex ?? null,
      currentPlayerIndex: overrides.currentPlayerIndex ?? currentPlayerRef.current,
    }),
    []
  );

  const broadcastState = useCallback(
    (overrides = {}) => {
      roomService.sendGameAction(ACTIONS.UPDATE_STATE, { state: getStatePayload(overrides) });
    },
    [getStatePayload]
  );

  const resolveWinner = useCallback((sc) => {
    let best = 0;
    let max = -1;
    let tie = false;
    for (let i = 0; i < sc.length; i++) {
      if (sc[i] > max) {
        max = sc[i];
        best = i;
        tie = false;
      } else if (sc[i] === max) tie = true;
    }
    return tie ? null : best;
  }, []);

  const endGame = useCallback(
    (finalScores) => {
      if (gameOverRef.current) return;
      gameOverRef.current = true;
      const w = resolveWinner(finalScores);
      setGameOver(true);
      setWinnerIndex(w);
      setMatchHistory((prev) => [...prev, { winner: w === null ? "draw" : w, date: Date.now() }]);
      if (isOnlineModeRef.current && isHost) {
        roomService.sendGameAction(ACTIONS.GAME_OVER, {});
        broadcastState({
          gameOver: true,
          winnerIndex: w,
          scores: finalScores,
        });
      }
    },
    [broadcastState, isHost, resolveWinner]
  );

  const tickTimer = useCallback(() => {
    const left = Math.max(0, Math.ceil((gameEndAtRef.current - Date.now()) / 1000));
    setTimeLeft(left);
    if (gameOverRef.current) return;
    if (allTargetsClaimed(wordTargetsRef.current)) {
      endGame(scoresRef.current);
      return;
    }
    if (left <= 0) {
      endGame(scoresRef.current);
    }
  }, [endGame]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    tickTimer();
    const id = setInterval(tickTimer, 500);
    return () => clearInterval(id);
  }, [gameStarted, gameOver, gameEndAt, tickTimer]);

  const hostProcessSubmit = useCallback(
    (payload, senderName) => {
      if (hostBusyRef.current) return;
      hostBusyRef.current = true;
      try {
        const { path, playerIndex } = payload;
        const names = playerNamesRef.current;
        if (typeof playerIndex !== "number" || playerIndex < 0 || playerIndex >= names.length) return;
        if (names[playerIndex]?.trim() !== senderName?.trim()) {
          return;
        }
        if (gameOverRef.current || Date.now() >= gameEndAtRef.current) return;

        const g = gridRef.current;
        if (!isValidStraightPath(path)) return;

        const now = Date.now();
        if (now - lastSubmitRef.current < 350) return;
        lastSubmitRef.current = now;

        const wordsSnapshot = wordTargetsRef.current.map((w) => ({ ...w }));
        const idx = findMatchingWordIndex(wordsSnapshot, g, path);
        if (idx < 0) return;
        if (wordsSnapshot[idx].foundBy !== null && wordsSnapshot[idx].foundBy !== undefined) return;

        const claimedText = wordsSnapshot[idx].text;
        const nextWordTargets = wordsSnapshot.map((w, i) =>
          i === idx ? { ...w, foundBy: playerIndex, path: snapshotPath(path) } : w
        );
        wordTargetsRef.current = nextWordTargets;

        const nextScores = [...scoresRef.current];
        nextScores[playerIndex] += 1;
        const nextPlayerWords = playerWordsRef.current.map((arr, i) =>
          i === playerIndex ? [...arr, claimedText] : arr
        );

        let nextCurrent = currentPlayerRef.current;
        if (!isOnlineModeRef.current && !localParallelRef.current) {
          nextCurrent = (playerIndex + 1) % names.length;
        }

        setScores(nextScores);
        setPlayerWords(nextPlayerWords);
        setWordTargets(nextWordTargets);
        setCurrentPlayerIndex(nextCurrent);

        broadcastState({
          scores: nextScores,
          playerWords: nextPlayerWords,
          wordTargets: nextWordTargets,
          currentPlayerIndex: nextCurrent,
        });

        if (allTargetsClaimed(nextWordTargets)) {
          endGame(nextScores);
        }
      } finally {
        hostBusyRef.current = false;
      }
    },
    [broadcastState, endGame]
  );

  const trySubmit = useCallback(
    (pathOverride) => {
      const path = pathOverride ?? selectedPath;
      if (path.length < 3 || gameOver) return;
      const now = Date.now();
      if (now - lastSubmitRef.current < 400) return;

      const wordRaw = pathToWord(grid, path);
      if (!isValidStraightPath(path)) {
        setAlertMessage("Selection must be a straight line.");
        return;
      }

      let playerIndex;
      if (isOnlineMode) {
        if (myPlayerIndex === null) return;
        playerIndex = myPlayerIndex;
      } else if (localParallel) {
        playerIndex = activePlayerIndex;
      } else {
        playerIndex = currentPlayerIndex;
      }

      if (!isOnlineMode && !localParallel && playerIndex !== currentPlayerIndex) {
        setAlertMessage("Not your turn!");
        return;
      }

      lastSubmitRef.current = now;

      if (isOnlineMode) {
        if (isHost) {
          hostProcessSubmit({ path, playerIndex }, roomService.playerName);
        } else {
          roomService.sendGameAction(ACTIONS.SUBMIT_WORD, { path, playerIndex });
        }
        setIsDragging(false);
        return;
      }

      const idx = findMatchingWordIndex(wordTargets, grid, path);
      if (idx < 0) {
        setAlertMessage(`"${wordRaw}" is not on the puzzle word list.`);
        setSelectedPath([]);
        setIsDragging(false);
        return;
      }
      if (wordTargets[idx].foundBy !== null && wordTargets[idx].foundBy !== undefined) {
        setAlertMessage("That word was already found.");
        setSelectedPath([]);
        setIsDragging(false);
        return;
      }

      const claimedText = wordTargets[idx].text;
      const nextWordTargets = wordTargets.map((w, i) =>
        i === idx ? { ...w, foundBy: playerIndex, path: snapshotPath(path) } : w
      );
      const nextScores = [...scores];
      nextScores[playerIndex] += 1;

      setScores(nextScores);
      setPlayerWords((prev) =>
        prev.map((arr, i) => (i === playerIndex ? [...arr, claimedText] : arr))
      );
      setWordTargets(nextWordTargets);

      if (!localParallel) {
        setCurrentPlayerIndex((i) => (i + 1) % numPlayers);
      }

      if (allTargetsClaimed(nextWordTargets)) {
        endGame(nextScores);
      }

      setIsDragging(false);
    },
    [
      activePlayerIndex,
      currentPlayerIndex,
      endGame,
      gameOver,
      grid,
      hostProcessSubmit,
      isHost,
      isOnlineMode,
      localParallel,
      myPlayerIndex,
      numPlayers,
      selectedPath,
      scores,
      wordTargets,
    ]
  );

  useEffect(() => {
    if (!isOnlineMode || !isInRoom || !gameStarted) return;

    const onError = (msg) => setAlertMessage(msg);
    const onPlayerJoined = () => setConnectedPlayers([...roomService.getConnectedPlayers()]);
    const onPlayerLeft = () => {
      setConnectedPlayers([...roomService.getConnectedPlayers()]);
      if (gameStarted) setAlertMessage("A player disconnected.");
    };

    const onGameAction = (data) => {
      switch (data.action) {
        case ACTIONS.GAME_START:
          setPlayerNames(data.payload.players);
          setNumPlayers(data.payload.players.length);
          setGameStarted(true);
          setWaitingForPlayers(false);
          setMyPlayerIndex(data.payload.players.indexOf(roomService.playerName));
          applyStateFromHost(data.payload.state);
          if (onGameStart && !isPlayMode) onGameStart();
          break;
        case ACTIONS.SUBMIT_WORD:
          if (isHost) {
            hostProcessSubmit(data.payload, data.playerName);
          }
          break;
        case ACTIONS.UPDATE_STATE:
          applyStateFromHost(data.payload.state);
          break;
        case ACTIONS.RESTART_GAME:
          if (data.payload?.state) applyStateFromHost(data.payload.state);
          break;
        case ACTIONS.GAME_OVER:
          if (!isHost) {
            setGameOver(true);
          }
          break;
        default:
          break;
      }
    };

    roomService.on("onError", onError);
    roomService.on("onPlayerJoined", onPlayerJoined);
    roomService.on("onPlayerLeft", onPlayerLeft);
    roomService.on("onGameAction", onGameAction);
    setConnectedPlayers([...roomService.getConnectedPlayers()]);

    return () => {
      delete roomService.callbacks.onError;
      delete roomService.callbacks.onPlayerJoined;
      delete roomService.callbacks.onPlayerLeft;
      delete roomService.callbacks.onGameAction;
    };
  }, [
    applyStateFromHost,
    gameStarted,
    hostProcessSubmit,
    isHost,
    isInRoom,
    isOnlineMode,
    isPlayMode,
    onGameStart,
  ]);

  const handleBackToMenu = useCallback(() => {
    if (roomService.isConnected()) roomService.leaveRoom();
    setGameMode(null);
    setGameStarted(false);
    setIsOnlineMode(false);
    setIsInRoom(false);
    setWaitingForPlayers(false);
    setConnectedPlayers([]);
    setRoomCode("");
    setPlayerName("");
    setMyPlayerIndex(null);
    setAlertMessage(null);
    setGameOver(false);
    setWinnerIndex(null);
    setSelectedPath([]);
  }, []);

  const startLocalGame = () => {
    if (playerNames.some((n) => !n.trim())) {
      setAlertMessage("Please enter all player names!");
      return;
    }
    const st = buildFreshState(numPlayers);
    setGrid(st.grid);
    setWordTargets(st.wordTargets);
    setScores(st.scores);
    setPlayerWords(st.playerWords);
    setGameEndAt(st.gameEndAt);
    setGameOver(false);
    setWinnerIndex(null);
    setCurrentPlayerIndex(0);
    setActivePlayerIndex(0);
    setGameStarted(true);
    setTimeLeft(TIMER_SEC);
    if (onGameStart && !isPlayMode) onGameStart();
  };

  const handleCreateOnlineRoom = async () => {
    if (!playerName.trim()) {
      setAlertMessage("Enter your name!");
      return;
    }
    try {
      roomService.playerName = playerName;
      const { roomCode: code } = await roomService.createRoom();
      setRoomCode(code);
      setIsHost(true);
      setIsInRoom(true);
      setWaitingForPlayers(true);
      setConnectedPlayers(roomService.getConnectedPlayers());
      setMyPlayerIndex(0);
    } catch {
      setAlertMessage("Failed to create room.");
    }
  };

  const handleJoinOnlineRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      setAlertMessage("Enter name and room code.");
      return;
    }
    try {
      roomService.playerName = playerName;
      await roomService.joinRoom(roomCode);
      setIsInRoom(true);
      setIsHost(false);
      setWaitingForPlayers(true);
      const all = roomService.getConnectedPlayers();
      setConnectedPlayers(all);
      setMyPlayerIndex(all.findIndex((p) => p.playerName === roomService.playerName));
    } catch {
      setAlertMessage("Room not found.");
    }
  };

  const handleStartOnlineGame = () => {
    if (!isHost) return;
    if (connectedPlayers.length < MIN_PLAYERS || connectedPlayers.length > MAX_PLAYERS) {
      setAlertMessage(`Need ${MIN_PLAYERS}-${MAX_PLAYERS} players.`);
      return;
    }
    const names = connectedPlayers.map((p) => p.playerName);
    const st = buildFreshState(names.length);
    roomService.sendGameAction(ACTIONS.GAME_START, {
      players: names,
      state: st,
    });
    setPlayerNames(names);
    setNumPlayers(names.length);
    setGrid(st.grid);
    setWordTargets(st.wordTargets);
    setScores(st.scores);
    setPlayerWords(st.playerWords);
    setGameEndAt(st.gameEndAt);
    setGameOver(false);
    setWinnerIndex(null);
    setCurrentPlayerIndex(0);
    setGameStarted(true);
    setWaitingForPlayers(false);
    setMyPlayerIndex(names.indexOf(roomService.playerName));
    setTimeLeft(TIMER_SEC);
    if (onGameStart && !isPlayMode) onGameStart();
  };

  const handlePlayAgain = () => {
    const n = isOnlineMode ? playerNames.length : numPlayers;
    const st = buildFreshState(n);
    setGrid(st.grid);
    setWordTargets(st.wordTargets);
    setScores(st.scores);
    setPlayerWords(st.playerWords);
    setGameEndAt(st.gameEndAt);
    setGameOver(false);
    setWinnerIndex(null);
    setCurrentPlayerIndex(0);
    setActivePlayerIndex(0);
    setTimeLeft(TIMER_SEC);
    gameOverRef.current = false;
    if (isOnlineMode && isHost) {
      roomService.sendGameAction(ACTIONS.RESTART_GAME, { state: st });
    }
  };

  const wordPreview = useMemo(() => {
    if (!selectedPath.length) return "";
    return pathToWord(grid, selectedPath);
  }, [grid, selectedPath]);

  const canInteract = useMemo(() => {
    if (gameOver || timeLeft <= 0) return false;
    if (isOnlineMode) return myPlayerIndex !== null;
    if (localParallel) return true;
    return true;
  }, [gameOver, timeLeft, isOnlineMode, myPlayerIndex, localParallel]);

  /** Pointerenter misses during drag in many browsers — track via window + elementFromPoint */
  const handleCellPointerDown = useCallback(
    (r, c) => (e) => {
      if (!canInteract) return;
      if (isOnlineMode && myPlayerIndex === null) return;
      if (e.button !== 0) return;
      e.preventDefault();
      dragActiveRef.current = true;
      setIsDragging(true);
      setSelectedPath([[r, c]]);

      const move = (ev) => {
        if (!dragActiveRef.current) return;
        ev.preventDefault();
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const cell = el?.closest?.("[data-wh-cell]");
        if (!cell) return;
        const tr = parseInt(cell.getAttribute("data-r"), 10);
        const tc = parseInt(cell.getAttribute("data-c"), 10);
        if (Number.isNaN(tr) || Number.isNaN(tc)) return;
        setSelectedPath((prev) => {
          const bridged = bridgePath(prev, tr, tc, GRID_SIZE);
          if (bridged) return bridged;
          const next = tryAppendToPath(prev, tr, tc, GRID_SIZE);
          return next || prev;
        });
      };

      const end = () => {
        dragActiveRef.current = false;
        setIsDragging(false);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
      };

      window.addEventListener("pointermove", move, { passive: false });
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
    },
    [canInteract, isOnlineMode, myPlayerIndex]
  );

  const clearPath = () => {
    dragActiveRef.current = false;
    setSelectedPath([]);
    setIsDragging(false);
  };

  const rules = [
    "Press and drag across letters in a straight line (8 directions). Find the words listed for this puzzle — they are placed on the grid forward or backward.",
    "Only selections that match a listed word count. Each word can be claimed once — first valid submission wins online.",
    "Scoring: 1 point per word found.",
    isOnlineMode
      ? "Online: everyone plays at the same time until the timer ends."
      : localParallel
        ? "Local parallel: tap a player badge, then find words for that player."
        : "Local turns: after a valid word, the next player goes.",
  ];

  if (!gameMode) {
    return (
      <GameLayout title="🔍 Word Hunt - Select Mode" onBack={onBack}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>Choose how you want to play Word Hunt</p>
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
            maxPlayers="2-4 players"
          />
        </div>
      </GameLayout>
    );
  }

  if (isOnlineMode && !isInRoom) {
    return (
      <GameLayout title="🔍 Word Hunt - Online Setup" onBack={handleBackToMenu}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>Create or join a room (2–4 players)</p>
          <OnlineRoomSetup
            playerName={playerName}
            setPlayerName={setPlayerName}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            onCreateRoom={handleCreateOnlineRoom}
            onJoinRoom={handleJoinOnlineRoom}
            hideCreateRoom={!!initialRoomCode}
          />
        </div>
      </GameLayout>
    );
  }

  if (isOnlineMode && waitingForPlayers) {
    return (
      <GameLayout title="🔍 Word Hunt - Waiting Room" onBack={handleBackToMenu}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <OnlineRoomExample
          roomCode={roomCode}
          connectedPlayers={connectedPlayers}
          maxPlayers={4}
          isHost={isHost}
          minPlayers={2}
          onStartGame={handleStartOnlineGame}
          gameUrl={`${window.location.origin}/games/word-hunt?room=${roomCode}`}
          symbols={PLAYER_COLORS.map((p) => p.emoji)}
        />
      </GameLayout>
    );
  }

  if (!gameStarted && !isOnlineMode) {
    return (
      <GameLayout title="🔍 Word Hunt - Player Setup" onBack={handleBackToMenu}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>2–4 players · Same-screen word search</p>
          <div className={styles.playerCountButtons}>
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => {
                  setNumPlayers(count);
                  setPlayerNames(Array(count).fill(""));
                }}
                className={`${styles.countBtn} ${numPlayers === count ? styles.countBtnActive : ""}`}
              >
                {count} Players
              </button>
            ))}
          </div>
          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={localParallel}
              onChange={(e) => setLocalParallel(e.target.checked)}
            />
            Parallel (pick player per word) — off = take turns
          </label>
          <PlayerNameInput
            players={playerNames}
            onPlayerChange={(idx, value) => {
              const next = [...playerNames];
              next[idx] = value;
              setPlayerNames(next);
            }}
            minPlayers={2}
            showSymbols
            symbols={PLAYER_COLORS.slice(0, numPlayers).map((p) => p.emoji)}
          />
          <div className={styles.setupButtons}>
            <button type="button" className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`} onClick={startLocalGame}>
              Start Game
            </button>
          </div>
        </div>
      </GameLayout>
    );
  }

  const foundCount = wordTargets.filter(
    (w) => w.foundBy !== null && w.foundBy !== undefined
  ).length;
  const headerPlayer =
    gameOver || !playerNames.length ? "" : `⏱ ${timeLeft}s · ${foundCount}/${wordTargets.length} words`;

  const playerCount = playerNames.length;

  return (
    <GameLayout title="🔍 Word Hunt" currentPlayer={headerPlayer} onBack={handleBackToMenu}>
      {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
      {isOnlineMode && <VoiceChat enabled={gameStarted} myId={roomService.playerId} roomCode={roomCode} />}

      <div className={styles.playRoot}>
        <div className={styles.mainGameWrapper}>
          <div className={styles.gameContainer}>
            <div className={styles.hud}>
              <span className={`${styles.timer} ${timeLeft <= 30 ? styles.timerUrgent : ""}`}>
                ⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </span>
              <span className={styles.hudHint}>
                {gameOver
                  ? "Game over"
                  : isOnlineMode
                    ? "Find words — everyone plays at once"
                    : localParallel
                      ? "Badge = who gets credit"
                      : "Turn order after each word — drag to select"}
              </span>
            </div>

            <div className={styles.playerBar}>
              {playerNames.slice(0, playerCount).map((name, i) => (
                <button
                  key={i}
                  type="button"
                  className={`${styles.playerBadge} ${!isOnlineMode && localParallel ? styles.playerBadgeClickable : ""} ${
                    (!isOnlineMode && localParallel && i === activePlayerIndex) ||
                    (!isOnlineMode && !localParallel && i === currentPlayerIndex)
                      ? styles.playerBadgeActive
                      : ""
                  }`}
                  onClick={() => {
                    if (!isOnlineMode && localParallel) setActivePlayerIndex(i);
                  }}
                >
                  <span>
                    {PLAYER_COLORS[i].emoji} {name || `P${i + 1}`}
                  </span>
                  <span className={styles.scoreChip}>{scores[i] ?? 0}</span>
                </button>
              ))}
            </div>

            <div
              className={`${styles.wordPreview} ${!wordPreview ? styles.wordPreviewEmpty : ""}`}
              aria-live="polite"
            >
              {wordPreview || "Click & drag through letters in a straight line…"}
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={`${btnStyles.btn} ${btnStyles.btnPrimary}`}
                disabled={selectedPath.length < 3 || !canInteract}
                onClick={() => trySubmit()}
              >
                Submit word
              </button>
              <button type="button" className={`${btnStyles.btn} ${btnStyles.btnSecondary}`} onClick={clearPath}>
                Clear
              </button>
            </div>

            <div className={styles.gridWrap}>
              <div className={styles.grid}>
                {grid.map((row, r) =>
                  row.map((letter, c) => {
                    const inPath = selectedPath.some(([pr, pc]) => pr === r && pc === c);
                    let foundBy = null;
                    if (!inPath) {
                      for (const w of wordTargets) {
                        if (
                          typeof w.foundBy === "number" &&
                          w.path?.some(([pr, pc]) => pr === r && pc === c)
                        ) {
                          foundBy = w.foundBy;
                          break;
                        }
                      }
                    }
                    const disabled = !canInteract;
                    return (
                      <div
                        key={`${r}-${c}`}
                        role="gridcell"
                        data-wh-cell
                        data-r={r}
                        data-c={c}
                        className={`${styles.cell} ${inPath ? styles.cellSelected : ""} ${
                          !inPath && foundBy !== null ? styles.cellFound : ""
                        } ${disabled ? styles.cellDisabled : ""}`}
                        style={
                          !inPath && foundBy !== null
                            ? {
                                background: `color-mix(in srgb, ${PLAYER_COLORS[foundBy]?.light ?? "#94a3b8"} 32%, rgba(30, 41, 59, 0.9))`,
                                borderColor: PLAYER_COLORS[foundBy]?.light ?? "#94a3b8",
                              }
                            : undefined
                        }
                        onPointerDown={disabled ? undefined : handleCellPointerDown(r, c)}
                      >
                        {letter}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className={styles.targetWordPanel}>
              <p className={styles.wordListsTitle}>Word list</p>
              <ul className={styles.targetWordList}>
                {wordTargets.map((w) => {
                  const claimed = typeof w.foundBy === "number";
                  return (
                    <li key={w.text} className={styles.targetWordRow}>
                      <span className={styles.targetWordText}>{w.text}</span>
                      {!claimed ? (
                        <span className={styles.targetWordStatus} aria-label="Not found">
                          ❌
                        </span>
                      ) : (
                        <span
                          className={styles.targetWordStatus}
                          style={{ color: PLAYER_COLORS[w.foundBy]?.light }}
                          aria-label={`Found by ${playerNames[w.foundBy]}`}
                        >
                          ✅ {playerNames[w.foundBy] || `P${w.foundBy + 1}`}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className={styles.wordLists}>
              <p className={styles.wordListsTitle}>Words found</p>
              {playerNames.slice(0, playerCount).map((name, i) => (
                <div key={i} className={styles.wordListCol}>
                  <div className={styles.wordListName} style={{ color: PLAYER_COLORS[i].light }}>
                    {PLAYER_COLORS[i].emoji} {name || `P${i + 1}`}
                  </div>
                  <div className={styles.wordTags}>
                    {(playerWords[i] || []).map((w, wi) => (
                      <span key={`${i}-${wi}-${w}`} className={styles.wordTag}>
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {gameOver && (
              <div className={styles.resultCard}>
                <h2 className={styles.resultTitle}>
                  {winnerIndex === null ? "🤝 Tie game!" : `${PLAYER_COLORS[winnerIndex].emoji} ${playerNames[winnerIndex]} wins!`}
                </h2>
                {(!isOnlineMode || isHost) && (
                  <button
                    type="button"
                    className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`}
                    onClick={handlePlayAgain}
                  >
                    Play Again
                  </button>
                )}
              </div>
            )}

            <div className={styles.rulesArea}>
              <GameRules rules={rules} compact />
            </div>
          </div>

          <div className={styles.sidebarSlot}>
            <MatchHistorySidebar
              players={playerNames.slice(0, playerCount).map((n, i) => ({
                name: n || `Player ${i + 1}`,
                emoji: PLAYER_COLORS[i].emoji,
              }))}
              scores={scores}
              history={matchHistory}
              getPlayerColor={(i) => PLAYER_COLORS[i]?.color}
              getPlayerLightColor={(i) => PLAYER_COLORS[i]?.light}
              getPlayerBadge={(i) => PLAYER_COLORS[i]?.emoji}
            />
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
