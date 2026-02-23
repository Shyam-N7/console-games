import React from 'react';

const PacmanBoard = ({
    grid, pacman, ghosts, score, status, direction, frightenedTicks, GRID_WIDTH, GRID_HEIGHT, resetGame, returnToMenu
}) => {

    const getCellClass = (x, y, bgVal) => {
        if (bgVal === 1) return 'maze-wall';
        if (bgVal === 4) return 'maze-gate';
        return 'maze-empty';
    };

    return (
        <div className="pacman-container">
            <div className="space-hud">
                <span className="hud-score">SCORE: {score.toString().padStart(4, '0')}</span>
                <span className="hud-lives">{frightenedTicks > 0 ? 'FRENZY' : ''}</span>
            </div>

            <div className="pacman-board" style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_HEIGHT}, 1fr)`
            }}>
                {/* Render Grid Base */}
                {grid.map((row, y) => (
                    row.map((cell, x) => (
                        <div key={`${x}-${y}`} className={`pac-cell ${getCellClass(x, y, cell)}`}>
                            {cell === 2 && <div className="pellet"></div>}
                            {cell === 3 && <div className="power-pellet"></div>}
                        </div>
                    ))
                ))}

                {/* Render Pacman Absolutely for smooth movement */}
                <div
                    className={`pacman-sprite ${direction.x === -1 ? 'left' : direction.x === 1 ? 'right' : direction.y === -1 ? 'up' : 'down'}`}
                    style={{
                        left: `${(pacman.x / GRID_WIDTH) * 100}%`,
                        top: `${(pacman.y / GRID_HEIGHT) * 100}%`,
                        width: `${100 / GRID_WIDTH}%`,
                        height: `${100 / GRID_HEIGHT}%`
                    }}
                >
                </div>

                {/* Render Ghosts Absolutely */}
                {ghosts.map(g => (
                    <div
                        key={g.id}
                        className={`ghost-sprite ${frightenedTicks > 0 ? 'frightened' : ''}`}
                        style={{
                            left: `${(g.x / GRID_WIDTH) * 100}%`,
                            top: `${(g.y / GRID_HEIGHT) * 100}%`,
                            width: `${100 / GRID_WIDTH}%`,
                            height: `${100 / GRID_HEIGHT}%`
                        }}
                    >
                    </div>
                ))}
            </div>

            {(status === 'gameover' || status === 'win') && (
                <div className="overlay">
                    <h1>{status === 'win' ? 'YOU WIN!' : 'GAME OVER'}</h1>
                    <p>FINAL SCORE: {score}</p>
                    <button className="btn" onPointerDown={(e) => { e.preventDefault(); resetGame(); }}>AGAIN</button>
                    <button className="btn" onPointerDown={(e) => { e.preventDefault(); returnToMenu(); }}>MENU</button>
                </div>
            )}
        </div>
    );
};

export default PacmanBoard;
