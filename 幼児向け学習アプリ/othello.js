// othello.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 (HTMLのIDに合わせて修正・追加) ---
    const canvas = document.getElementById('othello-board');
    const ctx = canvas.getContext('2d');
    const othelloContainer = document.getElementById('othello-container');
    const blackScoreEl = document.getElementById('black-score');
    const whiteScoreEl = document.getElementById('white-score');
    const turnTextEl = document.getElementById('turn-text');
    const turnIndicatorEl = document.getElementById('turn-indicator');
    const resetBtn = document.getElementById('reset-btn');
    const passButton = document.getElementById('pass-button');
    const resultModal = document.getElementById('result-modal');
    const resultTitleEl = document.getElementById('result-title');
    const resultMessageEl = document.getElementById('result-message');
    const finalBlackScoreEl = document.getElementById('final-black-score');
    const finalWhiteScoreEl = document.getElementById('final-white-score');
    const replayBtn = document.getElementById('replay-btn');
    const modeSelectionModal = document.getElementById('mode-selection-modal');
    const onePlayerBtn = document.getElementById('one-player-btn');
    const twoPlayerBtn = document.getElementById('two-player-btn');
    const aiWatchBtn = document.getElementById('ai-watch-btn'); // AI観戦モードボタン
    const aiThinkingModal = document.getElementById('ai-thinking-modal');
    // 観戦モード用UI
    const watchControls = document.getElementById('watch-controls');
    const pauseBtn = document.getElementById('pause-btn');
    const speedBtns = document.querySelectorAll('#watch-controls .speed-btn');
    const pauseModal = document.getElementById('pause-modal');

    // AI難易度選択モーダルの要素
    const difficultySelectionModal = document.getElementById('difficulty-selection-modal');
    const difficultyButtonsInModal = difficultySelectionModal.querySelectorAll('.difficulty-btn');
    const startAIGameBtn = document.getElementById('start-ai-game-btn');
    const backToModeSelectBtn = document.getElementById('back-to-mode-select-btn');

    // BGMの設定
    // このゲーム専用のBGMに設定します。
    const bgm = document.getElementById('bgm');
    if (bgm) {
        const newBgmSrc = 'assets/sounds/bgm6.mp3';
        if (!bgm.src.endsWith(newBgmSrc)) {
            bgm.src = newBgmSrc;
            bgm.load();
        }
    }

    // --- 定数とゲーム状態 ---
    const BOARD_SIZE = 8;
    let CELL_SIZE; // キャンバスサイズに応じて動的に計算
    const EMPTY = 0;
    const BLACK = 1; // プレイヤー
    const WHITE = 2; // AI
    const AI_WATCH_SPEEDS = {
        fast: { base: 200, random: 100 },   // 0.2-0.3s
        normal: { base: 500, random: 500 }, // 0.5-1.0s
        slow: { base: 1500, random: 1000 }  // 1.5-2.5s
    };

    let board = [];
    let currentPlayer = BLACK;
    let isGameOver = false;
    let isAnimating = false; // アニメーション中フラグ
    let isVsAI = true;
    let isAIWatchMode = false; // AI観戦モードかどうかのフラグ
    let aiWatchSpeed = 'normal';
    let isPaused = false;
    let aiTurnTimeoutId = null;
    let selectedDifficulty = 'Weak'; // 初期難易度

    // --- 画像の読み込み ---
    const images = {};
    const imageSources = {
        kuro: 'assets/images/kuro.png',
        siro: 'assets/images/siro.png',
        wakusen: 'assets/images/wakusen.png'
    };

    let imagesLoaded = 0;
    const totalImages = Object.keys(imageSources).length;

    function onImageLoad() {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            // 画像読み込み完了。モード選択を待つ。
        }
    }

    for (const key in imageSources) {
        images[key] = new Image();
        images[key].src = imageSources[key];
        images[key].onload = onImageLoad;
        images[key].onerror = () => console.error(`画像の読み込みに失敗: ${imageSources[key]}`);
    }

    // --- キャンバス設定 ---
    function setupCanvas() {
        const container = document.getElementById('board-container');
        // ★修正: スマホで表示した際にclientHeightが0として計算されてしまうことがあるため、
        //         正方形である盤面のサイズは、コンテナの幅のみを基準に決定します。
        //         これにより、レイアウト計算のタイミングに依存せず、常に正しく盤面の大きさを取得できます。
        const size = Math.min(container.clientWidth, 600);
        const dpr = window.devicePixelRatio || 1;

        // CSSでの表示サイズを設定
        canvas.style.width = `${size}px`;
        // 高さを幅と同じに設定して正方形を保証
        canvas.style.height = `${size}px`;

        // 解像度を考慮した実際のピクセル数を設定
        canvas.width = size * dpr;
        canvas.height = size * dpr;

        ctx.scale(dpr, dpr);

        CELL_SIZE = size / BOARD_SIZE;
    }

    // --- ゲームの初期化 ---
    function startGame(mode, difficulty) {
        // BGMの再生（ユーザー操作後に呼ばれるため、ここで再生を開始）
        const bgm = document.getElementById('bgm');
        if (bgm && bgm.paused) {
            bgm.play().catch(e => console.error("BGMの再生に失敗しました:", e));
        }

        setupCanvas();
        board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(EMPTY));
        board[3][3] = WHITE;
        board[3][4] = BLACK;
        board[4][3] = BLACK;
        board[4][4] = WHITE;
        
        isVsAI = (mode === 'vsAI' || mode === 'aiWatch');
        isAIWatchMode = (mode === 'aiWatch');
        currentPlayer = BLACK;
        isGameOver = false;
        isPaused = false;
        if (aiTurnTimeoutId) clearTimeout(aiTurnTimeoutId);

        if (isVsAI) {
            selectedDifficulty = difficulty;
        }
        
        // 観戦モードのUI制御
        if (isAIWatchMode) {
            watchControls.classList.remove('hidden');
            pauseBtn.classList.remove('hidden');
            pauseBtn.textContent = 'いちじていし';
            pauseBtn.classList.remove('active');
            pauseModal.classList.add('hidden');
        } else {
            watchControls.classList.add('hidden');
            pauseBtn.classList.add('hidden');
        }

        resultModal.classList.add('hidden');
        passButton.classList.add('hidden');

        updateScoreDisplay();
        updateTurnDisplay();
        drawBoard();
        checkForValidMoves();
    }

    // --- 描画関連 ---
    function drawBoard() {
        // canvas.style.widthはDOMの更新タイミングにより古い値の可能性があるため、
        // canvas.widthプロパティから逆算する方が確実。
        const dpr = window.devicePixelRatio || 1;
        const size = canvas.width / dpr;
        ctx.clearRect(0, 0, size, size);

        // 枠線
        // 駒より先に枠線（盤面）を描画します。
        if (images.wakusen && images.wakusen.complete) {
            // 8x8のグリッドに沿って1マスずつ枠線画像を描画する
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    ctx.drawImage(images.wakusen, c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }
        }

        // 駒の描画
        // 盤面の上に駒を描画します。
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] !== EMPTY) {
                    drawPiece(r, c, board[r][c]);
                }
            }
        }
    }

    function drawPiece(row, col, player, scaleX = 1, scaleY = 1) {
        const x = col * CELL_SIZE + CELL_SIZE / 2;
        const y = row * CELL_SIZE + CELL_SIZE / 2;
        const radius = CELL_SIZE / 2 * 0.95; // 石の大きさをセルぎりぎりに調整
        const pieceImage = (player === BLACK) ? images.kuro : images.siro;

        if (pieceImage && pieceImage.complete) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scaleX, scaleY);
            ctx.drawImage(pieceImage, -radius, -radius, radius * 2, radius * 2);
            ctx.restore();
        }
    }

    // 新しい石を置くときのアニメーション
    function animatePlacePiece(row, col, player) {
        return new Promise(resolve => {
            const duration = 500; // ms
            let startTime = null;

            function animationStep(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsedTime = timestamp - startTime;
                const progress = Math.min(elapsedTime / duration, 1);

                // ぽよんと弾むようなイージング効果
                const p = progress;
                const c1 = 1.70158;
                const c3 = c1 + 1;
                const scale = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);

                // 途中で黄色く光るエフェクト
                const glowProgress = Math.sin(progress * Math.PI); // 0 -> 1 -> 0 のカーブ
                const shadowBlur = glowProgress * 30;
                const shadowColor = `rgba(255, 255, 100, ${glowProgress * 0.9})`;

                // 新しい石以外の盤面を再描画
                drawBoard();

                // アニメーション中の石を描画
                ctx.save();
                ctx.shadowBlur = shadowBlur;
                ctx.shadowColor = shadowColor;
                drawPiece(row, col, player, scale, scale);
                ctx.restore();

                if (progress < 1) {
                    requestAnimationFrame(animationStep);
                } else {
                    // アニメーション完了後、盤面のデータを確定
                    board[row][col] = player;
                    drawBoard();
                    resolve();
                }
            }
            requestAnimationFrame(animationStep);
        });
    }

    // 1つの石をひっくり返すアニメーション
    function animateSingleFlip(row, col, newPlayer) {
        return new Promise(resolve => {
            const duration = 450; // アニメーション時間 (ms) - 少し長くして滑らかに見せる
            let startTime = null;
            const originalPlayer = board[row][col];

            // アニメーション中は盤面データを一時的に空にする
            board[row][col] = EMPTY;

            function animationStep(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsedTime = timestamp - startTime;
                const progress = Math.min(elapsedTime / duration, 1);

                // 1 -> 0 -> -1 のように変化するスケール (横方向の回転)
                const scaleX = Math.cos(progress * Math.PI);
                // 1 -> 1.2 -> 1 のように変化するスケール (ポップアップ)
                const scaleY = 1 + Math.sin(progress * Math.PI) * 0.2; // 少し大きく弾むように
                // 明るく光るエフェクト (glow)
                const glowProgress = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
                const shadowBlur = glowProgress * 25; // 光を少し強く
                const shadowColor = `rgba(255, 255, 255, ${glowProgress * 0.8})`; // 光を少し明るく

                // 盤面全体を再描画（アニメーション中の駒はEMPTYなので描画されない）
                drawBoard();

                // アニメーション中の駒だけ特別に描画
                ctx.save();
                ctx.shadowBlur = shadowBlur;
                ctx.shadowColor = shadowColor;
                if (scaleX > 0) {
                    // 前半: 元の色の駒が縮んでいく
                    drawPiece(row, col, originalPlayer, scaleX, scaleY);
                } else {
                    // 後半: 新しい色の駒が広がっていく
                    drawPiece(row, col, newPlayer, -scaleX, scaleY);
                }
                ctx.restore();

                if (progress < 1) {
                    requestAnimationFrame(animationStep);
                } else {
                    // アニメーション完了後、盤面データを新しい色で確定させる
                    board[row][col] = newPlayer;
                    resolve();
                }
            }
            requestAnimationFrame(animationStep);
        });
    }

    // 複数の石を順番にアニメーションさせる
    async function animateFlips(stonesToFlip, player) {
        // for...of ループと await を使って、一つずつアニメーションが完了するのを待つ
        for (const stone of stonesToFlip) {
            // 1つの石のアニメーションが完了するのを待つ
            await animateSingleFlip(stone.row, stone.col, player);
            // 次の石がひっくり返るまで少し待つと、より「パタパタ」感が出る
            await sleep(100);
        }
        // 全てのアニメーションが終わったら最終的な盤面を描画
        drawBoard();
    }


    function highlightValidMoves(moves) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
        moves.forEach(move => {
            ctx.beginPath();
            ctx.arc(move.col * CELL_SIZE + CELL_SIZE / 2, move.row * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // 指定ミリ秒待機するヘルパー関数
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // --- ゲームロジック ---
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    function getValidMoves(player) {
        const validMoves = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] === EMPTY) {
                    const flippableStones = getFlippableStones(r, c, player);
                    if (flippableStones.length > 0) {
                        validMoves.push({ row: r, col: c });
                    }
                }
            }
        }
        return validMoves;
    }

    function getFlippableStones(row, col, player) {
        const opponent = (player === BLACK) ? WHITE : BLACK;
        let allFlippableStones = [];

        directions.forEach(([dr, dc]) => {
            let stonesInDirection = [];
            let r = row + dr;
            let c = col + dc;

            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (board[r][c] === opponent) {
                    stonesInDirection.push({ row: r, col: c });
                } else if (board[r][c] === player) {
                    allFlippableStones = allFlippableStones.concat(stonesInDirection);
                    break;
                } else { // EMPTY
                    break;
                }
                r += dr;
                c += dc;
            }
        });
        return allFlippableStones;
    }

    async function placePiece(row, col) {
        if (isGameOver || board[row][col] !== EMPTY || isAnimating) return;
        const flippableStones = getFlippableStones(row, col, currentPlayer);
        if (flippableStones.length === 0) return;

        isAnimating = true;

        // 新しい石を置くアニメーション（完了すると盤面データも更新される）
        await animatePlacePiece(row, col, currentPlayer);

        // 続けて、石をひっくり返すアニメーション
        await animateFlips(flippableStones, currentPlayer);

        updateScoreDisplay();
        
        isAnimating = false;
        switchTurn();
    }

    function switchTurn() {
        currentPlayer = (currentPlayer === BLACK) ? WHITE : BLACK;
        updateTurnDisplay();
        checkForValidMoves();
    }

    function checkForValidMoves() {
        if (isGameOver || isPaused) return;

        const validMoves = getValidMoves(currentPlayer);

        if (validMoves.length > 0) {
            passButton.classList.add('hidden');
            // AI観戦モード、または、vsAIモードで白(AI)の番の場合
            if (isAIWatchMode || (isVsAI && currentPlayer === WHITE)) {
                // 思考の開始を少し遅らせることで、UIの更新を確実にする
                // 実際の思考時間はaiTurn関数内で、観戦スピード設定に応じて制御される
                aiTurnTimeoutId = setTimeout(() => aiTurn(currentPlayer), 100);
            } else {
                // プレイヤーのターン (vsAIの黒番 or vsPlayerの黒/白番)
                drawBoard();
                highlightValidMoves(validMoves);
            }
        } else {
            // パスの確認
            const opponent = (currentPlayer === BLACK) ? WHITE : BLACK;
            const opponentMoves = getValidMoves(opponent);
            if (opponentMoves.length > 0) {
                handlePass();
            } else {
                // 両者置けないのでゲーム終了
                endGame();
            }
        }
    }

    function handlePass() {
        passButton.classList.remove('hidden');
        // 2秒後に自動でパスする
        aiTurnTimeoutId = setTimeout(() => {
            if (!isGameOver) {
                passButton.classList.add('hidden');
                switchTurn();
            }
        }, 2000);
    }

    function endGame() {
        isGameOver = true;
        if (aiTurnTimeoutId) clearTimeout(aiTurnTimeoutId);
        watchControls.classList.add('hidden');
        const scores = countScores();
        let title = '';
        let message = '';

        if (scores.black > scores.white) {
            title = 'くろ の かち！';
            message = isAIWatchMode ? 'すごい しょうぶだったね！' : 'おめでとう！';
        } else if (scores.white > scores.black) {
            title = 'しろ の かち！';
            message = isAIWatchMode ? 'すごい しょうぶだったね！' : ((isVsAI) ? 'ざんねん、つぎはがんばろう！' : 'おめでとう！');
        } else {
            title = 'ひきわけ！';
            message = 'すごいしょうぶだったね！';
        }

        resultTitleEl.textContent = title;
        resultMessageEl.textContent = message;
        finalBlackScoreEl.textContent = scores.black;
        finalWhiteScoreEl.textContent = scores.white;
        resultModal.classList.remove('hidden');
    }

    // --- AIの処理 ---
    async function aiTurn(player) {
        if (isGameOver || isAnimating || isPaused) return;

        const validMoves = getValidMoves(player);
        if (validMoves.length === 0) {
            // AIが打てる手がない場合は、何もせずに終了
            return;
        }

        // 思考中モーダルを表示
        aiThinkingModal.classList.remove('hidden');
        
        // 思考時間を設定（観戦モードでは選択された速度、対戦モードでは固定）
        const thinkingTime = isAIWatchMode
            ? AI_WATCH_SPEEDS[aiWatchSpeed].base + Math.random() * AI_WATCH_SPEEDS[aiWatchSpeed].random
            : (Math.random() * 1500 + 500); // 0.5〜1.5秒
        await sleep(thinkingTime);

        const opponent = (player === BLACK) ? WHITE : BLACK;
        // AIインスタンスを作成
        // ai.jsのOthelloAIクラスを使用
        const ai = new OthelloAI(player, opponent, selectedDifficulty);
        
        // 最善手を取得
        const bestMove = ai.findBestMove(board, validMoves);

        // 思考中モーダルを非表示にしてから石を置く
        aiThinkingModal.classList.add('hidden');
        await sleep(100); // ユーザーが盤面を認識する時間

        if (bestMove) {
            // placePieceが完了するのを待つ
            await placePiece(bestMove.row, bestMove.col);
        }
    }

    // --- UI更新 ---
    function countScores() {
        let black = 0;
        let white = 0;
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] === BLACK) black++;
                if (board[r][c] === WHITE) white++;
            }
        }
        return { black, white };
    }

    function updateScoreDisplay() {
        const scores = countScores();
        blackScoreEl.textContent = scores.black;
        whiteScoreEl.textContent = scores.white;
    }

    function updateTurnDisplay() {
        if (isGameOver) {
            turnTextEl.textContent = 'ゲームしゅうりょう';
            turnIndicatorEl.classList.remove('turn-indicator');
        } else {
            if (isAIWatchMode) {
                turnTextEl.textContent = (currentPlayer === BLACK) ? 'AI(くろ) のばん' : 'AI(しろ) のばん';
            } else if (isVsAI) {
                turnTextEl.textContent = (currentPlayer === BLACK) ? 'あなた のばん' : 'AI のばん';
            } else {
                turnTextEl.textContent = (currentPlayer === BLACK) ? 'くろ のばん' : 'しろ のばん';
            }
            turnIndicatorEl.src = (currentPlayer === BLACK) ? imageSources.kuro : imageSources.siro;
            turnIndicatorEl.alt = (currentPlayer === BLACK) ? '黒の番' : '白の番';
            turnIndicatorEl.classList.add('turn-indicator');
        }
    }

    /**
     * 観戦モードで「一時停止/再開」ボタンが押されたときの処理
     */
    function togglePause() {
        if (!isAIWatchMode || isGameOver) return;

        isPaused = !isPaused;

        if (isPaused) {
            // --- 一時停止する ---
            if (aiTurnTimeoutId) {
                clearTimeout(aiTurnTimeoutId);
                aiTurnTimeoutId = null;
            }
            pauseModal.classList.remove('hidden');
            pauseBtn.textContent = 'さいかい';
            pauseBtn.classList.add('active');
        } else {
            // --- 再開する ---
            pauseModal.classList.add('hidden');
            pauseBtn.textContent = 'いちじていし';
            pauseBtn.classList.remove('active');
            // AIのターンを再開
            // checkForValidMovesを呼ぶことで、パスの判定も含めて再開できる
            checkForValidMoves();
        }
    }

    // --- イベントハンドラ ---
    async function handleCanvasClick(e) {
        if (isGameOver || isAnimating || isAIWatchMode) return;

        // AIモードで白(AI)の番のときにプレイヤーがクリックするのを防ぐ
        if (isVsAI && currentPlayer === WHITE) {
            return;
        }

        // クリック座標をキャンバスの表示サイズに合わせた座標に変換
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / CELL_SIZE);
        const row = Math.floor(y / CELL_SIZE);

        await placePiece(row, col);
    }

    // --- 初期化とイベントリスナー設定 ---

    onePlayerBtn.addEventListener('click', () => {
        isAIWatchMode = false; // 観戦モードではないことを明示
        modeSelectionModal.classList.add('hidden');
        difficultySelectionModal.classList.remove('hidden');
        othelloContainer.classList.add('hidden'); // ゲーム画面はまだ隠す
    });

    twoPlayerBtn.addEventListener('click', () => {
        isAIWatchMode = false;
        modeSelectionModal.classList.add('hidden');
        othelloContainer.classList.remove('hidden');
        startGame('vsPlayer'); // AIなしでゲーム開始
    });

    aiWatchBtn.addEventListener('click', () => {
        isAIWatchMode = true; // 観戦モードであることを明示
        modeSelectionModal.classList.add('hidden');
        othelloContainer.classList.remove('hidden');
        // 難易度選択をスキップし、最強レベルでゲームを開始
        startGame('aiWatch', 'Strongest');
    });

    backToModeSelectBtn.addEventListener('click', () => {
        difficultySelectionModal.classList.add('hidden');
        modeSelectionModal.classList.remove('hidden');
    });

    // 難易度選択モーダル内のボタン処理
    difficultyButtonsInModal.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedDifficulty = btn.dataset.difficulty;
            difficultyButtonsInModal.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    // 「ゲームかいし」ボタンの処理
    startAIGameBtn.addEventListener('click', () => {
        difficultySelectionModal.classList.add('hidden');
        othelloContainer.classList.remove('hidden');
        // 観戦モードはこのボタンを通らなくなったため、vsAIモードで開始する
        startGame('vsAI', selectedDifficulty);
    });

    canvas.addEventListener('click', handleCanvasClick);
    pauseBtn.addEventListener('click', togglePause);

    speedBtns.forEach(button => {
        button.addEventListener('click', () => {
            if (!isAIWatchMode || isPaused) return; // 一時停止中は速度変更不可

            speedBtns.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            aiWatchSpeed = button.dataset.speed;
        });
    });

    window.addEventListener('resize', () => {
        setupCanvas();
        drawBoard();
        // プレイヤーのターンの場合、有効な手のハイライトを再描画
        if (!isGameOver && !isPaused && !(isVsAI && currentPlayer === WHITE)) {
            const validMoves = getValidMoves(currentPlayer);
            if (validMoves.length > 0) highlightValidMoves(validMoves);
        }
    });

    resetBtn.addEventListener('click', () => {
        isGameOver = true; // ゲーム操作を不可にする
        if (aiTurnTimeoutId) clearTimeout(aiTurnTimeoutId);
        othelloContainer.classList.add('hidden'); // ゲーム画面を隠す
        resultModal.classList.add('hidden'); // 結果モーダルも隠す
        watchControls.classList.add('hidden');
        pauseBtn.classList.add('hidden');
        pauseModal.classList.add('hidden');
        modeSelectionModal.classList.remove('hidden');
    });
    replayBtn.addEventListener('click', () => {
        isGameOver = true;
        if (aiTurnTimeoutId) clearTimeout(aiTurnTimeoutId);
        othelloContainer.classList.add('hidden'); // ゲーム画面を隠す
        resultModal.classList.add('hidden');
        watchControls.classList.add('hidden');
        pauseBtn.classList.add('hidden');
        pauseModal.classList.add('hidden');
        modeSelectionModal.classList.remove('hidden');
    });

    passButton.addEventListener('click', () => {
        if (!isGameOver) {
            // ★ 自動パス用のタイマーが作動しないように、タイマーをクリアします。
            if (aiTurnTimeoutId) {
                clearTimeout(aiTurnTimeoutId);
                aiTurnTimeoutId = null;
            }
            passButton.classList.add('hidden');
            switchTurn();
        }
    });

    // ボタンにカラフルなスタイルを適用
    passButton.classList.add('colorful-btn');

}); // DOMContentLoaded end
