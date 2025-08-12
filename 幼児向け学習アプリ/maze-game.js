// maze-game.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const canvas = document.getElementById('maze-canvas');
    const ctx = canvas.getContext('2d');
    const mazeWrapper = document.getElementById('maze-wrapper');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const timeCountSpan = document.getElementById('time-count');
    const dPad = document.getElementById('d-pad');
    const winModal = document.getElementById('win-modal');
    const winTimeSpan = document.getElementById('win-time');
    const winPointsSpan = document.getElementById('win-points');
    const playAgainBtn = document.getElementById('play-again-btn');

    // --- Game State ---
    let maze, player, goal;
    let size = 11; // Default difficulty (must be an odd number)
    let cellSize;
    let gameOver = false;
    let timer;
    let seconds = 0;
    let playerImage = new Image();
    let playerImageLoaded = false;
    let isAnimatingWin = false; // New state for win animation
    let winAnimationStartTime = 0; // New state for win animation
    let playerPath = []; // プレイヤーの軌跡を保存する配列

    // --- Audio Files ---
    const AUDIO_MOVE = 'assets/sounds/walk.mp3';
    const AUDIO_WIN = 'assets/sounds/win.mp3';

    /**
     * --- Image Loading ---
     */
    playerImage.src = 'assets/images/boy-stop.png'; // 横断歩道ゲームの男の子の画像
    playerImage.onload = () => {
        playerImageLoaded = true;
        if (!gameOver) {
            draw(); // 画像が読み込めたら再描画
        }
    };

    /**
     * Checks if the current device is a touch device.
     * @returns {boolean} True if it's a touch device, false otherwise.
     */
    const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    /**
     * Generates a maze using the Recursive Backtracker algorithm.
     * @param {number} width - The width of the maze (must be odd).
     * @param {number} height - The height of the maze (must be odd).
     * @returns {Array<Array<number>>} A 2D array representing the maze (0: path, 1: wall).
     */
    function generateMaze(width, height) {
        const maze = Array.from({ length: height }, () => Array(width).fill(1));
        const stack = [];
        const startX = 1, startY = 1;

        maze[startY][startX] = 0;
        stack.push([startX, startY]);

        while (stack.length > 0) {
            const [cx, cy] = stack[stack.length - 1];
            const neighbors = [];

            // Check neighbors (2 cells away)
            [[0, -2], [0, 2], [-2, 0], [2, 0]].forEach(([dx, dy]) => {
                const nx = cx + dx;
                const ny = cy + dy;
                if (ny >= 1 && ny < height - 1 && nx >= 1 && nx < width - 1 && maze[ny][nx] === 1) {
                    neighbors.push([nx, ny]);
                }
            });

            if (neighbors.length > 0) {
                const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)];
                maze[ny][nx] = 0;
                maze[cy + (ny - cy) / 2][cx + (nx - cx) / 2] = 0; // Carve path
                stack.push([nx, ny]);
            } else {
                stack.pop();
            }
        }
        return maze;
    }

    /**
     * Draws the entire game scene on the canvas.
     */
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPlayerPath(); // 軌跡を先に描画
        drawMaze(); // 壁を次に描画
        drawGoal();
        drawPlayer();
    }

    /**
     * Draws the maze walls.
     */
    function drawMaze() {
        ctx.fillStyle = '#a1887f'; // やさしい茶色
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (maze[y][x] === 1) {
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }
    }

    /**
     * Draws the player's trail.
     */
    function drawPlayerPath() {
        ctx.fillStyle = '#f8bbd0'; // 薄いピンク色
        playerPath.forEach(pos => {
            ctx.fillRect(pos.x * cellSize, pos.y * cellSize, cellSize, cellSize);
        });
    }

    /**
     * Draws the player character.
     */
    function drawPlayer() {
        let yPos = player.y * cellSize;

        // If the win animation is running, calculate the new Y position
        if (isAnimatingWin) {
            const elapsedTime = performance.now() - winAnimationStartTime;
            const jumpHeight = cellSize * 0.4; // Jump 40% of the cell height
            const jumpSpeed = 0.004; // Controls the speed of the jump
            const yOffset = -Math.abs(Math.sin(elapsedTime * jumpSpeed) * jumpHeight);
            yPos += yOffset;
        }

        if (playerImageLoaded) {
            // 画像が読み込めたら、画像を描画
            ctx.drawImage(playerImage, player.x * cellSize, yPos, cellSize, cellSize);
        } else {
            // 読み込めなかった場合は、これまで通り赤い丸を描画
            ctx.fillStyle = '#d90429';
            ctx.beginPath();
            ctx.arc( player.x * cellSize + cellSize / 2, yPos + cellSize / 2, // Use animated position
                cellSize / 2.5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    /**
     * Draws the goal marker.
     */
    function drawGoal() {
        ctx.fillStyle = '#ec407a'; // Pink to match UI
        ctx.beginPath();
        // Star shape
        const inset = 0.5;
        ctx.save();
        ctx.translate(goal.x * cellSize + cellSize / 2, goal.y * cellSize + cellSize / 2);
        ctx.moveTo(0, 0 - cellSize / 2.5);
        for (let i = 0; i < 5; i++) {
            ctx.rotate(Math.PI / 5);
            ctx.lineTo(0, 0 - (cellSize / 2.5 * inset));
            ctx.rotate(Math.PI / 5);
            ctx.lineTo(0, 0 - cellSize / 2.5);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    /**
     * Moves the player if the destination is not a wall.
     * @param {number} dx - The change in the x-coordinate.
     * @param {number} dy - The change in the y-coordinate.
     */
    function movePlayer(dx, dy) {
        if (gameOver || isAnimatingWin) return; // Prevent movement during win animation

        const newX = player.x + dx;
        const newY = player.y + dy;

        if (newX >= 0 && newX < size && newY >= 0 && newY < size && maze[newY][newX] === 0) {
            player.x = newX;
            player.y = newY;
            playerPath.push({ x: player.x, y: player.y }); // 新しい位置を軌跡に追加
            playSE(AUDIO_MOVE);
            draw();
            checkWin();
        }
    }

    /**
     * Checks if the player has reached the goal.
     */
    function checkWin() {
        if (player.x === goal.x && player.y === goal.y) {
            winGame();
        }
    }

    /**
     * Handles the win condition by starting an animation.
     */
    function winGame() {
        gameOver = true;
        stopTimer();
        playSE(AUDIO_WIN);

        winAnimationStartTime = performance.now();
        isAnimatingWin = true;
        requestAnimationFrame(winAnimationLoop);
    }

    /**
     * The main animation loop for the win sequence.
     * @param {number} timestamp - The current time provided by requestAnimationFrame.
     */
    function winAnimationLoop(timestamp) {
        if (!isAnimatingWin) return;

        draw(); // Redraw the scene with the player at the new animated position

        const elapsedTime = timestamp - winAnimationStartTime;
        if (elapsedTime > 1500) { // Animate for 1.5 seconds
            isAnimatingWin = false;

            // Show the win modal after the animation is complete
            const timePenalty = Math.floor(seconds / (size / 2));
            const points = Math.max(1, Math.floor(size / 2) - timePenalty);
            addPoints(points);
            winTimeSpan.textContent = formatTime(seconds);
            winPointsSpan.textContent = points;
            winModal.classList.remove('hidden');
        } else {
            requestAnimationFrame(winAnimationLoop);
        }
    }

    /**
     * Starts the game timer.
     */
    function startTimer() {
        seconds = 0;
        timeCountSpan.textContent = formatTime(seconds);
        if (timer) clearInterval(timer);
        timer = setInterval(() => {
            seconds++;
            timeCountSpan.textContent = formatTime(seconds);
        }, 1000);
    }

    /**
     * Stops the game timer.
     */
    function stopTimer() {
        clearInterval(timer);
    }

    /**
     * Formats seconds into MM:SS format.
     * @param {number} sec - The total seconds.
     * @returns {string} The formatted time string.
     */
    function formatTime(sec) {
        const minutes = Math.floor(sec / 60).toString().padStart(2, '0');
        const seconds = (sec % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    /**
     * Sets up the canvas size and calculates cell size.
     */
    function setupCanvas() {
        const wrapperSize = mazeWrapper.clientWidth;
        canvas.width = wrapperSize;
        canvas.height = wrapperSize;
        cellSize = canvas.width / size;
    }

    /**
     * Starts a new game.
     */
    function startGame() {
        gameOver = false;
        winModal.classList.add('hidden');
        maze = generateMaze(size, size);
        player = { x: 1, y: 1 };
        goal = { x: size - 2, y: size - 2 };
        playerPath = [{ x: player.x, y: player.y }]; // 軌跡をリセットして開始位置を追加

        setupCanvas();
        draw();
        startTimer();

        // BGM
        const bgm = document.getElementById('bgm');
        if (bgm && bgm.paused) {
            bgm.play().catch(e => console.error("BGMの再生に失敗しました:", e));
        }
    }

    /**
     * Sets up all event listeners for the game.
     */
    function setupEventListeners() {
        // Difficulty selection
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                difficultyButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                size = parseInt(button.dataset.size, 10);
                startGame();
            });
        });

        // Play again
        playAgainBtn.addEventListener('click', startGame);

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp': case 'w': movePlayer(0, -1); break;
                case 'ArrowDown': case 's': movePlayer(0, 1); break;
                case 'ArrowLeft': case 'a': movePlayer(-1, 0); break;
                case 'ArrowRight': case 'd': movePlayer(1, 0); break;
            }
        });

        // D-pad controls for touch devices
        if (isTouchDevice()) {
            dPad.classList.remove('hidden');

            // 方向キーのテキストを矢印アイコンに変更
            document.getElementById('d-pad-up').innerHTML = '↑';
            document.getElementById('d-pad-down').innerHTML = '↓';
            document.getElementById('d-pad-left').innerHTML = '←';
            document.getElementById('d-pad-right').innerHTML = '→';

            document.getElementById('d-pad-up').addEventListener('click', () => movePlayer(0, -1));
            document.getElementById('d-pad-down').addEventListener('click', () => movePlayer(0, 1));
            document.getElementById('d-pad-left').addEventListener('click', () => movePlayer(-1, 0));
            document.getElementById('d-pad-right').addEventListener('click', () => movePlayer(1, 0));
        }

        // Resize listener
        window.addEventListener('resize', () => {
            if (!gameOver) {
                setupCanvas();
                draw();
            }
        });
    }

    // --- Initial Load ---
    preloadAudioSources([AUDIO_MOVE, AUDIO_WIN]);
    setupEventListeners();
    startGame();
});