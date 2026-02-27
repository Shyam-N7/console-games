import { describe, it, expect } from 'vitest';
import { Mario } from '../Mario.js';
import { PHYSICS, TILES } from '../constants.js';

const makeContext = () => ({
    imageSmoothingEnabled: false,
    fillStyle: '#000',
    font: '8px monospace',
    textAlign: 'left',
    save: () => { },
    restore: () => { },
    translate: () => { },
    scale: () => { },
    fillRect: () => { },
    beginPath: () => { },
    arc: () => { },
    ellipse: () => { },
    fill: () => { },
    strokeRect: () => { },
    fillText: () => { },
    moveTo: () => { },
    lineTo: () => { },
    stroke: () => { }
});

const makeFlatLevel = () => ({
    width: 200 * 16,
    getTile: (_x, y) => (y >= 14 * 16 ? TILES.GROUND : TILES.EMPTY),
    isSolid: (tile) => tile !== TILES.EMPTY
});

const makeWallLevel = () => ({
    width: 200 * 16,
    getTile: (x, y) => {
        if (y >= 14 * 16) return TILES.GROUND;
        const tx = Math.floor(x / 16);
        if (tx >= 8 && tx <= 9) return TILES.HARD;
        return TILES.EMPTY;
    },
    isSolid: (tile) => tile !== TILES.EMPTY
});

describe('Mario', () => {
    it('renders big Mario without throwing', () => {
        const mario = new Mario(48, 160);
        mario.state = 'big';
        mario.height = PHYSICS.BIG_HEIGHT;
        const ctx = makeContext();

        expect(() => mario.render(ctx, 0)).not.toThrow();
    });

    it('respects walk and run speed caps', () => {
        const mario = new Mario(48, 160);
        const level = makeFlatLevel();
        mario.onGround = true;

        for (let i = 0; i < 120; i++) {
            mario.update(
                { left: false, right: true, down: false, jump: false, jumpHeld: false, run: false },
                level,
                16
            );
        }
        expect(Math.abs(mario.vx)).toBeLessThanOrEqual(PHYSICS.MAX_WALK_SPEED + 0.001);

        for (let i = 0; i < 120; i++) {
            mario.update(
                { left: false, right: true, down: false, jump: false, jumpHeld: false, run: true },
                level,
                16
            );
        }
        expect(Math.abs(mario.vx)).toBeLessThanOrEqual(PHYSICS.MAX_RUN_SPEED + 0.001);
    });

    it('supports jump buffering and coyote jumps', () => {
        const mario = new Mario(48, 160);
        const level = makeFlatLevel();

        mario.onGround = false;
        mario.groundGraceTimer = 80;
        mario.prevJumpInput = false;
        mario.update(
            { left: false, right: false, down: false, jump: true, jumpHeld: true, run: false },
            level,
            16
        );
        expect(mario.vy).toBeLessThan(0);

        mario.onGround = false;
        mario.groundGraceTimer = 0;
        mario.vy = 1;
        mario.prevJumpInput = false;
        mario.update(
            { left: false, right: false, down: false, jump: true, jumpHeld: true, run: false },
            level,
            16
        );
        expect(mario.jumpBufferTimer).toBeGreaterThan(0);

        mario.onGround = true;
        mario.update(
            { left: false, right: false, down: false, jump: false, jumpHeld: false, run: false },
            level,
            16
        );
        expect(mario.vy).toBeLessThan(0);
    });

    it('prevents horizontal tunneling through solid walls', () => {
        const mario = new Mario(80, 160);
        const level = makeWallLevel();
        mario.vx = 12;
        mario.moveX(level);

        expect(mario.x + mario.width).toBeLessThanOrEqual(8 * 16);
    });
});
