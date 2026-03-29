import { useEffect, useState } from "react";
import styles from "../../styles/Ludo.module.css";

// Board is 15x15 grid
const CELL_SIZE = 40;
const BOARD_SIZE = 15;

// Color definitions matching Ludo King
const COLOR_CONFIG = {
  blue: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1565C0',
    home: '#1976D2',
    stretch: '#BBDEFB'
  },
  red: {
    main: '#F44336',
    light: '#EF5350',
    dark: '#C62828',
    home: '#D32F2F',
    stretch: '#FFCDD2'
  },
  yellow: {
    main: '#FDD835',
    light: '#FFEE58',
    dark: '#F9A825',
    home: '#FBC02D',
    stretch: '#FFF9C4'
  },
  green: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#2E7D32',
    home: '#388E3C',
    stretch: '#C8E6C9'
  }
};

// Convert grid position to pixel coordinates
const g2p = (x, y) => ({ x: x * CELL_SIZE, y: y * CELL_SIZE });

// Main path - 52 cells clockwise starting from Blue's entry
const MAIN_PATH = (() => {
  const path = [];
  
  // Blue section: starts at (1,6), goes right, then up
  path.push(g2p(1, 6)); // 0 - Blue start (safe)
  path.push(g2p(2, 6)); // 1
  path.push(g2p(3, 6)); // 2
  path.push(g2p(4, 6)); // 3
  path.push(g2p(5, 6)); // 4
  path.push(g2p(6, 5)); // 5
  path.push(g2p(6, 4)); // 6
  path.push(g2p(6, 3)); // 7
  path.push(g2p(6, 2)); // 8 - Safe spot (star)
  path.push(g2p(6, 1)); // 9
  path.push(g2p(6, 0)); // 10
  path.push(g2p(7, 0)); // 11
  path.push(g2p(8, 0)); // 12
  
  // Red section: starts at (8,1), goes down, then right
  path.push(g2p(8, 1)); // 13 - Red start (safe)
  path.push(g2p(8, 2)); // 14
  path.push(g2p(8, 3)); // 15
  path.push(g2p(8, 4)); // 16
  path.push(g2p(8, 5)); // 17
  path.push(g2p(9, 6)); // 18
  path.push(g2p(10, 6)); // 19
  path.push(g2p(11, 6)); // 20
  path.push(g2p(12, 6)); // 21 - Safe spot (star)
  path.push(g2p(13, 6)); // 22
  path.push(g2p(14, 6)); // 23
  path.push(g2p(14, 7)); // 24
  path.push(g2p(14, 8)); // 25
  
  // Green section: starts at (13,8), goes left, then down
  path.push(g2p(13, 8)); // 26 - Green start (safe)
  path.push(g2p(12, 8)); // 27
  path.push(g2p(11, 8)); // 28
  path.push(g2p(10, 8)); // 29
  path.push(g2p(9, 8)); // 30
  path.push(g2p(8, 9)); // 31
  path.push(g2p(8, 10)); // 32
  path.push(g2p(8, 11)); // 33
  path.push(g2p(8, 12)); // 34 - Safe spot (star)
  path.push(g2p(8, 13)); // 35
  path.push(g2p(8, 14)); // 36
  path.push(g2p(7, 14)); // 37
  path.push(g2p(6, 14)); // 38
  
  // Yellow section: starts at (6,13), goes up, then left
  path.push(g2p(6, 13)); // 39 - Yellow start (safe)
  path.push(g2p(6, 12)); // 40
  path.push(g2p(6, 11)); // 41
  path.push(g2p(6, 10)); // 42
  path.push(g2p(6, 9)); // 43
  path.push(g2p(5, 8)); // 44
  path.push(g2p(4, 8)); // 45
  path.push(g2p(3, 8)); // 46
  path.push(g2p(2, 8)); // 47 - Safe spot (star)
  path.push(g2p(1, 8)); // 48
  path.push(g2p(0, 8)); // 49
  path.push(g2p(0, 7)); // 50
  path.push(g2p(0, 6)); // 51
  
  return path;
})();

// Home bases - 4 token spots per player (larger circles)
const HOME_BASES = {
  blue: [g2p(1.3, 1.3), g2p(3.7, 1.3), g2p(1.3, 3.7), g2p(3.7, 3.7)],
  red: [g2p(10.3, 1.3), g2p(12.7, 1.3), g2p(10.3, 3.7), g2p(12.7, 3.7)],
  yellow: [g2p(1.3, 10.3), g2p(3.7, 10.3), g2p(1.3, 12.7), g2p(3.7, 12.7)],
  green: [g2p(10.3, 10.3), g2p(12.7, 10.3), g2p(10.3, 12.7), g2p(12.7, 12.7)]
};

// Home base circle radius
const HOME_CIRCLE_RADIUS = CELL_SIZE * 0.55;

// Starting positions on main path for each color
const START_POS = { blue: 0, red: 13, green: 26, yellow: 39 };

// Home stretch paths (6 cells leading to center)
const HOME_STRETCH = {
  blue: [g2p(1, 7), g2p(2, 7), g2p(3, 7), g2p(4, 7), g2p(5, 7), g2p(6, 7)],
  red: [g2p(7, 1), g2p(7, 2), g2p(7, 3), g2p(7, 4), g2p(7, 5), g2p(7, 6)],
  green: [g2p(13, 7), g2p(12, 7), g2p(11, 7), g2p(10, 7), g2p(9, 7), g2p(8, 7)],
  yellow: [g2p(7, 13), g2p(7, 12), g2p(7, 11), g2p(7, 10), g2p(7, 9), g2p(7, 8)]
};

// Safe spots (star positions) - indices on main path
const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47];

// Token component - Location pin/marker shape with smooth movement
function Token({ x, y, color, isMovable, onClick, tokenId }) {
  const config = COLOR_CONFIG[color];
  
  // Pin dimensions (relative, will be positioned via transform)
  const pinWidth = CELL_SIZE * 0.75;
  const pinHeight = CELL_SIZE * 0.95;
  const headRadius = pinWidth * 0.45;
  
  // Center offset
  const centerX = CELL_SIZE / 2;
  const centerY = CELL_SIZE / 2;
  
  // Pin path centered at origin
  const pinPath = `
    M 0 ${pinHeight * 0.35}
    C ${-pinWidth * 0.15} ${pinHeight * 0.1}
      ${-headRadius} ${-pinHeight * 0.15}
      ${-headRadius} ${-pinHeight * 0.25}
    A ${headRadius} ${headRadius} 0 1 1 ${headRadius} ${-pinHeight * 0.25}
    C ${headRadius} ${-pinHeight * 0.15}
      ${pinWidth * 0.15} ${pinHeight * 0.1}
      0 ${pinHeight * 0.35}
    Z
  `;
  
  return (
    <g 
      className={`${styles.tokenWrapper} ${isMovable ? styles.movableToken : ''}`}
      onClick={isMovable ? onClick : undefined}
      style={{ 
        transform: `translate(${x + centerX}px, ${y + centerY}px)`,
        cursor: isMovable ? 'pointer' : 'default'
      }}
    >
      {/* Movable glow effect */}
      {isMovable && (
        <>
          <circle cx={0} cy={-pinHeight * 0.1} r={headRadius + 6} fill="none" stroke="#FFD700" strokeWidth="3" className={styles.tokenGlow} />
          <circle cx={0} cy={-pinHeight * 0.1} r={headRadius + 10} fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.5" className={styles.tokenGlow2} />
        </>
      )}
      
      {/* Shadow */}
      <ellipse cx={2} cy={pinHeight * 0.4} rx={pinWidth * 0.35} ry={pinWidth * 0.12} fill="rgba(0,0,0,0.4)" />
      
      {/* Pin body - dark outline */}
      <path d={pinPath} fill={config.dark} transform="translate(1, 1)" />
      
      {/* Pin body - main color fill */}
      <path d={pinPath} fill={config.main} stroke={config.dark} strokeWidth="2" />
      
      {/* Gradient overlay for 3D effect */}
      <path d={pinPath} fill="url(#tokenShine)" />
      
      {/* Inner circle (white ring inside pin head) */}
      <circle cx={0} cy={-pinHeight * 0.25} r={headRadius * 0.55} fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.85" />
      
      {/* Inner dot */}
      <circle cx={0} cy={-pinHeight * 0.25} r={headRadius * 0.25} fill="#fff" opacity="0.9" />
      
      {/* Highlight on top */}
      <ellipse cx={-headRadius * 0.25} cy={-pinHeight * 0.35} rx={headRadius * 0.2} ry={headRadius * 0.12} fill="#fff" opacity="0.6" />
    </g>
  );
}

// Dice component
function Dice({ value, isActive, isRolling, onClick, color }) {
  const config = COLOR_CONFIG[color] || { main: '#666', dark: '#444' };
  
  const dotPositions = {
    1: [[0.5, 0.5]],
    2: [[0.28, 0.28], [0.72, 0.72]],
    3: [[0.28, 0.28], [0.5, 0.5], [0.72, 0.72]],
    4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
    5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
    6: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.5], [0.72, 0.5], [0.28, 0.72], [0.72, 0.72]]
  };

  const dots = dotPositions[value] || dotPositions[1];

  return (
    <div 
      className={`${styles.dice} ${isActive ? styles.diceActive : styles.diceInactive} ${isRolling ? styles.diceRolling : ''}`}
      onClick={isActive && !isRolling ? onClick : undefined}
    >
      <div className={styles.diceFace}>
        {dots.map((pos, i) => (
          <div 
            key={i} 
            className={styles.diceDot}
            style={{
              left: `${pos[0] * 100}%`,
              top: `${pos[1] * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function LudoBoard({ 
  tokens, 
  activeColors,
  currentPlayerIndex,
  currentColor,
  movableTokens, 
  onTokenClick, 
  diceValue, 
  canRoll, 
  onRollDice,
  playerNames
}) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState(1);

  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setDisplayDice(Math.floor(Math.random() * 6) + 1);
      }, 80);
      
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setIsRolling(false);
        if (diceValue) setDisplayDice(diceValue);
      }, 500);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isRolling, diceValue]);

  useEffect(() => {
    if (diceValue) {
      setDisplayDice(diceValue);
    }
  }, [diceValue]);

  const handleDiceClick = () => {
    if (canRoll && !isRolling) {
      setIsRolling(true);
      setTimeout(() => {
        onRollDice();
      }, 500);
    }
  };

  // Calculate token position on board
  const getTokenPosition = (color, token) => {
    if (token.isHome || token.position === -1) {
      return HOME_BASES[color][token.id];
    }
    
    // Finished token - at center
    if (token.isFinished || token.position >= 58) {
      const offsets = { blue: [-10, -10], red: [10, -10], green: [10, 10], yellow: [-10, 10] };
      const off = offsets[color] || [0, 0];
      return { x: 7 * CELL_SIZE + off[0], y: 7 * CELL_SIZE + off[1] };
    }
    
    // In home stretch (positions 52-57)
    if (token.position >= 52) {
      const idx = token.position - 52;
      if (idx < 6) {
        return HOME_STRETCH[color][idx];
      }
      // Position 58+ means finished
      const offsets = { blue: [-10, -10], red: [10, -10], green: [10, 10], yellow: [-10, 10] };
      const off = offsets[color] || [0, 0];
      return { x: 7 * CELL_SIZE + off[0], y: 7 * CELL_SIZE + off[1] };
    }
    
    // On main path - calculate absolute position
    const startPos = START_POS[color];
    const absolutePos = (startPos + token.position) % 52;
    return MAIN_PATH[absolutePos];
  };

  // Helper function to get all tokens at a specific position with their colors
  const getTokensAtPosition = (targetColor, targetToken) => {
    const targetPos = getTokenPosition(targetColor, targetToken);
    if (!targetPos) return [];
    
    const tokensAtPos = [];
    activeColors.forEach(color => {
      tokens[color]?.forEach((token, idx) => {
        const pos = getTokenPosition(color, token);
        if (pos && Math.abs(pos.x - targetPos.x) < 1 && Math.abs(pos.y - targetPos.y) < 1) {
          tokensAtPos.push({ color, idx, token });
        }
      });
    });
    return tokensAtPos;
  };

  // Calculate offset for stacked tokens
  const getTokenOffset = (color, tokenIdx, token) => {
    const tokensAtPos = getTokensAtPosition(color, token);
    
    // If only one token at this position, no offset
    if (tokensAtPos.length <= 1) {
      return { x: 0, y: 0 };
    }
    
    // Find index of current token in the stack
    const stackIndex = tokensAtPos.findIndex(t => t.color === color && t.idx === tokenIdx);
    
    // Create circular offset pattern for multiple tokens
    if (tokensAtPos.length === 2) {
      // Side by side
      return stackIndex === 0 ? { x: -8, y: 0 } : { x: 8, y: 0 };
    } else if (tokensAtPos.length === 3) {
      // Triangle pattern
      const offsets = [
        { x: 0, y: -8 },
        { x: -8, y: 6 },
        { x: 8, y: 6 }
      ];
      return offsets[stackIndex] || { x: 0, y: 0 };
    } else {
      // Square pattern for 4+ tokens
      const offsets = [
        { x: -8, y: -8 },
        { x: 8, y: -8 },
        { x: -8, y: 8 },
        { x: 8, y: 8 }
      ];
      return offsets[stackIndex] || { x: 0, y: 0 };
    }
  };

  const boardPixels = BOARD_SIZE * CELL_SIZE;
  const numPlayers = activeColors.length;

  // Helper to check if a color is active
  const isColorActive = (color) => activeColors.includes(color);
  
  // Get player index for a color
  const getPlayerIndex = (color) => activeColors.indexOf(color);

  // Render star shape for safe spots
  const renderStar = (cx, cy, size = 12) => {
    const points = [];
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 72 - 90) * Math.PI / 180;
      const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
      points.push(`${cx + size * Math.cos(outerAngle)},${cy + size * Math.sin(outerAngle)}`);
      points.push(`${cx + size * 0.4 * Math.cos(innerAngle)},${cy + size * 0.4 * Math.sin(innerAngle)}`);
    }
    return (
      <polygon 
        points={points.join(' ')} 
        fill="#FFD700" 
        stroke="#FF8F00" 
        strokeWidth="1.5"
      />
    );
  };

  // Render player panel
  const renderPlayerPanel = (color, playerIdx, position) => {
    if (!isColorActive(color)) return null;
    
    const config = COLOR_CONFIG[color];
    const isActive = currentPlayerIndex === playerIdx;
    const name = playerNames[playerIdx] || color.charAt(0).toUpperCase() + color.slice(1);
    
    return (
      <div 
        className={`${styles.playerPanel} ${styles[`panel${color.charAt(0).toUpperCase() + color.slice(1)}`]} ${isActive ? styles.panelActive : ''}`}
        style={{ gridArea: position }}
      >
        <div className={styles.panelInfo}>
          <div className={styles.panelAvatar} style={{ backgroundColor: config.main }}>
            {name[0].toUpperCase()}
          </div>
          <span className={styles.panelName}>{name}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.gameContainer}>
      {/* Right side panels - moved to top */}
      <div className={styles.rightPanelsContainer}>
        {renderPlayerPanel('red', getPlayerIndex('red'), 'player')}
        {renderPlayerPanel('blue', getPlayerIndex('blue'), 'player')}
        {renderPlayerPanel('yellow', getPlayerIndex('yellow'), 'player')}
        {renderPlayerPanel('green', getPlayerIndex('green'), 'player')}
      </div>

      {/* Main board area */}
      <div className={styles.boardArea}>
        {/* Board wrapper - contains the SVG board and dice */}
        <div className={styles.boardWrapper}>
          {/* Dice positioned outside the board - one for each player */}
          {/* Blue - Top Left */}
          {isColorActive('blue') && currentColor === 'blue' && (
            <div className={`${styles.diceContainer} ${styles.diceBlue}`}>
              <Dice 
                value={displayDice} 
                isActive={canRoll} 
                isRolling={isRolling}
                onClick={handleDiceClick}
                color="blue"
              />
            </div>
          )}
          
          {/* Red - Top Right */}
          {isColorActive('red') && currentColor === 'red' && (
            <div className={`${styles.diceContainer} ${styles.diceRed}`}>
              <Dice 
                value={displayDice} 
                isActive={canRoll} 
                isRolling={isRolling}
                onClick={handleDiceClick}
                color="red"
              />
            </div>
          )}
          
          {/* Yellow - Bottom Left */}
          {isColorActive('yellow') && currentColor === 'yellow' && (
            <div className={`${styles.diceContainer} ${styles.diceYellow}`}>
              <Dice 
                value={displayDice} 
                isActive={canRoll} 
                isRolling={isRolling}
                onClick={handleDiceClick}
                color="yellow"
              />
            </div>
          )}
          
          {/* Green - Bottom Right */}
          {isColorActive('green') && currentColor === 'green' && (
            <div className={`${styles.diceContainer} ${styles.diceGreen}`}>
              <Dice 
                value={displayDice} 
                isActive={canRoll} 
                isRolling={isRolling}
                onClick={handleDiceClick}
                color="green"
              />
            </div>
          )}

          <svg 
            className={styles.ludoBoard}
            viewBox={`0 0 ${boardPixels} ${boardPixels}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <radialGradient id="tokenShine" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="white" stopOpacity="0.5"/>
                <stop offset="50%" stopColor="white" stopOpacity="0.15"/>
                <stop offset="100%" stopColor="white" stopOpacity="0"/>
              </radialGradient>
            </defs>

            {/* Board background */}
            <rect width={boardPixels} height={boardPixels} fill="#F5F5DC" />

            {/* === HOME AREAS === */}
            
            {/* Blue Home - Top Left */}
            <rect x={0} y={0} width={6*CELL_SIZE} height={6*CELL_SIZE} 
              fill={COLOR_CONFIG.blue.home} stroke={COLOR_CONFIG.blue.dark} strokeWidth="3" />
            <rect x={CELL_SIZE*0.7} y={CELL_SIZE*0.7} width={4.6*CELL_SIZE} height={4.6*CELL_SIZE} 
              fill="#FAFAFA" rx="8" stroke="#E0E0E0" strokeWidth="2" />
            {HOME_BASES.blue.map((pos, i) => (
              <g key={`blue-base-${i}`}>
                <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={HOME_CIRCLE_RADIUS} 
                  fill={COLOR_CONFIG.blue.main} stroke={COLOR_CONFIG.blue.dark} strokeWidth="2.5" />
                <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={HOME_CIRCLE_RADIUS * 0.6} 
                  fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" />
              </g>
            ))}
            
            {/* Red Home - Top Right */}
            <rect x={9*CELL_SIZE} y={0} width={6*CELL_SIZE} height={6*CELL_SIZE} 
              fill={COLOR_CONFIG.red.home} stroke={COLOR_CONFIG.red.dark} strokeWidth="3" />
            <rect x={9.7*CELL_SIZE} y={CELL_SIZE*0.7} width={4.6*CELL_SIZE} height={4.6*CELL_SIZE} 
              fill="#FAFAFA" rx="8" stroke="#E0E0E0" strokeWidth="2" />
            {HOME_BASES.red.map((pos, i) => (
              <g key={`red-base-${i}`}>
                <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={HOME_CIRCLE_RADIUS} 
                  fill={COLOR_CONFIG.red.main} stroke={COLOR_CONFIG.red.dark} strokeWidth="2.5" />
                <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={HOME_CIRCLE_RADIUS * 0.6} 
                  fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" />
              </g>
            ))}
            
            {/* Yellow Home - Bottom Left */}
            <rect x={0} y={9*CELL_SIZE} width={6*CELL_SIZE} height={6*CELL_SIZE} 
              fill={COLOR_CONFIG.yellow.home} stroke={COLOR_CONFIG.yellow.dark} strokeWidth="3" />
            <rect x={CELL_SIZE*0.7} y={9.7*CELL_SIZE} width={4.6*CELL_SIZE} height={4.6*CELL_SIZE} 
              fill="#FAFAFA" rx="8" stroke="#E0E0E0" strokeWidth="2" />
            {HOME_BASES.yellow.map((pos, i) => (
              <g key={`yellow-base-${i}`}>
                <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={HOME_CIRCLE_RADIUS} 
                  fill={COLOR_CONFIG.yellow.main} stroke={COLOR_CONFIG.yellow.dark} strokeWidth="2.5" />
                <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={HOME_CIRCLE_RADIUS * 0.6} 
                  fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" />
              </g>
            ))}
            
            {/* Green Home - Bottom Right */}
            <rect x={9*CELL_SIZE} y={9*CELL_SIZE} width={6*CELL_SIZE} height={6*CELL_SIZE} 
              fill={COLOR_CONFIG.green.home} stroke={COLOR_CONFIG.green.dark} strokeWidth="3" />
            <rect x={9.7*CELL_SIZE} y={9.7*CELL_SIZE} width={4.6*CELL_SIZE} height={4.6*CELL_SIZE} 
              fill="#FAFAFA" rx="8" stroke="#E0E0E0" strokeWidth="2" />
            {HOME_BASES.green.map((pos, i) => (
              <g key={`green-base-${i}`}>
                <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={HOME_CIRCLE_RADIUS} 
                  fill={COLOR_CONFIG.green.main} stroke={COLOR_CONFIG.green.dark} strokeWidth="2.5" />
                <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={HOME_CIRCLE_RADIUS * 0.6} 
                  fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" />
              </g>
            ))}

            {/* === PATH CELLS === */}
            
            {/* Left columns (cols 0-2, rows 6-8) */}
            {[0, 1, 2].map(col => 
              [6, 7, 8].map(row => (
                <rect key={`path-l-${col}-${row}`} 
                  x={col * CELL_SIZE} y={row * CELL_SIZE}
                  width={CELL_SIZE} height={CELL_SIZE}
                  fill="#FAFAFA" stroke="#BDBDBD" strokeWidth="1" />
              ))
            )}
            
            {/* Right columns (cols 12-14, rows 6-8) */}
            {[12, 13, 14].map(col => 
              [6, 7, 8].map(row => (
                <rect key={`path-r-${col}-${row}`} 
                  x={col * CELL_SIZE} y={row * CELL_SIZE}
                  width={CELL_SIZE} height={CELL_SIZE}
                  fill="#FAFAFA" stroke="#BDBDBD" strokeWidth="1" />
              ))
            )}
            
            {/* Top rows (cols 6-8, rows 0-2) */}
            {[6, 7, 8].map(col => 
              [0, 1, 2].map(row => (
                <rect key={`path-t-${col}-${row}`} 
                  x={col * CELL_SIZE} y={row * CELL_SIZE}
                  width={CELL_SIZE} height={CELL_SIZE}
                  fill="#FAFAFA" stroke="#BDBDBD" strokeWidth="1" />
              ))
            )}
            
            {/* Bottom rows (cols 6-8, rows 12-14) */}
            {[6, 7, 8].map(col => 
              [12, 13, 14].map(row => (
                <rect key={`path-b-${col}-${row}`} 
                  x={col * CELL_SIZE} y={row * CELL_SIZE}
                  width={CELL_SIZE} height={CELL_SIZE}
                  fill="#FAFAFA" stroke="#BDBDBD" strokeWidth="1" />
              ))
            )}

            {/* Cross center paths (cols 3-5 & 9-11, row 6-8 for horizontal; col 6-8, rows 3-5 & 9-11 for vertical) */}
            {[3, 4, 5, 9, 10, 11].map(col => 
              [6, 7, 8].map(row => (
                <rect key={`path-hc-${col}-${row}`} 
                  x={col * CELL_SIZE} y={row * CELL_SIZE}
                  width={CELL_SIZE} height={CELL_SIZE}
                  fill="#FAFAFA" stroke="#BDBDBD" strokeWidth="1" />
              ))
            )}
            {[6, 7, 8].map(col => 
              [3, 4, 5, 9, 10, 11].map(row => (
                <rect key={`path-vc-${col}-${row}`} 
                  x={col * CELL_SIZE} y={row * CELL_SIZE}
                  width={CELL_SIZE} height={CELL_SIZE}
                  fill="#FAFAFA" stroke="#BDBDBD" strokeWidth="1" />
              ))
            )}

            {/* === HOME STRETCH COLORED PATHS === */}
            
            {/* Blue stretch (row 7, cols 1-6) */}
            {HOME_STRETCH.blue.map((pos, i) => (
              <rect key={`blue-str-${i}`} x={pos.x} y={pos.y}
                width={CELL_SIZE} height={CELL_SIZE}
                fill={COLOR_CONFIG.blue.stretch} stroke={COLOR_CONFIG.blue.main} strokeWidth="2" />
            ))}
            
            {/* Red stretch (col 7, rows 1-6) */}
            {HOME_STRETCH.red.map((pos, i) => (
              <rect key={`red-str-${i}`} x={pos.x} y={pos.y}
                width={CELL_SIZE} height={CELL_SIZE}
                fill={COLOR_CONFIG.red.stretch} stroke={COLOR_CONFIG.red.main} strokeWidth="2" />
            ))}
            
            {/* Green stretch (row 7, cols 8-13) */}
            {HOME_STRETCH.green.map((pos, i) => (
              <rect key={`green-str-${i}`} x={pos.x} y={pos.y}
                width={CELL_SIZE} height={CELL_SIZE}
                fill={COLOR_CONFIG.green.stretch} stroke={COLOR_CONFIG.green.main} strokeWidth="2" />
            ))}
            
            {/* Yellow stretch (col 7, rows 8-13) */}
            {HOME_STRETCH.yellow.map((pos, i) => (
              <rect key={`yellow-str-${i}`} x={pos.x} y={pos.y}
                width={CELL_SIZE} height={CELL_SIZE}
                fill={COLOR_CONFIG.yellow.stretch} stroke={COLOR_CONFIG.yellow.main} strokeWidth="2" />
            ))}

            {/* === CENTER TRIANGLES === */}
            <polygon points={`${6*CELL_SIZE},${6*CELL_SIZE} ${7.5*CELL_SIZE},${7.5*CELL_SIZE} ${6*CELL_SIZE},${9*CELL_SIZE}`}
              fill={COLOR_CONFIG.blue.main} stroke={COLOR_CONFIG.blue.dark} strokeWidth="2" />
            <polygon points={`${6*CELL_SIZE},${6*CELL_SIZE} ${7.5*CELL_SIZE},${7.5*CELL_SIZE} ${9*CELL_SIZE},${6*CELL_SIZE}`}
              fill={COLOR_CONFIG.red.main} stroke={COLOR_CONFIG.red.dark} strokeWidth="2" />
            <polygon points={`${9*CELL_SIZE},${6*CELL_SIZE} ${7.5*CELL_SIZE},${7.5*CELL_SIZE} ${9*CELL_SIZE},${9*CELL_SIZE}`}
              fill={COLOR_CONFIG.green.main} stroke={COLOR_CONFIG.green.dark} strokeWidth="2" />
            <polygon points={`${6*CELL_SIZE},${9*CELL_SIZE} ${7.5*CELL_SIZE},${7.5*CELL_SIZE} ${9*CELL_SIZE},${9*CELL_SIZE}`}
              fill={COLOR_CONFIG.yellow.main} stroke={COLOR_CONFIG.yellow.dark} strokeWidth="2" />

            {/* === START POSITIONS (colored cells with arrows) === */}
            <rect x={1*CELL_SIZE} y={6*CELL_SIZE} width={CELL_SIZE} height={CELL_SIZE}
              fill={COLOR_CONFIG.blue.stretch} stroke={COLOR_CONFIG.blue.main} strokeWidth="2.5" />
            <text x={1.5*CELL_SIZE} y={6.65*CELL_SIZE} fontSize="20" fill={COLOR_CONFIG.blue.dark} textAnchor="middle" fontWeight="bold">→</text>
            
            <rect x={8*CELL_SIZE} y={1*CELL_SIZE} width={CELL_SIZE} height={CELL_SIZE}
              fill={COLOR_CONFIG.red.stretch} stroke={COLOR_CONFIG.red.main} strokeWidth="2.5" />
            <text x={8.5*CELL_SIZE} y={1.7*CELL_SIZE} fontSize="20" fill={COLOR_CONFIG.red.dark} textAnchor="middle" fontWeight="bold">↓</text>
            
            <rect x={13*CELL_SIZE} y={8*CELL_SIZE} width={CELL_SIZE} height={CELL_SIZE}
              fill={COLOR_CONFIG.green.stretch} stroke={COLOR_CONFIG.green.main} strokeWidth="2.5" />
            <text x={13.5*CELL_SIZE} y={8.65*CELL_SIZE} fontSize="20" fill={COLOR_CONFIG.green.dark} textAnchor="middle" fontWeight="bold">←</text>
            
            <rect x={6*CELL_SIZE} y={13*CELL_SIZE} width={CELL_SIZE} height={CELL_SIZE}
              fill={COLOR_CONFIG.yellow.stretch} stroke={COLOR_CONFIG.yellow.main} strokeWidth="2.5" />
            <text x={6.5*CELL_SIZE} y={13.7*CELL_SIZE} fontSize="20" fill={COLOR_CONFIG.yellow.dark} textAnchor="middle" fontWeight="bold">↑</text>

            {/* === SAFE SPOTS (STARS) === */}
            {SAFE_SPOTS.map((idx) => {
              const pos = MAIN_PATH[idx];
              if (!pos) return null;
              const cx = pos.x + CELL_SIZE / 2;
              const cy = pos.y + CELL_SIZE / 2;
              return (
                <g key={`star-${idx}`}>
                  {renderStar(cx, cy, 14)}
                </g>
              );
            })}

            {/* === TOKENS === */}
            {tokens && (() => {
              // Collect all tokens with their render info
              const allTokensToRender = [];
              
              activeColors.forEach(color => {
                tokens[color]?.forEach((token, idx) => {
                  const pos = getTokenPosition(color, token);
                  if (!pos) return;

                  const playerIdx = getPlayerIndex(color);
                  const isMovable = movableTokens?.includes(idx) && playerIdx === currentPlayerIndex;
                  const offset = getTokenOffset(color, idx, token);

                  allTokensToRender.push({
                    color,
                    idx,
                    token,
                    pos,
                    offset,
                    isMovable,
                    playerIdx,
                    isCurrentPlayer: playerIdx === currentPlayerIndex
                  });
                });
              });

              // Sort tokens: current player's tokens render last (appear on top)
              allTokensToRender.sort((a, b) => {
                // Current player's tokens should come last
                if (a.isCurrentPlayer && !b.isCurrentPlayer) return 1;
                if (!a.isCurrentPlayer && b.isCurrentPlayer) return -1;
                // For same player status, maintain original order
                return 0;
              });

              // Render all tokens in sorted order
              return allTokensToRender.map(({ color, idx, pos, offset, isMovable }) => (
                <Token
                  key={`token-${color}-${idx}`}
                  x={pos.x + offset.x}
                  y={pos.y + offset.y}
                  color={color}
                  tokenId={idx}
                  isMovable={isMovable}
                  onClick={() => onTokenClick(idx)}
                />
              ));
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
}

export default LudoBoard;
