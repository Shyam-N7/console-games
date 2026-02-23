import { useCallback } from 'react';

export const useAudio = () => {
    // Singleton AudioContext
    const getAudioContext = useCallback(() => {
        if (!window.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                window.audioCtx = new AudioContext();
            }
        }
        if (window.audioCtx && window.audioCtx.state === 'suspended') {
            window.audioCtx.resume();
        }
        return window.audioCtx;
    }, []);

    const playTone = useCallback((frequency, type = 'square', duration = 0.1) => {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    }, [getAudioContext]);

    const playSound = useCallback((effect) => {
        switch (effect) {
            case 'nav':
                playTone(440, 'square', 0.05);
                break;
            case 'select':
                playTone(880, 'square', 0.1);
                break;
            case 'start':
                playTone(660, 'square', 0.1);
                setTimeout(() => playTone(880, 'square', 0.2), 100);
                break;
            case 'eat': // Snake
                playTone(600, 'sine', 0.05);
                break;
            case 'crash':
                playTone(150, 'sawtooth', 0.3);
                playTone(100, 'sawtooth', 0.3);
                break;
            case 'move': // Tetris / Menu
                playTone(200, 'square', 0.03);
                break;
            case 'rotate': // Tetris
                playTone(300, 'square', 0.05);
                break;
            case 'drop': // Tetris
                playTone(150, 'square', 0.1);
                break;
            case 'line': // Tetris line clear
                playTone(800, 'square', 0.1);
                setTimeout(() => playTone(1200, 'square', 0.2), 100);
                break;
            case 'levelUp':
                playTone(600, 'square', 0.1);
                setTimeout(() => playTone(800, 'square', 0.1), 100);
                setTimeout(() => playTone(1000, 'square', 0.2), 200);
                break;
            case 'slide': // 2048
                playTone(300, 'square', 0.05);
                break;
            case 'merge': // 2048
                playTone(400, 'square', 0.05);
                setTimeout(() => playTone(600, 'square', 0.1), 50);
                break;
            case 'jump': // Mario
                const ctx = getAudioContext();
                if (!ctx) return;

                try {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.type = 'square';
                    osc.frequency.setValueAtTime(150, ctx.currentTime);
                    osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 0.1);

                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start();
                    osc.stop(ctx.currentTime + 0.1);
                } catch (e) {
                    console.error("Audio error:", e);
                }
                break;
            case 'coin': // Mario
                playTone(900, 'square', 0.05);
                setTimeout(() => playTone(1200, 'square', 0.1), 50);
                break;
            default:
                break;
        }
    }, [playTone]);

    return { playSound };
};
