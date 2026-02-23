import React from 'react';

const Board2048 = ({ grid, score, bestScore, status, resetGame, returnToMenu }) => {
    return (
        <div className="game-2048-container">
            <div className="game-headers">
                <div className="score-box" style={{ width: 'auto', padding: '0 8px', cursor: 'pointer' }} onClick={returnToMenu}>
                    <span className="label" style={{ marginBottom: 0 }}>MENU</span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <div className="score-box">
                        <span className="label">SCORE</span>
                        <span className="value">{score}</span>
                    </div>
                    <div className="score-box">
                        <span className="label">BEST</span>
                        <span className="value">{bestScore}</span>
                    </div>
                </div>
            </div>

            <div className="grid-container">
                {grid.map((row, r) => (
                    row.map((val, c) => (
                        <div
                            key={`${r}-${c}`}
                            className={`grid-cell tile-${val}`}
                        >
                            {val > 0 ? val : ''}
                        </div>
                    ))
                ))}
            </div>

            {status === 'gameover' && (
                <div className="overlay">
                    <h1>GAME OVER</h1>
                    <p>SCORE: {score}</p>
                    <button className="btn" onClick={resetGame}>AGAIN</button>
                    <button className="btn" onClick={returnToMenu}>MENU</button>
                </div>
            )}

            {status === 'won' && (
                <div className="overlay">
                    <h1>YOU WIN!</h1>
                    <p>2048 REACHED!</p>
                    <button className="btn" onClick={resetGame}>AGAIN</button>
                    <button className="btn" onClick={returnToMenu}>MENU</button>
                </div>
            )}

            {status === 'ready' && (
                <div className="overlay">
                    <h1>2048</h1>
                    <p>CLASSIC</p>
                    <div className="controls-hint">
                        <p>ARROWS TO MOVE</p>
                        <p>MERGE TILES</p>
                        <p>GET 2048</p>
                    </div>
                    <button className="btn" onClick={resetGame}>START</button>
                </div>
            )}
        </div>
    );
};

export default Board2048;
