import React, { useState, useCallback } from 'react';
import { useSnakeGame } from './hooks/useSnakeGame';
import { useSpaceImpact } from './hooks/useSpaceImpact';
import { useTetris } from './hooks/useTetris';
import { use2048 } from './hooks/use2048';
import { useQuantumSnake } from './hooks/useQuantumSnake';
import { useSonar } from './hooks/useSonar';
import { usePacman } from './hooks/usePacman';
import { useAudio } from './hooks/useAudio';
import Board from './components/Board';
import SpaceBoard from './components/SpaceBoard';
import TetrisBoard from './components/TetrisBoard';
import Board2048 from './components/Board2048';
import QuantumBoard from './components/QuantumBoard';
import SonarBoard from './components/SonarBoard';
import PacmanBoard from './components/PacmanBoard';
import Controls from './components/Controls';
import MarioCanvas from './components/MarioCanvas';
import './index.css';

const GAME_LIST = [
  { id: 'snake', name: 'SNAKE II' },
  { id: 'mario', name: 'SUPER MARIO' },
  { id: 'space', name: 'SPACE IMPACT' },
  { id: 'tetris', name: 'TETRIS' },
  { id: '2048', name: '2048 CLASSIC' },
  { id: 'quantum', name: 'QUANTUM SNAKE' },
  { id: 'sonar', name: 'SONAR' },
  { id: 'pacman', name: 'PACMAN' }
];

function App() {
  const { playSound } = useAudio();
  const [activeGame, setActiveGame] = useState('menu');
  const [menuIndex, setMenuIndex] = useState(0);

  // Snake Game Hooks
  const snakeGame = useSnakeGame();

  // Space Impact Hooks
  const spaceGame = useSpaceImpact();

  // Tetris Hooks
  const tetrisGame = useTetris();

  // 2048 Hooks
  const game2048 = use2048();

  // Quantum Snake Hooks
  const quantumGame = useQuantumSnake();

  // Sonar Hooks
  const sonarGame = useSonar();

  // Pacman Hooks
  const pacmanGame = usePacman();

  // Menu Logic
  const handleMenuNav = useCallback((direction) => {
    if (activeGame !== 'menu') return;
    playSound('nav');
    if (direction === 'up') {
      setMenuIndex(prev => (prev - 1 + GAME_LIST.length) % GAME_LIST.length);
    } else if (direction === 'down') {
      setMenuIndex(prev => (prev + 1) % GAME_LIST.length);
    }
  }, [activeGame, playSound]);

  const handleMenuSelect = useCallback(() => {
    if (activeGame !== 'menu') return;
    const selected = GAME_LIST[menuIndex];
    if (!selected.locked) {
      playSound('select');
      setActiveGame(selected.id);
      if (selected.id === 'snake') snakeGame.resetGame();
      if (selected.id === 'tetris') tetrisGame.resetGame();
      if (selected.id === '2048') game2048.resetGame();
      if (selected.id === 'quantum') quantumGame.resetGame();
      if (selected.id === 'sonar') sonarGame.resetGame();
      if (selected.id === 'pacman') pacmanGame.resetGame();
    } else {
      playSound('nav');
    }
  }, [activeGame, menuIndex, playSound, snakeGame, tetrisGame, game2048, quantumGame, sonarGame, pacmanGame]);

  const returnToMenu = useCallback(() => {
    setActiveGame('menu');
  }, []);

  // Dynamic browser tab title
  React.useEffect(() => {
    const game = GAME_LIST.find(g => g.id === activeGame);
    document.title = game ? `Nokia - ${game.name}` : 'Nokia Games';
  }, [activeGame]);

  // Track which direction keys are held for visual D-pad feedback
  const [pressedKeys, setPressedKeys] = React.useState(new Set());

  // Keyboard handling for menu, snake, space, and tetris
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Track pressed direction for visual feedback
      const dirKey = {
        'ArrowUp': 'up', 'w': 'up', 'W': 'up',
        'ArrowDown': 'down', 's': 'down', 'S': 'down',
        'ArrowLeft': 'left', 'a': 'left', 'A': 'left',
        'ArrowRight': 'right', 'd': 'right', 'D': 'right'
      }[e.key];
      if (dirKey) {
        setPressedKeys(prev => new Set(prev).add(dirKey));
      }

      if (activeGame === 'menu') {
        if (e.key === 'ArrowUp' || e.key === 'w') handleMenuNav('up');
        if (e.key === 'ArrowDown' || e.key === 's') handleMenuNav('down');
        if (e.key === 'Enter' || e.key === ' ') handleMenuSelect();
      } else if (activeGame === 'snake') {
        if (e.key === 'ArrowUp' || e.key === 'w') snakeGame.changeDirection({ x: 0, y: -1 });
        if (e.key === 'ArrowDown' || e.key === 's') snakeGame.changeDirection({ x: 0, y: 1 });
        if (e.key === 'ArrowLeft' || e.key === 'a') snakeGame.changeDirection({ x: -1, y: 0 });
        if (e.key === 'ArrowRight' || e.key === 'd') snakeGame.changeDirection({ x: 1, y: 0 });
        if (e.key === 'Escape' || e.key === 'm') returnToMenu();
      } else if (activeGame === 'space') {
        if (e.key === 'ArrowUp' || e.key === 'w') spaceGame.handleInput({ y: -1 });
        if (e.key === 'ArrowDown' || e.key === 's') spaceGame.handleInput({ y: 1 });
        if (e.key === ' ' || e.key === 'k') spaceGame.handleInput({ action: true });
        if (e.key === 'Enter') spaceGame.handleInput({ action: true });
        if (e.key === 'Escape' || e.key === 'm') returnToMenu();
      } else if (activeGame === 'tetris') {
        if (e.key === 'ArrowLeft' || e.key === 'a') tetrisGame.moveLeft();
        if (e.key === 'ArrowRight' || e.key === 'd') tetrisGame.moveRight();
        if (e.key === 'ArrowDown' || e.key === 's') tetrisGame.moveDown();
        if (e.key === 'ArrowUp' || e.key === 'w') tetrisGame.rotate();
        if (e.key === ' ') tetrisGame.hardDrop();
        if (e.key === 'Enter' && tetrisGame.status !== 'playing') tetrisGame.resetGame();
        if (e.key === 'Escape' || e.key === 'm') returnToMenu();
      } else if (activeGame === '2048') {
        if (e.key === 'ArrowLeft' || e.key === 'a') game2048.move('left');
        if (e.key === 'ArrowRight' || e.key === 'd') game2048.move('right');
        if (e.key === 'ArrowUp' || e.key === 'w') game2048.move('up');
        if (e.key === 'ArrowDown' || e.key === 's') game2048.move('down');
        if (e.key === 'Enter' && game2048.status !== 'playing') game2048.resetGame();
        if (e.key === 'Escape' || e.key === 'm') returnToMenu();
      } else if (activeGame === 'quantum') {
        if (e.key === 'ArrowUp' || e.key === 'w') quantumGame.changeDirection({ x: 0, y: -1 });
        if (e.key === 'ArrowDown' || e.key === 's') quantumGame.changeDirection({ x: 0, y: 1 });
        if (e.key === 'ArrowLeft' || e.key === 'a') quantumGame.changeDirection({ x: -1, y: 0 });
        if (e.key === 'ArrowRight' || e.key === 'd') quantumGame.changeDirection({ x: 1, y: 0 });
        if (e.key === 'Enter' && quantumGame.status !== 'playing') quantumGame.resetGame();
        if (e.key === 'Escape' || e.key === 'm') returnToMenu();
      } else if (activeGame === 'sonar') {
        if (e.key === 'ArrowUp' || e.key === 'w') sonarGame.move({ x: 0, y: -1 });
        if (e.key === 'ArrowDown' || e.key === 's') sonarGame.move({ x: 0, y: 1 });
        if (e.key === 'ArrowLeft' || e.key === 'a') sonarGame.move({ x: -1, y: 0 });
        if (e.key === 'ArrowRight' || e.key === 'd') sonarGame.move({ x: 1, y: 0 });
        if (e.key === ' ') sonarGame.ping();
        if (e.key === 'h' || e.key === 'H') sonarGame.toggleHelp();
        if (e.key === 'Escape' || e.key === 'm') returnToMenu();
      } else if (activeGame === 'pacman') {
        if (e.key === 'ArrowUp' || e.key === 'w') pacmanGame.changeDirection({ x: 0, y: -1 });
        if (e.key === 'ArrowDown' || e.key === 's') pacmanGame.changeDirection({ x: 0, y: 1 });
        if (e.key === 'ArrowLeft' || e.key === 'a') pacmanGame.changeDirection({ x: -1, y: 0 });
        if (e.key === 'ArrowRight' || e.key === 'd') pacmanGame.changeDirection({ x: 1, y: 0 });
        if (e.key === 'Enter' && pacmanGame.status !== 'playing') pacmanGame.resetGame();
        if (e.key === 'Escape' || e.key === 'm') returnToMenu();
      }
    };

    const handleKeyUp = (e) => {
      // Remove direction key visual
      const dirKey = {
        'ArrowUp': 'up', 'w': 'up', 'W': 'up',
        'ArrowDown': 'down', 's': 'down', 'S': 'down',
        'ArrowLeft': 'left', 'a': 'left', 'A': 'left',
        'ArrowRight': 'right', 'd': 'right', 'D': 'right'
      }[e.key];
      if (dirKey) {
        setPressedKeys(prev => {
          const next = new Set(prev);
          next.delete(dirKey);
          return next;
        });
      }

      if (activeGame === 'space') {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'ArrowDown' || e.key === 's') {
          spaceGame.handleInput({ y: 0 });
        }
        if (e.key === ' ' || e.key === 'k') {
          spaceGame.handleInput({ action: false });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeGame, handleMenuNav, handleMenuSelect, snakeGame, spaceGame, tetrisGame, game2048, quantumGame, sonarGame, pacmanGame, returnToMenu]);

  // If Mario is selected, render the dedicated Mario canvas
  if (activeGame === 'mario') {
    return <MarioCanvas onBack={returnToMenu} />;
  }

  // Render Nokia phone for menu, snake, and space impact
  // Calculate visible window for menu (show only 4 items)
  const VISIBLE_ITEMS = 4;
  const getVisibleRange = () => {
    // Keep selected item visible, adjust window
    let start = Math.max(0, menuIndex - VISIBLE_ITEMS + 2);
    start = Math.min(start, Math.max(0, GAME_LIST.length - VISIBLE_ITEMS));
    return { start, end: start + VISIBLE_ITEMS };
  };

  const renderScreenContent = () => {
    if (activeGame === 'menu') {
      const { start, end } = getVisibleRange();
      const visibleGames = GAME_LIST.slice(start, end);

      return (
        <div className="menu-list">
          {start > 0 && <div className="menu-scroll-indicator top">▲</div>}
          {visibleGames.map((game, idx) => {
            const actualIndex = start + idx;
            return (
              <div
                key={game.id}
                className={`menu-item ${actualIndex === menuIndex ? 'selected' : ''}`}
                style={{ opacity: game.locked ? 0.5 : 1 }}
              >
                {game.name} {game.locked && '🔒'}
              </div>
            );
          })}
          {end < GAME_LIST.length && <div className="menu-scroll-indicator bottom">▼</div>}
        </div>
      );
    }

    if (activeGame === 'snake') {
      return (
        <>
          {snakeGame.status === 'gameover' && (
            <div className="overlay">
              <h1>GAME OVER</h1>
              <p>SCORE: {snakeGame.score}</p>
              <button className="btn" onClick={snakeGame.resetGame}>AGAIN</button>
              <button className="btn" onClick={returnToMenu}>MENU</button>
            </div>
          )}
          <div className="score-board">{snakeGame.score.toString().padStart(3, '0')}</div>
          <Board snake={snakeGame.snake} food={snakeGame.food} gridSize={snakeGame.GRID_SIZE} />
        </>
      );
    }

    if (activeGame === 'space') {
      return (
        <SpaceBoard
          player={spaceGame.player}
          bullets={spaceGame.bullets}
          enemies={spaceGame.enemies}
          enemyBullets={spaceGame.enemyBullets}
          powerUps={spaceGame.powerUps}
          explosions={spaceGame.explosions}
          lives={spaceGame.lives}
          score={spaceGame.score}
          weapon={spaceGame.weapon}
          shield={spaceGame.shield}
          status={spaceGame.status}
          distance={spaceGame.distance}
          GRID_WIDTH={spaceGame.GRID_WIDTH}
          GRID_HEIGHT={spaceGame.GRID_HEIGHT}
        />
      );
    }

    if (activeGame === 'tetris') {
      return (
        <TetrisBoard
          board={tetrisGame.board}
          currentPiece={tetrisGame.currentPiece}
          nextPiece={tetrisGame.nextPiece}
          score={tetrisGame.score}
          level={tetrisGame.level}
          lines={tetrisGame.lines}
          status={tetrisGame.status}
          resetGame={tetrisGame.resetGame}
          returnToMenu={returnToMenu}
        />
      );
    }

    if (activeGame === '2048') {
      return (
        <Board2048
          grid={game2048.grid}
          score={game2048.score}
          bestScore={game2048.bestScore}
          status={game2048.status}
          resetGame={game2048.resetGame}
          returnToMenu={returnToMenu}
        />
      );
    }

    if (activeGame === 'quantum') {
      return (
        <QuantumBoard
          snakeA={quantumGame.snakeA}
          snakeB={quantumGame.snakeB}
          foodA={quantumGame.foodA}
          foodB={quantumGame.foodB}
          score={quantumGame.score}
          highScore={quantumGame.highScore}
          status={quantumGame.status}
          GRID_WIDTH={quantumGame.GRID_WIDTH}
          GRID_HEIGHT={quantumGame.GRID_HEIGHT}
          resetGame={quantumGame.resetGame}
          returnToMenu={returnToMenu}
        />
      );
    }

    if (activeGame === 'sonar') {
      return (
        <SonarBoard
          player={sonarGame.player}
          energy={sonarGame.energy}
          status={sonarGame.status}
          pings={sonarGame.pings}
          grid={sonarGame.grid}
          hasKey={sonarGame.hasKey}
          currentLevel={sonarGame.currentLevel}
          resetGame={sonarGame.resetGame}
          returnToMenu={returnToMenu}
          toggleHelp={sonarGame.toggleHelp}
          GRID_WIDTH={sonarGame.GRID_WIDTH}
          GRID_HEIGHT={sonarGame.GRID_HEIGHT}
        />
      );
    }
    if (activeGame === 'pacman') {
      return (
        <PacmanBoard
          grid={pacmanGame.grid}
          pacman={pacmanGame.pacman}
          ghosts={pacmanGame.ghosts}
          score={pacmanGame.score}
          status={pacmanGame.status}
          direction={pacmanGame.direction}
          frightenedTicks={pacmanGame.frightenedTicks}
          GRID_WIDTH={pacmanGame.GRID_WIDTH}

          GRID_HEIGHT={pacmanGame.GRID_HEIGHT}
          resetGame={pacmanGame.resetGame}
          returnToMenu={returnToMenu}
        />
      );
    }
  };

  const handleControlDir = (dir) => {
    if (activeGame === 'menu') {
      if (dir.y === -1) handleMenuNav('up');
      if (dir.y === 1) handleMenuNav('down');
    } else if (activeGame === 'snake') {
      snakeGame.changeDirection(dir);
    } else if (activeGame === 'space') {
      spaceGame.handleInput({ y: dir.y });
    } else if (activeGame === 'tetris') {
      if (dir.x === -1) tetrisGame.moveLeft();
      if (dir.x === 1) tetrisGame.moveRight();
      if (dir.y === 1) tetrisGame.moveDown();
      if (dir.y === -1) tetrisGame.rotate();
    } else if (activeGame === '2048') {
      if (dir.x === -1) game2048.move('left');
      if (dir.x === 1) game2048.move('right');
      if (dir.y === -1) game2048.move('up');
      if (dir.y === 1) game2048.move('down');
    } else if (activeGame === 'quantum') {
      quantumGame.changeDirection(dir);
    } else if (activeGame === 'sonar') {
      sonarGame.move(dir);
    } else if (activeGame === 'pacman') {
      pacmanGame.changeDirection(dir);
    }
  };

  const handleControlAction = () => {
    if (activeGame === 'menu') handleMenuSelect();
    if (activeGame === 'snake') snakeGame.resetGame();
    if (activeGame === 'space') spaceGame.handleInput({ action: true });
    if (activeGame === '2048') game2048.resetGame();
    if (activeGame === 'quantum') quantumGame.resetGame();
    if (activeGame === 'pacman') pacmanGame.resetGame();
    if (activeGame === 'sonar') {
      if (sonarGame.status === 'playing') {
        sonarGame.ping();
      } else {
        sonarGame.resetGame();
      }
    }
  };

  // Adjust container class for Pacman tablet mode
  const isTabletMode = false;

  return (
    <div className={`phone ${isTabletMode ? 'tablet-mode' : ''}`}>
      <div className="screen-container">
        <div className="screen">
          <div className="scanlines"></div>
          {renderScreenContent()}
        </div>
      </div>

      <Controls
        onChangeDirection={handleControlDir}
        onReset={handleControlAction}
        status={activeGame === 'menu' ? 'menu' : 'playing'}
        mode="phone"
        onMenu={activeGame !== 'menu' ? returnToMenu : null}
        pressedDir={pressedKeys}
        gameName={activeGame === 'menu' ? 'NOKIA' : (GAME_LIST.find(g => g.id === activeGame)?.name || 'NOKIA')}
      />

    </div>
  );
}

export default App;
