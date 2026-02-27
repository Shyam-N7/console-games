import { useState, useEffect, useCallback, useRef } from 'react';
import { useAudio } from './useAudio';

const GRID_WIDTH = 25;
const GRID_HEIGHT = 20;
const TICK_MS = 150;          // faster tick = smoother feel
const FRIGHTENED_DURATION = 50;

// 0=empty 1=wall 2=pellet 3=power-pellet 4=ghost-gate
const INITIAL_MAZE = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 4, 4, 4, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1],
    [1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 1],
    [1, 3, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 3, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const SCATTER_TARGETS = {
    blinky: { x: GRID_WIDTH - 2, y: 1 },
    pinky: { x: 1, y: 1 },
    inky: { x: GRID_WIDTH - 2, y: GRID_HEIGHT - 2 },
    clyde: { x: 1, y: GRID_HEIGHT - 2 }
};

const deepCopyMaze = () => INITIAL_MAZE.map(r => [...r]);

// ---------- helpers ----------
function canMove(grid, x, y) {
    if (y < 0 || y >= GRID_HEIGHT) return false;
    let wx = x;
    if (wx < 0) wx = GRID_WIDTH - 1;
    if (wx >= GRID_WIDTH) wx = 0;
    return grid[y][wx] !== 1 && grid[y][wx] !== 4;
}

function wrapX(x) {
    if (x < 0) return GRID_WIDTH - 1;
    if (x >= GRID_WIDTH) return 0;
    return x;
}

function manhattan(ax, ay, bx, by) {
    return Math.abs(ax - bx) + Math.abs(ay - by);
}

function pickGhostMove(ghost, grid, target, frightenedTicks) {
    const cur = ghost.dir || { x: 0, y: 0 };
    const moves = [
        { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
    ];

    // valid moves
    let valid = moves.filter(m => canMove(grid, ghost.x + m.x, ghost.y + m.y));

    // prevent reversal unless only option
    if (valid.length > 1 && (cur.x !== 0 || cur.y !== 0)) {
        valid = valid.filter(m => !(m.x === -cur.x && m.y === -cur.y));
    }
    if (valid.length === 0) return null;

    if (frightenedTicks > 0) {
        // run away randomly
        return valid[Math.floor(Math.random() * valid.length)];
    }

    // deterministic: pick move closest to target
    let best = valid[0];
    let bestDist = Infinity;
    for (const m of valid) {
        const nx = wrapX(ghost.x + m.x);
        const ny = ghost.y + m.y;
        const d = manhattan(nx, ny, target.x, target.y);
        if (d < bestDist) { bestDist = d; best = m; }
    }
    return best;
}

// ========== HOOK ==========
export const usePacman = () => {
    const { playSound } = useAudio();

    // --- All mutable game state lives in a single ref to avoid React batching issues ---
    const gs = useRef({
        grid: deepCopyMaze(),
        pacman: { x: 12, y: 16 },
        ghosts: [
            { id: 'blinky', x: 12, y: 8, type: 'chaser', dir: { x: 0, y: 0 } },
            { id: 'pinky', x: 11, y: 10, type: 'ambusher', dir: { x: 0, y: 0 } },
            { id: 'inky', x: 12, y: 10, type: 'flanker', dir: { x: 0, y: 0 } },
            { id: 'clyde', x: 13, y: 10, type: 'scatter', dir: { x: 0, y: 0 } }
        ],
        dir: { x: 0, y: 0 },
        nextDir: { x: 0, y: 0 },
        score: 0,
        status: 'menu',
        hasStarted: false,
        frightenedTicks: 0,
        tick: 0
    });

    // --- React state (only for triggering re-renders) ---
    const [renderTick, setRenderTick] = useState(0);

    const forceRender = useCallback(() => setRenderTick(t => t + 1), []);

    // ---- MAIN GAME LOOP ----
    const step = useCallback(() => {
        const g = gs.current;
        if (g.status !== 'playing' || !g.hasStarted) return;
        g.tick++;

        // ---- Scatter / Chase wave ----
        const wavePos = g.tick % 175;          // total wave = 175 ticks (~26 s)
        const isScatter = wavePos < 50;        // first ~7.5s scatter, rest chase

        // ---- Move Pacman ----
        const oldPx = g.pacman.x;
        const oldPy = g.pacman.y;

        // Try queued direction first, fallback to current
        let moved = false;
        for (const tryDir of [g.nextDir, g.dir]) {
            if (tryDir.x === 0 && tryDir.y === 0) continue;
            const tx = wrapX(g.pacman.x + tryDir.x);
            const ty = g.pacman.y + tryDir.y;
            if (canMove(g.grid, tx, ty)) {
                g.pacman.x = tx;
                g.pacman.y = ty;
                g.dir = tryDir;
                moved = true;
                break;
            }
        }

        // Consume pellets
        if (moved) {
            const cell = g.grid[g.pacman.y][g.pacman.x];
            if (cell === 2) {
                playSound('score');
                g.score += 10;
                g.grid[g.pacman.y][g.pacman.x] = 0;
            } else if (cell === 3) {
                playSound('powerup');
                g.score += 50;
                g.grid[g.pacman.y][g.pacman.x] = 0;
                g.frightenedTicks = FRIGHTENED_DURATION;
            }
        }

        // Frightened countdown
        if (g.frightenedTicks > 0) g.frightenedTicks--;

        // ---- Move Ghosts ----
        const oldGhostPos = g.ghosts.map(gh => ({ x: gh.x, y: gh.y }));

        for (const ghost of g.ghosts) {
            // In the spawn box? Move straight up to exit
            const inBox = ghost.y >= 9 && ghost.y <= 10 && ghost.x >= 11 && ghost.x <= 13;
            if (inBox) {
                ghost.y--;
                ghost.dir = { x: 0, y: -1 };
                continue;
            }

            // Determine target tile
            let target = { x: g.pacman.x, y: g.pacman.y };

            if (g.frightenedTicks > 0) {
                target = null;     // no target = random
            } else if (isScatter) {
                target = SCATTER_TARGETS[ghost.id];
            } else {
                // Chase targeting per ghost type
                switch (ghost.type) {
                    case 'ambusher': // Pinky: 4 ahead
                        target = { x: g.pacman.x + g.dir.x * 4, y: g.pacman.y + g.dir.y * 4 };
                        break;
                    case 'flanker': // Inky: behind pacman
                        target = { x: g.pacman.x - g.dir.x * 3, y: g.pacman.y - g.dir.y * 3 };
                        break;
                    case 'scatter': { // Clyde: close → scatter corner
                        const dist = manhattan(ghost.x, ghost.y, g.pacman.x, g.pacman.y);
                        if (dist < 8) target = SCATTER_TARGETS.clyde;
                        break;
                    }
                    default: break; // chaser → direct target (already set)
                }
            }

            const move = pickGhostMove(ghost, g.grid, target || { x: ghost.x, y: ghost.y }, g.frightenedTicks);
            if (move) {
                ghost.x = wrapX(ghost.x + move.x);
                ghost.y = ghost.y + move.y;
                ghost.dir = move;
            }
        }

        // ---- Collision Detection ----
        let died = false;
        for (let i = 0; i < g.ghosts.length; i++) {
            const gh = g.ghosts[i];
            const oldGh = oldGhostPos[i];

            // Same-tile collision
            const sameNow = gh.x === g.pacman.x && gh.y === g.pacman.y;
            // Swap collision (Pacman walked into ghost's old tile AND ghost walked into Pacman's old tile)
            const swapped = gh.x === oldPx && gh.y === oldPy && g.pacman.x === oldGh.x && g.pacman.y === oldGh.y;

            if (sameNow || swapped) {
                if (g.frightenedTicks > 0) {
                    playSound('powerup');
                    g.score += 200;
                    gh.x = 12; gh.y = 10; gh.dir = { x: 0, y: -1 };
                } else {
                    died = true;
                }
            }
        }

        if (died) {
            playSound('crash');
            g.status = 'gameover';
            forceRender();
            return;
        }

        // Win check
        let pelletsLeft = false;
        for (let y = 0; y < GRID_HEIGHT && !pelletsLeft; y++) {
            for (let x = 0; x < GRID_WIDTH && !pelletsLeft; x++) {
                if (g.grid[y][x] === 2 || g.grid[y][x] === 3) pelletsLeft = true;
            }
        }
        if (!pelletsLeft) {
            g.status = 'win';
            playSound('score');
        }

        forceRender();
    }, [playSound, forceRender]);

    // ---- Game Loop Effect ----
    useEffect(() => {
        const g = gs.current;
        if (g.status !== 'playing' || !g.hasStarted) return;
        const id = setInterval(step, TICK_MS);
        return () => clearInterval(id);
    }, [step, renderTick]); // renderTick dep ensures restart after state changes

    // ---- Public API ----
    const changeDirection = useCallback((dir) => {
        const g = gs.current;
        if (g.status !== 'playing') return;
        if (!g.hasStarted) {
            g.hasStarted = true;
            g.dir = dir;
            g.nextDir = dir;
            forceRender();     // kick‑start the loop effect
        }
        g.nextDir = dir;
    }, [forceRender]);

    const resetGame = useCallback(() => {
        const g = gs.current;
        g.grid = deepCopyMaze();
        g.pacman = { x: 12, y: 16 };
        g.ghosts = [
            { id: 'blinky', x: 12, y: 8, type: 'chaser', dir: { x: 0, y: 0 } },
            { id: 'pinky', x: 11, y: 10, type: 'ambusher', dir: { x: 0, y: 0 } },
            { id: 'inky', x: 12, y: 10, type: 'flanker', dir: { x: 0, y: 0 } },
            { id: 'clyde', x: 13, y: 10, type: 'scatter', dir: { x: 0, y: 0 } }
        ];
        g.dir = { x: 0, y: 0 };
        g.nextDir = { x: 0, y: 0 };
        g.score = 0;
        g.frightenedTicks = 0;
        g.hasStarted = false;
        g.tick = 0;
        g.status = 'playing';
        forceRender();
    }, [forceRender]);

    // ---- Expose readable state ----
    /* eslint-disable react-hooks/refs */
    const g = gs.current;
    const viewState = {
        grid: g.grid,
        pacman: g.pacman,
        ghosts: g.ghosts,
        score: g.score,
        status: g.status,
        direction: g.dir,
        frightenedTicks: g.frightenedTicks,
        changeDirection,
        resetGame,
        GRID_WIDTH,
        GRID_HEIGHT
    };
    /* eslint-enable react-hooks/refs */

    // eslint-disable-next-line react-hooks/refs
    return viewState;
};
