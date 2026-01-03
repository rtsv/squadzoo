import { useEffect } from "react";
import styles from "../styles/CustomAlert.module.css";
import btnStyles from "../styles/Button.module.css";

function CustomAlert({ message, onClose }) {
  useEffect(() => {
    // Prevent body scroll when alert is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.alertBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.logo}>🦁</span>
          <span className={styles.title}>SquadZoo says:</span>
        </div>
        <div className={styles.message}>{message}</div>
        <button
          onClick={onClose}
          className={`${btnStyles.btn} ${btnStyles.btnPrimary}`}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default CustomAlert;
