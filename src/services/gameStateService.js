/**
 * Game State Service
 * Manages saving, loading, and clearing game states in localStorage
 * with automatic expiration after 2 minutes
 */

const EXPIRATION_TIME = 2 * 60 * 1000; // 2 minutes in milliseconds

/**
 * Save game state to localStorage with timestamp
 * @param {string} gameId - Unique identifier for the game (e.g., 'ludo', 'tic-tac-toe')
 * @param {object} state - Game state object to save
 */
export const saveGameState = (gameId, state) => {
  try {
    const stateWithTimestamp = {
      state,
      timestamp: Date.now(),
    };
    localStorage.setItem(`gameState_${gameId}`, JSON.stringify(stateWithTimestamp));
  } catch (error) {
    console.error(`Error saving game state for ${gameId}:`, error);
  }
};

/**
 * Load game state from localStorage
 * Returns null if state doesn't exist or has expired
 * @param {string} gameId - Unique identifier for the game
 * @returns {object|null} - Game state or null if expired/not found
 */
export const loadGameState = (gameId) => {
  try {
    const savedData = localStorage.getItem(`gameState_${gameId}`);
    if (!savedData) {
      return null;
    }

    const { state, timestamp } = JSON.parse(savedData);
    const now = Date.now();
    
    // Check if state has expired (older than 2 minutes)
    if (now - timestamp > EXPIRATION_TIME) {
      // Auto-clear expired state
      clearGameState(gameId);
      return null;
    }

    return state;
  } catch (error) {
    console.error(`Error loading game state for ${gameId}:`, error);
    return null;
  }
};

/**
 * Clear game state from localStorage
 * @param {string} gameId - Unique identifier for the game
 */
export const clearGameState = (gameId) => {
  try {
    localStorage.removeItem(`gameState_${gameId}`);
  } catch (error) {
    console.error(`Error clearing game state for ${gameId}:`, error);
  }
};

/**
 * Check if a saved game state exists and is valid
 * @param {string} gameId - Unique identifier for the game
 * @returns {boolean} - True if valid saved state exists
 */
export const hasSavedGameState = (gameId) => {
  const state = loadGameState(gameId);
  return state !== null;
};

/**
 * Get time remaining before state expires
 * @param {string} gameId - Unique identifier for the game
 * @returns {number} - Seconds remaining, or 0 if expired/not found
 */
export const getTimeRemaining = (gameId) => {
  try {
    const savedData = localStorage.getItem(`gameState_${gameId}`);
    if (!savedData) {
      return 0;
    }

    const { timestamp } = JSON.parse(savedData);
    const now = Date.now();
    const elapsed = now - timestamp;
    
    if (elapsed > EXPIRATION_TIME) {
      return 0;
    }

    return Math.ceil((EXPIRATION_TIME - elapsed) / 1000); // Return seconds remaining
  } catch (error) {
    console.error(`Error getting time remaining for ${gameId}:`, error);
    return 0;
  }
};
