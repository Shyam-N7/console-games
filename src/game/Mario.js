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
        this.groundGraceTimer = 0; // coyote time in ms
        this.jumpBufferTimer = 0; // jump input buffer in ms
        this.prevJumpInput = false;
        this.prevX = x;
        this.prevY = y;

        // Power-ups
        this.fireballCooldown = 0;

        // Animation
        this.animFrame = 0;
        this.animTimer = 0;
        this.walkCycle = 0;
    }

    update(input, level, deltaTime) {
        this.prevX = this.x;
        this.prevY = this.y;

        if (this.dead) {
            // Death animation - just fall
            this.vy += PHYSICS.GRAVITY;
            this.y += this.vy;
            this.prevJumpInput = Boolean(input.jump);
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

        // Coyote time (forgiving jumps right after leaving a ledge)
        if (this.onGround) {
            this.groundGraceTimer = 100;
        } else if (this.groundGraceTimer > 0) {
            this.groundGraceTimer = Math.max(0, this.groundGraceTimer - deltaTime);
        }

        // Fireball cooldown
        if (this.fireballCooldown > 0) this.fireballCooldown -= deltaTime;

        const jumpPressed = Boolean(input.jump);
        const jumpJustPressed = jumpPressed && !this.prevJumpInput;

        if (jumpJustPressed) {
            this.jumpBufferTimer = 120;
        } else if (this.jumpBufferTimer > 0) {
            this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - deltaTime);
        }

        // Buffered jump + coyote time
        if (this.jumpBufferTimer > 0 && (this.onGround || this.groundGraceTimer > 0)) {
            this.vy = PHYSICS.JUMP_VELOCITY;
            this.onGround = false;
            this.groundGraceTimer = 0;
            this.jumpBufferTimer = 0;
            this.jumping = true;
        }

        // Variable jump height - hold to jump higher
        if (this.jumping && input.jumpHeld && this.vy < 0) {
            this.vy += PHYSICS.JUMP_BOOST;
        }

        // Release jump
        if (!input.jumpHeld && this.jumping) {
            this.jumping = false;
            // Cut jump short smoothly
            if (this.vy < 0) {
                this.vy *= 0.5; // Dampen upward momentum
            }
        }

        // Gravity
        this.vy += PHYSICS.GRAVITY;
        this.vy = Math.min(this.vy, PHYSICS.MAX_FALL_SPEED);

        // Apply horizontal movement with collision
        this.moveX(level);

        // Apply vertical movement with collision
        this.moveY(level);

        if (this.y < 0) {
            this.y = 0;
            if (this.vy < 0) this.vy = 0;
            this.jumping = false;
        }

        // Update animation
        this.updateAnimation(deltaTime);

        // Check for falling into pit
        if (this.y > 16 * 16) {
            this.die();
        }

        // Left boundary
        if (this.x < 0) this.x = 0;

        this.prevJumpInput = jumpPressed;
    }

    moveX(level) {
        const totalMove = this.vx;
        const steps = Math.max(1, Math.ceil(Math.abs(totalMove) / 2));
        const stepX = totalMove / steps;

        for (let step = 0; step < steps; step++) {
            const newX = this.x + stepX;
            const top = this.y + 1;
            const bottom = this.y + this.height - 2;

            if (stepX > 0) {
                const rightEdge = newX + this.width - 1;
                const tileX = Math.floor(rightEdge / 16);

                for (let py = top; py <= bottom; py += 6) {
                    const tile = level.getTile(rightEdge, py);
                    if (level.isSolid(tile)) {
                        this.x = tileX * 16 - this.width;
                        this.vx = 0;
                        return;
                    }
                }
            } else if (stepX < 0) {
                const tileX = Math.floor(newX / 16);

                for (let py = top; py <= bottom; py += 6) {
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
    }

    moveY(level) {
        this.hitBlock = null;

        const totalMove = this.vy;
        const steps = Math.max(1, Math.ceil(Math.abs(totalMove) / 2));
        const stepY = totalMove / steps;
        const left = this.x + 2;
        const right = this.x + this.width - 3;

        for (let step = 0; step < steps; step++) {
            const newY = this.y + stepY;

            if (stepY > 0) {
                // Falling
                const bottomEdge = newY + this.height - 1;
                const tileY = Math.floor(bottomEdge / 16);

                for (let px = left; px <= right; px += 5) {
                    const tile = level.getTile(px, bottomEdge);
                    if (level.isSolid(tile)) {
                        this.y = tileY * 16 - this.height;
                        this.vy = 0;
                        this.onGround = true;
                        this.jumping = false;
                        return;
                    }
                }

                this.y = newY;
                this.onGround = false;
            } else if (stepY < 0) {
                // Jumping up
                const topEdge = newY;
                const tileY = Math.floor(topEdge / 16);

                for (let px = left; px <= right; px += 5) {
                    const tile = level.getTile(px, topEdge);
                    if (level.isSolid(tile)) {
                        this.y = (tileY + 1) * 16;
                        this.vy = 0;
                        this.jumping = false;
                        this.hitBlock = { x: Math.floor(px / 16), y: tileY };
                        return;
                    }
                }

                this.y = newY;
                this.onGround = false;
            } else {
                this.y = newY;
            }
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
        } else if (this.state === 'big') {
            this.state = 'fire';
        }
    }

    shrink() {
        if (this.state === 'fire') {
            this.state = 'big';
            this.invincible = true;
            this.invincibleTimer = 2000;
        } else if (this.state === 'big') {
            this.state = 'small';
            this.height = PHYSICS.SMALL_HEIGHT;
            this.invincible = true;
            this.invincibleTimer = 2000;
        } else if (!this.invincible) {
            this.die();
        }
    }

    throwFireball() {
        if (this.state === 'fire' && this.fireballCooldown <= 0) {
            this.fireballCooldown = 150; // Delay between throws
            const spawnX = this.facingRight ? this.x + this.width : this.x - 8;
            const spawnY = this.y + 8;
            return new Fireball(spawnX, spawnY, this.facingRight);
        }
        return null;
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
            const hatColor = red;
            const shirtColor = red;
            const skinColor = skin;

            // Head
            ctx.fillStyle = hatColor;
            ctx.fillRect(x + 3, py + 0, 6, 2);
            ctx.fillRect(x + 2, py + 2, 9, 2);

            ctx.fillStyle = shirtColor;
            ctx.fillRect(x + 2, py + 4, 3, 2);
            ctx.fillStyle = skinColor;
            ctx.fillRect(x + 5, py + 4, 4, 4);

            // Body
            ctx.fillStyle = hatColor;
            ctx.fillRect(x + 2, py + 10, 10, 6);

            // Legs
            ctx.fillStyle = shirtColor;
            ctx.fillRect(x + 2, py + 16, 4, 8);
            ctx.fillRect(x + 8, py + 16, 4, 8);

            // Feet
            ctx.fillStyle = brown;
            ctx.fillRect(x + 0, py + 24, 5, 4);
            ctx.fillRect(x + 9, py + 24, 5, 4);
        }

        ctx.restore();
    }
}

export class Fireball {
    constructor(x, y, goingRight) {
        this.x = x;
        this.y = y;
        this.vx = goingRight ? 5 : -5;
        this.vy = 2; // Initial slight downward throw
        this.width = 8;
        this.height = 8;
        this.dead = false;

        this.animTimer = 0;
        this.frame = 0;
    }

    update(level, deltaTime) {
        if (this.dead) return true;

        this.vy += PHYSICS.GRAVITY * 0.5; // lighter gravity for fireballs
        this.vy = Math.min(this.vy, PHYSICS.MAX_FALL_SPEED);

        const newX = this.x + this.vx;
        const newY = this.y + this.vy;

        const leftTile = level.getTile(newX, newY + this.height / 2);
        const rightTile = level.getTile(newX + this.width, newY + this.height / 2);
        if (level.isSolid(leftTile) || level.isSolid(rightTile)) {
            return true; // Destroy on hitting a wall
        }

        const bottomTile = level.getTile(newX + 4, newY + this.height);
        if (level.isSolid(bottomTile)) {
            // Bounce
            this.y = Math.floor((newY + this.height) / 16) * 16 - this.height;
            this.vy = -4.5; // Bounce height
        } else {
            this.y = newY;
        }

        this.x = newX;

        // Animate spin
        this.animTimer += deltaTime;
        if (this.animTimer > 50) {
            this.animTimer = 0;
            this.frame = (this.frame + 1) % 4;
        }

        return this.y > 300 || this.x < 0 || this.x > level.width;
    }

    render(ctx, cameraX) {
        const screenX = Math.floor(this.x - cameraX);
        const screenY = Math.floor(this.y);

        if (screenX < -10 || screenX > 260) return;

        ctx.fillStyle = (this.frame % 2 === 0) ? '#f83800' : '#f8b800'; // Flash red/orange
        ctx.fillRect(screenX + 2, screenY + 0, 4, 8);
        ctx.fillRect(screenX + 0, screenY + 2, 8, 4);
        ctx.fillStyle = '#fff'; // White center hole
        ctx.fillRect(screenX + 2, screenY + 2, 4, 4);
    }
}
