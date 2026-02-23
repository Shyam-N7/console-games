import { PHYSICS, STATES, COLORS } from './constants.js';

export class Mario {
    constructor(x, y) {
        // Position (in pixels)
        this.x = x;
        this.y = y;

        // Velocity
        this.vx = 0;
        this.vy = 0;

        // State
        this.state = 'small'; // small, big, fire
        this.width = PHYSICS.WIDTH;
        this.height = PHYSICS.SMALL_HEIGHT;

        // Flags
        this.onGround = false;
        this.facingRight = true;
        this.jumping = false;
        this.running = false;
        this.dead = false;
        this.invincible = false;
        this.invincibleTimer = 0;

        // Animation
        this.animFrame = 0;
        this.animTimer = 0;
        this.walkCycle = 0;
    }

    update(input, level, deltaTime) {
        if (this.dead) {
            // Death animation - just fall
            this.vy += PHYSICS.GRAVITY;
            this.y += this.vy;
            return;
        }

        // Invincibility timer
        if (this.invincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // Horizontal movement
        const accel = input.run ? PHYSICS.RUN_ACCEL : PHYSICS.WALK_ACCEL;
        const maxSpeed = input.run ? PHYSICS.MAX_RUN_SPEED : PHYSICS.MAX_WALK_SPEED;

        if (input.left) {
            this.vx -= accel;
            this.facingRight = false;
        } else if (input.right) {
            this.vx += accel;
            this.facingRight = true;
        } else {
            // Deceleration
            if (this.vx > 0) {
                this.vx = Math.max(0, this.vx - PHYSICS.WALK_DECEL);
            } else if (this.vx < 0) {
                this.vx = Math.min(0, this.vx + PHYSICS.WALK_DECEL);
            }
        }

        // Clamp horizontal speed
        this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

        // Jumping
        if (input.jump && this.onGround && !this.jumping) {
            this.vy = PHYSICS.JUMP_VELOCITY;
            this.onGround = false;
            this.jumping = true;
        }

        // Variable jump height - hold to jump higher
        if (this.jumping && input.jumpHeld && this.vy < 0) {
            this.vy += PHYSICS.JUMP_BOOST;
        }

        // Release jump
        if (!input.jumpHeld) {
            this.jumping = false;
            // Cut jump short
            if (this.vy < -3) {
                this.vy = -3;
            }
        }

        // Gravity
        this.vy += PHYSICS.GRAVITY;
        this.vy = Math.min(this.vy, PHYSICS.MAX_FALL_SPEED);

        // Apply horizontal movement with collision
        this.moveX(level);

        // Apply vertical movement with collision
        this.moveY(level);

        // Update animation
        this.updateAnimation(deltaTime);

        // Check for falling into pit
        if (this.y > 16 * 16) {
            this.die();
        }

        // Left boundary
        if (this.x < 0) this.x = 0;
    }

    moveX(level) {
        const newX = this.x + this.vx;

        // Check collision at new position
        const top = this.y;
        const bottom = this.y + this.height - 1;

        if (this.vx > 0) {
            // Moving right
            const rightEdge = newX + this.width - 1;
            const tileX = Math.floor(rightEdge / 16);

            for (let py = top; py <= bottom; py += 8) {
                const tile = level.getTile(rightEdge, py);
                if (level.isSolid(tile)) {
                    this.x = tileX * 16 - this.width;
                    this.vx = 0;
                    return;
                }
            }
        } else if (this.vx < 0) {
            // Moving left
            const tileX = Math.floor(newX / 16);

            for (let py = top; py <= bottom; py += 8) {
                const tile = level.getTile(newX, py);
                if (level.isSolid(tile)) {
                    this.x = (tileX + 1) * 16;
                    this.vx = 0;
                    return;
                }
            }
        }

        this.x = Math.max(0, newX);
    }

    moveY(level) {
        const newY = this.y + this.vy;

        const left = this.x + 2;
        const right = this.x + this.width - 3;

        if (this.vy > 0) {
            // Falling
            const bottomEdge = newY + this.height - 1;
            const tileY = Math.floor(bottomEdge / 16);

            let landed = false;
            for (let px = left; px <= right; px += 6) {
                const tile = level.getTile(px, bottomEdge);
                if (level.isSolid(tile)) {
                    this.y = tileY * 16 - this.height;
                    this.vy = 0;
                    this.onGround = true;
                    landed = true;
                    break;
                }
            }

            if (!landed) {
                this.y = newY;
                this.onGround = false;
            }
        } else if (this.vy < 0) {
            // Jumping up
            const tileY = Math.floor(newY / 16);

            let hitHead = false;
            let hitTileX = -1;

            for (let px = left; px <= right; px += 6) {
                const tile = level.getTile(px, newY);
                if (level.isSolid(tile)) {
                    hitHead = true;
                    hitTileX = Math.floor(px / 16);
                    break;
                }
            }

            if (hitHead) {
                this.y = (tileY + 1) * 16;
                this.vy = 0;

                // Return hit block info for the game to handle
                this.hitBlock = { x: hitTileX, y: tileY };
            } else {
                this.y = newY;
                this.hitBlock = null;
            }
        } else {
            this.y = newY;
        }
    }

    updateAnimation(deltaTime) {
        this.animTimer += deltaTime;

        if (this.animTimer > 100) {
            this.animTimer = 0;

            if (Math.abs(this.vx) > 0.5) {
                this.walkCycle = (this.walkCycle + 1) % 3;
            } else {
                this.walkCycle = 0;
            }
        }
    }

    grow() {
        if (this.state === 'small') {
            this.state = 'big';
            this.height = PHYSICS.BIG_HEIGHT;
            this.y -= 16; // Adjust position
        }
    }

    shrink() {
        if (this.state !== 'small') {
            this.state = 'small';
            this.height = PHYSICS.SMALL_HEIGHT;
            this.invincible = true;
            this.invincibleTimer = 2000;
        } else if (!this.invincible) {
            this.die();
        }
    }

    die() {
        this.dead = true;
        this.vy = PHYSICS.JUMP_VELOCITY;
    }

    render(ctx, cameraX) {
        let screenX = Math.floor(this.x - cameraX);
        const screenY = Math.floor(this.y);

        // Skip render if blinking during invincibility
        if (this.invincible && Math.floor(this.invincibleTimer / 100) % 2 === 0) {
            return;
        }

        // Draw Mario (pixel art style)
        // For left-facing, we just draw the same sprite (simplified - no flip for now)
        this.drawMarioSprite(ctx, screenX, screenY, this.facingRight);
    }

    drawMarioSprite(ctx, x, y, facingRight = true) {
        const isSmall = this.state === 'small';
        const jumping = !this.onGround;
        const walking = Math.abs(this.vx) > 0.5;

        // Colors
        const red = COLORS.MARIO_RED;
        const skin = COLORS.MARIO_SKIN;
        const brown = COLORS.MARIO_BROWN;

        ctx.imageSmoothingEnabled = false;

        // Save context and handle flipping
        ctx.save();
        if (!facingRight) {
            ctx.translate(x + this.width, y);
            ctx.scale(-1, 1);
            x = 0;
            y = 0;
        }

        if (isSmall) {
            // Small Mario sprite (16x16)
            const py = y;

            // Hat (red)
            ctx.fillStyle = red;
            ctx.fillRect(x + 3, py + 0, 5, 1);
            ctx.fillRect(x + 2, py + 1, 8, 1);

            // Hair/Face
            ctx.fillStyle = brown;
            ctx.fillRect(x + 2, py + 2, 3, 1);
            ctx.fillStyle = skin;
            ctx.fillRect(x + 5, py + 2, 3, 1);
            ctx.fillStyle = brown;
            ctx.fillRect(x + 8, py + 2, 1, 1);

            ctx.fillStyle = brown;
            ctx.fillRect(x + 1, py + 3, 1, 1);
            ctx.fillStyle = skin;
            ctx.fillRect(x + 2, py + 3, 2, 1);
            ctx.fillStyle = brown;
            ctx.fillRect(x + 4, py + 3, 1, 1);
            ctx.fillStyle = skin;
            ctx.fillRect(x + 5, py + 3, 4, 1);

            ctx.fillStyle = brown;
            ctx.fillRect(x + 1, py + 4, 1, 1);
            ctx.fillStyle = skin;
            ctx.fillRect(x + 2, py + 4, 1, 1);
            ctx.fillStyle = brown;
            ctx.fillRect(x + 3, py + 4, 2, 1);
            ctx.fillStyle = skin;
            ctx.fillRect(x + 5, py + 4, 4, 1);

            ctx.fillStyle = skin;
            ctx.fillRect(x + 3, py + 5, 5, 1);

            // Body (red)
            ctx.fillStyle = red;
            ctx.fillRect(x + 2, py + 6, 6, 1);
            ctx.fillRect(x + 1, py + 7, 8, 1);
            ctx.fillRect(x + 1, py + 8, 8, 1);

            // Overalls
            ctx.fillStyle = brown;
            ctx.fillRect(x + 3, py + 9, 4, 1);

            // Legs
            if (jumping) {
                // Jump pose
                ctx.fillStyle = red;
                ctx.fillRect(x + 1, py + 9, 2, 2);
                ctx.fillRect(x + 7, py + 9, 2, 2);
                ctx.fillStyle = brown;
                ctx.fillRect(x + 0, py + 11, 3, 2);
                ctx.fillRect(x + 7, py + 11, 3, 2);
            } else if (walking) {
                // Walk cycle
                const frame = this.walkCycle;
                ctx.fillStyle = brown;
                if (frame === 0) {
                    ctx.fillRect(x + 1, py + 10, 3, 3);
                    ctx.fillRect(x + 6, py + 10, 3, 3);
                } else if (frame === 1) {
                    ctx.fillRect(x + 2, py + 10, 3, 3);
                    ctx.fillRect(x + 7, py + 10, 3, 3);
                } else {
                    ctx.fillRect(x + 0, py + 10, 3, 3);
                    ctx.fillRect(x + 5, py + 10, 3, 3);
                }
            } else {
                // Standing
                ctx.fillStyle = brown;
                ctx.fillRect(x + 1, py + 10, 3, 3);
                ctx.fillRect(x + 6, py + 10, 3, 3);
            }
        } else {
            // Big Mario (16x32) - simplified for now
            const py = y;

            // Head
            ctx.fillStyle = red;
            ctx.fillRect(x + 3, py + 0, 6, 2);
            ctx.fillRect(x + 2, py + 2, 9, 2);

            ctx.fillStyle = brown;
            ctx.fillRect(x + 2, py + 4, 3, 2);
            ctx.fillStyle = skin;
            ctx.fillRect(x + 5, py + 4, 4, 4);

            // Body
            ctx.fillStyle = red;
            ctx.fillRect(x + 2, py + 10, 10, 6);

            // Legs
            ctx.fillStyle = brown;
            ctx.fillRect(x + 2, py + 16, 4, 8);
            ctx.fillRect(x + 8, py + 16, 4, 8);

            // Feet
            ctx.fillRect(x + 0, py + 24, 5, 4);
            ctx.fillRect(x + 9, py + 24, 5, 4);
        }

        ctx.restore();
    }
}
