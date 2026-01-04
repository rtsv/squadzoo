import { useState } from "react";
import btnStyles from "../styles/Button.module.css";
import styles from "../styles/SharedComponents.module.css";

function GameRules({ rules, compact = false }) {
  const [showRules, setShowRules] = useState(false);

  if (compact) {
    return (
      <div className={styles.rulesContainerCompact}>
        <button
          onClick={() => setShowRules(!showRules)}
          className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${btnStyles.btnSmall}`}
        >
          📖 {showRules ? "Hide" : "Rules"}
        </button>
        {showRules && (
          <div className={styles.rulesContentCompact}>
            {rules}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.rulesContainer}>
      <button
        onClick={() => setShowRules(!showRules)}
        className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${btnStyles.btnSmall}`}
      >
        📖 {showRules ? "Hide Rules" : "Show Rules"}
      </button>
      {showRules && (
        <div className={styles.rulesContent}>
          <h4 className={styles.rulesTitle}>How to Play:</h4>
          <ul className={styles.rulesList}>
            {rules.map((rule, index) => (
              <li key={index} className={styles.ruleItem}>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default GameRules;
