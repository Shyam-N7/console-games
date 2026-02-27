import { useState, useCallback, useEffect, useRef } from 'react';
import { useAudio } from './useAudio';

// Grid size 
const GRID_WIDTH = 20;
const GRID_HEIGHT = 10;

// Game speed (ms per frame)
const BASE_SPEED = 60;

export const useSpaceImpact = () => {
    const { playSound } = useAudio();

    // Use refs for game state that needs to be mutable in game loop
    const playerRef = useRef({ x: 2, y: Math.floor(GRID_HEIGHT / 2) });
    const bulletsRef = useRef([]);
    const enemiesRef = useRef([]);
    const enemyBulletsRef = useRef([]);
    const powerUpsRef = useRef([]);
    const explosionsRef = useRef([]);

    // React state for rendering
    const [renderState, setRenderState] = useState({
        player: { x: 2, y: Math.floor(GRID_HEIGHT / 2) },
        bullets: [],
        enemies: [],
        enemyBullets: [],
        powerUps: [],
        explosions: []
    });

    const [lives, setLives] = useState(3);
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState('ready');
    const [weapon, setWeapon] = useState(1);
    const [shield, setShield] = useState(false);
    const [, setShieldTimer] = useState(0);
    const [distance, setDistance] = useState(0);

    // Input and timing refs
    const inputRef = useRef({ up: false, down: false, shoot: false });
    const shootCooldownRef = useRef(0);
    const frameRef = useRef(0);
    const spawnRateRef = useRef(25);

    // Reset game
    const resetGame = useCallback(() => {
        playerRef.current = { x: 2, y: Math.floor(GRID_HEIGHT / 2) };
        bulletsRef.current = [];
        enemiesRef.current = [];
        enemyBulletsRef.current = [];
        powerUpsRef.current = [];
        explosionsRef.current = [];

        setLives(3);
        setScore(0);
        setWeapon(1);
        setShield(false);
        setShieldTimer(0);
        setDistance(0);
        frameRef.current = 0;
        spawnRateRef.current = 25;
        shootCooldownRef.current = 0;

        setRenderState({
            player: { ...playerRef.current },
            bullets: [],
            enemies: [],
            enemyBullets: [],
            powerUps: [],
            explosions: []
        });

        setStatus('playing');
        playSound('select');
    }, [playSound]);

    // Handle input
    const handleInput = useCallback((direction) => {
        if (status === 'gameover' || status === 'ready') {
            if (direction.action) {
                resetGame();
            }
            return;
        }

        if (direction.y !== undefined) {
            inputRef.current.up = direction.y < 0;
            inputRef.current.down = direction.y > 0;
        }
        if (direction.action !== undefined) {
            inputRef.current.shoot = direction.action;
        }
    }, [status, resetGame]);

    // Main game loop
    useEffect(() => {
        if (status !== 'playing') return;

        const gameLoop = setInterval(() => {
            frameRef.current++;
            const frame = frameRef.current;

            // Update distance
            setDistance(d => d + 1);

            // Increase difficulty
            if (frame % 400 === 0 && spawnRateRef.current > 12) {
                spawnRateRef.current -= 2;
            }

            // === PLAYER MOVEMENT ===
            const player = playerRef.current;
            if (inputRef.current.up && player.y > 0) {
                player.y--;
            }
            if (inputRef.current.down && player.y < GRID_HEIGHT - 1) {
                player.y++;
            }

            // === SHOOTING ===
            if (shootCooldownRef.current > 0) {
                shootCooldownRef.current--;
            }

            if (inputRef.current.shoot && shootCooldownRef.current === 0) {
                shootCooldownRef.current = 4;

                // Get current weapon level from state
                bulletsRef.current.push({
                    id: Date.now(),
                    x: player.x + 1,
                    y: player.y,
                    speed: 2
                });

                playSound('nav');
            }

            // === MOVE BULLETS ===
            bulletsRef.current = bulletsRef.current
                .map(b => ({ ...b, x: b.x + b.speed }))
                .filter(b => b.x < GRID_WIDTH + 2);

            // === MOVE ENEMY BULLETS ===
            enemyBulletsRef.current = enemyBulletsRef.current
                .map(b => ({ ...b, x: b.x - 1 }))
                .filter(b => b.x >= -1);

            // === SPAWN ENEMIES ===
            if (frame % spawnRateRef.current === 0) {
                const types = ['basic', 'fast', 'tank', 'shooter'];
                const weights = [45, 30, 15, 10];
                let rand = Math.random() * 100;
                let type = 'basic';

                for (let i = 0; i < types.length; i++) {
                    rand -= weights[i];
                    if (rand <= 0) {
                        type = types[i];
                        break;
                    }
                }

                enemiesRef.current.push({
                    id: Date.now() + Math.random(),
                    x: GRID_WIDTH,
                    y: Math.floor(Math.random() * GRID_HEIGHT),
                    type,
                    health: type === 'tank' ? 3 : 1,
                    moveTimer: 0
                });
            }

            // === SPAWN POWER-UPS (more frequent) ===
            if (frame % 100 === 0 && Math.random() < 0.8) {
                const types = ['weapon', 'shield', 'life'];
                powerUpsRef.current.push({
                    id: Date.now(),
                    x: GRID_WIDTH,
                    y: Math.floor(Math.random() * GRID_HEIGHT),
                    type: types[Math.floor(Math.random() * types.length)]
                });
            }

            // === MOVE ENEMIES ===
            enemiesRef.current = enemiesRef.current.map(e => {
                e.moveTimer++;
                const moveInterval = e.type === 'fast' ? 1 : 2;

                if (e.moveTimer >= moveInterval) {
                    e.moveTimer = 0;
                    e.x--;
                }

                // Shooter fires
                if (e.type === 'shooter' && frame % 40 === 0 && e.x < GRID_WIDTH - 2) {
                    enemyBulletsRef.current.push({
                        id: Date.now() + Math.random(),
                        x: e.x - 1,
                        y: e.y
                    });
                }

                return e;
            }).filter(e => e.x >= -1);

            // === MOVE POWER-UPS ===
            powerUpsRef.current = powerUpsRef.current
                .map(p => ({ ...p, x: p.x - 0.3 }))
                .filter(p => p.x >= -1);

            // === COLLISION: BULLETS vs ENEMIES ===
            const hitBulletIds = new Set();
            const hitEnemyIds = new Set();
            let scoreGain = 0;

            for (const bullet of bulletsRef.current) {
                for (const enemy of enemiesRef.current) {
                    if (hitEnemyIds.has(enemy.id)) continue;

                    const bx = Math.round(bullet.x);
                    const ex = Math.round(enemy.x);

                    // Wider hit detection
                    if (Math.abs(bx - ex) <= 1 && bullet.y === enemy.y) {
                        hitBulletIds.add(bullet.id);

                        enemy.health--;
                        if (enemy.health <= 0) {
                            hitEnemyIds.add(enemy.id);
                            scoreGain += enemy.type === 'tank' ? 30 : enemy.type === 'shooter' ? 20 : 10;

                            // Add explosion
                            explosionsRef.current.push({
                                id: Date.now() + Math.random(),
                                x: enemy.x,
                                y: enemy.y,
                                frame: 0
                            });
                        }
                        break;
                    }
                }
            }

            if (scoreGain > 0) {
                setScore(s => s + scoreGain);
                playSound('eat');
            }

            bulletsRef.current = bulletsRef.current.filter(b => !hitBulletIds.has(b.id));
            enemiesRef.current = enemiesRef.current.filter(e => !hitEnemyIds.has(e.id));

            // === COLLISION: PLAYER vs ENEMIES ===
            for (const enemy of enemiesRef.current) {
                const ex = Math.round(enemy.x);
                if (ex === player.x && enemy.y === player.y) {
                    if (!shield) {
                        setLives(l => {
                            if (l <= 1) {
                                setStatus('gameover');
                                playSound('crash');
                                return 0;
                            }
                            playSound('crash');
                            return l - 1;
                        });
                    }

                    explosionsRef.current.push({
                        id: Date.now() + Math.random(),
                        x: enemy.x,
                        y: enemy.y,
                        frame: 0
                    });

                    enemiesRef.current = enemiesRef.current.filter(e => e.id !== enemy.id);
                    break;
                }
            }

            // === COLLISION: ENEMY BULLETS vs PLAYER ===
            for (const bullet of enemyBulletsRef.current) {
                const bx = Math.round(bullet.x);
                if (bx === player.x && bullet.y === player.y) {
                    if (!shield) {
                        setLives(l => {
                            if (l <= 1) {
                                setStatus('gameover');
                                playSound('crash');
                                return 0;
                            }
                            playSound('crash');
                            return l - 1;
                        });
                    }
                    enemyBulletsRef.current = enemyBulletsRef.current.filter(b => b.id !== bullet.id);
                    break;
                }
            }

            // === COLLISION: POWER-UPS ===
            for (const pu of powerUpsRef.current) {
                const px = Math.round(pu.x);
                if (px === player.x && pu.y === player.y) {
                    playSound('coin');

                    if (pu.type === 'weapon') {
                        setWeapon(w => Math.min(3, w + 1));
                    } else if (pu.type === 'shield') {
                        setShield(true);
                        setShieldTimer(80);
                    } else if (pu.type === 'life') {
                        setLives(l => Math.min(5, l + 1));
                    }

                    powerUpsRef.current = powerUpsRef.current.filter(p => p.id !== pu.id);
                    break;
                }
            }

            // === UPDATE EXPLOSIONS ===
            explosionsRef.current = explosionsRef.current
                .map(e => ({ ...e, frame: e.frame + 1 }))
                .filter(e => e.frame < 5);

            // === SHIELD TIMER ===
            if (shield) {
                setShieldTimer(t => {
                    if (t <= 1) {
                        setShield(false);
                        return 0;
                    }
                    return t - 1;
                });
            }

            // === UPDATE RENDER STATE ===
            setRenderState({
                player: { ...player },
                bullets: [...bulletsRef.current],
                enemies: [...enemiesRef.current],
                enemyBullets: [...enemyBulletsRef.current],
                powerUps: [...powerUpsRef.current],
                explosions: [...explosionsRef.current]
            });

        }, BASE_SPEED);

        return () => clearInterval(gameLoop);
    }, [status, shield, playSound]);

    // Add extra bullets when weapon upgrades
    useEffect(() => {
        if (status === 'playing' && inputRef.current.shoot && shootCooldownRef.current === 0) {
            const player = playerRef.current;

            if (weapon >= 2 && player.y > 0) {
                bulletsRef.current.push({
                    id: Date.now() + 1,
                    x: player.x + 1,
                    y: player.y - 1,
                    speed: 2
                });
            }
            if (weapon >= 3 && player.y < GRID_HEIGHT - 1) {
                bulletsRef.current.push({
                    id: Date.now() + 2,
                    x: player.x + 1,
                    y: player.y + 1,
                    speed: 2
                });
            }
        }
    }, [weapon, status]);

    return {
        player: renderState.player,
        bullets: renderState.bullets,
        enemies: renderState.enemies,
        enemyBullets: renderState.enemyBullets,
        powerUps: renderState.powerUps,
        explosions: renderState.explosions,
        lives,
        score,
        status,
        weapon,
        shield,
        distance,
        highScore: 0,
        handleInput,
        resetGame,
        GRID_WIDTH,
        GRID_HEIGHT
    };
};
