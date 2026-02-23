import React, { useRef, useEffect, useState } from 'react';
import { Game } from '../game/Game.js';

const MarioCanvas = ({ onBack }) => {
    const canvasRef = useRef(null);
    const gameRef = useRef(null);
    const containerRef = useRef(null);

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
            // Prevent default for game keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'k', 'l'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
            game.handleInput(e.key, true);
        };

        const handleKeyUp = (e) => {
            game.handleInput(e.key, false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [onBack]);

    // Touch controls for mobile
    const handleTouchStart = (direction) => {
        if (!gameRef.current) return;

        switch (direction) {
            case 'left':
                gameRef.current.handleInput('a', true);
                break;
            case 'right':
                gameRef.current.handleInput('d', true);
                break;
            case 'up':
                gameRef.current.handleInput('w', true);
                break;
            case 'down':
                gameRef.current.handleInput('s', true);
                break;
            case 'jump':
                gameRef.current.handleInput('k', true);
                break;
            case 'run':
                gameRef.current.handleInput('l', true);
                break;
            case 'start':
                gameRef.current.handleInput('Enter', true);
                setTimeout(() => gameRef.current?.handleInput('Enter', false), 100);
                break;
        }
    };

    const handleTouchEnd = (direction) => {
        if (!gameRef.current) return;

        switch (direction) {
            case 'left':
                gameRef.current.handleInput('a', false);
                break;
            case 'right':
                gameRef.current.handleInput('d', false);
                break;
            case 'up':
                gameRef.current.handleInput('w', false);
                break;
            case 'down':
                gameRef.current.handleInput('s', false);
                break;
            case 'jump':
                gameRef.current.handleInput('k', false);
                break;
            case 'run':
                gameRef.current.handleInput('l', false);
                break;
        }
    };

    return (
        <div className="mario-fullscreen" ref={containerRef}>
            <canvas
                ref={canvasRef}
                className="mario-canvas-fullscreen"
            />

            {/* On-screen controls for touch devices */}
            <div className="touch-controls">
                {/* D-Pad */}
                <div className="touch-dpad">
                    <button
                        className="touch-btn touch-up"
                        onMouseDown={() => handleTouchStart('up')}
                        onMouseUp={() => handleTouchEnd('up')}
                        onTouchStart={(e) => { e.preventDefault(); handleTouchStart('up'); }}
                        onTouchEnd={() => handleTouchEnd('up')}
                    >▲</button>
                    <div className="touch-dpad-row">
                        <button
                            className="touch-btn touch-left"
                            onMouseDown={() => handleTouchStart('left')}
                            onMouseUp={() => handleTouchEnd('left')}
                            onTouchStart={(e) => { e.preventDefault(); handleTouchStart('left'); }}
                            onTouchEnd={() => handleTouchEnd('left')}
                        >◀</button>
                        <div className="touch-center"></div>
                        <button
                            className="touch-btn touch-right"
                            onMouseDown={() => handleTouchStart('right')}
                            onMouseUp={() => handleTouchEnd('right')}
                            onTouchStart={(e) => { e.preventDefault(); handleTouchStart('right'); }}
                            onTouchEnd={() => handleTouchEnd('right')}
                        >▶</button>
                    </div>
                    <button
                        className="touch-btn touch-down"
                        onMouseDown={() => handleTouchStart('down')}
                        onMouseUp={() => handleTouchEnd('down')}
                        onTouchStart={(e) => { e.preventDefault(); handleTouchStart('down'); }}
                        onTouchEnd={() => handleTouchEnd('down')}
                    >▼</button>
                </div>

                {/* Action Buttons */}
                <div className="touch-actions">
                    <button
                        className="touch-btn touch-b"
                        onMouseDown={() => handleTouchStart('run')}
                        onMouseUp={() => handleTouchEnd('run')}
                        onTouchStart={(e) => { e.preventDefault(); handleTouchStart('run'); }}
                        onTouchEnd={() => handleTouchEnd('run')}
                    >B</button>
                    <button
                        className="touch-btn touch-a"
                        onMouseDown={() => handleTouchStart('jump')}
                        onMouseUp={() => handleTouchEnd('jump')}
                        onTouchStart={(e) => { e.preventDefault(); handleTouchStart('jump'); }}
                        onTouchEnd={() => handleTouchEnd('jump')}
                    >A</button>
                </div>
            </div>

            {/* HUD overlay */}
            <div className="game-hud">
                <button className="hud-btn" onClick={() => handleTouchStart('start')}>START</button>
                <button className="hud-btn" onClick={onBack}>MENU</button>
                <span className="hud-hint">C = Controls</span>
            </div>
        </div>
    );
};

export default MarioCanvas;
