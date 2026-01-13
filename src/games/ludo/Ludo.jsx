import { useState, useEffect, useCallback } from "react";
import LudoBoard from "./LudoBoard";
import GameLayout from "../../layout/GameLayout";
import GameModeSelector from "../../components/GameModeSelector";
import OnlineRoomSetup from "../../components/OnlineRoomSetup";
import OnlineRoomExample from "../../components/OnlineRoomExample";
import CustomAlert from "../../components/CustomAlert";
import CustomConfirm from "../../components/CustomConfirm";
import PlayerNameInput from "../../components/PlayerNameInput";
import roomService from "../../services/roomService";
import { saveGameState, loadGameState, clearGameState, getTimeRemaining } from "../../services/gameStateService";
import btnStyles from "../../styles/Button.module.css";
import styles from "../../styles/Ludo.module.css";

// Safe positions on the board (star positions) - absolute positions
const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

// Starting positions for each color on the main 52-position circular path
const START_POSITIONS = {
  blue: 0,
  red: 13,
  green: 26,
  yellow: 39
};

// Home stretch entry - when a token passes this position, it enters home stretch
const HOME_ENTRY = {
  blue: 51,
  red: 12,
  green: 25,
  yellow: 38
};

const MAIN_PATH_LENGTH = 52;

function Ludo({ onBack, initialRoomCode, onGameStart, isPlayMode = false }) {
  const [gameMode, setGameMode] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState(["", ""]);

  // Online multiplayer states
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [myPlayerIndex, setMyPlayerIndex] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  // Game states
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState(null);
  const [canRoll, setCanRoll] = useState(true);
  const [tokens, setTokens] = useState({});
  const [winner, setWinner] = useState(null);
  const [movableTokens, setMovableTokens] = useState([]);
  const [playerRankings, setPlayerRankings] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [consecutiveSixes, setConsecutiveSixes] = useState(0); // Track consecutive sixes
  
  // State persistence
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [savedState, setSavedState] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Reconnection handling
  const [disconnectedPlayer, setDisconnectedPlayer] = useState(null);
  const [reconnectionTimer, setReconnectionTimer] = useState(null);
  const [reconnectionTimeLeft, setReconnectionTimeLeft] = useState(0);

  // Sound effect functions
  const playDiceSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create multiple bounces to simulate dice rolling
      const times = [0, 0.05, 0.1, 0.15, 0.2];
      const frequencies = [200, 250, 180, 220, 160];
      
      times.forEach((time, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequencies[index], audioContext.currentTime + time);
        
        const volume = 0.15 - (index * 0.02);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime + time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + 0.04);
        
        oscillator.start(audioContext.currentTime + time);
        oscillator.stop(audioContext.currentTime + time + 0.05);
      });
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const playTokenSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.08);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  // Get active colors based on number of players
  const getActiveColors = useCallback(() => {
    if (numPlayers === 2) return ["blue", "green"];
    if (numPlayers === 3) return ["blue", "red", "green"];
    return ["blue", "red", "green", "yellow"];
  }, [numPlayers]);

  const activeColors = getActiveColors();
  const currentColor = activeColors[currentPlayerIndex];

  // Auto-join room from URL
  useEffect(() => {
    if (initialRoomCode && !gameMode && !isInRoom) {
      setGameMode('online');
      setIsOnlineMode(true);
      setRoomCode(initialRoomCode.toUpperCase().trim());
    }
  }, [initialRoomCode, gameMode, isInRoom]);

  // ============================================================
  // FIXED: Online handlers now apply state directly without recomputing
  // This follows the Word-Chain pattern for synchronization
  // ============================================================

  const handleGameStart = useCallback((payload) => {
    const { players: gamePlayers, initialTokens, numPlayers: playerCount } = payload;
    console.log('🎮 handleGameStart - Applying authoritative state:', payload);
    
    // Apply all state atomically from the authoritative source
    setPlayerNames(gamePlayers);
    setNumPlayers(playerCount);
    setTokens(initialTokens);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setCanRoll(true);
    setMovableTokens([]);
    setPlayerRankings([]);
    setGameOver(false);
    setWaitingForPlayers(false);
    setGameStarted(true);
    
    // Find my player index
    const myIndex = gamePlayers.indexOf(roomService.playerName);
    setMyPlayerIndex(myIndex);
    console.log('🎮 My player index:', myIndex, 'My name:', roomService.playerName);
    
    // Navigate to play URL for ad-free gameplay
    if (onGameStart && !isPlayMode) {
      onGameStart();
    }
  }, [onGameStart, isPlayMode]);

  // FIXED: Apply received dice state directly - don't recompute movable tokens
  const handleRemoteDiceRoll = useCallback((payload) => {
    const { roll, playerIndex, movable, canRoll: canRollState } = payload;
    console.log('🎲 Applying remote dice roll state:', payload);
    
    // Apply state exactly as received from the acting player
    setDiceValue(roll);
    setCurrentPlayerIndex(playerIndex);
    setMovableTokens(movable);
    setCanRoll(canRollState);
  }, []);

  // FIXED: Apply complete token state - no local computation
  const handleRemoteTokenMove = useCallback((payload) => {
    const { 
      newTokens, 
      currentPlayerIndex: movePlayerIndex,
      nextCanRoll,
      nextDiceValue,
      nextMovableTokens,
      rankings,
      isGameOver
    } = payload;
    console.log('🎯 Applying remote token move state:', payload);
    
    // Apply complete state from acting player
    setTokens(newTokens);
    setMovableTokens(nextMovableTokens || []);
    setCanRoll(nextCanRoll);
    setDiceValue(nextDiceValue);
    
    if (rankings) {
      setPlayerRankings(rankings);
    }
    if (isGameOver) {
      setGameOver(true);
    }
  }, []);

  // FIXED: Apply turn change with complete state
  const handleRemoteNextTurn = useCallback((payload) => {
    const { nextPlayerIndex, canRoll: canRollState, diceValue: diceState, movableTokens: movableState } = payload;
    console.log('➡️ Applying remote next turn state:', payload);
    
    setCurrentPlayerIndex(nextPlayerIndex);
    setDiceValue(diceState !== undefined ? diceState : null);
    setCanRoll(canRollState !== undefined ? canRollState : true);
    setMovableTokens(movableState || []);
  }, []);

  const handleRemoteGameOver = useCallback((payload) => {
    const { rankings } = payload;
    console.log('🏆 Game over - Final rankings:', rankings);
    
    setPlayerRankings(rankings);
    setGameOver(true);
  }, []);

  // Setup online game listeners
  useEffect(() => {
    if (!isOnlineMode || !isInRoom) return;

    console.log('🎮 Setting up online game listeners');

    const handleError = (errorMessage) => {
      console.log('❌ Error received:', errorMessage);
      setAlertMessage(errorMessage);
    };

    const handlePlayerJoined = (data) => {
      console.log('👋 Player joined:', data);
      const allPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers([...allPlayers]);
      
      // Check if this is a reconnection
      if (disconnectedPlayer && gameStarted) {
        const rejoiningPlayer = data.playerName || roomService.playerName;
        
        // Clear reconnection timer
        if (reconnectionTimer) {
          clearInterval(reconnectionTimer);
          setReconnectionTimer(null);
        }
        
        setDisconnectedPlayer(null);
        setReconnectionTimeLeft(0);
        setAlertMessage(`${rejoiningPlayer} reconnected! Game continues.`);
        
        // Auto-clear success message after 3 seconds
        setTimeout(() => {
          setAlertMessage(null);
        }, 3000);
      }
    };

    const handlePlayerLeft = (data) => {
      console.log('👋 Player left:', data);
      const allPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers([...allPlayers]);
      
      if (gameStarted) {
        // Don't immediately end the game - wait for 20 seconds for reconnection
        const playerName = data.playerName || 'A player';
        setDisconnectedPlayer(playerName);
        setReconnectionTimeLeft(20);
        
        setAlertMessage(`${playerName} disconnected! Waiting for reconnection...`);
        
        // Clear any existing timer
        if (reconnectionTimer) {
          clearInterval(reconnectionTimer);
        }
        
        // Start countdown timer
        let timeLeft = 20;
        const countdownInterval = setInterval(() => {
          timeLeft -= 1;
          setReconnectionTimeLeft(timeLeft);
          
          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            setReconnectionTimer(null);
            setDisconnectedPlayer(null);
            setReconnectionTimeLeft(0);
            
            // End game after timeout
            setAlertMessage(`${playerName} failed to reconnect. Game ended.`);
            setTimeout(() => {
              handleBackToMenu();
            }, 3000);
          }
        }, 1000);
        
        setReconnectionTimer(countdownInterval);
      }
    };

    const handleGameAction = (data) => {
      console.log('🎮 Game action received:', data.action, data.payload);
      
      switch (data.action) {
        // FIXED: Match action name with what host sends
        case 'game-start':
          handleGameStart(data.payload);
          break;
          
        case 'dice-roll':
          handleRemoteDiceRoll(data.payload);
          break;
          
        case 'token-move':
          handleRemoteTokenMove(data.payload);
          break;
          
        case 'next-turn':
          handleRemoteNextTurn(data.payload);
          break;

        case 'three-sixes':
          // Handle three consecutive sixes from another player
          setDiceValue(data.payload.roll);
          setAlertMessage("Three sixes! Turn skipped to next player.");
          setConsecutiveSixes(0);
          setTimeout(() => {
            nextTurn();
          }, 2000);
          break;

        case 'game-over':
          handleRemoteGameOver(data.payload);
          break;
          
        case 'restart-game':
          setGameStarted(false);
          setWaitingForPlayers(true);
          setPlayerNames(["", ""]);
          setTokens({});
          setCurrentPlayerIndex(0);
          setDiceValue(null);
          setCanRoll(true);
          setMovableTokens([]);
          setPlayerRankings([]);
          setGameOver(false);
          setConsecutiveSixes(0);
          setAlertMessage(data.payload?.message || 'Game restarted');
          break;
      }
    };

    // Register callbacks
    roomService.on('onError', handleError);
    roomService.on('onPlayerJoined', handlePlayerJoined);
    roomService.on('onPlayerLeft', handlePlayerLeft);
    roomService.on('onGameAction', handleGameAction);

    // Get initial player list
    const initialPlayers = roomService.getConnectedPlayers();
    setConnectedPlayers([...initialPlayers]);

    return () => {
      console.log('🧹 Cleaning up online game listeners');
      
      // Clean up reconnection timer
      if (reconnectionTimer) {
        clearInterval(reconnectionTimer);
      }
    };
  }, [isOnlineMode, isInRoom, handleGameStart, handleRemoteDiceRoll, handleRemoteTokenMove, handleRemoteNextTurn, handleRemoteGameOver, gameStarted, reconnectionTimer, disconnectedPlayer]);

  // Initialize tokens for each player - ONLY FOR LOCAL MODE
  useEffect(() => {
    if (gameStarted && !isOnlineMode) {
      const colors = getActiveColors();
      const initialTokens = {};
      
      colors.forEach(color => {
        initialTokens[color] = [
          { id: 0, position: -1, isHome: true, isFinished: false },
          { id: 1, position: -1, isHome: true, isFinished: false },
          { id: 2, position: -1, isHome: true, isFinished: false },
          { id: 3, position: -1, isHome: true, isFinished: false },
        ];
      });
      
      setTokens(initialTokens);
    }
  }, [gameStarted, isOnlineMode, getActiveColors]);

  // Check for saved game state on mount
  useEffect(() => {
    // First check if we have initialRoomCode (online mode)
    if (initialRoomCode) {
      const gameId = `ludo-online-${initialRoomCode.toUpperCase().trim()}`;
      const saved = loadGameState(gameId);
      
      if (saved && !gameStarted) {
        setSavedState(saved);
        setTimeRemaining(getTimeRemaining(gameId));
        setShowContinueDialog(true);
        return;
      }
    }
    
    // Otherwise check for offline mode
    const offlineGameId = 'ludo-offline';
    const saved = loadGameState(offlineGameId);
    
    if (saved && !gameStarted) {
      setSavedState(saved);
      setTimeRemaining(getTimeRemaining(offlineGameId));
      setShowContinueDialog(true);
    }
  }, [initialRoomCode, gameStarted]); // Check when initialRoomCode changes

  // Save game state whenever critical game state changes
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const gameId = isOnlineMode ? `ludo-online-${roomCode}` : 'ludo-offline';
      const stateToSave = {
        gameMode,
        gameStarted,
        numPlayers,
        playerNames,
        isOnlineMode,
        playerName,
        roomCode,
        isInRoom,
        isHost,
        myPlayerIndex,
        currentPlayerIndex,
        diceValue,
        canRoll,
        tokens,
        movableTokens,
        playerRankings,
        consecutiveSixes,
      };
      
      saveGameState(gameId, stateToSave);
    }
  }, [gameStarted, currentPlayerIndex, diceValue, tokens, canRoll, movableTokens, gameOver, consecutiveSixes]);

  // Clear saved state when game ends
  useEffect(() => {
    if (gameOver || winner) {
      const gameId = isOnlineMode ? `ludo-online-${roomCode}` : 'ludo-offline';
      clearGameState(gameId);
    }
  }, [gameOver, winner, isOnlineMode, roomCode]);

  // Handlers for continue dialog
  const handleContinueGame = async () => {
    if (savedState) {
      console.log('🔄 Restoring game state:', savedState);
      
      // Restore basic game state first
      setGameMode(savedState.gameMode);
      setNumPlayers(savedState.numPlayers);
      setPlayerName(savedState.playerName);
      setRoomCode(savedState.roomCode);
      setIsHost(savedState.isHost);
      setIsOnlineMode(savedState.isOnlineMode);
      
      // If online mode, rejoin the room
      if (savedState.isOnlineMode && savedState.roomCode) {
        try {
          // Set player name in roomService
          roomService.playerName = savedState.playerName;
          
          // Attempt to rejoin the room
          const joinSuccess = await roomService.joinRoom(savedState.roomCode);
          
          if (joinSuccess) {
            console.log('✅ Successfully rejoined room:', savedState.roomCode);
            setIsInRoom(true);
            
            // Get current connected players
            const currentPlayers = roomService.getConnectedPlayers();
            setConnectedPlayers([...currentPlayers]);
            
            // Restore game state
            setPlayerNames(savedState.playerNames);
            setMyPlayerIndex(savedState.myPlayerIndex);
            setCurrentPlayerIndex(savedState.currentPlayerIndex);
            setDiceValue(savedState.diceValue);
            setCanRoll(savedState.canRoll);
            setTokens(savedState.tokens);
            setMovableTokens(savedState.movableTokens);
            setPlayerRankings(savedState.playerRankings);
            setConsecutiveSixes(savedState.consecutiveSixes);
            
            // Critical: Set gameStarted and waitingForPlayers
            setGameStarted(savedState.gameStarted);
            setWaitingForPlayers(false); // Always false when rejoining active game
            
            console.log('✅ Game state restored, gameStarted:', savedState.gameStarted);
          } else {
            setAlertMessage('Failed to rejoin room. Starting new game.');
            setTimeout(() => {
              setGameStarted(false);
              setIsInRoom(false);
              setWaitingForPlayers(false);
            }, 2000);
          }
        } catch (error) {
          console.error('Error rejoining room:', error);
          setAlertMessage('Could not reconnect to game. Starting new game.');
          setTimeout(() => {
            setGameStarted(false);
            setIsInRoom(false);
            setWaitingForPlayers(false);
          }, 2000);
        }
      } else {
        // Local mode - restore all state
        setPlayerNames(savedState.playerNames);
        setMyPlayerIndex(savedState.myPlayerIndex);
        setCurrentPlayerIndex(savedState.currentPlayerIndex);
        setDiceValue(savedState.diceValue);
        setCanRoll(savedState.canRoll);
        setTokens(savedState.tokens);
        setMovableTokens(savedState.movableTokens);
        setPlayerRankings(savedState.playerRankings);
        setConsecutiveSixes(savedState.consecutiveSixes);
        setGameStarted(savedState.gameStarted);
        setIsInRoom(savedState.isInRoom);
        setWaitingForPlayers(false);
      }
      
      // Navigate to play mode if needed
      if (onGameStart && !isPlayMode && savedState.gameStarted) {
        onGameStart();
      }
    }
    setShowContinueDialog(false);
    setSavedState(null);
  };

  const handleStartNewGame = () => {
    const gameId = isOnlineMode ? `ludo-online-${roomCode}` : 'ludo-offline';
    clearGameState(gameId);
    setShowContinueDialog(false);
    setSavedState(null);
  };

  function handlePlayerCountChange(count) {
    setNumPlayers(count);
    const names = Array(count).fill("").map((_, i) => 
      i < playerNames.length ? playerNames[i] : ""
    );
    setPlayerNames(names);
  }

  function handlePlayerNameChange(index, value) {
    const newNames = [...playerNames];
    newNames[index] = value;
    setPlayerNames(newNames);
  }

  function startGame() {
    const validNames = playerNames.map((name, i) => 
      name.trim() || `Player ${i + 1}`
    );
    setPlayerNames(validNames);
    setGameStarted(true);
    setCurrentPlayerIndex(0);
    setWinner(null);
    setDiceValue(null);
    setCanRoll(true);
    setPlayerRankings([]);
    setGameOver(false);
    
    // Navigate to play URL for ad-free gameplay
    if (onGameStart && !isPlayMode) {
      onGameStart();
    }
  }

  // Calculate absolute position on main path for a token
  function getAbsolutePosition(color, relativePosition) {
    if (relativePosition < 0 || relativePosition >= MAIN_PATH_LENGTH) return -1;
    const startPos = START_POSITIONS[color];
    return (startPos + relativePosition) % MAIN_PATH_LENGTH;
  }

  // Check if a position is safe
  function isSafePosition(absolutePosition) {
    return SAFE_POSITIONS.includes(absolutePosition);
  }

  // Calculate movable tokens for a given roll
  function calculateMovableTokens(playerTokens, roll, color) {
    const movable = [];
    
    playerTokens.forEach((token, idx) => {
      if (token.isFinished) return;
      
      if (token.isHome) {
        if (roll === 6) movable.push(idx);
      } else {
        const currentPos = token.position;
        
        if (currentPos >= MAIN_PATH_LENGTH) {
          const homeStretchPos = currentPos - MAIN_PATH_LENGTH;
          const newHomeStretchPos = homeStretchPos + roll;
          if (newHomeStretchPos <= 5) movable.push(idx);
        } else {
          const currentAbsolute = getAbsolutePosition(color, currentPos);
          const homeEntry = HOME_ENTRY[color];
          
          let stepsToHomeEntry;
          if (currentAbsolute <= homeEntry) {
            stepsToHomeEntry = homeEntry - currentAbsolute;
          } else {
            stepsToHomeEntry = MAIN_PATH_LENGTH - currentAbsolute + homeEntry;
          }
          
          if (currentPos + roll <= MAIN_PATH_LENGTH - 1 + 5) {
            movable.push(idx);
          }
        }
      }
    });
    
    return movable;
  }

  function rollDice() {
    if (!canRoll || gameOver) return;

    // FIXED: In online mode, only current player can roll
    if (isOnlineMode && myPlayerIndex !== currentPlayerIndex) {
      setAlertMessage("Wait for your turn!");
      return;
    }

    // Play dice roll sound
    playDiceSound();

    const roll = Math.floor(Math.random() * 6) + 1;
    
    // Check for three consecutive sixes
    if (roll === 6) {
      const newConsecutiveSixes = consecutiveSixes + 1;
      setConsecutiveSixes(newConsecutiveSixes);
      
      if (newConsecutiveSixes === 3) {
        // Three sixes in a row - turn ends
        setDiceValue(roll);
        setCanRoll(false);
        // setAlertMessage("Three sixes! Turn skipped to next player.");
        
        if (isOnlineMode) {
          roomService.sendGameAction('three-sixes', {
            playerIndex: currentPlayerIndex,
            roll
          });
        }
        
        setTimeout(() => {
          setConsecutiveSixes(0);
          nextTurn();
        }, 2000);
        return;
      }
    } else {
      setConsecutiveSixes(0);
    }
    
    const playerTokens = tokens[currentColor];
    
    // Check if current player has already finished
    const hasFinished = playerTokens && playerTokens.every(t => t.isFinished);
    if (!playerTokens || hasFinished) {
      if (isOnlineMode) {
        // FIXED: Broadcast complete next-turn state
        const nextIdx = (currentPlayerIndex + 1) % activeColors.length;
        roomService.sendGameAction('next-turn', { 
          nextPlayerIndex: nextIdx,
          canRoll: true,
          diceValue: null,
          movableTokens: []
        });
      }
      setTimeout(() => nextTurn(), 1000);
      return;
    }

    const movable = calculateMovableTokens(playerTokens, roll, currentColor);

    // Update local state
    setDiceValue(roll);
    setCanRoll(false);
    setMovableTokens(movable);

    // FIXED: Broadcast complete dice state to all players
    if (isOnlineMode) {
      roomService.sendGameAction('dice-roll', {
        roll,
        playerIndex: currentPlayerIndex,
        movable,
        canRoll: false
      });
    }

    if (movable.length === 0) {
      setTimeout(() => nextTurn(), 1500);
    } else if (movable.length === 1) {
      setTimeout(() => moveToken(movable[0], roll), 500);
    }
  }

  function moveToken(tokenIndex, steps = diceValue) {
    if (!steps) return;
    
    // FIXED: Only current player can move
    if (isOnlineMode && myPlayerIndex !== currentPlayerIndex) {
      return;
    }

    // Play token move sound
    playTokenSound();
    
    const newTokens = JSON.parse(JSON.stringify(tokens));
    const token = newTokens[currentColor][tokenIndex];
    
    let capturedOpponent = false;
    let tokenFinished = false;

    if (token.isHome && steps === 6) {
      token.isHome = false;
      token.position = 0;
      const absoluteStart = START_POSITIONS[currentColor];
      capturedOpponent = checkAndCapture(newTokens, currentColor, absoluteStart);
    } else if (!token.isHome && !token.isFinished) {
      const currentPos = token.position;
      
      if (currentPos >= MAIN_PATH_LENGTH) {
        const homeStretchPos = currentPos - MAIN_PATH_LENGTH;
        const newHomeStretchPos = homeStretchPos + steps;
        
        if (newHomeStretchPos >= 5) {
          token.position = MAIN_PATH_LENGTH + 5;
          token.isFinished = true;
          tokenFinished = true;
        } else {
          token.position = MAIN_PATH_LENGTH + newHomeStretchPos;
        }
      } else {
        const homeEntry = HOME_ENTRY[currentColor];
        const currentAbsolutePos = getAbsolutePosition(currentColor, currentPos);
        
        let willEnterHomeStretch = false;
        let stepsAfterHomeEntry = 0;
        
        for (let step = 1; step <= steps; step++) {
          const testAbsolutePos = getAbsolutePosition(currentColor, currentPos + step);
          if (testAbsolutePos === homeEntry) {
            willEnterHomeStretch = true;
            stepsAfterHomeEntry = steps - step;
            break;
          }
        }
        
        if (willEnterHomeStretch && stepsAfterHomeEntry >= 0) {
          if (stepsAfterHomeEntry >= 5) {
            token.position = MAIN_PATH_LENGTH + 5;
            token.isFinished = true;
            tokenFinished = true;
          } else {
            token.position = MAIN_PATH_LENGTH + stepsAfterHomeEntry;
          }
        } else {
          token.position = currentPos + steps;
          const absolutePos = getAbsolutePosition(currentColor, token.position);
          if (!isSafePosition(absolutePos)) {
            capturedOpponent = checkAndCapture(newTokens, currentColor, absolutePos);
          }
        }
      }
    }

    newTokens[currentColor][tokenIndex] = token;
    
    // Check for winner
    const allFinished = newTokens[currentColor].every(t => t.isFinished);
    let newRankings = [...playerRankings];
    let isGameOver = false;
    
    if (allFinished) {
      newRankings = [...playerRankings, playerNames[currentPlayerIndex]];
      
      if (newRankings.length === activeColors.length - 1) {
        const remainingPlayerIndex = activeColors.findIndex(
          (_, index) => !newRankings.includes(playerNames[index])
        );
        newRankings.push(playerNames[remainingPlayerIndex]);
        isGameOver = true;
      }
    }

    // Determine next state
    const getsAnotherTurn = steps === 6 || tokenFinished || capturedOpponent;
    const nextCanRoll = getsAnotherTurn && !isGameOver && !allFinished;
    const nextDiceValue = nextCanRoll ? null : diceValue;

    // Update local state
    setTokens(newTokens);
    setMovableTokens([]);
    setPlayerRankings(newRankings);
    
    if (isGameOver) {
      setGameOver(true);
      if (isOnlineMode) {
        roomService.sendGameAction('game-over', { rankings: newRankings });
      }
      return;
    }

    // FIXED: Broadcast complete state after move
    if (isOnlineMode) {
      roomService.sendGameAction('token-move', {
        tokenIndex,
        steps,
        newTokens,
        currentPlayerIndex,
        tokenFinished,
        capturedOpponent,
        nextCanRoll,
        nextDiceValue,
        nextMovableTokens: [],
        rankings: newRankings.length > playerRankings.length ? newRankings : null,
        isGameOver
      });
    }

    if (allFinished && !isGameOver) {
      nextTurn();
      return;
    }

    setTimeout(() => {
      if (getsAnotherTurn) {
        setDiceValue(null);
        setCanRoll(true);
      } else {
        nextTurn();
      }
    }, 300);
  }

  function checkAndCapture(tokensState, attackerColor, absolutePosition) {
    let captured = false;
    
    Object.keys(tokensState).forEach(color => {
      if (color === attackerColor) return;
      
      tokensState[color].forEach((token, idx) => {
        if (token.isHome || token.isFinished) return;
        if (token.position >= MAIN_PATH_LENGTH) return;
        
        const tokenAbsolutePos = getAbsolutePosition(color, token.position);
        if (isSafePosition(tokenAbsolutePos)) return;
        
        if (tokenAbsolutePos === absolutePosition) {
          tokensState[color][idx] = { ...token, position: -1, isHome: true };
          captured = true;
        }
      });
    });
    
    return captured;
  }

  // FIXED: Single nextTurn function (removed duplicate)
  function nextTurn() {
    // Find the next player who has not finished
    let nextIdx = currentPlayerIndex;
    let found = false;
    for (let i = 1; i <= activeColors.length; i++) {
      const candidateIdx = (currentPlayerIndex + i) % activeColors.length;
      const color = activeColors[candidateIdx];
      const playerTokens = tokens[color];
      if (playerTokens && !playerTokens.every(t => t.isFinished)) {
        nextIdx = candidateIdx;
        found = true;
        break;
      }
    }
    // If all players finished, just cycle to next
    if (!found) {
      nextIdx = (currentPlayerIndex + 1) % activeColors.length;
    }

    // Broadcast complete turn state
    if (isOnlineMode) {
      roomService.sendGameAction('next-turn', { 
        nextPlayerIndex: nextIdx,
        canRoll: true,
        diceValue: null,
        movableTokens: []
      });
    }

    setCurrentPlayerIndex(nextIdx);
    setDiceValue(null);
    setCanRoll(true);
    setMovableTokens([]);
    setConsecutiveSixes(0); // Reset consecutive sixes on turn change
  }

  // Online multiplayer functions
  async function handleCreateOnlineRoom() {
    if (!playerName.trim()) {
      setAlertMessage("Please enter your name!");
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
      
      const newUrl = `${window.location.pathname}?room=${code}`;
      window.history.pushState({}, '', newUrl);
    } catch (error) {
      console.error('Error creating room:', error);
      setAlertMessage('Failed to create room. Please try again.');
    }
  }

  async function handleJoinOnlineRoom() {
    if (!playerName.trim() || !roomCode.trim()) {
      setAlertMessage("Please enter your name and room code!");
      return;
    }

    try {
      roomService.playerName = playerName;
      await roomService.joinRoom(roomCode);
      setIsInRoom(true);
      setIsHost(false);
      setWaitingForPlayers(true);
      
      const allPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers(allPlayers);
      setMyPlayerIndex(allPlayers.length - 1);
    } catch (error) {
      console.error('Error joining room:', error);
      setAlertMessage('Failed to join room. Check the room code and try again.');
    }
  }

  function handleStartOnlineGame() {
    if (connectedPlayers.length < 2 || connectedPlayers.length > 4) {
      setAlertMessage("Need 2-4 players to start!");
      return;
    }

    if (!roomService.isConnected()) {
      setAlertMessage("Connection issue. Please wait and try again.");
      return;
    }

    const gamePlayerNames = connectedPlayers.map(p => p.playerName);
    const playerCount = gamePlayerNames.length;
    
    let colors;
    if (playerCount === 2) colors = ["blue", "green"];
    else if (playerCount === 3) colors = ["blue", "red", "green"];
    else colors = ["blue", "red", "green", "yellow"];
    
    const initialTokens = {};
    colors.forEach(color => {
      initialTokens[color] = [
        { id: 0, position: -1, isHome: true, isFinished: false },
        { id: 1, position: -1, isHome: true, isFinished: false },
        { id: 2, position: -1, isHome: true, isFinished: false },
        { id: 3, position: -1, isHome: true, isFinished: false },
      ];
    });

    // FIXED: Use consistent action name 'game-start'
    roomService.sendGameAction('game-start', { 
      players: gamePlayerNames, 
      initialTokens,
      numPlayers: playerCount
    });

    // Apply locally for host
    setPlayerNames(gamePlayerNames);
    setNumPlayers(playerCount);
    setTokens(initialTokens);
    setGameStarted(true);
    setWaitingForPlayers(false);
    setMyPlayerIndex(0);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setCanRoll(true);
    
    // Navigate to play URL for ad-free gameplay
    if (onGameStart && !isPlayMode) {
      onGameStart();
    }
  }

  function handleBackToMenu() {
    if (roomService.isConnected()) {
      roomService.leaveRoom();
    }
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
    setConnectedPlayers([]);
    if (onBack) onBack();
  }

  function resetGame() {
    if (isOnlineMode && isHost) {
      roomService.sendGameAction('restart-game', { message: 'Host restarted the game' });
    }
    if (roomService.isConnected()) {
      roomService.leaveRoom();
    }
    setGameStarted(false);
    setGameMode(null);
    setNumPlayers(2);
    setPlayerNames(["", ""]);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setCanRoll(true);
    setTokens({});
    setWinner(null);
    setMovableTokens([]);
    setPlayerRankings([]);
    setGameOver(false);
    setConsecutiveSixes(0);
    setIsOnlineMode(false);
    setIsInRoom(false);
    setIsHost(false);
    setWaitingForPlayers(false);
    setRoomCode("");
    setPlayerName("");
    setConnectedPlayers([]);
  }

  // Mode Selection Screen
  if (!gameMode) {
    return (
      <GameLayout title="🎲 Ludo King" onBack={onBack || handleBackToMenu}>
        {alertMessage && (
          <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />
        )}
        <GameModeSelector
          onSelectLocal={() => {
            setGameMode("local");
            setIsOnlineMode(false);
          }}
          onSelectOnline={() => {
            setGameMode("online");
            setIsOnlineMode(true);
          }}
          localLabel="Play Locally"
          onlineLabel="Play Online"
        />
      </GameLayout>
    );
  }

  // Online Room Setup Screen
  if (gameMode === 'online' && !isInRoom) {
    return (
      <GameLayout title="🎲 Ludo King - Online Setup" onBack={handleBackToMenu}>
        {alertMessage && (
          <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />
        )}
        <OnlineRoomSetup
          playerName={playerName}
          setPlayerName={setPlayerName}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          onCreateRoom={handleCreateOnlineRoom}
          onJoinRoom={handleJoinOnlineRoom}
          gameName="Ludo"
          hideCreateRoom={!!initialRoomCode}
        />
      </GameLayout>
    );
  }

  // Online Waiting Room
  if (isOnlineMode && isInRoom && waitingForPlayers) {
    return (
      <GameLayout title="🎲 Ludo King - Waiting Room" onBack={handleBackToMenu}>
        {alertMessage && (
          <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />
        )}
        <OnlineRoomExample
          roomCode={roomCode}
          connectedPlayers={connectedPlayers}
          maxPlayers={4}
          isHost={isHost}
          onStartGame={handleStartOnlineGame}
          minPlayers={2}
          gameUrl={`${window.location.origin}/games/ludo?room=${roomCode}`}
        />
      </GameLayout>
    );
  }

  // Player Setup Screen (for local mode)
  if (gameMode === "local" && !gameStarted) {
    const getColorLabel = (index) => {
      const colors = getActiveColors();
      const colorMap = {
        blue: '🔵 Blue',
        red: '🔴 Red',
        green: '🟢 Green',
        yellow: '🟡 Yellow'
      };
      return colorMap[colors[index]] || `Player ${index + 1}`;
    };

    const colorSymbols = Array.from({ length: numPlayers }).map((_, i) => getColorLabel(i));

    return (
      <GameLayout title="🎲 Ludo King - Player Setup" onBack={handleBackToMenu}>
        {alertMessage && (
          <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />
        )}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>
            Select the number of players (2-4) and enter names to begin!
          </p>

          <div className={styles.playerCountSection}>
            <label className={styles.label}>Number of Players</label>
            <div className={styles.playerCountButtons}>
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => handlePlayerCountChange(count)}
                  className={`${styles.countButton} ${numPlayers === count ? styles.countButtonActive : ''}`}
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
            <button onClick={startGame} className={styles.startButton}>
              Start Game
            </button>
          </div>
        </div>
      </GameLayout>
    );
  }

  // Game Screen
  return (
    <GameLayout title="🎲 Ludo King" onBack={resetGame}>
      {alertMessage && (
        <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />
      )}
      
      <CustomConfirm
        isOpen={showContinueDialog}
        onConfirm={handleContinueGame}
        onCancel={handleStartNewGame}
        message={`You have a saved game from your previous session.${isOnlineMode ? ' (Online Mode)' : ''} Would you like to continue?`}
        timeRemaining={timeRemaining}
      />
      
      {isOnlineMode && (
        <div className={styles.onlineIndicator}>
          🌐 Online | Room: {roomCode} | 
          {myPlayerIndex === currentPlayerIndex ? " Your turn!" : ` ${playerNames[currentPlayerIndex]}'s turn`}
        </div>
      )}
      
      {/* Reconnection countdown */}
      {disconnectedPlayer && reconnectionTimeLeft > 0 && (
        <div className={styles.reconnectionAlert}>
          ⏳ {disconnectedPlayer} disconnected. Waiting for reconnection... ({reconnectionTimeLeft}s)
        </div>
      )}
      
      {/* Player cards with crown/rank */}
      <div className={styles.playerCardsContainer}>
        {activeColors.map((color, idx) => {
          const name = playerNames[idx] || `Player ${idx + 1}`;
          const tokensForPlayer = tokens[color] || [];
          const finished = tokensForPlayer.length > 0 && tokensForPlayer.every(t => t.isFinished);
          let rank = null;
          if (finished && playerRankings.includes(name)) {
            rank = playerRankings.indexOf(name) + 1;
          }
          return (
            <div key={color} className={styles.playerCard + (currentPlayerIndex === idx ? ' ' + styles.activePlayerCard : '')}>
              <span className={styles.playerColorDot} style={{ background: color }} />
              <span className={styles.playerName}>{name}</span>
              {rank && (
                <span className={styles.crown}>
                  {rank === 1 ? '👑' : '👑'} <span className={styles.rankNum}>#{rank}</span>
                </span>
              )}
              {finished && <span className={styles.finishedText}>Finished</span>}
            </div>
          );
        })}
      </div>
      <LudoBoard
        tokens={tokens}
        activeColors={activeColors}
        currentPlayerIndex={currentPlayerIndex}
        currentColor={currentColor}
        movableTokens={movableTokens}
        onTokenClick={(tokenIndex) => {
          if (movableTokens.includes(tokenIndex) && !winner && !gameOver) {
            moveToken(tokenIndex);
          }
        }}
        diceValue={diceValue}
        canRoll={canRoll && (!isOnlineMode || myPlayerIndex === currentPlayerIndex)}
        onRollDice={rollDice}
        playerNames={playerNames}
      />

      {/* Winner Modal */}
      {gameOver && (
        <div className={styles.winnerOverlay}>
          <div className={styles.winnerCard}>
            <div className={styles.winnerText}>🏆 Game Over! 🏆</div>
            <p className={styles.winnerSubtext}>Final Rankings:</p>
            <ol className={styles.rankingsList}>
              {playerRankings.map((player, index) => (
                <li key={index} className={styles.rankingsItem}>
                  {index + 1}. {player}
                </li>
              ))}
            </ol>
            {(!isOnlineMode || isHost) && (
              <button onClick={resetGame} className={styles.startButton}>
                🔄 Play Again
              </button>
            )}
          </div>
        </div>
      )}
    </GameLayout>
  );
}

export default Ludo;
