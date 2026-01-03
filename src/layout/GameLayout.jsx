import styles from "../styles/GameLayout.module.css";
import btnStyles from "../styles/Button.module.css";

function GameLayout({ title, currentPlayer, children, onBack }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={`${btnStyles.btn} ${btnStyles.btnBack}`} onClick={onBack}>
          ⬅ Back
        </button>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.playerBadge}>
          👤 {currentPlayer}
        </div>
      </div>

      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}

export default GameLayout;
