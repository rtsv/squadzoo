import btnStyles from "../styles/Button.module.css";
import styles from "../styles/SharedComponents.module.css";

function GameModeSelector({ onSelectLocal, onSelectOnline, localLabel = "Local Play", onlineLabel = "Online Multiplayer", maxPlayers = null }) {
  return (
    <div className={styles.modeSelection}>
      <button
        onClick={onSelectLocal}
        className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`}
      >
        👥 {localLabel}
        <small className={styles.modeButtonSubtext}>
          Play with people next to you
        </small>
      </button>

      <button
        onClick={onSelectOnline}
        className={`${btnStyles.btn} ${btnStyles.btnSuccess} ${btnStyles.btnLarge}`}
      >
        🌐 {onlineLabel}
        {maxPlayers && <span> ({maxPlayers})</span>}
        <small className={styles.modeButtonSubtext}>
          Play with friends remotely
        </small>
      </button>
    </div>
  );
}

export default GameModeSelector;
