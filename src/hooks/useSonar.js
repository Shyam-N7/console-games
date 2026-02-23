import { useState, useCallback, useEffect, useRef } from 'react';
import { useAudio } from './useAudio';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 15;

// Basic Maze Levels (1 = Wall, 0 = Empty, 2 = Start, 3 = Exit, 4 = Key, 5 = Door, 6 = Energy)

const LEVEL_1 = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 0, 0, 0, 1, 6, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 3, 1],
    [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 5, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 4, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 6, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 6, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const LEVEL_2 = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 4, 1, 0, 0, 0, 0, 3, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 5, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 6, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
    [1, 0, 1, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 1, 6, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const LEVEL_3 = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 0, 1, 6, 0, 0, 0, 1, 3, 5, 0, 0, 0, 1, 0, 0, 0, 4, 1],
    [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 6, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 6, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3];

export const useSonar = () => {
    const { playSound } = useAudio();
    const [player, setPlayer] = useState({ x: 1, y: 1 });
    const [energy, setEnergy] = useState(100);
    const [status, setStatus] = useState('ready'); // ready, playing, won, gameover, help
    const [pings, setPings] = useState([]); // { x, y, radius, maxRadius, life }
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [grid, setGrid] = useState(LEVEL_1);
    const [hasKey, setHasKey] = useState(false);

    const gameLoopRef = useRef(null);

    // Helper to get start pos
    const getStartPos = (level) => {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (level[y][x] === 2) return { x, y };
            }
        }
        return { x: 1, y: 1 };
    };

    const loadLevel = useCallback((index) => {
        const lvl = LEVELS[index];
        // Deep copy the grid so we can mutate it (pickups)
        const mutGrid = lvl.map(row => [...row]);
        setGrid(mutGrid);
        const start = getStartPos(lvl);
        setPlayer(start);
        setHasKey(false);
        setPings([]);
    }, []);

    const resetGame = useCallback(() => {
        setCurrentLevelIndex(0);
        loadLevel(0);
        setEnergy(100);
        setStatus('playing');
        playSound('start');
    }, [loadLevel, playSound]);

    const toggleHelp = useCallback(() => {
        setStatus(prev => prev === 'help' ? 'playing' : 'help');
    }, []);

    const ping = useCallback(() => {
        if (status !== 'playing') return;
        if (energy < 10) {
            playSound('error');
            return;
        }

        setEnergy(e => Math.max(0, e - 10)); // Cost 10 energy
        playSound('move'); // Reuse move sound for now

        setPings(prev => [...prev, {
            x: player.x,
            y: player.y,
            radius: 0,
            maxRadius: 6,
            life: 1.0
        }]);
    }, [energy, player, status, playSound]);

    const move = useCallback((dir) => {
        if (status !== 'playing') return;

        const newX = player.x + dir.x;
        const newY = player.y + dir.y;

        if (newX < 0 || newX >= GRID_WIDTH || newY < 0 || newY >= GRID_HEIGHT) return;

        const tile = grid[newY][newX];

        // 1 = Wall, 5 = Door (locked)
        if (tile === 1 || (tile === 5 && !hasKey)) {
            setStatus('gameover');
            playSound('crash');
            return;
        }

        // 4 = Key
        if (tile === 4) {
            setHasKey(true);
            playSound('score');
            // Remove key from grid
            setGrid(prev => {
                const newGrid = prev.map(r => [...r]);
                newGrid[newY][newX] = 0;
                return newGrid;
            });
        }

        // 6 = Energy Pickup
        if (tile === 6) {
            setEnergy(e => Math.min(100, e + 30));
            playSound('eat');
            // Remove pickup
            setGrid(prev => {
                const newGrid = prev.map(r => [...r]);
                newGrid[newY][newX] = 0;
                return newGrid;
            });
        }

        // 3 = Exit
        if (tile === 3) {
            if (currentLevelIndex < LEVELS.length - 1) {
                // Next level
                playSound('score');
                const nextIdx = currentLevelIndex + 1;
                setCurrentLevelIndex(nextIdx);
                loadLevel(nextIdx);
            } else {
                setStatus('won');
                playSound('score');
            }
            return; // Don't move player, let loadLevel or won screen handle it
        }

        setPlayer({ x: newX, y: newY });

    }, [player, grid, status, hasKey, currentLevelIndex, loadLevel, playSound]);

    // Game Loop for Animations (Pings)
    useEffect(() => {
        if (status === 'playing') {
            gameLoopRef.current = setInterval(() => {
                setPings(prev => prev.map(p => ({
                    ...p,
                    radius: p.radius + 0.2,
                    life: p.life - 0.05
                })).filter(p => p.life > 0));
            }, 50);
        }
        return () => clearInterval(gameLoopRef.current);
    }, [status]);

    return {
        player,
        energy,
        status,
        pings,
        grid,
        hasKey,
        currentLevel: currentLevelIndex + 1,
        resetGame,
        move,
        ping,
        toggleHelp,
        GRID_WIDTH,
        GRID_HEIGHT
    };
};
