import React from 'react';

const Controls = ({ onChangeDirection, onReset, status, mode, onMenu, pressedDir, gameName }) => {
    const isConsole = mode === 'console';
    const pk = pressedDir || new Set();

    return (
        <div className={`controls-area ${isConsole ? 'console-controls' : ''}`}>
            {!isConsole && <div className="brand">{gameName || 'NOKIA'}</div>}

            {/* D-Pad */}
            <div className="pad">
                <div className="pad-row">
                    <div className="pad-spacer"></div>
                    <button
                        className={`btn pad-btn ${pk.has('up') ? 'pressed' : ''}`}
                        onPointerDown={(e) => { e.preventDefault(); onChangeDirection({ x: 0, y: -1 }); }}
                        aria-label="Up"
                    >
                        ▲
                    </button>
                    <div className="pad-spacer"></div>
                </div>
                <div className="pad-row">
                    <button
                        className={`btn pad-btn ${pk.has('left') ? 'pressed' : ''}`}
                        onPointerDown={(e) => { e.preventDefault(); onChangeDirection({ x: -1, y: 0 }); }}
                        aria-label="Left"
                    >
                        ◀
                    </button>
                    <div className="pad-center"></div>
                    <button
                        className={`btn pad-btn ${pk.has('right') ? 'pressed' : ''}`}
                        onPointerDown={(e) => { e.preventDefault(); onChangeDirection({ x: 1, y: 0 }); }}
                        aria-label="Right"
                    >
                        ▶
                    </button>
                </div>
                <div className="pad-row">
                    <div className="pad-spacer"></div>
                    <button
                        className={`btn pad-btn ${pk.has('down') ? 'pressed' : ''}`}
                        onPointerDown={(e) => { e.preventDefault(); onChangeDirection({ x: 0, y: 1 }); }}
                        aria-label="Down"
                    >
                        ▼
                    </button>
                    <div className="pad-spacer"></div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
                {onMenu && (
                    <button
                        className="btn action-btn"
                        onPointerDown={(e) => { e.preventDefault(); onMenu(); }}
                    >
                        MENU
                    </button>
                )}
                <button
                    className="btn action-btn"
                    onPointerDown={(e) => { e.preventDefault(); onReset(); }}
                >
                    {status === 'playing' ? (isConsole ? 'START' : (gameName === 'SONAR' ? 'PING' : 'RESTART')) : 'START'}
                </button>
                {isConsole && (
                    <button
                        className="btn jump-btn"
                        onPointerDown={(e) => { e.preventDefault(); onChangeDirection({ x: 0, y: -1 }); }}
                    >
                        A
                    </button>
                )}
            </div>
        </div>
    );
};

export default Controls;
