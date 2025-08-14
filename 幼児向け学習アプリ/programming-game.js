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

    /**
     * 初期化処理
     */
    function init() {
        // このゲーム専用のBGMに設定
        const bgm = document.getElementById('bgm');
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
        resetBtn.addEventListener('click', resetCharacter);
        playAgainBtn.addEventListener('click', () => {
            goalModal.classList.add('hidden');
            resetCharacter();
            // ボタンの状態をリセット
            character.isMoving = false;
            runBtn.disabled = false;
            resetBtn.disabled = false;
        });

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
     * ブロックが置かれていない空のスロットを一定数確保する
     */
    function updateSlots() {
        const currentBlocks = programArea.querySelectorAll('.command-block').length;
        const currentSlots = programArea.querySelectorAll('.program-slot').length;
        const totalElements = currentBlocks + currentSlots;
        const INITIAL_SLOTS = 6; // 常に最低でもこの数のスロットは表示したい

        // 既存のスロットを一旦全て削除
        programArea.querySelectorAll('.program-slot').forEach(slot => slot.remove());

        // 必要なスロット数を計算して追加
        const slotsToAdd = Math.max(0, INITIAL_SLOTS - currentBlocks);

        for (let i = 0; i < slotsToAdd; i++) {
            const slot = document.createElement('div');
            slot.className = 'program-slot';
            programArea.appendChild(slot);
        }
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
            const commands = buildCommandsFromDOM();
            await executeCommands(commands);
        } catch (error) {
            console.error("プログラムの実行中にエラーが発生しました:", error);
            alert("プログラムの実行中にエラーがおきました。");
        } finally {
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
        for (const command of commands) {            
            const el = command.element;
            if (el) el.classList.add('is-executing');

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
            }
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

// programming-game.js - Part 3/5

    /**
     * プログラムエリアのDOMから命令のリストを構築する
     * @returns {Array} 命令オブジェクトの配列
     */
    function buildCommandsFromDOM() {
        const commands = [];
        const commandElements = programArea.querySelectorAll('.command-block');

        commandElements.forEach(el => {
            const commandStr = el.dataset.command;
            if (!commandStr) return;

            // 正規表現でコマンドを解析
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
            // 他のコマンドもここに追加可能
        });

        return commands;
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

        // ゴミ箱を表示
        trashArea.classList.add('visible');
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
        // ゴミ箱を非表示
        trashArea.classList.remove('visible');
    }

    /**
     * 要素がドロップ可能なエリア上にあるときの処理
     * @param {DragEvent} e
     */
    function handleDragOver(e) {
        e.preventDefault(); // ドロップを許可するために必須
        const target = e.target;

        // プログラムエリア内での並び替え
        if (target.classList.contains('command-block') && target !== draggedElement) {
            const rect = target.getBoundingClientRect();
            const nextElement = (e.clientY > rect.top + rect.height / 2) ? target.nextSibling : target;
            programArea.insertBefore(placeholder, nextElement);
        } else if (target.classList.contains('program-slot')) {
             programArea.insertBefore(placeholder, target);
        } else if (target === programArea && !programArea.querySelector('.command-block')) {
            // エリアが空の場合
            programArea.appendChild(placeholder);
        }
    }

    /**
     * プログラムエリアにドロップされたときの処理
     * @param {DragEvent} e
     */
    function handleDrop(e) {
        e.preventDefault();
        if (!placeholder.parentElement) return;

        let newElement;
        if (isDraggingFromPalette) {
            // パレットからならクローンを作成
            newElement = draggedElement.cloneNode(true);
            newElement.classList.remove('dragging');
        } else {
            // エリア内移動なら本人
            newElement = draggedElement;
        }

        // プレースホルダーの位置に新しい要素を挿入
        placeholder.parentElement.replaceChild(newElement, placeholder);
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

        // ゴミ箱を表示
        trashArea.classList.add('visible');
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

        // ドロップ先のプレースホルダーを更新
        // cloneを一時的に非表示にして、下の要素を取得
        clone.style.display = 'none';
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        clone.style.display = '';

        const dropTarget = elementBelow ? elementBelow.closest('.command-block, .program-slot, #program-area, #trash-area') : null;

        // 既存のプレースホルダーを削除
        if (placeholder.parentElement) {
            placeholder.remove();
        }

        if (dropTarget) {
            if (dropTarget.classList.contains('command-block') && dropTarget !== draggedElement) {
                const rect = dropTarget.getBoundingClientRect();
                const nextElement = (touch.clientY > rect.top + rect.height / 2) ? dropTarget.nextSibling : dropTarget;
                programArea.insertBefore(placeholder, nextElement);
            } else if (dropTarget.classList.contains('program-slot')) {
                programArea.insertBefore(placeholder, dropTarget);
            } else if (dropTarget.id === 'program-area' && !programArea.querySelector('.command-block')) {
                programArea.appendChild(placeholder);
            }
        }

        // ゴミ箱の上にあるかチェック
        if (dropTarget && dropTarget.id === 'trash-area') {
            trashArea.classList.add('hover');
        } else {
            trashArea.classList.remove('hover');
        }
    }

    /**
     * タッチが終了したときの処理
     * @param {TouchEvent} e
     */
    function handleTouchEnd(e) {
        if (!draggedElement || !clone) return;

        // ゴミ箱のハイライトを解除
        trashArea.classList.remove('hover', 'visible');

        // ドロップ位置を最終決定
        const touch = e.changedTouches[0];
        clone.style.display = 'none';
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        clone.style.display = '';

        const dropTarget = elementBelow ? elementBelow.closest('#program-area, #trash-area') : null;

        if (dropTarget && dropTarget.id === 'trash-area') {
            // ゴミ箱にドロップ
            if (!isDraggingFromPalette) {
                draggedElement.remove();
            }
        } else if (placeholder.parentElement) {
            // プログラムエリアにドロップ
            let newElement;
            if (isDraggingFromPalette) {
                newElement = draggedElement.cloneNode(true);
            } else {
                newElement = draggedElement;
                draggedElement.classList.remove('dragging');
            }
            placeholder.parentElement.replaceChild(newElement, placeholder);
        } else {
            // 有効なドロップ先でない場合
            if (!isDraggingFromPalette) {
                draggedElement.classList.remove('dragging');
            }
        }

        // クローンとプレースホルダーを削除
        clone.remove();
        if (placeholder.parentElement) {
            placeholder.remove();
        }

        // 状態をリセット
        draggedElement = null;
        clone = null;
        updateSlots();
    }
// programming-game.js - Part 5/5

    // --- 初期化処理の呼び出し ---
    init();

}); // DOMContentLoaded end
