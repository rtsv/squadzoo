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
import roomService from "../../services/roomService";
import btnStyles from "../../styles/Button.module.css";
import styles from "../../styles/BoxBlitz.module.css";

const GRID_SIZE = 4; // 4x4 boxes, 5x5 dots
const MAX_PLAYERS = 4;
const MIN_PLAYERS = 2;

const PLAYER_COLORS = [
  { id: "red", emoji: "🔴", color: "#e53e3e", light: "#fc8181" },
  { id: "blue", emoji: "🔵", color: "#3182ce", light: "#63b3ed" },
  { id: "green", emoji: "🟢", color: "#38a169", light: "#68d391" },
  { id: "yellow", emoji: "🟡", color: "#d69e2e", light: "#f6e05e" },
];

const DICE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const ACTIONS = {
  GAME_START: "GAME_START",
  REQUEST_ROLL: "REQUEST_ROLL",
  ROLL_DICE: "ROLL_DICE",
  DRAW_EDGE: "DRAW_EDGE",
  UPDATE_STATE: "UPDATE_STATE",
  GAME_OVER: "GAME_OVER",
  RESTART_GAME: "RESTART_GAME",
};

const edgeH = (r, c) => `h-${r}-${c}`;
const edgeV = (r, c) => `v-${r}-${c}`;
const boxId = (r, c) => `b-${r}-${c}`;

function createInitialBoard() {
  const edges = {};
  const boxes = {};

  for (let r = 0; r <= GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const id = edgeH(r, c);
      edges[id] = { id, isDrawn: false, playerId: null };
    }
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c <= GRID_SIZE; c++) {
      const id = edgeV(r, c);
      edges[id] = { id, isDrawn: false, playerId: null };
    }
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const id = boxId(r, c);
      boxes[id] = {
        id,
        edges: [edgeH(r, c), edgeH(r + 1, c), edgeV(r, c), edgeV(r, c + 1)],
        owner: null,
      };
    }
  }

  return { edges, boxes };
}

function getWinnerIndex(scores, playerCount) {
  let best = -1;
  let bestScore = -1;
  let tie = false;
  for (let i = 0; i < playerCount; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      best = i;
      tie = false;
    } else if (scores[i] === bestScore) {
      tie = true;
    }
  }
  return tie ? null : best;
}

export default function BoxBlitz({ onBack, initialRoomCode, onGameStart, isPlayMode = false }) {
  const location = useLocation();
  const gameState = location.state || {};

  const [gameMode, setGameMode] = useState(isPlayMode ? (gameState.gameMode || "local") : null);
  const [gameStarted, setGameStarted] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState(["", ""]);

  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [myPlayerIndex, setMyPlayerIndex] = useState(null);

  const [edges, setEdges] = useState({});
  const [boxes, setBoxes] = useState({});
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState(null);
  const [remainingMoves, setRemainingMoves] = useState(0);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [turnCount, setTurnCount] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [winner, setWinner] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [lastAction, setLastAction] = useState("");
  const [matchHistory, setMatchHistory] = useState([]);

  const edgesRef = useRef(edges);
  const boxesRef = useRef(boxes);
  const currentPlayerRef = useRef(currentPlayerIndex);
  const scoresRef = useRef(scores);
  const remainingMovesRef = useRef(remainingMoves);
  const diceValueRef = useRef(diceValue);
  const turnCountRef = useRef(turnCount);
  const gameOverRef = useRef(gameOver);
  const winnerRef = useRef(winner);

  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { boxesRef.current = boxes; }, [boxes]);
  useEffect(() => { currentPlayerRef.current = currentPlayerIndex; }, [currentPlayerIndex]);
  useEffect(() => { scoresRef.current = scores; }, [scores]);
  useEffect(() => { remainingMovesRef.current = remainingMoves; }, [remainingMoves]);
  useEffect(() => { diceValueRef.current = diceValue; }, [diceValue]);
  useEffect(() => { turnCountRef.current = turnCount; }, [turnCount]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { winnerRef.current = winner; }, [winner]);

  const availableEdgesCount = useMemo(
    () => Object.values(edges).filter((e) => !e.isDrawn).length,
    [edges]
  );

  const startNewRoundState = useCallback((playersCount) => {
    const initial = createInitialBoard();
    setEdges(initial.edges);
    setBoxes(initial.boxes);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setRemainingMoves(0);
    setTurnCount(1);
    setWinner(null);
    setGameOver(false);
    setLastAction("");
    setScores((prev) => {
      const next = [...prev];
      for (let i = 0; i < MAX_PLAYERS; i++) next[i] = i < playersCount ? prev[i] || 0 : 0;
      return next;
    });
    return initial;
  }, []);

  const getStatePayload = useCallback((overrides = {}) => ({
    edges: overrides.edges ?? edgesRef.current,
    boxes: overrides.boxes ?? boxesRef.current,
    currentPlayerIndex: overrides.currentPlayerIndex ?? currentPlayerRef.current,
    diceValue: overrides.diceValue ?? diceValueRef.current,
    remainingMoves: overrides.remainingMoves ?? remainingMovesRef.current,
    scores: overrides.scores ?? scoresRef.current,
    turnCount: overrides.turnCount ?? turnCountRef.current,
    gameOver: overrides.gameOver ?? gameOverRef.current,
    winner: overrides.winner ?? winnerRef.current,
    lastAction: overrides.lastAction ?? lastAction,
    matchHistory: overrides.matchHistory ?? matchHistory,
  }), [lastAction, matchHistory]);

  const broadcastState = useCallback((overrides = {}) => {
    roomService.sendGameAction(ACTIONS.UPDATE_STATE, { state: getStatePayload(overrides) });
  }, [getStatePayload]);

  const applyStateFromHost = useCallback((state) => {
    if (!state) return;
    setEdges(state.edges || {});
    setBoxes(state.boxes || {});
    setCurrentPlayerIndex(state.currentPlayerIndex ?? 0);
    setDiceValue(state.diceValue ?? null);
    setRemainingMoves(state.remainingMoves ?? 0);
    setScores(state.scores || [0, 0, 0, 0]);
    setTurnCount(state.turnCount ?? 1);
    setGameOver(!!state.gameOver);
    setWinner(state.winner ?? null);
    setLastAction(state.lastAction || "");
    if (Array.isArray(state.matchHistory)) setMatchHistory(state.matchHistory);
  }, []);

  const finishGameIfNeeded = useCallback((nextBoxes, nextScores) => {
    const allFilled = Object.values(nextBoxes).every((b) => !!b.owner);
    if (!allFilled) return { over: false, winnerIndex: null };
    const winnerIndex = getWinnerIndex(nextScores, numPlayers);
    return { over: true, winnerIndex };
  }, [numPlayers]);

  const hostApplyRoll = useCallback((rolledValue) => {
    const available = Object.values(edgesRef.current).filter((e) => !e.isDrawn).length;
    const allowedMoves = Math.min(rolledValue, available);
    setDiceValue(rolledValue);
    setRemainingMoves(allowedMoves);
    setLastAction(`${playerNames[currentPlayerRef.current]} rolled ${rolledValue}`);
    broadcastState({
      diceValue: rolledValue,
      remainingMoves: allowedMoves,
      lastAction: `${playerNames[currentPlayerRef.current]} rolled ${rolledValue}`,
    });
  }, [broadcastState, playerNames]);

  const hostApplyEdge = useCallback((edgeId, playerIndex) => {
    if (gameOverRef.current) return;
    if (playerIndex !== currentPlayerRef.current) return;
    if (!edgeId || !edgesRef.current[edgeId] || edgesRef.current[edgeId].isDrawn) return;
    if (remainingMovesRef.current <= 0) return;

    const nextEdges = { ...edgesRef.current, [edgeId]: { ...edgesRef.current[edgeId], isDrawn: true, playerId: `${playerIndex}` } };
    const nextBoxes = { ...boxesRef.current };
    const nextScores = [...scoresRef.current];
    let completedThisMove = 0;

    Object.values(nextBoxes).forEach((box) => {
      if (box.owner) return;
      if (!box.edges.includes(edgeId)) return;
      const complete = box.edges.every((id) => nextEdges[id]?.isDrawn);
      if (complete) {
        nextBoxes[box.id] = { ...box, owner: `${playerIndex}` };
        nextScores[playerIndex] += 1;
        completedThisMove += 1;
      }
    });

    // Always consume exactly one move per drawn edge, before box completion logic.
    let nextRemaining = remainingMovesRef.current - 1;

    let nextPlayer = currentPlayerRef.current;
    let nextTurn = turnCountRef.current;
    let nextDice = diceValueRef.current;
    let nextMessage = completedThisMove > 0
      ? `${playerNames[playerIndex]} completed ${completedThisMove} box${completedThisMove > 1 ? "es" : ""}!`
      : `${playerNames[playerIndex]} drew a line`;

    if (nextRemaining <= 0) {
      if (completedThisMove === 0) {
        nextPlayer = (currentPlayerRef.current + 1) % numPlayers;
      }
      nextTurn += 1;
      nextDice = null;
      nextMessage = completedThisMove === 0
        ? `${playerNames[nextPlayer]}'s turn`
        : `${playerNames[playerIndex]} keeps turn`;
    }

    const end = finishGameIfNeeded(nextBoxes, nextScores);
    if (end.over) {
      setEdges(nextEdges);
      setBoxes(nextBoxes);
      setScores(nextScores);
      setGameOver(true);
      setWinner(end.winnerIndex);
      setRemainingMoves(0);
      setLastAction(end.winnerIndex === null ? "Game ended in a tie!" : `${playerNames[end.winnerIndex]} wins!`);
      const nextHistory = [...matchHistory, { winner: end.winnerIndex === null ? "draw" : end.winnerIndex, date: Date.now() }];
      setMatchHistory(nextHistory);
      broadcastState({
        edges: nextEdges,
        boxes: nextBoxes,
        scores: nextScores,
        gameOver: true,
        winner: end.winnerIndex,
        remainingMoves: 0,
        lastAction: end.winnerIndex === null ? "Game ended in a tie!" : `${playerNames[end.winnerIndex]} wins!`,
        matchHistory: nextHistory,
      });
      roomService.sendGameAction(ACTIONS.GAME_OVER, {});
      return;
    }

    setEdges(nextEdges);
    setBoxes(nextBoxes);
    setScores(nextScores);
    setRemainingMoves(nextRemaining <= 0 ? 0 : nextRemaining);
    setCurrentPlayerIndex(nextPlayer);
    setTurnCount(nextTurn);
    setDiceValue(nextDice);
    setLastAction(nextMessage);
    broadcastState({
      edges: nextEdges,
      boxes: nextBoxes,
      scores: nextScores,
      remainingMoves: nextRemaining <= 0 ? 0 : nextRemaining,
      currentPlayerIndex: nextPlayer,
      turnCount: nextTurn,
      diceValue: nextDice,
      lastAction: nextMessage,
    });
  }, [broadcastState, finishGameIfNeeded, matchHistory, numPlayers, playerNames]);

  const rollDice = () => {
    if (gameOver || isRolling || remainingMoves > 0) return;
    if (isOnlineMode && myPlayerIndex !== currentPlayerIndex) return;

    setIsRolling(true);

    if (isOnlineMode) {
      if (isHost) {
        const rolled = Math.floor(Math.random() * 6) + 1;
        roomService.sendGameAction(ACTIONS.ROLL_DICE, {
          value: rolled,
          playerIndex: currentPlayerRef.current,
        });
        setTimeout(() => {
          setIsRolling(false);
          hostApplyRoll(rolled);
        }, 500);
      } else {
        roomService.sendGameAction(ACTIONS.REQUEST_ROLL, { playerIndex: myPlayerIndex });
        setTimeout(() => setIsRolling(false), 500);
      }
      return;
    }

    const rolled = Math.floor(Math.random() * 6) + 1;
    setTimeout(() => {
      setIsRolling(false);
      setDiceValue(rolled);
      const allowed = Math.min(rolled, availableEdgesCount);
      setRemainingMoves(allowed);
      setLastAction(`${playerNames[currentPlayerIndex]} rolled ${rolled}`);
    }, 500);
  };

  const drawEdge = (id) => {
    if (!id || !edges[id] || edges[id].isDrawn) return;
    if (gameOver || remainingMoves <= 0) return;
    if (isOnlineMode && myPlayerIndex !== currentPlayerIndex) return;

    if (isOnlineMode) {
      if (isHost) {
        hostApplyEdge(id, currentPlayerIndex);
      } else {
        roomService.sendGameAction(ACTIONS.DRAW_EDGE, { edgeId: id, playerIndex: myPlayerIndex });
      }
      return;
    }

    const nextEdges = { ...edges, [id]: { ...edges[id], isDrawn: true, playerId: `${currentPlayerIndex}` } };
    const nextBoxes = { ...boxes };
    const nextScores = [...scores];
    let completed = 0;

    Object.values(nextBoxes).forEach((b) => {
      if (b.owner) return;
      if (!b.edges.includes(id)) return;
      if (b.edges.every((edgeId) => nextEdges[edgeId]?.isDrawn)) {
        nextBoxes[b.id] = { ...b, owner: `${currentPlayerIndex}` };
        nextScores[currentPlayerIndex] += 1;
        completed += 1;
      }
    });

    // Always consume exactly one move per drawn edge, before box completion logic.
    let nextRemaining = remainingMoves - 1;
    let nextPlayer = currentPlayerIndex;
    let nextTurn = turnCount;
    let nextDice = diceValue;
    let msg = completed > 0
      ? `${playerNames[currentPlayerIndex]} completed ${completed} box${completed > 1 ? "es" : ""}!`
      : `${playerNames[currentPlayerIndex]} drew a line`;

    if (nextRemaining <= 0) {
      if (completed === 0) nextPlayer = (currentPlayerIndex + 1) % numPlayers;
      nextTurn += 1;
      nextDice = null;
      msg = completed === 0 ? `${playerNames[nextPlayer]}'s turn` : `${playerNames[currentPlayerIndex]} keeps turn`;
    }

    const end = finishGameIfNeeded(nextBoxes, nextScores);
    setEdges(nextEdges);
    setBoxes(nextBoxes);
    setScores(nextScores);
    setRemainingMoves(end.over ? 0 : Math.max(0, nextRemaining));
    setCurrentPlayerIndex(end.over ? currentPlayerIndex : nextPlayer);
    setTurnCount(nextTurn);
    setDiceValue(end.over ? diceValue : nextDice);
    setLastAction(end.over ? (end.winnerIndex === null ? "Game ended in a tie!" : `${playerNames[end.winnerIndex]} wins!`) : msg);
    if (end.over) {
      setGameOver(true);
      setWinner(end.winnerIndex);
      setMatchHistory((prev) => [...prev, { winner: end.winnerIndex === null ? "draw" : end.winnerIndex, date: Date.now() }]);
    }
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
          setPlayerNames(data.payload.players);
          setNumPlayers(data.payload.players.length);
          setGameStarted(true);
          setWaitingForPlayers(false);
          setMyPlayerIndex(data.payload.players.indexOf(roomService.playerName));
          applyStateFromHost(data.payload.state);
          if (onGameStart && !isPlayMode) onGameStart();
          break;
        case ACTIONS.REQUEST_ROLL:
          if (isHost && data.payload?.playerIndex === currentPlayerRef.current && !gameOverRef.current && remainingMovesRef.current <= 0) {
            const rolled = Math.floor(Math.random() * 6) + 1;
            roomService.sendGameAction(ACTIONS.ROLL_DICE, {
              value: rolled,
              playerIndex: currentPlayerRef.current,
            });
            hostApplyRoll(rolled);
          }
          break;
        case ACTIONS.ROLL_DICE: {
          if (isHost) break;
          const v = data.payload?.value;
          const pIdx = data.payload?.playerIndex;
          if (typeof v !== "number") break;
          const available = Object.values(edgesRef.current).filter((e) => !e.isDrawn).length;
          setDiceValue(v);
          setRemainingMoves(Math.min(v, available));
          const names = playerNames;
          const name =
            typeof pIdx === "number" && names[pIdx]?.trim()
              ? names[pIdx]
              : names[currentPlayerRef.current] || `Player ${(pIdx ?? 0) + 1}`;
          setLastAction(`${name} rolled ${v}`);
          break;
        }
        case ACTIONS.DRAW_EDGE:
          if (isHost) hostApplyEdge(data.payload.edgeId, data.payload.playerIndex);
          break;
        case ACTIONS.UPDATE_STATE:
          applyStateFromHost(data.payload.state);
          break;
        case ACTIONS.RESTART_GAME:
          applyStateFromHost(data.payload.state);
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
  }, [applyStateFromHost, gameStarted, hostApplyEdge, hostApplyRoll, isHost, isOnlineMode, isInRoom, isPlayMode, onGameStart, playerNames]);

  const startLocalGame = () => {
    if (playerNames.some((n) => !n.trim())) {
      setAlertMessage("Please enter all player names!");
      return;
    }
    startNewRoundState(numPlayers);
    setGameStarted(true);
    if (onGameStart && !isPlayMode) onGameStart();
  };

  const handleCreateOnlineRoom = async () => {
    if (!playerName.trim()) return setAlertMessage("Please enter your name!");
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
    if (!playerName.trim() || !roomCode.trim()) return setAlertMessage("Enter name and room code.");
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
      setAlertMessage("Failed to join room.");
    }
  };

  const handleStartOnlineGame = () => {
    if (!isHost) return;
    if (connectedPlayers.length < MIN_PLAYERS || connectedPlayers.length > MAX_PLAYERS) {
      setAlertMessage("Need 2-4 players to start.");
      return;
    }
    const names = connectedPlayers.map((p) => p.playerName);
    setPlayerNames(names);
    setNumPlayers(names.length);
    const initial = startNewRoundState(names.length);
    setGameStarted(true);
    setWaitingForPlayers(false);
    setMyPlayerIndex(0);

    const state = {
      edges: initial.edges,
      boxes: initial.boxes,
      currentPlayerIndex: 0,
      diceValue: null,
      remainingMoves: 0,
      scores: [0, 0, 0, 0],
      turnCount: 1,
      gameOver: false,
      winner: null,
      lastAction: "",
      matchHistory: [],
    };
    roomService.sendGameAction(ACTIONS.GAME_START, { players: names, state });
    if (onGameStart && !isPlayMode) onGameStart();
  };

  const handlePlayAgain = () => {
    const initial = createInitialBoard();
    setEdges(initial.edges);
    setBoxes(initial.boxes);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setRemainingMoves(0);
    setTurnCount(1);
    setWinner(null);
    setGameOver(false);
    setLastAction("");

    const state = {
      edges: initial.edges,
      boxes: initial.boxes,
      currentPlayerIndex: 0,
      diceValue: null,
      remainingMoves: 0,
      scores,
      turnCount: 1,
      gameOver: false,
      winner: null,
      lastAction: "",
      matchHistory,
    };
    if (isOnlineMode && isHost) {
      roomService.sendGameAction(ACTIONS.RESTART_GAME, { state });
      broadcastState(state);
    }
  };

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
    setWinner(null);
    setGameOver(false);
    setAlertMessage(null);
  }, []);

  const rules = [
    "Roll the dice to get how many lines you can draw this turn.",
    "Draw lines between adjacent dots only.",
    "Complete a box to score and gain bonus move(s).",
    "When all boxes are filled, highest score wins.",
  ];

  const isMyTurn = !isOnlineMode || myPlayerIndex === currentPlayerIndex;
  const canRoll = !gameOver && !isRolling && remainingMoves === 0 && isMyTurn;

  const renderBoard = () => {
    const cells = [];
    for (let r = 0; r < GRID_SIZE * 2 + 1; r++) {
      for (let c = 0; c < GRID_SIZE * 2 + 1; c++) {
        if (r % 2 === 0 && c % 2 === 0) {
          cells.push(<div key={`dot-${r}-${c}`} className={styles.dot} />);
          continue;
        }
        if (r % 2 === 0 && c % 2 === 1) {
          const id = edgeH(r / 2, (c - 1) / 2);
          const edge = edges[id];
          const colorIdx = Number(edge?.playerId);
          const selectable = !!edge && !edge.isDrawn && remainingMoves > 0 && isMyTurn && !gameOver;
          cells.push(
            <button
              key={id}
              className={`${styles.edge} ${styles.edgeH} ${edge?.isDrawn ? styles.edgeDrawn : ""} ${selectable ? styles.edgeSelectable : ""}`}
              style={edge?.isDrawn ? { background: PLAYER_COLORS[colorIdx]?.color || "#4a5568" } : undefined}
              onClick={() => (selectable ? drawEdge(id) : null)}
              disabled={!selectable}
            />
          );
          continue;
        }
        if (r % 2 === 1 && c % 2 === 0) {
          const id = edgeV((r - 1) / 2, c / 2);
          const edge = edges[id];
          const colorIdx = Number(edge?.playerId);
          const selectable = !!edge && !edge.isDrawn && remainingMoves > 0 && isMyTurn && !gameOver;
          cells.push(
            <button
              key={id}
              className={`${styles.edge} ${styles.edgeV} ${edge?.isDrawn ? styles.edgeDrawn : ""} ${selectable ? styles.edgeSelectable : ""}`}
              style={edge?.isDrawn ? { background: PLAYER_COLORS[colorIdx]?.color || "#4a5568" } : undefined}
              onClick={() => (selectable ? drawEdge(id) : null)}
              disabled={!selectable}
            />
          );
          continue;
        }
        const id = boxId((r - 1) / 2, (c - 1) / 2);
        const box = boxes[id];
        const ownerIdx = box?.owner === null || box?.owner === undefined ? null : Number(box.owner);
        cells.push(
          <div
            key={id}
            className={styles.box}
            style={ownerIdx !== null ? { background: `${PLAYER_COLORS[ownerIdx]?.color}44` } : undefined}
          />
        );
      }
    }
    return cells;
  };

  if (!gameMode) {
    return (
      <GameLayout title="📦 Box Blitz - Select Mode" onBack={onBack || handleBackToMenu}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>Choose how you want to play Box Blitz</p>
          <GameModeSelector
            onSelectLocal={() => { setGameMode("local"); setIsOnlineMode(false); }}
            onSelectOnline={() => { setGameMode("online"); setIsOnlineMode(true); }}
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
      <GameLayout title="📦 Box Blitz - Online Setup" onBack={handleBackToMenu}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>Create a room or join an existing one to play online</p>
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
      <GameLayout title="📦 Box Blitz - Waiting Room" onBack={handleBackToMenu}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <OnlineRoomExample
          roomCode={roomCode}
          connectedPlayers={connectedPlayers}
          maxPlayers={4}
          isHost={isHost}
          minPlayers={2}
          onStartGame={handleStartOnlineGame}
          gameUrl={`${window.location.origin}/games/box-blitz?room=${roomCode}`}
        />
      </GameLayout>
    );
  }

  if (!gameStarted && !isOnlineMode) {
    return (
      <GameLayout title="📦 Box Blitz - Player Setup" onBack={handleBackToMenu}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>Select number of players and enter names to begin!</p>
          <div className={styles.playerCountButtons}>
            {[2, 3, 4].map((count) => (
              <button
                key={count}
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
          <PlayerNameInput
            players={playerNames}
            onPlayerChange={(idx, value) => {
              const next = [...playerNames];
              next[idx] = value;
              setPlayerNames(next);
            }}
            minPlayers={2}
            showSymbols={true}
            symbols={PLAYER_COLORS.slice(0, numPlayers).map((p) => `${p.emoji}`)}
          />
          <div className={styles.setupButtons}>
            <button className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`} onClick={startLocalGame}>
              Start Game
            </button>
          </div>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout
      title="📦 Box Blitz"
      currentPlayer={
        gameOver
          ? ""
          : `${PLAYER_COLORS[currentPlayerIndex].emoji} ${playerNames[currentPlayerIndex] || `P${currentPlayerIndex + 1}`}`
      }
      onBack={handleBackToMenu}
      fitViewport
    >
      {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
      <div className={styles.playRoot}>
      <div className={styles.mainGameWrapper}>
        <div className={styles.gameContainer}>
          <div className={styles.playerBar}>
            {playerNames.slice(0, numPlayers).map((name, i) => (
              <div key={i} className={`${styles.playerBadge} ${i === currentPlayerIndex ? styles.activePlayer : ""}`}>
                <span>{PLAYER_COLORS[i].emoji} {name || `P${i + 1}`}</span>
                <span className={styles.scoreChip}>{scores[i] || 0}</span>
              </div>
            ))}
          </div>

          <div className={styles.boardStats}>
            <span>🎯 Remaining moves: {remainingMoves}</span>
            <span>🔄 Turn {turnCount}</span>
          </div>

          <div className={styles.diceArea}>
            <div
              className={`${styles.dice} ${isRolling ? styles.diceRolling : ""} ${diceValue && !isRolling ? styles.diceShow : ""}`}
              onClick={canRoll ? rollDice : undefined}
              style={{ cursor: canRoll ? "pointer" : "default" }}
            >
              {diceValue ? DICE_FACES[diceValue] : "🎲"}
            </div>
            <p className={styles.diceHint}>
              {gameOver ? "Game over" : canRoll ? "Tap the dice to roll!" : remainingMoves > 0 ? "Draw your lines" : `Waiting for ${playerNames[currentPlayerIndex]}...`}
            </p>
            {lastAction && <p className={styles.lastAction}>{lastAction}</p>}
          </div>

          <div className={styles.boardStage}>
            <div className={styles.boardGrid}>
              {renderBoard()}
            </div>
          </div>

          {gameOver && (
            <div className={styles.resultCard}>
              <h2 className={styles.resultTitle}>
                {winner === null ? "🤝 It's a tie!" : `${PLAYER_COLORS[winner].emoji} ${playerNames[winner]} wins!`}
              </h2>
              {(!isOnlineMode || isHost) && (
                <button className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`} onClick={handlePlayAgain}>
                  Play Again
                </button>
              )}
            </div>
          )}

          <div className={styles.rulesArea}>
            <GameRules rules={rules} compact={true} />
          </div>
        </div>

        <div className={styles.sidebarSlot}>
          <MatchHistorySidebar
            players={playerNames.slice(0, numPlayers).map((n, i) => ({ name: n || `Player ${i + 1}`, emoji: PLAYER_COLORS[i].emoji }))}
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
