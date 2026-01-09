import { useState, useEffect } from "react";
import GameLayout from "../../layout/GameLayout";
import CustomAlert from "../../components/CustomAlert";
import CustomConfirm from "../../components/CustomConfirm";
import GameModeSelector from "../../components/GameModeSelector";
import OnlineRoomSetup from "../../components/OnlineRoomSetup";
import OnlineRoomExample from "../../components/OnlineRoomExample";
import PlayerNameInput from "../../components/PlayerNameInput";
import GameRules from "../../components/GameRules";
import roomService from "../../services/roomService";
import { saveGameState, loadGameState, clearGameState, getTimeRemaining } from "../../services/gameStateService";
import styles from "../../styles/WordChain.module.css";
import btnStyles from "../../styles/Button.module.css";
import inputStyles from "../../styles/Input.module.css";

function WordChain({ onBack, initialRoomCode, onGameStart, isPlayMode = false }) {
  const [gameMode, setGameMode] = useState(null); // null, 'local', 'online'
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState(["", "", ""]);
  const [playerLives, setPlayerLives] = useState({});
  const [usedWords, setUsedWords] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [input, setInput] = useState("");
  const [eliminated, setEliminated] = useState([]);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Online multiplayer states
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [myPlayerIndex, setMyPlayerIndex] = useState(null);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);
  
  // State persistence
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [savedState, setSavedState] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const gameRules = [
    "Each player starts with 3 lives (hearts)",
    "Take turns saying a valid English word",
    "Each word must start with the last letter of the previous word",
    "Example: CAT → TABLE → EGG → GAME",
    "You cannot reuse a word that's already been used",
    "Words must be at least 2 letters long and contain only letters",
    "Lose a life for: wrong starting letter, invalid word, or repeated word",
    "Last player standing wins!"
  ];

  // Handle initial room code from URL
  useEffect(() => {
    if (initialRoomCode) {
      setGameMode('online');
      setIsOnlineMode(true);
      setRoomCode(initialRoomCode);
    }
  }, [initialRoomCode]);

  // Check for saved game state on mount
  useEffect(() => {
    const gameId = isOnlineMode ? `word-chain-online-${roomCode}` : 'word-chain-offline';
    const saved = loadGameState(gameId);
    
    if (saved && !gameStarted) {
      setSavedState(saved);
      setTimeRemaining(getTimeRemaining(gameId));
      setShowContinueDialog(true);
    }
  }, []); // Run only once on mount

  // Save game state whenever critical game state changes
  useEffect(() => {
    if (gameStarted && eliminated.length < players.length - 1) {
      const gameId = isOnlineMode ? `word-chain-online-${roomCode}` : 'word-chain-offline';
      const stateToSave = {
        gameMode,
        gameStarted,
        players,
        playerLives,
        usedWords,
        currentPlayer,
        eliminated,
        isOnlineMode,
        playerName,
        roomCode,
        isInRoom,
        isHost,
        myPlayerIndex,
      };
      
      saveGameState(gameId, stateToSave);
    }
  }, [gameStarted, currentPlayer, usedWords, playerLives, eliminated]);

  // Clear saved state when game ends
  useEffect(() => {
    if (eliminated.length >= players.length - 1) {
      const gameId = isOnlineMode ? `word-chain-online-${roomCode}` : 'word-chain-offline';
      clearGameState(gameId);
    }
  }, [eliminated, players, isOnlineMode, roomCode]);

  // Handlers for continue dialog
  const handleContinueGame = () => {
    if (savedState) {
      // Restore all game state
      setGameMode(savedState.gameMode);
      setGameStarted(savedState.gameStarted);
      setPlayers(savedState.players);
      setPlayerLives(savedState.playerLives);
      setUsedWords(savedState.usedWords);
      setCurrentPlayer(savedState.currentPlayer);
      setEliminated(savedState.eliminated);
      setIsOnlineMode(savedState.isOnlineMode);
      setPlayerName(savedState.playerName);
      setRoomCode(savedState.roomCode);
      setIsInRoom(savedState.isInRoom);
      setIsHost(savedState.isHost);
      setMyPlayerIndex(savedState.myPlayerIndex);
      
      // Navigate to play mode if needed
      if (onGameStart && !isPlayMode && savedState.gameStarted) {
        onGameStart();
      }
    }
    setShowContinueDialog(false);
    setSavedState(null);
  };

  const handleStartNewGame = () => {
    const gameId = isOnlineMode ? `word-chain-online-${roomCode}` : 'word-chain-offline';
    clearGameState(gameId);
    setShowContinueDialog(false);
    setSavedState(null);
  };

  // Extract room code from shared text
  const extractRoomCode = (text) => {
    // Check if text contains "Room code:" pattern
    const match = text.match(/Room code:\s*([A-Z0-9]{8})/i);
    if (match) {
      return match[1].toUpperCase();
    }
    // Otherwise, just clean up the text (remove spaces, take first 8 chars)
    const cleaned = text.replace(/\s/g, '').toUpperCase();
    return cleaned.substring(0, 8);
  };

  const lastLetter =
    usedWords.length === 0
      ? null
      : usedWords[usedWords.length - 1].slice(-1).toLowerCase();

  // Setup online game listeners
  useEffect(() => {
    if (!isOnlineMode || !isInRoom) return;

    console.log('🎮 Setting up online game listeners');

    // Handle errors
    const handleError = (errorMessage) => {
      console.log('❌ Error received:', errorMessage);
      setAlertMessage(errorMessage);
    };

    const handlePlayerJoined = (data) => {
      console.log('👋 Player joined:', data);
      const allPlayers = roomService.getConnectedPlayers();
      console.log('📋 All players after join:', allPlayers);
      setConnectedPlayers([...allPlayers]); // Force new array reference
    };

    const handlePlayerLeft = (data) => {
      console.log('👋 Player left:', data);
      const allPlayers = roomService.getConnectedPlayers();
      console.log('📋 All players after leave:', allPlayers);
      setConnectedPlayers([...allPlayers]); // Force new array reference
      
      // If we're in game and a player left, handle it
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
          
        case 'word-submit':
          handleRemoteWordSubmit(data.payload);
          break;
          
        case 'next-turn':
          setCurrentPlayer(data.payload.nextPlayerIndex);
          setError("");
          break;

        case 'player-eliminated':
          handleRemoteElimination(data.payload);
          break;
          
        case 'game-over':
          handleGameOver(data.payload);
          break;

        case 'restart-game':
          // Go back to waiting room for all players
          setGameStarted(false);
          setWaitingForPlayers(true);
          setPlayers(["", "", ""]);
          setPlayerLives({});
          setUsedWords([]);
          setCurrentPlayer(0);
          setInput("");
          setEliminated([]);
          setError("");
          setAlertMessage(data.payload.message);
          break;

        case 'new-game':
          resetGame();
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
      // Cleanup is handled in handleBackToMenu
    };
  }, [isOnlineMode, isInRoom]);

  // Separate effect for game-specific handlers
  useEffect(() => {
    if (!gameStarted) return;

    const handlePlayerLeft = (data) => {
      const allPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers([...allPlayers]);
      setAlertMessage(`${data.playerName || 'A player'} disconnected!`);
    };

    roomService.on('onPlayerLeft', handlePlayerLeft);
  }, [gameStarted]);

  function handlePlayerDisconnect(playerId) {
    const disconnectedPlayer = players.find((_, idx) => 
      connectedPlayers[idx]?.playerId === playerId
    );
    
    if (disconnectedPlayer && !eliminated.includes(disconnectedPlayer)) {
      setEliminated([...eliminated, disconnectedPlayer]);
    }
  }

  function handleGameStart(payload) {
    const { players: gamePlayers, lives } = payload;
    setPlayers(gamePlayers);
    setPlayerLives(lives);
    setGameStarted(true);
    setWaitingForPlayers(false);
    setCurrentPlayer(0);
    
    // Navigate to play URL for ad-free gameplay
    if (onGameStart && !isPlayMode) {
      onGameStart();
    }
  }

  function handleRemoteWordSubmit(payload) {
    const { word, success, error: errorMsg, playerLives: newLives, eliminated: newEliminated } = payload;
    
    if (success) {
      setUsedWords(prev => [...prev, word]);
      setError("");
    } else {
      setError(errorMsg);
      setPlayerLives(newLives);
      if (newEliminated) {
        setEliminated(prev => [...prev, newEliminated]);
      }
    }
  }

  function handleRemoteElimination(payload) {
    const { playerName } = payload;
    setEliminated(prev => [...prev, playerName]);
  }

  function handleGameOver(payload) {
    const { winner } = payload;
    setAlertMessage(`🏆 ${winner} wins!`);
  }

  async function handleCreateOnlineRoom() {
    if (!playerName.trim()) {
      setAlertMessage("Please enter your name!");
      return;
    }

    try {
      roomService.on('onPlayerJoined', (data) => {
        console.log('🎉 Player joined callback:', data);
        const allPlayers = roomService.getConnectedPlayers();
        setConnectedPlayers(allPlayers);
      });

      roomService.on('onPlayerLeft', (data) => {
        const allPlayers = roomService.getConnectedPlayers();
        setConnectedPlayers(allPlayers);
      });

      roomService.on('onGameAction', (data) => {
        console.log('Game action received:', data);
        
        switch (data.action) {
          case 'game-start':
            handleGameStart(data.payload);
            break;
            
          case 'word-submit':
            handleRemoteWordSubmit(data.payload);
            break;
            
          case 'next-turn':
            setCurrentPlayer(data.payload.nextPlayerIndex);
            setError("");
            break;

          case 'player-eliminated':
            handleRemoteElimination(data.payload);
            break;
            
          case 'game-over':
            handleGameOver(data.payload);
            break;

          case 'new-game':
            resetGame();
            break;
        }
      });

      roomService.playerName = playerName;
      const { roomCode: code } = await roomService.createRoom();
      setRoomCode(code);
      setIsHost(true);
      setIsInRoom(true);
      setWaitingForPlayers(true);
      const allPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers(allPlayers);
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
      roomService.on('onPlayerJoined', (data) => {
        console.log('🎉 Player joined callback:', data);
        const allPlayers = roomService.getConnectedPlayers();
        setConnectedPlayers(allPlayers);
      });

      roomService.on('onPlayerLeft', (data) => {
        const allPlayers = roomService.getConnectedPlayers();
        setConnectedPlayers(allPlayers);
      });

      roomService.on('onGameAction', (data) => {
        console.log('Game action received:', data);
        
        switch (data.action) {
          case 'game-start':
            handleGameStart(data.payload);
            break;
            
          case 'word-submit':
            handleRemoteWordSubmit(data.payload);
            break;
            
          case 'next-turn':
            setCurrentPlayer(data.payload.nextPlayerIndex);
            setError("");
            break;

          case 'player-eliminated':
            handleRemoteElimination(data.payload);
            break;
            
          case 'game-over':
            handleGameOver(data.payload);
            break;

          case 'new-game':
            resetGame();
            break;
        }
      });

      roomService.playerName = playerName;
      await roomService.joinRoom(roomCode);
      setIsInRoom(true);
      setIsHost(false);
      setWaitingForPlayers(true);
      const allPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers(allPlayers);
      
      // Set player index based on order joined
      setMyPlayerIndex(allPlayers.length - 1);
    } catch (error) {
      console.error('Error joining room:', error);
      setAlertMessage('Failed to join room. Check the room code and try again.');
    }
  }

  function handleStartOnlineGame() {
    if (connectedPlayers.length < 2) {
      setAlertMessage("Need at least 2 players to start!");
      return;
    }

    if (connectedPlayers.length > 12) {
      setAlertMessage("Maximum 12 players allowed!");
      return;
    }

    // Initialize game state
    const playerNames = connectedPlayers.map(p => p.playerName);
    const lives = {};
    playerNames.forEach(name => {
      lives[name] = 3;
    });

    // Broadcast game start to all players
    roomService.sendGameAction('game-start', {
      players: playerNames,
      lives: lives
    });

    // Start game locally for host
    setPlayers(playerNames);
    setPlayerLives(lives);
    setGameStarted(true);
    setWaitingForPlayers(false);
    setCurrentPlayer(0);
    setMyPlayerIndex(0); // Host is always first player
    
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
    setPlayers(["", "", ""]);
    setPlayerLives({});
    setUsedWords([]);
    setCurrentPlayer(0);
    setInput("");
    setEliminated([]);
    setError("");
    setConnectedPlayers([]);
  }

  function handlePlayerNameChange(index, value) {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  }

  function addPlayer() {
    setPlayers([...players, ""]);
  }

  function removePlayer(index) {
    if (players.length > 2) {
      const newPlayers = players.filter((_, i) => i !== index);
      setPlayers(newPlayers);
    }
  }

  function startGame() {
    const validPlayers = players.filter(name => name.trim() !== "");
    if (validPlayers.length < 2) {
      setAlertMessage("Please enter at least 2 player names!");
      return;
    }
    setPlayers(validPlayers);
    
    // Initialize lives for each player
    const lives = {};
    validPlayers.forEach(player => {
      lives[player] = 3;
    });
    setPlayerLives(lives);
    
    setGameStarted(true);
    
    // Navigate to play URL for ad-free gameplay
    if (onGameStart && !isPlayMode) {
      onGameStart();
    }
  }

  function resetGame() {
    if (isOnlineMode) {
      // For online mode, broadcast game restart and go back to waiting room
      if (isHost) {
        roomService.sendGameAction('restart-game', {
          message: 'Host is restarting the game'
        });
      }
      // Reset to waiting room state
      setGameStarted(false);
      setWaitingForPlayers(true);
      setPlayers(["", "", ""]);
      setPlayerLives({});
      setUsedWords([]);
      setCurrentPlayer(0);
      setInput("");
      setEliminated([]);
      setError("");
    } else {
      // Local mode - full reset
      setGameStarted(false);
      setPlayers(["", "", ""]);
      setPlayerLives({});
      setUsedWords([]);
      setCurrentPlayer(0);
      setInput("");
      setEliminated([]);
      setError("");
    }
  }

  async function validateWord(word) {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      return response.ok;
    } catch (error) {
      console.error("Error validating word:", error);
      // If API fails, allow the word to continue game flow
      return true;
    }
  }

  async function submitWord() {
    const word = input.toLowerCase().trim();

    // Online mode: check if it's player's turn
    if (isOnlineMode && players[currentPlayer] !== playerName) {
      setAlertMessage("Wait for your turn!");
      return;
    }

    if (!word) {
      setError("Please enter a word");
      return;
    }

    if (word.length < 2) {
      setError("Word must be at least 2 letters");
      return;
    }

    if (!/^[a-z]+$/.test(word)) {
      setError("Only letters allowed");
      return;
    }

    if (usedWords.includes(word)) {
      const errorMsg = `"${word}" has already been used!`;
      setError(errorMsg);
      
      if (isOnlineMode) {
        // Broadcast word rejection and life loss
        await eliminateOnline(errorMsg);
      } else {
        eliminate();
      }
      return;
    }

    if (lastLetter && word[0] !== lastLetter) {
      const errorMsg = `Word must start with "${lastLetter.toUpperCase()}"!`;
      setError(errorMsg);
      
      if (isOnlineMode) {
        await eliminateOnline(errorMsg);
      } else {
        eliminate();
      }
      return;
    }

    // Validate if it's a real word
    setIsValidating(true);
    const isValid = await validateWord(word);
    setIsValidating(false);

    if (!isValid) {
      const errorMsg = `"${word}" is not a valid English word!`;
      setError(errorMsg);
      
      if (isOnlineMode) {
        await eliminateOnline(errorMsg);
      } else {
        eliminate();
      }
      return;
    }

    // Word is valid!
    if (isOnlineMode) {
      // Broadcast word to all players
      roomService.sendGameAction('word-submit', {
        word,
        success: true,
        playerName: players[currentPlayer]
      });
    }

    setUsedWords([...usedWords, word]);
    setError("");
    
    // Move to next player
    if (isOnlineMode) {
      const nextPlayerIndex = getNextPlayerIndex();
      roomService.sendGameAction('next-turn', {
        nextPlayerIndex
      });
      setCurrentPlayer(nextPlayerIndex);
    } else {
      nextPlayer();
    }
    
    setInput("");
  }

  async function eliminateOnline(errorMsg) {
    const playerName = players[currentPlayer];
    const currentLives = playerLives[playerName];
    
    if (currentLives > 1) {
      // Lose a life
      const newLives = {
        ...playerLives,
        [playerName]: currentLives - 1
      };
      setPlayerLives(newLives);
      
      // Broadcast life loss
      roomService.sendGameAction('word-submit', {
        word: input,
        success: false,
        error: errorMsg,
        playerLives: newLives,
        playerName
      });
      
      setTimeout(() => {
        setError("");
        const nextPlayerIndex = getNextPlayerIndex();
        roomService.sendGameAction('next-turn', { nextPlayerIndex });
        setCurrentPlayer(nextPlayerIndex);
        setInput("");
      }, 2000);
    } else {
      // Eliminate player
      const newEliminated = [...eliminated, playerName];
      setEliminated(newEliminated);
      
      const newLives = {
        ...playerLives,
        [playerName]: 0
      };
      setPlayerLives(newLives);
      
      // Broadcast elimination
      roomService.sendGameAction('player-eliminated', {
        playerName
      });
      
      roomService.sendGameAction('word-submit', {
        word: input,
        success: false,
        error: errorMsg,
        playerLives: newLives,
        eliminated: playerName
      });
      
      // Check if game is over
      const activePlayers = players.filter(p => !newEliminated.includes(p));
      if (activePlayers.length === 1) {
        roomService.sendGameAction('game-over', {
          winner: activePlayers[0]
        });
      }
      
      setTimeout(() => {
        setError("");
        const nextPlayerIndex = getNextPlayerIndex();
        roomService.sendGameAction('next-turn', { nextPlayerIndex });
        setCurrentPlayer(nextPlayerIndex);
        setInput("");
      }, 2000);
    }
  }

  function getNextPlayerIndex() {
    let next = (currentPlayer + 1) % players.length;
    let attempts = 0;
    while (eliminated.includes(players[next]) && attempts < players.length) {
      next = (next + 1) % players.length;
      attempts++;
    }
    return next;
  }

  function eliminate() {
    const playerName = players[currentPlayer];
    const currentLives = playerLives[playerName];
    
    if (currentLives > 1) {
      // Lose a life
      setPlayerLives({
        ...playerLives,
        [playerName]: currentLives - 1
      });
      
      setTimeout(() => {
        setError("");
        nextPlayer();
        setInput("");
      }, 2000);
    } else {
      // Eliminate player
      setEliminated([...eliminated, playerName]);
      setPlayerLives({
        ...playerLives,
        [playerName]: 0
      });
      
      setTimeout(() => {
        setError("");
        nextPlayer();
        setInput("");
      }, 2000);
    }
  }

  function nextPlayer() {
    let next = (currentPlayer + 1) % players.length;
    let attempts = 0;
    while (eliminated.includes(players[next]) && attempts < players.length) {
      next = (next + 1) % players.length;
      attempts++;
    }
    setCurrentPlayer(next);
  }

  const activePlayers = players.filter(
    (p) => !eliminated.includes(p)
  );

  // Mode Selection Screen
  if (!gameMode) {
    return (
      <GameLayout title="🔤 Word Chain - Select Mode" onBack={onBack}>
        {alertMessage && (
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>
            Choose how you want to play Word Chain
          </p>

          <GameModeSelector
            onSelectLocal={() => {
              setGameMode('local');
              setIsOnlineMode(false);
            }}
            onSelectOnline={() => {
              setGameMode('online');
              setIsOnlineMode(true);
            }}
            localLabel="Local Play"
            onlineLabel="Online Multiplayer"
            maxPlayers="2-12 players"
          />
        </div>
      </GameLayout>
    );
  }

  // Online Room Setup Screen
  if (gameMode === 'online' && !isInRoom) {
    return (
      <GameLayout title="🔤 Word Chain - Online Setup" onBack={handleBackToMenu}>
        {alertMessage && (
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>
            Create a room or join an existing one to play online (2-12 players)
          </p>

          <OnlineRoomSetup
            playerName={playerName}
            setPlayerName={setPlayerName}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            onCreateRoom={handleCreateOnlineRoom}
            onJoinRoom={handleJoinOnlineRoom}
            extractRoomCode={extractRoomCode}
            hideCreateRoom={!!initialRoomCode}
          />
        </div>
      </GameLayout>
    );
  }

  // Online Waiting Room
  if (isOnlineMode && isInRoom && waitingForPlayers) {
    return (
      <GameLayout title="🔤 Word Chain - Waiting Room" onBack={handleBackToMenu}>
        {alertMessage && (
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
        <OnlineRoomExample
          roomCode={roomCode}
          connectedPlayers={connectedPlayers}
          maxPlayers={12}
          isHost={isHost}
          onStartGame={handleStartOnlineGame}
          minPlayers={2}
          gameUrl={`${window.location.origin}/games/word-chain?room=${roomCode}`}
        />
      </GameLayout>
    );
  }

  // Local Player Setup Screen
  if (gameMode === 'local' && !gameStarted) {
    return (
      <GameLayout title="🔤 Word Chain - Player Setup" onBack={handleBackToMenu}>
        {alertMessage && (
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>
            Enter player names to begin. Each player will take turns creating a word chain!
          </p>

          <GameRules rules={gameRules} />
          
          <PlayerNameInput
            players={players}
            onPlayerChange={handlePlayerNameChange}
            onAddPlayer={addPlayer}
            onRemovePlayer={removePlayer}
            minPlayers={2}
          />

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

  // Game Screen
  return (
    <GameLayout
      title={`🔤 Word Chain ${isOnlineMode ? '(Online)' : ''}`}
      currentPlayer={players[currentPlayer]}
      onBack={handleBackToMenu}
    >
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
      
      {activePlayers.length > 1 ? (
        <>
          {/* Online Room Info */}
          {isOnlineMode && (
            <div className={styles.onlineInfo}>
              <span>Room: {roomCode}</span>
              <span>Players: {connectedPlayers.length}</span>
            </div>
          )}

          <GameRules 
            rules="Say a word starting with the last letter of the previous word. Don't repeat words or you'll lose a life! (3 lives total)" 
            compact={true} 
          />

          <div className={styles.gameInfo}>
            <p>
              Current Player: <span className={styles.currentPlayerBadge}>{players[currentPlayer]}</span>
            </p>
            <p className={styles.letterHint}>
              {lastLetter ? (
                <>
                  Next word must start with: <span className={styles.letterHighlight}>{lastLetter.toUpperCase()}</span>
                </>
              ) : (
                "Start with any word!"
              )}
            </p>
          </div>

          {/* Show lifeline indicators only for players who have lost lives */}
          <div className={styles.playersLifelineSection}>
            {players.filter(player => !eliminated.includes(player) && playerLives[player] < 3).map(player => (
              <div key={player} className={styles.playerLifeline}>
                <span className={styles.playerLifelineName}>{player}:</span>
                <div className={styles.hearts}>
                  {[...Array(3)].map((_, i) => (
                    <span 
                      key={i} 
                      className={i < playerLives[player] ? styles.heartFull : styles.heartEmpty}
                    >
                      {i < playerLives[player] ? '❤️' : '🖤'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.wordInput}>
            <input
              value={input}
              onChange={(e) => {
                // In online mode, prevent non-turn players from typing
                if (isOnlineMode && players[currentPlayer] !== playerName) {
                  setAlertMessage("⏳ Wait for your turn!");
                  return;
                }
                setInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isValidating) submitWord();
              }}
              placeholder={
                isOnlineMode && players[currentPlayer] !== playerName
                  ? "Waiting for your turn..."
                  : "Enter word"
              }
              className={inputStyles.input}
              disabled={isValidating || (isOnlineMode && players[currentPlayer] !== playerName)}
              style={{ 
                flex: 1, 
                maxWidth: '400px',
                cursor: isOnlineMode && players[currentPlayer] !== playerName ? 'not-allowed' : 'text'
              }}
            />
            <button 
              onClick={submitWord} 
              className={`${btnStyles.btn} ${btnStyles.btnPrimary}`}
              disabled={isValidating || (isOnlineMode && players[currentPlayer] !== playerName)}
            >
              {isValidating ? "Validating..." : "Submit"}
            </button>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              ❌ {error}
            </div>
          )}

          <div className={styles.wordChain}>
            <p className={styles.wordChainTitle}>Used Words:</p>
            <p className={styles.wordList}>
              {usedWords.length > 0 ? usedWords.join(" → ") : "None yet"}
            </p>
          </div>

          {eliminated.length > 0 && (
            <div className={styles.eliminatedList}>
              <strong>Eliminated:</strong> {eliminated.join(", ")}
            </div>
          )}
        </>
      ) : (
        <div className={styles.winnerCard}>
          <h2 className={styles.winnerTitle}>🏆 Winner: {activePlayers[0]}</h2>
          {(!isOnlineMode || isHost) && (
            <button 
              onClick={resetGame} 
              className={`${btnStyles.btn} ${btnStyles.btnSuccess} ${btnStyles.btnLarge}`}
            >
              Play Again
            </button>
          )}
          {isOnlineMode && !isHost && (
            <p>Waiting for host to start new game...</p>
          )}
        </div>
      )}
    </GameLayout>
  );
}

export default WordChain;
