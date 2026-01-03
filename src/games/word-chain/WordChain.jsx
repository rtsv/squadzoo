import { useState, useEffect } from "react";
import GameLayout from "../../layout/GameLayout";
import CustomAlert from "../../components/CustomAlert";
import roomService from "../../services/roomService";
import styles from "../../styles/WordChain.module.css";
import btnStyles from "../../styles/Button.module.css";
import inputStyles from "../../styles/Input.module.css";

function WordChain({ onBack }) {
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

          <div className={styles.modeSelection}>
            <button
              onClick={() => {
                setGameMode('local');
                setIsOnlineMode(false);
              }}
              className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`}
            >
              👥 Local Play
              <small style={{ display: 'block', fontSize: '0.8em', marginTop: '5px' }}>
                Play with people next to you
              </small>
            </button>

            <button
              onClick={() => {
                setGameMode('online');
                setIsOnlineMode(true);
              }}
              className={`${btnStyles.btn} ${btnStyles.btnSuccess} ${btnStyles.btnLarge}`}
            >
              🌐 Online Multiplayer (2-12 players)
              <small style={{ display: 'block', fontSize: '0.8em', marginTop: '5px' }}>
                Play with friends remotely
              </small>
            </button>
          </div>
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

          <div className={styles.playerInputRow}>
            <span className={styles.playerLabel}>Your Name:</span>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className={inputStyles.input}
              style={{ flex: 1 }}
            />
          </div>

          <div className={styles.onlineOptions}>
            <div className={styles.onlineOption}>
              <h3>Create Room</h3>
              <p>Start a new game and share the 8-character room code</p>
              <button
                onClick={handleCreateOnlineRoom}
                className={`${btnStyles.btn} ${btnStyles.btnPrimary}`}
              >
                Create Room
              </button>
            </div>

            <div className={styles.divider}>OR</div>

            <div className={styles.onlineOption}>
              <h3>Join Room</h3>
              <p>Enter the 8-character room code shared by your friend</p>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().trim())}
                placeholder="Enter 8-char code"
                className={inputStyles.input}
                maxLength={8}
                style={{ 
                  marginBottom: '10px', 
                  fontFamily: 'monospace', 
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}
              />
              <button
                onClick={handleJoinOnlineRoom}
                className={`${btnStyles.btn} ${btnStyles.btnSuccess}`}
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      </GameLayout>
    );
  }

  // Online Waiting Room
  if (isOnlineMode && isInRoom && waitingForPlayers) {
    const copyRoomCode = () => {
      navigator.clipboard.writeText(roomCode).then(() => {
        setShowCopiedNotification(true);
        setTimeout(() => setShowCopiedNotification(false), 2000);
      }).catch(() => {
        setAlertMessage("Failed to copy. Please copy manually.");
      });
    };

    return (
      <GameLayout title="🔤 Word Chain - Waiting Room" onBack={handleBackToMenu}>
        {showCopiedNotification && (
          <div className={styles.copiedNotification}>
            ✓ Copied!
          </div>
        )}
        {alertMessage && (
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
        <div className={styles.setupContainer}>
          <div className={styles.waitingRoom}>
            <h2>Share Room Code</h2>
            <div className={styles.roomCodeDisplay}>
              <code className={styles.roomCodeText}>{roomCode}</code>
              <button 
                onClick={copyRoomCode}
                className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${btnStyles.btnSmall}`}
              >
                📋 Copy
              </button>
            </div>
            <p className={styles.shareCode}>Share this code with your friends to join (2-12 players)</p>
            
            <div className={styles.playersList}>
              <h3>Players in Room ({connectedPlayers.length}/12):</h3>
              <div className={styles.playersGrid}>
                {connectedPlayers.map((player, idx) => (
                  <div key={idx} className={styles.playerItem}>
                    👤 {player.playerName} {player.isHost && "👑"}
                  </div>
                ))}
              </div>
            </div>

            {connectedPlayers.length < 2 && (
              <div className={styles.waitingAnimation}>
                <p>⏳ Waiting for at least 1 more player to join...</p>
              </div>
            )}

            {isHost && connectedPlayers.length >= 2 && (
              <div className={styles.startGameSection}>
                <button
                  onClick={handleStartOnlineGame}
                  className={`${btnStyles.btn} ${btnStyles.btnSuccess} ${btnStyles.btnLarge}`}
                >
                  Start Game ({connectedPlayers.length} players)
                </button>
              </div>
            )}

            {!isHost && connectedPlayers.length >= 2 && (
              <div className={styles.waitingAnimation}>
                <p>⏳ Waiting for host to start the game...</p>
              </div>
            )}
          </div>
        </div>
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

          {/* Game Rules */}
          <div className={styles.rulesSection}>
            <button
              onClick={() => setShowRules(!showRules)}
              className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${btnStyles.btnSmall}`}
            >
              📖 {showRules ? "Hide Rules" : "Show Rules"}
            </button>
            {showRules && (
              <div className={styles.rulesContent}>
                <h4>How to Play:</h4>
                <ul>
                  <li>Each player starts with 3 lives (hearts)</li>
                  <li>Take turns saying a valid English word</li>
                  <li>Each word must start with the last letter of the previous word</li>
                  <li>Example: CAT → TABLE → EGG → GAME</li>
                  <li>You cannot reuse a word that's already been used</li>
                  <li>Words must be at least 2 letters long and contain only letters</li>
                  <li>Lose a life for: wrong starting letter, invalid word, or repeated word</li>
                  <li>Last player standing wins!</li>
                </ul>
              </div>
            )}
          </div>
          
          {players.map((player, index) => (
            <div key={index} className={styles.playerInputRow}>
              <span className={styles.playerLabel}>
                Player {index + 1}:
              </span>
              <input
                type="text"
                value={player}
                onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                placeholder="Enter name"
                className={inputStyles.input}
                style={{ flex: 1 }}
              />
              {players.length > 2 && (
                <button 
                  onClick={() => removePlayer(index)}
                  className={`${btnStyles.btn} ${btnStyles.btnDanger} ${btnStyles.btnSmall}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <div className={styles.setupButtons}>
            <button 
              onClick={addPlayer}
              className={`${btnStyles.btn} ${btnStyles.btnSuccess}`}
            >
              + Add Player
            </button>
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
      {activePlayers.length > 1 ? (
        <>
          {/* Online Room Info */}
          {isOnlineMode && (
            <div className={styles.onlineInfo}>
              <span>Room: {roomCode}</span>
              <span>Players: {connectedPlayers.length}</span>
            </div>
          )}

          {/* Game Rules Toggle */}
          <div className={styles.rulesToggle}>
            <button
              onClick={() => setShowRules(!showRules)}
              className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${btnStyles.btnSmall}`}
            >
              📖 {showRules ? "Hide" : "Rules"}
            </button>
            {showRules && (
              <div className={styles.rulesContentSmall}>
                <strong>Rules:</strong> Say a word starting with the last letter of the previous word. 
                Don't repeat words or you'll lose a life! (3 lives total)
              </div>
            )}
          </div>

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
