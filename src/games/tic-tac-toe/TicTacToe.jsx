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
import VoiceChat from "../../components/VoiceChat";
import MatchHistorySidebar from "../../components/MatchHistorySidebar";
import styles from "../../styles/TicTacToe.module.css";
import btnStyles from "../../styles/Button.module.css";
import inputStyles from "../../styles/Input.module.css";

function TicTacToe({ onBack, initialRoomCode, onGameStart, isPlayMode = false }) {
  const [gameMode, setGameMode] = useState(null); // null, 'local', 'online'
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState(["", ""]);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [scores, setScores] = useState({ 0: 0, 1: 0, draws: 0 });
  const [matchHistory, setMatchHistory] = useState([]);
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
  
  // State persistence
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [savedState, setSavedState] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const symbols = ["❌", "⭕"];

  const gameRules = [
    "Players take turns placing their symbol (❌ or ⭕) on the 3x3 grid",
    "The first player to get 3 of their symbols in a row wins",
    "Rows can be horizontal, vertical, or diagonal",
    "If all 9 squares are filled without a winner, it's a draw",
    "Play multiple rounds and track your scores!"
  ];

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
    const handleError = (errorMessage) => {
      setAlertMessage(errorMessage);
    };

    const handlePlayerJoined = (data) => {
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
        
        // Navigate to play URL for ad-free gameplay
        if (onGameStart && !isPlayMode) {
          onGameStart();
        }
      }
    };

    const handlePlayerLeft = () => {
      setAlertMessage("Opponent disconnected!");
      setTimeout(() => {
        handleBackToMenu();
      }, 2000);
    };

    const handleGameAction = (data) => {
      console.log('Game action received:', data);
      
      switch (data.action) {
        case 'game-start':
          // Guest receives game start
          setPlayers(data.payload.players);
          setWaitingForOpponent(false);
          setGameStarted(true);
          
          // Navigate to play URL for ad-free gameplay
          if (onGameStart && !isPlayMode) {
            onGameStart();
          }
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
    };

    roomService.on('onError', handleError);
    roomService.on('onPlayerJoined', handlePlayerJoined);
    roomService.on('onPlayerLeft', handlePlayerLeft);
    roomService.on('onGameAction', handleGameAction);

    return () => {
      // Do not disconnect here: route transitions to /play can remount this component.
      // Room teardown should only happen on explicit leave/back actions.
      delete roomService.callbacks.onError;
      delete roomService.callbacks.onPlayerJoined;
      delete roomService.callbacks.onPlayerLeft;
      delete roomService.callbacks.onGameAction;
    };
  }, [isOnlineMode, isHost, isInRoom, onGameStart, isPlayMode]);

  // Add useEffect to handle initial room code from URL
  useEffect(() => {
    if (initialRoomCode && !gameMode && !isInRoom) {
      // Auto-navigate to online join mode with room code pre-filled
      setGameMode('online');
      setIsOnlineMode(true);
      setRoomCode(initialRoomCode.toUpperCase().trim());
    }
  }, [initialRoomCode]);

  // Check for saved game state on mount
  useEffect(() => {
    const gameId = isOnlineMode ? `tic-tac-toe-online-${roomCode}` : 'tic-tac-toe-offline';
    const saved = loadGameState(gameId);
    
    if (saved && !gameStarted) {
      setSavedState(saved);
      setTimeRemaining(getTimeRemaining(gameId));
      setShowContinueDialog(true);
    }
  }, []); // Run only once on mount

  // Save game state whenever critical game state changes
  useEffect(() => {
    if (gameStarted && !winner && !isDraw) {
      const gameId = isOnlineMode ? `tic-tac-toe-online-${roomCode}` : 'tic-tac-toe-offline';
      const stateToSave = {
        gameMode,
        gameStarted,
        players,
        board,
        currentPlayerIndex,
        scores,
        isOnlineMode,
        playerName,
        roomCode,
        isInRoom,
        isHost,
        myPlayerIndex,
      };
      
      saveGameState(gameId, stateToSave);
    }
  }, [gameStarted, board, currentPlayerIndex, winner, isDraw]);

  // Clear saved state when game ends
  useEffect(() => {
    if (winner || isDraw) {
      const gameId = isOnlineMode ? `tic-tac-toe-online-${roomCode}` : 'tic-tac-toe-offline';
      clearGameState(gameId);
    }
  }, [winner, isDraw, isOnlineMode, roomCode]);

  // Handlers for continue dialog
  const handleContinueGame = () => {
    if (savedState) {
      // Restore all game state
      setGameMode(savedState.gameMode);
      setGameStarted(savedState.gameStarted);
      setPlayers(savedState.players);
      setBoard(savedState.board);
      setCurrentPlayerIndex(savedState.currentPlayerIndex);
      setScores(savedState.scores);
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
    const gameId = isOnlineMode ? `tic-tac-toe-online-${roomCode}` : 'tic-tac-toe-offline';
    clearGameState(gameId);
    setShowContinueDialog(false);
    setSavedState(null);
  };

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
          setMatchHistory(prev => [...prev, { winner: 'draw', date: Date.now() }]);
        } else {
          setWinner(result.winner);
          setWinningLine(result.line);
          setScores(prev => ({
            ...prev,
            [result.winner]: prev[result.winner] + 1,
          }));
          setMatchHistory(prev => [...prev, { winner: result.winner, date: Date.now() }]);
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
      roomService.playerName = playerName;
      const { roomCode: code } = await roomService.createRoom();
      setRoomCode(code);
      setIsHost(true);
      setIsInRoom(true);
      setMyPlayerIndex(0); // Host is always X (player 0)
      setWaitingForOpponent(true);
      
      // Get connected players after a short delay to ensure websocket is ready
      setTimeout(() => {
        const allPlayers = roomService.getConnectedPlayers();
        setConnectedPlayers(allPlayers);
      }, 100);
      
      // Update URL with room code
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
      setMyPlayerIndex(1); // Guest is always O (player 1)
      setWaitingForOpponent(true);
      
      // Get connected players after a short delay to ensure websocket is ready
      setTimeout(() => {
        const allPlayers = roomService.getConnectedPlayers();
        setConnectedPlayers(allPlayers);
      }, 100);
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
    
    // Navigate to play URL for ad-free gameplay
    if (onGameStart && !isPlayMode) {
      onGameStart();
    }
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
        setMatchHistory(prev => [...prev, { winner: 'draw', date: Date.now() }]);
      } else {
        setWinner(result.winner);
        setWinningLine(result.line);
        setScores(prev => ({
          ...prev,
          [result.winner]: prev[result.winner] + 1,
        }));
        setMatchHistory(prev => [...prev, { winner: result.winner, date: Date.now() }]);
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
    setMatchHistory([]);
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

  // Online Waiting Room
  if (isOnlineMode && isInRoom && waitingForOpponent) {
    return (
      <GameLayout title="⭕❌ Tic-Tac-Toe - Waiting Room" onBack={handleBackToMenu}>
        {alertMessage && (
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
        <OnlineRoomExample
          roomCode={roomCode}
          connectedPlayers={connectedPlayers}
          maxPlayers={2}
          isHost={isHost}
          onStartGame={() => {}} // Auto-starts when 2 players join
          minPlayers={2}
          symbols={symbols}
          gameUrl={`${window.location.origin}/games/tic-tac-toe?room=${roomCode}`}
        />
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

          <GameRules rules={gameRules} />

          <PlayerNameInput
            players={players}
            onPlayerChange={handlePlayerNameChange}
            minPlayers={2}
            showSymbols={true}
            symbols={symbols}
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
      title={`⭕❌ Tic-Tac-Toe ${isOnlineMode ? '(Online)' : ''}`}
      currentPlayer={winner !== null || isDraw ? null : players[currentPlayerIndex]}
      onBack={handleBackToMenu}
    >
      {alertMessage && (
        <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />
      )}
      <VoiceChat enabled={isOnlineMode && gameStarted} myId={roomService.playerId} roomCode={roomCode} />
      
      <CustomConfirm
        isOpen={showContinueDialog}
        onConfirm={handleContinueGame}
        onCancel={handleStartNewGame}
        message={`You have a saved game from your previous session.${isOnlineMode ? ' (Online Mode)' : ''} Would you like to continue?`}
        timeRemaining={timeRemaining}
      />
      
      <div className={styles.mainGameWrapper}>
        <div className={styles.gameContainer}>
          {/* Online Room Info */}
          {isOnlineMode && (
            <div className={styles.onlineInfo}>
              <span>Room: {roomCode}</span>
              <span>You are: {symbols[myPlayerIndex]} {players[myPlayerIndex]}</span>
            </div>
          )}

          <GameRules 
            rules="Goal: Get 3 symbols in a row (horizontal, vertical, or diagonal) to win!" 
            compact={true} 
          />

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
        
        <MatchHistorySidebar 
          players={players.map((n, i) => ({ name: n || `Player ${i+1}`, emoji: symbols[i] }))}
          scores={scores}
          history={matchHistory}
          getPlayerColor={i => i === 0 ? '#e53e3e' : '#3182ce'}
          getPlayerLightColor={i => i === 0 ? '#fc8181' : '#63b3ed'}
          getPlayerBadge={i => symbols[i]}
        />
      </div>
    </GameLayout>
  );
}

export default TicTacToe;
