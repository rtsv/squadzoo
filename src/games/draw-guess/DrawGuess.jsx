import { useState, useEffect } from "react";
import GameLayout from "../../layout/GameLayout";
import CustomAlert from "../../components/CustomAlert";
import GameModeSelector from "../../components/GameModeSelector";
import OnlineRoomSetup from "../../components/OnlineRoomSetup";
import OnlineRoomExample from "../../components/OnlineRoomExample";
import DrawingCanvas from "./DrawingCanvas";
import { wordsByDifficulty } from "./wordList";
import roomService from "../../services/roomService";
import styles from "../../styles/DrawGuess.module.css";
import btnStyles from "../../styles/Button.module.css";
import inputStyles from "../../styles/Input.module.css";

function DrawGuess({ onBack, initialRoomCode }) {
  // Game mode states
  const [gameMode, setGameMode] = useState(null); // null, 'local', 'online'
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState(["", "", ""]);
  
  // Online multiplayer states
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  
  // Game states
  const [difficulty, setDifficulty] = useState("medium");
  const [timeLimit, setTimeLimit] = useState(60);
  const [drawerIndex, setDrawerIndex] = useState(0);
  const [secretWord, setSecretWord] = useState("");
  const [guesses, setGuesses] = useState({});
  const [scores, setScores] = useState({});
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [roundWinner, setRoundWinner] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Auto-join room from URL
  useEffect(() => {
    if (initialRoomCode && !gameMode && !isInRoom) {
      setGameMode('online');
      setIsOnlineMode(true);
      setRoomCode(initialRoomCode.toUpperCase().trim());
    }
  }, [initialRoomCode]);

  // Setup online game listeners
  useEffect(() => {
    if (!isOnlineMode || !isInRoom) return;

    roomService.on('onError', (errorMessage) => {
      setAlertMessage(errorMessage);
    });

    roomService.on('onPlayerJoined', (data) => {
      console.log('Player joined:', data);
      const allPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers(allPlayers);
    });

    roomService.on('onPlayerLeft', () => {
      setAlertMessage("A player disconnected!");
      setTimeout(() => {
        handleBackToMenu();
      }, 2000);
    });

    roomService.on('onGameAction', (data) => {
      console.log('Game action received:', data);
      
      switch (data.action) {
        case 'start-game':
          const playerNames = data.payload.players;
          setPlayers(playerNames);
          setWaitingForPlayers(false);
          setGameStarted(true);
          const initialScores = {};
          playerNames.forEach(player => {
            initialScores[player] = 0;
          });
          setScores(initialScores);
          startNewRound(playerNames);
          break;
          
        case 'submit-guess':
          handleRemoteGuess(data.payload);
          break;
          
        case 'next-round':
          nextRound();
          break;

        case 'use-hint':
          setHintsUsed(data.payload.hintsUsed);
          setShowHint(true);
          break;
      }
    });

    return () => {
      if (roomService.isConnected()) {
        roomService.leaveRoom();
      }
    };
  }, [isOnlineMode, isHost, isInRoom]);

  // Timer effect
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !roundWinner) {
      endRound(null);
    }
  }, [timerActive, timeLeft, roundWinner]);

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
    const initialScores = {};
    validPlayers.forEach(player => {
      initialScores[player] = 0;
    });
    setScores(initialScores);
    setGameStarted(true);
    startNewRound(validPlayers);
  }

  function startNewRound(playerList = players) {
    const words = wordsByDifficulty[difficulty];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setSecretWord(randomWord);
    setGuesses({});
    setRoundWinner(null);
    setTimeLeft(timeLimit);
    setTimerActive(true);
    setHintsUsed(0);
    setShowHint(false);
    setCanvasKey(prev => prev + 1);
  }

  function updateGuess(player, value) {
    setGuesses({ ...guesses, [player]: value });
  }

  function submitGuess(player) {
    const guess = guesses[player] || "";
    if (guess.toLowerCase().trim() === secretWord.toLowerCase()) {
      endRound(player);
    } else {
      setGuesses({ ...guesses, [player]: "" });
    }
  }

  function endRound(winner) {
    setTimerActive(false);
    setRoundWinner(winner);
    
    if (winner) {
      const timeBonus = Math.floor(timeLeft / 10);
      const hintPenalty = hintsUsed * 5;
      const points = Math.max(10, 30 + timeBonus - hintPenalty);
      
      setScores({
        ...scores,
        [winner]: (scores[winner] || 0) + points
      });
    }
  }

  function nextRound() {
    const nextDrawerIndex = (drawerIndex + 1) % players.length;
    setDrawerIndex(nextDrawerIndex);
    setRound(round + 1);
    startNewRound();
  }

  function resetGame() {
    setGameStarted(false);
    setPlayers(["", "", ""]);
    setDifficulty("medium");
    setDrawerIndex(0);
    setRound(1);
    setScores({});
  }

  function useHint() {
    if (hintsUsed < 2) {
      setHintsUsed(hintsUsed + 1);
      setShowHint(true);
    }
  }

  function getHintText() {
    if (hintsUsed === 1) {
      return `Word length: ${secretWord.length} letters`;
    } else if (hintsUsed === 2) {
      return `First letter: ${secretWord[0].toUpperCase()}`;
    }
    return "";
  }

  // Online multiplayer functions
  async function handleCreateOnlineRoom() {
    if (!playerName.trim()) {
      setAlertMessage("Please enter your name!");
      return;
    }

    try {
      roomService.on('onConnected', (data) => {
        console.log('Connected to room:', data);
        const allPlayers = roomService.getConnectedPlayers();
        setConnectedPlayers(allPlayers);
      });

      roomService.on('onPlayerJoined', (data) => {
        const allPlayers = roomService.getConnectedPlayers();
        setConnectedPlayers(allPlayers);
      });

      roomService.playerName = playerName;
      const { roomCode: code } = await roomService.createRoom();
      setRoomCode(code);
      setIsHost(true);
      setIsInRoom(true);
      setWaitingForPlayers(true);
      
      setTimeout(() => {
        const allPlayers = roomService.getConnectedPlayers();
        setConnectedPlayers(allPlayers);
      }, 100);
      
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
      roomService.on('onConnected', (data) => {
        console.log('Connected to room:', data);
        const allPlayers = roomService.getConnectedPlayers();
        setConnectedPlayers(allPlayers);
      });

      roomService.on('onPlayerJoined', (data) => {
        const allPlayers = roomService.getConnectedPlayers();
        setConnectedPlayers(allPlayers);
      });

      roomService.playerName = playerName;
      await roomService.joinRoom(roomCode);
      setIsInRoom(true);
      setIsHost(false);
      setWaitingForPlayers(true);
      
      setTimeout(() => {
        const allPlayers = roomService.getConnectedPlayers();
        setConnectedPlayers(allPlayers);
      }, 100);
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

    const playerNames = connectedPlayers.map(p => p.playerName);
    setPlayers(playerNames);
    setWaitingForPlayers(false);
    setGameStarted(true);
    
    const initialScores = {};
    playerNames.forEach(player => {
      initialScores[player] = 0;
    });
    setScores(initialScores);
    
    // Notify all players to start
    roomService.sendGameAction('start-game', { players: playerNames });
    startNewRound(playerNames);
  }

  function handleRemoteGuess(payload) {
    const { playerName, guess, isCorrect } = payload;
    if (isCorrect) {
      endRound(playerName);
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
    setScores({});
    setRound(1);
  }

  const currentDrawer = players[drawerIndex];
  const guessers = players.filter((_, i) => i !== drawerIndex);

  // Mode Selection Screen
  if (!gameMode) {
    return (
      <GameLayout title="🎨 Draw & Guess - Select Mode" onBack={onBack}>
        {alertMessage && (
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>
            Choose how you want to play Draw & Guess
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
          />
        </div>
      </GameLayout>
    );
  }

  // Online Room Setup Screen
  if (gameMode === 'online' && !isInRoom) {
    return (
      <GameLayout title="🎨 Draw & Guess - Online Setup" onBack={handleBackToMenu}>
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
          />
        </div>
      </GameLayout>
    );
  }

  // Online Waiting Room
  if (isOnlineMode && isInRoom && waitingForPlayers) {
    return (
      <GameLayout title="🎨 Draw & Guess - Waiting Room" onBack={handleBackToMenu}>
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
          gameUrl={`${window.location.origin}/games/draw-guess?room=${roomCode}`}
        />
      </GameLayout>
    );
  }

  // Player Setup Screen (Local mode)
  if (gameMode === 'local' && !gameStarted) {
    return (
      <GameLayout title="🎨 Draw & Guess - Setup" onBack={handleBackToMenu}>
        {alertMessage && (
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>
            Enter player names and choose difficulty. One player draws while others guess!
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
                  <li>One player draws a secret word while others guess</li>
                  <li>The drawer sees the word and must draw it (no letters/numbers!)</li>
                  <li>Guessers type their answers and submit</li>
                  <li>First to guess correctly wins points!</li>
                  <li>Points: Base 30 + Time bonus - Hint penalty</li>
                  <li>Use hints (💡) to reveal word length or first letter (-5 pts each)</li>
                  <li>Players take turns being the drawer each round</li>
                </ul>
              </div>
            )}
          </div>

          {/* Difficulty Section - Full Width */}
          <div className={styles.difficultySection}>
            <label className={styles.difficultyLabel}>Difficulty:</label>
            <div className={styles.difficultyButtons}>
              {["easy", "medium", "hard"].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`${btnStyles.btn} ${
                    difficulty === level ? btnStyles.btnPrimary : btnStyles.btnSecondary
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Time Limit and Players Side by Side */}
          <div className={styles.setupMainRow}>
            {/* Time Limit Section */}
            <div className={styles.timeLimitSection}>
              <label className={styles.timeLimitLabel}>Time Limit:</label>
              <div className={styles.timeLimitControls}>
                <button
                  onClick={() => setTimeLimit(Math.max(30, timeLimit - 30))}
                  disabled={timeLimit <= 30}
                  className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${styles.timeLimitBtn}`}
                  title="Decrease time"
                >
                  −
                </button>
                <div className={styles.timeLimitDisplay}>
                  <span className={styles.timeLimitValue}>{timeLimit}</span>
                  <span className={styles.timeLimitUnit}>sec</span>
                </div>
                <button
                  onClick={() => setTimeLimit(Math.min(180, timeLimit + 30))}
                  disabled={timeLimit >= 180}
                  className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${styles.timeLimitBtn}`}
                  title="Increase time"
                >
                  +
                </button>
              </div>
            </div>

            {/* Players Section */}
            <div className={styles.playersSection}>
              <label className={styles.playersLabel}>Players:</label>
              <div className={styles.playersInputs}>
                {players.map((player, index) => (
                  <div key={index} className={styles.playerInputRow}>
                    <span className={styles.playerLabel}>Player {index + 1}:</span>
                    <input
                      type="text"
                      value={player}
                      onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                      placeholder="Enter name"
                      className={inputStyles.input}
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
              </div>
            </div>
          </div>

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
      title={`🎨 Draw & Guess - Round ${round}${isOnlineMode ? ' (Online)' : ''}`}
      currentPlayer={currentDrawer}
      onBack={isOnlineMode ? handleBackToMenu : onBack}
    >
      <div className={styles.gameContainer}>
        {/* Online Room Info */}
        {isOnlineMode && (
          <div className={styles.onlineInfo}>
            <span>Room: {roomCode}</span>
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
              <strong>Tip:</strong> Drawer - draw the word! Guessers - type and submit your guess. Use hints if needed!
            </div>
          )}
        </div>

        {/* Top Bar - Scoreboard with Timer and Drawer Info (100% width) */}
        <div className={styles.topBar}>
          <div className={styles.scoreboard}>
            <h3 className={styles.scoreboardTitle}>Scores</h3>
            <div className={styles.scoreList}>
              {players.map((player) => (
                <div key={player} className={styles.scoreItem}>
                  <span className={styles.playerName}>{player}</span>
                  <span className={styles.playerScore}>{scores[player] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.gameInfoBar}>
            <div className={`${styles.timer} ${timeLeft <= 10 ? styles.timerWarning : ""}`}>
              ⏱️ {timeLeft}s
            </div>
            <div className={styles.drawerInfo}>
              <span className={styles.drawerLabel}>Drawer</span>
              <span className={styles.drawerName}>{currentDrawer}</span>
            </div>
          </div>
        </div>

        {/* Main Content - Canvas (50%) and Controls (50%) Side by Side */}
        <div className={styles.mainContent}>
          {/* Left Column - Canvas (50%) */}
          <div className={styles.leftColumn}>
            <div className={styles.canvasContainer}>
              <DrawingCanvas key={canvasKey} isDrawer={true} />
            </div>
          </div>

          {/* Right Column - Secret Word, Hints, Drawing Tools (50%) */}
          <div className={styles.rightColumn}>
            <div className={styles.secretWordSection}>
              <p className={styles.secretWordLabel}>
                <span className={styles.drawerName}>{currentDrawer}</span>, draw this word:
              </p>
              <div className={styles.secretWord}>{secretWord}</div>
            </div>

            {!roundWinner && (
              <div className={styles.hintSection}>
                <button
                  onClick={useHint}
                  disabled={hintsUsed >= 2}
                  className={`${btnStyles.btn} ${btnStyles.btnWarning} ${btnStyles.btnSmall}`}
                >
                  💡 Use Hint ({2 - hintsUsed} left) - (-5 pts)
                </button>
                {showHint && (
                  <div className={styles.hintText}>
                    {getHintText()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Results and Guessers */}
        <div className={styles.bottomSection}>
          {/* Guessing Section */}
          {!roundWinner && timeLeft !== 0 && (
            <div className={styles.guessersSection}>
              <h3 className={styles.guessersSectionTitle}>Guessers</h3>
              {guessers.map((player) => (
                <div key={player} className={styles.guessRow}>
                  <span className={styles.guesserLabel}>{player}</span>
                  <div className={styles.guessInputRow}>
                    <input
                      value={guesses[player] || ""}
                      onChange={(e) => updateGuess(player, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitGuess(player);
                      }}
                      placeholder="Type your guess..."
                      className={inputStyles.input}
                    />
                    <button
                      onClick={() => submitGuess(player)}
                      className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnSmall}`}
                    >
                      Guess
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Winner Card */}
          {roundWinner && (
            <div className={styles.winnerCard}>
              <div className={styles.winnerText}>
                🎉 {roundWinner} guessed correctly!
              </div>
              <div className={styles.winnerDetails}>
                <p>The word was: <strong>{secretWord}</strong></p>
                <p>Points earned: <strong>+{Math.max(10, 30 + Math.floor(timeLeft / 10) - hintsUsed * 5)}</strong></p>
              </div>
              <button
                onClick={nextRound}
                className={`${btnStyles.btn} ${btnStyles.btnSuccess} ${btnStyles.btnLarge}`}
              >
                Next Round
              </button>
            </div>
          )}

          {/* Time's Up */}
          {timeLeft === 0 && !roundWinner && (
            <div className={styles.timeUpCard}>
              <div className={styles.timeUpText}>⏰ Time's Up!</div>
              <div className={styles.timeUpDetails}>
                <p>The word was: <strong>{secretWord}</strong></p>
                <p>No one guessed correctly this round.</p>
              </div>
              <button
                onClick={nextRound}
                className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`}
              >
                Next Round
              </button>
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  );
}

export default DrawGuess;
