import { useState, useCallback } from 'react';
import { useAudio } from './useAudio';

const GRID_SIZE = 4;

const createEmptyGrid = () => Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));

export const use2048 = () => {
    const { playSound } = useAudio();
    const [grid, setGrid] = useState(createEmptyGrid);
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [status, setStatus] = useState('ready'); // ready, playing, won, gameover

    // Add a random tile (2 or 4) to an empty spot
    const addRandomTile = useCallback((gridState) => {
        const emptyCells = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (gridState[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }

        if (emptyCells.length === 0) return gridState;

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const newValue = Math.random() < 0.9 ? 2 : 4;

        const newGrid = gridState.map(row => [...row]);
        newGrid[randomCell.r][randomCell.c] = newValue;
        return newGrid;
    }, []);

    // Initialize Game
    const resetGame = useCallback(() => {
        let newGrid = createEmptyGrid();
        newGrid = addRandomTile(newGrid);
        newGrid = addRandomTile(newGrid);
        setGrid(newGrid);
        setScore(0);
        setStatus('playing');
        playSound('start');
    }, [addRandomTile, playSound]);

    // Check Game Over
    const checkGameOver = useCallback((gridState) => {
        // Check for 2048 (Win)
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (gridState[r][c] === 2048) return 'won';
            }
        }

        // Check for Empty Cells
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (gridState[r][c] === 0) return 'playing';
            }
        }

        // Check for Possible Merges
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const val = gridState[r][c];
                if (c + 1 < GRID_SIZE && gridState[r][c + 1] === val) return 'playing';
                if (r + 1 < GRID_SIZE && gridState[r + 1][c] === val) return 'playing';
            }
        }

        return 'gameover';
    }, []);

    // Slide & Merge Logic
    const move = useCallback((direction) => {
        if (status !== 'playing') return;

        setGrid(prevGrid => {
            let moved = false;
            let scoreGain = 0;
            const newGrid = prevGrid.map(row => [...row]);

            const slideRow = (row) => {
                const nonZero = row.filter(val => val !== 0);
                const merged = [];

                for (let i = 0; i < nonZero.length; i++) {
                    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
                        const val = nonZero[i] * 2;
                        merged.push(val);
                        scoreGain += val;
                        i++; // Skip next
                    } else {
                        merged.push(nonZero[i]);
                    }
                }

                while (merged.length < GRID_SIZE) {
                    merged.push(0);
                }
                return merged;
            };

            // Transform grid based on direction to apply left-slide logic
            const rotateGrid = (g) => {
                const rotated = createEmptyGrid();
                for (let r = 0; r < GRID_SIZE; r++) {
                    for (let c = 0; c < GRID_SIZE; c++) {
                        rotated[c][GRID_SIZE - 1 - r] = g[r][c];
                    }
                }
                return rotated;
            };

            const rotateLeft = (g) => rotateGrid(rotateGrid(rotateGrid(g))); // 270 deg
            const rotateRight = (g) => rotateGrid(g); // 90 deg
            // Align everything to "Left" for processing
            let processedGrid;

            if (direction === 'left') {
                processedGrid = newGrid.map(row => slideRow(row));
            } else if (direction === 'right') {
                processedGrid = newGrid.map(row => slideRow([...row].reverse()).reverse());
            } else if (direction === 'up') {
                let rotated = rotateLeft(newGrid);
                rotated = rotated.map(row => slideRow(row));
                processedGrid = rotateRight(rotated);
            } else if (direction === 'down') {
                let rotated = rotateLeft(newGrid);
                rotated = rotated.map(row => slideRow([...row].reverse()).reverse());
                processedGrid = rotateRight(rotated);
            }

            // Check change
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (processedGrid[r][c] !== prevGrid[r][c]) {
                        moved = true;
                    }
                }
            }

            if (moved) {
                if (scoreGain > 0) {
                    setScore(prevScore => {
                        const nextScore = prevScore + scoreGain;
                        setBestScore(prevBest => Math.max(prevBest, nextScore));
                        return nextScore;
                    });
                    playSound('merge');
                } else {
                    playSound('slide');
                }

                const gridWithTile = addRandomTile(processedGrid);
                const newStatus = checkGameOver(gridWithTile);

                if (newStatus !== 'playing') setStatus(newStatus);

                if (newStatus === 'gameover') playSound('crash');
                if (newStatus === 'won') playSound('levelUp');

                return gridWithTile;
            }

            return prevGrid;
        });
    }, [status, addRandomTile, checkGameOver, playSound]);

    return {
        grid,
        score,
        bestScore,
        status,
        move,
        resetGame
    };
};
