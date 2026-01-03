import { useState, useEffect } from "react";
import GameLayout from "../../layout/GameLayout";
import CustomAlert from "../../components/CustomAlert";
import roomService from "../../services/roomService";
import styles from "../../styles/TicTacToe.module.css";
import btnStyles from "../../styles/Button.module.css";
import inputStyles from "../../styles/Input.module.css";

function TicTacToe({ onBack }) {
  const [gameMode, setGameMode] = useState(null); // null, 'local', 'online'
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState(["", ""]);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [scores, setScores] = useState({ 0: 0, 1: 0, draws: 0 });
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [isDraw, setIsDraw] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Online multiplayer states
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [myPlayerIndex, setMyPlayerIndex] = useState(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);

  const symbols = ["❌", "⭕"];

  // Setup online game listeners
  useEffect(() => {
    if (!isOnlineMode) return;

    // Don't cleanup on unmount - only when intentionally leaving
    return () => {
      // Empty cleanup - we handle disconnection manually in handleBackToMenu
    };
  }, [isOnlineMode]);

  useEffect(() => {
    if (!isOnlineMode || !isInRoom) return;

    // Handle errors
    roomService.on('onError', (errorMessage) => {
      setAlertMessage(errorMessage);
    });

    roomService.on('onPlayerJoined', (data) => {
      console.log('Player joined:', data);
      const allPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers(allPlayers);
      
      if (allPlayers.length === 2 && isHost) {
        // Both players connected, start game
        const playerNames = allPlayers.map(p => p.playerName);
        setPlayers(playerNames);
        setWaitingForOpponent(false);
        setGameStarted(true);
        
        // Notify guest to start game
        roomService.sendGameAction('game-start', { players: playerNames });
      }
    });

    roomService.on('onPlayerLeft', () => {
      setAlertMessage("Opponent disconnected!");
      setTimeout(() => {
        handleBackToMenu();
      }, 2000);
    });

    roomService.on('onGameAction', (data) => {
      console.log('Game action received:', data);
      
      switch (data.action) {
        case 'game-start':
          // Guest receives game start
          setPlayers(data.payload.players);
          setWaitingForOpponent(false);
          setGameStarted(true);
          break;
          
        case 'move':
          // Receive opponent's move
          handleOpponentMove(data.payload);
          break;
          
        case 'reset-board':
          // Opponent wants to play again
          resetBoard();
          break;
          
        case 'new-game':
          // Opponent wants new game
          resetGame();
          break;
      }
    });

    return () => {
      if (roomService.isConnected()) {
        roomService.leaveRoom();
      }
    };
  }, [isOnlineMode, isHost, isInRoom]);

  function handleOpponentMove(moveData) {
    console.log('📥 Opponent move:', moveData);
    
    // Update board with opponent's move
    setBoard(prevBoard => {
      const newBoard = [...prevBoard];
      newBoard[moveData.index] = moveData.playerIndex;
      
      // Check for winner after updating board
      const result = checkWinner(newBoard);
      if (result) {
        if (result.winner === "draw") {
          setIsDraw(true);
          setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
        } else {
          setWinner(result.winner);
          setWinningLine(result.line);
          setScores(prev => ({
            ...prev,
            [result.winner]: prev[result.winner] + 1,
          }));
        }
      } else {
        // Switch turn to current player
        setCurrentPlayerIndex(moveData.playerIndex === 0 ? 1 : 0);
      }
      
      return newBoard;
    });
  }

  async function handleCreateOnlineRoom() {
    if (!playerName.trim()) {
      setAlertMessage("Please enter your name!");
      return;
    }

    try {
      // Register callbacks BEFORE creating room
      roomService.on('onPlayerJoined', (data) => {
        console.log('🎉 Player joined callback:', data);
        const allPlayers = roomService.getConnectedPlayers();
        setConnectedPlayers(allPlayers);
        
        if (allPlayers.length === 2) {
          // Both players connected, start game
          const playerNames = allPlayers.map(p => p.playerName);
          setPlayers(playerNames);
          setWaitingForOpponent(false);
          setGameStarted(true);
          
          // Notify guest to start game
          roomService.sendGameAction('game-start', { players: playerNames });
        }
      });

      roomService.on('onPlayerLeft', () => {
        setAlertMessage("Opponent disconnected!");
        setTimeout(() => {
          handleBackToMenu();
        }, 2000);
      });

      roomService.on('onGameAction', (data) => {
        console.log('Game action received:', data);
        
        switch (data.action) {
          case 'game-start':
            setPlayers(data.payload.players);
            setWaitingForOpponent(false);
            setGameStarted(true);
            break;
            
          case 'move':
            handleOpponentMove(data.payload);
            break;
            
          case 'reset-board':
            resetBoard();
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
      setMyPlayerIndex(0); // Host is always X (player 0)
      setWaitingForOpponent(true);
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
      // Register callbacks BEFORE joining room
      roomService.on('onPlayerJoined', (data) => {
        console.log('🎉 Player joined callback:', data);
        const allPlayers = roomService.getConnectedPlayers();
        setConnectedPlayers(allPlayers);
      });

      roomService.on('onPlayerLeft', () => {
        setAlertMessage("Opponent disconnected!");
        setTimeout(() => {
          handleBackToMenu();
        }, 2000);
      });

      roomService.on('onGameAction', (data) => {
        console.log('Game action received:', data);
        
        switch (data.action) {
          case 'game-start':
            setPlayers(data.payload.players);
            setWaitingForOpponent(false);
            setGameStarted(true);
            break;
            
          case 'move':
            handleOpponentMove(data.payload);
            break;
            
          case 'reset-board':
            resetBoard();
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
      setMyPlayerIndex(1); // Guest is always O (player 1)
      setWaitingForOpponent(true);
      const allPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers(allPlayers);
    } catch (error) {
      console.error('Error joining room:', error);
      setAlertMessage('Failed to join room. Check the room code and try again.');
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
    setWaitingForOpponent(false);
    setRoomCode("");
    setPlayerName("");
    setPlayers(["", ""]);
    setBoard(Array(9).fill(null));
    setCurrentPlayerIndex(0);
    setScores({ 0: 0, 1: 0, draws: 0 });
    setWinner(null);
    setWinningLine([]);
    setIsDraw(false);
  }

  function handlePlayerNameChange(index, value) {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  }

  function startGame() {
    const validPlayers = players.filter(name => name.trim() !== "");
    if (validPlayers.length < 2) {
      setAlertMessage("Please enter both player names!");
      return;
    }
    setPlayers(validPlayers);
    setGameStarted(true);
  }

  function checkWinner(board) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6], // diagonals
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line };
      }
    }

    if (board.every(cell => cell !== null)) {
      return { winner: "draw", line: [] };
    }

    return null;
  }

  function handleCellClick(index) {
    if (board[index] !== null || winner || isDraw) return;

    // Online mode: check if it's player's turn
    if (isOnlineMode && myPlayerIndex !== currentPlayerIndex) {
      setAlertMessage("Wait for your turn!");
      return;
    }

    const newBoard = [...board];
    newBoard[index] = currentPlayerIndex;
    setBoard(newBoard);

    // Send move to opponent if online
    if (isOnlineMode) {
      roomService.sendGameAction('move', {
        index,
        playerIndex: currentPlayerIndex
      });
    }

    const result = checkWinner(newBoard);
    if (result) {
      if (result.winner === "draw") {
        setIsDraw(true);
        setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      } else {
        setWinner(result.winner);
        setWinningLine(result.line);
        setScores(prev => ({
          ...prev,
          [result.winner]: prev[result.winner] + 1,
        }));
      }
    } else {
      setCurrentPlayerIndex(currentPlayerIndex === 0 ? 1 : 0);
    }
  }

  function resetBoard() {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine([]);
    setIsDraw(false);
    setCurrentPlayerIndex(0);

    // Notify opponent in online mode
    if (isOnlineMode && isHost) {
      roomService.sendGameAction('reset-board', {});
    }
  }

  function resetGame() {
    setGameStarted(false);
    setPlayers(["", ""]);
    setBoard(Array(9).fill(null));
    setCurrentPlayerIndex(0);
    setScores({ 0: 0, 1: 0, draws: 0 });
    setWinner(null);
    setWinningLine([]);
    setIsDraw(false);

    // Notify opponent in online mode
    if (isOnlineMode) {
      roomService.sendGameAction('new-game', {});
    }
  }

  // Mode Selection Screen
  if (!gameMode) {
    return (
      <GameLayout title="⭕❌ Tic-Tac-Toe - Select Mode" onBack={onBack}>
        {alertMessage && (
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>
            Choose how you want to play Tic-Tac-Toe
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
                Play with someone next to you
              </small>
            </button>

            <button
              onClick={() => {
                setGameMode('online');
                setIsOnlineMode(true);
              }}
              className={`${btnStyles.btn} ${btnStyles.btnSuccess} ${btnStyles.btnLarge}`}
            >
              🌐 Online Multiplayer
              <small style={{ display: 'block', fontSize: '0.8em', marginTop: '5px' }}>
                Play with someone remotely
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
      <GameLayout title="⭕❌ Tic-Tac-Toe - Online Setup" onBack={handleBackToMenu}>
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
  if (isOnlineMode && isInRoom && waitingForOpponent) {
    const copyRoomCode = () => {
      navigator.clipboard.writeText(roomCode).then(() => {
        setShowCopiedNotification(true);
        setTimeout(() => setShowCopiedNotification(false), 2000);
      }).catch(() => {
        setAlertMessage("Failed to copy. Please copy manually.");
      });
    };

    return (
      <GameLayout title="⭕❌ Tic-Tac-Toe - Waiting Room" onBack={handleBackToMenu}>
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
            <p className={styles.shareCode}>Share this code with your opponent to join</p>
            
            <div className={styles.playersList}>
              <h3>Players in Room ({connectedPlayers.length}/2):</h3>
              {connectedPlayers.map((player, idx) => (
                <div key={idx} className={styles.playerItem}>
                  {symbols[idx]} {player.playerName} {player.isHost && "👑"}
                </div>
              ))}
            </div>

            {connectedPlayers.length < 2 && (
              <div className={styles.waitingAnimation}>
                <p>⏳ Waiting for opponent to join...</p>
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
      <GameLayout title="⭕❌ Tic-Tac-Toe - Player Setup" onBack={handleBackToMenu}>
        {alertMessage && (
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>
            Enter player names to begin. Take turns placing your symbols to get three in a row!
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
                  <li>Players take turns placing their symbol (❌ or ⭕) on the 3x3 grid</li>
                  <li>The first player to get 3 of their symbols in a row wins</li>
                  <li>Rows can be horizontal, vertical, or diagonal</li>
                  <li>If all 9 squares are filled without a winner, it's a draw</li>
                  <li>Play multiple rounds and track your scores!</li>
                </ul>
              </div>
            )}
          </div>

          {players.map((player, index) => (
            <div key={index} className={styles.playerInputRow}>
              <span className={styles.playerLabel}>
                Player {index + 1} ({symbols[index]}):
              </span>
              <input
                type="text"
                value={player}
                onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                placeholder="Enter name"
                className={inputStyles.input}
                style={{ flex: 1 }}
              />
            </div>
          ))}

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
      title={`⭕❌ Tic-Tac-Toe ${isOnlineMode ? '(Online)' : ''}`}
      currentPlayer={winner !== null || isDraw ? null : players[currentPlayerIndex]}
      onBack={handleBackToMenu}
    >
      <div className={styles.gameContainer}>
        {/* Online Room Info */}
        {isOnlineMode && (
          <div className={styles.onlineInfo}>
            <span>Room: {roomCode}</span>
            <span>You are: {symbols[myPlayerIndex]} {players[myPlayerIndex]}</span>
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
              <strong>Goal:</strong> Get 3 symbols in a row (horizontal, vertical, or diagonal) to win!
            </div>
          )}
        </div>

        {/* Scoreboard */}
        <div className={styles.scoreboard}>
          <div className={styles.scoreItem}>
            <span className={styles.playerName}>
              {symbols[0]} {players[0]}
            </span>
            <span className={styles.playerScore}>{scores[0]}</span>
          </div>
          <div className={styles.scoreItem}>
            <span className={styles.drawLabel}>Draws</span>
            <span className={styles.playerScore}>{scores.draws}</span>
          </div>
          <div className={styles.scoreItem}>
            <span className={styles.playerName}>
              {symbols[1]} {players[1]}
            </span>
            <span className={styles.playerScore}>{scores[1]}</span>
          </div>
        </div>

        {/* Current Turn Indicator */}
        {!winner && !isDraw && (
          <div className={styles.turnIndicator}>
            <p className={styles.turnText}>
              Current Turn: <span className={styles.currentPlayerBadge}>
                {symbols[currentPlayerIndex]} {players[currentPlayerIndex]}
              </span>
              {isOnlineMode && myPlayerIndex === currentPlayerIndex && (
                <span className={styles.yourTurn}> - Your Turn!</span>
              )}
              {isOnlineMode && myPlayerIndex !== currentPlayerIndex && (
                <span className={styles.opponentTurn}> - Opponent's Turn</span>
              )}
            </p>
          </div>
        )}

        {/* Game Board */}
        <div className={styles.board}>
          {board.map((cell, index) => (
            <div
              key={index}
              className={`${styles.cell} ${
                cell !== null ? styles.cellFilled : ""
              } ${
                winningLine.includes(index) ? styles.cellWinning : ""
              } ${
                isOnlineMode && myPlayerIndex !== currentPlayerIndex ? styles.cellDisabled : ""
              }`}
              onClick={() => handleCellClick(index)}
            >
              {cell !== null && (
                <span className={`${styles.symbol} ${cell === 0 ? styles.symbolX : styles.symbolO}`}>
                  {symbols[cell]}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Winner/Draw Message */}
        {winner !== null && (
          <div className={styles.resultCard}>
            <h2 className={styles.resultTitle}>
              🏆 {players[winner]} Wins!
            </h2>
            {(!isOnlineMode || isHost) && (
              <button
                onClick={resetBoard}
                className={`${btnStyles.btn} ${btnStyles.btnSuccess} ${btnStyles.btnLarge}`}
              >
                Play Again
              </button>
            )}
            {isOnlineMode && !isHost && (
              <p>Waiting for host to start next round...</p>
            )}
          </div>
        )}

        {isDraw && (
          <div className={styles.resultCard}>
            <h2 className={styles.resultTitle}>🤝 It's a Draw!</h2>
            {(!isOnlineMode || isHost) && (
              <button
                onClick={resetBoard}
                className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`}
              >
                Play Again
              </button>
            )}
            {isOnlineMode && !isHost && (
              <p>Waiting for host to start next round...</p>
            )}
          </div>
        )}

        {/* Reset Game Button */}
        <div className={styles.resetButtonContainer}>
          <button
            onClick={handleBackToMenu}
            className={`${btnStyles.btn} ${btnStyles.btnSecondary}`}
          >
            {isOnlineMode ? "Leave Room" : "New Game"}
          </button>
        </div>
      </div>
    </GameLayout>
  );
}

export default TicTacToe;
