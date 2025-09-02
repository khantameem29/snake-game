
import React, { useState, useEffect, useCallback } from 'react';
import { Coordinates, Direction, GameState } from './types';
import { BOARD_SIZE, INITIAL_SNAKE, INITIAL_FOOD, INITIAL_SPEED, DIRECTION_MAP, MIN_SPEED, SPEED_INCREMENT } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [snake, setSnake] = useState<Coordinates[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Coordinates>(INITIAL_FOOD);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const savedScore = localStorage.getItem('snakeHighScore');
    return savedScore ? parseInt(savedScore, 10) : 0;
  });
  const [speed, setSpeed] = useState<number>(INITIAL_SPEED);

  const generateFood = useCallback((currentSnake: Coordinates[]): Coordinates => {
    while (true) {
      const newFood = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE),
      };
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        return newFood;
      }
    }
  }, []);

  const resetGame = useCallback(() => {
    setGameState(GameState.IDLE);
    setSnake(INITIAL_SNAKE);
    setFood(generateFood(INITIAL_SNAKE));
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setSpeed(INITIAL_SPEED);
  }, [generateFood]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    let newDirection: Direction | null = null;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        if (direction !== 'DOWN') newDirection = 'UP';
        break;
      case 'ArrowDown':
      case 's':
        if (direction !== 'UP') newDirection = 'DOWN';
        break;
      case 'ArrowLeft':
      case 'a':
        if (direction !== 'RIGHT') newDirection = 'LEFT';
        break;
      case 'ArrowRight':
      case 'd':
        if (direction !== 'LEFT') newDirection = 'RIGHT';
        break;
      case ' ': // Spacebar
        if (gameState === GameState.RUNNING) setGameState(GameState.PAUSED);
        else if (gameState === GameState.PAUSED) setGameState(GameState.RUNNING);
        break;
      case 'Enter':
        if (gameState === GameState.IDLE || gameState === GameState.GAME_OVER) {
          resetGame();
          setGameState(GameState.RUNNING);
        }
        break;
    }
    if (newDirection) {
      setNextDirection(newDirection);
    }
  }, [direction, gameState, resetGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const gameLoop = useCallback(() => {
    if (gameState !== GameState.RUNNING) return;

    setDirection(nextDirection);
    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };
      const move = DIRECTION_MAP[nextDirection];
      head.x += move.x;
      head.y += move.y;

      // Wall collision
      if (head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE) {
        setGameState(GameState.GAME_OVER);
        return prevSnake;
      }

      // Self collision
      for (let i = 1; i < newSnake.length; i++) {
        if (head.x === newSnake[i].x && head.y === newSnake[i].y) {
          setGameState(GameState.GAME_OVER);
          return prevSnake;
        }
      }

      newSnake.unshift(head);

      // Food collision
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 1;
        setScore(newScore);
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('snakeHighScore', newScore.toString());
        }
        setFood(generateFood(newSnake));
        setSpeed(prev => Math.max(MIN_SPEED, prev - SPEED_INCREMENT));
      } else {
        newSnake.pop();
      }
      
      return newSnake;
    });
  }, [gameState, nextDirection, food, score, highScore, generateFood]);

  useEffect(() => {
    if (gameState === GameState.RUNNING) {
      const interval = setInterval(gameLoop, speed);
      return () => clearInterval(interval);
    }
  }, [gameLoop, gameState, speed]);

  const getCellType = (x: number, y: number): string => {
    if (food.x === x && food.y === y) return 'food';
    if (snake.some((segment, index) => {
        if(index === 0 && segment.x === x && segment.y === y) return true;
        return false;
    })) return 'snake-head';
    if (snake.some(segment => segment.x === x && segment.y === y)) return 'snake-body';
    return 'empty';
  };
  
  const getHeadRotation = () => {
    switch(direction) {
      case 'UP': return '-rotate-90';
      case 'DOWN': return 'rotate-90';
      case 'LEFT': return 'rotate-180';
      case 'RIGHT': return '';
    }
  }

  const renderBoard = () => {
    return Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
      const x = i % BOARD_SIZE;
      const y = Math.floor(i / BOARD_SIZE);
      const type = getCellType(x, y);

      let cellClass = 'w-full h-full';
      if(type === 'food') {
        cellClass += ' bg-red-500 rounded-full animate-pulse';
      } else if (type === 'snake-head') {
        cellClass += ' bg-green-400 rounded-sm';
      } else if(type === 'snake-body') {
        cellClass += ' bg-green-600 rounded-sm';
      } else {
        cellClass += ' bg-gray-800';
      }
      
      return <div key={i} className={cellClass}></div>;
    });
  };
  
  const renderOverlay = () => {
    if (gameState === GameState.IDLE || gameState === GameState.GAME_OVER || gameState === GameState.PAUSED) {
      return (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center text-white font-mono z-10">
          {gameState === GameState.IDLE && <>
            <h1 className="text-5xl font-bold mb-4 animate-pulse">Retro Snake</h1>
            <p className="text-xl">Press Enter to Start</p>
          </>}
          {gameState === GameState.PAUSED && <>
            <h1 className="text-5xl font-bold mb-4">Paused</h1>
            <p className="text-xl">Press Space to Resume</p>
          </>}
          {gameState === GameState.GAME_OVER && <>
            <h1 className="text-5xl font-bold mb-4 text-red-500">Game Over</h1>
            <p className="text-2xl mb-2">Your Score: {score}</p>
            <p className="text-xl mb-6">High Score: {highScore}</p>
            <button
              onClick={() => { resetGame(); setGameState(GameState.RUNNING); }}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-lg font-bold transition-colors"
            >
              Restart (Enter)
            </button>
          </>}
           <div className="mt-8 text-center text-gray-400 text-sm">
              <p className="font-bold mb-2">Controls:</p>
              <p>Arrow Keys or WASD to Move</p>
              <p>Spacebar to Pause/Resume</p>
            </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 text-white font-mono">
      <header className="w-full max-w-lg mb-4 flex justify-between items-center px-4 py-2 border-2 border-gray-700 rounded-lg bg-gray-800">
        <h1 className="text-2xl font-bold text-green-400">SNAKE</h1>
        <div className="text-right">
          <p className="text-lg">SCORE: <span className="font-bold text-yellow-300">{score}</span></p>
          <p className="text-sm text-gray-400">HIGH: <span className="font-bold">{highScore}</span></p>
        </div>
      </header>
      <main className="relative">
        {renderOverlay()}
        <div
          className="grid gap-px bg-gray-700 border-4 border-gray-600 rounded-lg overflow-hidden shadow-2xl shadow-black"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
            width: 'clamp(300px, 90vw, 600px)',
            height: 'clamp(300px, 90vw, 600px)',
          }}
        >
          {renderBoard()}
        </div>
      </main>
      <footer className="mt-4 text-gray-500 text-xs text-center">
        Use Arrow Keys or WASD to move. Space to pause.
      </footer>
    </div>
  );
};

export default App;
