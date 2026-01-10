import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import GameLayout from "../../layout/GameLayout";
import GameModeSelector from "../../components/GameModeSelector";
import OnlineRoomSetup from "../../components/OnlineRoomSetup";
import OnlineRoomExample from "../../components/OnlineRoomExample";
import PlayerNameInput from "../../components/PlayerNameInput";
import CustomAlert from "../../components/CustomAlert";
import roomService from "../../services/roomService";
import btnStyles from "../../styles/Button.module.css";
import styles from "../../styles/NumberRecallTiles.module.css";

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy: {
    label: 'Easy',
    previewDuration: 5000, // Longer preview at start
    useRandomSequence: false,
  },
  medium: {
    label: 'Medium',
    previewDuration: 3000, // Normal preview
    useRandomSequence: false,
  },
  hard: {
    label: 'Hard',
    previewDuration: 2000, // Short preview
    useRandomSequence: true, // Random sequence order
  },
};

// Shuffle array helper
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function NumberRecallTiles({ onBack, initialRoomCode, onGameStart, isPlayMode = false }) {
  const location = useLocation();
  const gameState = location.state || {};
  
  // Game flow states
  const [gameMode, setGameMode] = useState(isPlayMode ? (gameState.gameMode || 'local') : null);
  const [gameStarted, setGameStarted] = useState(isPlayMode);
  const [alertMessage, setAlertMessage] = useState(null);
  
  // Setup states
  const [difficulty, setDifficulty] = useState(gameState.difficulty || 'medium');
  const [playerCount, setPlayerCount] = useState(gameState.playerCount || 2);
  const [playerNames, setPlayerNames] = useState(gameState.playerNames || ['', '']);
  const [scores, setScores] = useState({});
  
  // Online multiplayer states
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [myPlayerIndex, setMyPlayerIndex] = useState(null);
  
  // Game states
  const [tilePositions, setTilePositions] = useState([]); // Maps grid index to number (stays same)
  const [requiredSequence, setRequiredSequence] = useState([]); // The order to click (1-9 or random)
  const [currentExpectedIndex, setCurrentExpectedIndex] = useState(0); // Index in requiredSequence
  const [foundTiles, setFoundTiles] = useState([]); // Grid indices that have been correctly found
  const [wrongTile, setWrongTile] = useState(null);
  const [correctTile, setCorrectTile] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  
  // Multiplayer states
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  
  // Preview state (show numbers at start only)
  const [isPreview, setIsPreview] = useState(false);
  
  const settings = DIFFICULTY_SETTINGS[difficulty];
  
  // Sound effect functions
  const playCorrectSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const playWrongSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a buzzer-like sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(100, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const playWinSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioContext.currentTime + idx * 0.15);
        
        gain.gain.setValueAtTime(0, audioContext.currentTime + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + idx * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + idx * 0.15 + 0.3);
        
        osc.start(audioContext.currentTime + idx * 0.15);
        osc.stop(audioContext.currentTime + idx * 0.15 + 0.3);
      });
    } catch (error) {
      console.log('Audio not supported');
    }
  };
  
  // Initialize game - tile positions stay the same for the whole game
  const initializeGame = useCallback((forceNewPositions = true) => {
    let positions = tilePositions;
    
    if (forceNewPositions || tilePositions.length === 0) {
      // Create tile positions: shuffle numbers 1-9
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      positions = shuffleArray(numbers);
      setTilePositions(positions);
    }
    
    // Create required sequence based on difficulty
    let sequence;
    if (settings.useRandomSequence) {
      sequence = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    } else {
      sequence = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
    setRequiredSequence(sequence);
    
    // Reset states
    setCurrentExpectedIndex(0);
    setFoundTiles([]);
    setWrongTile(null);
    setCorrectTile(null);
    setIsResetting(false);
    setGameOver(false);
    setWinner(null);
    
    // Initialize scores
    const initialScores = {};
    playerNames.forEach((name, idx) => {
      initialScores[idx] = 0;
    });
    setScores(initialScores);
    
    // Show preview briefly at start
    setIsPreview(true);
    setTimeout(() => {
      setIsPreview(false);
    }, settings.previewDuration);
    
    return positions;
  }, [tilePositions, settings.useRandomSequence, settings.previewDuration, playerNames]);
  
  // Auto-join room from URL
  useEffect(() => {
    if (initialRoomCode && !gameMode && !isInRoom) {
      setGameMode('online');
      setIsOnlineMode(true);
      setRoomCode(initialRoomCode.toUpperCase().trim());
    }
  }, [initialRoomCode, gameMode, isInRoom]);

  // Online game handlers
  const handleRemoteGameStart = useCallback((payload) => {
    const { players, tilePositions: positions, requiredSequence: sequence, difficulty: diff, numPlayers } = payload;
    console.log('🎮 handleRemoteGameStart:', payload);
    
    setPlayerNames(players);
    setPlayerCount(numPlayers);
    setDifficulty(diff);
    setTilePositions(positions);
    setRequiredSequence(sequence);
    setCurrentPlayerIndex(0);
    setCurrentExpectedIndex(0);
    setFoundTiles([]);
    setGameOver(false);
    setWinner(null);
    setWaitingForPlayers(false);
    setGameStarted(true);
    
    // Initialize scores
    const initialScores = {};
    players.forEach((_, idx) => {
      initialScores[idx] = 0;
    });
    setScores(initialScores);
    
    // Find my player index
    const myIndex = players.indexOf(roomService.playerName);
    setMyPlayerIndex(myIndex);
    
    // Show preview
    setIsPreview(true);
    setTimeout(() => {
      setIsPreview(false);
    }, DIFFICULTY_SETTINGS[diff].previewDuration);
    
    if (onGameStart && !isPlayMode) {
      onGameStart();
    }
  }, [onGameStart, isPlayMode]);

  const handleRemoteTileClick = useCallback((payload) => {
    const { 
      gridIndex, 
      isCorrect, 
      currentExpectedIndex: newExpectedIndex,
      foundTiles: newFoundTiles,
      scores: newScores,
      currentPlayerIndex: newPlayerIndex,
      isGameOver,
      winner: gameWinner
    } = payload;
    
    if (isCorrect) {
      setCorrectTile(gridIndex);
      playCorrectSound();
      setTimeout(() => setCorrectTile(null), 300);
      setCurrentExpectedIndex(newExpectedIndex);
      setFoundTiles(newFoundTiles);
      setScores(newScores);
      
      if (isGameOver) {
        playWinSound();
        setWinner(gameWinner);
        setGameOver(true);
        setFoundTiles([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      }
    } else {
      setWrongTile(gridIndex);
      playWrongSound();
      setIsResetting(true);
      
      setTimeout(() => {
        setWrongTile(null);
        setCurrentPlayerIndex(newPlayerIndex);
        setCurrentExpectedIndex(0);
        setFoundTiles([]);
        setIsResetting(false);
      }, 1000);
    }
  }, []);

  const handleRemoteNextTurn = useCallback((payload) => {
    const { nextPlayerIndex } = payload;
    setCurrentPlayerIndex(nextPlayerIndex);
    setCurrentExpectedIndex(0);
    setFoundTiles([]);
  }, []);

  // Setup online game listeners
  useEffect(() => {
    if (!isOnlineMode || !isInRoom) return;

    console.log('🎮 Setting up Number Recall online listeners');

    const handleError = (errorMessage) => {
      setAlertMessage(errorMessage);
    };

    const handlePlayerJoined = (data) => {
      console.log('👋 Player joined:', data);
      const allPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers([...allPlayers]);
    };

    const handlePlayerLeft = (data) => {
      console.log('👋 Player left:', data);
      const allPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers([...allPlayers]);
      
      if (gameStarted) {
        setAlertMessage(`${data.playerName || 'A player'} disconnected.`);
      }
    };

    const handleGameAction = (data) => {
      console.log('🎮 Game action received:', data.action, data.payload);
      
      switch (data.action) {
        case 'game-start':
          handleRemoteGameStart(data.payload);
          break;
        case 'tile-click':
          handleRemoteTileClick(data.payload);
          break;
        case 'next-turn':
          handleRemoteNextTurn(data.payload);
          break;
        case 'restart-game':
          setGameStarted(false);
          setWaitingForPlayers(true);
          setGameOver(false);
          setWinner(null);
          setAlertMessage('Game restarted');
          break;
      }
    };

    roomService.on('onError', handleError);
    roomService.on('onPlayerJoined', handlePlayerJoined);
    roomService.on('onPlayerLeft', handlePlayerLeft);
    roomService.on('onGameAction', handleGameAction);

    const initialPlayers = roomService.getConnectedPlayers();
    setConnectedPlayers([...initialPlayers]);

    return () => {
      console.log('🧹 Cleaning up online listeners');
    };
  }, [isOnlineMode, isInRoom, handleRemoteGameStart, handleRemoteTileClick, handleRemoteNextTurn, gameStarted]);
  
  // Initialize game when component mounts in play mode
  useEffect(() => {
    if (isPlayMode && gameStarted && tilePositions.length === 0 && !isOnlineMode) {
      initializeGame(true);
    }
  }, [isPlayMode, gameStarted, tilePositions.length, initializeGame, isOnlineMode]);
  
  // Create room handler
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setAlertMessage("Please enter your name!");
      return;
    }
    
    try {
      roomService.playerName = playerName.trim();
      const result = await roomService.createRoom();
      setRoomCode(result.roomCode);
      setIsHost(true);
      setIsInRoom(true);
      setWaitingForPlayers(true);
      
      const players = roomService.getConnectedPlayers();
      setConnectedPlayers([...players]);
    } catch (error) {
      setAlertMessage(error.message || "Failed to create room");
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setAlertMessage("Please enter your name!");
      return;
    }
    if (!roomCode.trim() || roomCode.length < 6) {
      setAlertMessage("Please enter a valid room code!");
      return;
    }
    
    try {
      roomService.playerName = playerName.trim();
      await roomService.joinRoom(roomCode.trim());
      setIsHost(false);
      setIsInRoom(true);
      setWaitingForPlayers(true);
      
      const players = roomService.getConnectedPlayers();
      setConnectedPlayers([...players]);
    } catch (error) {
      setAlertMessage(error.message || "Failed to join room");
    }
  };

  // Start online game (host only)
  const startOnlineGame = () => {
    if (!isHost) return;
    
    const players = connectedPlayers.map(p => p.playerName);
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const positions = shuffleArray(numbers);
    const sequence = settings.useRandomSequence ? shuffleArray(numbers) : [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    const payload = {
      players,
      numPlayers: players.length,
      difficulty,
      tilePositions: positions,
      requiredSequence: sequence
    };
    
    roomService.sendGameAction('game-start', payload);
    handleRemoteGameStart(payload);
  };
  
  // Start the local game
  const startGame = () => {
    const validNames = playerNames.map((name, i) => 
      name.trim() || `Player ${i + 1}`
    );
    setPlayerNames(validNames);
    setGameStarted(true);
    setCurrentPlayerIndex(0);
    initializeGame(true);
    
    // Navigate to play mode
    if (onGameStart && !isPlayMode) {
      onGameStart();
    }
  };
  
  // Handle back navigation
  const handleBackToMenu = () => {
    if (isOnlineMode && isInRoom) {
      roomService.leaveRoom();
      setIsInRoom(false);
      setWaitingForPlayers(false);
      setConnectedPlayers([]);
    }
    
    if (gameStarted) {
      setGameStarted(false);
      setGameOver(false);
    } else if (gameMode) {
      setGameMode(null);
      setIsOnlineMode(false);
    } else if (onBack) {
      onBack();
    }
  };
  
  // Handle tile click
  const handleTileClick = (gridIndex) => {
    if (isResetting || isPreview || gameOver) return;
    
    // In online mode, only current player can click
    if (isOnlineMode && myPlayerIndex !== currentPlayerIndex) {
      return;
    }
    
    const clickedNumber = tilePositions[gridIndex];
    const expectedNumber = requiredSequence[currentExpectedIndex];
    
    if (clickedNumber === expectedNumber) {
      // Correct click!
      playCorrectSound();
      setCorrectTile(gridIndex);
      setTimeout(() => setCorrectTile(null), 300);
      
      const newFoundTiles = [...foundTiles, gridIndex];
      setFoundTiles(newFoundTiles);
      
      const nextIndex = currentExpectedIndex + 1;
      const newScores = { ...scores };
      newScores[currentPlayerIndex] = (newScores[currentPlayerIndex] || 0) + 1;
      setScores(newScores);
      
      if (nextIndex >= 9) {
        // Player completed the sequence - they win!
        playWinSound();
        setFoundTiles([0, 1, 2, 3, 4, 5, 6, 7, 8]); // Reveal all
        setWinner(currentPlayerIndex);
        setGameOver(true);
        
        if (isOnlineMode) {
          roomService.sendGameAction('tile-click', {
            gridIndex,
            isCorrect: true,
            currentExpectedIndex: nextIndex,
            foundTiles: [0, 1, 2, 3, 4, 5, 6, 7, 8],
            scores: newScores,
            currentPlayerIndex,
            isGameOver: true,
            winner: currentPlayerIndex
          });
        }
      } else {
        setCurrentExpectedIndex(nextIndex);
        
        if (isOnlineMode) {
          roomService.sendGameAction('tile-click', {
            gridIndex,
            isCorrect: true,
            currentExpectedIndex: nextIndex,
            foundTiles: newFoundTiles,
            scores: newScores,
            currentPlayerIndex,
            isGameOver: false
          });
        }
      }
    } else {
      // Wrong click - end turn
      playWrongSound();
      setWrongTile(gridIndex);
      setIsResetting(true);
      
      const nextPlayer = (currentPlayerIndex + 1) % (isOnlineMode ? connectedPlayers.length : playerCount);
      
      if (isOnlineMode) {
        roomService.sendGameAction('tile-click', {
          gridIndex,
          isCorrect: false,
          currentPlayerIndex: nextPlayer
        });
      }
      
      setTimeout(() => {
        setWrongTile(null);
        setCurrentPlayerIndex(nextPlayer);
        // Reset progress for next player's turn (same tile positions)
        setFoundTiles([]);
        setCurrentExpectedIndex(0);
        setIsResetting(false);
      }, 1000);
    }
  };
  
  // Restart game
  const restartGame = () => {
    setCurrentPlayerIndex(0);
    initializeGame(true); // New positions for new game
    
    if (isOnlineMode && isHost) {
      const players = connectedPlayers.map(p => p.playerName);
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const positions = shuffleArray(numbers);
      const sequence = settings.useRandomSequence ? shuffleArray(numbers) : [1, 2, 3, 4, 5, 6, 7, 8, 9];
      
      roomService.sendGameAction('game-start', {
        players,
        numPlayers: players.length,
        difficulty,
        tilePositions: positions,
        requiredSequence: sequence
      });
    }
  };
  
  // Go back to setup
  const goToSetup = () => {
    setGameStarted(false);
    setGameOver(false);
    if (isOnlineMode) {
      setWaitingForPlayers(true);
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    if (gameStarted) {
      goToSetup();
    } else if (isOnlineMode && isInRoom) {
      roomService.leaveRoom();
      setIsInRoom(false);
      setWaitingForPlayers(false);
      setConnectedPlayers([]);
    } else if (gameMode) {
      setGameMode(null);
      setIsOnlineMode(false);
    } else if (onBack) {
      onBack();
    }
  };
  
  // Get current player name
  const getCurrentPlayerName = () => {
    if (isOnlineMode) {
      return connectedPlayers[currentPlayerIndex]?.playerName || 'Unknown';
    }
    return playerNames[currentPlayerIndex];
  };

  const getGameUrl = () => {
    return `${window.location.origin}/games/number-recall?room=${roomCode}`;
  };
  
  // ========== RENDER: Mode Selection ==========
  if (!gameMode) {
    return (
      <GameLayout title="🔢 Number Recall" onBack={handleBackToMenu}>
        {alertMessage && (
          <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />
        )}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>
            Memory Tiles Challenge: Tiles hide numbers 1-9. Memorize their positions during preview, then click them in the correct sequence. Click wrong, and your turn ends!
          </p>
          
          <GameModeSelector
            onSelectLocal={() => setGameMode('local')}
            onSelectOnline={() => {
              setGameMode('online');
              setIsOnlineMode(true);
            }}
            localLabel="Local Play"
            onlineLabel="Play Online"
            maxPlayers="Up to 4 players"
          />
        </div>
      </GameLayout>
    );
  }

  // ========== RENDER: Online Room Setup ==========
  if (isOnlineMode && !isInRoom) {
    return (
      <GameLayout title="🔢 Number Recall - Online" onBack={handleBack}>
        {alertMessage && (
          <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />
        )}
        <div className={styles.setupContainer}>
          <OnlineRoomSetup
            playerName={playerName}
            setPlayerName={setPlayerName}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        </div>
      </GameLayout>
    );
  }

  // ========== RENDER: Online Waiting Room ==========
  if (isOnlineMode && isInRoom && waitingForPlayers && !gameStarted) {
    return (
      <GameLayout title="🔢 Number Recall - Room" onBack={handleBack}>
        {alertMessage && (
          <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />
        )}
        <div className={styles.setupContainer}>
          {/* Difficulty Selection (host only) */}
          {isHost && (
            <div className={styles.difficultySection}>
              <label className={styles.label}>Select Difficulty</label>
              <div className={styles.difficultyButtons}>
                {Object.entries(DIFFICULTY_SETTINGS).map(([key, val]) => (
                  <button
                    key={key}
                    className={`${styles.difficultyButton} ${difficulty === key ? styles.difficultyButtonActive : ''}`}
                    onClick={() => setDifficulty(key)}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <OnlineRoomExample
            roomCode={roomCode}
            connectedPlayers={connectedPlayers}
            maxPlayers={4}
            minPlayers={2}
            isHost={isHost}
            onStartGame={startOnlineGame}
            gameUrl={getGameUrl()}
          />
        </div>
      </GameLayout>
    );
  }
  
  // ========== RENDER: Local Setup Screen ==========
  if (!gameStarted && !isOnlineMode) {
    return (
      <GameLayout title="🔢 Number Recall - Setup" onBack={handleBackToMenu}>
        {alertMessage && (
          <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />
        )}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>Local Multiplayer Mode</p>
          
          {/* Player Count */}
          <div className={styles.playerCountSection}>
            <label className={styles.label}>Number of Players</label>
            <div className={styles.playerCountButtons}>
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  className={`${styles.countButton} ${playerCount === count ? styles.countButtonActive : ''}`}
                  onClick={() => {
                    setPlayerCount(count);
                    setPlayerNames(prev => {
                      const newNames = [...prev];
                      while (newNames.length < count) newNames.push('');
                      return newNames.slice(0, count);
                    });
                  }}
                >
                  {count} Players
                </button>
              ))}
            </div>
          </div>
          
          {/* Difficulty Selection */}
          <div className={styles.difficultySection}>
            <label className={styles.label}>Select Difficulty</label>
            <div className={styles.difficultyButtons}>
              {Object.entries(DIFFICULTY_SETTINGS).map(([key, val]) => (
                <button
                  key={key}
                  className={`${styles.difficultyButton} ${difficulty === key ? styles.difficultyButtonActive : ''}`}
                  onClick={() => setDifficulty(key)}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Player Name Inputs */}
          <PlayerNameInput
            players={playerNames.slice(0, playerCount)}
            onPlayerChange={(index, value) => {
              const newNames = [...playerNames];
              newNames[index] = value;
              setPlayerNames(newNames);
            }}
            minPlayers={playerCount}
            showSymbols={false}
          />
          
          {/* Start Button */}
          <div className={styles.setupButtons}>
            <button
              className={styles.startButton}
              onClick={startGame}
            >
              Start Game
            </button>
          </div>
        </div>
      </GameLayout>
    );
  }
  
  // ========== RENDER: Game Screen ==========
  const displayPlayerNames = isOnlineMode 
    ? connectedPlayers.map(p => p.playerName)
    : playerNames.slice(0, playerCount);

  return (
    <GameLayout title="🔢 Number Recall" onBack={goToSetup}>
      {alertMessage && (
        <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />
      )}
      <div className={styles.gameContainer}>
        {/* Current Player Display */}
        <div className={styles.currentPlayerDisplay}>
          <div className={styles.currentPlayerLabel}>Current Turn</div>
          <div className={styles.currentPlayerName}>{getCurrentPlayerName()}</div>
        </div>
        
        {/* Player Cards */}
        <div className={styles.playerInfo}>
          {displayPlayerNames.map((name, idx) => (
            <div 
              key={idx}
              className={`${styles.playerCard} ${currentPlayerIndex === idx ? styles.active : ''}`}
            >
              <span className={styles.playerName}>{name}</span>
              <span className={styles.playerScore}>Score: {scores[idx] || 0}</span>
              {currentPlayerIndex === idx && (
                <span className={styles.turnIndicator}>Playing</span>
              )}
            </div>
          ))}
        </div>
        
        {/* Sequence Display (Hard Mode) */}
        {settings.useRandomSequence && (
          <div className={styles.sequenceDisplay}>
            <div className={styles.sequenceLabel}>Required Order</div>
            <div className={styles.sequenceNumbers}>
              {requiredSequence.join(' → ')}
            </div>
          </div>
        )}
        
        {/* Status Bar */}
        <div className={styles.statusBar}>
          <div className={`${styles.statusText} ${isPreview ? styles.highlight : ''}`}>
            {isPreview 
              ? '👀 Memorize the positions!'
              : isResetting
                ? 'Wrong! Switching turns...'
                : `🎯 Find: ${requiredSequence[currentExpectedIndex]} (${currentExpectedIndex + 1}/9)`
            }
          </div>
        </div>
        
        {/* Tile Grid */}
        <div className={styles.gridWrapper}>
          <div className={styles.tileGrid}>
            {tilePositions.map((number, gridIndex) => {
              const isFound = foundTiles.includes(gridIndex);
              const isWrong = wrongTile === gridIndex;
              const isCorrect = correctTile === gridIndex;
              const isPreviewTile = isPreview;
              
              return (
                <button
                  key={gridIndex}
                  className={`
                    ${styles.tile}
                    ${isFound ? styles.revealed : ''}
                    ${isWrong ? styles.wrong : ''}
                    ${isCorrect ? styles.correct : ''}
                    ${isPreviewTile ? styles.preview : ''}
                    ${isResetting || isPreview ? styles.disabled : ''}
                  `}
                  onClick={() => handleTileClick(gridIndex)}
                  disabled={isResetting || isPreview || gameOver || isFound}
                >
                  {(isFound || isWrong || isCorrect || isPreviewTile) ? number : '?'}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Game Over Overlay */}
      {gameOver && (
        <div className={styles.winnerOverlay}>
          <div className={styles.winnerCard}>
            <div className={styles.winnerText}>🏆 Winner!</div>
            <div className={styles.winnerName}>
              {isOnlineMode 
                ? connectedPlayers[winner]?.playerName 
                : playerNames[winner]}
            </div>
            <div className={styles.winnerSubtext}>
              Completed the entire sequence!
            </div>
            
            <div className={styles.setupButtons}>
              <button
                className={styles.startButton}
                onClick={restartGame}
                disabled={isOnlineMode && !isHost}
              >
                🔄 Play Again
              </button>
              <button
                className={`${btnStyles.btn} ${btnStyles.btnSecondary}`}
                onClick={goToSetup}
                style={{ marginTop: '1rem' }}
              >
                Change Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </GameLayout>
  );
}

export default NumberRecallTiles;
