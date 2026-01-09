import React from 'react';
import styles from '../styles/CustomAlert.module.css';

/**
 * CustomConfirm component for game continuation confirmation
 * Shows a modal dialog asking if user wants to continue previous game
 */
const CustomConfirm = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  message = "Do you want to continue your previous game?",
  timeRemaining = null 
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.alert}>
        <div className={styles.icon}>🎮</div>
        <h2 className={styles.title}>Continue Game?</h2>
        <p className={styles.message}>{message}</p>
        {timeRemaining && (
          <p className={styles.timeRemaining}>
            Time remaining: {timeRemaining} seconds
          </p>
        )}
        <div className={styles.buttonGroup}>
          <button 
            className={styles.buttonSecondary} 
            onClick={onCancel}
          >
            Start New Game
          </button>
          <button 
            className={styles.buttonPrimary} 
            onClick={onConfirm}
          >
            Continue Previous Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomConfirm;
