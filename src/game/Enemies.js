import { PHYSICS, COLORS } from './constants.js';

export class Goomba {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = -0.8; // Walk left by default
        this.vy = 0;
        this.width = 16;
        this.height = 16;
        this.dead = false;
        this.deathTimer = 0;
        this.stomped = false;

        // Animation
        this.walkFrame = 0;
        this.animTimer = 0;
    }

    update(level, deltaTime) {
        if (this.dead) {
            this.deathTimer += deltaTime;
            if (this.stomped) {
                // Flattened, wait then disappear
                return this.deathTimer > 500;
            } else {
                // Kicked, fall off screen
                this.vy += PHYSICS.GRAVITY;
                this.y += this.vy;
                return this.y > 300;
            }
        }

        // Gravity
        this.vy += PHYSICS.GRAVITY;
        this.vy = Math.min(this.vy, PHYSICS.MAX_FALL_SPEED);

        // Move
        const newX = this.x + this.vx;
        const newY = this.y + this.vy;

        // Ground collision
        const bottomY = Math.floor((newY + this.height) / 16);

        if (bottomY < 16) {
            const leftTile = level.getTile(newX + 2, newY + this.height);
            const rightTile = level.getTile(newX + this.width - 3, newY + this.height);

            if (level.isSolid(leftTile) || level.isSolid(rightTile)) {
                this.y = bottomY * 16 - this.height;
                this.vy = 0;
            } else {
                this.y = newY;
            }
        } else {
            // Fell into pit
            return true; // Remove enemy
        }

        // Wall collision - turn around
        const frontX = this.vx > 0 ? newX + this.width : newX;
        const frontTile = level.getTile(frontX, this.y + 8);

        if (level.isSolid(frontTile)) {
            this.vx *= -1;
        } else {
            this.x = newX;
        }

        // Check for edge (don't walk off platforms) - optional authentic behavior
        // Original goombas DO walk off edges

        // Animation
        this.animTimer += deltaTime;
        if (this.animTimer > 150) {
            this.animTimer = 0;
            this.walkFrame = 1 - this.walkFrame;
        }

        return false; // Don't remove
    }

    stomp() {
        this.dead = true;
        this.stomped = true;
        this.height = 8;
    }

    kick() {
        this.dead = true;
        this.vy = -5;
    }

    render(ctx, cameraX) {
        const screenX = Math.floor(this.x - cameraX);
        const screenY = Math.floor(this.y);

        if (screenX < -20 || screenX > 270) return; // Off screen

        ctx.imageSmoothingEnabled = false;

        const brown = COLORS.GOOMBA;
        const tan = '#eecfa1';
        const black = '#000000';
        const white = '#ffffff';

        if (this.stomped) {
            // Flattened goomba
            ctx.fillStyle = brown;
            ctx.fillRect(screenX, screenY + 8, 16, 8);
            return;
        }

        // Goomba body (mushroom shape)
        ctx.fillStyle = brown;

        // Head
        ctx.fillRect(screenX + 2, screenY + 0, 12, 2);
        ctx.fillRect(screenX + 1, screenY + 2, 14, 2);
        ctx.fillRect(screenX + 0, screenY + 4, 16, 4);

        // Eyes
        ctx.fillStyle = white;
        ctx.fillRect(screenX + 3, screenY + 4, 4, 4);
        ctx.fillRect(screenX + 9, screenY + 4, 4, 4);

        ctx.fillStyle = black;
        if (this.walkFrame === 0) {
            ctx.fillRect(screenX + 4, screenY + 5, 2, 3);
            ctx.fillRect(screenX + 10, screenY + 5, 2, 3);
        } else {
            ctx.fillRect(screenX + 5, screenY + 5, 2, 3);
            ctx.fillRect(screenX + 9, screenY + 5, 2, 3);
        }

        // Body/mouth area
        ctx.fillStyle = tan;
        ctx.fillRect(screenX + 2, screenY + 8, 12, 4);

        // Feet
        ctx.fillStyle = black;
        if (this.walkFrame === 0) {
            ctx.fillRect(screenX + 0, screenY + 12, 5, 4);
            ctx.fillRect(screenX + 11, screenY + 12, 5, 4);
        } else {
            ctx.fillRect(screenX + 2, screenY + 12, 5, 4);
            ctx.fillRect(screenX + 9, screenY + 12, 5, 4);
        }
    }
}

export class Koopa {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = -0.6;
        this.vy = 0;
        this.width = 16;
        this.height = 24;
        this.dead = false;
        this.stomped = false;

        // Shell specific states
        this.inShell = false;
        this.shellMoving = false;
        this.shellVx = 0;
        this.deathTimer = 0;

        this.walkFrame = 0;
        this.animTimer = 0;
    }

    update(level, deltaTime) {
        if (this.dead && !this.inShell) {
            this.deathTimer += deltaTime;
            this.vy += PHYSICS.GRAVITY;
            this.y += this.vy;
            return this.y > 300;
        }

        // Gravity
        this.vy += PHYSICS.GRAVITY;
        this.vy = Math.min(this.vy, PHYSICS.MAX_FALL_SPEED);

        // Move
        const currentVx = (this.inShell && this.shellMoving) ? this.shellVx : (this.inShell ? 0 : this.vx);
        const newX = this.x + currentVx;
        const newY = this.y + this.vy;

        // Ground collision
        const bottomY = Math.floor((newY + this.height) / 16);

        if (bottomY < 16) {
            const leftTile = level.getTile(newX + 2, newY + this.height);
            const rightTile = level.getTile(newX + this.width - 3, newY + this.height);

            if (level.isSolid(leftTile) || level.isSolid(rightTile)) {
                this.y = bottomY * 16 - this.height;
                this.vy = 0;
            } else {
                this.y = newY;
            }
        } else {
            return true; // fell hole
        }

        // Wall collision
        const frontX = currentVx > 0 ? newX + this.width : newX;
        // Check middle of body
        const frontTile = level.getTile(frontX, this.y + (this.height / 2));

        if (level.isSolid(frontTile)) {
            if (this.inShell && this.shellMoving) {
                this.shellVx *= -1; // Bounce shell
            } else if (!this.inShell) {
                this.vx *= -1; // Turn around walking
            }
        } else {
            this.x = newX;
        }

        // Animation
        if (!this.inShell || Math.abs(currentVx) > 0) {
            this.animTimer += deltaTime;
            if (this.animTimer > (this.inShell ? 50 : 150)) {
                this.animTimer = 0;
                this.walkFrame = 1 - this.walkFrame;
            }
        }

        return false;
    }

    stomp(marioX) {
        if (!this.inShell) {
            // First stomp: tuck into shell
            this.inShell = true;
            this.y += 8; // Adjust height down
            this.height = 16;
            this.shellMoving = false;
        } else if (!this.shellMoving) {
            // Second stomp/touch: kick shell
            this.shellMoving = true;
            // Kick away from Mario
            this.shellVx = (this.x > marioX) ? 5 : -5;
        } else {
            // Stomped while moving: stop shell
            this.shellMoving = false;
            this.shellVx = 0;
        }
    }

    kick() {
        this.dead = true;
        this.inShell = false;
        this.vy = -5;
    }

    render(ctx, cameraX) {
        const screenX = Math.floor(this.x - cameraX);
        const screenY = Math.floor(this.y);

        if (screenX < -20 || screenX > 270) return;

        ctx.imageSmoothingEnabled = false;

        const green = '#00a800';
        const yellow = '#f8d800';
        const skin = '#eecfa1';
        const white = '#ffffff';

        if (this.inShell) {
            // Shell
            ctx.fillStyle = green;
            ctx.fillRect(screenX + 2, screenY + 2, 12, 10);
            ctx.fillStyle = white;
            ctx.fillRect(screenX + 4, screenY + 4, 8, 6);

            // Bottom rim
            ctx.fillStyle = skin;
            ctx.fillRect(screenX + 0, screenY + 12, 16, 4);
        } else {
            // Walking koopa (facing based on vx)
            const facingLeft = this.vx < 0;

            // Head
            ctx.fillStyle = yellow;
            ctx.fillRect(screenX + (facingLeft ? 0 : 8), screenY + 0, 8, 8);

            // Shell back
            ctx.fillStyle = green;
            ctx.fillRect(screenX + (facingLeft ? 6 : 0), screenY + 8, 10, 12);

            // Belly
            ctx.fillStyle = skin;
            ctx.fillRect(screenX + (facingLeft ? 2 : 10), screenY + 8, 4, 12);

            // Feet
            ctx.fillStyle = yellow;
            if (this.walkFrame === 0) {
                ctx.fillRect(screenX + 2, screenY + 20, 4, 4);
                ctx.fillRect(screenX + 10, screenY + 20, 4, 4);
            } else {
                ctx.fillRect(screenX + 4, screenY + 20, 4, 4);
                ctx.fillRect(screenX + 8, screenY + 20, 4, 4);
            }
        }
    }
}
