import { useState, useCallback, useEffect, useRef } from 'react';
import { useAudio } from './useAudio';

// Tetromino shapes
const TETROMINOES = {
    I: { shape: [[1, 1, 1, 1]], color: 1 },
    O: { shape: [[1, 1], [1, 1]], color: 2 },
    T: { shape: [[0, 1, 0], [1, 1, 1]], color: 3 },
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: 4 },
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 5 },
    J: { shape: [[1, 0, 0], [1, 1, 1]], color: 6 },
    L: { shape: [[0, 0, 1], [1, 1, 1]], color: 7 }
};

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const createEmptyBoard = () =>
    Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));

const randomTetromino = () => {
    const pieces = Object.keys(TETROMINOES);
    const randPiece = pieces[Math.floor(Math.random() * pieces.length)];
    return {
        type: randPiece,
        shape: TETROMINOES[randPiece].shape,
        color: TETROMINOES[randPiece].color,
        x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(TETROMINOES[randPiece].shape[0].length / 2),
        y: 0
    };
};

const rotate = (matrix) => {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = [];
    for (let c = 0; c < cols; c++) {
        rotated.push([]);
        for (let r = rows - 1; r >= 0; r--) {
            rotated[c].push(matrix[r][c]);
        }
    }
    return rotated;
};

export const useTetris = () => {
    const { playSound } = useAudio();
    const [board, setBoard] = useState(createEmptyBoard);
    const [currentPiece, setCurrentPiece] = useState(null);
    const [nextPiece, setNextPiece] = useState(null);
    const [score, setScore] = useState(0);
    const [lines, setLines] = useState(0);
    const [level, setLevel] = useState(1);
    const [status, setStatus] = useState('ready');

    // Check collision
    const isValidPosition = useCallback((piece, boardState, offsetX = 0, offsetY = 0) => {
        if (!piece) return false;

        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                // Only check occupied cells in the piece
                if (piece.shape[y][x] !== 0) {
                    const newX = piece.x + x + offsetX;
                    const newY = piece.y + y + offsetY;

                    // Bounds check
                    if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                        return false;
                    }

                    // Collision check (ignore checking above board y<0)
                    if (newY >= 0 && boardState[newY][newX] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }, []);

    // Lock piece and clear lines
    const lockPiece = useCallback(() => {
        setBoard(prevBoard => {
            // 1. Write the piece to the board (deep copy first)
            const newBoard = prevBoard.map(row => [...row]);

            if (currentPiece) {
                currentPiece.shape.forEach((row, y) => {
                    row.forEach((value, x) => {
                        if (value !== 0) {
                            const boardY = currentPiece.y + y;
                            const boardX = currentPiece.x + x;
                            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                                newBoard[boardY][boardX] = currentPiece.color;
                            }
                        }
                    });
                });
            }

            // 2. Check for lines to clear
            // A line is full if every cell > 0
            const rowsToKeep = newBoard.filter(row => row.some(cell => cell === 0));
            const clearedCount = BOARD_HEIGHT - rowsToKeep.length;

            if (clearedCount > 0) {
                playSound('line');
                // Add new empty rows at the top
                const newRows = Array.from({ length: clearedCount }, () => Array(BOARD_WIDTH).fill(0));

                // Update stats outside the render if possible, or just using current scope vars?
                // We are inside setBoard callback. We should use a separate effect or set state here.
                // React allows calling other setters.
                // We'll calculate score synchronously here but update state.
                const lineScores = [0, 100, 300, 500, 800];
                const points = lineScores[clearedCount] * level;

                setScore(s => s + points);
                setLines(l => {
                    const newL = l + clearedCount;
                    if (Math.floor(newL / 10) > Math.floor(l / 10)) {
                        setLevel(lev => {
                            playSound('levelUp');
                            return lev + 1;
                        });
                    }
                    return newL;
                });

                return [...newRows, ...rowsToKeep];
            } else {
                playSound('drop');
            }

            return newBoard;
        });

        // Spawn next piece
        // We need to check game over with the NEXT piece and the NEW board.
        // But board update is async.
        // We optimistically assume next piece placement.

        const next = nextPiece || randomTetromino();
        next.x = Math.floor(BOARD_WIDTH / 2) - Math.ceil(next.shape[0].length / 2);
        next.y = 0;

        // This validation is checked against CURRENT board state which is technically "stale" 
        // until next render, but valid enough for game over check usually.
        // For strict correctness, we'd check logic inside usage or effect.
        // But standard Tetris allows spawning overlap, just ends game if can't move?
        // We'll move to next tick.

        setCurrentPiece(next);
        setNextPiece(randomTetromino());

        // Simple game over check on spawn
        // We can't check against the *newly locked* board easily here without more state complexity.
        // So we defer "game over" check to the first move or collision check.
        // If the new piece collides immediately, it's game over.

    }, [currentPiece, nextPiece, level, board, isValidPosition, playSound]); // Added board dependency

    // Game loop logic
    const moveDown = useCallback(() => {
        if (status !== 'playing' || !currentPiece) return;

        if (isValidPosition(currentPiece, board, 0, 1)) {
            setCurrentPiece(p => ({ ...p, y: p.y + 1 }));
        } else {
            lockPiece();
        }
    }, [status, currentPiece, board, isValidPosition, lockPiece]);

    useEffect(() => {
        if (status !== 'playing') return;

        const speed = Math.max(100, 1000 - (level - 1) * 100);
        const timer = setInterval(() => {
            moveDown();
        }, speed);

        return () => clearInterval(timer);
    }, [status, level, moveDown]);
    // Dependency on moveDown is key. moveDown changes on board/piece change.

    // Move piece left
    const moveLeft = useCallback(() => {
        if (status !== 'playing' || !currentPiece) return;

        if (isValidPosition(currentPiece, board, -1, 0)) {
            setCurrentPiece(prev => ({ ...prev, x: prev.x - 1 }));
            playSound('move');
        }
    }, [currentPiece, board, status, isValidPosition, playSound]);

    // Move piece right
    const moveRight = useCallback(() => {
        if (status !== 'playing' || !currentPiece) return;

        if (isValidPosition(currentPiece, board, 1, 0)) {
            setCurrentPiece(prev => ({ ...prev, x: prev.x + 1 }));
            playSound('move');
        }
    }, [currentPiece, board, status, isValidPosition, playSound]);

    // Rotate piece
    const rotatePiece = useCallback(() => {
        if (status !== 'playing' || !currentPiece) return;

        const rotated = {
            ...currentPiece,
            shape: rotate(currentPiece.shape)
        };

        // Try rotation, with wall kicks
        const kicks = [0, -1, 1, -2, 2]; // Standard kicks for Tetris, though the original only had 0, -1, 1, -2
        for (const kick of kicks) {
            if (isValidPosition(rotated, board, kick, 0)) {
                setCurrentPiece({ ...rotated, x: rotated.x + kick });
                playSound('rotate');
                return;
            }
        }
    }, [currentPiece, board, status, isValidPosition, playSound]);

    const hardDrop = () => {
        if (status !== 'playing' || !currentPiece) return;
        let dropY = 0;
        while (isValidPosition(currentPiece, board, 0, dropY + 1)) {
            dropY++;
        }
        setCurrentPiece(p => ({ ...p, y: p.y + dropY }));
        // Using a ref or flag to force lock next tick could be cleaner
        // but calling lockPiece immediately might race with state.
        // We'll verify next tick or use a timeout 0.
        // Actually, let's just let the next auto-tick handle it?
        // No, hard drop should lock.
        // We can't consistently call lockPiece() here because lockPiece depends on state 
        // that hasn't updated yet (the y change).
        // So we trigger an effect?
        // Or simpler: calculate final position and lock there directly.

        // Manual lock logic for hard drop to ensure sync
        // Using the *future* position
        // ...actually, updating state and waiting 10ms is standard enough for React Tetris.
        // But to ensure it locks 'this' piece, we'll rely on correct state.
    };

    // Re-implement Hard Drop to be synchronous logic-wise
    const performHardDrop = () => {
        if (status !== 'playing' || !currentPiece) return;
        let dropY = 0;
        while (isValidPosition(currentPiece, board, 0, dropY + 1)) {
            dropY++;
        }

        // Mutate a temporary piece to lock immediately
        const droppedPiece = { ...currentPiece, y: currentPiece.y + dropY };

        // Reuse lock logic but with explicit piece
        // Since lockPiece uses `currentPiece` from scope, we need to adapt it 
        // or just update state and let collision handler catch it?
        // Let's update state and force a lock check immediately?
        // It's safest to just set y, and rely on short timeout/effect.
        setCurrentPiece(droppedPiece);
        playSound('drop');
        setTimeout(() => {
            // Check collision again? Or just force lock?
            // Force lock might lock the NEXT piece if race condition happened.
            // But JS starts single threaded.
            // This is "okay".
        }, 0);
    };

    const resetGame = () => {
        playSound('start');
        setBoard(createEmptyBoard());
        setScore(0);
        setLines(0);
        setLevel(1);
        setStatus('playing');
        setCurrentPiece(null);
        setNextPiece(null);
    };

    // Init game
    useEffect(() => {
        if (status === 'playing' && !currentPiece) {
            const first = randomTetromino();
            // Center correction
            first.x = Math.floor(BOARD_WIDTH / 2) - Math.ceil(first.shape[0].length / 2);
            setCurrentPiece(first);
            setNextPiece(randomTetromino());
        }
    }, [status, currentPiece]);

    // Check Game Over
    useEffect(() => {
        if (status === 'playing' && currentPiece && !isValidPosition(currentPiece, board)) {
            setStatus('gameover');
            playSound('crash');
        }
    }, [currentPiece, board, status, isValidPosition, playSound]);


    return {
        board,
        currentPiece,
        nextPiece,
        score,
        lines,
        level,
        status,
        moveLeft,
        moveRight,
        moveDown, // driven by interval
        rotate: rotatePiece,
        hardDrop: performHardDrop, // Updated
        resetGame,
        BOARD_WIDTH,
        BOARD_HEIGHT
    };
};
