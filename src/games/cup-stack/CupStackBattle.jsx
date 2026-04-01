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
import styles from "../../styles/CupStackBattle.module.css";

// ====== PLAYER COLORS ======
const PLAYER_COLORS = [
  { id: "red", label: "Red", emoji: "🔴", hex: "#e53e3e", light: "#fc8181", dark: "#c53030", bg: "#fed7d7" },
  { id: "blue", label: "Blue", emoji: "🔵", hex: "#3182ce", light: "#63b3ed", dark: "#2b6cb0", bg: "#bee3f8" },
  { id: "green", label: "Green", emoji: "🟢", hex: "#38a169", light: "#68d391", dark: "#2f855a", bg: "#c6f6d5" },
  { id: "yellow", label: "Yellow", emoji: "🟡", hex: "#d69e2e", light: "#f6e05e", dark: "#b7791f", bg: "#fefcbf" },
];

const CUPS_PER_PLAYER = 18;

/*
  DATA MODEL:
  Each group = { id: number, layers: string[] }
    - layers: bottom→top array of color IDs, e.g. ["red","blue","red"]
    - layers[layers.length - 1] = top color = owner
    - id: unique stable identifier for React keys

  groups = array of group objects
*/

// ====== HELPER FUNCTIONS ======

function getTopColor(group) {
  if (group.isEmpty) return null;
  return group.layers[group.layers.length - 1];
}

function checkWinCondition(groups) {
  const activeGroups = groups.filter(g => !g.isEmpty);
  if (activeGroups.length === 0) return null;
  const top = getTopColor(activeGroups[0]);
  if (activeGroups.every((g) => getTopColor(g) === top)) {
    const idx = PLAYER_COLORS.findIndex((pc) => pc.id === top);
    return idx >= 0 ? idx : null;
  }
  return null;
}

function getEliminatedPlayers(groups, numPlayers) {
  const topColors = new Set(groups.map(getTopColor));
  const eliminated = [];
  for (let p = 0; p < numPlayers; p++) {
    if (!topColors.has(PLAYER_COLORS[p].id)) eliminated.push(p);
  }
  return eliminated;
}

function getNextActivePlayer(currentIdx, numPlayers, eliminatedSet) {
  let next = (currentIdx + 1) % numPlayers;
  let safety = 0;
  while (eliminatedSet.has(next) && safety < numPlayers) {
    next = (next + 1) % numPlayers;
    safety++;
  }
  return next;
}

function getColorInfo(colorId) {
  return PLAYER_COLORS.find((c) => c.id === colorId) || PLAYER_COLORS[0];
}

function countGroupsByOwner(groups) {
  const counts = {};
  PLAYER_COLORS.forEach((c) => { counts[c.id] = 0; });
  groups.forEach((g) => {
    const top = getTopColor(g);
    if (counts[top] !== undefined) counts[top]++;
  });
  return counts;
}

// Convert raw layers (from online sync) to group objects with fresh IDs
function layersToGroups(rawLayersArr, idCounter) {
  return rawLayersArr
    .filter((layers) => Array.isArray(layers))
    .map((layers) => ({
      id: idCounter.current++,
      layers: [...layers],
    }));
}

// Convert group objects to raw layers (for online sync payload)
function groupsToLayers(groups) {
  return groups.filter((g) => Array.isArray(g.layers)).map((g) => [...g.layers]);
}

// ====== COMPONENT ======
function CupStackBattle({ onBack, initialRoomCode, onGameStart, isPlayMode = false }) {
  const location = useLocation();
  const gameState = location.state || {};

  // Unique ID counter for groups — persists across renders
  const groupIdCounter = useRef(0);

  function createGroup(layers) {
    return { id: groupIdCounter.current++, layers: [...layers] };
  }

  function initializeGroups(numPlayers) {
    const groups = [];
    for (let p = 0; p < numPlayers; p++) {
      for (let c = 0; c < CUPS_PER_PLAYER; c++) {
        groups.push(createGroup([PLAYER_COLORS[p].id]));
      }
    }
    // Cups are natively grouped by player sequentially
    return groups;
  }

  const cupStackRules = [
    "Each player starts with 10 single-cup groups, shuffled on the board",
    "Roll the dice (1–6) to choose how many opponent groups to merge",
    "Select that many groups where the top cup isn't yours",
    "All selected groups merge into ONE group, then YOUR cup goes on top!",
    "Group count shrinks each turn — fewer groups, bigger stacks!",
    "If no group has your color on top, you're eliminated!",
    "When ALL groups have the same top color — that player wins!",
  ];

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
  const [groups, setGroups] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [canRoll, setCanRoll] = useState(true);
  const [winner, setWinner] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [turnCount, setTurnCount] = useState(0);

  // Match History
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [matchHistory, setMatchHistory] = useState([]);

  // Selection: indices into groups[] of opponent groups to merge
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [maxSelections, setMaxSelections] = useState(0);

  // Animation
  const [mergingGroupIds, setMergingGroupIds] = useState([]); // IDs of groups being animated out
  const [newGroupId, setNewGroupId] = useState(null); // ID of newly created merged group

  // ====== REFS for closure-safe access ======
  const groupsRef = useRef(groups);
  const selectedRef = useRef(selectedGroups);
  const currentPlayerRef = useRef(currentPlayerIndex);
  const turnCountRef = useRef(turnCount);
  const numPlayersRef = useRef(numPlayers);
  const playerNamesRef = useRef(playerNames);
  const isOnlineRef = useRef(isOnlineMode);

  // Keep refs in sync with state
  useEffect(() => { groupsRef.current = groups; }, [groups]);
  useEffect(() => { selectedRef.current = selectedGroups; }, [selectedGroups]);
  useEffect(() => { currentPlayerRef.current = currentPlayerIndex; }, [currentPlayerIndex]);
  useEffect(() => { turnCountRef.current = turnCount; }, [turnCount]);
  useEffect(() => { numPlayersRef.current = numPlayers; }, [numPlayers]);
  useEffect(() => { playerNamesRef.current = playerNames; }, [playerNames]);
  useEffect(() => { isOnlineRef.current = isOnlineMode; }, [isOnlineMode]);

  // ====== SOUNDS ======
  const playDiceSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.05, 0.1, 0.15, 0.2].forEach((time, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime([200, 250, 180, 220, 160][i], ctx.currentTime + time);
        gain.gain.setValueAtTime(0.15 - i * 0.02, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.04);
        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + 0.05);
      });
    } catch (e) { /* audio unsupported */ }
  }, []);

  const playMergeSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.08, 0.16, 0.24].forEach((time, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = i === 3 ? "sine" : "triangle";
        osc.frequency.setValueAtTime([300, 400, 500, 700][i], ctx.currentTime + time);
        osc.frequency.exponentialRampToValueAtTime([250, 350, 600, 900][i], ctx.currentTime + time + 0.1);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.12);
        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + 0.12);
      });
    } catch (e) { /* audio unsupported */ }
  }, []);

  const playWinSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.15, 0.3, 0.45].forEach((time, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime([523, 659, 784, 1047][i], ctx.currentTime + time);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.14);
        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + 0.15);
      });
    } catch (e) { /* audio unsupported */ }
  }, []);

  // ====== AUTO-JOIN FROM URL ======
  useEffect(() => {
    if (initialRoomCode && !gameMode && !isInRoom) {
      setGameMode("online");
      setIsOnlineMode(true);
      setRoomCode(initialRoomCode.toUpperCase().trim());
    }
  }, [initialRoomCode, gameMode, isInRoom]);

  // ====== ONLINE CALLBACKS ======
  const handleRemoteGameStart = useCallback((payload) => {
    const { players, groups: rawLayers, numPlayers: np } = payload;
    const initGroups = layersToGroups(rawLayers, groupIdCounter);
    setPlayerNames(players);
    setNumPlayers(np);
    setGroups(initGroups);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setCanRoll(true);
    setSelectedGroups([]);
    setMaxSelections(0);
    setWinner(null);
    setGameOver(false);
    setTurnCount(0);
    setWaitingForPlayers(false);
    setGameStarted(true);
    setNewGroupId(null);
    setMergingGroupIds([]);
    setMyPlayerIndex(players.indexOf(roomService.playerName));
    if (onGameStart && !isPlayMode) onGameStart();
  }, [onGameStart, isPlayMode]);

  const handleRemoteDice = useCallback((payload) => {
    const { roll, playerIndex, maxSelections: ms, skipTo } = payload;
    setDiceValue(roll);
    setCurrentPlayerIndex(playerIndex);

    if (skipTo !== undefined) {
      setMaxSelections(0);
      setCanRoll(false);
      setLastAction("No opponent groups available! Skipping turn...");
      setTimeout(() => {
        setCurrentPlayerIndex(skipTo);
        setDiceValue(null);
        setCanRoll(true);
        setSelectedGroups([]);
        setMaxSelections(0);
        setLastAction(null);
      }, 1500);
    } else {
      setMaxSelections(ms);
      setCanRoll(false);
      setSelectedGroups([]);
    }
  }, []);

  const handleRemoteMerge = useCallback((payload) => {
    const { groups: rawLayers, nextPlayer, winner: w, gameOver: go, turnCount: tc, eliminatedNames } = payload;
    const newGroups = layersToGroups(rawLayers, groupIdCounter);
    // Identify the new merged group (last one) for bounce animation
    if (newGroups.length > 0) {
      const last = newGroups[newGroups.length - 1];
      setNewGroupId(last.id);
      setTimeout(() => setNewGroupId(null), 600);
    }
    setGroups(newGroups);
    setSelectedGroups([]);
    setMaxSelections(0);
    setDiceValue(null);
    setCanRoll(true);
    setCurrentPlayerIndex(nextPlayer);
    setTurnCount(tc || 0);
    setMergingGroupIds([]);
    if (w !== null && w !== undefined) {
      setWinner(w);
      setGameOver(go);
      setMatchHistory(prev => [...prev, { winner: w, date: Date.now() }]);
      setScores(prev => {
        const arr = [...prev];
        if (arr[w] !== undefined) arr[w]++;
        return arr;
      });
    }

    if (eliminatedNames && eliminatedNames.length > 0) {
      setLastAction(`❌ ${eliminatedNames.join(", ")} eliminated!`);
      setTimeout(() => setLastAction(null), 3000);
    }
    if (w !== null && w !== undefined) {
      setWinner(w);
      setGameOver(go);
    }
  }, []);

  // ====== ONLINE LISTENERS ======
  useEffect(() => {
    if (!isOnlineMode || !isInRoom) return;

    const handleError = (msg) => setAlertMessage(msg);

    const handlePlayerJoined = () => {
      setConnectedPlayers([...roomService.getConnectedPlayers()]);
    };

    const handlePlayerLeft = (data) => {
      setConnectedPlayers([...roomService.getConnectedPlayers()]);
      if (gameStarted) {
        setAlertMessage(`${data.playerName || "A player"} disconnected!`);
        setTimeout(() => handleBackToMenu(), 3000);
      }
    };

    const handleGameAction = (data) => {
      switch (data.action) {
        case "game-start":
          handleRemoteGameStart(data.payload);
          break;
        case "dice-roll":
          handleRemoteDice(data.payload);
          break;
        case "merge-groups":
          handleRemoteMerge(data.payload);
          break;
        case "restart-game":
          setGameStarted(false);
          setWaitingForPlayers(true);
          setGroups([]);
          setCurrentPlayerIndex(0);
          setDiceValue(null);
          setCanRoll(true);
          setSelectedGroups([]);
          setMaxSelections(0);
          setWinner(null);
          setGameOver(false);
          setTurnCount(0);
          setNewGroupId(null);
          setMergingGroupIds([]);
          setAlertMessage(data.payload?.message || "Game restarted");
          break;
      }
    };

    roomService.on("onError", handleError);
    roomService.on("onPlayerJoined", handlePlayerJoined);
    roomService.on("onPlayerLeft", handlePlayerLeft);
    roomService.on("onGameAction", handleGameAction);
    setConnectedPlayers([...roomService.getConnectedPlayers()]);

    return () => {
      // Keep PartyKit connection alive across remount/navigation to play mode.
      // Explicit room leave is handled in handleBackToMenu.
      delete roomService.callbacks.onError;
      delete roomService.callbacks.onPlayerJoined;
      delete roomService.callbacks.onPlayerLeft;
      delete roomService.callbacks.onGameAction;
    };
  }, [isOnlineMode, isInRoom, gameStarted, handleRemoteGameStart, handleRemoteDice, handleRemoteMerge]);

  // ====== ONLINE ROOM FUNCTIONS ======
  async function handleCreateOnlineRoom() {
    if (!playerName.trim()) { setAlertMessage("Please enter your name!"); return; }
    try {
      roomService.playerName = playerName;
      const { roomCode: code } = await roomService.createRoom();
      setRoomCode(code);
      setIsHost(true);
      setIsInRoom(true);
      setWaitingForPlayers(true);
      setConnectedPlayers(roomService.getConnectedPlayers());
      window.history.pushState({}, "", `${window.location.pathname}?room=${code}`);
    } catch (err) {
      console.error("Error creating room:", err);
      setAlertMessage("Failed to create room. Please try again.");
    }
  }

  async function handleJoinOnlineRoom() {
    if (!playerName.trim() || !roomCode.trim()) { setAlertMessage("Please enter your name and room code!"); return; }
    try {
      roomService.playerName = playerName;
      await roomService.joinRoom(roomCode);
      setIsInRoom(true);
      setIsHost(false);
      setWaitingForPlayers(true);
      const all = roomService.getConnectedPlayers();
      setConnectedPlayers(all);
      setMyPlayerIndex(all.length - 1);
    } catch (err) {
      console.error("Error joining room:", err);
      setAlertMessage("Failed to join room. Check the room code and try again.");
    }
  }

  function handleStartOnlineGame() {
    if (connectedPlayers.length < 2 || connectedPlayers.length > 4) { setAlertMessage("Need 2-4 players to start!"); return; }
    if (!roomService.isConnected()) { setAlertMessage("Connection issue. Please wait and try again."); return; }
    const names = connectedPlayers.map((p) => p.playerName);
    const np = names.length;
    const initGroups = initializeGroups(np);

    // Send raw layers over the wire (no IDs — receivers assign their own)
    roomService.sendGameAction("game-start", {
      players: names,
      groups: groupsToLayers(initGroups),
      numPlayers: np,
    });

    setPlayerNames(names);
    setNumPlayers(np);
    setGroups(initGroups);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setCanRoll(true);
    setSelectedGroups([]);
    setMaxSelections(0);
    setWinner(null);
    setGameOver(false);
    setTurnCount(0);
    setWaitingForPlayers(false);
    setGameStarted(true);
    setMyPlayerIndex(0);
    setNewGroupId(null);
    setMergingGroupIds([]);
    if (onGameStart && !isPlayMode) onGameStart();
  }

  // ====== BACK TO MENU ======
  const handleBackToMenu = useCallback(() => {
    if (roomService.isConnected()) roomService.leaveRoom();
    setGameMode(null);
    setGameStarted(false);
    setIsOnlineMode(false);
    setIsInRoom(false);
    setIsHost(false);
    setWaitingForPlayers(false);
    setRoomCode("");
    setPlayerName("");
    setNumPlayers(2);
    setPlayerNames(["", ""]);
    setGroups([]);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setCanRoll(true);
    setSelectedGroups([]);
    setMaxSelections(0);
    setWinner(null);
    setGameOver(false);
    setTurnCount(0);
    setConnectedPlayers([]);
    setMyPlayerIndex(null);
    setLastAction(null);
    setNewGroupId(null);
    setMergingGroupIds([]);
  }, []);

  // ====== PLAYER COUNT ======
  function handlePlayerCountChange(count) {
    setNumPlayers(count);
    setPlayerNames(Array(count).fill(""));
  }

  function handlePlayerNameChange(index, value) {
    const updated = [...playerNames];
    updated[index] = value;
    setPlayerNames(updated);
  }

  // ====== LOCAL START ======
  function startLocalGame() {
    if (playerNames.filter((n) => n.trim() !== "").length < numPlayers) {
      setAlertMessage("Please enter all player names!");
      return;
    }
    const initGroups = initializeGroups(numPlayers);
    setGroups(initGroups);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setCanRoll(true);
    setSelectedGroups([]);
    setMaxSelections(0);
    setWinner(null);
    setGameOver(false);
    setTurnCount(0);
    setGameStarted(true);
    setNewGroupId(null);
    setMergingGroupIds([]);
    if (onGameStart && !isPlayMode) onGameStart();
  }

  // ====== DICE ROLL ======
  function rollDice() {
    if (!canRoll || gameOver) return;
    if (isOnlineMode && myPlayerIndex !== currentPlayerIndex) return;

    setDiceRolling(true);
    playDiceSound();

    const animInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
    }, 80);

    setTimeout(() => {
      clearInterval(animInterval);
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceValue(roll);
      setDiceRolling(false);

      // Read from ref for closure safety
      const currentGroups = groupsRef.current;
      const pIdx = currentPlayerRef.current;
      const myColor = PLAYER_COLORS[pIdx].id;
      const opponentGroupCount = currentGroups.filter((g) => getTopColor(g) !== myColor && !g.isEmpty).length;
      const myGroupCount = currentGroups.filter((g) => getTopColor(g) === myColor && !g.isEmpty).length;

      if (roll > opponentGroupCount) {
        setLastAction(`Rolled ${roll} but missing available opponent cups! Skipping turn...`);
        setCanRoll(false);
        const np = numPlayersRef.current;
        const eliminatedNow = new Set(getEliminatedPlayers(currentGroups, np));
        const skipNextP = getNextActivePlayer(pIdx, np, eliminatedNow);

        setTimeout(() => {
          setCurrentPlayerIndex(skipNextP);
          setDiceValue(null);
          setCanRoll(true);
          setSelectedGroups([]);
          setMaxSelections(0);
          setLastAction(null);
        }, 2000);

        if (isOnlineRef.current) {
          roomService.sendGameAction("dice-roll", {
            roll, playerIndex: pIdx, maxSelections: 0, skipTo: skipNextP,
          });
        }
        return;
      }

      const ms = Math.min(roll, myGroupCount);
      setMaxSelections(ms);
      setCanRoll(false);

      if (ms === 0) {
        setLastAction(`You have no available cups to move! Skipping turn...`);
        const np = numPlayersRef.current;
        const eliminatedNow = new Set(getEliminatedPlayers(currentGroups, np));
        const skipNextP = getNextActivePlayer(pIdx, np, eliminatedNow);

        setTimeout(() => {
          setCurrentPlayerIndex(skipNextP);
          setDiceValue(null);
          setCanRoll(true);
          setSelectedGroups([]);
          setMaxSelections(0);
          setLastAction(null);
        }, 2000);

        if (isOnlineRef.current) {
          roomService.sendGameAction("dice-roll", {
            roll, playerIndex: pIdx, maxSelections: 0, skipTo: skipNextP,
          });
        }
        return;
      }

      const opponentIndices = currentGroups
        .map((g, i) => ({ g, i }))
        .filter(({ g }) => getTopColor(g) !== myColor && !g.isEmpty)
        .map(({ i }) => i);

      if (ms === opponentIndices.length) {
        setSelectedGroups(opponentIndices);
      } else {
        setSelectedGroups([]);
      }

      if (isOnlineRef.current) {
        roomService.sendGameAction("dice-roll", {
          roll, playerIndex: pIdx, maxSelections: ms,
        });
      }
    }, 600);
  }

  // ====== GROUP CLICK — select opponent groups to merge ======
  function handleGroupClick(idx) {
    if (gameOver || canRoll || diceRolling) return;
    if (isOnlineMode && myPlayerIndex !== currentPlayerIndex) return;
    if (maxSelections === 0) return;

    const myColor = PLAYER_COLORS[currentPlayerIndex].id;
    const topColor = getTopColor(groups[idx]);

    // Can only select opponent groups (top ≠ mine) and not empty placeholders
    if (groups[idx].isEmpty || topColor === myColor) return;

    // Toggle
    if (selectedGroups.includes(idx)) {
      setSelectedGroups(selectedGroups.filter((i) => i !== idx));
      return;
    }

    if (selectedGroups.length >= maxSelections) {
      setAlertMessage(`You must select exactly ${maxSelections} group${maxSelections > 1 ? "s" : ""}. Deselect one first.`);
      return;
    }

    const newSelection = [...selectedGroups, idx];
    setSelectedGroups(newSelection);
  }

  // ====== CONFIRM MERGE ======
  function confirmMerge() {
    const sel = selectedGroups;
    if (sel.length === 0) {
      setAlertMessage("Select at least one opponent group!");
      return;
    }
    if (sel.length < maxSelections) {
      setAlertMessage(`You must select exactly ${maxSelections} group${maxSelections > 1 ? "s" : ""} to merge!`);
      return;
    }

    playMergeSound();

    const snapshotGroups = groupsRef.current.map((g) =>
      Array.isArray(g.layers) ? { id: g.id, layers: [...g.layers] } : { id: g.id, isEmpty: true }
    );
    const snapshotSelected = [...sel];
    const snapshotPlayerIdx = currentPlayerRef.current;
    const snapshotTurnCount = turnCountRef.current;
    const snapshotNumPlayers = numPlayersRef.current;
    const snapshotPlayerNames = [...playerNamesRef.current];
    const snapshotOnline = isOnlineRef.current;

    // Get IDs of groups being merged for animation
    const mergingIds = snapshotSelected.map((idx) => snapshotGroups[idx].id);
    setMergingGroupIds(mergingIds);

    // After animation finishes, execute the actual merge using the snapshots
    setTimeout(() => {
      executeMerge(snapshotGroups, snapshotSelected, snapshotPlayerIdx, snapshotTurnCount, snapshotNumPlayers, snapshotPlayerNames, snapshotOnline);
      setMergingGroupIds([]);
    }, 500);
  }

  /**
   * CORE MERGE LOGIC — uses snapshots, never reads stale state.
   *
   * 1. Collect layers from ALL selected groups
   * 2. Concatenate into one array
   * 3. Append current player's color on top
   * 4. REMOVE all selected groups from array
   * 5. ADD the one new merged group
   * 6. Total groups = previous - N + 1
   */
  function executeMerge(snapGroups, snapSelected, pIdx, tCount, nPlayers, pNames, online) {
    const myColor = PLAYER_COLORS[pIdx].id;

    // Auto-pick player's smallest controlled groups to pair up
    const myGroupsWithIndices = snapGroups
      .map((g, idx) => ({ g, idx }))
      .filter(({ g }) => getTopColor(g) === myColor)
      .sort((a, b) => a.g.layers.length - b.g.layers.length);

    const myPickedIndices = myGroupsWithIndices
      .slice(0, snapSelected.length)
      .map((item) => item.idx);

    const targetMap = new Map();
    const sourceSet = new Set();
    const actualLength = Math.min(snapSelected.length, myPickedIndices.length);

    for (let i = 0; i < actualLength; i++) {
      const targetIdx = snapSelected[i];
      const sourceIdx = myPickedIndices[i];
      sourceSet.add(sourceIdx);
      
      const targetGroup = snapGroups[targetIdx]; // Opponent cup (base)
      const sourceGroup = snapGroups[sourceIdx]; // Player cup (top)
      const mergedLayers = [...targetGroup.layers, ...sourceGroup.layers];
      targetMap.set(targetIdx, createGroup(mergedLayers));
    }

    const newGroups = [];
    let lastAnimId = null;

    // Map in-place so merged cups stay in their original visual positions
    for (let i = 0; i < snapGroups.length; i++) {
      if (targetMap.has(i)) {
        const ng = targetMap.get(i);
        newGroups.push(ng);
        lastAnimId = ng.id;
      } else if (sourceSet.has(i)) {
        // Leave a blank space to prevent flex grid rearrangement
        newGroups.push({ id: snapGroups[i].id, isEmpty: true });
      } else {
        newGroups.push(snapGroups[i]);
      }
    }

    // Show bounce animation on the new groups
    if (lastAnimId) {
      setNewGroupId(lastAnimId);
      setTimeout(() => setNewGroupId(null), 600);
    }

    const newTurnCount = tCount + 1;
    setGroups(newGroups);
    setTurnCount(newTurnCount);

    // Detect newly eliminated players
    const oldEliminated = new Set(getEliminatedPlayers(snapGroups, nPlayers));
    const newEliminated = getEliminatedPlayers(newGroups, nPlayers);
    const newEliminatedSet = new Set(newEliminated);
    const justEliminated = newEliminated.filter((p) => !oldEliminated.has(p));
    const elimNames = justEliminated.map((p) => pNames[p] || `Player ${p + 1}`);
    if (justEliminated.length > 0) {
      setLastAction(`❌ ${elimNames.join(", ")} eliminated!`);
      setTimeout(() => setLastAction(null), 3000);
    }

    // Check win
    const w = checkWinCondition(newGroups);
    if (w !== null) {
      setWinner(w);
      setGameOver(true);
      setMatchHistory(prev => [...prev, { winner: w, date: Date.now() }]);
      setScores(prev => {
        const arr = [...prev];
        if (arr[w] !== undefined) arr[w]++;
        return arr;
      });

      setSelectedGroups([]);
      setMaxSelections(0);
      playWinSound();

      if (online) {
        const nextP = getNextActivePlayer(pIdx, nPlayers, newEliminatedSet);
        roomService.sendGameAction("merge-groups", {
          groups: groupsToLayers(newGroups),
          nextPlayer: nextP, winner: w, gameOver: true,
          turnCount: newTurnCount, eliminatedNames: elimNames,
        });
      }
      return;
    }

    // Next player
    const nextP = getNextActivePlayer(pIdx, nPlayers, newEliminatedSet);

    if (online) {
      roomService.sendGameAction("merge-groups", {
        groups: groupsToLayers(newGroups),
        nextPlayer: nextP, winner: null, gameOver: false,
        turnCount: newTurnCount, eliminatedNames: elimNames,
      });
    }

    setCurrentPlayerIndex(nextP);
    setDiceValue(null);
    setCanRoll(true);
    setSelectedGroups([]);
    setMaxSelections(0);
  }

  function resetGame() {
    const initGroups = initializeGroups(numPlayers);
    setGroups(initGroups);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setCanRoll(true);
    setSelectedGroups([]);
    setMaxSelections(0);
    setWinner(null);
    setGameOver(false);
    setTurnCount(0);
    setLastAction(null);
    setNewGroupId(null);
    setMergingGroupIds([]);
    if (isOnlineMode) {
      roomService.sendGameAction("restart-game", { message: "Host restarted the game" });
    }
  }

  // ====== COMPUTED VALUES ======
  const diceFaces = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  const currentColor = PLAYER_COLORS[currentPlayerIndex] || PLAYER_COLORS[0];
  const isMyTurn = !isOnlineMode || myPlayerIndex === currentPlayerIndex;
  const myColor = PLAYER_COLORS[currentPlayerIndex]?.id;

  const groupCounts = gameStarted ? countGroupsByOwner(groups) : {};
  const eliminatedPlayers = gameStarted ? getEliminatedPlayers(groups, numPlayers) : [];
  const eliminatedSet = new Set(eliminatedPlayers);

  function getInstruction() {
    if (!isMyTurn) {
      return `Waiting for ${currentColor.emoji} ${playerNames[currentPlayerIndex] || `Player ${currentPlayerIndex + 1}`}...`;
    }
    if (canRoll && !diceRolling) return "Tap the dice to roll!";
    if (diceRolling) return "Rolling...";
    if (maxSelections > 0) {
      if (selectedGroups.length === maxSelections) {
        return `${maxSelections} group${maxSelections > 1 ? "s" : ""} selected — merging...`;
      }
      const remaining = maxSelections - selectedGroups.length;
      return `Rolled ${diceValue}! Select ${remaining} more group${remaining > 1 ? "s" : ""} to merge (${selectedGroups.length}/${maxSelections})`;
    }
    return "";
  }

  // ====== RENDER HELPERS ======

  function renderGroupStack(group, groupIdx, options = {}) {
    if (group.isEmpty) {
      return (
        <div key={group.id} className={styles.groupItem} style={{ visibility: "hidden" }}>
          {/* Invisible placeholder to maintain grid layout */}
        </div>
      );
    }

    const { selectable = false, selected = false, merging = false, isNew = false } = options;
    const topColor = getTopColor(group);
    const topInfo = getColorInfo(topColor);

    const totalLayers = group.layers.length;
    const visibleLayers = group.layers.map((c, i) => ({ color: c, isTop: i === totalLayers - 1 }));

    return (
      <div
        key={group.id}
        className={`
          ${styles.groupItem}
          ${selectable ? styles.groupSelectable : ""}
          ${selected ? styles.groupSelected : ""}
          ${merging ? styles.groupMerging : ""}
          ${isNew ? styles.groupNew : ""}
        `}
        onClick={() => selectable ? handleGroupClick(groupIdx) : null}
        style={{ cursor: selectable ? "pointer" : "default" }}
      >
        <div className={styles.groupStack}>
          {visibleLayers.map((layer, layerIdx) => {
            const ci = getColorInfo(layer.color);
            const isTopLayer = layer.isTop;
            return (
              <div
                key={layerIdx}
                className={`${styles.cupLayer} ${isTopLayer ? styles.cupLayerTop : ""}`}
              >
                <div
                  className={styles.cupBody}
                  style={{
                    "--cup-color": ci.hex,
                    "--cup-light": ci.light,
                    "--cup-dark": ci.dark,
                  }}
                >
                  <div className={styles.cupShine} />
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.cupShadow} />



        {totalLayers > 1 && (
          <div className={styles.stackHeightText}>×{totalLayers}</div>
        )}
      </div>
    );
  }

  // ====== RENDER: MATCH HISTORY SIDEBAR ======
  function renderSidebar() {
    return (
      <MatchHistorySidebar
        players={playerNames.slice(0, numPlayers)}
        scores={scores.slice(0, numPlayers)}
        history={matchHistory}
        getPlayerColor={(idx) => PLAYER_COLORS[idx]?.hex}
        getPlayerLightColor={(idx) => PLAYER_COLORS[idx]?.light}
        getPlayerBadge={(idx) => PLAYER_COLORS[idx]?.emoji}
      />
    );
  }

  // ====== RENDER: MODE SELECTION ======
  if (!gameMode) {
    return (
      <GameLayout title="🏆 Cup Merge Battle - Select Mode" onBack={onBack || handleBackToMenu}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>Choose how you want to play Cup Merge Battle</p>
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

  // ====== RENDER: ONLINE SETUP ======
  if (gameMode === "online" && !isInRoom) {
    return (
      <GameLayout title="🏆 Cup Merge Battle - Online Setup" onBack={handleBackToMenu}>
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

  // ====== RENDER: WAITING ROOM ======
  if (isOnlineMode && isInRoom && waitingForPlayers) {
    return (
      <GameLayout title="🏆 Cup Merge Battle - Waiting Room" onBack={handleBackToMenu}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <OnlineRoomExample
          roomCode={roomCode}
          connectedPlayers={connectedPlayers}
          maxPlayers={4}
          isHost={isHost}
          onStartGame={handleStartOnlineGame}
          minPlayers={2}
          gameUrl={`${window.location.origin}/games/cup-stack-battle?room=${roomCode}`}
        />
      </GameLayout>
    );
  }

  // ====== RENDER: LOCAL SETUP ======
  if (gameMode === "local" && !gameStarted) {
    const colorSymbols = Array.from({ length: numPlayers }).map(
      (_, i) => `${PLAYER_COLORS[i].emoji} ${PLAYER_COLORS[i].label}`
    );
    return (
      <GameLayout title="🏆 Cup Merge Battle - Player Setup" onBack={handleBackToMenu}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>Select number of players and enter names to begin!</p>
          <GameRules rules={cupStackRules} />
          <div className={styles.playerCountSection}>
            <label className={styles.label}>Number of Players</label>
            <div className={styles.playerCountButtons}>
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => handlePlayerCountChange(count)}
                  className={`${styles.countButton} ${numPlayers === count ? styles.countButtonActive : ""}`}
                >
                  {count} Players
                </button>
              ))}
            </div>
          </div>
          <PlayerNameInput
            players={playerNames}
            onPlayerChange={handlePlayerNameChange}
            minPlayers={2}
            showSymbols={true}
            symbols={colorSymbols}
          />
          <div className={styles.setupButtons}>
            <button onClick={startLocalGame} className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`}>
              Start Game
            </button>
          </div>
        </div>
      </GameLayout>
    );
  }

  // ====== RENDER: GAME OVER ======
  if (gameOver && winner !== null) {
    const winnerColor = PLAYER_COLORS[winner];
    const winnerName = playerNames[winner] || `Player ${winner + 1}`;
    const totalCupsInGroups = groups.reduce((sum, g) => sum + (g.isEmpty ? 0 : g.layers.length), 0);
    const activeGroupCount = groups.filter(g => !g.isEmpty).length;

    return (
      <GameLayout title="🏆 Cup Merge Battle" onBack={handleBackToMenu}>
        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <VoiceChat enabled={isOnlineMode && gameStarted} myId={roomService.playerId} roomCode={roomCode} />
        <div className={styles.mainGameWrapper}>
          <div className={styles.gameOverContainer}>
            <div className={styles.winnerBanner}>
              <span className={styles.trophy}>🏆</span>
              <h2 className={styles.winnerTitle}>{winnerColor.emoji} {winnerName} Wins!</h2>
              <p className={styles.winnerSubtitle}>
                All {activeGroupCount} group{activeGroupCount > 1 ? "s" : ""} dominated
                ({totalCupsInGroups} total cups)
              </p>
              <p className={styles.winnerStats}>Game completed in {turnCount} turns</p>
            </div>

            <div className={styles.groupsGrid}>
              {groups.map((group, idx) => renderGroupStack(group, idx))}
            </div>

            <div className={styles.setupButtons}>
              <button onClick={resetGame} className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`}>
                Play Again
              </button>
              <button onClick={handleBackToMenu} className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${btnStyles.btnLarge}`}>
                Back to Menu
              </button>
            </div>
          </div>
          {renderSidebar()}
        </div>
      </GameLayout>
    );
  }

  // ====== RENDER: MAIN GAME ======
  const totalCups = groups.reduce((sum, g) => sum + (g.isEmpty ? 0 : g.layers.length), 0);

  return (
    <GameLayout
      title="🏆 Cup Merge Battle"
      currentPlayer={`${currentColor.emoji} ${playerNames[currentPlayerIndex] || `Player ${currentPlayerIndex + 1}`}`}
      onBack={handleBackToMenu}
    >
      {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
      <VoiceChat enabled={isOnlineMode && gameStarted} myId={roomService.playerId} roomCode={roomCode} />

      <div className={styles.mainGameWrapper}>
        <div className={styles.gameContainer}>
          {/* Player bar */}
        <div className={styles.playerBar}>
          {playerNames.map((name, i) => {
            const pc = PLAYER_COLORS[i];
            const isElim = eliminatedSet.has(i);
            return (
              <div
                key={i}
                className={`${styles.playerBadgeItem} ${i === currentPlayerIndex ? styles.activePlayer : ""} ${isElim ? styles.playerEliminated : ""}`}
                style={{ borderColor: isElim ? "#718096" : pc.hex }}
              >
                <span className={styles.playerEmoji}>{isElim ? "💀" : pc.emoji}</span>
                <span className={styles.playerBadgeName} style={isElim ? { textDecoration: "line-through", opacity: 0.5 } : undefined}>
                  {name || `P${i + 1}`}
                </span>
                {!isElim && (
                  <span className={styles.groupCountBadge} style={{ background: pc.hex }}>
                    {groupCounts[pc.id] || 0}
                  </span>
                )}
                {isElim && <span className={styles.elimBadge}>OUT</span>}
                {i === currentPlayerIndex && !isElim && <span className={styles.turnIndicator}>⬅</span>}
              </div>
            );
          })}
        </div>

        {/* Board stats */}
        <div className={styles.boardStats}>
          <span>📦 {groups.filter(g => !g.isEmpty).length} groups</span>
          <span>☕ {totalCups} cups</span>
          <span>🔄 Turn {turnCount + 1}</span>
        </div>

        {/* Dice */}
        <div className={styles.diceArea}>
          <div
            className={`${styles.dice} ${diceRolling ? styles.diceRolling : ""} ${diceValue && !diceRolling ? styles.diceShow : ""}`}
            onClick={isMyTurn && canRoll && !diceRolling ? rollDice : undefined}
            style={{ cursor: isMyTurn && canRoll && !diceRolling ? "pointer" : "default" }}
          >
            {diceValue ? diceFaces[diceValue] : "🎲"}
          </div>
          <p className={styles.diceHint}>{getInstruction()}</p>
          {lastAction && <p className={styles.lastAction}>{lastAction}</p>}
        </div>

        {/* Groups grid — key={group.id} for stable DOM identity */}
        <div className={styles.groupsGrid}>
          {groups.map((group, idx) => {
            const topColor = getTopColor(group);
            const isOpponent = topColor !== myColor;
            const isSelected = selectedGroups.includes(idx);
            const isMerging = mergingGroupIds.includes(group.id);
            const isNew = newGroupId === group.id;
            const canSelect = isMyTurn && !canRoll && !gameOver && isOpponent && maxSelections > 0;

            return renderGroupStack(group, idx, {
              selectable: canSelect,
              selected: isSelected,
              merging: isMerging,
              isNew,
            });
          })}
        </div>

        {/* Confirm button — only active when exactly N groups selected */}
        {!canRoll && isMyTurn && maxSelections > 0 && (
          <div className={styles.confirmArea}>
            <button
              onClick={confirmMerge}
              disabled={selectedGroups.length !== maxSelections}
              className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge} ${styles.confirmButton} ${selectedGroups.length !== maxSelections ? styles.confirmDisabled : ""}`}
            >
              {selectedGroups.length === maxSelections
                ? `🔗 Merge ${selectedGroups.length} Group${selectedGroups.length > 1 ? "s" : ""}!`
                : `Select ${maxSelections - selectedGroups.length} more group${maxSelections - selectedGroups.length > 1 ? "s" : ""}`}
            </button>
          </div>
        )}

        {/* Rules */}
        <div className={styles.rulesArea}>
          <GameRules rules={cupStackRules} compact={true} />
        </div>
      </div>
      {renderSidebar()}
    </div>
  </GameLayout>
  );
}

export default CupStackBattle;
