import { TILES, COLORS, SCREEN, ITEMS, STATES } from './constants.js';
import { Mario } from './Mario.js';
import { Level, ENEMY_SPAWNS, QUESTION_CONTENTS } from './Level.js';
import { Goomba } from './Enemies.js';
import { sounds } from './Audio.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = SCREEN.WIDTH;
        this.canvas.height = SCREEN.HEIGHT;

        // Disable image smoothing for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;

        // Game state
        this.state = STATES.TITLE;
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.time = 400;
        this.timeTimer = 0;

        // Camera
        this.cameraX = 0;

        // Create level and player
        this.level = new Level();
        this.mario = new Mario(48, 192);

        // Enemies
        this.enemies = [];
        this.spawnedEnemyPositions = new Set(); // Track which spawns have been used

        // Effects/Particles
        this.particles = [];
        this.floatingScores = [];

        // Block animations
        this.bumpingBlocks = [];

        // Input state
        this.input = {
            left: false,
            right: false,
            down: false,
            jump: false,
            jumpHeld: false,
            run: false
        };

        // UI state
        this.showControls = false;
        this.onMenu = null; // Callback for menu button

        // Timing
        this.lastTime = 0;
        this.animTimer = 0;

        // Bind methods
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
    }

    init() {
        sounds.init();
        this.spawnEnemies();
        this.state = STATES.PLAYING;
    }

    spawnEnemies() {
        this.enemies = [];
        for (const spawn of ENEMY_SPAWNS) {
            // Only spawn enemies within reasonable range
            if (spawn.x < this.cameraX + 400) {
                const goomba = new Goomba(spawn.x, spawn.y);
                this.enemies.push(goomba);
            }
        }
    }

    reset() {
        this.mario = new Mario(48, 192);
        this.cameraX = 0;
        this.enemies = [];
        this.spawnedEnemyPositions = new Set();
        this.particles = [];
        this.floatingScores = [];
        this.bumpingBlocks = [];
        this.level = new Level();
        this.spawnEnemies();
        this.time = 400;
        this.state = STATES.PLAYING;
    }

    handleInput(key, pressed) {
        // Show controls overlay
        if (key.toLowerCase() === 'c' && pressed) {
            this.showControls = !this.showControls;
            return;
        }

        // Menu key
        if (key.toLowerCase() === 'm' && pressed) {
            if (this.onMenu) this.onMenu();
            return;
        }

        switch (key.toLowerCase()) {
            case 'arrowleft':
            case 'a':
                this.input.left = pressed;
                break;
            case 'arrowright':
            case 'd':
                this.input.right = pressed;
                break;
            case 'arrowup':
            case 'w':
            case 'k': // A button - Jump
            case ' ':
                this.input.jump = pressed;
                this.input.jumpHeld = pressed;
                break;
            case 's':
            case 'arrowdown':
                this.input.down = pressed;
                break;
            case 'l': // B button - Run
            case 'shift':
                this.input.run = pressed;
                break;
            case 'enter':
                if (this.state === STATES.TITLE || this.state === STATES.GAME_OVER) {
                    this.reset();
                }
                break;
        }
    }

    update(deltaTime) {
        if (this.state !== STATES.PLAYING) return;

        // Update timer
        this.timeTimer += deltaTime;
        if (this.timeTimer > 400) {
            this.timeTimer = 0;
            this.time--;
            if (this.time <= 0) {
                this.mario.die();
                sounds.die();
            }
        }

        // Spawn enemies as camera moves (only once per spawn point)
        for (let i = 0; i < ENEMY_SPAWNS.length; i++) {
            const spawn = ENEMY_SPAWNS[i];
            const spawnKey = `${i}`;

            if (spawn.x > this.cameraX - 50 && spawn.x < this.cameraX + SCREEN.WIDTH + 100) {
                if (!this.spawnedEnemyPositions.has(spawnKey)) {
                    const goomba = new Goomba(spawn.x, spawn.y);
                    this.enemies.push(goomba);
                    this.spawnedEnemyPositions.add(spawnKey);
                }
            }
        }

        // Update Mario
        this.mario.update(this.input, this.level, deltaTime);

        // Check if Mario hit a block
        if (this.mario.hitBlock) {
            this.hitBlock(this.mario.hitBlock.x, this.mario.hitBlock.y);
            this.mario.hitBlock = null;
        }

        // Check Mario death
        if (this.mario.dead && this.mario.y > SCREEN.HEIGHT + 50) {
            this.lives--;
            if (this.lives <= 0) {
                this.state = STATES.GAME_OVER;
                sounds.gameOver();
            } else {
                this.reset();
            }
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const remove = enemy.update(this.level, deltaTime);

            if (remove) {
                this.enemies.splice(i, 1);
                continue;
            }

            // Check collision with Mario
            if (!enemy.dead && !this.mario.dead && !this.mario.invincible) {
                if (this.checkCollision(this.mario, enemy)) {
                    // Check if Mario is stomping
                    if (this.mario.vy > 0 && this.mario.y + this.mario.height - 8 < enemy.y + 8) {
                        enemy.stomp();
                        this.mario.vy = -6; // Bounce
                        this.score += 100;
                        this.addFloatingScore(enemy.x, enemy.y, 100);
                        sounds.stomp();
                    } else {
                        // Mario gets hit
                        this.mario.shrink();
                        sounds.bump();
                    }
                }
            }
        }

        // Update camera (classic Mario: only scrolls right)
        const targetCameraX = this.mario.x - SCREEN.WIDTH / 3;
        if (targetCameraX > this.cameraX) {
            this.cameraX = Math.min(targetCameraX, this.level.width - SCREEN.WIDTH);
        }
        this.cameraX = Math.max(0, this.cameraX);

        // Mario can't go left of camera
        if (this.mario.x < this.cameraX) {
            this.mario.x = this.cameraX;
            this.mario.vx = 0;
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].life -= deltaTime;
            this.particles[i].x += this.particles[i].vx;
            this.particles[i].y += this.particles[i].vy;
            this.particles[i].vy += 0.3;

            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update floating scores
        for (let i = this.floatingScores.length - 1; i >= 0; i--) {
            this.floatingScores[i].y -= 1;
            this.floatingScores[i].life -= deltaTime;

            if (this.floatingScores[i].life <= 0) {
                this.floatingScores.splice(i, 1);
            }
        }

        // Update bumping blocks
        for (let i = this.bumpingBlocks.length - 1; i >= 0; i--) {
            const block = this.bumpingBlocks[i];
            block.timer += deltaTime;

            if (block.timer > 150) {
                this.bumpingBlocks.splice(i, 1);
            }
        }

        // Check for flag pole
        if (this.mario.x >= 198 * 16) {
            this.state = STATES.LEVEL_COMPLETE;
            sounds.levelComplete();
            this.score += this.time * 50;
        }
    }

    hitBlock(tileX, tileY) {
        const tile = this.level.tiles[tileY][tileX];

        if (tile === TILES.QUESTION) {
            // Change to empty block
            this.level.tiles[tileY][tileX] = TILES.QUESTION_EMPTY;

            // All blocks give coins for now
            this.coins++;
            this.score += 200;
            this.addFloatingScore(tileX * 16, tileY * 16 - 16, 200);
            sounds.coin();

            // Coin animation particle
            this.particles.push({
                x: tileX * 16 + 4,
                y: tileY * 16 - 8,
                vx: 0,
                vy: -8,
                life: 400,
                type: 'coin'
            });

            // Block bump animation
            this.bumpingBlocks.push({
                x: tileX,
                y: tileY,
                timer: 0
            });

            sounds.bump();
        } else if (tile === TILES.BRICK) {
            if (this.mario.state !== 'small') {
                // Break brick
                this.level.tiles[tileY][tileX] = TILES.EMPTY;
                this.score += 50;
                sounds.breakBlock();

                // Brick debris particles
                for (let i = 0; i < 4; i++) {
                    this.particles.push({
                        x: tileX * 16 + (i % 2) * 8,
                        y: tileY * 16 + Math.floor(i / 2) * 8,
                        vx: (i % 2 === 0 ? -2 : 2) + Math.random(),
                        vy: -5 - Math.random() * 3,
                        life: 800,
                        type: 'brick'
                    });
                }
            } else {
                // Just bump
                this.bumpingBlocks.push({
                    x: tileX,
                    y: tileY,
                    timer: 0
                });
                sounds.bump();
            }
        }
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
    }

    addFloatingScore(x, y, score) {
        this.floatingScores.push({
            x, y, score, life: 800
        });
    }

    render() {
        const ctx = this.ctx;

        // Clear with sky color
        ctx.fillStyle = COLORS.SKY;
        ctx.fillRect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT);

        // Render based on state
        if (this.state === STATES.TITLE) {
            this.renderTitle();
        } else if (this.state === STATES.GAME_OVER) {
            this.renderGameOver();
        } else if (this.state === STATES.LEVEL_COMPLETE) {
            this.renderLevelComplete();
        } else {
            this.renderGame();
        }

        // Controls overlay (toggle with C)
        if (this.showControls) {
            this.renderControlsOverlay();
        }
    }

    renderControlsOverlay() {
        const ctx = this.ctx;

        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CONTROLS', SCREEN.WIDTH / 2, 30);

        ctx.font = '8px monospace';
        ctx.textAlign = 'left';

        const startX = 40;
        const startY = 55;
        const lineHeight = 16;

        const controls = [
            ['W / ↑', 'Jump'],
            ['A / ←', 'Move Left'],
            ['S / ↓', 'Duck'],
            ['D / →', 'Move Right'],
            ['K', 'Jump (A Button)'],
            ['L', 'Run (B Button)'],
            ['SPACE', 'Jump'],
            ['ENTER', 'Start / Restart'],
            ['M', 'Back to Menu'],
            ['C', 'Toggle Controls']
        ];

        controls.forEach((ctrl, i) => {
            ctx.fillStyle = '#ffcc00';
            ctx.fillText(ctrl[0], startX, startY + i * lineHeight);
            ctx.fillStyle = '#fff';
            ctx.fillText(ctrl[1], startX + 70, startY + i * lineHeight);
        });

        ctx.fillStyle = '#888';
        ctx.textAlign = 'center';
        ctx.fillText('Press C to close', SCREEN.WIDTH / 2, SCREEN.HEIGHT - 15);
    }

    renderTitle() {
        const ctx = this.ctx;

        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SUPER MARIO BROS', SCREEN.WIDTH / 2, 60);

        ctx.font = '8px monospace';
        ctx.fillStyle = '#666';
        ctx.fillText('© 1985 NINTENDO', SCREEN.WIDTH / 2, 80);

        // Draw Mario
        this.drawSmallMario(SCREEN.WIDTH / 2 - 8, 100);

        // 1 PLAYER GAME
        ctx.fillStyle = '#000';
        ctx.font = '10px monospace';
        ctx.fillText('1 PLAYER GAME', SCREEN.WIDTH / 2, 150);

        // Controls hint
        ctx.fillStyle = COLORS.MARIO_RED;
        ctx.font = '8px monospace';
        ctx.fillText('PRESS ENTER TO START', SCREEN.WIDTH / 2, 180);

        ctx.fillStyle = '#888';
        ctx.font = '7px monospace';
        ctx.fillText('WASD/Arrows = Move  K = Jump  L = Run', SCREEN.WIDTH / 2, 210);
        ctx.fillText('C = Show Controls  M = Menu', SCREEN.WIDTH / 2, 222);
    }

    renderGameOver() {
        const ctx = this.ctx;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT);

        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2);

        ctx.font = '10px monospace';
        ctx.fillText(`SCORE: ${this.score}`, SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2 + 30);
        ctx.fillText('PRESS ENTER', SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2 + 60);
    }

    renderLevelComplete() {
        const ctx = this.ctx;

        // Still show the game
        this.renderGame();

        // Overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT);

        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2 - 20);
        ctx.font = '12px monospace';
        ctx.fillText(`SCORE: ${this.score}`, SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2 + 20);
    }

    renderGame() {
        const ctx = this.ctx;

        // Render decorative background (hills, clouds, bushes)
        this.renderBackground();

        // Render level tiles
        this.renderLevel();

        // Render enemies
        for (const enemy of this.enemies) {
            enemy.render(ctx, this.cameraX);
        }

        // Render Mario
        this.mario.render(ctx, this.cameraX);

        // Render particles
        this.renderParticles();

        // Render floating scores
        this.renderFloatingScores();

        // Render HUD
        this.renderHUD();
    }

    renderBackground() {
        const ctx = this.ctx;

        // Draw hills
        ctx.fillStyle = '#80d010';

        // Large hills
        for (let i = 0; i < 10; i++) {
            const hillX = i * 384 - (this.cameraX * 0.5) % 384;
            this.drawHill(ctx, hillX, SCREEN.HEIGHT - 50, 80, 40);
        }

        // Small hills
        for (let i = 0; i < 10; i++) {
            const hillX = i * 384 + 150 - (this.cameraX * 0.5) % 384;
            this.drawHill(ctx, hillX, SCREEN.HEIGHT - 45, 40, 25);
        }

        // Clouds
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 8; i++) {
            const cloudX = i * 300 - (this.cameraX * 0.3) % 300;
            this.drawCloud(ctx, cloudX, 30 + (i % 3) * 20);
        }

        // Bushes
        ctx.fillStyle = '#00a800';
        for (let i = 0; i < 10; i++) {
            const bushX = i * 256 + 100 - this.cameraX % 256;
            this.drawBush(ctx, bushX, SCREEN.HEIGHT - 32);
        }
    }

    drawHill(ctx, x, y, width, height) {
        ctx.beginPath();
        ctx.arc(x + width / 2, y, width / 2, Math.PI, 0);
        ctx.fill();
    }

    drawCloud(ctx, x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.arc(x + 16, y - 4, 14, 0, Math.PI * 2);
        ctx.arc(x + 32, y, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBush(ctx, x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 10, Math.PI, 0);
        ctx.arc(x + 14, y, 12, Math.PI, 0);
        ctx.arc(x + 28, y, 10, Math.PI, 0);
        ctx.fill();
    }

    renderLevel() {
        const ctx = this.ctx;
        const startTile = Math.floor(this.cameraX / 16);
        const endTile = startTile + Math.ceil(SCREEN.WIDTH / 16) + 1;

        for (let y = 0; y < 16; y++) {
            for (let x = startTile; x <= endTile; x++) {
                if (x < 0 || x >= this.level.tiles[0].length) continue;

                const tile = this.level.tiles[y][x];
                if (tile === TILES.EMPTY) continue;

                const screenX = x * 16 - this.cameraX;
                const screenY = y * 16;

                // Check for bump animation
                let bumpOffset = 0;
                for (const block of this.bumpingBlocks) {
                    if (block.x === x && block.y === y) {
                        const progress = block.timer / 150;
                        bumpOffset = Math.sin(progress * Math.PI) * -4;
                        break;
                    }
                }

                this.drawTile(ctx, tile, screenX, screenY + bumpOffset);
            }
        }
    }

    drawTile(ctx, tile, x, y) {
        ctx.imageSmoothingEnabled = false;

        switch (tile) {
            case TILES.GROUND:
                ctx.fillStyle = COLORS.GROUND;
                ctx.fillRect(x, y, 16, 16);
                // Brick pattern
                ctx.fillStyle = '#c0620c';
                ctx.fillRect(x, y, 16, 2);
                ctx.fillRect(x + 7, y, 2, 8);
                ctx.fillRect(x, y + 8, 16, 2);
                ctx.fillRect(x + 15, y + 8, 2, 8);
                break;

            case TILES.BRICK:
                ctx.fillStyle = COLORS.BRICK;
                ctx.fillRect(x, y, 16, 16);
                // Brick lines
                ctx.fillStyle = '#000';
                ctx.fillRect(x, y, 16, 1);
                ctx.fillRect(x + 7, y, 2, 8);
                ctx.fillRect(x, y + 7, 16, 2);
                ctx.fillRect(x, y + 8, 2, 8);
                ctx.fillRect(x + 14, y + 8, 2, 8);
                break;

            case TILES.QUESTION:
                // Animated ? block
                ctx.fillStyle = COLORS.QUESTION;
                ctx.fillRect(x, y, 16, 16);
                // Border
                ctx.fillStyle = '#804000';
                ctx.fillRect(x, y, 16, 2);
                ctx.fillRect(x, y + 14, 16, 2);
                ctx.fillRect(x, y, 2, 16);
                ctx.fillRect(x + 14, y, 2, 16);
                // Question mark
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('?', x + 8, y + 12);
                break;

            case TILES.QUESTION_EMPTY:
                ctx.fillStyle = '#654321';
                ctx.fillRect(x, y, 16, 16);
                ctx.fillStyle = '#433219';
                ctx.fillRect(x, y, 16, 2);
                ctx.fillRect(x, y + 14, 16, 2);
                break;

            case TILES.HARD:
                ctx.fillStyle = '#654321';
                ctx.fillRect(x, y, 16, 16);
                ctx.fillStyle = '#8b6914';
                ctx.fillRect(x + 1, y + 1, 14, 14);
                ctx.fillStyle = '#433219';
                ctx.fillRect(x + 2, y + 2, 12, 12);
                ctx.fillStyle = '#654321';
                ctx.fillRect(x + 4, y + 4, 8, 8);
                break;

            case TILES.PIPE_TOP_L:
            case TILES.PIPE_TOP_R:
                ctx.fillStyle = '#00a800';
                ctx.fillRect(x, y, 16, 16);
                ctx.fillStyle = '#00d800';
                ctx.fillRect(x + 2, y + 2, 4, 14);
                ctx.fillStyle = '#006800';
                if (tile === TILES.PIPE_TOP_L) {
                    ctx.fillRect(x, y, 2, 16);
                    ctx.fillRect(x, y, 16, 2);
                } else {
                    ctx.fillRect(x + 14, y, 2, 16);
                    ctx.fillRect(x, y, 16, 2);
                }
                break;

            case TILES.PIPE_L:
            case TILES.PIPE_R:
                ctx.fillStyle = '#00a800';
                ctx.fillRect(x, y, 16, 16);
                ctx.fillStyle = '#00d800';
                ctx.fillRect(x + 4, y, 4, 16);
                ctx.fillStyle = '#006800';
                if (tile === TILES.PIPE_L) {
                    ctx.fillRect(x, y, 2, 16);
                } else {
                    ctx.fillRect(x + 14, y, 2, 16);
                }
                break;

            case TILES.FLAG_POLE:
                ctx.fillStyle = '#00a800';
                ctx.fillRect(x + 7, y, 3, 16);
                break;

            case TILES.FLAG_TOP:
                ctx.fillStyle = '#00a800';
                ctx.fillRect(x + 7, y + 8, 3, 8);
                // Flag
                ctx.fillStyle = '#00a800';
                ctx.fillRect(x + 7, y, 3, 5);
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.moveTo(x + 10, y);
                ctx.lineTo(x + 10, y + 10);
                ctx.lineTo(x, y + 5);
                ctx.fill();
                break;
        }
    }

    renderParticles() {
        const ctx = this.ctx;

        for (const p of this.particles) {
            const screenX = p.x - this.cameraX;

            if (p.type === 'coin') {
                // Spinning coin
                ctx.fillStyle = COLORS.COIN;
                const width = Math.abs(Math.sin(p.life / 50)) * 8 + 2;
                ctx.fillRect(screenX + 4 - width / 2, p.y, width, 10);
            } else if (p.type === 'brick') {
                // Brick debris
                ctx.fillStyle = COLORS.BRICK;
                ctx.fillRect(screenX, p.y, 6, 6);
            }
        }
    }

    renderFloatingScores() {
        const ctx = this.ctx;

        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';

        for (const fs of this.floatingScores) {
            const screenX = fs.x - this.cameraX;
            ctx.fillText(fs.score.toString(), screenX, fs.y);
        }
    }

    renderHUD() {
        const ctx = this.ctx;

        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';

        // Score
        ctx.fillText('MARIO', 24, 16);
        ctx.fillText(this.score.toString().padStart(6, '0'), 24, 24);

        // Coins
        ctx.fillText(`×${this.coins.toString().padStart(2, '0')}`, 100, 24);

        // World
        ctx.textAlign = 'center';
        ctx.fillText('WORLD', 160, 16);
        ctx.fillText('1-1', 160, 24);

        // Time
        ctx.textAlign = 'right';
        ctx.fillText('TIME', 232, 16);
        ctx.fillText(this.time.toString(), 232, 24);
    }

    drawSmallMario(x, y) {
        const ctx = this.ctx;
        ctx.fillStyle = COLORS.MARIO_RED;
        ctx.fillRect(x + 3, y, 5, 2);
        ctx.fillRect(x + 2, y + 2, 8, 2);
        ctx.fillStyle = COLORS.MARIO_SKIN;
        ctx.fillRect(x + 4, y + 4, 4, 3);
        ctx.fillStyle = COLORS.MARIO_RED;
        ctx.fillRect(x + 2, y + 7, 8, 3);
        ctx.fillStyle = COLORS.MARIO_BROWN;
        ctx.fillRect(x + 1, y + 10, 4, 3);
        ctx.fillRect(x + 7, y + 10, 4, 3);
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(Math.min(deltaTime, 32)); // Cap delta to prevent huge jumps
        this.render();

        requestAnimationFrame(this.gameLoop);
    }

    start() {
        this.init();
        requestAnimationFrame(this.gameLoop);
    }
}
