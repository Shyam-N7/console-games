import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Game } from '../Game.js';
import { LEVELS } from '../Level.js';
import { SCREEN, STATES } from '../constants.js';

const makeContext = () => ({
    imageSmoothingEnabled: false,
    fillStyle: '#000',
    font: '8px monospace',
    textAlign: 'left',
    lineWidth: 1,
    beginPath: () => { },
    arc: () => { },
    ellipse: () => { },
    fill: () => { },
    fillRect: () => { },
    strokeRect: () => { },
    moveTo: () => { },
    lineTo: () => { },
    stroke: () => { },
    fillText: () => { }
});

const createGame = () => {
    const canvas = {
        width: 0,
        height: 0,
        getContext: () => makeContext()
    };
    return new Game(canvas);
};

describe('Game', () => {
    beforeEach(() => {
        globalThis.requestAnimationFrame = vi.fn(() => 42);
        globalThis.cancelAnimationFrame = vi.fn();
        vi.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('detects stomp from above and rejects side-hit stomps', () => {
        const game = createGame();
        const enemy = { x: 100, y: 100, width: 16, height: 16 };

        game.mario.y = 84;
        game.mario.prevY = 82;
        game.mario.vy = 2;
        game.mario.x = 100;
        expect(game.isMarioStompingEnemy(enemy)).toBe(true);

        game.mario.y = 95;
        game.mario.prevY = 88;
        game.mario.vy = 7;
        game.mario.x = 100;
        expect(game.isMarioStompingEnemy(enemy)).toBe(true);

        // Late horizontal overlap while descending should still count as stomp
        game.mario.x = 94;
        game.mario.y = 98;
        game.mario.prevY = 95;
        game.mario.vy = 5;
        expect(game.isMarioStompingEnemy(enemy)).toBe(true);

        game.mario.y = 100;
        game.mario.prevY = 100;
        game.mario.vy = 1;
        game.mario.x = 100;
        expect(game.isMarioStompingEnemy(enemy)).toBe(false);
    });

    it('activates checkpoint when Mario crosses checkpoint tile', () => {
        const game = createGame();
        game.loadLevel(0);

        const checkpointTileX = game.level.levelData.checkpointTileX;
        game.enemies = [];
        game.mario.x = checkpointTileX * 16 + 1;
        game.mario.y = game.getSpawnYForTile(checkpointTileX);
        game.mario.onGround = true;
        game.mario.vx = 0;
        game.mario.vy = 0;

        game.update(16);

        expect(game.checkpointReached).toBe(true);
        expect(game.checkpointSpawnX).toBe(checkpointTileX * 16);
    });

    it('does not duplicate initial enemies after the first update tick', () => {
        const game = createGame();
        game.loadLevel(0);

        const beforeCount = game.enemies.length;
        const firstSpawnKey = '0';

        game.mario.x = 48;
        game.mario.y = game.getSpawnYForTile(3);
        game.mario.onGround = true;
        game.mario.vx = 0;
        game.mario.vy = 0;

        expect(game.spawnedEnemyPositions.has(firstSpawnKey)).toBe(true);
        game.update(16);

        const afterCount = game.enemies.length;
        expect(beforeCount).toBe(1);
        expect(afterCount).toBe(1);
        expect(game.spawnedEnemyPositions.has(firstSpawnKey)).toBe(true);
    });

    it('respawns from checkpoint after death and keeps score/coins', () => {
        const game = createGame();
        game.loadLevel(0);

        game.score = 1200;
        game.coins = 7;
        game.lives = 3;
        game.time = 90;
        game.checkpointReached = true;
        game.checkpointSpawnX = 640;
        game.checkpointSpawnY = 160;

        game.mario.dead = true;
        game.mario.y = SCREEN.HEIGHT + 80;

        game.update(16);

        expect(game.lives).toBe(2);
        expect(game.mario.x).toBe(640);
        expect(game.mario.y).toBe(160);
        expect(game.score).toBe(1200);
        expect(game.coins).toBe(7);
        expect(game.time).toBe(200);
    });

    it('advances levels and fully resets after final level', () => {
        const game = createGame();
        game.loadLevel(0);

        game.state = STATES.LEVEL_COMPLETE;
        game.handleInput('Enter', true);
        expect(game.currentLevelIndex).toBe(1);

        game.state = STATES.LEVEL_COMPLETE;
        game.handleInput('Enter', true);
        expect(game.currentLevelIndex).toBe(2);

        game.score = 999;
        game.coins = 10;
        game.lives = 1;
        game.state = STATES.LEVEL_COMPLETE;
        game.handleInput('Enter', true);

        expect(game.currentLevelIndex).toBe(0);
        expect(game.score).toBe(0);
        expect(game.coins).toBe(0);
        expect(game.lives).toBe(3);
        expect(LEVELS.length).toBe(3);
    });

    it('cancels RAF loop on stop()', () => {
        const game = createGame();

        game.start();
        expect(game.running).toBe(true);
        expect(globalThis.requestAnimationFrame).toHaveBeenCalled();

        game.stop();
        expect(game.running).toBe(false);
        expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(42);
    });
});
