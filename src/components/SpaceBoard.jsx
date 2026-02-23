import React from 'react';

const SpaceBoard = ({
    player,
    bullets,
    enemies,
    enemyBullets,
    powerUps,
    explosions,
    lives,
    score,
    weapon,
    shield,
    status,
    distance,
    GRID_WIDTH,
    GRID_HEIGHT
}) => {
    // Create grid cells
    const renderCells = () => {
        const cells = [];

        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                let cellClass = 'space-cell';
                let content = null;
                let zIndex = 1;

                // Check for game objects at this position
                const roundedX = x;

                // Player ship (priority render)
                if (x === player.x && y === player.y) {
                    cellClass += ' player-cell';
                    if (shield) cellClass += ' shielded';
                    // Enhanced spaceship design
                    content = (
                        <div className="spaceship">
                            <span className="ship-exhaust">{"》"}</span>
                            <span className="ship-main">{"▶▶"}</span>
                            {weapon >= 2 && <span className="ship-cannon top">{"╤"}</span>}
                            {weapon >= 3 && <span className="ship-cannon bottom">{"╧"}</span>}
                        </div>
                    );
                    zIndex = 10;
                }

                // Player bullets
                const bullet = bullets.find(b => Math.round(b.x) === roundedX && b.y === y);
                if (bullet && !content) {
                    cellClass += ' bullet-cell';
                    content = <span className="bullet">{"━━"}</span>;
                    zIndex = 5;
                }

                // Enemy bullets
                const enemyBullet = enemyBullets.find(b => Math.round(b.x) === roundedX && b.y === y);
                if (enemyBullet && !content) {
                    cellClass += ' enemy-bullet-cell';
                    content = <span className="enemy-bullet">{"●"}</span>;
                    zIndex = 5;
                }

                // Enemies - BIGGER sprites
                const enemy = enemies.find(e => Math.round(e.x) === roundedX && e.y === y);
                if (enemy && !content) {
                    cellClass += ` enemy-cell enemy-${enemy.type}`;
                    switch (enemy.type) {
                        case 'basic':
                            content = <span className="enemy-sprite">{"◀◀"}</span>;
                            break;
                        case 'fast':
                            content = <span className="enemy-sprite fast">{"««"}</span>;
                            break;
                        case 'tank':
                            content = <span className="enemy-sprite tank">{"◄◄◄"}</span>;
                            break;
                        case 'shooter':
                            content = <span className="enemy-sprite shooter">{"◁⊙"}</span>;
                            break;
                        default:
                            content = <span className="enemy-sprite">{"◀◀"}</span>;
                    }
                    zIndex = 6;
                }

                // Power-ups - BIGGER and more visible
                const powerUp = powerUps.find(p => Math.round(p.x) === roundedX && p.y === y);
                if (powerUp && !content) {
                    cellClass += ` powerup-cell pu-${powerUp.type}`;
                    switch (powerUp.type) {
                        case 'weapon':
                            content = <span className="powerup-icon weapon">{"[W]"}</span>;
                            break;
                        case 'shield':
                            content = <span className="powerup-icon shield">{"[S]"}</span>;
                            break;
                        case 'life':
                            content = <span className="powerup-icon life">{"[♥]"}</span>;
                            break;
                        default:
                            content = <span className="powerup-icon">{"[?]"}</span>;
                    }
                    zIndex = 7;
                }

                // Explosions (highest priority)
                const explosion = explosions.find(e => Math.round(e.x) === roundedX && e.y === y);
                if (explosion) {
                    cellClass += ' explosion-cell';
                    const frames = ['✦', '✴', '✷', '•', '·'];
                    content = <span className="explosion">{frames[explosion.frame] || '·'}</span>;
                    zIndex = 15;
                }

                cells.push(
                    <div
                        key={`${x}-${y}`}
                        className={cellClass}
                        style={{ zIndex }}
                    >
                        {content}
                    </div>
                );
            }
        }

        return cells;
    };

    return (
        <div className="space-game">
            {/* Top HUD */}
            <div className="space-hud">
                <div className="hud-lives">
                    {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={i < lives ? 'heart-full' : 'heart-empty'}>
                            {i < lives ? '♥' : '♡'}
                        </span>
                    ))}
                </div>
                <div className="hud-score">{score.toString().padStart(6, '0')}</div>
            </div>

            {/* Game Board */}
            <div
                className="space-board"
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)`,
                    gridTemplateRows: `repeat(${GRID_HEIGHT}, 1fr)`
                }}
            >
                {/* Background stars */}
                <div className="stars-layer">
                    {Array.from({ length: 15 }, (_, i) => (
                        <span
                            key={i}
                            className="star"
                            style={{
                                left: `${(i * 17 + distance) % 100}%`,
                                top: `${(i * 23) % 100}%`,
                                animationDelay: `${i * 0.1}s`
                            }}
                        >·</span>
                    ))}
                </div>

                {renderCells()}
            </div>

            {/* Bottom HUD */}
            <div className="space-hud-bottom">
                <div className="weapon-level">
                    WEAPON: {'▮'.repeat(weapon)}{'▯'.repeat(3 - weapon)}
                </div>
                <div className="distance-meter">
                    {Math.floor(distance / 10)}m
                </div>
            </div>

            {/* Ready Screen */}
            {status === 'ready' && (
                <div className="space-overlay ready">
                    <div className="title-art">
                        ═══════════════
                        <br />
                        SPACE IMPACT
                        <br />
                        ═══════════════
                    </div>
                    <p className="subtitle">ENDLESS MODE</p>
                    <div className="start-prompt blink">
                        ► PRESS START ◄
                    </div>
                    <div className="controls-info">
                        <p>↑↓ or W/S = MOVE</p>
                        <p>SPACE or K = FIRE</p>
                    </div>
                </div>
            )}

            {/* Game Over Screen */}
            {status === 'gameover' && (
                <div className="space-overlay gameover">
                    <h2>GAME OVER</h2>
                    <div className="final-stats">
                        <p>SCORE: <strong>{score}</strong></p>
                        <p>DISTANCE: <strong>{Math.floor(distance / 10)}m</strong></p>
                    </div>
                    <div className="start-prompt blink">
                        PRESS START TO RETRY
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpaceBoard;
