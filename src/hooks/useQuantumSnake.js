import { useState, useCallback, useEffect, useRef } from 'react';
import { useAudio } from './useAudio';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 15;
const INITIAL_SPEED = 150;

const INITIAL_SNAKE_A = [{ x: 5, y: 7 }, { x: 4, y: 7 }, { x: 3, y: 7 }];
const INITIAL_SNAKE_B = [{ x: 14, y: 7 }, { x: 15, y: 7 }, { x: 16, y: 7 }];
const INITIAL_DIR_A = { x: 1, y: 0 }; // Moving Right

export const useQuantumSnake = () => {
    const { playSound } = useAudio();
    const [snakeA, setSnakeA] = useState(INITIAL_SNAKE_A);
    const [snakeB, setSnakeB] = useState(INITIAL_SNAKE_B);
    const [foodA, setFoodA] = useState({ x: 10, y: 5 });
    const [foodB, setFoodB] = useState({ x: 9, y: 9 });
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0); // Local session high score
    const [status, setStatus] = useState('ready'); // ready, playing, gameover

    const directionRef = useRef(INITIAL_DIR_A);
    const speedRef = useRef(INITIAL_SPEED);
    const gameLoopRef = useRef(null);
    const lastProcessedDir = useRef(INITIAL_DIR_A); // To prevent 180 reverses

    const addScore = useCallback((points) => {
        setScore(prevScore => {
            const nextScore = prevScore + points;
            setHighScore(prevHigh => Math.max(prevHigh, nextScore));
            return nextScore;
        });
    }, []);

    const generateFood = useCallback((snkA, snkB, otherFood) => {
        let newFood;
        let collision;
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_WIDTH),
                y: Math.floor(Math.random() * GRID_HEIGHT)
            };

            // Check collision with Snake A
            const hitA = snkA.some(s => s.x === newFood.x && s.y === newFood.y);
            // Check collision with Snake B
            const hitB = snkB.some(s => s.x === newFood.x && s.y === newFood.y);
            // Check collision with other food (if exists)
            const hitFood = otherFood && (otherFood.x === newFood.x && otherFood.y === newFood.y);

            collision = hitA || hitB || hitFood;
        } while (collision);
        return newFood;
    }, []);

    const resetGame = useCallback(() => {
        setSnakeA(INITIAL_SNAKE_A);
        setSnakeB(INITIAL_SNAKE_B);
        directionRef.current = INITIAL_DIR_A;
        lastProcessedDir.current = INITIAL_DIR_A;
        setScore(0);
        setStatus('playing');
        setFoodA(generateFood(INITIAL_SNAKE_A, INITIAL_SNAKE_B));
        setFoodB(generateFood(INITIAL_SNAKE_A, INITIAL_SNAKE_B, { x: 10, y: 5 })); // roughly different
        speedRef.current = INITIAL_SPEED;
        playSound('start');
    }, [generateFood, playSound]);

    const changeDirection = useCallback((newDir) => {
        if (status !== 'playing') return;

        // Prevent 180 degree turns on Snake A (which drives the logic)
        // If moving Right (1,0), cannot move Left (-1,0) -> sum of x is 0
        // If moving Up (0,-1), cannot move Down (0,1) -> sum of y is 0

        // Check against the LAST PROCESSED direction to handle rapid key presses
        const current = lastProcessedDir.current;

        if (newDir.x !== 0 && current.x !== 0) return; // Ignore horizontal change if already horizontal
        if (newDir.y !== 0 && current.y !== 0) return; // Ignore vertical change if already vertical

        // Wait, simple vector check: if (new.x === -curr.x && new.y === -curr.y) return;
        if (newDir.x === -current.x && newDir.y === -current.y) return;

        directionRef.current = newDir;
    }, [status]);

    const moveSnake = useCallback(() => {
        if (status !== 'playing') return;

        // A moves NORMALLY
        const dirA = directionRef.current;
        lastProcessedDir.current = dirA;

        // B moves INVERTED
        // If A goes Right (1,0), B goes Left (-1,0)
        // If A goes Up (0,-1), B goes DOWN (0,1) -> Inverted Y
        const dirB = { x: -dirA.x, y: -dirA.y };

        // Calculate new heads
        const headA = snakeA[0];
        const newHeadA = { x: headA.x + dirA.x, y: headA.y + dirA.y };

        const headB = snakeB[0];
        const newHeadB = { x: headB.x + dirB.x, y: headB.y + dirB.y };

        // --- COLLISION CHECKS --- //

        // 1. Wall Collisions
        if (
            newHeadA.x < 0 || newHeadA.x >= GRID_WIDTH || newHeadA.y < 0 || newHeadA.y >= GRID_HEIGHT ||
            newHeadB.x < 0 || newHeadB.x >= GRID_WIDTH || newHeadB.y < 0 || newHeadB.y >= GRID_HEIGHT
        ) {
            setStatus('gameover');
            playSound('crash');
            return;
        }

        // 2. Self/Other Collision
        // Since we haven't popped the tail yet, checking against current body is correct for "head hitting body"
        // EXCEPT the very last tail segment which will move away... but let's be strict for Quantum Snake.

        // A hits A?
        if (snakeA.some(s => s.x === newHeadA.x && s.y === newHeadA.y)) { setStatus('gameover'); playSound('crash'); return; }
        // B hits B?
        if (snakeB.some(s => s.x === newHeadB.x && s.y === newHeadB.y)) { setStatus('gameover'); playSound('crash'); return; }

        // A hits B?
        if (snakeB.some(s => s.x === newHeadA.x && s.y === newHeadA.y)) { setStatus('gameover'); playSound('crash'); return; }
        // B hits A?
        if (snakeA.some(s => s.x === newHeadB.x && s.y === newHeadB.y)) { setStatus('gameover'); playSound('crash'); return; }

        // Head-to-Head Collision
        if (newHeadA.x === newHeadB.x && newHeadA.y === newHeadB.y) {
            setStatus('gameover'); playSound('crash'); return;
        }

        // --- MOVEMENT & FOOD --- //

        let newSnakeA = [newHeadA, ...snakeA];
        let newSnakeB = [newHeadB, ...snakeB];
        let foodEaten = false;

        // Check A eating Food A
        if (newHeadA.x === foodA.x && newHeadA.y === foodA.y) {
            playSound('eat');
            addScore(10);
            setFoodA(generateFood(newSnakeA, newSnakeB, foodB));
            foodEaten = true;
        } else {
            newSnakeA.pop(); // Remove tail
        }

        // Check B eating Food B
        if (newHeadB.x === foodB.x && newHeadB.y === foodB.y) {
            playSound('eat');
            addScore(10);
            setFoodB(generateFood(newSnakeA, newSnakeB, foodA));
            foodEaten = true;
        } else {
            newSnakeB.pop(); // Remove tail
        }

        // Update State
        setSnakeA(newSnakeA);
        setSnakeB(newSnakeB);

        if (foodEaten) {
            // Speed up slightly?
            speedRef.current = Math.max(80, speedRef.current * 0.99);
        }

    }, [snakeA, snakeB, foodA, foodB, status, generateFood, playSound, addScore]);

    // Game Loop
    useEffect(() => {
        if (status === 'playing') {
            gameLoopRef.current = setInterval(moveSnake, speedRef.current);
        } else {
            clearInterval(gameLoopRef.current);
        }
        return () => clearInterval(gameLoopRef.current);
    }, [status, moveSnake]);

    return {
        snakeA,
        snakeB,
        foodA,
        foodB,
        score,
        highScore,
        status,
        resetGame,
        changeDirection,
        GRID_WIDTH,
        GRID_HEIGHT
    };
};
