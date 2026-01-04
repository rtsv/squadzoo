import { useState } from "react";
import btnStyles from "../styles/Button.module.css";
import styles from "../styles/SharedComponents.module.css";

function OnlineRoomExample({ 
  roomCode, 
  connectedPlayers, 
  maxPlayers,
  isHost, 
  onStartGame, 
  minPlayers = 2,
  symbols = null,
  gameUrl = ""
}) {
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setShowCopiedNotification(true);
      setTimeout(() => setShowCopiedNotification(false), 2000);
    }).catch(() => {
      alert("Failed to copy. Please copy manually.");
    });
  };

  const copyRoomUrl = () => {
    navigator.clipboard.writeText(gameUrl).then(() => {
      setShowCopiedNotification(true);
      setTimeout(() => setShowCopiedNotification(false), 2000);
    }).catch(() => {
      alert("Failed to copy URL. Please copy manually: " + gameUrl);
    });
  };

  const playerCount = connectedPlayers.length;
  const canStart = playerCount >= minPlayers && (!maxPlayers || playerCount <= maxPlayers);

  return (
    <div>
      {showCopiedNotification && (
        <div className={styles.copiedNotification}>
          ✓ Copied!
        </div>
      )}

      <div className={styles.waitingRoomContainer}>
        <h2 className={styles.waitingRoomTitle}>Share Room Code</h2>
        
        <div className={styles.roomCodeDisplay}>
          <code className={styles.roomCodeText}>{roomCode}</code>
          <button 
            onClick={copyRoomCode}
            className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnSmall}`}
          >
            📋 Copy Code
          </button>
          <button 
            onClick={copyRoomUrl}
            className={`${btnStyles.btn} ${btnStyles.btnSuccess} ${btnStyles.btnSmall}`}
          >
            🔗 Copy URL
          </button>
        </div>
        
        <p className={styles.roomCodeHelp}>
          Share this code with your friends to join {maxPlayers && `(${minPlayers}-${maxPlayers} players)`}
        </p>
        
        <div className={styles.playersSection}>
          <h3 className={styles.playersSectionTitle}>
            Players in Room ({playerCount}{maxPlayers ? `/${maxPlayers}` : ''}):
          </h3>
          <div className={styles.playersList}>
            {connectedPlayers.map((player, idx) => (
              <div key={idx} className={styles.playerItem}>
                {symbols && symbols[idx] && <span>{symbols[idx]}</span>}
                👤 {player.playerName} {player.isHost && "👑"}
              </div>
            ))}
            {symbols && playerCount < symbols.length && (
              <div className={`${styles.playerItem} ${styles.playerItemWaiting}`}>
                {symbols[playerCount]} Waiting for player...
              </div>
            )}
          </div>
        </div>

        {playerCount < minPlayers && (
          <div className={styles.waitingMessage}>
            <p className={styles.waitingMessageText}>
              ⏳ Waiting for at least {minPlayers - playerCount} more player{minPlayers - playerCount > 1 ? 's' : ''} to join...
            </p>
          </div>
        )}

        {isHost && canStart && (
          <div className={styles.startGameSection}>
            <button
              onClick={onStartGame}
              className={`${btnStyles.btn} ${btnStyles.btnSuccess} ${btnStyles.btnLarge}`}
            >
              Start Game ({playerCount} player{playerCount > 1 ? 's' : ''})
            </button>
          </div>
        )}

        {!isHost && playerCount >= minPlayers && (
          <div className={styles.waitingMessage}>
            <p className={styles.waitingMessageText}>
              ⏳ Waiting for host to start the game...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnlineRoomExample;
