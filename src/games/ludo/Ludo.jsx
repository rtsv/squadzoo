import { useState, useEffect, useCallback } from "react";
import LudoBoard from "./LudoBoard";
import GameLayout from "../../layout/GameLayout";
import GameModeSelector from "../../components/GameModeSelector";
import OnlineRoomSetup from "../../components/OnlineRoomSetup";
import OnlineRoomExample from "../../components/OnlineRoomExample";
import CustomAlert from "../../components/CustomAlert";
import PlayerNameInput from "../../components/PlayerNameInput";
import roomService from "../../services/roomService";
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
// These are the last positions on main path before entering home stretch
const HOME_ENTRY = {
  blue: 51,   // Blue enters home stretch after position 51
  red: 12,    // Red enters home stretch after position 12
  green: 25,  // Green enters home stretch after position 25
  yellow: 38  // Yellow enters home stretch after position 38
};

// Total positions: 52 (circular) + 6 (home stretch) per player
const MAIN_PATH_LENGTH = 52;

function Ludo({ onBack, initialRoomCode }) {
  const [gameMode, setGameMode] = useState(null); // null | "local" | "online"
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
  const [playerRankings, setPlayerRankings] = useState([]); // Track rankings
  const [gameOver, setGameOver] = useState(false); // Track if game is completely over

  // Get active colors based on number of players
  // 2 players: Blue vs Green (diagonal opposites like Ludo King)
  // 3 players: Blue, Red, Green
  // 4 players: All four colors
  const getActiveColors = () => {
    if (numPlayers === 2) return ["blue", "green"];
    if (numPlayers === 3) return ["blue", "red", "green"];
    return ["blue", "red", "green", "yellow"];
  };

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

  // Online multiplayer handler functions (using useCallback to prevent re-creation)
  const handleGameStart = useCallback((payload) => {
    const { players: gamePlayers, initialTokens } = payload;
    console.log('🎮 handleGameStart called with:', { gamePlayers, initialTokens });
    
    // Update all states together to ensure proper re-render
    setPlayerNames(gamePlayers);
    setNumPlayers(gamePlayers.length);
    setTokens(initialTokens);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setCanRoll(true);
    setMovableTokens([]);
    setWaitingForPlayers(false); // Critical: Exit waiting room
    setGameStarted(true); // Critical: Show game board
    
    // Find my player index
    const myIndex = gamePlayers.indexOf(roomService.playerName);
    setMyPlayerIndex(myIndex);
    
    console.log('🎮 My player index:', myIndex);
    console.log('✅ Game should now start for all players!');
  }, []);

  const handleRemoteDiceRoll = useCallback((payload) => {
    const { roll, playerIndex, movable } = payload;
    console.log('🎲 Remote dice roll:', { roll, playerIndex, movable });
    
    setDiceValue(roll);
    setCurrentPlayerIndex(playerIndex);
    setMovableTokens(movable);
    setCanRoll(false);
  }, []);

  const handleRemoteTokenMove = useCallback((payload) => {
    const { newTokens, tokenFinished, steps } = payload;
    console.log('🎯 Remote token move:', payload);
    
    setTokens(newTokens);
    setMovableTokens([]);
    
    // Check if player gets another turn
    setTimeout(() => {
      if (steps === 6 || tokenFinished) {
        // Player gets another turn
        setDiceValue(null);
        setCanRoll(true);
      }
    }, 300);
  }, []);

  const handleRemoteNextTurn = useCallback((payload) => {
    const { nextPlayerIndex } = payload;
    console.log('➡️ Remote next turn:', nextPlayerIndex);
    
    setCurrentPlayerIndex(nextPlayerIndex);
    setDiceValue(null);
    setCanRoll(true);
    setMovableTokens([]);
  }, []);

  const handleRemoteGameOver = useCallback((payload) => {
    const { rankings } = payload;
    console.log('🏆 Remote game over:', rankings);
    
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
      console.log('📋 All players after join:', allPlayers);
      setConnectedPlayers([...allPlayers]);
    };

    const handlePlayerLeft = (data) => {
      console.log('👋 Player left:', data);
      const allPlayers = roomService.getConnectedPlayers();
      console.log('📋 All players after leave:', allPlayers);
      setConnectedPlayers([...allPlayers]);
      
      if (gameStarted) {
        setAlertMessage(`${data.playerName || 'A player'} disconnected!`);
      }
    };

    const handleGameAction = (data) => {
      console.log('🎮 Game action received:', data.action, data);
      
      switch (data.action) {
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
          setAlertMessage(data.payload.message);
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
    console.log('📋 Initial players:', initialPlayers);
    setConnectedPlayers([...initialPlayers]);

    return () => {
      console.log('🧹 Cleaning up online game listeners');
    };
  }, [isOnlineMode, isInRoom, handleGameStart, handleRemoteDiceRoll, handleRemoteTokenMove, handleRemoteNextTurn, handleRemoteGameOver, gameStarted]);

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
  }, [gameStarted, numPlayers, isOnlineMode]);

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
  }

  // Calculate absolute position on main path for a token
  function getAbsolutePosition(color, relativePosition) {
    if (relativePosition < 0 || relativePosition >= MAIN_PATH_LENGTH) return -1;
    const startPos = START_POSITIONS[color];
    return (startPos + relativePosition) % MAIN_PATH_LENGTH;
  }

  // Check if a position is safe (star or starting position)
  function isSafePosition(absolutePosition) {
    return SAFE_POSITIONS.includes(absolutePosition);
  }

  // Check if token can enter home stretch
  function canEnterHomeStretch(color, currentRelativePos, steps) {
    const homeEntry = HOME_ENTRY[color];
    const startPos = START_POSITIONS[color];
    
    // Calculate how many steps until home entry
    let stepsToHomeEntry;
    if (startPos <= homeEntry) {
      stepsToHomeEntry = homeEntry - startPos - currentRelativePos;
    } else {
      stepsToHomeEntry = (MAIN_PATH_LENGTH - startPos + homeEntry) - currentRelativePos;
    }
    
    // If steps exactly reach or pass home entry, can enter home stretch
    return steps >= stepsToHomeEntry && currentRelativePos < MAIN_PATH_LENGTH;
  }

  function rollDice() {
    if (!canRoll || gameOver) return;

    // In online mode, only allow current player to roll (like WordChain checks turn)
    if (isOnlineMode && myPlayerIndex !== currentPlayerIndex) {
      setAlertMessage("Wait for your turn!");
      return;
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceValue(roll);
    setCanRoll(false);

    const playerTokens = tokens[currentColor];
    
    // Check if current player has already finished all tokens
    const hasFinished = playerTokens && playerTokens.every(t => t.isFinished);
    if (!playerTokens || hasFinished) {
      if (isOnlineMode) {
        // Broadcast next turn
        const nextIdx = (currentPlayerIndex + 1) % activeColors.length;
        roomService.sendGameAction('next-turn', { nextPlayerIndex: nextIdx });
      }
      setTimeout(() => {
        nextTurn();
      }, 1000);
      return;
    }

    const movable = [];

    playerTokens.forEach((token, idx) => {
      if (token.isFinished) return;
      
      if (token.isHome) {
        // Can only move out of home with a 6
        if (roll === 6) {
          movable.push(idx);
        }
      } else {
        // Token is on the board
        const currentPos = token.position;
        
        // Check if in home stretch (positions 52-57)
        if (currentPos >= MAIN_PATH_LENGTH) {
          const homeStretchPos = currentPos - MAIN_PATH_LENGTH;
          const newHomeStretchPos = homeStretchPos + roll;
          // Can only move if exact or less than finish
          if (newHomeStretchPos <= 5) {
            movable.push(idx);
          }
        } else {
          // On main path - check if move is valid
          const newPos = currentPos + roll;
          
          // Calculate if entering home stretch
          const startPos = START_POSITIONS[currentColor];
          const homeEntry = HOME_ENTRY[currentColor];
          
          // Calculate absolute positions
          const currentAbsolute = getAbsolutePosition(currentColor, currentPos);
          
          // Check if path would cross into home stretch
          let stepsToHomeEntry;
          if (currentAbsolute <= homeEntry) {
            stepsToHomeEntry = homeEntry - currentAbsolute;
          } else {
            stepsToHomeEntry = MAIN_PATH_LENGTH - currentAbsolute + homeEntry;
          }
          
          if (currentPos + roll > MAIN_PATH_LENGTH - 1 + 5) {
            // Would overshoot finish - can't move
          } else {
            // Valid move
            movable.push(idx);
          }
        }
      }
    });

    setMovableTokens(movable);

    // Broadcast dice roll in online mode (use 'dice-roll' action like WordChain uses 'word-submit')
    if (isOnlineMode) {
      roomService.sendGameAction('dice-roll', {
        roll,
        playerIndex: currentPlayerIndex,
        movable
      });
    }

    if (movable.length === 0) {
      setTimeout(() => {
        nextTurn();
      }, 1500);
    } else if (movable.length === 1) {
      setTimeout(() => {
        moveToken(movable[0], roll);
      }, 500);
    }
  }

  function moveToken(tokenIndex, steps = diceValue) {
    if (!steps) return;
    
    // In online mode, only allow current player to move (like WordChain)
    if (isOnlineMode && myPlayerIndex !== currentPlayerIndex) {
      return;
    }
    
    const newTokens = JSON.parse(JSON.stringify(tokens));
    const token = newTokens[currentColor][tokenIndex];
    
    let capturedOpponent = false;
    let tokenFinished = false; // Track if token reached home

    if (token.isHome && steps === 6) {
      // Move out of home to starting position (position 0 relative to this color)
      token.isHome = false;
      token.position = 0;
      
      // Check for capture at start position
      const absoluteStart = START_POSITIONS[currentColor];
      capturedOpponent = checkAndCapture(newTokens, currentColor, absoluteStart);
      
    } else if (!token.isHome && !token.isFinished) {
      const currentPos = token.position;
      const newPos = currentPos + steps;
      
      if (currentPos >= MAIN_PATH_LENGTH) {
        // Already in home stretch
        const homeStretchPos = currentPos - MAIN_PATH_LENGTH;
        const newHomeStretchPos = homeStretchPos + steps;
        
        if (newHomeStretchPos >= 5) {
          // Reached home!
          token.position = MAIN_PATH_LENGTH + 5;
          token.isFinished = true;
          tokenFinished = true; // Token just finished
        } else {
          token.position = MAIN_PATH_LENGTH + newHomeStretchPos;
        }
      } else {
        // On main path - need to check if entering home stretch
        const startPos = START_POSITIONS[currentColor];
        const homeEntry = HOME_ENTRY[currentColor];
        
        // Calculate absolute positions for current and new positions
        const currentAbsolutePos = getAbsolutePosition(currentColor, currentPos);
        
        // Check if the token will cross or land on its home entry point
        // We need to check each step of the movement
        let willEnterHomeStretch = false;
        let stepsBeforeHomeEntry = 0;
        let stepsAfterHomeEntry = 0;
        
        for (let step = 1; step <= steps; step++) {
          const testPos = currentPos + step;
          const testAbsolutePos = getAbsolutePosition(currentColor, testPos);
          
          // Check if we've reached the home entry position
          if (testAbsolutePos === homeEntry) {
            willEnterHomeStretch = true;
            stepsBeforeHomeEntry = step - 1;
            stepsAfterHomeEntry = steps - step;
            break;
          }
        }
        
        if (willEnterHomeStretch && stepsAfterHomeEntry >= 0) {
          // Token enters home stretch
          const homeStretchPos = stepsAfterHomeEntry;
          if (homeStretchPos >= 5) {
            // Exactly reached or passed home
            token.position = MAIN_PATH_LENGTH + 5;
            token.isFinished = true;
            tokenFinished = true; // Token just finished
          } else {
            token.position = MAIN_PATH_LENGTH + homeStretchPos;
          }
        } else {
          // Still on main path
          token.position = newPos;
          
          // Calculate absolute position for capture check
          const absolutePos = getAbsolutePosition(currentColor, newPos);
          
          // Check for capture if not on safe spot
          if (!isSafePosition(absolutePos)) {
            capturedOpponent = checkAndCapture(newTokens, currentColor, absolutePos);
          }
        }
      }
    }

    newTokens[currentColor][tokenIndex] = token;
    setTokens(newTokens);
    setMovableTokens([]);

    // Broadcast move in online mode (use 'token-move' action like WordChain)
    if (isOnlineMode) {
      roomService.sendGameAction('token-move', {
        tokenIndex,
        steps,
        newTokens,
        currentPlayerIndex,
        tokenFinished,
        capturedOpponent
      });
    }

    // Check for winner
    const allFinished = newTokens[currentColor].every(t => t.isFinished);
    if (allFinished) {
      const newRankings = [...playerRankings, playerNames[currentPlayerIndex]];
      setPlayerRankings(newRankings);

      if (newRankings.length === activeColors.length - 1) {
        // Game over when only one player remains
        const remainingPlayer = activeColors.find(
          (color, index) => !newRankings.includes(playerNames[index])
        );
        const finalRankings = [...newRankings, playerNames[activeColors.indexOf(remainingPlayer)]];
        setPlayerRankings(finalRankings);
        setGameOver(true);
        
        // Broadcast game over in online mode
        if (isOnlineMode) {
          roomService.sendGameAction('game-over', { rankings: finalRankings });
        }
        return;
      }

      nextTurn();
      return;
    }

    // Player gets another turn if:
    // 1. They rolled a 6, OR
    // 2. A token just finished (reached home)
    // Otherwise, pass turn to next player
    setTimeout(() => {
      if (steps === 6 || tokenFinished) {
        // Player gets another turn after rolling 6 or finishing a token
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
        if (token.position >= MAIN_PATH_LENGTH) return; // In home stretch, safe
        
        // Calculate absolute position for this opponent token
        const tokenAbsolutePos = getAbsolutePosition(color, token.position);
        
        // Check if on safe position
        if (isSafePosition(tokenAbsolutePos)) return;
        
        if (tokenAbsolutePos === absolutePosition) {
          // Capture! Send back to home
          tokensState[color][idx] = {
            ...token,
            position: -1,
            isHome: true
          };
          captured = true;
        }
      });
    });
    
    return captured;
  }

  function nextTurn() {
    const nextIdx = (currentPlayerIndex + 1) % activeColors.length;
    
    // Broadcast next turn in online mode
    if (isOnlineMode) {
      roomService.sendGameAction('next-turn', { nextPlayerIndex: nextIdx });
    }
    
    setCurrentPlayerIndex(nextIdx);
    setDiceValue(null);
    setCanRoll(true);
    setMovableTokens([]);
  }

  function nextTurn() {
    const nextIdx = (currentPlayerIndex + 1) % activeColors.length;
    
    // Broadcast next turn in online mode
    if (isOnlineMode) {
      roomService.sendGameAction('next-turn', { nextPlayerIndex: nextIdx });
    }
    
    setCurrentPlayerIndex(nextIdx);
    setDiceValue(null);
    setCanRoll(true);
    setMovableTokens([]);
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
      
      // Get connected players after room is created
      const allPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers(allPlayers);
      
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
      
      // Get connected players after joining
      const allPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers(allPlayers);
      
      // Set my player index
      const myIndex = allPlayers.length - 1;
      setMyPlayerIndex(myIndex);
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

    // Check if socket is connected before proceeding
    if (!roomService.isConnected()) {
      console.error('❌ Socket not connected when starting game');
      setAlertMessage("Connection issue. Please wait and try again.");
      return;
    }

    const playerNames = connectedPlayers.map(p => p.playerName);
    const playerCount = playerNames.length;
    setPlayerNames(playerNames);
    setNumPlayers(playerCount);
    setWaitingForPlayers(false);
    setGameStarted(true);
    setMyPlayerIndex(0); // Host is player 0
    
    // Calculate active colors based on player count
    let colors;
    if (playerCount === 2) {
      colors = ["blue", "green"];
    } else if (playerCount === 3) {
      colors = ["blue", "red", "green"];
    } else {
      colors = ["blue", "red", "green", "yellow"];
    }
    
    // Initialize tokens for all players
    const initialTokens = {};
    colors.forEach(color => {
      initialTokens[color] = [
        { id: 0, position: -1, isHome: true, isFinished: false },
        { id: 1, position: -1, isHome: true, isFinished: false },
        { id: 2, position: -1, isHome: true, isFinished: false },
        { id: 3, position: -1, isHome: true, isFinished: false },
      ];
    });

    console.log('🎮 Host starting game with:', { playerNames, playerCount, colors, initialTokens });
    
    setTokens(initialTokens);
    
    // Broadcast immediately - no delay needed since listeners are already registered
    console.log('📤 Sending start-game action...');
    roomService.sendGameAction('start-game', { 
      players: playerNames, 
      initialTokens 
    });
  }

  function handleRemoteMove(payload) {
    // Handle opponent's move
    const { newTokens, currentPlayerIndex: movePlayerIndex, tokenFinished } = payload;
    setTokens(newTokens);
    setMovableTokens([]);

    // Check if player gets another turn
    const steps = payload.steps;
    setTimeout(() => {
      if (steps === 6 || tokenFinished) {
        // Player gets another turn
        setDiceValue(null);
        setCanRoll(true);
      } else {
        // Will receive next-turn action from the player who moved
      }
    }, 300);
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
  }

  function resetGame() {
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
    setIsOnlineMode(false);
    setIsInRoom(false);
    setIsHost(false);
    setWaitingForPlayers(false);
    setRoomCode("");
    setPlayerName("");
  }

  // Mode Selection Screen
  // ...existing code...

  // Mode Selection Screen
  if (!gameMode) {
    return (
      <GameLayout
        title="🎲 Ludo King"
        onBack={onBack}
      >
        {alertMessage && (
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
        
        <GameModeSelector
          onSelectLocal={() => {
            setGameMode("local");
            setIsOnlineMode(false);
          }}
          // onSelectOnline={() => {
          //   setGameMode("online");
          //   setIsOnlineMode(true);
          // }}
          onSelectOnline={() => {
              setAlertMessage("🚧 Online Multiplayer is under development and will be going live soon! Stay tuned for updates. 🎮");
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
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
        
        <OnlineRoomSetup
          playerName={playerName}
          setPlayerName={setPlayerName}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          onCreateRoom={handleCreateOnlineRoom}
          onJoinRoom={handleJoinOnlineRoom}
          gameName="Ludo"
        />
      </GameLayout>
    );
  }

// ...existing code...

  // Online Waiting Room
  if (isOnlineMode && isInRoom && waitingForPlayers) {
    return (
      <GameLayout title="🎲 Ludo King - Waiting Room" onBack={handleBackToMenu}>
        {alertMessage && (
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
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
    // Color labels for display
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
      <GameLayout
        title="🎲 Ludo King - Player Setup"
        onBack={handleBackToMenu}
      >
        {alertMessage && (
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
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
                  className={`${btnStyles.btn} ${numPlayers === count ? btnStyles.btnPrimary : btnStyles.btnSecondary}`}
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
            <button onClick={startGame} className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`}>
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
      title="🎲 Ludo King"
      onBack={resetGame}
    >
      <LudoBoard
        tokens={tokens}
        activeColors={activeColors}
        currentPlayerIndex={currentPlayerIndex}
        currentColor={currentColor}
        movableTokens={movableTokens}
        onTokenClick={(tokenIndex) => {
          if (movableTokens.includes(tokenIndex) && !winner) {
            moveToken(tokenIndex);
          }
        }}
        diceValue={diceValue}
        canRoll={canRoll}
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
            <button 
              onClick={resetGame} 
              className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`}
            >
              🔄 Play Again
            </button>
          </div>
        </div>
      )}
    </GameLayout>
  );
}

export default Ludo;
