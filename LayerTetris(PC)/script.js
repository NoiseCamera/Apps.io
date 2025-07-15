document.addEventListener('DOMContentLoaded', () => {
    const canvases = [];
    const contexts = [];
    const visualizerCanvas = document.getElementById('visualizer-canvas');
    const visualizerCtx = visualizerCanvas.getContext('2d');

    for (let i = 0; i < 3; i++) { // Always get all 3 canvases
        const canvas = document.getElementById(`tetris-${i}`);
        canvases.push(canvas);
        contexts.push(canvas.getContext('2d'));
    }

    const nextCanvas = document.getElementById('next');
    const nextContext = nextCanvas.getContext('2d');
    const holdCanvas = document.getElementById('hold');
    const holdContext = holdCanvas.getContext('2d');

    const scoreElement = document.getElementById('score');
    const linesElement = document.getElementById('lines');
    const levelElement = document.getElementById('level');
    const layerSpeedElement = document.getElementById('layer-speed');

    const titleScreen = document.getElementById('title-screen');
    const finalScoreElement = document.getElementById('final-score');
    const titleMainText = document.getElementById('title-main-text');
    const gameContainer = document.getElementById('game-container');

    // NEW: Create a wrapper for vertical alignment control
    const outerWrapper = document.createElement('div');
    outerWrapper.id = "outer-game-wrapper";
    // Ensure gameContainer and its parent exist before manipulating DOM
    if (gameContainer && gameContainer.parentNode) {
        gameContainer.parentNode.insertBefore(outerWrapper, gameContainer);
        outerWrapper.appendChild(gameContainer);
    }

    const startSingleButton = document.getElementById('start-single-button');
    const startLayerButton = document.getElementById('start-layer-button');
    const startSpectateButton = document.getElementById('start-spectate-button');

    // BGM Buttons and Inputs
    const bgmPlayer = document.getElementById('bgm-player');
    const bgmUpload = document.getElementById('bgm-upload');
    const bgmFolderUpload = document.getElementById('bgm-folder-upload');
    const bgmFileButton = document.getElementById('bgm-file-button');
    const bgmFolderButton = document.getElementById('bgm-folder-button');

    const bgmVolumeSlider = document.getElementById('bgm-volume');
    const seVolumeSlider = document.getElementById('se-volume');

    const pauseMenu = document.getElementById('pause-menu');
    const resumeButton = document.getElementById('resume-button');
    const backToMenuButton = document.getElementById('back-to-menu-button');

    // --- NEW: BGM Controls ---
    const bgmControlsContainer = document.createElement('div');
    bgmControlsContainer.id = 'bgm-controls';

    const prevTrackButton = document.createElement('button');
    prevTrackButton.id = 'prev-track-button';
    prevTrackButton.innerText = '◀◀';

    const nextTrackButton = document.createElement('button');
    nextTrackButton.id = 'next-track-button';
    nextTrackButton.innerText = '▶▶';

    const trackInfoContainer = document.createElement('div');
    trackInfoContainer.id = 'track-info-container';
    const trackInfoText = document.createElement('div');
    trackInfoText.id = 'track-info-text';
    trackInfoContainer.appendChild(trackInfoText);

    bgmControlsContainer.appendChild(prevTrackButton);
    bgmControlsContainer.appendChild(trackInfoContainer);
    bgmControlsContainer.appendChild(nextTrackButton);

    // Insert BGM controls after the level display box
    const levelBox = levelElement.parentElement;
    levelBox.parentElement.insertBefore(bgmControlsContainer, levelBox.nextSibling);

    // Inject CSS for BGM controls and marquee animation
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
        #bgm-controls {
            display: none; /* Hidden by default */
            grid-template-columns: auto 1fr auto;
            gap: 8px;
            align-items: center;
            padding: 8px;
            background-color: rgba(13, 2, 33, 0.7);
            border-radius: 5px;
            margin-top: 10px;
        }
        #bgm-controls button {
            background-color: #4d4dff; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer; font-size: 14px;
        }
        #bgm-controls button:hover { background-color: #6a6aff; }
        #track-info-container { overflow: hidden; white-space: nowrap; color: #eee; text-align: center; }
        #track-info-text.scrolling { display: inline-block; padding-left: 100%; animation: marquee 15s linear infinite; }
        @keyframes marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-100%); }
        }
        /* NEW: Styles for vertical centering wrapper */
        #outer-game-wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-start; /* Default: align to top */
            align-items: center;
            transition: justify-content 0.5s ease; /* Smooth transition */
        }
        #outer-game-wrapper.centered {
            justify-content: center; /* Center vertically when this class is present */
        }
    `;
    document.head.appendChild(styleSheet);

    prevTrackButton.addEventListener('click', playPrevTrack);
    nextTrackButton.addEventListener('click', playNextTrack);

    // NEW: Group menu buttons for easier navigation
    const titleButtons = [startSingleButton, startLayerButton, startSpectateButton, bgmFileButton, bgmFolderButton];
    const pauseButtons = [resumeButton, backToMenuButton];

    // --- Sound Effects ---
    const seLand = document.getElementById('se-land');
    const seHardDrop = document.getElementById('se-hard-drop');
    const seLineClear = document.getElementById('se-line-clear');
    const seRotate = document.getElementById('se-rotate');
    const seHold = document.getElementById('se-hold');
    const soundEffects = [seLand, seHardDrop, seLineClear, seRotate, seHold];

    // --- Web Audio API for Visualizer ---
    let audioContext;
    let analyser;
    let sourceNode;
    let frequencyData;
    let audioContextInitialized = false;


    const ROWS = 20;
    const COLS = 10;
    const BLOCK_SIZE = 30; // ゲーム画面を大きくするためにブロックサイズを30pxに変更
    const NEXT_BLOCK_SIZE = 25; // NEXT表示も少し大きくする

    const COLORS = [
        null,
        '#ff00ff', // T
        '#00f0ff', // I
        '#f0ff00', // O
        '#ff4500', // L
        '#00ff7f', // J
        '#4d4dff', // S
        '#ff1493', // Z
        '#888888', // Garbage Block
    ];

    const SHAPES = [
        [], // Empty
        [[1, 1, 1], [0, 1, 0]], // T
        [[2, 2, 2, 2]], // I
        [[3, 3], [3, 3]], // O
        [[4, 0, 0], [4, 4, 4]], // L
        [[0, 0, 5], [5, 5, 5]], // J
        [[0, 6, 6], [6, 6, 0]], // S
        [[7, 7, 0], [0, 7, 7]], // Z
        [], // Garbage Block has no shape
    ];

    let gameMode = 'layer'; // 'single', 'layer', 'spectate'
    let numLayers = 3;
    let boards = [];
    let activeLayerIndex = 0;
    let player;
    let nextTetromino;
    let heldPieceTypeId = null;
    let canHold = true;

    let score = 0;
    let lines = 0;
    let level = 0;

    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let gameOver = true; // Start in a "game over" state
    let gameIsRunning = false;
    let echoes = []; // Stores active resonance echoes: { targetLayer, y, createdAt }
    let isPaused = false;
    const ECHO_LIFESPAN = 5000; // 5 seconds in milliseconds

    // NEW: BGM Playlist management
    let bgmPlaylist = [];
    let currentTrackIndex = -1;

    // NEW: Gamepad state management
    let gamepadState = {
        lastButtons: {},
        cooldowns: {},
        lastAxes: []
    };
    const GAMEPAD_COOLDOWN = 120; // ms for repeat after initial delay
    const GAMEPAD_INITIAL_DELAY = 250; // ms before repeat starts
    const AXIS_DEADZONE = 0.5; // Deadzone for analog sticks

    // NEW: Array to manage visual effects
    let animations = [];
    const ANIMATION_DURATIONS = {
        lineClear: 300, // ms
        particle: 500,  // ms
    };

    // NEW: Variables for random garbage events
    let randomGarbageTimer = 0;
    let nextRandomGarbageTime = 0;

    // NEW: State management for menu navigation
    let menuState = {
        current: 'title', // 'title', 'pause', 'none'
        selectedIndex: 0,
    };

    function createEmptyBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    function createTetromino() {
        // There are 7 playable shapes (indices 1 through 7).
        // The previous logic could accidentally generate a `typeId` of 8 (Garbage Block), which has no shape and would break the game.
        const NUM_PLAYABLE_SHAPES = 7;
        const typeId = Math.floor(Math.random() * NUM_PLAYABLE_SHAPES) + 1;
        return {
            typeId: typeId,
            shape: SHAPES[typeId],
            color: COLORS[typeId],
            pos: { x: Math.floor(COLS / 2) - 1, y: 0 },
        };
    }

    function draw() {
        if (!gameIsRunning) return;

        // Draw all boards and update layer classes
        for (let i = 0; i < numLayers; i++) {
            const ctx = contexts[i];
            const wrapper = canvases[i].parentElement;

            ctx.clearRect(0, 0, canvases[i].width, canvases[i].height);
            drawGrid(ctx); // NEW: Draw the background grid
            drawMatrix(ctx, boards[i], { x: 0, y: 0 }); // Draw the placed blocks

            // Hide unused layers in single mode
            if (gameMode === 'single' && i > 0) {
                wrapper.style.display = 'none';
            } else {
                wrapper.style.display = 'block';
                // Set classes for positioning and styling
                wrapper.classList.remove('active', 'inactive-left', 'inactive-right');
                if (i === activeLayerIndex) {
                    wrapper.classList.add('active');
                } else if (i < activeLayerIndex) {
                    wrapper.classList.add('inactive-left');
                } else { // i > activeLayerIndex
                    wrapper.classList.add('inactive-right');
                }
            }
        }

        // Draw echoes on all boards
        for (let i = 0; i < numLayers; i++) {
            const layerEchoes = echoes.filter(e => e.targetLayer === i);
            layerEchoes.forEach(echo => {
                const ctx = contexts[i];
                const now = performance.now();
                const age = now - echo.createdAt;
                // Pulsing alpha effect for the echo line
                const alpha = 0.4 * (1 - (age / ECHO_LIFESPAN)) * (0.75 + Math.sin(now / 150) * 0.25);
                ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
                ctx.fillRect(0, echo.y * BLOCK_SIZE, canvases[i].width, BLOCK_SIZE);
            });
        }

        // Draw animations on all boards
        const nowForAnim = performance.now();
        for (let i = 0; i < numLayers; i++) {
            const layerAnimations = animations.filter(anim => anim.layer === i);
            if (layerAnimations.length > 0) {
                const ctx = contexts[i];
                layerAnimations.forEach(anim => {
                    if (anim.type === 'lineClear') {
                        const elapsed = nowForAnim - anim.startTime;
                        const progress = elapsed / anim.duration;
                        
                        // Effect: A white rectangle that fades out
                        const alpha = 1 - progress;
                        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                        ctx.fillRect(0, anim.y * BLOCK_SIZE, canvases[i].width, BLOCK_SIZE);
                    }
                    else if (anim.type === 'particle') {
                        const elapsed = nowForAnim - anim.startTime;
                        const progress = elapsed / anim.duration;

                        // Update position
                        anim.x += anim.vx;
                        anim.y += anim.vy;
                        // Gravity
                        anim.vy += 0.2;

                        const alpha = 1 - progress;
                        ctx.globalAlpha = alpha > 0 ? alpha : 0;
                        ctx.fillStyle = anim.color;
                        ctx.fillRect(anim.x, anim.y, anim.size, anim.size);
                        ctx.globalAlpha = 1.0; // Reset alpha
                    }
                });
            }
        }

        // Draw ghost piece on the active board
        drawGhostPiece(contexts[activeLayerIndex]);
        // Draw held piece
        drawHoldPiece();

        // Draw player's tetromino only on the active board
        drawMatrix(contexts[activeLayerIndex], player.shape, player.pos);
        
        // Draw next tetromino
        nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        const nextShape = nextTetromino.shape;
        const nextColor = nextTetromino.color;
        const xOffset = (nextCanvas.width - nextShape[0].length * NEXT_BLOCK_SIZE) / 2;
        const yOffset = (nextCanvas.height - nextShape.length * NEXT_BLOCK_SIZE) / 2;
        nextShape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    nextContext.fillStyle = nextColor;
                    nextContext.fillRect(x * NEXT_BLOCK_SIZE + xOffset, y * NEXT_BLOCK_SIZE + yOffset, NEXT_BLOCK_SIZE, NEXT_BLOCK_SIZE);
                    nextContext.strokeStyle = '#0d0221';
                    nextContext.strokeRect(x * NEXT_BLOCK_SIZE + xOffset, y * NEXT_BLOCK_SIZE + yOffset, NEXT_BLOCK_SIZE, NEXT_BLOCK_SIZE);
                }
            });
        });
    }

    function drawHoldPiece() {
        holdContext.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
        if (heldPieceTypeId) {
            const heldShape = SHAPES[heldPieceTypeId];
            const heldColor = COLORS[heldPieceTypeId];
            const xOffset = (holdCanvas.width - heldShape[0].length * NEXT_BLOCK_SIZE) / 2;
            const yOffset = (holdCanvas.height - heldShape.length * NEXT_BLOCK_SIZE) / 2;

            // Dim the piece if player cannot hold in this turn
            if (!canHold) {
                holdContext.globalAlpha = 0.4;
            }

            heldShape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        holdContext.fillStyle = heldColor;
                        holdContext.fillRect(x * NEXT_BLOCK_SIZE + xOffset, y * NEXT_BLOCK_SIZE + yOffset, NEXT_BLOCK_SIZE, NEXT_BLOCK_SIZE);
                        holdContext.strokeStyle = '#0d0221'; // Add outline to the block
                        holdContext.strokeRect(x * NEXT_BLOCK_SIZE + xOffset, y * NEXT_BLOCK_SIZE + yOffset, NEXT_BLOCK_SIZE, NEXT_BLOCK_SIZE);
                    }
                });
            });
            holdContext.globalAlpha = 1.0; // Reset alpha
        }
    }

    function drawMatrix(context, matrix, offset, isGhost = false) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const color = COLORS[value];
                    if (isGhost) {
                        // Convert hex color to a transparent rgba version for the ghost
                        const r = parseInt(color.slice(1, 3), 16);
                        const g = parseInt(color.slice(3, 5), 16);
                        const b = parseInt(color.slice(5, 7), 16);
                        context.fillStyle = `rgba(${r}, ${g}, ${b}, 0.25)`;
                    } else {
                        context.fillStyle = color;
                    }
                    context.fillRect(x * BLOCK_SIZE + offset.x * BLOCK_SIZE, y * BLOCK_SIZE + offset.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    
                    if (!isGhost) {
                        context.strokeStyle = '#0d0221'; // Block outline only for non-ghosts
                        context.strokeRect(x * BLOCK_SIZE + offset.x * BLOCK_SIZE, y * BLOCK_SIZE + offset.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    }
                }
            });
        });
    }

    // NEW: Function to draw the grid on a canvas
    function drawGrid(context) {
        context.strokeStyle = 'rgba(0, 240, 255, 0.1)'; // Faint cyan grid
        context.lineWidth = 1;

        for (let x = 0; x <= COLS; x++) {
            context.beginPath();
            context.moveTo(x * BLOCK_SIZE, 0);
            context.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            context.stroke();
        }

        for (let y = 0; y <= ROWS; y++) {
            context.beginPath();
            context.moveTo(0, y * BLOCK_SIZE);
            context.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
            context.stroke();
        }
    }

    // NEW: Function to create landing particle effects
    function createLandingEffect(piece, type = 'soft') {
        const now = performance.now();
        const particleCount = type === 'hard' ? 20 : 5;
        const initialVelocity = type === 'hard' ? 6 : 3;

        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    // Create a few particles for each block
                    for (let i = 0; i < particleCount; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = Math.random() * initialVelocity;
                        animations.push({
                            type: 'particle',
                            layer: activeLayerIndex,
                            x: (piece.pos.x + x + 0.5) * BLOCK_SIZE,
                            y: (piece.pos.y + y + 0.5) * BLOCK_SIZE,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            startTime: now,
                            duration: ANIMATION_DURATIONS.particle + Math.random() * 200,
                            // Hard drops create white-hot particles
                            color: type === 'hard' ? '#FFFFFF' : piece.color,
                            size: Math.random() * 3 + 1
                        });
                    }
                }
            });
        });
    }

    function merge(board, player) {
        player.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    board[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    function collide(board, player) {
        const [shape, pos] = [player.shape, player.pos];
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                // If this is an actual block on the tetromino
                if (shape[y][x] !== 0) {
                    const newY = y + pos.y;
                    const newX = x + pos.x;

                    // Check for collisions
                    if (
                        newY >= ROWS || // 1. Out of bounds (bottom)
                        newX < 0 ||     // 2. Out of bounds (left)
                        newX >= COLS || // 3. Out of bounds (right)
                        (board[newY] && board[newY][newX] !== 0) // 4. Overlapping another piece
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function rotate(matrix) {
        const newMatrix = matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
        return newMatrix.reverse();
    }

    function playSoundEffect(audioElement) {
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play().catch(e => {
                console.error(`Sound effect playback failed for ${audioElement.id}:`, e);
            });
        }
    }

    function playerRotate() {
        const originalShape = player.shape;
        player.shape = rotate(player.shape);
        let offset = 1;
        while (collide(boards[activeLayerIndex], player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.shape[0].length) {
                player.shape = originalShape; // Can't rotate, revert
                return;
            }
        }
        playSoundEffect(seRotate);
    }

    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(boards[activeLayerIndex], player)) {
            player.pos.x -= dir;
        }
    }

    function playerDrop() {
        player.pos.y++;
        if (collide(boards[activeLayerIndex], player)) {
            player.pos.y--;
            playSoundEffect(seLand);
            createLandingEffect(player, 'soft');
            merge(boards[activeLayerIndex], player);
            sweepLines();
            playerReset();
        }
        dropCounter = 0;
    }
    
    function playerHardDrop() {
        while (!collide(boards[activeLayerIndex], player)) {
            player.pos.y++;
        }
        player.pos.y--;
        playSoundEffect(seHardDrop);
        createLandingEffect(player, 'hard');
        merge(boards[activeLayerIndex], player);
        sweepLines();
        playerReset();
        dropCounter = 0;
    }

    function holdPiece() {
        if (!canHold) return;
        playSoundEffect(seHold);

        if (heldPieceTypeId === null) {
            // First time holding, or hold is empty
            heldPieceTypeId = player.typeId;
            playerReset();
        } else {
            // Swap current piece with held piece
            const tempTypeId = player.typeId;
            player.typeId = heldPieceTypeId;
            player.shape = SHAPES[player.typeId];
            player.color = COLORS[player.typeId];
            player.pos = { x: Math.floor(COLS / 2) - 1, y: 0 };
            heldPieceTypeId = tempTypeId;

        }

        canHold = false; // Can only hold once per piece
        // If the new piece collides, it's game over
        if (collide(boards[activeLayerIndex], player)) {
            endGame();
        }

        // Notify AI about the new piece from hold.
        // Use a timeout to ensure the state is fully updated before the AI runs.
        setTimeout(() => {
            if (gameIsRunning && player) {
                window.dispatchEvent(new CustomEvent('newPiece', { detail: { player: JSON.parse(JSON.stringify(player)) } }));
            }
        }, 0);
    }

    function updateDropInterval() {
        const baseInterval = 1000;
        // Layer speed modifiers: 0=Easy, 1=Normal, 2=Hard
        // Multipliers make speed faster (lower number) or slower (higher number)
        const speedModifiers = [1.5, 1.0, 0.7]; 
        
        // Ensure interval doesn't become too fast or negative
        const levelSpeed = Math.max(100, baseInterval - level * 50); 
        dropInterval = levelSpeed * speedModifiers[activeLayerIndex];
    }

    function updateLayerSpeedDisplay() {
        const speedBox = document.getElementById('layer-speed-box');
        if (!speedBox || !layerSpeedElement) return;

        // Hide the indicator in single-layer mode
        if (gameMode === 'single') {
            speedBox.style.display = 'none';
            return;
        }

        // Show the indicator for layer modes
        speedBox.style.display = 'block';

        const speeds = ['SLOW', 'NORMAL', 'FAST'];
        const speedClasses = ['slow', 'normal', 'fast'];

        layerSpeedElement.innerText = speeds[activeLayerIndex];
        layerSpeedElement.className = ''; // Clear previous classes
        layerSpeedElement.classList.add(speedClasses[activeLayerIndex]);
    }

    function updateControlsDisplay() {
        const layerControls = document.querySelectorAll('.layer-control');
        if (gameMode === 'single') {
            layerControls.forEach(el => el.classList.add('hidden'));
        } else {
            layerControls.forEach(el => el.classList.remove('hidden'));
        }
    }

    // NEW: Helper to find the lowest row index of a piece that contains a block.
    // This is used for smart layer switching to prevent kicking a piece off-screen.
    function getPieceLowestRowIndex(piece) {
        if (!piece || !piece.shape) return -1;
        for (let y = piece.shape.length - 1; y >= 0; y--) {
            if (piece.shape[y].some(cell => cell !== 0)) {
                return y;
            }
        }
        return -1;
    }

    function switchLayer(dir) {
        // In single-player mode, layer switching is disabled.
        if (gameMode === 'single') {
            return;
        }

        const newLayerIndex = activeLayerIndex + dir;
        if (newLayerIndex < 0 || newLayerIndex >= numLayers) {
            return; // Out of bounds
        }

        const targetWrapper = canvases[newLayerIndex].parentElement;
        const targetBoard = boards[newLayerIndex];

        // Create a copy of the player to test the switch
        const testPlayer = JSON.parse(JSON.stringify(player));

        if (!collide(targetBoard, testPlayer)) {
            // No collision, switch normally
            activeLayerIndex = newLayerIndex;
            updateDropInterval(); // Update speed when layer changes
            updateLayerSpeedDisplay();
        } else {
            // Collision detected, try to "kick" the piece upwards to find a free spot.
            // This makes layer switching feel more responsive and less "stuck".
            let kicked = false;
            const originalY = testPlayer.pos.y;
            const lowestRow = getPieceLowestRowIndex(testPlayer);

            for (let i = 1; i <= 4; i++) { // Try kicking up to 4 rows
                testPlayer.pos.y = originalY - i;

                // Prevent kicking the piece's lowest block off the top of the board
                if (lowestRow !== -1 && testPlayer.pos.y + lowestRow < 0) {
                    break;
                }

                if (!collide(targetBoard, testPlayer)) {
                    // Found a valid position after kicking up
                    activeLayerIndex = newLayerIndex;
                    player.pos.y = testPlayer.pos.y; // Apply the new Y position to the actual player
                    updateDropInterval();
                    updateLayerSpeedDisplay();
                    kicked = true;
                    break;
                }
            }

            if (!kicked) {
                // Still couldn't switch, show feedback
                targetWrapper.classList.add('switch-failed');
                setTimeout(() => {
                    targetWrapper.classList.remove('switch-failed');
                }, 400);
            }
        }
    }

    function drawGhostPiece(context) {
        // Create a copy of the player object to manipulate for ghost calculation
        const ghost = {
            shape: player.shape,
            pos: { x: player.pos.x, y: player.pos.y }
        };

        // Drop the ghost piece down until it collides
        while (!collide(boards[activeLayerIndex], ghost)) {
            ghost.pos.y++;
        }
        // Move it back up one step to the last valid position
        ghost.pos.y--;

        drawMatrix(context, ghost.shape, ghost.pos, true);
    }

    function triggerRandomGarbageEvent() {
        // Disable random garbage in single-player mode
        if (gameMode === 'single') return;

        if (!gameIsRunning) return;

        const targetLayer = Math.floor(Math.random() * numLayers);

        const rand = Math.random();
        let numLines;
        if (rand < 0.6) { // 60% chance for 1 line
            numLines = 1;
        } else if (rand < 0.9) { // 30% chance for 2 lines
            numLines = 2;
        } else { // 10% chance for 3 lines
            numLines = 3;
        }

        // TODO: Consider adding a visual warning before adding the lines.
        // For now, just add them directly.
        addGarbageLines(targetLayer, numLines);
    }

    function addGarbageLines(targetLayerIndex, numLines) {
        const board = boards[targetLayerIndex];
        // Create a hole in a consistent, but random-per-drop, position
        const holePosition = Math.floor(Math.random() * COLS);

        for (let i = 0; i < numLines; i++) {
            // Remove the top row to make space
            board.shift();

            // Create a new garbage row with a value of 8
            const garbageRow = Array(COLS).fill(8);
            garbageRow[holePosition] = 0; // The hole

            // Add the new garbage row to the bottom
            board.push(garbageRow);
        }

        // If garbage is added to the active layer, push the player's piece up to avoid it getting stuck
        if (targetLayerIndex === activeLayerIndex) {
            while (collide(board, player)) {
                player.pos.y--;
            }
        }

        // Check for game over condition on the layer that received garbage.
        // If any block has been pushed into the top row, it's game over.
        if (board[0].some(cell => cell !== 0)) {
            endGame();
        }
    }

    function playerReset() {
        player = nextTetromino;
        nextTetromino = createTetromino();
        player.pos = { x: Math.floor(COLS / 2) - 1, y: 0 };
        canHold = true; // Allow holding the new piece
        updateDropInterval(); // Set initial speed

        // Check for game over condition
        if (collide(boards[activeLayerIndex], player)) {
            endGame();
            return;
        }

        // Use a timeout to ensure the state is fully updated before the AI runs
        // Pass a deep copy of the new player object with the event.
        setTimeout(() => {
            if (gameIsRunning && player) {
                window.dispatchEvent(new CustomEvent('newPiece', { detail: { player: JSON.parse(JSON.stringify(player)) } }));
            }
        }, 0);
    }

    function sweepLines() {
        const board = boards[activeLayerIndex];
        const playerClearedRows = [];

        // 1. Find all lines cleared by the player.
        for (let y = 0; y < ROWS; y++) {
            if (board[y].every(cell => cell !== 0)) {
                playerClearedRows.push(y);
            }
        }

        if (playerClearedRows.length === 0) {
            return; // Nothing to do if no lines were cleared.
        }

        playSoundEffect(seLineClear);
        // 2. Check for Resonance and identify any additional lines to clear from the cascade.
        let resonanceBonus = 0;
        const cascadeRowsToClear = new Set();
        playerClearedRows.forEach(clearedY => {
            const echoIndex = echoes.findIndex(e => e.targetLayer === activeLayerIndex && e.y === clearedY);
            if (echoIndex !== -1) {
                resonanceBonus += 500;
                echoes.splice(echoIndex, 1); // Consume echo

                // Mark the two rows below the resonance line for cascade clearing.
                for (let i = 1; i <= 2; i++) {
                    const cascadeY = clearedY + i;
                    if (cascadeY < ROWS) {
                        cascadeRowsToClear.add(cascadeY);
                    }
                }
            }
        });

        // 3. Combine player-cleared and cascade-cleared lines into one set.
        const allLinesToRemove = new Set([...playerClearedRows, ...cascadeRowsToClear]);
        const totalClearedCount = allLinesToRemove.size;

        // NEW: Create a line clear animation for each cleared row
        if (totalClearedCount > 0) {
            allLinesToRemove.forEach(y => {
                animations.push({
                    type: 'lineClear',
                    layer: activeLayerIndex,
                    y: y,
                    startTime: performance.now(),
                    duration: ANIMATION_DURATIONS.lineClear
                });
            });
        }

        // 4. Create the new board by filtering out all cleared lines.
        let newBoard = board.filter((_, y) => !allLinesToRemove.has(y));

        // 5. Add new empty rows at the top to cause the "fall" effect.
        const newEmptyRows = Array.from({ length: totalClearedCount }, () => Array(COLS).fill(0));
        boards[activeLayerIndex] = [...newEmptyRows, ...newBoard];

        // 6. Update score, lines, and send garbage based on PLAYER-cleared lines.
        const playerClearedCount = playerClearedRows.length;
        lines += playerClearedCount;
        score += ([0, 10, 30, 50, 80][playerClearedCount] * (level + 1)) + resonanceBonus;
        const garbageToSend = [0, 0, 1, 2, 4][playerClearedCount] || 0;

        if (garbageToSend > 0 && gameMode !== 'single') {
            for (let i = 0; i < numLayers; i++) {
                if (i !== activeLayerIndex) {
                    addGarbageLines(i, garbageToSend);
                }
            }
        }

        // 7. Create new echoes based on PLAYER-cleared lines.
        playerClearedRows.forEach(clearedY => {
            for (let i = 0; i < numLayers && gameMode !== 'single'; i++) {
                if (i !== activeLayerIndex) {
                    echoes.push({ targetLayer: i, y: clearedY, createdAt: performance.now() });
                }
            }
        });

        // 8. Update level.
        const oldLevel = level;
        level = Math.floor(lines / 10);
        if (oldLevel !== level) {
            updateDropInterval();
        }

        // 9. Notify AI that the board has changed.
        window.dispatchEvent(new CustomEvent('boardChanged'));
    }

    function updateScore() {
        scoreElement.innerText = score;
        linesElement.innerText = lines;
        levelElement.innerText = level;
    }

    // NEW: Function to visually highlight the selected menu item
    function updateMenuHighlight() {
        let buttons;
        if (menuState.current === 'title') {
            buttons = titleButtons;
        } else if (menuState.current === 'pause') {
            buttons = pauseButtons;
        } else {
            // Clear all highlights if no menu is active
            [...titleButtons, ...pauseButtons].forEach(btn => btn.classList.remove('selected'));
            return;
        }

        buttons.forEach((btn, index) => {
            if (index === menuState.selectedIndex) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    // Variable to handle delays between AI actions without pausing the game
    let aiActionCooldown = 0;

    // NEW: Helper function for repeatable gamepad inputs (e.g., holding D-pad)
    function handleRepeatableInput(action, isPressed, callback, now) {
        if (isPressed) {
            const cooldown = gamepadState.cooldowns[action];
            if (!cooldown) {
                // First press: execute immediately and set initial delay
                callback();
                gamepadState.cooldowns[action] = { nextActionTime: now + GAMEPAD_INITIAL_DELAY };
            } else if (now >= cooldown.nextActionTime) {
                // Held down: execute and set standard repeat delay
                callback();
                gamepadState.cooldowns[action].nextActionTime = now + GAMEPAD_COOLDOWN;
            }
        } else {
            // Not pressed: clear the cooldown state for this action
            if (gamepadState.cooldowns[action]) {
                delete gamepadState.cooldowns[action];
            }
        }
    }

    // NEW: Function to process gamepad inputs each frame
    function handleGamepadInput() {
        const gamepads = navigator.getGamepads();
        if (!gamepads || !gamepads[0]) {
            return; // No gamepad connected
        }

        const gp = gamepads[0];
        const currentButtons = {};
        gp.buttons.forEach((button, index) => {
            if (button.pressed) {
                currentButtons[index] = true;
            }
        });

        // --- Pause Button Handling (always active) ---
        // Button 9 is typically Start/Options.
        if (currentButtons[9] && !gamepadState.lastButtons[9]) {
            togglePause();
        }

        // --- Menu Navigation Logic ---
        if (gameOver || isPaused) {
            const menuButtons = isPaused ? pauseButtons : titleButtons;
            if (menuButtons.length === 0) return;

            // Input detection (single press)
            const dpadUp = currentButtons[12] && !gamepadState.lastButtons[12];
            const dpadDown = currentButtons[13] && !gamepadState.lastButtons[13];
            const axisY = gp.axes[1] || 0;
            const lastAxisY = gamepadState.lastAxes[1] || 0;
            const stickUp = axisY < -AXIS_DEADZONE && lastAxisY >= -AXIS_DEADZONE;
            const stickDown = axisY > AXIS_DEADZONE && lastAxisY <= AXIS_DEADZONE;

            // Index update
            if (dpadUp || stickUp) {
                menuState.selectedIndex = (menuState.selectedIndex - 1 + menuButtons.length) % menuButtons.length;
                updateMenuHighlight();
            } else if (dpadDown || stickDown) {
                menuState.selectedIndex = (menuState.selectedIndex + 1) % menuButtons.length;
                updateMenuHighlight();
            }

            // Confirmation (A button on Xbox controller)
            if (currentButtons[0] && !gamepadState.lastButtons[0]) {
                menuButtons[menuState.selectedIndex].click(); // Simulate a click
            }

            gamepadState.lastButtons = currentButtons;
            gamepadState.lastAxes = [...gp.axes];
            return;
        }

        // --- Game Input Logic ---
        // Disable game controls if in spectate mode or if AI is active
        if (!gameIsRunning || gameMode === 'spectate' || (window.aiAPI && window.aiAPI.isEnabled())) {
            gamepadState.cooldowns = {}; // Clear any lingering cooldowns
            gamepadState.lastButtons = currentButtons;
            gamepadState.lastAxes = [...gp.axes];
            return;
        }

        const now = performance.now();

        // --- Handle single-press actions (buttons that don't repeat on hold) ---
        // Buttons 0, 1, 2, 3 (A, B, X, Y on Xbox controller) for Rotate
        [0, 1, 2, 3].forEach(index => {
            if (currentButtons[index] && !gamepadState.lastButtons[index]) {
                playerRotate();
            }
        });

        // Button 4 (L1/LB) for Layer Switch Left
        if (currentButtons[4] && !gamepadState.lastButtons[4]) {
            switchLayer(-1);
        }

        // Button 5 (R1/RB) for Layer Switch Right
        if (currentButtons[5] && !gamepadState.lastButtons[5]) {
            switchLayer(1);
        }

        // Button 6 (L2/LT) for Hold
        if (currentButtons[6] && !gamepadState.lastButtons[6]) {
            holdPiece();
        }

        // Button 7 (R2/RT) for Hard Drop
        if (currentButtons[7] && !gamepadState.lastButtons[7]) {
            playerHardDrop();
        }

        // --- Handle repeatable actions (D-pad and analog stick) ---
        const dpadLeft = currentButtons[14];
        const dpadRight = currentButtons[15];
        const dpadDown = currentButtons[13];

        const axisX = gp.axes[0] || 0;
        const axisY = gp.axes[1] || 0;

        const moveLeft = dpadLeft || (axisX < -AXIS_DEADZONE);
        const moveRight = dpadRight || (axisX > AXIS_DEADZONE);
        const softDrop = dpadDown || (axisY > AXIS_DEADZONE);

        handleRepeatableInput('moveLeft', moveLeft, () => playerMove(-1), now);
        handleRepeatableInput('moveRight', moveRight, () => playerMove(1), now);
        handleRepeatableInput('softDrop', softDrop, playerDrop, now);

        // Update last known state for next frame
        gamepadState.lastButtons = currentButtons;
        gamepadState.lastAxes = [...gp.axes];
    }

    function update(time = 0) {
        // Always handle controller input, even when paused, to catch the unpause command.
        handleGamepadInput();

        // If the game is over or not running, keep the animation frame loop going for input polling, but don't advance game logic.
        if (gameOver || !gameIsRunning) {
            requestAnimationFrame(update);
            return;
        }

        // If paused, just draw the static scene and wait for the next frame.
        if (isPaused) {
            draw(); // Draw the paused state
            requestAnimationFrame(update);
            return;
        }

        let deltaTime = time - lastTime;
        // NEW: Cap deltaTime to prevent large jumps when the tab is inactive.
        // A large deltaTime can cause the piece to drop instantly and other unpredictable behavior.
        if (deltaTime > 250) {
            deltaTime = 250; // Cap at a quarter of a second
        }
        lastTime = time;
        dropCounter += deltaTime;
        aiActionCooldown -= deltaTime;
        randomGarbageTimer += deltaTime;

        // Update and filter expired echoes
        const now = performance.now();
        echoes = echoes.filter(e => now - e.createdAt < ECHO_LIFESPAN);
        // NEW: Filter expired animations
        animations = animations.filter(anim => now - anim.startTime < anim.duration);

        // NEW: Check for random garbage event
        if (randomGarbageTimer > nextRandomGarbageTime) {
            triggerRandomGarbageEvent();
            randomGarbageTimer = 0;
            // Set a new random interval for the next event (15-30 seconds)
            nextRandomGarbageTime = 15000 + Math.random() * 15000;
        }

        // NEW: Execute the AI's next planned move if the cooldown is over.
        if (window.aiAPI && aiActionCooldown <= 0) {
            const delay = window.aiAPI.executeNextPlannedMove();
            aiActionCooldown = delay; // Set the cooldown for the next action
        }

        // Automatic drop logic
        if (dropCounter > dropInterval) {
            // Only drop the piece automatically if the AI is not controlling it.
            if (!window.aiAPI || !window.aiAPI.isEnabled()) {
                playerDrop();
            }
        }

        draw();
        updateScore();
        requestAnimationFrame(update);
    }

    function togglePause() {
        if (gameOver || !gameIsRunning) return;

        isPaused = !isPaused;
        pauseMenu.classList.toggle('hidden', !isPaused);

        // If we are unpausing, we need to reset lastTime to avoid a large deltaTime jump.
        // The game loop (`update`) runs continuously, so no need to restart it.
        if (!isPaused) {
            lastTime = performance.now();
            menuState.current = 'none';
        } else {
            menuState.current = 'pause';
            menuState.selectedIndex = 0;
        }
        updateMenuHighlight();
    }

    document.addEventListener('keydown', event => {
        // Allow pausing in any mode, even spectate.
        if (event.key.toLowerCase() === 'p') {
            togglePause();
            return; // Stop further processing for the 'p' key
        }

        // Disable other player controls if paused, in spectate mode, or if AI is active
        if (isPaused || gameOver || !gameIsRunning || gameMode === 'spectate') {
            return;
        }
        // Also disable controls if AI is manually enabled in a playable mode
        if (window.aiAPI && window.aiAPI.isEnabled()) return;

        if (event.key === 'ArrowLeft') {
            playerMove(-1);
        } else if (event.key === 'ArrowRight') {
            playerMove(1);
        } else if (event.key === 'ArrowDown') {
            playerDrop();
        } else if (event.key === 'ArrowUp') {
            playerRotate();
        } else if (event.key === ' ') {
            playerHardDrop();
        } else if (event.key.toLowerCase() === 'q') {
            switchLayer(-1);
        } else if (event.key.toLowerCase() === 'e') {
            switchLayer(1);
        } else if (event.key.toLowerCase() === 'c') {
            holdPiece();
        }
    });

    // --- Visualizer Functions ---

    function initAudioContext() {
        // Initialize only once
        if (audioContextInitialized) return;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256; // Number of samples to collect

            // Create a source node from the <audio> element
            sourceNode = audioContext.createMediaElementSource(bgmPlayer);
            
            // Connect the nodes: source -> analyser -> speakers
            sourceNode.connect(analyser);
            analyser.connect(audioContext.destination);

            // Create an array to store the frequency data
            frequencyData = new Uint8Array(analyser.frequencyBinCount);
            audioContextInitialized = true;

            // Start the visualizer loop
            drawVisualizer();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
        }
    }

    function drawVisualizer() {
        requestAnimationFrame(drawVisualizer);
        if (!analyser || !frequencyData) return;
        analyser.getByteFrequencyData(frequencyData);

        visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        const bgGradient = visualizerCtx.createLinearGradient(0, 0, 0, visualizerCanvas.height);
        bgGradient.addColorStop(0, '#0a0218');
        bgGradient.addColorStop(0.5, '#0d0221');
        bgGradient.addColorStop(1, '#1a0442');
        visualizerCtx.fillStyle = bgGradient;
        visualizerCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

        // --- NEW: Beat Flash Effect ---
        const bass = frequencyData.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
        if (bass > 180) { // Adjust threshold for sensitivity
            const flashAlpha = (bass - 180) / 75; // Calculate alpha based on bass intensity
            visualizerCtx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.1})`;
            visualizerCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        }

        const barCount = frequencyData.length * 0.8;
        const barWidth = visualizerCanvas.width / barCount;
        const horizon = visualizerCanvas.height * 0.6;

        for (let i = 0; i < barCount; i++) {
            const barHeight = frequencyData[i] * 2.0;
            if (barHeight < 2) continue;

            const x = i * barWidth;
            const y = horizon - barHeight;

            let hue = 180 + (i / barCount) * 170; // Cyan -> Blue -> Purple -> Magenta -> Pink

            // Make the main building part more transparent and less bright
            const mainGradient = visualizerCtx.createLinearGradient(x, y, x, horizon);
            mainGradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.6)`); // Reduced saturation, lightness, and alpha
            mainGradient.addColorStop(1, `hsla(${hue}, 70%, 40%, 0.8)`); // Reduced saturation, lightness, and alpha
            visualizerCtx.fillStyle = mainGradient;
            visualizerCtx.fillRect(x, y, barWidth, barHeight);

            // Make the reflection even more transparent
            const reflectionGradient = visualizerCtx.createLinearGradient(x, horizon, x, horizon + barHeight);
            reflectionGradient.addColorStop(0, `hsla(${hue}, 70%, 40%, 0.3)`); // Reduced saturation and alpha
            reflectionGradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);
            visualizerCtx.fillStyle = reflectionGradient;
            visualizerCtx.fillRect(x, horizon, barWidth, barHeight);

            // Make the "windows" less frequent and more subtle
            if (barHeight > 120 && Math.random() > 0.85) {
                visualizerCtx.fillStyle = `hsla(${hue}, 100%, 85%, ${Math.random() * 0.3 + 0.2})`; // Reduced lightness and alpha
                const windowY = y + Math.random() * (barHeight - 20);
                const windowX = x + barWidth * 0.2 + Math.random() * barWidth * 0.6;
                visualizerCtx.fillRect(windowX, windowY, 2, 4);
            }
        }

        // --- NEW: Particle Shower Effect ---
        const treble = frequencyData.slice(50, 100).reduce((a, b) => a + b, 0) / 50;
        if (treble > 80) { // Adjust threshold for sensitivity
            for (let i = 0; i < 2; i++) { // Create a couple of particles
                const x = Math.random() * visualizerCanvas.width;
                const y = Math.random() * visualizerCanvas.height * 0.5;
                visualizerCtx.fillStyle = `hsla(${180 + Math.random() * 180}, 100%, 80%, 0.8)`;
                visualizerCtx.fillRect(x, y, 2, 10); // "Shooting star" shape
            }
        }

        visualizerCtx.strokeStyle = 'rgba(255, 0, 255, 0.2)';
        visualizerCtx.lineWidth = 1;
        visualizerCtx.beginPath();
        visualizerCtx.moveTo(0, horizon);
        visualizerCtx.lineTo(visualizerCanvas.width, horizon);
        visualizerCtx.stroke();
    }

    function handleBgmUpload(event) {
        const file = event.target.files[0];
        if (file) {
            // Clear playlist mode
            bgmPlaylist = [];
            currentTrackIndex = -1;
            bgmPlayer.loop = true; // Loop the single track

            const fileURL = URL.createObjectURL(file);
            bgmPlayer.src = fileURL;
            bgmPlayer.play().catch(e => console.log("BGM playback will start on user interaction."));

            bgmControlsContainer.style.display = 'grid';
            prevTrackButton.style.display = 'none';
            nextTrackButton.style.display = 'none';
            updateTrackInfo(file.name);
        }
    }

    function handleBgmFolderUpload(event) {
        const files = event.target.files;
        if (files.length > 0) {
            bgmPlaylist = Array.from(files).filter(file => file.type.startsWith('audio/'));

            if (bgmPlaylist.length > 0) {
                bgmPlayer.loop = true; // Loop a single track even in playlist mode, per request
                currentTrackIndex = -1; // Reset index
                bgmControlsContainer.style.display = 'grid';
                // Show buttons only if there's more than one song
                const showButtons = bgmPlaylist.length > 1;
                prevTrackButton.style.display = showButtons ? 'block' : 'none';
                nextTrackButton.style.display = showButtons ? 'block' : 'none';
                playNextTrack();
            } else {
                alert("選択したフォルダに再生可能な音声ファイルが見つかりませんでした。");
                bgmControlsContainer.style.display = 'none';
            }
        }
    }

    function playNextTrack() {
        if (bgmPlaylist.length === 0) return;

        // Move to the next track sequentially
        currentTrackIndex = (currentTrackIndex + 1) % bgmPlaylist.length;
        const track = bgmPlaylist[currentTrackIndex];
        const fileURL = URL.createObjectURL(track);
        bgmPlayer.src = fileURL;
        bgmPlayer.play().catch(e => console.error("Error playing next track:", e));
        updateTrackInfo(track.name);
    }

    function playPrevTrack() {
        if (bgmPlaylist.length === 0) return;

        // Move to the previous track sequentially
        currentTrackIndex = (currentTrackIndex - 1 + bgmPlaylist.length) % bgmPlaylist.length;
        const track = bgmPlaylist[currentTrackIndex];
        const fileURL = URL.createObjectURL(track);
        bgmPlayer.src = fileURL;
        bgmPlayer.play().catch(e => console.error("Error playing prev track:", e));
        updateTrackInfo(track.name);
    }

    function updateTrackInfo(trackName) {
        // Clean up file extension and underscores for better display
        const displayName = trackName.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        trackInfoText.innerText = displayName;

        // Check if the text is overflowing and add/remove scrolling class accordingly
        // Use a timeout to allow the browser to render the new text and get the correct width
        setTimeout(() => {
            const containerWidth = trackInfoContainer.clientWidth;
            const textWidth = trackInfoText.scrollWidth;
            trackInfoText.classList.toggle('scrolling', textWidth > containerWidth);
        }, 50);
    }

    function startGame(mode) {
        if (gameIsRunning) return;

        // --- Reset visual state from previous game before starting a new one ---
        gameContainer.classList.remove('single-mode');
        outerWrapper.classList.remove('centered'); // Reset centering
        for (let i = 0; i < 3; i++) {
            const wrapper = canvases[i].parentElement;
            wrapper.style.display = 'block'; // Ensure all layers are visible initially
            wrapper.classList.remove('active', 'inactive-left', 'inactive-right');
        }
        // --- End of reset logic ---

        gameMode = mode;

        // Default to layer mode settings (for 'layer' and 'spectate' modes)
        numLayers = 3;
        activeLayerIndex = 1;

        // Apply single-mode specific settings
        if (gameMode === 'single') {
            numLayers = 1;
            activeLayerIndex = 0;
            gameContainer.classList.add('single-mode');
        } else {
            // For 'layer' and 'spectate' modes, center the game container
            outerWrapper.classList.add('centered');
        }

        // Reset game state
        boards = Array.from({ length: numLayers }, () => createEmptyBoard());

        score = 0;
        lines = 0;
        level = 0;
        gameOver = false;
        gameIsRunning = true;
        isPaused = false;
        lastTime = performance.now();
        dropCounter = 0;
        heldPieceTypeId = null;
        canHold = true;

        // NEW: Reset gamepad state
        gamepadState = { lastButtons: {}, cooldowns: {}, lastAxes: [] };

        // NEW: Reset menu state
        menuState.current = 'none';

        // NEW: Reset random garbage timer
        randomGarbageTimer = 0;
        // Set the first random garbage event time (e.g., 15-30 seconds from now)
        nextRandomGarbageTime = 15000 + Math.random() * 15000;
        echoes = []; // Clear echoes on new game
        animations = []; // Clear animations on new game

        // Reset UI
        titleScreen.classList.add('hidden');
        titleScreen.classList.remove('game-over');
        finalScoreElement.innerText = '';
        titleMainText.innerText = 'CYBER LAYER TETRIS';
        updateScore();
        updateLayerSpeedDisplay();
        updateControlsDisplay();
        updateMenuHighlight(); // Clear menu highlights

        // Start game logic
        if (gameMode === 'spectate') {
            window.aiAPI.enableAI();
        } else {
            // Ensure AI is off for player-controlled modes at the start
            window.aiAPI.disableAI();
        }

        // Start or resume BGM playback
        if (bgmPlayer.src) {
            if (bgmPlaylist.length > 0) {
                // If playlist exists and music is paused, play next track
                if (bgmPlayer.paused) playNextTrack();
            } else {
                bgmPlayer.currentTime = 0; // Restart single track from the beginning
                bgmPlayer.play().catch(e => console.error("Error playing BGM:", e));
            }
        }

        nextTetromino = createTetromino();
        playerReset();
        requestAnimationFrame(update);
    }

    function endGame(isSurrender = false) {
        gameOver = true;
        gameIsRunning = false;
        isPaused = false; // Ensure pause state is reset
        pauseMenu.classList.add('hidden'); // Ensure pause menu is hidden

        // Clear all canvases to prevent old game state from showing on the title screen
        contexts.forEach(ctx => {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        });
        nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        holdContext.clearRect(0, 0, holdCanvas.width, holdCanvas.height);

        // NEW: Remove centering when returning to the title screen
        if (outerWrapper) {
            outerWrapper.classList.remove('centered');
        }

        if (isSurrender) {
            // Just go back to title without the "Game Over" text
            titleScreen.classList.remove('game-over');
            titleMainText.innerText = 'CYBER LAYER TETRIS';
            finalScoreElement.innerText = '';
        } else {
            // Actual game over
            titleScreen.classList.add('game-over');
            titleMainText.innerText = "GAME OVER";
            finalScoreElement.innerText = `FINAL SCORE: ${score}`;
        }
        titleScreen.classList.remove('hidden');
        // When the game ends, disable the AI if it was running
        if (window.aiAPI && window.aiAPI.isEnabled()) {
            window.aiAPI.disableAI();
        }

        menuState.current = 'title';
        menuState.selectedIndex = 0;
        updateMenuHighlight();

        // Pause BGM when returning to title screen
        if (bgmPlayer) {
            bgmPlayer.pause();
        }
    }
    
    // --- AI Interface ---
    // Expose functions and state for the AI to use.
    window.gameAPI = {
        getState: () => ({
            boards: JSON.parse(JSON.stringify(boards)), // Deep copy to prevent mutation
            player: JSON.parse(JSON.stringify(player)),
            nextTetromino: JSON.parse(JSON.stringify(nextTetromino)),
            echoes: JSON.parse(JSON.stringify(echoes)),
            heldPieceTypeId: heldPieceTypeId,
            canHold: canHold,
            activeLayerIndex,
            rows: ROWS,
            cols: COLS,
        }),
        // Provide a safe way for the AI to check for collisions
        isGameRunning: () => gameIsRunning,
        checkCollision: (board, piece) => {
            return collide(board, piece);
        },
        // AI actions
        move: (dir) => playerMove(dir),
        rotate: () => playerRotate(),
        hardDrop: () => playerHardDrop(),
        switchLayer: (dir) => switchLayer(dir),
        hold: () => holdPiece(),
    };

    // Add event listener to the start button
    startSingleButton.addEventListener('click', () => startGame('single'));
    startLayerButton.addEventListener('click', () => startGame('layer'));
    startSpectateButton.addEventListener('click', () => startGame('spectate'));

    bgmFileButton.addEventListener('click', () => bgmUpload.click());
    bgmFolderButton.addEventListener('click', () => bgmFolderUpload.click());
    bgmUpload.addEventListener('change', handleBgmUpload);
    bgmFolderUpload.addEventListener('change', handleBgmFolderUpload);

    resumeButton.addEventListener('click', togglePause);
    backToMenuButton.addEventListener('click', () => {
        // Return to title without the "Game Over" screen
        endGame(true);
    });

    // --- Volume Control ---
    function handleBgmVolumeChange(event) {
        bgmPlayer.volume = event.target.value;
    }

    function handleSeVolumeChange(event) {
        const newVolume = event.target.value;
        soundEffects.forEach(se => {
            if (se) se.volume = newVolume;
        });
    }

    bgmVolumeSlider.addEventListener('input', handleBgmVolumeChange);
    seVolumeSlider.addEventListener('input', handleSeVolumeChange);

    // Play next track when the current one ends in playlist mode
    bgmPlayer.addEventListener('ended', () => {
        // Only auto-play next track if loop is specifically disabled (which it isn't in playlist mode anymore)
        if (bgmPlaylist.length > 0 && !bgmPlayer.loop) {
            playNextTrack();
        }
    });

    // NEW: Setup menu controls for mouse hover to sync with controller selection
    function setupMenuControls() {
        const allButtonGroups = [
            { buttons: titleButtons, menu: 'title' },
            { buttons: pauseButtons, menu: 'pause' }
        ];

        allButtonGroups.forEach(group => {
            group.buttons.forEach((btn, index) => {
                btn.addEventListener('mouseenter', () => {
                    if (menuState.current === group.menu) {
                        menuState.selectedIndex = index;
                        updateMenuHighlight();
                    }
                });
            });
        });
    }

    // --- Initial Setup ---
    function resizeVisualizer() {
        visualizerCanvas.width = window.innerWidth;
        visualizerCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeVisualizer);
    resizeVisualizer(); // Set initial size

    function setInitialVolumes() {
        bgmPlayer.volume = bgmVolumeSlider.value;
        soundEffects.forEach(se => {
            if (se) se.volume = seVolumeSlider.value;
        });
    }
    setInitialVolumes();
    setupMenuControls();

    // Initialize AudioContext once the BGM actually starts playing.
    bgmPlayer.onplay = () => {
        initAudioContext();
    };

    // Set initial menu highlight on the title screen
    updateMenuHighlight();
});
