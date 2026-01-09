import { useState } from "react";
import btnStyles from "../styles/Button.module.css";
import inputStyles from "../styles/Input.module.css";
import styles from "../styles/SharedComponents.module.css";

function OnlineRoomSetup({ 
  playerName, 
  setPlayerName, 
  roomCode, 
  setRoomCode, 
  onCreateRoom, 
  onJoinRoom,
  extractRoomCode = (text) => text.toUpperCase().trim(),
  hideCreateRoom = false
}) {
  return (
    <div className={styles.onlineSetupContainer}>
      <div className={styles.nameInputRow}>
        <span className={styles.nameLabel}>Your Name:</span>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          className={`${inputStyles.input} ${styles.nameInput}`}
        />
      </div>

      <div className={styles.roomOptions}>
        {!hideCreateRoom && (
          <>
            <div className={styles.roomOption}>
              <h3 className={styles.roomOptionTitle}>Create Room</h3>
              <p className={styles.roomOptionDescription}>
                Start a new game and share the 8-character room code
              </p>
              <button
                onClick={onCreateRoom}
                className={`${btnStyles.btn} ${btnStyles.btnPrimary}`}
              >
                Create Room
              </button>
            </div>

            <div className={styles.divider}>OR</div>
          </>
        )}

        <div className={styles.roomOption}>
          <h3 className={styles.roomOptionTitle}>Join Room</h3>
          <p className={styles.roomOptionDescription}>
            Enter the 8-character room code shared by your friend
          </p>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(extractRoomCode(e.target.value))}
            placeholder="Enter 8-char code"
            className={`${inputStyles.input} ${styles.roomCodeInput}`}
            maxLength={8}
          />
          <button
            onClick={onJoinRoom}
            className={`${btnStyles.btn} ${btnStyles.btnSuccess}`}
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnlineRoomSetup;
