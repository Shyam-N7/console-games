import React from 'react';

const TetrisBoard = ({
    board,
    currentPiece,
    nextPiece,
    score,
    level,
    lines,
    status,
    resetGame,
    returnToMenu
}) => {
    // Render the board with the current piece overlaid
    const renderBoard = () => {
        // Create a copy of the board to render
        const displayBoard = board.map(row => [...row]);

        // Overlay current piece if it exists
        if (currentPiece && status === 'playing') {
            currentPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        const boardY = currentPiece.y + y;
                        const boardX = currentPiece.x + x;
                        if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
                            displayBoard[boardY][boardX] = currentPiece.color;
                        }
                    }
                });
            });
        }

        return displayBoard.flatMap((row, y) =>
            row.map((cell, x) => (
                <div
                    key={`${x}-${y}`}
                    className={`tetris-cell ${cell ? `c${cell}` : ''}`}
                />
            ))
        );
    };

    // Render next piece preview
    const renderNextPiece = () => {
        if (!nextPiece) return null;
        return (
            <div className="next-piece-grid">
                {nextPiece.shape.map((row, y) => (
                    <div key={y} className="next-row">
                        {row.map((val, x) => (
                            <div
                                key={x}
                                className={`preview-cell ${val ? `c${nextPiece.color}` : ''}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="tetris-container">
            <div className="tetris-game-area">
                <div className="tetris-board">
                    {renderBoard()}
                </div>
            </div>

            <div className="tetris-sidebar">
                <div className="sidebar-section">
                    <div className="label">NEXT</div>
                    <div className="next-piece-container">
                        {renderNextPiece()}
                    </div>
                </div>

                <div className="sidebar-section">
                    <div className="label">SCORE</div>
                    <div className="value">{score}</div>
                </div>

                <div className="sidebar-section">
                    <div className="label">LEVEL</div>
                    <div className="value">{level}</div>
                </div>

                <div className="sidebar-section">
                    <div className="label">LINES</div>
                    <div className="value">{lines}</div>
                </div>
            </div>

            {status === 'gameover' && (
                <div className="overlay">
                    <h1>GAME OVER</h1>
                    <p>SCORE: {score}</p>
                    <button className="btn" onClick={resetGame}>AGAIN</button>
                    <button className="btn" onClick={returnToMenu}>MENU</button>
                </div>
            )}

            {status === 'ready' && (
                <div className="overlay">
                    <h1>TETRIS</h1>
                    <p>PRESS START</p>
                    <div className="controls-hint">
                        <p>← → MOVE</p>
                        <p>↑ ROTATE</p>
                        <p>↓ DROP</p>
                    </div>
                    <button className="btn" onClick={resetGame}>START</button>
                </div>
            )}
        </div>
    );
};

export default TetrisBoard;
