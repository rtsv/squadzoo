import styles from "../styles/Card.module.css";
import btnStyles from "../styles/Button.module.css";

function GameCard({ icon, title, description, onPlay }) {
  return (
    <div className={`${styles.card} ${styles.gameCard}`} onClick={onPlay}>
      <div className={styles.cardIcon}>{icon}</div>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDescription}>{description}</p>
      <button className={`${btnStyles.btn} ${btnStyles.btnPrimary}`}>
        Play Now
      </button>
    </div>
  );
}

export default GameCard;
