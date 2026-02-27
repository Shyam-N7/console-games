import { TILES, ENEMIES, ITEMS } from './constants.js';

// World 1-1 Layout (Authentic NES)
// 16 rows high (0-15), approximately 210 columns wide

const _ = TILES.EMPTY;
const G = TILES.GROUND;
const B = TILES.BRICK;
const Q = TILES.QUESTION;
const H = TILES.HARD;
const PL = TILES.PIPE_TOP_L;
const PR = TILES.PIPE_TOP_R;
const PBL = TILES.PIPE_L;
const PBR = TILES.PIPE_R;

// Create empty level (16 rows)
const createEmptyLevel = (width) => {
    return Array(16).fill(null).map(() => Array(width).fill(_));
};

// World 1-1 data
export const WORLD_1_1 = (() => {
    const width = 212;
    const level = createEmptyLevel(width);

    // Ground (rows 14-15)
    for (let x = 0; x < width; x++) {
        // Gaps in ground
        const gaps = [
            [69, 70], // First pit
            [86, 88], // Second pit  
            [153, 154] // Third pit
        ];

        let isGap = false;
        for (const [start, end] of gaps) {
            if (x >= start && x <= end) {
                isGap = true;
                break;
            }
        }

        if (!isGap) {
            level[14][x] = G;
            level[15][x] = G;
        }
    }

    // Question blocks and bricks (row 9)
    level[9][16] = Q;  // First ? block

    level[9][20] = B;
    level[9][21] = Q;  // Coin
    level[9][22] = B;
    level[9][23] = Q;  // Mushroom/Fire
    level[9][24] = B;

    // High ? block (row 5)
    level[5][22] = Q;  // Hidden coin

    // Pipe section
    // Pipe 1 (height 2) at x=28
    level[12][28] = PL; level[12][29] = PR;
    level[13][28] = PBL; level[13][29] = PBR;

    // Pipe 2 (height 3) at x=38
    level[11][38] = PL; level[11][39] = PR;
    level[12][38] = PBL; level[12][39] = PBR;
    level[13][38] = PBL; level[13][39] = PBR;

    // Pipe 3 (height 4) at x=46
    level[10][46] = PL; level[10][47] = PR;
    level[11][46] = PBL; level[11][47] = PBR;
    level[12][46] = PBL; level[12][47] = PBR;
    level[13][46] = PBL; level[13][47] = PBR;

    // Pipe 4 (height 4) at x=57
    level[10][57] = PL; level[10][58] = PR;
    level[11][57] = PBL; level[11][58] = PBR;
    level[12][57] = PBL; level[12][58] = PBR;
    level[13][57] = PBL; level[13][58] = PBR;

    // More blocks after first gap
    level[9][78] = Q;
    level[5][78] = B;

    level[9][80] = B;
    level[9][81] = Q;
    level[9][82] = B;

    // Blocks row
    level[5][80] = B;
    level[5][81] = B;
    level[5][82] = B;
    level[5][83] = B;
    level[5][84] = B;
    level[5][85] = B;
    level[5][86] = B;
    level[5][87] = B;

    // More blocks
    level[5][91] = B;
    level[5][92] = B;
    level[5][93] = B;
    level[5][94] = Q;

    level[9][94] = B;
    level[9][100] = B;
    level[9][101] = B;

    level[5][100] = Q;
    level[5][101] = Q;
    level[5][102] = Q;

    level[9][106] = B;
    level[9][109] = B;
    level[9][110] = B;
    level[9][111] = Q;
    level[9][112] = B;

    // Staircase 1 (going up) starting at x=134
    for (let step = 0; step < 4; step++) {
        for (let y = 13 - step; y <= 13; y++) {
            level[y][134 + step] = H;
        }
    }

    // Staircase 2 (going down) starting at x=140
    for (let step = 0; step < 4; step++) {
        for (let y = 10 + step; y <= 13; y++) {
            level[y][144 - step] = H;
        }
    }

    // Staircase 3 (after second pit) at x=148
    for (let step = 0; step < 4; step++) {
        for (let y = 13 - step; y <= 13; y++) {
            level[y][148 + step] = H;
        }
    }

    // Staircase 4 (going down)
    for (let step = 0; step < 4; step++) {
        for (let y = 10 + step; y <= 13; y++) {
            level[y][156 - step] = H;
        }
    }

    // Pipes after third pit
    level[12][163] = PL; level[12][164] = PR;
    level[13][163] = PBL; level[13][164] = PBR;

    level[12][179] = PL; level[12][180] = PR;
    level[13][179] = PBL; level[13][180] = PBR;

    // Final staircase to flag
    for (let step = 0; step < 8; step++) {
        for (let y = 13 - step; y <= 13; y++) {
            level[y][189 + step] = H;
        }
    }

    // Flag pole
    level[13][198] = H; // Base
    for (let y = 3; y <= 12; y++) {
        level[y][198] = TILES.FLAG_POLE;
    }
    level[2][198] = TILES.FLAG_TOP;

    return level;
})();

// World 1-2 data (Underground)
export const WORLD_1_2 = (() => {
    const width = 150;
    const level = createEmptyLevel(width);

    // Underground theme specific color changes handled in renderer

    // Ground (rows 13-15, thicker floor)
    for (let x = 0; x < width; x++) {
        const gaps = [
            [30, 32],
            [60, 64],
            [80, 82],
            [100, 105]
        ];

        let isGap = false;
        for (const [start, end] of gaps) {
            if (x >= start && x <= end) {
                isGap = true;
                break;
            }
        }

        if (!isGap) {
            level[13][x] = G;
            level[14][x] = G;
            level[15][x] = G;
        }

        // Ceiling (rows 0-1)
        level[0][x] = B;
        level[1][x] = B;
    }

    // Walls
    for (let y = 0; y < 16; y++) {
        level[y][0] = B;
        level[y][width - 1] = B;
    }

    // Platforms
    level[9][10] = B; level[9][11] = Q; level[9][12] = B;

    // Pipe sequence
    level[11][20] = PL; level[11][21] = PR;
    level[12][20] = PBL; level[12][21] = PBR;

    // Coins over gap
    level[10][30] = Q; level[10][31] = Q; level[10][32] = Q;

    // Staircase before pipe
    for (let step = 0; step < 4; step++) {
        for (let y = 12 - step; y <= 12; y++) {
            level[y][40 + step] = H;
        }
    }

    // Raised pipe
    level[8][45] = PL; level[8][46] = PR;
    for (let i = 9; i <= 12; i++) {
        level[i][45] = PBL; level[i][46] = PBR;
    }

    // Blocks
    level[8][55] = B; level[8][56] = Q; level[8][57] = B;
    level[4][56] = Q; // High mushroom

    // Tight corridor
    for (let i = 50; i < 80; i++) {
        level[4][i] = B;
    }

    // Final stairs to flagpole
    for (let step = 0; step < 6; step++) {
        for (let y = 12 - step; y <= 12; y++) {
            level[y][120 + step] = H;
        }
    }

    // Flag pole (Exit pipe for 1-2 instead of flag actually)
    level[11][135] = PL; level[11][136] = PR;
    level[12][135] = PBL; level[12][136] = PBR;

    return level;
})();

// World 1-3 data (Overworld)
export const WORLD_1_3 = (() => {
    const width = 190;
    const level = createEmptyLevel(width);

    // Ground (rows 14-15) with wider pits than 1-1
    for (let x = 0; x < width; x++) {
        const gaps = [
            [28, 30],
            [52, 55],
            [78, 81],
            [120, 123],
            [146, 149]
        ];

        let isGap = false;
        for (const [start, end] of gaps) {
            if (x >= start && x <= end) {
                isGap = true;
                break;
            }
        }

        if (!isGap) {
            level[14][x] = G;
            level[15][x] = G;
        }
    }

    // Early tutorial blocks
    level[9][12] = Q;
    level[9][13] = B;
    level[9][14] = Q;

    // Elevated platform sets
    for (let x = 20; x <= 26; x++) level[10][x] = B;
    for (let x = 34; x <= 40; x++) level[8][x] = B;
    for (let x = 61; x <= 68; x++) level[9][x] = B;
    for (let x = 88; x <= 94; x++) level[7][x] = B;
    for (let x = 102; x <= 110; x++) level[9][x] = B;
    for (let x = 130; x <= 136; x++) level[8][x] = B;

    // Pipes
    level[12][44] = PL; level[12][45] = PR;
    level[13][44] = PBL; level[13][45] = PBR;

    level[11][72] = PL; level[11][73] = PR;
    level[12][72] = PBL; level[12][73] = PBR;
    level[13][72] = PBL; level[13][73] = PBR;

    level[10][114] = PL; level[10][115] = PR;
    level[11][114] = PBL; level[11][115] = PBR;
    level[12][114] = PBL; level[12][115] = PBR;
    level[13][114] = PBL; level[13][115] = PBR;

    // Mid-level stairs
    for (let step = 0; step < 5; step++) {
        for (let y = 13 - step; y <= 13; y++) {
            level[y][154 + step] = H;
        }
    }
    for (let step = 0; step < 5; step++) {
        for (let y = 9 + step; y <= 13; y++) {
            level[y][164 - step] = H;
        }
    }

    // Final staircase to flag
    for (let step = 0; step < 7; step++) {
        for (let y = 13 - step; y <= 13; y++) {
            level[y][168 + step] = H;
        }
    }

    // Flag pole
    level[13][176] = H;
    for (let y = 3; y <= 12; y++) {
        level[y][176] = TILES.FLAG_POLE;
    }
    level[2][176] = TILES.FLAG_TOP;

    return level;
})();

// Question block contents
export const QUESTION_CONTENTS_1_1 = {
    '16,9': ITEMS.COIN,
    '21,9': ITEMS.COIN,
    '23,9': ITEMS.MUSHROOM,
    '22,5': ITEMS.COIN,
    '78,9': ITEMS.COIN,
    '81,9': ITEMS.MUSHROOM,
    '94,5': ITEMS.COIN,
    '100,5': ITEMS.COIN,
    '101,5': ITEMS.COIN,
    '102,5': ITEMS.COIN,
    '111,9': ITEMS.MUSHROOM
};

export const QUESTION_CONTENTS_1_2 = {
    '11,9': ITEMS.COIN,
    '30,10': ITEMS.COIN,
    '31,10': ITEMS.COIN,
    '32,10': ITEMS.COIN,
    '56,8': ITEMS.FIRE_FLOWER,
    '56,4': ITEMS.MUSHROOM
};

export const QUESTION_CONTENTS_1_3 = {
    '12,9': ITEMS.COIN,
    '14,9': ITEMS.COIN,
    '24,10': ITEMS.MUSHROOM,
    '38,8': ITEMS.COIN,
    '66,9': ITEMS.COIN,
    '92,7': ITEMS.FIRE_FLOWER,
    '106,9': ITEMS.COIN,
    '134,8': ITEMS.COIN
};

// Enemy spawn positions
export const ENEMY_SPAWNS_1_1 = [
    { type: ENEMIES.GOOMBA, x: 22 * 16, y: 13 * 16 },
    { type: ENEMIES.GOOMBA, x: 41 * 16, y: 13 * 16 },
    { type: ENEMIES.GOOMBA, x: 52 * 16, y: 13 * 16 },
    { type: ENEMIES.GOOMBA, x: 81 * 16, y: 13 * 16 },
    { type: ENEMIES.GOOMBA, x: 100 * 16, y: 13 * 16 },
    { type: ENEMIES.GOOMBA, x: 120 * 16, y: 13 * 16 },
    { type: ENEMIES.GOOMBA, x: 175 * 16, y: 13 * 16 }
];

export const ENEMY_SPAWNS_1_2 = [
    { type: ENEMIES.GOOMBA, x: 25 * 16, y: 12 * 16 },
    { type: ENEMIES.GOOMBA, x: 50 * 16, y: 3 * 16 }, // Drop from ceiling corridor
    { type: ENEMIES.GOOMBA, x: 70 * 16, y: 12 * 16 },
    { type: ENEMIES.GOOMBA, x: 90 * 16, y: 12 * 16 }
];

export const ENEMY_SPAWNS_1_3 = [
    { type: ENEMIES.GOOMBA, x: 18 * 16, y: 13 * 16 },
    { type: ENEMIES.GOOMBA, x: 42 * 16, y: 13 * 16 },
    { type: ENEMIES.GOOMBA, x: 64 * 16, y: 13 * 16 },
    { type: ENEMIES.GOOMBA, x: 86 * 16, y: 13 * 16 },
    { type: ENEMIES.GOOMBA, x: 108 * 16, y: 13 * 16 },
    { type: ENEMIES.GOOMBA, x: 132 * 16, y: 13 * 16 },
    { type: ENEMIES.GOOMBA, x: 160 * 16, y: 13 * 16 }
];

// Level registry
export const LEVELS = [
    {
        bgType: 'overworld',
        layout: WORLD_1_1,
        questions: QUESTION_CONTENTS_1_1,
        spawns: ENEMY_SPAWNS_1_1,
        name: '1-1',
        checkpointTileX: 108,
        finishTileX: 198
    },
    {
        bgType: 'underground',
        layout: WORLD_1_2,
        questions: QUESTION_CONTENTS_1_2,
        spawns: ENEMY_SPAWNS_1_2,
        name: '1-2',
        checkpointTileX: 78,
        finishTileX: 135
    },
    {
        bgType: 'overworld',
        layout: WORLD_1_3,
        questions: QUESTION_CONTENTS_1_3,
        spawns: ENEMY_SPAWNS_1_3,
        name: '1-3',
        checkpointTileX: 98,
        finishTileX: 176
    }
];

export class Level {
    constructor(levelIndex = 0) {
        const safeIndex = Math.max(0, Math.min(levelIndex, LEVELS.length - 1));
        this.levelData = LEVELS[safeIndex];
        this.tiles = this.levelData.layout.map(row => [...row]);
        this.width = this.tiles[0].length * 16;
        this.height = this.tiles.length * 16;
        this.questionStates = {}; // Track which ? blocks have been hit
    }

    getTile(x, y) {
        const tileX = Math.floor(x / 16);
        const tileY = Math.floor(y / 16);

        if (tileY < 0 || tileY >= 16 || tileX < 0 || tileX >= this.tiles[0].length) {
            return TILES.EMPTY;
        }

        return this.tiles[tileY][tileX];
    }

    setTile(x, y, tile) {
        const tileX = Math.floor(x / 16);
        const tileY = Math.floor(y / 16);

        if (tileY >= 0 && tileY < 16 && tileX >= 0 && tileX < this.tiles[0].length) {
            this.tiles[tileY][tileX] = tile;
        }
    }

    isSolid(tileType) {
        return tileType !== TILES.EMPTY &&
            tileType !== TILES.FLAG_POLE &&
            tileType !== TILES.FLAG_TOP;
    }

    checkCollision(x, y, width, height) {
        // Check all four corners and midpoints
        const points = [
            [x, y],                     // Top-left
            [x + width - 1, y],         // Top-right
            [x, y + height - 1],        // Bottom-left
            [x + width - 1, y + height - 1], // Bottom-right
            [x + width / 2, y],           // Top-middle
            [x + width / 2, y + height - 1] // Bottom-middle
        ];

        for (const [px, py] of points) {
            const tile = this.getTile(px, py);
            if (this.isSolid(tile)) {
                return true;
            }
        }
        return false;
    }

    getQuestionContent(x, y) {
        const key = `${Math.floor(x / 16)},${Math.floor(y / 16)}`;
        return this.levelData.questions[key] || ITEMS.COIN;
    }
}
