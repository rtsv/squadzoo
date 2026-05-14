import { useState } from "react";
import { useVoiceChat } from "../services/useVoiceChat";
import styles from "../styles/VoiceChat.module.css";

/**
 * VoiceChat
 *
 * Drop-in voice-chat panel for any online multiplayer game.
 * Place it inside the game JSX; it only renders in online mode.
 * Mic starts muted; the player taps the mic button to unmute and send audio.
 *
 * Props:
 *   enabled   {boolean}  - pass `isOnlineMode` from game state
 *   myId      {string}   - roomService.playerId
 *   roomCode  {string}   - for display only
 */
export default function VoiceChat({ enabled, myId, roomCode }) {
  const [expanded, setExpanded] = useState(false);

  const { status, isMuted, micError, activePeers, toggleMute } = useVoiceChat({
    enabled,
    myId,
  });

  if (!enabled) return null;

  const peerList = Object.entries(activePeers);
  const label = {
    idle:       "Voice ready",
    requesting: "Requesting mic…",
    connecting: "Connecting…",
    connected:  "Voice connected",
    error:      "Voice unavailable",
  }[status] ?? status;

  const dotClass = {
    idle:       styles.dotIdle,
    requesting: styles.dotWaiting,
    connecting: styles.dotWaiting,
    connected:  styles.dotConnected,
    error:      styles.dotError,
  }[status] ?? styles.dotIdle;

  return (
    <div className={`${styles.panel} ${expanded ? styles.expanded : ""}`}>
      {/* ── Compact bar ────────────────────────────────────────── */}
      <div className={styles.bar}>
        {/* Status dot */}
        <span className={`${styles.dot} ${dotClass}`} title={label} />

        {/* Mic toggle */}
        <button
          className={`${styles.micBtn} ${isMuted ? styles.micMuted : ""}`}
          onClick={toggleMute}
          title={isMuted ? "Unmute microphone" : "Mute microphone"}
          disabled={status === "requesting" || status === "error"}
        >
          {isMuted ? "🔇" : "🎤"}
        </button>

        {/* Status label */}
        <span className={styles.statusLabel}>{label}</span>

        {/* Expand / collapse */}
        <button
          className={styles.expandBtn}
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? "Collapse" : "Show voice peers"}
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* ── Expanded panel ─────────────────────────────────────── */}
      {expanded && (
        <div className={styles.details}>
          {/* Mic error */}
          {micError && (
            <p className={styles.errorMsg}>{micError}</p>
          )}

          {/* Peer list */}
          {peerList.length === 0 ? (
            <p className={styles.noPeers}>
              {status === "connecting" ? "Waiting for others to join voice…" : "No voice peers yet"}
            </p>
          ) : (
            <ul className={styles.peerList}>
              {peerList.map(([id, peer]) => (
                <li key={id} className={styles.peerItem}>
                  <span className={`${styles.peerDot} ${peer.connected ? styles.dotConnected : styles.dotWaiting}`} />
                  <span className={styles.peerName}>{peer.name || "Player"}</span>
                  <span className={styles.peerState}>{peer.connected ? "🔊" : "⏳"}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Room code hint */}
          {roomCode && (
            <p className={styles.roomHint}>Room: <strong>{roomCode}</strong></p>
          )}
        </div>
      )}
    </div>
  );
}
