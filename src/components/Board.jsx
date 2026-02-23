
import React from 'react';

const Board = ({ snake, food, gridSize }) => {
    // Create an array representing the grid cells
    const cells = Array.from({ length: gridSize * gridSize });

    return (
        <div
            className="board"
            style={{
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                gridTemplateRows: `repeat(${gridSize}, 1fr)`
            }}
        >
            {cells.map((_, index) => {
                const x = index % gridSize;
                const y = Math.floor(index / gridSize);

                // Use simple loop vs Set/Map for performance on small 20x20 grid
                const isSnakeBody = snake.some(s => s.x === x && s.y === y);
                const isFoodItem = food.x === x && food.y === y;

                let className = 'cell';
                if (isSnakeBody) className += ' snake';
                if (isFoodItem) className += ' food';

                return <div key={index} className={className} />;
            })}
        </div>
    );
};

export default Board;
