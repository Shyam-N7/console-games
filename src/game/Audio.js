// 8-bit style sound effects using Web Audio API

class SoundManager {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.muted = false;
    }

    init() {
        if (this.initialized) return;

        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch {
            console.warn('Web Audio not supported');
        }
    }

    // Create 8-bit style sounds
    playTone(frequency, duration, type = 'square', volume = 0.3) {
        if (!this.initialized || this.muted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = frequency;

        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // Mario jump sound
    jump() {
        if (!this.initialized || this.muted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    // Coin collect sound
    coin() {
        if (!this.initialized || this.muted) return;

        // Two quick high notes
        this.playTone(988, 0.05, 'square', 0.2); // B5
        setTimeout(() => {
            this.playTone(1319, 0.15, 'square', 0.2); // E6
        }, 50);
    }

    // Stomp enemy sound
    stomp() {
        if (!this.initialized || this.muted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    // Block bump sound
    bump() {
        if (!this.initialized || this.muted) return;

        this.playTone(150, 0.08, 'square', 0.25);
    }

    // Brick break sound
    breakBlock() {
        if (!this.initialized || this.muted) return;

        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.playTone(200 - i * 30, 0.05, 'square', 0.2);
            }, i * 30);
        }
    }

    // Power up sound
    powerUp() {
        if (!this.initialized || this.muted) return;

        const notes = [262, 330, 392, 523]; // C E G C
        notes.forEach((note, i) => {
            setTimeout(() => {
                this.playTone(note, 0.15, 'square', 0.2);
            }, i * 100);
        });
    }

    // Mario dies sound
    die() {
        if (!this.initialized || this.muted) return;

        const notes = [494, 440, 392, 349, 330, 294];
        notes.forEach((note, i) => {
            setTimeout(() => {
                this.playTone(note, 0.2, 'square', 0.25);
            }, i * 150);
        });
    }

    // Game over sound
    gameOver() {
        if (!this.initialized || this.muted) return;

        const notes = [196, 185, 175, 165];
        notes.forEach((note, i) => {
            setTimeout(() => {
                this.playTone(note, 0.4, 'square', 0.2);
            }, i * 300);
        });
    }

    // Level complete sound
    levelComplete() {
        if (!this.initialized || this.muted) return;

        const notes = [262, 330, 392, 523, 659, 784];
        notes.forEach((note, i) => {
            setTimeout(() => {
                this.playTone(note, 0.2, 'triangle', 0.3);
            }, i * 100);
        });
    }

    // 1-up sound
    oneUp() {
        if (!this.initialized || this.muted) return;

        const notes = [330, 392, 659, 523, 659, 784];
        notes.forEach((note, i) => {
            setTimeout(() => {
                this.playTone(note, 0.1, 'square', 0.2);
            }, i * 80);
        });
    }

    toggle() {
        this.muted = !this.muted;
        return !this.muted;
    }
}

export const sounds = new SoundManager();
