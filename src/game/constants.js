// Authentic NES Super Mario Bros Physics Constants
export const PHYSICS = {
    // Hybrid arcade tuning: responsive but still retro
    GRAVITY: 0.55,

    // Walking
    WALK_ACCEL: 0.16,
    WALK_DECEL: 0.24,
    MAX_WALK_SPEED: 2.6,

    // Running
    RUN_ACCEL: 0.24,
    MAX_RUN_SPEED: 4.4,

    // Jumping (variable height based on button hold)
    JUMP_VELOCITY: -8.6,
    JUMP_BOOST: -0.12,
    MAX_FALL_SPEED: 9.0,

    // Mario size
    SMALL_HEIGHT: 16,
    BIG_HEIGHT: 32,
    WIDTH: 16
};

// Tile types
export const TILES = {
    EMPTY: 0,
    GROUND: 1,
    BRICK: 2,
    QUESTION: 3,
    QUESTION_EMPTY: 4,
    HARD: 5,
    PIPE_TOP_L: 6,
    PIPE_TOP_R: 7,
    PIPE_L: 8,
    PIPE_R: 9,
    FLAG_POLE: 10,
    FLAG_TOP: 11,
    CASTLE: 12
};

// Item types from question blocks
export const ITEMS = {
    COIN: 1,
    MUSHROOM: 2,
    FIRE_FLOWER: 3,
    STAR: 4,
    ONE_UP: 5
};

// Enemy types
export const ENEMIES = {
    GOOMBA: 1,
    KOOPA: 2,
    PIRANHA: 3
};

// Game states
export const STATES = {
    TITLE: 0,
    PLAYING: 1,
    PAUSED: 2,
    DYING: 3,
    GAME_OVER: 4,
    LEVEL_COMPLETE: 5
};

// Sprite animation frames
export const ANIMATIONS = {
    MARIO_IDLE: [0],
    MARIO_WALK: [1, 2, 3],
    MARIO_RUN: [1, 2, 3],
    MARIO_JUMP: [4],
    MARIO_SKID: [5],
    MARIO_CLIMB: [6, 7],

    GOOMBA_WALK: [0, 1],
    GOOMBA_DEAD: [2],

    COIN_SPIN: [0, 1, 2, 3],

    QUESTION_BLINK: [0, 1, 2, 1]
};

// NES Color Palette (authentic colors)
export const COLORS = {
    SKY: '#5c94fc',
    GROUND: '#e4a672',
    BRICK: '#b13425',
    QUESTION: '#f89800',
    PIPE: '#00a800',
    MARIO_RED: '#b13425',
    MARIO_SKIN: '#efa87c',
    MARIO_BROWN: '#6b420c',
    GOOMBA: '#ab5236',
    COIN: '#f8d800'
};

// NES resolution
export const SCREEN = {
    WIDTH: 256,
    HEIGHT: 240,
    TILE_SIZE: 16,
    SCALE: 3
};
