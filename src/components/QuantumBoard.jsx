import React, { useRef, useEffect } from 'react';

const QuantumBoard = ({ snakeA, snakeB, foodA, foodB, score, highScore, status, GRID_WIDTH, GRID_HEIGHT, resetGame, returnToMenu }) => {
    const canvasRef = useRef(null);

    // Render Loop using Canvas for performance and easy classic styling
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const cellSize = Math.floor(canvas.width / GRID_WIDTH);

        // Clear
        ctx.fillStyle = '#c7f0d8'; // Variable --nokia-bg (Need to match manually or use getComputedStyle)
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const pixelColor = '#43523d'; // Variable --nokia-pixel

        // Helper to draw cells
        const drawCell = (x, y, style) => {
            const pad = 1;
            const size = cellSize - pad * 2;
            const px = x * cellSize + pad;
            const py = y * cellSize + pad;

            ctx.fillStyle = pixelColor;

            if (style === 'solid') {
                ctx.fillRect(px, py, size, size);
            } else if (style === 'hollow') {
                ctx.strokeStyle = pixelColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);
                // Maybe a dot in the middle?
                ctx.fillRect(px + size / 2 - 2, py + size / 2 - 2, 4, 4);
            } else if (style === 'food-solid') {
                ctx.fillRect(px, py, size, size);
                // Flashing effect handled by CSS opacity on canvas? Or logic here?
                // Let's keep it simple.
            } else if (style === 'food-hollow') {
                ctx.strokeStyle = pixelColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);
            }
        };

        // Draw Food
        drawCell(foodA.x, foodA.y, 'food-solid');
        drawCell(foodB.x, foodB.y, 'food-hollow');

        // Draw Snake A (Solid)
        snakeA.forEach(seg => drawCell(seg.x, seg.y, 'solid'));

        // Draw Snake B (Hollow)
        snakeB.forEach(seg => drawCell(seg.x, seg.y, 'hollow'));

    }, [snakeA, snakeB, foodA, foodB, GRID_WIDTH, GRID_HEIGHT]);

    return (
        <div className="game-container quantum-container">
            <div className="game-headers">
                <div className="score-box">
                    <span className="label">SCORE</span>
                    <span className="value">{score}</span>
                </div>
                <div className="score-box">
                    <span className="label">HI</span>
                    <span className="value">{highScore}</span>
                </div>
            </div>

            <div className="quantum-board-wrapper">
                <canvas
                    ref={canvasRef}
                    width={300} // Fixed resolution for pixel look
                    height={225} // 20x15 ratio
                    style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
                />
            </div>

            {status === 'gameover' && (
                <div className="overlay">
                    <h1>COLLAPSE</h1>
                    <p>SCORE: {score}</p>
                    <button className="btn" onClick={resetGame}>RETRY</button>
                    <button className="btn" onClick={returnToMenu}>MENU</button>
                </div>
            )}

            {status === 'ready' && (
                <div className="overlay">
                    <h1>QUANTUM</h1>
                    <p>SNAKE</p>
                    <div className="controls-hint" style={{ fontSize: '0.7rem' }}>
                        <p>A = YOU (SOLID)</p>
                        <p>B = ANTI (HOLLOW)</p>
                        <p>B moves INVERTED!</p>
                    </div>
                    <button className="btn" onClick={resetGame}>START</button>
                </div>
            )}
        </div>
    );
};

export default QuantumBoard;
