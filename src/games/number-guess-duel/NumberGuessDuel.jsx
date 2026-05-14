import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import GameLayout from "../../layout/GameLayout";
import GameModeSelector from "../../components/GameModeSelector";
import OnlineRoomSetup from "../../components/OnlineRoomSetup";
import OnlineRoomExample from "../../components/OnlineRoomExample";
import PlayerNameInput from "../../components/PlayerNameInput";
import GameRules from "../../components/GameRules";
import CustomAlert from "../../components/CustomAlert";
import VoiceChat from "../../components/VoiceChat";
import MatchHistorySidebar from "../../components/MatchHistorySidebar";
import roomService from "../../services/roomService";
import btnStyles from "../../styles/Button.module.css";
import inputStyles from "../../styles/Input.module.css";
import styles from "../../styles/NumberGuessDuel.module.css";
import {
  compareGuess,
  hintLabel,
  isDuplicateGuess,
  isValidSecret,
} from "./numberGuessDuelLogic";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 2;

const ACTIONS = {
  GAME_START: "ngd-game-start",
  SET_SECRET: "ngd-set-secret",
  MAKE_GUESS: "ngd-make-guess",
  SYNC_STATE: "ngd-sync-state",
  GAME_OVER: "ngd-game-over",
  RESTART: "ngd-restart",
};

const RANGE_PRESETS = [
  { id: "easy", label: "1 – 50", max: 50 },
  { id: "medium", label: "1 – 100", max: 100 },
  { id: "hard", label: "1 – 500", max: 500 },
];

const PLAYER_COLORS = [
  { emoji: "🔴", color: "#e53e3e", light: "#fc8181" },
  { emoji: "🔵", color: "#3182ce", light: "#63b3ed" },
];

function emptyGuesses() {
  return [[], []];
}

function buildPublicState(playerNames, rangeMin, rangeMax) {
  return {
    phase: "selecting",
    rangeMin,
    rangeMax,
    secretLocked: [false, false],
    guesses: emptyGuesses(),
    currentPlayerIndex: 0,
    winnerIndex: null,
    playerNames: [...playerNames],
  };
}

export default function NumberGuessDuel({ onBack, initialRoomCode, onGameStart, isPlayMode = false }) {
  const location = useLocation();
  const gameState = location.state || {};

  const [gameMode, setGameMode] = useState(isPlayMode ? gameState.gameMode || "local" : null);
  const [gameStarted, setGameStarted] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const [playerNames, setPlayerNames] = useState(["", ""]);
  const [rangePresetId, setRangePresetId] = useState("medium");

  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [myPlayerIndex, setMyPlayerIndex] = useState(null);

  /** Full public state (no secrets) */
  const [phase, setPhase] = useState("selecting");
  const [rangeMin, setRangeMin] = useState(1);
  const [rangeMax, setRangeMax] = useState(100);
  const [secretLocked, setSecretLocked] = useState([false, false]);
  const [guesses, setGuesses] = useState(emptyGuesses);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [winnerIndex, setWinnerIndex] = useState(null);

  /** Local-only: both secrets on same device */
  const [localSecrets, setLocalSecrets] = useState([null, null]);
  const [localSecretStep, setLocalSecretStep] = useState(0);

  const [guessInput, setGuessInput] = useState("");
  const [secretInput, setSecretInput] = useState("");

  const [matchHistory, setMatchHistory] = useState([]);

  const secretsRef = useRef([null, null]);
  const publicStateRef = useRef(null);
  const guessesRef = useRef(guesses);
  const playerNamesRef = useRef(playerNames);
  const gameOverRef = useRef(false);

  const rangeMaxForPreset = useMemo(
    () => RANGE_PRESETS.find((p) => p.id === rangePresetId)?.max ?? 100,
    [rangePresetId]
  );

  useEffect(() => {
    playerNamesRef.current = playerNames;
  }, [playerNames]);

  useEffect(() => {
    guessesRef.current = guesses;
  }, [guesses]);

  useEffect(() => {
    publicStateRef.current = {
      phase,
      rangeMin,
      rangeMax,
      secretLocked,
      guesses,
      currentPlayerIndex,
      winnerIndex,
      playerNames,
    };
  }, [phase, rangeMin, rangeMax, secretLocked, guesses, currentPlayerIndex, winnerIndex, playerNames]);

  useEffect(() => {
    gameOverRef.current = phase === "finished";
  }, [phase]);

  const syncPayload = useCallback(
    (overrides = {}) => ({
      phase: overrides.phase ?? phase,
      rangeMin: overrides.rangeMin ?? rangeMin,
      rangeMax: overrides.rangeMax ?? rangeMax,
      secretLocked: overrides.secretLocked ?? secretLocked,
      guesses: overrides.guesses ?? guesses,
      currentPlayerIndex: overrides.currentPlayerIndex ?? currentPlayerIndex,
      winnerIndex: overrides.winnerIndex ?? winnerIndex,
      playerNames: overrides.playerNames ?? playerNames,
    }),
    [phase, rangeMin, rangeMax, secretLocked, guesses, currentPlayerIndex, winnerIndex, playerNames]
  );

  const applyPublicState = useCallback((s) => {
    if (!s) return;
    if (s.phase === "selecting" || s.phase === "playing" || s.phase === "finished") setPhase(s.phase);
    if (typeof s.rangeMin === "number") setRangeMin(s.rangeMin);
    if (typeof s.rangeMax === "number") setRangeMax(s.rangeMax);
    if (Array.isArray(s.secretLocked)) setSecretLocked(s.secretLocked);
    if (Array.isArray(s.guesses)) setGuesses(s.guesses);
    if (typeof s.currentPlayerIndex === "number") setCurrentPlayerIndex(s.currentPlayerIndex);
    if (s.winnerIndex === null || typeof s.winnerIndex === "number") setWinnerIndex(s.winnerIndex);
    if (Array.isArray(s.playerNames)) setPlayerNames(s.playerNames);
  }, []);

  const broadcastSync = useCallback(
    (overrides = {}) => {
      roomService.sendGameAction(ACTIONS.SYNC_STATE, syncPayload(overrides));
    },
    [syncPayload]
  );

  const broadcastRestart = useCallback(
    (names, rMin, rMax) => {
      const next = buildPublicState(names, rMin, rMax);
      roomService.sendGameAction(ACTIONS.RESTART, { state: next });
      roomService.sendGameAction(ACTIONS.SYNC_STATE, next);
    },
    []
  );

  const hostApplySecret = useCallback(
    (playerIndex, secret, senderName) => {
      const names = playerNamesRef.current;
      if (typeof playerIndex !== "number" || playerIndex < 0 || playerIndex > 1) return false;
      if (names[playerIndex]?.trim() !== senderName?.trim()) return false;
      if (secretsRef.current[playerIndex] !== null) return false;
      const rMin = publicStateRef.current?.rangeMin ?? 1;
      const rMax = publicStateRef.current?.rangeMax ?? 100;
      if (!isValidSecret(secret, rMin, rMax)) return false;

      secretsRef.current[playerIndex] = secret;
      const locked = [secretsRef.current[0] !== null, secretsRef.current[1] !== null];
      const nextPhase = locked[0] && locked[1] ? "playing" : "selecting";

      setSecretLocked(locked);
      setPhase(nextPhase);
      if (locked[0] && locked[1]) {
        setCurrentPlayerIndex(0);
        setGuessInput("");
      }

      broadcastSync({
        secretLocked: locked,
        phase: nextPhase,
        ...(locked[0] && locked[1] ? { currentPlayerIndex: 0 } : {}),
      });
      return true;
    },
    [broadcastSync]
  );

  const hostApplyGuess = useCallback(
    (playerIndex, guess, senderName) => {
      const names = playerNamesRef.current;
      const ps = publicStateRef.current;
      if (!ps || ps.phase !== "playing") return false;
      if (playerIndex !== ps.currentPlayerIndex) return false;
      if (names[playerIndex]?.trim() !== senderName?.trim()) return false;
      const rMin = ps.rangeMin;
      const rMax = ps.rangeMax;
      if (!isValidSecret(guess, rMin, rMax)) return false;

      const opp = 1 - playerIndex;
      const target = secretsRef.current[opp];
      if (target === null || target === undefined) return false;

      const myList = guessesRef.current[playerIndex] || [];
      if (isDuplicateGuess(guess, myList)) return false;

      const hint = compareGuess(guess, target);
      const nextGuesses = guessesRef.current.map((g, i) =>
        i === playerIndex ? [...g, { value: guess, hint }] : g
      );

      if (hint === "correct") {
        const w = playerIndex;
        setGuesses(nextGuesses);
        setPhase("finished");
        setWinnerIndex(w);
        setMatchHistory((prev) => [...prev, { winner: w, date: Date.now() }]);
        broadcastSync({
          guesses: nextGuesses,
          phase: "finished",
          winnerIndex: w,
          currentPlayerIndex: playerIndex,
        });
        roomService.sendGameAction(ACTIONS.GAME_OVER, { winnerIndex: w });
        setGuessInput("");
        return true;
      }

      const nextPlayer = opp;
      setGuesses(nextGuesses);
      setCurrentPlayerIndex(nextPlayer);
      setGuessInput("");
      broadcastSync({
        guesses: nextGuesses,
        currentPlayerIndex: nextPlayer,
      });
      return true;
    },
    [broadcastSync]
  );

  const handleLocalSubmitSecret = () => {
    const raw = parseInt(secretInput, 10);
    const step = localSecretStep;
    if (!isValidSecret(raw, rangeMin, rangeMax)) {
      setAlertMessage(`Enter a whole number between ${rangeMin} and ${rangeMax}.`);
      return;
    }
    if (secretsRef.current[step] !== null) return;

    const next = [...localSecrets];
    next[step] = raw;
    setLocalSecrets(next);
    secretsRef.current[step] = raw;
    setSecretInput("");

    const locked = [secretsRef.current[0] !== null, secretsRef.current[1] !== null];
    setSecretLocked(locked);

    if (step === 0) {
      setLocalSecretStep(1);
      return;
    }

    setPhase("playing");
    setCurrentPlayerIndex(0);
    setGuessInput("");
  };

  const handleLocalSubmitGuess = () => {
    const raw = parseInt(guessInput, 10);
    if (phase !== "playing" || winnerIndex !== null) return;
    if (!isValidSecret(raw, rangeMin, rangeMax)) {
      setAlertMessage(`Enter a whole number between ${rangeMin} and ${rangeMax}.`);
      return;
    }
    const pi = currentPlayerIndex;
    if (isDuplicateGuess(raw, guesses[pi])) {
      setAlertMessage("You already guessed that number.");
      return;
    }
    const opp = 1 - pi;
    const target = secretsRef.current[opp];
    const hint = compareGuess(raw, target);
    const nextGuesses = guesses.map((g, i) =>
      i === pi ? [...g, { value: raw, hint }] : g
    );

    if (hint === "correct") {
      setGuesses(nextGuesses);
      setPhase("finished");
      setWinnerIndex(pi);
      setMatchHistory((prev) => [...prev, { winner: pi, date: Date.now() }]);
      setGuessInput("");
      return;
    }

    setGuesses(nextGuesses);
    setCurrentPlayerIndex(opp);
    setGuessInput("");
  };

  const submitOnlineSecret = () => {
    if (myPlayerIndex === null) return;
    const raw = parseInt(secretInput, 10);
    if (!isValidSecret(raw, rangeMin, rangeMax)) {
      setAlertMessage(`Enter a whole number between ${rangeMin} and ${rangeMax}.`);
      return;
    }
    if (isHost) {
      const ok = hostApplySecret(myPlayerIndex, raw, roomService.playerName);
      if (ok) setSecretInput("");
    } else {
      roomService.sendGameAction(ACTIONS.SET_SECRET, { playerIndex: myPlayerIndex, secret: raw });
      setSecretInput("");
    }
  };

  const submitOnlineGuess = () => {
    if (myPlayerIndex === null) return;
    const raw = parseInt(guessInput, 10);
    if (isHost) {
      const ok = hostApplyGuess(myPlayerIndex, raw, roomService.playerName);
      if (!ok) setAlertMessage("Invalid guess, duplicate, or not your turn.");
    } else {
      roomService.sendGameAction(ACTIONS.MAKE_GUESS, { playerIndex: myPlayerIndex, guess: raw });
      setGuessInput("");
    }
  };

  const resetGameState = useCallback(
    (names, rMin, rMax) => {
      secretsRef.current = [null, null];
      setLocalSecrets([null, null]);
      setLocalSecretStep(0);
      setSecretInput("");
      setGuessInput("");
      const next = buildPublicState(names, rMin, rMax);
      applyPublicState(next);
    },
    [applyPublicState]
  );

  const handlePlayAgain = () => {
    const names = [...playerNames];
    const rMin = 1;
    const rMax = rangeMax;
    if (isOnlineMode && isHost) {
      secretsRef.current = [null, null];
      setLocalSecrets([null, null]);
      setLocalSecretStep(0);
      setSecretInput("");
      setGuessInput("");
      const next = buildPublicState(names, rMin, rMax);
      applyPublicState(next);
      broadcastRestart(names, rMin, rMax);
      return;
    }
    if (isOnlineMode && !isHost) return;
    resetGameState(names, rMin, rMax);
  };

  useEffect(() => {
    if (!isOnlineMode || !isInRoom) return;

    const onError = (msg) => setAlertMessage(msg);
    const onPlayerJoined = () => setConnectedPlayers([...roomService.getConnectedPlayers()]);
    const onPlayerLeft = () => {
      setConnectedPlayers([...roomService.getConnectedPlayers()]);
      if (gameStarted) setAlertMessage("A player disconnected.");
    };

    const onGameAction = (data) => {
      switch (data.action) {
        case ACTIONS.GAME_START:
          if (data.payload?.state) applyPublicState(data.payload.state);
          if (Array.isArray(data.payload?.players)) {
            setPlayerNames(data.payload.players);
            const idx = data.payload.players.indexOf(roomService.playerName);
            setMyPlayerIndex(idx >= 0 ? idx : null);
          }
          setGameStarted(true);
          setWaitingForPlayers(false);
          secretsRef.current = [null, null];
          setSecretInput("");
          setGuessInput("");
          if (onGameStart && !isPlayMode) onGameStart();
          break;
        case ACTIONS.SET_SECRET:
          if (isHost) {
            const { playerIndex, secret } = data.payload || {};
            hostApplySecret(playerIndex, secret, data.playerName);
          }
          break;
        case ACTIONS.MAKE_GUESS:
          if (isHost) {
            const { playerIndex, guess } = data.payload || {};
            hostApplyGuess(playerIndex, guess, data.playerName);
          }
          break;
        case ACTIONS.SYNC_STATE:
          applyPublicState(data.payload);
          break;
        case ACTIONS.RESTART:
          if (data.payload?.state) applyPublicState(data.payload.state);
          secretsRef.current = [null, null];
          setSecretInput("");
          setGuessInput("");
          break;
        case ACTIONS.GAME_OVER:
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
    applyPublicState,
    gameStarted,
    hostApplyGuess,
    hostApplySecret,
    isHost,
    isInRoom,
    isOnlineMode,
    isPlayMode,
    onGameStart,
  ]);

  useEffect(() => {
    if (initialRoomCode && !gameMode && !isInRoom) {
      setGameMode("online");
      setIsOnlineMode(true);
      setRoomCode(String(initialRoomCode).toUpperCase().trim());
    }
  }, [initialRoomCode, gameMode, isInRoom]);

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
    resetGameState(["", ""], 1, 100);
  }, [resetGameState]);

  const startLocalGame = () => {
    if (playerNames.some((n) => !n.trim())) {
      setAlertMessage("Please enter both player names.");
      return;
    }
    const rMax = rangeMaxForPreset;
    resetGameState(playerNames, 1, rMax);
    setGameStarted(true);
    setLocalSecretStep(0);
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
    if (connectedPlayers.length !== MAX_PLAYERS) {
      setAlertMessage(`Need exactly ${MAX_PLAYERS} players.`);
      return;
    }
    const names = connectedPlayers.map((p) => p.playerName);
    const rMax = rangeMaxForPreset;
    const st = buildPublicState(names, 1, rMax);
    roomService.sendGameAction(ACTIONS.GAME_START, { players: names, state: st });
    applyPublicState(st);
    setPlayerNames(names);
    setMyPlayerIndex(names.indexOf(roomService.playerName));
    secretsRef.current = [null, null];
    setGameStarted(true);
    setWaitingForPlayers(false);
    setGuessInput("");
    setSecretInput("");
    if (onGameStart && !isPlayMode) onGameStart();
  };

  const rules = [
    "Two players each pick a secret number in the chosen range (hidden from the other player).",
    "Take turns guessing the opponent’s number. After each guess you’ll hear Higher ⬆️, Lower ⬇️, or Correct ✅.",
    "First to guess the opponent’s number wins the round.",
    isOnlineMode
      ? "Online: the host validates guesses — your opponent’s secret is never shown on your screen."
      : "Local: enter secrets one at a time so the other player doesn’t see your number.",
  ];

  const headerRight =
    gameStarted && phase === "playing"
      ? `Turn: ${PLAYER_COLORS[currentPlayerIndex].emoji} ${playerNames[currentPlayerIndex] || `P${currentPlayerIndex + 1}`}`
      : gameStarted && phase === "selecting"
        ? "Pick secret numbers"
        : gameStarted && phase === "finished"
          ? "Round over"
          : "";

  if (!gameMode) {
    return (
      <GameLayout title="🔢 Number Guess Duel" onBack={onBack}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>Choose how you want to play (2 players)</p>
          <GameModeSelector
            onSelectLocal={() => {
              setGameMode("local");
              setIsOnlineMode(false);
            }}
            onSelectOnline={() => {
              setGameMode("online");
              setIsOnlineMode(true);
            }}
            localLabel="Local (same device)"
            onlineLabel="Online Multiplayer"
            maxPlayers="2 players"
          />
        </div>
      </GameLayout>
    );
  }

  if (isOnlineMode && !isInRoom) {
    return (
      <GameLayout title="🔢 Number Guess Duel — Online" onBack={handleBackToMenu}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>Create or join a room (exactly 2 players)</p>
          <div className={styles.presetRow}>
            <span className={styles.presetLabel}>Range:</span>
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`${styles.presetBtn} ${rangePresetId === p.id ? styles.presetBtnActive : ""}`}
                onClick={() => setRangePresetId(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
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
      <GameLayout title="🔢 Number Guess Duel — Waiting Room" onBack={handleBackToMenu}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <OnlineRoomExample
          roomCode={roomCode}
          connectedPlayers={connectedPlayers}
          maxPlayers={2}
          isHost={isHost}
          minPlayers={MIN_PLAYERS}
          onStartGame={handleStartOnlineGame}
          gameUrl={`${window.location.origin}/games/number-guess-duel?room=${roomCode}`}
          symbols={PLAYER_COLORS.map((p) => p.emoji)}
        />
      </GameLayout>
    );
  }

  if (!gameStarted && !isOnlineMode) {
    return (
      <GameLayout title="🔢 Number Guess Duel — Setup" onBack={handleBackToMenu}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>Two players · Same screen (pass &amp; play for secrets)</p>
          <div className={styles.presetRow}>
            <span className={styles.presetLabel}>Range:</span>
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`${styles.presetBtn} ${rangePresetId === p.id ? styles.presetBtnActive : ""}`}
                onClick={() => setRangePresetId(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <PlayerNameInput
            players={playerNames}
            onPlayerChange={(idx, value) => {
              const next = [...playerNames];
              next[idx] = value;
              setPlayerNames(next);
            }}
            minPlayers={2}
            showSymbols
            symbols={PLAYER_COLORS.map((p) => p.emoji)}
          />
          <div className={styles.setupButtons}>
            <button
              type="button"
              className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`}
              onClick={startLocalGame}
            >
              Start game
            </button>
          </div>
        </div>
      </GameLayout>
    );
  }

  const showSecretFormLocal =
    !isOnlineMode && phase === "selecting" && localSecretStep < 2 && !secretLocked[localSecretStep];
  const showSecretFormOnline =
    isOnlineMode && phase === "selecting" && myPlayerIndex !== null && !secretLocked[myPlayerIndex];

  const guessingAllowed =
    phase === "playing" &&
    (isOnlineMode ? myPlayerIndex === currentPlayerIndex : true);

  return (
    <GameLayout title="🔢 Number Guess Duel" currentPlayer={headerRight} onBack={handleBackToMenu}>
      {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
      {isOnlineMode && <VoiceChat enabled={gameStarted} myId={roomService.playerId} roomCode={roomCode} />}

      <div className={styles.playRoot}>
        <div className={styles.mainGameWrapper}>
          <div className={styles.gameContainer}>
            <div className={styles.rangeBadge}>
              Range: {rangeMin} – {rangeMax}
            </div>

            {(showSecretFormLocal || showSecretFormOnline) && (
              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>
                  {showSecretFormLocal
                    ? `${PLAYER_COLORS[localSecretStep].emoji} ${playerNames[localSecretStep] || `Player ${localSecretStep + 1}`}: enter your secret number`
                    : `${PLAYER_COLORS[myPlayerIndex].emoji} Enter your secret number`}
                </h3>
                <p className={styles.panelHint}>Opponent won’t see this.</p>
                <input
                  type="password"
                  inputMode="numeric"
                  className={inputStyles.input}
                  placeholder={`${rangeMin}–${rangeMax}`}
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value.replace(/\D/g, ""))}
                />
                <button
                  type="button"
                  className={`${btnStyles.btn} ${btnStyles.btnPrimary}`}
                  onClick={showSecretFormLocal ? handleLocalSubmitSecret : submitOnlineSecret}
                >
                  Lock secret
                </button>
              </div>
            )}

            {phase === "selecting" && isOnlineMode && myPlayerIndex !== null && secretLocked[myPlayerIndex] && (
              <div className={styles.waitBanner}>✓ Your secret is set. Waiting for opponent…</div>
            )}

            {phase === "playing" && (
              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>
                  {guessingAllowed
                    ? `Your turn — guess ${PLAYER_COLORS[1 - currentPlayerIndex].emoji} ${playerNames[1 - currentPlayerIndex]}’s number`
                    : `Waiting for ${PLAYER_COLORS[currentPlayerIndex].emoji} ${playerNames[currentPlayerIndex]}…`}
                </h3>
                <input
                  type="text"
                  inputMode="numeric"
                  className={inputStyles.input}
                  placeholder={`Guess (${rangeMin}–${rangeMax})`}
                  disabled={!guessingAllowed}
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value.replace(/\D/g, ""))}
                />
                <button
                  type="button"
                  className={`${btnStyles.btn} ${btnStyles.btnPrimary}`}
                  disabled={!guessingAllowed}
                  onClick={isOnlineMode ? submitOnlineGuess : handleLocalSubmitGuess}
                >
                  Submit guess
                </button>
              </div>
            )}

            {phase === "finished" && winnerIndex !== null && (
              <div className={styles.resultBanner}>
                <span className={styles.resultEmoji}>
                  {PLAYER_COLORS[winnerIndex].emoji} {playerNames[winnerIndex]} wins!
                </span>
                {(!isOnlineMode || isHost) && (
                  <button
                    type="button"
                    className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`}
                    onClick={handlePlayAgain}
                  >
                    Play again
                  </button>
                )}
              </div>
            )}

            <div className={styles.historySection}>
              <h4 className={styles.historyTitle}>Guess history</h4>
              <div className={styles.historyCols}>
                {[0, 1].map((pi) => (
                  <div key={pi} className={styles.historyCol}>
                    <div className={styles.historyName} style={{ color: PLAYER_COLORS[pi].light }}>
                      {PLAYER_COLORS[pi].emoji} {playerNames[pi] || `P${pi + 1}`}
                    </div>
                    <ul className={styles.historyList}>
                      {(guesses[pi] || []).map((g, i) => (
                        <li key={`${pi}-${i}-${g.value}`}>
                          {g.value} → {hintLabel(g.hint)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.rulesArea}>
              <GameRules rules={rules} compact />
            </div>
          </div>

          <div className={styles.sidebarSlot}>
            <MatchHistorySidebar
              players={playerNames.map((n, i) => ({
                name: n || `Player ${i + 1}`,
                emoji: PLAYER_COLORS[i].emoji,
              }))}
              scores={[
                matchHistory.filter((m) => m.winner === 0).length,
                matchHistory.filter((m) => m.winner === 1).length,
              ]}
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
