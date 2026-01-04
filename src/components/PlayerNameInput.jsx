import inputStyles from "../styles/Input.module.css";
import btnStyles from "../styles/Button.module.css";
import styles from "../styles/SharedComponents.module.css";

function PlayerNameInput({ 
  players, 
  onPlayerChange, 
  onAddPlayer, 
  onRemovePlayer, 
  minPlayers = 2,
  showSymbols = false,
  symbols = []
}) {
  return (
    <div className={styles.playerInputContainer}>
      {players.map((player, index) => (
        <div key={index} className={styles.playerInputRow}>
          <span className={styles.playerLabel}>
            Player {index + 1}{showSymbols && symbols[index] ? ` (${symbols[index]})` : ''}:
          </span>
          <input
            type="text"
            value={player}
            onChange={(e) => onPlayerChange(index, e.target.value)}
            placeholder="Enter name"
            className={`${inputStyles.input} ${styles.playerInput}`}
          />
          {players.length > minPlayers && (
            <button 
              onClick={() => onRemovePlayer(index)}
              className={`${btnStyles.btn} ${btnStyles.btnDanger} ${btnStyles.btnSmall}`}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      
      {onAddPlayer && (
        <button 
          onClick={onAddPlayer}
          className={`${btnStyles.btn} ${btnStyles.btnSuccess} ${styles.addPlayerButton}`}
        >
          + Add Player
        </button>
      )}
    </div>
  );
}

export default PlayerNameInput;
