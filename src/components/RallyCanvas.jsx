import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

const RallyCanvas = ({ onBack }) => {
    const containerRef = useRef(null);
    const gameRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Create game instance
        const game = new Rally3DGame(containerRef.current);
        gameRef.current = game;

        return () => {
            game.dispose();
        };
    }, []);

    // Keyboard
    useEffect(() => {
        const down = (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            if (e.key.toLowerCase() === 'm') {
                onBack?.();
                return;
            }
            gameRef.current?.handleInput(e.key, true);
        };

        const up = (e) => {
            gameRef.current?.handleInput(e.key, false);
        };

        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
        };
    }, [onBack]);

    const touch = useCallback((dir, pressed) => {
        const game = gameRef.current;
        if (!game) return;

        if (dir === 'start') {
            game.handleInput('Enter', true);
        } else {
            game.input[dir] = pressed;
        }
    }, []);

    return (
        <div className="rally-fullscreen">
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

            <div className="rally-touch-controls">
                <div className="rally-touch-left">
                    <button className="rally-touch-btn"
                        onTouchStart={() => touch('left', true)}
                        onTouchEnd={() => touch('left', false)}
                        onMouseDown={() => touch('left', true)}
                        onMouseUp={() => touch('left', false)}
                    >◀</button>
                </div>

                <div className="rally-touch-center">
                    <button className="rally-touch-btn accel"
                        onTouchStart={() => touch('up', true)}
                        onTouchEnd={() => touch('up', false)}
                        onMouseDown={() => touch('up', true)}
                        onMouseUp={() => touch('up', false)}
                    >▲</button>
                    <button className="rally-touch-btn start" onClick={() => touch('start', true)}>START</button>
                    <button className="rally-touch-btn brake"
                        onTouchStart={() => touch('down', true)}
                        onTouchEnd={() => touch('down', false)}
                        onMouseDown={() => touch('down', true)}
                        onMouseUp={() => touch('down', false)}
                    >▼</button>
                </div>

                <div className="rally-touch-right">
                    <button className="rally-touch-btn"
                        onTouchStart={() => touch('right', true)}
                        onTouchEnd={() => touch('right', false)}
                        onMouseDown={() => touch('right', true)}
                        onMouseUp={() => touch('right', false)}
                    >▶</button>
                </div>
            </div>

            <button className="rally-back-btn" onClick={onBack}>← MENU</button>
        </div>
    );
};

// Three.js Rally 3D Game Class
class Rally3DGame {
    constructor(container) {
        this.container = container;

        // Three.js setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87ceeb);
        container.appendChild(this.renderer.domElement);

        // Game state
        this.state = 'ready';
        this.speed = 0;
        this.maxSpeed = 200;
        this.position = 0;
        this.playerX = 0;
        this.distance = 0;

        this.input = { left: false, right: false, up: false, down: false };

        // Road data
        this.roadSegments = [];
        this.roadLength = 10000;

        // Other cars
        this.trafficCars = [];

        // HUD
        this.hudElement = null;
        this.overlayElement = null;

        // Initialize
        this.init();
        this.createHUD();
        this.createOverlay();
        this.animate();

        // Resize handler
        this.resizeHandler = () => this.onResize();
        window.addEventListener('resize', this.resizeHandler);
    }

    init() {
        // Sky gradient
        const skyGeo = new THREE.SphereGeometry(1500, 32, 32);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x1a5f8a) },
                bottomColor: { value: new THREE.Color(0xb8d4e8) }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        this.scene.add(new THREE.Mesh(skyGeo, skyMat));

        // Ground plane (snowy)
        const groundGeo = new THREE.PlaneGeometry(3000, 3000);
        const groundMat = new THREE.MeshBasicMaterial({ color: 0xd0d0d0 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        this.scene.add(ground);

        // Create road
        this.createRoad();

        // Create mountains
        this.createMountains();

        // Create player car
        this.createPlayerCar();

        // Create traffic cars
        this.createTrafficCars();

        // Camera position (behind car)
        this.camera.position.set(0, 5, -12);
        this.camera.lookAt(0, 2, 20);

        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(100, 100, 50);
        this.scene.add(sun);
    }

    createRoad() {
        // Create road as a series of segments
        const roadWidth = 12;
        const segmentLength = 50;
        const numSegments = 200;

        for (let i = 0; i < numSegments; i++) {
            const z = i * segmentLength;
            const curve = Math.sin(i * 0.03) * 15 + Math.sin(i * 0.07) * 8;

            // Road segment
            const roadGeo = new THREE.PlaneGeometry(roadWidth, segmentLength);
            const isAlternate = Math.floor(i / 2) % 2 === 0;
            const roadMat = new THREE.MeshBasicMaterial({
                color: isAlternate ? 0x4a4a4a : 0x555555
            });
            const road = new THREE.Mesh(roadGeo, roadMat);
            road.rotation.x = -Math.PI / 2;
            road.position.set(curve, 0, z);
            this.scene.add(road);

            // White edge lines
            const lineGeo = new THREE.PlaneGeometry(0.3, segmentLength);
            const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

            const leftLine = new THREE.Mesh(lineGeo, lineMat);
            leftLine.rotation.x = -Math.PI / 2;
            leftLine.position.set(curve - roadWidth / 2, 0.01, z);
            this.scene.add(leftLine);

            const rightLine = new THREE.Mesh(lineGeo, lineMat);
            rightLine.rotation.x = -Math.PI / 2;
            rightLine.position.set(curve + roadWidth / 2, 0.01, z);
            this.scene.add(rightLine);

            // Red/white rumble strips
            const rumbleGeo = new THREE.PlaneGeometry(1, segmentLength);
            const rumbleMat = new THREE.MeshBasicMaterial({
                color: isAlternate ? 0xff3333 : 0xffffff
            });

            const leftRumble = new THREE.Mesh(rumbleGeo, rumbleMat);
            leftRumble.rotation.x = -Math.PI / 2;
            leftRumble.position.set(curve - roadWidth / 2 - 0.7, 0.01, z);
            this.scene.add(leftRumble);

            const rightRumble = new THREE.Mesh(rumbleGeo, rumbleMat);
            rightRumble.rotation.x = -Math.PI / 2;
            rightRumble.position.set(curve + roadWidth / 2 + 0.7, 0.01, z);
            this.scene.add(rightRumble);

            // Center dashed line
            if (!isAlternate) {
                const centerGeo = new THREE.PlaneGeometry(0.2, segmentLength * 0.6);
                const centerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const centerLine = new THREE.Mesh(centerGeo, centerMat);
                centerLine.rotation.x = -Math.PI / 2;
                centerLine.position.set(curve, 0.01, z);
                this.scene.add(centerLine);
            }

            this.roadSegments.push({ z, curve });
        }
    }

    createMountains() {
        // Create mountain range
        const mountainPositions = [
            { x: -400, z: 800, scale: 3 },
            { x: -200, z: 900, scale: 2.5 },
            { x: 0, z: 1000, scale: 4 },
            { x: 200, z: 850, scale: 2.8 },
            { x: 400, z: 950, scale: 3.2 },
            { x: -300, z: 1100, scale: 2 },
            { x: 300, z: 1050, scale: 2.3 },
        ];

        mountainPositions.forEach(m => {
            // Mountain body
            const coneGeo = new THREE.ConeGeometry(50 * m.scale, 100 * m.scale, 6);
            const coneMat = new THREE.MeshBasicMaterial({ color: 0x5a6b7c });
            const mountain = new THREE.Mesh(coneGeo, coneMat);
            mountain.position.set(m.x, 50 * m.scale - 10, m.z);
            this.scene.add(mountain);

            // Snow cap
            const snowGeo = new THREE.ConeGeometry(20 * m.scale, 30 * m.scale, 6);
            const snowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const snow = new THREE.Mesh(snowGeo, snowMat);
            snow.position.set(m.x, 85 * m.scale - 10, m.z);
            this.scene.add(snow);
        });
    }

    createPlayerCar() {
        // Car body
        this.playerCar = new THREE.Group();

        // Main body
        const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4);
        const bodyMat = new THREE.MeshBasicMaterial({ color: 0xe53935 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        this.playerCar.add(body);

        // Roof
        const roofGeo = new THREE.BoxGeometry(1.6, 0.6, 2);
        const roofMat = new THREE.MeshBasicMaterial({ color: 0xc62828 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, 1.2, -0.3);
        this.playerCar.add(roof);

        // Windshield
        const windshieldGeo = new THREE.BoxGeometry(1.5, 0.5, 0.1);
        const windshieldMat = new THREE.MeshBasicMaterial({ color: 0x64b5f6 });
        const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
        windshield.position.set(0, 1.1, 0.8);
        this.playerCar.add(windshield);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        const wheelMat = new THREE.MeshBasicMaterial({ color: 0x222222 });

        [[-0.9, 0.4, 1.2], [0.9, 0.4, 1.2], [-0.9, 0.4, -1.2], [0.9, 0.4, -1.2]].forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...pos);
            this.playerCar.add(wheel);
        });

        // Tail lights
        const tailGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
        const tailLeft = new THREE.Mesh(tailGeo, tailMat);
        tailLeft.position.set(-0.7, 0.6, -2);
        this.playerCar.add(tailLeft);

        const tailRight = new THREE.Mesh(tailGeo, tailMat);
        tailRight.position.set(0.7, 0.6, -2);
        this.playerCar.add(tailRight);

        this.playerCar.position.set(0, 0, 0);
        this.scene.add(this.playerCar);
    }

    createTrafficCars() {
        const colors = [0x2980b9, 0x27ae60, 0x8e44ad, 0xf39c12, 0x1abc9c];

        for (let i = 0; i < 8; i++) {
            const car = new THREE.Group();

            const bodyGeo = new THREE.BoxGeometry(2, 0.8, 3.5);
            const bodyMat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)]
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.6;
            car.add(body);

            const roofGeo = new THREE.BoxGeometry(1.5, 0.5, 1.8);
            const roofMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.set(0, 1.1, -0.2);
            car.add(roof);

            car.userData = {
                z: 100 + i * 150 + Math.random() * 100,
                x: (Math.random() - 0.5) * 8,
                speed: 40 + Math.random() * 60
            };

            this.trafficCars.push(car);
            this.scene.add(car);
        }
    }

    createHUD() {
        this.hudElement = document.createElement('div');
        this.hudElement.style.cssText = `
            position: fixed;
            top: 15px;
            left: 15px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 18px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 100;
        `;
        this.container.appendChild(this.hudElement);
    }

    createOverlay() {
        this.overlayElement = document.createElement('div');
        this.overlayElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: rgba(0, 30, 60, 0.85);
            color: white;
            font-family: Arial, sans-serif;
            z-index: 100;
            text-align: center;
        `;
        this.overlayElement.innerHTML = `
            <h1 style="font-size: 48px; margin: 0;">RALLY 3D</h1>
            <p style="font-size: 18px; color: #88ccff; margin: 10px 0;">ENDLESS WINTER RACING</p>
            <p style="font-size: 16px; color: #ffcc00; margin-top: 30px;" id="startPrompt">PRESS ENTER TO START</p>
            <p style="font-size: 12px; color: #888; margin-top: 20px;">↑↓ ACCELERATE/BRAKE &nbsp; ←→ STEER</p>
        `;
        this.container.appendChild(this.overlayElement);

        // Blink start prompt
        setInterval(() => {
            const prompt = document.getElementById('startPrompt');
            if (prompt) prompt.style.opacity = prompt.style.opacity === '0' ? '1' : '0';
        }, 500);
    }

    handleInput(key, pressed) {
        if (this.state !== 'playing') {
            if ((key === 'Enter' || key === ' ') && pressed) {
                this.reset();
            }
            return;
        }

        const k = key.toLowerCase();
        if (k === 'arrowleft' || k === 'a') this.input.left = pressed;
        if (k === 'arrowright' || k === 'd') this.input.right = pressed;
        if (k === 'arrowup' || k === 'w') this.input.up = pressed;
        if (k === 'arrowdown' || k === 's') this.input.down = pressed;
    }

    reset() {
        this.state = 'playing';
        this.speed = 0;
        this.position = 0;
        this.playerX = 0;
        this.distance = 0;
        this.overlayElement.style.display = 'none';
    }

    update(dt) {
        if (this.state !== 'playing') return;

        // Speed control
        if (this.input.up) this.speed += 120 * dt;
        else if (this.input.down) this.speed -= 150 * dt;
        else this.speed -= 30 * dt;

        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));

        // Steering
        const steerSpeed = 8 * (this.speed / this.maxSpeed);
        if (this.input.left) this.playerX -= steerSpeed * dt;
        if (this.input.right) this.playerX += steerSpeed * dt;
        this.playerX = Math.max(-5, Math.min(5, this.playerX));

        // Move forward
        this.position += this.speed * dt;
        this.distance = Math.floor(this.position / 10);

        // Update player car position
        this.playerCar.position.x = this.playerX;
        this.playerCar.position.z = this.position;

        // Get road curve at current position
        const segmentIndex = Math.floor(this.position / 50) % this.roadSegments.length;
        const roadCurve = this.roadSegments[segmentIndex]?.curve || 0;

        // Apply curve pulling
        this.playerX -= roadCurve * 0.001 * this.speed * dt;

        // Update camera to follow car
        this.camera.position.x = this.playerX * 0.5;
        this.camera.position.z = this.position - 12;
        this.camera.lookAt(this.playerX, 2, this.position + 20);

        // Update traffic cars
        this.trafficCars.forEach(car => {
            car.userData.z += car.userData.speed * dt;

            // Loop back
            if (car.userData.z < this.position - 50) {
                car.userData.z = this.position + 300 + Math.random() * 200;
                car.userData.x = (Math.random() - 0.5) * 8;
            }

            // Get road curve for this car
            const carSegIdx = Math.floor(car.userData.z / 50) % this.roadSegments.length;
            const carRoadCurve = this.roadSegments[carSegIdx]?.curve || 0;

            car.position.set(
                car.userData.x + carRoadCurve,
                0,
                car.userData.z
            );

            // Collision check
            const dz = Math.abs(car.userData.z - this.position);
            const dx = Math.abs(car.userData.x - this.playerX);
            if (dz < 4 && dx < 2) {
                this.speed *= 0.5;
            }
        });

        // Update HUD
        this.hudElement.innerHTML = `
            <div>Km/h: ${Math.floor(this.speed)}</div>
            <div>Distance: ${this.distance}m</div>
        `;
    }

    animate() {
        let lastTime = performance.now();

        const loop = (now) => {
            if (!this.renderer) return;

            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;

            this.update(dt);
            this.renderer.render(this.scene, this.camera);

            this.animationId = requestAnimationFrame(loop);
        };

        this.animationId = requestAnimationFrame(loop);
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    dispose() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this.resizeHandler);
        this.renderer?.dispose();
        this.container.innerHTML = '';
    }
}

export default RallyCanvas;
