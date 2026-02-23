import React from 'react';

const MarioBoard = ({ player, level, enemies = [], cameraX, height }) => {
    // Render only visible window
    const VISIBLE_WIDTH = 25;
    const startCol = Math.floor(cameraX);

    return (
        <div className="board mario-board" style={{
            gridTemplateColumns: `repeat(${VISIBLE_WIDTH}, 1fr)`,
            gridTemplateRows: `repeat(${height}, 1fr)`
        }}>
            {/* 1. Render Map Tiles */}
            {Array.from({ length: height }).map((_, y) => (
                Array.from({ length: VISIBLE_WIDTH }).map((_, i) => {
                    const x = startCol + i;
                    if (!level || !level[y] || x < 0 || x >= level[y].length) return <div key={`${x}-${y}`} className="cell" />;

                    const tile = level[y][x];
                    let className = 'cell';

                    if (tile === 1) className += ' ground';
                    if (tile === 2) className += ' brick';
                    if (tile === 3) className += ' q-block'; // Question Block
                    if (tile === 30) className += ' used-block';
                    if (tile === 9) className += ' hard-block'; // Stairs
                    if (tile === 5) className += ' pipe-l';
                    if (tile === 6) className += ' pipe-r';
                    if (tile === 7) className += ' pipe-top-l';
                    if (tile === 8) className += ' pipe-top-r';
                    if (tile === 10) className += ' pole';
                    if (tile === 11) className += ' flag';

                    return <div key={`${x}-${y}`} className={className} />;
                })
            ))}

            {/* 2. Render Enemies (Overlay) */}
            {enemies && enemies.map((enemy, idx) => {
                if (enemy.dead || enemy.x < startCol - 2 || enemy.x > startCol + VISIBLE_WIDTH + 2) return null;
                const leftPct = ((enemy.x - startCol) / VISIBLE_WIDTH) * 100;
                const topPct = (enemy.y / height) * 100;

                return (
                    <div key={`enemy-${idx}`} className="entity enemy" style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${100 / VISIBLE_WIDTH}%`,
                        height: `${100 / height}%`
                    }} />
                );
            })}

            {/* 3. Render Player (Overlay) */}
            {(() => {
                const leftPct = ((player.x - startCol) / VISIBLE_WIDTH) * 100;
                const topPct = (player.y / height) * 100;
                return (
                    <div className={`entity player ${player.facingRight ? 'right' : 'left'}`} style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${100 / VISIBLE_WIDTH}%`,
                        height: `${100 / height}%`
                    }} />
                );
            })()}
        </div>
    );
};

export default MarioBoard;
