import styles from '../styles/MatchHistorySidebar.module.css';

export default function MatchHistorySidebar({
  players,
  scores, 
  history,
  getPlayerColor,
  getPlayerLightColor,
  getPlayerBadge,
}) {
  const getScore = (i) => {
    if (Array.isArray(scores)) return scores[i] || 0;
    if (scores && typeof scores === 'object') return scores[i] || 0;
    return 0;
  };

  const getDraws = () => {
    if (scores && typeof scores === 'object' && scores.draws) return scores.draws;
    return 0;
  };

  const draws = getDraws();

  return (
    <div className={styles.historySidebar}>
      <h3 className={styles.sidebarTitle}>Match History</h3>
      
      <div className={styles.scoresGrid}>
        {players.map((p, i) => {
          if (!p || (typeof p === 'string' && p.trim() === '')) return null;
          const pName = typeof p === 'string' ? p : p.name || `Player ${i+1}`;
          const color = getPlayerColor ? getPlayerColor(i) : null;
          return (
            <div key={i} className={styles.scoreItem} style={{ borderLeftColor: color || '#a0aec0' }}>
              <span className={styles.scoreName}>{pName}</span>
              <span className={styles.scoreWins}>{getScore(i)} Win{getScore(i) !== 1 ? 's' : ''}</span>
            </div>
          );
        })}
        {draws > 0 && (
          <div className={styles.scoreItem} style={{ borderLeftColor: '#718096' }}>
            <span className={styles.scoreName}>Draws</span>
            <span className={styles.scoreWins}>{draws}</span>
          </div>
        )}
      </div>

      <div className={styles.historyList}>
        {history.length === 0 ? (
          <p className={styles.emptyHistory}>No matches played yet.</p>
        ) : (
          history.map((m, idx) => {
            if (m.winner === 'draw' || m.isDraw) {
              return (
                <div key={idx} className={styles.historyItem}>
                  <span className={styles.historyRound}>Match {idx + 1}</span>
                  <span className={styles.historyWinner} style={{ color: '#a0aec0' }}>
                    🤝 Draw
                  </span>
                </div>
              );
            }

            const pIdx = m.winner;
            const p = players[pIdx];
            const pName = typeof p === 'string' ? p : (p?.name || `Player ${pIdx + 1}`);
            const badge = getPlayerBadge ? getPlayerBadge(pIdx) : '';
            const lightColor = getPlayerLightColor ? getPlayerLightColor(pIdx) : '#fff';

            return (
              <div key={idx} className={styles.historyItem}>
                <span className={styles.historyRound}>Match {idx + 1}</span>
                <span className={styles.historyWinner} style={{ color: lightColor || '#fff' }}>
                  {badge} {pName} won!
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
