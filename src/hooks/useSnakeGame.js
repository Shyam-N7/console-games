import { useState, useEffect, useCallback, useRef } from 'react';

import { useAudio } from './useAudio';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 }; // Moving Up
const SPEED = 150;

export const useSnakeGame = () => {
    const { playSound } = useAudio();
    const [snake, setSnake] = useState(INITIAL_SNAKE);
    const [food, setFood] = useState({ x: 5, y: 5 });
    // Use refs for direction to handle rapid inputs (prevent suicide) and keep game loop stable
    const directionRef = useRef(INITIAL_DIRECTION);
    const canChangeDirection = useRef(true);

    const [status, setStatus] = useState('idle'); // idle, playing, gameover
    const [score, setScore] = useState(0);

    const generateFood = useCallback((currentSnake) => {
        let newFood;
        let isOnSnake;
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
            isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
        } while (isOnSnake);
        return newFood;
    }, []);

    const resetGame = () => {
        playSound('start');
        setSnake(INITIAL_SNAKE);
        directionRef.current = INITIAL_DIRECTION;
        canChangeDirection.current = true;
        setStatus('playing');
        setScore(0);
        setFood(generateFood(INITIAL_SNAKE));
    };

    const changeDirection = (newDir) => {
        if (!canChangeDirection.current) return;

        const currentDir = directionRef.current;
        // Prevent reversing direction directly
        if (currentDir.x + newDir.x === 0 && currentDir.y + newDir.y === 0) return;

        directionRef.current = newDir;
        canChangeDirection.current = false;
    };

    useEffect(() => {
        if (status !== 'playing') return;

        const moveSnake = () => {
            setSnake(prevSnake => {
                const currentDir = directionRef.current;
                const newHead = {
                    x: prevSnake[0].x + currentDir.x,
                    y: prevSnake[0].y + currentDir.y
                };

                // Check collisions
                if (
                    newHead.x < 0 ||
                    newHead.x >= GRID_SIZE ||
                    newHead.y < 0 ||
                    newHead.y >= GRID_SIZE ||
                    prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
                ) {
                    setStatus('gameover');
                    playSound('crash');
                    return prevSnake;
                }

                const newSnake = [newHead, ...prevSnake];

                // Check food
                if (newHead.x === food.x && newHead.y === food.y) {
                    playSound('eat');
                    setScore(s => s + 1);
                    setFood(generateFood(newSnake));
                    // Don't pop tail (grow)
                } else {
                    newSnake.pop();
                }

                // Allow direction change after move processed
                canChangeDirection.current = true;

                return newSnake;
            });
        };

        const intervalId = setInterval(moveSnake, SPEED);
        return () => clearInterval(intervalId);
    }, [status, food, generateFood, playSound]);

    return {
        snake,
        food,
        status,
        score,
        resetGame,
        changeDirection,
        GRID_SIZE
    };
};
