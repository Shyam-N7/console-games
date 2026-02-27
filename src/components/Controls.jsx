import React from 'react';

const Controls = ({ onChangeDirection, onReset, status, mode, onMenu, pressedDir, gameName }) => {
    const isConsole = mode === 'console';
    const pk = pressedDir || new Set();

    const bindPress = (action) => ({
        onPointerDown: (e) => { e.preventDefault(); action(); }
    });

    return (
        <div className={`controls-area ${isConsole ? 'console-controls' : ''}`}>
            {!isConsole && <div className="brand">{gameName || 'NOKIA'}</div>}

            {/* D-Pad */}
            <div className="pad">
                <div className="pad-row">
                    <div className="pad-spacer"></div>
                    <button
                        className={`btn pad-btn ${pk.has('up') ? 'pressed' : ''}`}
                        {...bindPress(() => onChangeDirection({ x: 0, y: -1 }))}
                        aria-label="Up"
                    >
                        ▲
                    </button>
                    <div className="pad-spacer"></div>
                </div>
                <div className="pad-row">
                    <button
                        className={`btn pad-btn ${pk.has('left') ? 'pressed' : ''}`}
                        {...bindPress(() => onChangeDirection({ x: -1, y: 0 }))}
                        aria-label="Left"
                    >
                        ◀
                    </button>
                    <div className="pad-center"></div>
                    <button
                        className={`btn pad-btn ${pk.has('right') ? 'pressed' : ''}`}
                        {...bindPress(() => onChangeDirection({ x: 1, y: 0 }))}
                        aria-label="Right"
                    >
                        ▶
                    </button>
                </div>
                <div className="pad-row">
                    <div className="pad-spacer"></div>
                    <button
                        className={`btn pad-btn ${pk.has('down') ? 'pressed' : ''}`}
                        {...bindPress(() => onChangeDirection({ x: 0, y: 1 }))}
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
                        {...bindPress(() => onMenu())}
                    >
                        MENU
                    </button>
                )}
                <button
                    className="btn action-btn"
                    {...bindPress(() => onReset())}
                >
                    {status === 'playing' ? (isConsole ? 'START' : (gameName === 'SONAR' ? 'PING' : 'RESTART')) : 'START'}
                </button>
                {isConsole && (
                    <button
                        className="btn jump-btn"
                        {...bindPress(() => onChangeDirection({ x: 0, y: -1 }))}
                    >
                        A
                    </button>
                )}
            </div>
        </div>
    );
};

export default Controls;
