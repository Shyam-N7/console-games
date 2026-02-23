import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from './useAudio';

// Simple constants
const TILE_SIZE = 1;
const GRAVITY = 0.25;
const JUMP_POWER = 5;
const MOVE_SPEED = 0.15;
const LEVEL_HEIGHT = 14;
const LEVEL_WIDTH = 200;

// Tile types
const TILES = {
    AIR: 0,
    GROUND: 1,
    BRICK: 2,
    QBLOCK: 3,
    USEDBLOCK: 30,
    PIPE_L: 5,
    PIPE_R: 6,
    PIPE_TOP_L: 7,
    PIPE_TOP_R: 8,
    HARD: 9
};

const isSolid = (t) => t > 0 && t !== 30;

export const useMarioGame = () => {
    const { playSound } = useAudio();
    const [status, setStatus] = useState('idle');
    const [score, setScore] = useState(0);

    const playerRef = useRef({
        x: 3, y: 10,
        vx: 0, vy: 0,
        onGround: true,
        facingRight: true,
        dead: false
    });

    const [playerState, setPlayerState] = useState(playerRef.current);
    const [cameraX, setCameraX] = useState(0);

    const inputRef = useRef({ left: false, right: false, jump: false });
    const levelRef = useRef([]);
    const enemiesRef = useRef([]);

    const generateLevel = useCallback(() => {
        const map = [];
        for (let y = 0; y < LEVEL_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < LEVEL_WIDTH; x++) {
                // Ground (bottom 2 rows, with some gaps)
                if (y >= LEVEL_HEIGHT - 2) {
                    // Gaps at specific positions
                    if ((x >= 70 && x <= 72) || (x >= 90 && x <= 93)) {
                        row.push(TILES.AIR);
                    } else {
                        row.push(TILES.GROUND);
                    }
                }
                // Question blocks
                else if (y === 9 && (x === 16 || x === 22)) {
                    row.push(TILES.QBLOCK);
                }
                // Brick blocks
                else if (y === 9 && (x === 20 || x === 21 || x === 23 || x === 24)) {
                    row.push(TILES.BRICK);
                }
                // Pipes
                else if (y === 11 && (x === 28 || x === 38 || x === 46)) {
                    row.push(TILES.PIPE_TOP_L);
                }
                else if (y === 11 && (x === 29 || x === 39 || x === 47)) {
                    row.push(TILES.PIPE_TOP_R);
                }
                else if ((y === 12) && (x === 28 || x === 38 || x === 46)) {
                    row.push(TILES.PIPE_L);
                }
                else if ((y === 12) && (x === 29 || x === 39 || x === 47)) {
                    row.push(TILES.PIPE_R);
                }
                else {
                    row.push(TILES.AIR);
                }
            }
            map.push(row);
        }

        levelRef.current = map;

        // Enemies - placed far from start
        enemiesRef.current = [
            { x: 30, y: 11, vx: -0.03, dead: false },
            { x: 50, y: 11, vx: -0.03, dead: false },
            { x: 80, y: 11, vx: -0.03, dead: false }
        ];
    }, []);

    const resetGame = useCallback(() => {
        generateLevel();
        playerRef.current = {
            x: 3, y: 10,
            vx: 0, vy: 0,
            onGround: true,
            facingRight: true,
            dead: false
        };
        setPlayerState({ ...playerRef.current });
        setCameraX(0);
        setScore(0);
        setStatus('playing');
        inputRef.current = { left: false, right: false, jump: false };
        playSound('start');
    }, [generateLevel, playSound]);

    const updateInput = useCallback((key, pressed) => {
        if (key === 'left') inputRef.current.left = pressed;
        if (key === 'right') inputRef.current.right = pressed;
        if (key === 'jump') inputRef.current.jump = pressed;
    }, []);

    // Game loop
    useEffect(() => {
        if (status !== 'playing') return;

        const gameLoop = () => {
            const p = playerRef.current;
            const map = levelRef.current;
            const input = inputRef.current;
            const enemies = enemiesRef.current;

            if (p.dead) {
                p.vy += 0.2;
                p.y += p.vy * 0.1;
                setPlayerState({ ...p });
                return;
            }

            // Horizontal movement
            if (input.left) {
                p.vx = -MOVE_SPEED;
                p.facingRight = false;
            } else if (input.right) {
                p.vx = MOVE_SPEED;
                p.facingRight = true;
            } else {
                p.vx = 0;
            }

            // Apply horizontal velocity
            let newX = p.x + p.vx;

            // Left boundary
            if (newX < 0) newX = 0;
            // Right boundary
            if (newX > LEVEL_WIDTH - 2) newX = LEVEL_WIDTH - 2;

            // Horizontal collision check
            const checkSolid = (tx, ty) => {
                if (tx < 0 || tx >= LEVEL_WIDTH || ty < 0 || ty >= LEVEL_HEIGHT) return false;
                return isSolid(map[ty][tx]);
            };

            // Moving right
            if (p.vx > 0) {
                const rightEdge = Math.floor(newX + 0.9);
                const topY = Math.floor(p.y + 0.1);
                const botY = Math.floor(p.y + 0.9);
                if (checkSolid(rightEdge, topY) || checkSolid(rightEdge, botY)) {
                    newX = rightEdge - 0.91;
                }
            }
            // Moving left
            else if (p.vx < 0) {
                const leftEdge = Math.floor(newX);
                const topY = Math.floor(p.y + 0.1);
                const botY = Math.floor(p.y + 0.9);
                if (checkSolid(leftEdge, topY) || checkSolid(leftEdge, botY)) {
                    newX = leftEdge + 1.01;
                }
            }

            p.x = newX;

            // Jump
            if (input.jump && p.onGround) {
                p.vy = -JUMP_POWER;
                p.onGround = false;
                input.jump = false; // Consume jump
                playSound('jump');
            }

            // Gravity
            p.vy += GRAVITY;
            if (p.vy > 8) p.vy = 8;

            let newY = p.y + p.vy * 0.1;

            // Vertical collision
            p.onGround = false;

            // Falling down
            if (p.vy > 0) {
                const leftX = Math.floor(p.x + 0.1);
                const rightX = Math.floor(p.x + 0.8);
                const bottomY = Math.floor(newY + 0.99);

                if (bottomY < LEVEL_HEIGHT && (checkSolid(leftX, bottomY) || checkSolid(rightX, bottomY))) {
                    newY = bottomY - 1;
                    p.vy = 0;
                    p.onGround = true;
                }

                // Fell into pit
                if (newY > LEVEL_HEIGHT) {
                    p.dead = true;
                    p.vy = -3;
                    setStatus('gameover');
                    playSound('crash');
                }
            }
            // Going up
            else if (p.vy < 0) {
                const leftX = Math.floor(p.x + 0.1);
                const rightX = Math.floor(p.x + 0.8);
                const topY = Math.floor(newY);

                if (topY >= 0 && (checkSolid(leftX, topY) || checkSolid(rightX, topY))) {
                    newY = topY + 1.01;
                    p.vy = 0;

                    // Hit block
                    [leftX, rightX].forEach(tx => {
                        if (tx >= 0 && tx < LEVEL_WIDTH && topY >= 0 && topY < LEVEL_HEIGHT) {
                            if (map[topY][tx] === TILES.QBLOCK) {
                                map[topY][tx] = TILES.USEDBLOCK;
                                setScore(s => s + 50);
                                playSound('coin');
                            } else if (map[topY][tx] === TILES.BRICK) {
                                map[topY][tx] = TILES.AIR;
                                playSound('crash');
                            }
                        }
                    });
                }
            }

            p.y = newY;

            // Enemy logic
            enemies.forEach(enemy => {
                if (enemy.dead) return;

                enemy.x += enemy.vx;

                // Boundary
                if (enemy.x < 0 || enemy.x > LEVEL_WIDTH - 1) {
                    enemy.vx *= -1;
                }

                // Wall collision
                const ex = Math.floor(enemy.x);
                const ey = Math.floor(enemy.y);
                if (ey >= 0 && ey < LEVEL_HEIGHT && ex >= 0 && ex < LEVEL_WIDTH) {
                    if (isSolid(map[ey][ex]) || isSolid(map[ey][ex + 1])) {
                        enemy.vx *= -1;
                    }
                }

                // Player collision
                const dx = Math.abs(p.x - enemy.x);
                const dy = p.y - enemy.y;

                if (dx < 0.8 && Math.abs(dy) < 0.8) {
                    if (p.vy > 0 && dy < -0.2) {
                        // Stomp enemy
                        enemy.dead = true;
                        p.vy = -3;
                        setScore(s => s + 100);
                        playSound('eat');
                    } else if (!p.dead) {
                        // Player dies
                        p.dead = true;
                        p.vy = -3;
                        setStatus('gameover');
                        playSound('crash');
                    }
                }
            });

            // Win condition
            if (p.x >= LEVEL_WIDTH - 10 && !p.dead) {
                setStatus('gameover');
                setScore(s => s + 1000);
                playSound('start');
            }

            // Update camera (only scroll right, never left - classic Mario)
            const targetCam = p.x - 8;
            if (targetCam > cameraX) {
                setCameraX(Math.min(targetCam, LEVEL_WIDTH - 25));
            }

            setPlayerState({ ...p });
        };

        const intervalId = setInterval(gameLoop, 16);
        return () => clearInterval(intervalId);
    }, [status, cameraX, playSound]);

    return {
        player: playerState,
        cameraX,
        level: levelRef.current,
        enemies: enemiesRef.current,
        status,
        score,
        resetGame,
        updateInput,
        LEVEL_HEIGHT,
        LEVEL_WIDTH,
        T: TILES
    };
};
