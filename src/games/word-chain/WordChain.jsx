import { useState } from "react";
import GameLayout from "../../layout/GameLayout";
import CustomAlert from "../../components/CustomAlert";
import styles from "../../styles/WordChain.module.css";
import btnStyles from "../../styles/Button.module.css";
import inputStyles from "../../styles/Input.module.css";

function WordChain({ onBack }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState(["", "", ""]);
  const [playerLives, setPlayerLives] = useState({});
  const [usedWords, setUsedWords] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [input, setInput] = useState("");
  const [eliminated, setEliminated] = useState([]);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const lastLetter =
    usedWords.length === 0
      ? null
      : usedWords[usedWords.length - 1].slice(-1).toLowerCase();

  function handlePlayerNameChange(index, value) {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  }

  function addPlayer() {
    setPlayers([...players, ""]);
  }

  function removePlayer(index) {
    if (players.length > 2) {
      const newPlayers = players.filter((_, i) => i !== index);
      setPlayers(newPlayers);
    }
  }

  function startGame() {
    const validPlayers = players.filter(name => name.trim() !== "");
    if (validPlayers.length < 2) {
      setAlertMessage("Please enter at least 2 player names!");
      return;
    }
    setPlayers(validPlayers);
    
    // Initialize lives for each player
    const lives = {};
    validPlayers.forEach(player => {
      lives[player] = 3;
    });
    setPlayerLives(lives);
    
    setGameStarted(true);
  }

  function resetGame() {
    setGameStarted(false);
    setPlayers(["", "", ""]);
    setPlayerLives({});
    setUsedWords([]);
    setCurrentPlayer(0);
    setInput("");
    setEliminated([]);
    setError("");
  }

  async function validateWord(word) {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      return response.ok;
    } catch (error) {
      console.error("Error validating word:", error);
      // If API fails, allow the word to continue game flow
      return true;
    }
  }

  async function submitWord() {
    const word = input.toLowerCase().trim();

    if (!word) {
      setError("Please enter a word");
      return;
    }

    if (word.length < 2) {
      setError("Word must be at least 2 letters");
      return;
    }

    if (!/^[a-z]+$/.test(word)) {
      setError("Only letters allowed");
      return;
    }

    if (usedWords.includes(word)) {
      setError(`"${word}" has already been used!`);
      eliminate();
      return;
    }

    if (lastLetter && word[0] !== lastLetter) {
      setError(`Word must start with "${lastLetter.toUpperCase()}"!`);
      eliminate();
      return;
    }

    // Validate if it's a real word
    setIsValidating(true);
    const isValid = await validateWord(word);
    setIsValidating(false);

    if (!isValid) {
      setError(`"${word}" is not a valid English word!`);
      eliminate();
      return;
    }

    setUsedWords([...usedWords, word]);
    setError("");
    nextPlayer();
    setInput("");
  }

  function eliminate() {
    const playerName = players[currentPlayer];
    const currentLives = playerLives[playerName];
    
    if (currentLives > 1) {
      // Lose a life
      setPlayerLives({
        ...playerLives,
        [playerName]: currentLives - 1
      });
      
      setTimeout(() => {
        setError("");
        nextPlayer();
        setInput("");
      }, 2000);
    } else {
      // Eliminate player
      setEliminated([...eliminated, playerName]);
      setPlayerLives({
        ...playerLives,
        [playerName]: 0
      });
      
      setTimeout(() => {
        setError("");
        nextPlayer();
        setInput("");
      }, 2000);
    }
  }

  function nextPlayer() {
    let next = (currentPlayer + 1) % players.length;
    let attempts = 0;
    while (eliminated.includes(players[next]) && attempts < players.length) {
      next = (next + 1) % players.length;
      attempts++;
    }
    setCurrentPlayer(next);
  }

  const activePlayers = players.filter(
    (p) => !eliminated.includes(p)
  );

  // Player Setup Screen
  if (!gameStarted) {
    return (
      <GameLayout title="🔤 Word Chain - Player Setup" onBack={onBack}>
        {alertMessage && (
          <CustomAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
        <div className={styles.setupContainer}>
          <p className={styles.setupDescription}>
            Enter player names to begin. Each player will take turns creating a word chain!
          </p>

          {/* Game Rules */}
          <div className={styles.rulesSection}>
            <button
              onClick={() => setShowRules(!showRules)}
              className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${btnStyles.btnSmall}`}
            >
              📖 {showRules ? "Hide Rules" : "Show Rules"}
            </button>
            {showRules && (
              <div className={styles.rulesContent}>
                <h4>How to Play:</h4>
                <ul>
                  <li>Each player starts with 3 lives (hearts)</li>
                  <li>Take turns saying a valid English word</li>
                  <li>Each word must start with the last letter of the previous word</li>
                  <li>Example: CAT → TABLE → EGG → GAME</li>
                  <li>You cannot reuse a word that's already been used</li>
                  <li>Words must be at least 2 letters long and contain only letters</li>
                  <li>Lose a life for: wrong starting letter, invalid word, or repeated word</li>
                  <li>Last player standing wins!</li>
                </ul>
              </div>
            )}
          </div>
          
          {players.map((player, index) => (
            <div key={index} className={styles.playerInputRow}>
              <span className={styles.playerLabel}>
                Player {index + 1}:
              </span>
              <input
                type="text"
                value={player}
                onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                placeholder="Enter name"
                className={inputStyles.input}
                style={{ flex: 1 }}
              />
              {players.length > 2 && (
                <button 
                  onClick={() => removePlayer(index)}
                  className={`${btnStyles.btn} ${btnStyles.btnDanger} ${btnStyles.btnSmall}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <div className={styles.setupButtons}>
            <button 
              onClick={addPlayer}
              className={`${btnStyles.btn} ${btnStyles.btnSuccess}`}
            >
              + Add Player
            </button>
            <button 
              onClick={startGame}
              className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${btnStyles.btnLarge}`}
            >
              Start Game
            </button>
          </div>
        </div>
      </GameLayout>
    );
  }

  // Game Screen
  return (
    <GameLayout
      title="🔤 Word Chain"
      currentPlayer={players[currentPlayer]}
      onBack={onBack}
    >
      {activePlayers.length > 1 ? (
        <>
          {/* Game Rules Toggle */}
          <div className={styles.rulesToggle}>
            <button
              onClick={() => setShowRules(!showRules)}
              className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${btnStyles.btnSmall}`}
            >
              📖 {showRules ? "Hide" : "Rules"}
            </button>
            {showRules && (
              <div className={styles.rulesContentSmall}>
                <strong>Rules:</strong> Say a word starting with the last letter of the previous word. 
                Don't repeat words or you'll lose a life! (3 lives total)
              </div>
            )}
          </div>

          <div className={styles.gameInfo}>
            <p>
              Current Player: <span className={styles.currentPlayerBadge}>{players[currentPlayer]}</span>
            </p>
            <p className={styles.letterHint}>
              {lastLetter ? (
                <>
                  Next word must start with: <span className={styles.letterHighlight}>{lastLetter.toUpperCase()}</span>
                </>
              ) : (
                "Start with any word!"
              )}
            </p>
          </div>

          {/* Show lifeline indicators only for players who have lost lives */}
          <div className={styles.playersLifelineSection}>
            {players.filter(player => !eliminated.includes(player) && playerLives[player] < 3).map(player => (
              <div key={player} className={styles.playerLifeline}>
                <span className={styles.playerLifelineName}>{player}:</span>
                <div className={styles.hearts}>
                  {[...Array(3)].map((_, i) => (
                    <span 
                      key={i} 
                      className={i < playerLives[player] ? styles.heartFull : styles.heartEmpty}
                    >
                      {i < playerLives[player] ? '❤️' : '🖤'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.wordInput}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isValidating) submitWord();
              }}
              placeholder="Enter word"
              className={inputStyles.input}
              disabled={isValidating}
              style={{ flex: 1, maxWidth: '400px' }}
            />
            <button 
              onClick={submitWord} 
              className={`${btnStyles.btn} ${btnStyles.btnPrimary}`}
              disabled={isValidating}
            >
              {isValidating ? "Validating..." : "Submit"}
            </button>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              ❌ {error}
            </div>
          )}

          <div className={styles.wordChain}>
            <p className={styles.wordChainTitle}>Used Words:</p>
            <p className={styles.wordList}>
              {usedWords.length > 0 ? usedWords.join(" → ") : "None yet"}
            </p>
          </div>

          {eliminated.length > 0 && (
            <div className={styles.eliminatedList}>
              <strong>Eliminated:</strong> {eliminated.join(", ")}
            </div>
          )}
        </>
      ) : (
        <div className={styles.winnerCard}>
          <h2 className={styles.winnerTitle}>🏆 Winner: {activePlayers[0]}</h2>
          <button 
            onClick={resetGame} 
            className={`${btnStyles.btn} ${btnStyles.btnSuccess} ${btnStyles.btnLarge}`}
          >
            Play Again
          </button>
        </div>
      )}
    </GameLayout>
  );
}

export default WordChain;
