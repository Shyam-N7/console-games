import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Game } from '../game/Game.js';

const CONTROL_KEY_MAP = {
    left: 'a',
    right: 'd',
    up: 'w',
    down: 's',
    jump: 'k',
    run: 'l'
};

const OPPOSITE_CONTROL = {
    left: 'right',
    right: 'left',
    up: 'down',
    down: 'up'
};

const PREVENT_DEFAULT_KEYS = new Set([
    'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
    ' ', 'w', 'a', 's', 'd', 'k', 'l', 'shift', 'enter'
]);

const detectTouchDevice = () => {
    if (typeof window === 'undefined') return false;
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    return coarsePointer || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const MarioCanvas = ({ onBack }) => {
    const canvasRef = useRef(null);
    const gameRef = useRef(null);
    const containerRef = useRef(null);
    const activeControlsRef = useRef(new Set());
    const startTimeoutRef = useRef(null);

    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [activeControls, setActiveControls] = useState(new Set());

    const syncActiveControls = useCallback(() => {
        setActiveControls(new Set(activeControlsRef.current));
    }, []);

    const releaseControl = useCallback((control) => {
        const game = gameRef.current;
        const key = CONTROL_KEY_MAP[control];
        if (!key || !activeControlsRef.current.has(control)) return;

        activeControlsRef.current.delete(control);
        if (game) {
            game.handleInput(key, false);
        }
        syncActiveControls();
    }, [syncActiveControls]);

    const pressControl = useCallback((control) => {
        const game = gameRef.current;
        const key = CONTROL_KEY_MAP[control];
        if (!game || !key || activeControlsRef.current.has(control)) return;

        const opposite = OPPOSITE_CONTROL[control];
        if (opposite && activeControlsRef.current.has(opposite)) {
            game.handleInput(CONTROL_KEY_MAP[opposite], false);
            activeControlsRef.current.delete(opposite);
        }

        game.handleInput(key, true);
        activeControlsRef.current.add(control);
        syncActiveControls();
    }, [syncActiveControls]);

    const releaseAllControls = useCallback(() => {
        const game = gameRef.current;
        if (game) {
            for (const control of activeControlsRef.current) {
                const key = CONTROL_KEY_MAP[control];
                if (key) game.handleInput(key, false);
            }
        }
        activeControlsRef.current.clear();
        syncActiveControls();
    }, [syncActiveControls]);

    const triggerStart = useCallback(() => {
        const game = gameRef.current;
        if (!game) return;

        game.handleInput('Enter', true);
        if (startTimeoutRef.current) {
            clearTimeout(startTimeoutRef.current);
        }
        startTimeoutRef.current = setTimeout(() => {
            gameRef.current?.handleInput('Enter', false);
            startTimeoutRef.current = null;
        }, 90);
    }, []);

    useEffect(() => {
        const updateTouchDevice = () => {
            setIsTouchDevice(detectTouchDevice());
        };

        updateTouchDevice();

        const media = window.matchMedia?.('(pointer: coarse)');
        if (!media) return undefined;

        if (media.addEventListener) {
            media.addEventListener('change', updateTouchDevice);
            return () => media.removeEventListener('change', updateTouchDevice);
        }

        media.addListener(updateTouchDevice);
        return () => media.removeListener(updateTouchDevice);
    }, []);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Create game instance
        const game = new Game(canvasRef.current);
        gameRef.current = game;

        // Set menu callback
        game.onMenu = onBack;

        // Start game loop
        game.start();

        // Input handlers
        const handleKeyDown = (e) => {
            const key = e.key === ' ' ? ' ' : e.key.toLowerCase();
            if (PREVENT_DEFAULT_KEYS.has(key)) {
                e.preventDefault();
            }
            game.handleInput(e.key, true);
        };

        const handleKeyUp = (e) => {
            game.handleInput(e.key, false);
        };

        const handleWindowBlur = () => {
            releaseAllControls();
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                releaseAllControls();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleWindowBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleWindowBlur);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            releaseAllControls();

            if (startTimeoutRef.current) {
                clearTimeout(startTimeoutRef.current);
                startTimeoutRef.current = null;
            }

            game.stop?.();
            gameRef.current = null;
        };
    }, [onBack, releaseAllControls]);

    const handleControlPointerDown = (control) => (e) => {
        e.preventDefault();
        if (e.currentTarget.setPointerCapture) {
            e.currentTarget.setPointerCapture(e.pointerId);
        }
        pressControl(control);
    };

    const handleControlPointerUp = (control) => (e) => {
        e.preventDefault();
        releaseControl(control);
    };

    const getTouchButtonClass = (control, extraClass = '') => {
        const base = `mario-touch-btn ${extraClass}`.trim();
        return activeControls.has(control) ? `${base} is-active` : base;
    };

    return (
        <div
            className={`mario-fullscreen${isTouchDevice ? ' mario-mobile' : ''}`}
            ref={containerRef}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="mario-stage">
                <canvas
                    ref={canvasRef}
                    className="mario-canvas-fullscreen"
                />
            </div>

            {isTouchDevice && (
                <div className="mario-mobile-ui">
                    <div className="mario-mobile-toolbar">
                        <button type="button" className="hud-btn" onClick={triggerStart}>START</button>
                        <button type="button" className="hud-btn" onClick={onBack}>MENU</button>
                    </div>

                    <div className="mario-touch-controls">
                        <div className="mario-touch-dpad">
                            <button
                                type="button"
                                className={getTouchButtonClass('up', 'mario-touch-up')}
                                onPointerDown={handleControlPointerDown('up')}
                                onPointerUp={handleControlPointerUp('up')}
                                onPointerCancel={handleControlPointerUp('up')}
                                aria-label="Up"
                            >
                                UP
                            </button>

                            <div className="mario-touch-dpad-row">
                                <button
                                    type="button"
                                    className={getTouchButtonClass('left', 'mario-touch-left')}
                                    onPointerDown={handleControlPointerDown('left')}
                                    onPointerUp={handleControlPointerUp('left')}
                                    onPointerCancel={handleControlPointerUp('left')}
                                    aria-label="Left"
                                >
                                    LT
                                </button>
                                <div className="mario-touch-center" />
                                <button
                                    type="button"
                                    className={getTouchButtonClass('right', 'mario-touch-right')}
                                    onPointerDown={handleControlPointerDown('right')}
                                    onPointerUp={handleControlPointerUp('right')}
                                    onPointerCancel={handleControlPointerUp('right')}
                                    aria-label="Right"
                                >
                                    RT
                                </button>
                            </div>

                            <button
                                type="button"
                                className={getTouchButtonClass('down', 'mario-touch-down')}
                                onPointerDown={handleControlPointerDown('down')}
                                onPointerUp={handleControlPointerUp('down')}
                                onPointerCancel={handleControlPointerUp('down')}
                                aria-label="Down"
                            >
                                DN
                            </button>
                        </div>

                        <div className="mario-touch-actions">
                            <button
                                type="button"
                                className={getTouchButtonClass('run', 'mario-touch-b')}
                                onPointerDown={handleControlPointerDown('run')}
                                onPointerUp={handleControlPointerUp('run')}
                                onPointerCancel={handleControlPointerUp('run')}
                                aria-label="Run"
                            >
                                B
                            </button>
                            <button
                                type="button"
                                className={getTouchButtonClass('jump', 'mario-touch-a')}
                                onPointerDown={handleControlPointerDown('jump')}
                                onPointerUp={handleControlPointerUp('jump')}
                                onPointerCancel={handleControlPointerUp('jump')}
                                aria-label="Jump"
                            >
                                A
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!isTouchDevice && (
                <div className="game-hud mario-game-hud">
                    <button type="button" className="hud-btn" onClick={triggerStart}>START</button>
                    <button type="button" className="hud-btn" onClick={onBack}>MENU</button>
                    <span className="hud-hint">C = Controls</span>
                </div>
            )}
        </div>
    );
};

export default MarioCanvas;
