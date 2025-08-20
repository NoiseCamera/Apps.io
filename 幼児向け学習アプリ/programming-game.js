// programming-game.js - Part 1/5

document.addEventListener('DOMContentLoaded', () => {
    // ダブルタップによるズームを防止
    document.body.style.touchAction = 'manipulation';

    // --- DOM要素の取得 ---
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const programArea = document.getElementById('program-area');
    const commandPalette = document.getElementById('command-palette');
    const runBtn = document.getElementById('run-btn');
    const resetBtn = document.getElementById('reset-btn');
    const trashArea = document.getElementById('trash-area');
    const goalModal = document.getElementById('goal-modal');
    const goalPointsSpan = document.getElementById('goal-points-span');
    const playAgainBtn = document.getElementById('play-again-btn');
    const commandHeader = document.querySelector('.command-section .editor-header'); // 「つかう めいれい」のヘッダー
    const programHeader = document.getElementById('program-header'); // 「プログラム」のヘッダー

    // --- 難易度設定 ---
    const DIFFICULTY_SETTINGS = {
        easy: { size: 5, commands: 10 },
        normal: { size: 7, commands: 15 },
        hard: { size: 11, commands: 25 }
    };
    let currentDifficulty = 'easy';

    // --- ステージデータ (動的に生成) ---
    let STAGE_DATA = [];

    // --- D&Dとタッチ操作の状態 ---
    let draggedElement = null; // ドラッグ/タッチ操作中の要素
    let isDraggingFromPalette = false; // パレットからのドラッグか
    let clone = null; // タッチ操作で使うクローン要素
    let offsetX = 0, offsetY = 0; // タッチ開始位置のオフセット
    let placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    let isOverTrash = false; // タッチ操作中にゴミ箱の上にいるか

    // --- ゲームの定数 ---
    const GRID_SIZE = 100; // 1マスのサイズ(px)
    let STAGE_COLS = DIFFICULTY_SETTINGS[currentDifficulty].size;
    let STAGE_ROWS = DIFFICULTY_SETTINGS[currentDifficulty].size;

    // --- キャラクターの状態 ---
    const character = {
        x: 0, // グリッド上のX座標
        y: 0, // グリッド上のY座標
        startX: 0, // ステージごとのスタート位置
        startY: 0,
        goalX: 0,  // ステージごとのゴール位置
        goalY: 0,
        dir: 1, // 向き (0:右, 1:下, 2:左, 3:上)
        img: new Image(),
        isLoaded: false,
        isMoving: false, // 実行中かどうかを管理
    };
    let bgm; // BGM要素をグローバルで保持

    // --- スケール（ズーム）関連の状態 ---
    const zoom = {
        level: 1.0,
        step: 0.1,
        min: 0.5,
        max: 1.5,
        controlsContainer: null,
        levelDisplay: null,
    };

    /**
     * 繰り返しブロック内のプルダウンリストにイベントを設定する
     * @param {HTMLElement} loopBlock - 設定対象の .loop-block 要素
     */
    function setupLoopBlockEvents(loopBlock) {
        const selector = loopBlock.querySelector('.loop-count-selector');
        if (!selector) return;

        // プルダウンの操作中にドラッグが始まらないようにする
        selector.addEventListener('mousedown', e => e.stopPropagation());
        selector.addEventListener('touchstart', e => e.stopPropagation());

        // プルダウンの値が変更されたら、data-command属性を更新する
        selector.addEventListener('change', (e) => {
            const block = e.target.closest('.loop-block');
            if (block) {
                block.dataset.command = `loop ${e.target.value}`;
            }
        });
    }

    /**
     * プログラムエリアのズームコントロールUIを生成してDOMに追加する
     */
    function createZoomControls() {
        if (!programHeader) return;

        zoom.controlsContainer = document.createElement('div');
        zoom.controlsContainer.id = 'zoom-controls';

        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.id = 'zoom-out-btn';
        zoomOutBtn.textContent = '－';
        zoomOutBtn.title = 'しゅくしょう';
        zoomOutBtn.classList.add('zoom-btn');
        zoomOutBtn.addEventListener('click', () => handleZoom(-zoom.step));

        zoom.levelDisplay = document.createElement('span');
        zoom.levelDisplay.id = 'zoom-level-display';

        const zoomInBtn = document.createElement('button');
        zoomInBtn.id = 'zoom-in-btn';
        zoomInBtn.textContent = '＋';
        zoomInBtn.title = 'かくだい';
        zoomInBtn.classList.add('zoom-btn');
        zoomInBtn.addEventListener('click', () => handleZoom(zoom.step));

        zoom.controlsContainer.appendChild(zoomOutBtn);
        zoom.controlsContainer.appendChild(zoom.levelDisplay);
        zoom.controlsContainer.appendChild(zoomInBtn);

        programHeader.appendChild(zoom.controlsContainer);
        // 初期表示を更新
        updateZoomDisplay();
    }

    /** ズームの表示を更新する */
    function updateZoomDisplay() {
        programArea.style.transform = `scale(${zoom.level})`;
        zoom.levelDisplay.textContent = `${Math.round(zoom.level * 100)}%`;
    }
    /**
     * 初期化処理
     */
    function init() {
        // ゴミ箱を「プログラム」ヘッダーの右端に移動させます。
        // これにより、ズームコントロールとゴミ箱が同じエリアにまとまります。
        if (commandHeader) {
            commandHeader.appendChild(trashArea);
        }

        // ズームコントロールUIを生成
        createZoomControls();

        // このゲーム専用のBGMに設定
        bgm = document.getElementById('bgm');
        if (bgm) {
            const newBgmSrc = 'assets/sounds/bgm6.mp3'; // 存在するBGMファイルに変更
            // 現在のBGMソースと異なる場合のみ変更する
            if (!bgm.src.endsWith(newBgmSrc)) {
                bgm.src = newBgmSrc;
                // 新しいソースを読み込む
                bgm.load();
            }
        }

        // キャラクター画像の読み込み
        character.img.src = 'assets/images/boy-stop.png';
        character.img.onload = () => {
            character.isLoaded = true;
            resetCharacter(); // 画像読み込み後に初期描画
        };

        // ボタンにイベントリスナーを設定
        runBtn.addEventListener('click', handleRunClick);
        runBtn.classList.add('colorful-btn');
        resetBtn.addEventListener('click', resetCharacter);
        resetBtn.classList.add('colorful-btn');
        playAgainBtn.addEventListener('click', () => {
            goalModal.classList.add('hidden');
            resetCharacter();
            // ボタンの状態をリセット
            character.isMoving = false;
            runBtn.disabled = false;
            resetBtn.disabled = false;
        });
        playAgainBtn.classList.add('colorful-btn');

        // 難易度選択ボタンのイベントリスナー
        const difficultyButtons = document.querySelectorAll('#difficulty-selector .difficulty-btn');
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (character.isMoving) return; // 実行中は変更不可
                currentDifficulty = button.dataset.difficulty;

                difficultyButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                resetCharacter(); // 難易度を適用してリセット
            });
        });
        // コマンドパレットの各ボタンにイベントを設定
        commandPalette.querySelectorAll('.command-block').forEach(button => {
            button.draggable = true;
            button.addEventListener('dragstart', handleDragStart);
            button.addEventListener('dragend', handleDragEnd);
            // 繰り返しブロックの場合は、中の要素にもイベントリスナーを設定
            if (button.classList.contains('loop-block')) {
                const loopBody = button.querySelector('.loop-body');
                if (loopBody) {
                    loopBody.addEventListener('dragover', handleDragOver);
                    loopBody.addEventListener('drop', handleDrop);
                }
                // ★追加: 繰り返しブロックのプルダウンにイベントを設定
                setupLoopBlockEvents(button);
            }
            button.addEventListener('touchstart', handleTouchStart, { passive: false });
        });

        // プログラムエリアのイベント
        programArea.addEventListener('dragover', handleDragOver);
        programArea.addEventListener('drop', handleDrop);
        // エリア内の要素をドラッグ可能にするため、イベント委譲を使用
        programArea.addEventListener('dragstart', handleDragStart);
        programArea.addEventListener('dragend', handleDragEnd);
        programArea.addEventListener('touchstart', handleTouchStart, { passive: false });

        // ゴミ箱エリアのイベント
        trashArea.addEventListener('dragover', handleDragOver);
        trashArea.addEventListener('drop', handleDropOnTrash);

        // タッチ操作のグローバルイベント
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        // ★追加: ピンチイン・アウトによるズーム機能のイベントを設定
        setupPinchZoomEvents();
    }
// programming-game.js - Part 2/5
    
    /**
     * 10手以内でクリア可能な迷路を生成し、ステージとして設定する
     */
    function generateAndSetSolvableMaze() {
        let maze, path, endPos;
        const settings = DIFFICULTY_SETTINGS[currentDifficulty];
        const MAZE_SIZE = settings.size;
        const MAX_COMMANDS = settings.commands;

        // キャンバスサイズを迷路サイズに合わせて更新
        canvas.width = MAZE_SIZE * GRID_SIZE;
        canvas.height = MAZE_SIZE * GRID_SIZE;
        STAGE_COLS = MAZE_SIZE;
        STAGE_ROWS = MAZE_SIZE;

        const startPos = { x: 1, y: 1 };

        // 条件に合う迷路とゴールが見つかるまで繰り返す
        while (true) {
            maze = generateMaze(MAZE_SIZE, MAZE_SIZE);
            maze[startPos.y][startPos.x] = 0; // スタート地点は必ず通路

            const deadEnds = findDeadEnds(maze);
            // スタート地点と異なる行き止まりをゴール候補とする
            const potentialGoals = deadEnds.filter(p => p.x !== startPos.x || p.y !== startPos.y);

            if (potentialGoals.length === 0) {
                continue; // 適切なゴール候補がなければ再生成
            }

            // ゴール候補をシャッフルして、条件に合うものを探す
            const shuffledGoals = potentialGoals.sort(() => 0.5 - Math.random());

            let foundPath = false;
            for (const goal of shuffledGoals) {
                const p = findShortestPath(maze, startPos, goal);
                // パスが存在し、かつコマンド数上限以内であれば採用
                if (p && (p.length - 1) <= MAX_COMMANDS) {
                    path = p;
                    endPos = goal;
                    foundPath = true;
                    break;
                }
            }

            if (foundPath) {
                break; // 適切な迷路とゴールが見つかったのでループを抜ける
            }
            // どのゴール候補も条件に合わなければ、迷路を再生成
        }

        // スタートとゴールをステージデータに書き込む
        maze[startPos.y][startPos.x] = 2; // 2: スタート
        maze[endPos.y][endPos.x] = 3;     // 3: ゴール

        // グローバルなステージデータを更新
        STAGE_DATA = maze;
        character.startX = startPos.x;
        character.startY = startPos.y;
        character.goalX = endPos.x;
        character.goalY = endPos.y;
    }

    /**
     * 穴掘り法でランダムな迷路を生成する
     * @param {number} width - 幅 (奇数)
     * @param {number} height - 高さ (奇数)
     * @returns {Array<Array<number>>} 生成された迷路データ
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

            [[0, -2], [0, 2], [-2, 0], [2, 0]].forEach(([dx, dy]) => {
                const nx = cx + dx, ny = cy + dy;
                if (ny >= 1 && ny < height - 1 && nx >= 1 && nx < width - 1 && maze[ny][nx] === 1) {
                    neighbors.push([nx, ny]);
                }
            });

            if (neighbors.length > 0) {
                const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)];
                maze[ny][nx] = 0;
                maze[cy + (ny - cy) / 2][cx + (nx - cx) / 2] = 0;
                stack.push([nx, ny]);
            } else {
                stack.pop();
            }
        }
        return maze;
    }

    /**
     * 迷路内の行き止まりのセルをすべて見つける
     * 行き止まりとは、通路に隣接する通路が1つしかないセルのこと
     * @param {Array<Array<number>>} maze - 迷路データ
     * @returns {Array<{x: number, y: number}>} 行き止まりの座標の配列
     */
    function findDeadEnds(maze) {
        const deadEnds = [];
        const rows = maze.length;
        const cols = maze[0].length;

        for (let y = 1; y < rows - 1; y++) {
            for (let x = 1; x < cols - 1; x++) {
                // 通路(0)であるセルのみをチェック
                if (maze[y][x] === 0) {
                    let pathCount = 0;
                    // 上下左右の隣接セルをチェック
                    if (maze[y - 1][x] === 0) pathCount++; // 上
                    if (maze[y + 1][x] === 0) pathCount++; // 下
                    if (maze[y][x - 1] === 0) pathCount++; // 左
                    if (maze[y][x + 1] === 0) pathCount++; // 右

                    if (pathCount === 1) {
                        deadEnds.push({ x, y });
                    }
                }
            }
        }
        return deadEnds;
    }

    /**
     * キャラクターとプログラムエリアをリセットする
     */
    function resetCharacter() {
        // 実行中ならリセットしない
        if (character.isMoving) return;

        // 難易度設定を適用
        const settings = DIFFICULTY_SETTINGS[currentDifficulty];
        STAGE_COLS = settings.size;
        STAGE_ROWS = settings.size;

        // 新しい迷路を生成して設定
        generateAndSetSolvableMaze();

        // スタート位置に配置
        character.x = character.startX;
        character.y = character.startY;
        character.dir = 1; // 下向きにリセット
        programArea.innerHTML = ''; // プログラムエリアをクリア
        updateSlots(); // スロットを再生成
        drawCharacter();

        // BGMの再生を開始（ユーザーの操作後に成功する）
        const bgm = document.getElementById('bgm');
        if (bgm && bgm.paused) {
            // ユーザーの操作後に再生が許可される
            bgm.play().catch(e => console.error("BGMの再生に失敗しました:", e));
        }
    }

    /**
     * プログラムエリアのスロットを更新する
     * Scratchのように、コンテナが空の場合にのみドロップ先を示すスロットを1つ表示します
     */
    function updateSlots() {
        const manageContainer = (container) => {
            const hasBlocks = container.querySelector(':scope > .command-block');
            const hasSlot = container.querySelector(':scope > .program-slot');

            // ブロックがなく、スロットもない場合、スロットを1つ追加
            if (!hasBlocks && !hasSlot) {
                const slot = document.createElement('div');
                slot.className = 'program-slot';
                container.appendChild(slot);
            } else if (hasBlocks && hasSlot) {
                // ブロックがある場合、スロットをすべて削除
                container.querySelectorAll(':scope > .program-slot').forEach(slot => slot.remove());
            }
        };

        // メインのプログラムエリアと、すべての繰り返しブロックの中身を管理
        manageContainer(programArea);
        document.querySelectorAll('#program-area .loop-body').forEach(manageContainer);
    }


    /**
     * キャラクターを描画する
     */
    function drawCharacter() {
        if (!character.isLoaded) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawStage();
        ctx.drawImage(
            character.img,
            character.x * GRID_SIZE,
            character.y * GRID_SIZE,
            GRID_SIZE,
            GRID_SIZE
        );
    }

    /**
     * ステージ（壁、通路、ゴール）を描画する
     */
    function drawStage() {
        for (let y = 0; y < STAGE_ROWS; y++) {
            for (let x = 0; x < STAGE_COLS; x++) {
                const tile = STAGE_DATA[y][x];
                const px = x * GRID_SIZE;
                const py = y * GRID_SIZE;

                if (tile === 1) { // 壁
                    ctx.fillStyle = '#8d6e63'; // 壁の色
                    ctx.fillRect(px, py, GRID_SIZE, GRID_SIZE);
                } else { // 通路、スタート、ゴールはすべて同じ背景色
                    ctx.fillStyle = '#aed581'; // 通路の色
                    ctx.fillRect(px, py, GRID_SIZE, GRID_SIZE);

                    if (tile === 3) { // ゴールの場合、★を上書き
                        ctx.fillStyle = '#ffb300';
                        ctx.font = `${GRID_SIZE * 0.9}px sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('★', px + GRID_SIZE / 2, py + GRID_SIZE / 2 + 5);
                    }
                }
            }
        }
        drawGridLines(); // グリッド線を描画
    }

    /**
     * ステージにグリッド線を描画する
     */
    function drawGridLines() {
        ctx.strokeStyle = '#9ccc65'; // 通路より少し濃い緑
        ctx.lineWidth = 1;
        for (let i = 0; i < STAGE_COLS; i++) {
            ctx.beginPath();
            ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, canvas.height); ctx.stroke();
        }
        for (let i = 0; i < STAGE_ROWS; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * GRID_SIZE); ctx.lineTo(canvas.width, i * GRID_SIZE); ctx.stroke();
        }
    }

    /**
     * 指定されたミリ秒だけ処理を待機する
     * @param {number} ms - 待機する時間（ミリ秒）
     * @returns {Promise<void>}
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 「じっこう」ボタンがクリックされたときの処理
     */
    async function handleRunClick() {
        if (character.isMoving) return;
        character.isMoving = true;
        runBtn.disabled = true;
        resetBtn.disabled = true;

        // 実行前にキャラクターをスタート位置に戻す
        character.x = character.startX;
        character.y = character.startY;
        character.dir = 1; // 下向きにリセット
        drawCharacter(); // スタート位置に再描画
        // ユーザーが位置リセットを認識できるよう、少し待機
        await sleep(200);
 
        try {
            const commands = buildCommandsFromDOM(programArea);
            await executeCommands(commands);
        } catch (error) {
            console.error("プログラムの実行中にエラーが発生しました:", error);
            alert("プログラムの実行中にエラーがおきました。");
        } finally {
            // 実行中のハイライトをすべてクリア
            document.querySelectorAll('.is-executing').forEach(el => {
                el.classList.remove('is-executing');
            });

            // ゴールモーダルが表示されている場合は、ボタンを無効のままにする
            if (goalModal.classList.contains('hidden')) {
                character.isMoving = false;
                runBtn.disabled = false;
                resetBtn.disabled = false;
            }
        }
    }

    /**
     * 命令のリストを順番に実行する
     * @param {Array} commands - 実行する命令オブジェクトの配列
     */
    async function executeCommands(commands) {
        // ゴールなどで実行が中断されたかチェック
        if (!character.isMoving) return;

        for (const command of commands) {            
            const el = command.element;
            if (el) el.classList.add('is-executing');

            // 繰り返しコマンドの処理
            if (command.type === 'loop') {
                const header = el.querySelector('.loop-header');
                if (header) header.classList.add('is-executing');
                for (let i = 0; i < command.count; i++) {
                    await executeCommands(command.commands);
                    if (!character.isMoving) return; // 中の処理でゴールした場合
                }
                if (header) header.classList.remove('is-executing');
                // finallyでis-executingが外されるのでここでは不要
                if (el) el.classList.remove('is-executing');
                continue; // ループコマンド自体の移動処理は不要
            }

            try {
            let targetX = character.x;
            let targetY = character.y;

            switch (command.type) {
                case 'move_up':
                    targetY -= command.steps;
                    break;
                case 'move_down':
                    targetY += command.steps;
                    break;
                case 'move_left':
                    targetX -= command.steps;
                    break;
                case 'move_right':
                    targetX += command.steps;
                    break;
            }

            // 画面外または壁でないかチェック
            if (targetX < 0 || targetX >= STAGE_COLS || targetY < 0 || targetY >= STAGE_ROWS || STAGE_DATA[targetY][targetX] === 1) {
                console.warn('壁または画面外には進めません。');
                // この命令はスキップして次に進む
                if (typeof playSE === 'function') {
                    playSE('assets/sounds/incorrect.mp3'); // 壁にぶつかる音
                }
                await sleep(300);
                continue; // finallyブロックが実行される
            }

            character.x = targetX;
            character.y = targetY;

            drawCharacter();
            await sleep(1000); // 1つの命令ごとに1秒待つ

            // ゴールしたかチェック
            if (character.x === character.goalX && character.y === character.goalY) {
                await handleGoal();
                return; // ゴールしたらプログラムの実行を終了
            }
            } finally {
                // 実行が終わったらハイライトを解除
                if (el) el.classList.remove('is-executing');
                if (!character.isMoving) break; // ゴールしたらループを抜ける
            }
        }
    }

    /**
     * ズームレベルを更新する
     * @param {number} change - ズームレベルの変化量 (+0.1 or -0.1)
     */
    function handleZoom(change) {
        let newLevel = zoom.level + change;
        // 上限・下限を設定
        newLevel = Math.max(zoom.min, Math.min(zoom.max, newLevel));
        // 浮動小数点数の誤差を丸める
        newLevel = Math.round(newLevel * 10) / 10;

        if (newLevel !== zoom.level) {
            zoom.level = newLevel;
            updateZoomDisplay();
        }
    }
    /**
     * ゴールに到達したときの処理
     */
    async function handleGoal() {
        character.isMoving = true; // アニメーション中は操作不可

        // SEを鳴らしつつ、ジャンプアニメーションを開始
        if (typeof playSE === 'function') playSE('assets/sounds/kirakira.mp3');
        await animateGoalJump(3); // 3回ジャンプ

        const points = 10; // 固定で10ポイント
        if (typeof addPoints === 'function') addPoints(points);

        // モーダルにポイントを表示
        goalPointsSpan.textContent = points;
        // モーダルを表示
        goalModal.classList.remove('hidden');
    }

    /**
     * ゴール時にキャラクターが指定回数ジャンプするアニメーション
     * @param {number} count - ジャンプする回数
     */
    function animateGoalJump(count) {
        return new Promise(async (resolve) => {
            for (let i = 0; i < count; i++) {
                await singleJump();
                if (i < count - 1) {
                    await sleep(50); // ジャンプの間に少し待つ
                }
            }
            resolve();
        });
    }

    /**
     * 1回ジャンプするアニメーションのPromiseを返す
     */
    function singleJump() {
        return new Promise(resolve => {
            const jumpHeight = GRID_SIZE * 0.5; // グリッドの半分くらいの高さまでジャンプ
            const duration = 700; // 0.7秒でジャンプ
            let startTime = null;

            function animationStep(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsedTime = timestamp - startTime;
                const progress = Math.min(elapsedTime / duration, 1);

                // sinカーブを使って上下運動を表現
                const yOffset = -Math.abs(Math.sin(progress * Math.PI) * jumpHeight);

                drawStage(); // 背景を再描画
                ctx.drawImage(character.img, character.x * GRID_SIZE, character.y * GRID_SIZE + yOffset, GRID_SIZE, GRID_SIZE);

                if (progress < 1) { requestAnimationFrame(animationStep); }
                else { drawCharacter(); resolve(); }
            }
            requestAnimationFrame(animationStep);
        });
    }

    /**
     * 幅優先探索(BFS)で最短経路を見つける
     * @param {Array<Array<number>>} maze - 迷路データ
     * @param {{x: number, y: number}} start - スタート座標
     * @param {{x: number, y: number}} end - ゴール座標
     * @returns {Array|null} 座標の配列、またはnull
     */
    function findShortestPath(maze, start, end) {
        const queue = [[start]];
        const visited = new Set([`${start.x},${start.y}`]);
        const rows = maze.length;
        const cols = maze[0].length;

        while (queue.length > 0) {
            const path = queue.shift();
            const { x, y } = path[path.length - 1];

            if (x === end.x && y === end.y) return path;

            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dx, dy] of directions) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && maze[ny][nx] !== 1 && !visited.has(`${nx},${ny}`)) {
                    visited.add(`${nx},${ny}`);
                    const newPath = [...path, { x: nx, y: ny }];
                    queue.push(newPath);
                }
            }
        }
        return null;
    }

    /**
     * ★追加: プログラムエリアのピンチイン・ピンチアウト操作のイベントリスナーを設定する
     */
    function setupPinchZoomEvents() {
        let initialPinchDistance = 0;
        let lastScale = 1.0; // ピンチ開始時のスケールを保存

        // 2本の指の間の距離を計算する関数
        function getDistance(touches) {
            const touch1 = touches[0];
            const touch2 = touches[1];
            return Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
        }

        // タッチが開始された時の処理
        programArea.addEventListener('touchstart', (e) => {
            // 2本指でのタッチの場合のみ処理
            if (e.touches.length === 2) {
                e.preventDefault(); // ブラウザのデフォルトのズームを無効化
                initialPinchDistance = getDistance(e.touches);
                lastScale = zoom.level; // 現在のズームレベルを保存
            }
        }, { passive: false }); // preventDefaultを呼ぶためにpassive: falseが必要

        // 指を動かした時の処理
        programArea.addEventListener('touchmove', (e) => {
            // 2本指でのタッチの場合のみ処理
            if (e.touches.length === 2) {
                e.preventDefault();
                if (initialPinchDistance <= 0) return; // 予期せぬエラーを防ぐ

                const currentPinchDistance = getDistance(e.touches);
                const scaleRatio = currentPinchDistance / initialPinchDistance;

                // ピンチ開始時のスケールに、現在の指の距離の比率を掛けて新しいスケールを計算
                let newScale = lastScale * scaleRatio;

                // スケールが極端に大きくなったり小さくなったりしないように範囲を制限
                newScale = Math.max(zoom.min, Math.min(zoom.max, newScale));

                // 計算したスケールをグローバルなzoomオブジェクトに反映
                zoom.level = newScale;
                
                // 表示を更新
                updateZoomDisplay();
            }
        }, { passive: false });

        // 指が離れた時の処理
        programArea.addEventListener('touchend', (e) => {
            // 2本指の操作が終わったら、距離をリセット
            if (e.touches.length < 2) {
                initialPinchDistance = 0;
            }
        });
    }

// programming-game.js - Part 3/5

    /**
     * プログラムエリアのDOMから命令のリストを構築する
     * @returns {Array} 命令オブジェクトの配列
     */
    function buildCommandsFromDOM(container) {
        const commands = [];
        // containerの直下の子要素である.command-blockのみを取得
        const commandElements = container.querySelectorAll(':scope > .command-block');

        commandElements.forEach(el => {
            const commandStr = el.dataset.command;
            if (!commandStr) return;

            // 繰り返しブロックの場合
            if (commandStr.startsWith('loop')) {
                const loopBody = el.querySelector('.loop-body');
                commands.push({
                    type: 'loop',
                    count: parseInt(commandStr.split(' ')[1], 10),
                    commands: buildCommandsFromDOM(loopBody), // 再帰的に中のコマンドを解析
                    element: el
                });
            } else {
                // 通常のコマンドの場合
                const moveUpMatch = commandStr.match(/うえに\s*(\d+)\s*すすむ/);
                if (moveUpMatch) {
                    commands.push({ type: 'move_up', steps: parseInt(moveUpMatch[1], 10), element: el });
                    return;
                }

                const moveDownMatch = commandStr.match(/したに\s*(\d+)\s*すすむ/);
                if (moveDownMatch) {
                    commands.push({ type: 'move_down', steps: parseInt(moveDownMatch[1], 10), element: el });
                    return;
                }

                const moveLeftMatch = commandStr.match(/ひだりに\s*(\d+)\s*すすむ/);
                if (moveLeftMatch) {
                    commands.push({ type: 'move_left', steps: parseInt(moveLeftMatch[1], 10), element: el });
                    return;
                }

                const moveRightMatch = commandStr.match(/みぎに\s*(\d+)\s*すすむ/);
                if (moveRightMatch) {
                    commands.push({ type: 'move_right', steps: parseInt(moveRightMatch[1], 10), element: el });
                    return;
                }
            }
        });

        return commands;
    }

    // --- Helper function for D&D ---

    /**
     * ドロップ先のコンテナと座標から、プレースホルダーを挿入すべき要素（またはnull）を返す
     * @param {HTMLElement} container - ドロップ先のコンテナ (.program-area or .loop-body)
     * @param {number} x - マウス/タッチのX座標
     * @param {number} y - マウス/タッチのY座標
     * @returns {HTMLElement|null} - プレースホルダーの前に挿入する要素。末尾の場合はnull
     */
    function getDragBeforeElement(container, x, y) {
        // コンテナ内のドラッグ可能な子要素（ドラッグ中の自身は除く）と空のスロットを取得
        const draggableElements = [...container.querySelectorAll(':scope > .command-block:not(.dragging), :scope > .program-slot')];

        // program-area と loop-body の両方を、折り返し可能な横並びとして扱う
        if (container.id === 'program-area' || container.classList.contains('loop-body')) {
            // 横並びで折り返しがある場合、Y座標（行）を優先して判断する必要がある
            const beforeElement = draggableElements.find(child => {
                const box = child.getBoundingClientRect();

                // カーソルが要素の行よりも上にある場合、その要素の前に挿入
                if (y < box.top) {
                    return true;
                }
                // カーソルが要素と同じ行にある場合、X座標で判断
                if (y >= box.top && y <= box.bottom) {
                    const childCenterX = box.left + box.width / 2;
                    return x < childCenterX;
                }
                // カーソルが要素の行より下にある場合は、次の要素をチェック
                return false;
            });
            return beforeElement || null;
        }
        return null; // ここには到達しない想定
    }
    // --- Drag and Drop Event Handlers ---

    /**
     * ドラッグが開始されたときの処理
     * @param {DragEvent} e
     */
    function handleDragStart(e) {
        draggedElement = e.target;
        isDraggingFromPalette = draggedElement.parentElement.id === 'command-palette';

        // ドラッグ中の要素にスタイルを適用
        setTimeout(() => {
            draggedElement.classList.add('dragging');
        }, 0);
    }

    /**
     * ドラッグが終了したときの処理
     * @param {DragEvent} e
     */
    function handleDragEnd(e) {
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
        }
        draggedElement = null;

        // プレースホルダーを削除
        if (placeholder.parentElement) {
            placeholder.remove();
        }
        // ★追加: ゴミ箱のハイライトを解除
        trashArea.classList.remove('hover');
    }

    /**
     * 要素がドロップ可能なエリア上にあるときの処理
     * @param {DragEvent} e
     */
    function handleDragOver(e) {
        e.preventDefault(); // ドロップを許可するために必須

        // ドロップ先がコマンドパレット内なら、プレースホルダーを表示しない
        const isOverPalette = !!e.target.closest('#command-palette');
        if (isOverPalette) {
            if (placeholder.parentElement) placeholder.remove();
            trashArea.classList.remove('hover'); // ゴミ箱のハイライトも消す
            return;
        }

        // ゴミ箱の上にいるかチェックし、hoverクラスをトグル
        const isOverTrashArea = !!e.target.closest('#trash-area');
        trashArea.classList.toggle('hover', isOverTrashArea && !isDraggingFromPalette);

        const dropContainer = e.target.closest('.loop-body, #program-area');
        // ドロップ可能なコンテナがない、またはゴミ箱の上にある場合はプレースホルダーを配置しない
        if (!dropContainer || isOverTrashArea) {
            if (placeholder.parentElement) placeholder.remove();
            return;
        }

        const beforeElement = getDragBeforeElement(dropContainer, e.clientX, e.clientY);

        // プレースホルダーを適切な位置に挿入
        if (beforeElement) {
            dropContainer.insertBefore(placeholder, beforeElement);
        } else {
            dropContainer.appendChild(placeholder);
        }
    }

    /**
     * プログラムエリアにドロップされたときの処理
     * @param {DragEvent} e
     */
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation(); // イベントのバブリングを停止
        if (!placeholder.parentElement) return;

        let newElement;
        if (isDraggingFromPalette) {
            // パレットからならクローンを作成
            newElement = draggedElement.cloneNode(true);
            newElement.draggable = true;
            newElement.addEventListener('dragstart', handleDragStart);
            newElement.addEventListener('dragend', handleDragEnd);
            newElement.addEventListener('touchstart', handleTouchStart, { passive: false });
            // 繰り返しブロックの場合は、中のイベントリスナーを再設定
            if (newElement.classList.contains('loop-block')) {
                const loopBody = newElement.querySelector('.loop-body');
                if (loopBody) {
                    loopBody.addEventListener('dragover', handleDragOver);
                    loopBody.addEventListener('drop', handleDrop);
                }
                // ★追加: クローンした繰り返しブロックにもイベントを設定
                setupLoopBlockEvents(newElement);
            }
            newElement.classList.remove('dragging');
        } else {
            // エリア内移動なら本人
            newElement = draggedElement;
        }

        // ドロップ先がスロットの上か、ブロックの間かを判定して挿入
        const dropTarget = placeholder.nextElementSibling;
        if (dropTarget && dropTarget.classList.contains('program-slot') && dropTarget.parentElement === placeholder.parentElement) {
            // プレースホルダーの直後がスロットの場合、そのスロットを置き換える
            dropTarget.parentElement.replaceChild(newElement, dropTarget);
            placeholder.remove(); // プレースホルダーを別途削除
        } else {
            // それ以外（ブロックの間や末尾）の場合は、プレースホルダーを置き換える
            placeholder.parentElement.replaceChild(newElement, placeholder);
        }

        updateSlots();
    }

    /**
     * ゴミ箱エリアにドロップされたときの処理
     * @param {DragEvent} e
     */
    function handleDropOnTrash(e) {
        e.preventDefault();
        // パレットからのドラッグは削除しない
        if (isDraggingFromPalette) return;

        if (draggedElement) {
            draggedElement.remove();
            updateSlots();
        }
        // ★追加: ゴミ箱のハイライトを解除
        trashArea.classList.remove('hover');
    }
// programming-game.js - Part 4/5

    // --- Touch Event Handlers ---

    /**
     * タッチが開始されたときの処理
     * @param {TouchEvent} e
     */
    function handleTouchStart(e) {
        // ドラッグ中の場合は何もしない
        if (draggedElement) return;

        const target = e.target.closest('.command-block');
        if (!target) return;

        e.preventDefault(); // スクロールを防止

        draggedElement = target;
        isDraggingFromPalette = draggedElement.parentElement.id === 'command-palette';
        isOverTrash = false; // タッチ開始時にリセット

        // パレットからならクローンを作成して追従させる
        clone = draggedElement.cloneNode(true);
        clone.classList.add('dragging', 'touch-clone');
        document.body.appendChild(clone);

        // タッチ位置のオフセットを計算
        const touch = e.touches[0];
        const rect = draggedElement.getBoundingClientRect();
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;

        // クローンの初期位置を設定
        clone.style.left = `${touch.clientX - offsetX}px`;
        clone.style.top = `${touch.clientY - offsetY}px`;

        // 元の要素を半透明にする
        if (!isDraggingFromPalette) {
            draggedElement.classList.add('dragging');
        }
    }

    /**
     * タッチしたまま移動したときの処理
     * @param {TouchEvent} e
     */
    function handleTouchMove(e) {
        if (!draggedElement || !clone) return;

        e.preventDefault(); // スクロールを防止

        const touch = e.touches[0];
        // クローンを指に追従させる
        clone.style.left = `${touch.clientX - offsetX}px`;
        clone.style.top = `${touch.clientY - offsetY}px`;

        clone.style.visibility = 'hidden';
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        clone.style.visibility = 'visible';

        // ドロップ先がコマンドパレット内なら、プレースホルダーを表示しない
        const isOverPalette = elementBelow ? !!elementBelow.closest('#command-palette') : false;
        if (isOverPalette) {
            if (placeholder.parentElement) placeholder.remove();
            trashArea.classList.remove('hover');
            isOverTrash = false;
            return;
        }

        // ゴミ箱の上にあるかチェック
        isOverTrash = elementBelow ? !!elementBelow.closest('#trash-area') : false;
        trashArea.classList.toggle('hover', isOverTrash && !isDraggingFromPalette);

        // --- プレースホルダーの表示ロジックを統一 ---
        const dropContainer = elementBelow ? elementBelow.closest('.loop-body, #program-area') : null;

        if (isOverTrash || !dropContainer) {
            if (placeholder.parentElement) {
                placeholder.remove();
            }
            return;
        }

        const beforeElement = getDragBeforeElement(dropContainer, touch.clientX, touch.clientY);
        if (beforeElement) {
            dropContainer.insertBefore(placeholder, beforeElement);
        } else {
            dropContainer.appendChild(placeholder);
        }
    }
    
    /**
     * タッチが終了したときの処理
     * @param {TouchEvent} e
     */
    function handleTouchEnd(e) {
        if (!draggedElement || !clone) return;

        // ゴミ箱のハイライトを解除
        trashArea.classList.remove('hover');

        // クローンを一時的に非表示にして、指を離した位置の真下にある要素を取得
        clone.style.visibility = 'hidden';
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        clone.style.visibility = 'visible';

        // ゴミ箱にドロップされたか判定
        const isDroppedOnTrash = elementBelow ? !!elementBelow.closest('#trash-area') : false;

        if (isDroppedOnTrash && !isDraggingFromPalette) {
            // ゴミ箱にドロップ（パレットからは削除しない）
            draggedElement.remove();
        } else {
            // ドロップ可能なコンテナ（プログラムエリアまたはループ内）を探す
            const dropContainer = elementBelow ? elementBelow.closest('.loop-body, #program-area') : null;
            if (dropContainer) {
                // ドロップコンテナ内にドロップ
                let newElement;
                if (isDraggingFromPalette) {
                    newElement = draggedElement.cloneNode(true);
                    newElement.draggable = true;
                    newElement.addEventListener('dragstart', handleDragStart);
                    newElement.addEventListener('dragend', handleDragEnd);
                    newElement.addEventListener('touchstart', handleTouchStart, { passive: false });
                    if (newElement.classList.contains('loop-block')) {
                        const loopBody = newElement.querySelector('.loop-body');
                        if (loopBody) {
                            loopBody.addEventListener('dragover', handleDragOver);
                            loopBody.addEventListener('drop', handleDrop);
                        }
                        // ★追加: クローンした繰り返しブロックにもイベントを設定
                        setupLoopBlockEvents(newElement);
                    }
                } else {
                    newElement = draggedElement;
                    draggedElement.classList.remove('dragging');
                }

                // touchmove中のプレースホルダーは無視し、最終的なタッチ位置でドロップ先を決定する
                const beforeElement = getDragBeforeElement(dropContainer, touch.clientX, touch.clientY);

                if (beforeElement && beforeElement.classList.contains('program-slot')) {
                    // ドロップ先がスロットの場合、そのスロットを置き換える
                    beforeElement.parentElement.replaceChild(newElement, beforeElement);
                } else if (beforeElement) {
                    // ドロップ先がブロックの間の場合、その手前に挿入する
                    dropContainer.insertBefore(newElement, beforeElement);
                } else {
                    // ドロップ先が末尾の場合、コンテナの最後に追加する
                    dropContainer.appendChild(newElement);
                }
            } else {
                // 有効なドロップ先でない場合（元の場所に戻す）
                if (!isDraggingFromPalette) {
                    draggedElement.classList.remove('dragging');
                }
            }
        }

        // クローンとプレースホルダーをDOMから削除
        clone.remove();
        if (placeholder.parentElement) {
            placeholder.remove();
        }

        // 状態をリセット
        draggedElement = null;
        clone = null;
        isOverTrash = false;
        updateSlots();
    }
// programming-game.js - Part 5/5

    // --- 初期化処理の呼び出し ---
    init();

}); // DOMContentLoaded end
