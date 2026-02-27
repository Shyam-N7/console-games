import React, { useRef, useEffect } from 'react';

const SonarBoard = ({ player, energy, status, pings, grid, hasKey, currentLevel, resetGame, returnToMenu, toggleHelp, GRID_WIDTH, GRID_HEIGHT }) => {
    const canvasRef = useRef(null);

    // Render Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const cellSize = Math.floor(canvas.width / GRID_WIDTH);

        // Clear Background (Black for blindness)
        ctx.fillStyle = '#1a1a1a'; // Almost black, darker than Nokia bg
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Pings (Ripples)
        pings.forEach(ping => {
            ctx.beginPath();
            // Calculate pixel position
            const px = ping.x * cellSize + cellSize / 2;
            const py = ping.y * cellSize + cellSize / 2;
            const radiusPixel = ping.radius * cellSize;

            ctx.strokeStyle = `rgba(199, 240, 216, ${ping.life})`; // Light green fading
            ctx.lineWidth = 2;
            ctx.arc(px, py, radiusPixel, 0, Math.PI * 2);
            ctx.stroke();
        });

        // 2. Draw Walls (Only if illuminated by a ping)
        // Optimization: Only check tiles within ping radius?
        // For now, iterate all pings and illuminate nearby walls.

        // Create a visibility map for this frame
        const visibility = new Array(GRID_HEIGHT).fill(0).map(() => new Array(GRID_WIDTH).fill(0));

        pings.forEach(ping => {
            const r = Math.ceil(ping.radius);
            // Bounding box for this ping
            const minX = Math.max(0, Math.floor(ping.x - r));
            const maxX = Math.min(GRID_WIDTH - 1, Math.ceil(ping.x + r));
            const minY = Math.max(0, Math.floor(ping.y - r));
            const maxY = Math.min(GRID_HEIGHT - 1, Math.ceil(ping.y + r));

            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const dx = x - ping.x;
                    const dy = y - ping.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Wall is visible if it's NEAR the ripple wave (donut shape) or inside?
                    // Let's make it visible if it is INSIDE the current radius but fading based on ping life
                    if (dist <= ping.radius) {
                        // Add lighting value
                        visibility[y][x] = Math.max(visibility[y][x], ping.life);
                    }
                }
            }
        });

        // Draw Grid with calculated visibility
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const val = grid[y][x];
                const light = visibility[y][x];

                if (val === 1 && light > 0) { // Wall
                    ctx.fillStyle = `rgba(199, 240, 216, ${light})`; // Light Green Walls
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
                } else if (val === 2 && light > 0) { // Start
                    ctx.strokeStyle = `rgba(199, 240, 216, ${light})`;
                    ctx.strokeRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
                } else if (val === 3 && light > 0) { // Exit
                    // Blink exit?
                    const blink = (Date.now() % 500) < 250 ? 1 : 0.5;
                    ctx.fillStyle = `rgba(199, 240, 216, ${light * blink})`;
                    ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
                    ctx.strokeRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
                } else if (val === 4 && light > 0) { // Key (Golden/Yellow)
                    ctx.fillStyle = `rgba(240, 230, 140, ${light})`;
                    ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 6, cellSize - 8);
                    ctx.fillRect(x * cellSize + cellSize - 4, y * cellSize + 2, 2, 5);
                } else if (val === 5 && light > 0) { // Door (Hatch marks)
                    ctx.strokeStyle = `rgba(199, 240, 216, ${light})`;
                    ctx.strokeRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
                    ctx.beginPath();
                    ctx.moveTo(x * cellSize, y * cellSize);
                    ctx.lineTo(x * cellSize + cellSize - 1, y * cellSize + cellSize - 1);
                    ctx.moveTo(x * cellSize + cellSize - 1, y * cellSize);
                    ctx.lineTo(x * cellSize, y * cellSize + cellSize - 1);
                    ctx.stroke();
                } else if (val === 6 && light > 0) { // Energy (Cyan +)
                    ctx.fillStyle = `rgba(140, 230, 240, ${light})`;
                    ctx.fillRect(x * cellSize + cellSize / 2 - 1.5, y * cellSize + 2, 3, cellSize - 4);
                    ctx.fillRect(x * cellSize + 2, y * cellSize + cellSize / 2 - 1.5, cellSize - 4, 3);
                }
            }
        }

        // 3. Draw Player (Always visible, it's YOU)
        ctx.fillStyle = '#c7f0d8'; // Light Green Player
        ctx.fillRect(player.x * cellSize + 2, player.y * cellSize + 2, cellSize - 4, cellSize - 4);

    }, [player, pings, grid, GRID_WIDTH, GRID_HEIGHT]);

    return (
        <div className="game-container sonar-container">
            <div className="game-headers">
                <div className="score-box" style={{ width: '80px', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                    <span className="label" style={{ marginBottom: 0 }}>ENERGY</span>
                    {/* High contrast energy bar: Dark border/bg, Bright whitish-green fill */}
                    <div style={{ height: '10px', width: '100%', background: '#43523d', border: '2px solid #43523d' }}>
                        <div style={{ height: '100%', width: `${energy}%`, background: '#e0f8e8', transition: 'width 0.2s' }}></div>
                    </div>
                </div>
                <div className="score-box" style={{ width: '60px', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                    <span className="label" style={{ marginBottom: 0 }}>LVL: {currentLevel}</span>
                    <span className="label" style={{ marginBottom: 0, color: hasKey ? '#f0e68c' : 'inherit' }}>KEY: {hasKey ? 'YES' : 'NO'}</span>
                </div>
                <div className="score-box" style={{ border: 'none', background: 'transparent', width: 'auto' }}>
                    {/* Darker background for help text to make it pop */}
                    <span className="label" style={{ fontSize: '0.7rem', color: '#c7f0d8', background: '#43523d', padding: '4px 6px', borderRadius: '4px' }}>
                        PRESS <strong>H</strong> FOR HELP
                    </span>
                </div>
            </div>

            <div className="quantum-board-wrapper" style={{ background: '#1a1a1a' }}>
                <canvas
                    ref={canvasRef}
                    width={300}
                    height={225}
                    style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
                />
            </div>

            {status === 'gameover' && (
                <div className="overlay">
                    <h1>LOST</h1>
                    <p>IN THE DARK</p>
                    <button className="btn" onClick={resetGame}>RETRY</button>
                    <button className="btn" onClick={returnToMenu}>MENU</button>
                </div>
            )}

            {status === 'won' && (
                <div className="overlay">
                    <h1>ESCAPED</h1>
                    <p>ENERGY: {energy}%</p>
                    <button className="btn" onClick={resetGame}>AGAIN</button>
                    <button className="btn" onClick={returnToMenu}>MENU</button>
                </div>
            )}

            {status === 'help' && (
                <div className="overlay" style={{ background: 'rgba(199, 240, 216, 0.95)' }}>
                    <h3>HOW TO PLAY</h3>
                    <ul style={{ textAlign: 'left', fontSize: '0.7rem', padding: '0 10px', listStyle: 'none' }}>
                        <li>- Use ARROWS to move. SPACE to PING.</li>
                        <li>- Walls are hidden. SPACE reveals them.</li>
                        <li>- Pings cost ENERGY. Pick up <strong>+</strong> to refuel.</li>
                        <li>- Find the KEY to unlock the DOOR (X).</li>
                        <li>- Reach the blinking square to progress.</li>
                    </ul>
                    <button className="btn" onClick={toggleHelp}>RESUME</button>
                </div>
            )}

            {status === 'ready' && (
                <div className="overlay">
                    <h1>SONAR</h1>
                    <p>THE DARK MAZE</p>
                    <div className="controls-hint" style={{ fontSize: '0.7rem' }}>
                        <p>Press H for Help</p>
                    </div>
                    <button className="btn" onClick={resetGame}>START</button>
                    <button className="btn" onClick={toggleHelp}>HELP</button>
                </div>
            )}

            {/* Mini Help Hint removed (duplicate) */}
        </div>
    );
};

export default SonarBoard;
