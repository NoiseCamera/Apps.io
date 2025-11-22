// igo.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素 ---
    const canvas = document.getElementById('igo-canvas');
    const ctx = canvas.getContext('2d');
    const turnIndicator = document.getElementById('turn-indicator');
    const blackCapturesEl = document.getElementById('black-captures');
    const whiteCapturesEl = document.getElementById('white-captures');
    // 盤面サイズボタンは複数のモーダルに存在するため、都度取得する
    // const boardSizeButtons = document.querySelectorAll('.board-size-btn');
    const passBtn = document.getElementById('pass-btn');
    const resignBtn = document.getElementById('resign-btn');
    const hintBtn = document.getElementById('hint-btn');
    const guideButtons = document.querySelectorAll('.guide-btn');
    const gameContainer = document.getElementById('game-container');

    // --- モーダル関連 ---
    const modeSelectionModal = document.getElementById('mode-selection-modal');
    const difficultySelectionModal = document.getElementById('difficulty-selection-modal');
    const startAIGameBtn = document.getElementById('start-ai-game-btn');
    const backToModeFromDifficultyBtn = document.getElementById('back-to-mode-from-difficulty-btn');

    const playerSelectionModal = document.getElementById('player-selection-modal');
    const startHumanGameBtn = document.getElementById('start-human-game-btn');
    const backToModeBtn = document.getElementById('back-to-mode-btn');
    const senteNameInput = document.getElementById('sente-name');
    const goteNameInput = document.getElementById('gote-name');

    const ruleGuideModal = document.getElementById('rule-guide-modal');
    const ruleGuideModalTitle = document.getElementById('rule-guide-modal-title');
    const ruleGuideCanvas = document.getElementById('rule-guide-canvas');
    const ruleGuideModalText = document.getElementById('rule-guide-modal-text');
    const ruleGuideAnimationText = document.getElementById('rule-guide-animation-text');
    const closeRuleGuideModalBtn = document.getElementById('close-rule-guide-modal-btn');

    const gameOverModal = document.getElementById('game-over-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const playAgainBtn = document.getElementById('play-again-btn');
    const blackTerritoryEl = document.getElementById('black-territory');
    const blackFinalCapturesEl = document.getElementById('black-final-captures');
    const blackTotalScoreEl = document.getElementById('black-total-score');
    const whiteTerritoryEl = document.getElementById('white-territory');
    const whiteFinalCapturesEl = document.getElementById('white-final-captures');
    const whiteTotalScoreEl = document.getElementById('white-total-score');
    const aiThinkingModal = document.getElementById('ai-thinking-modal');
    const aiThinkingTitle = document.getElementById('ai-thinking-title');

    // --- 観戦モードUI ---
    const watchControls = document.getElementById('watch-controls');
    const pauseBtn = document.getElementById('pause-btn');
    const speedBtns = document.querySelectorAll('.speed-btn');


    // --- 音声 ---
    const placeStoneSound = document.getElementById('place-stone-sound');
    const captureSound = document.getElementById('capture-sound');
    const winSound = document.getElementById('win-sound');
    const loseSound = document.getElementById('lose-sound');

    // --- ゲーム設定 ---
    let boardSize = 9; // 9, 13, 19路盤
    const PADDING = 30;
    const CONTAINER_PADDING = 20; // #board-container の CSS padding と合わせる
    let cellSize;
    let board = [];

    // --- ゲーム状態 ---
    let gameMode = 'vsAI'; // 'vsAI', 'vsHuman', 'aiWatch'
    let currentPlayer = 1; // 1: 黒, 2: 白
    let aiLevel = 'easy';
    let gameOver = false;
    let passCount = 0;
    let history = []; // 棋譜（コウ判定用）
    let blackCaptures = 0; // 黒が取った石の数
    let whiteCaptures = 0; // 白が取った石の数
    let sentePlayerName = 'プレイヤー1';
    let gotePlayerName = 'プレイヤー2';
    let isPaused = false;
    let aiWatchSpeed = 'normal';
    let isBoardLocked = false; // AIのターン中やアニメーション中に盤面をロックする
    let lastMove = null; // 最後に打たれた石の座標 {x, y}
    let aiTurnTimeoutId = null;
    const AI_WATCH_SPEEDS = {
        fast: { base: 200, random: 100 },   // 0.2-0.3s
        normal: { base: 500, random: 500 }, // 0.5-1.0s
        slow: { base: 1500, random: 1000 }  // 1.5-2.5s
    };

    // --- ガイドデータ ---
    const GUIDE_DATA = {
        'capture': {
            title: 'いしの とりかた',
            text: 'あいての いしの まわりを ぜんぶ かこむと、その いしを とれるよ。とった いしは「アゲハマ」といって、さいごの けいさんで つかうんだ。'
        },
        'atari': {
            title: 'アタリ',
            text: '「アタリ」は、つぎに うたれると とられてしまう じょうたいの こと。この しろい いしは アタリに なっているよ。'
        },
        'dame': {
            title: 'ダメ',
            text: '「ダメ」は、いしが にげられる あいている ばしょの ことだよ。ばつじるし(×)が ついたところが ダメだよ。'
        },
        'ko': {
            title: 'コウ',
            text: '「コウ」は、おなじ かたちを くりかえさないための ルールだよ。とられた ばしょに すぐ とりかえすことは できないんだ。いちど、ほかの ばしょに うってからなら オーケー！'
        },
        'ji': {
            title: 'じんち',
            text: 'さいごに、じぶんの いしで かこんだ ばしょが「じんち」になるよ。いろが ついたところが それぞれの じんちだよ。'
        },
        'eye': {
            title: 'め',
            text: '「め」は いしが いきるための へやだよ。めが ふたつあると、その いしは ぜったいに とられなくなるんだ。これを「いき」というよ。'
        },
        'seki': {
            title: 'セキ',
            text: '「セキ」は、おたがいの いしが とれない かたちのこと。セキの ばしょは どちらの じんちにも ならないよ。'
        },
        'damezumari': {
            title: 'ダメヅマリ',
            text: 'あいての いしを とっても、じぶんの ダメが つまっていると、すぐに とりかえされちゃう「うってがえし」になることが あるから ちゅういしよう。'
        },
        'shicho': {
            title: 'シチョウ',
            text: '「シチョウ」は、いしを じぐざぐに おいかけて とる てすじの ことだよ。にげられない ときは、あきらめることも たいせつだよ。'
        },
        'geta': {
            title: 'ゲタ',
            text: '「ゲタ」は、にげみちを ふさぐようにして、あいての いしを とる てすじの ことだよ。げたの かたちに にているね。'
        },
        'suicide': {
            title: 'うてない ばしょ',
            text: 'じぶんの いしを おくと すぐに とられてしまう ばしょには うてないよ。でも、あいての いしを とれるときは うてるんだ。'
        },
        'ending': {
            title: 'おわりかた',
            text: 'うつ ばしょが なくなったら「パス」を するよ。ふたりとも パスを すると ゲームしゅうりょう！「まけました」でも おわれるよ。'
        },
        'scoring': {
            title: 'かちまけの きめかた',
            text: '「じぶんの じんち」と「とった あいての いし（アゲハマ）」の ごうけいで しょうぶ！ しろは さいごに 6.5もくの ボーナス（コミ）が もらえるよ。'
        }
    };

    // --- グローバルヘルパー (AIから参照) ---
    // AIファイルから参照できるように、ルール関連の純粋な関数をwindowオブジェクトに登録
    window.igoAIHelpers = {
        BOARD_SIZE: boardSize,
        captureOpponentStones: captureOpponentStones,
        countLiberties: countLiberties,
        getGroup: getGroup
    };

    // --- ゲーム開始フロー ---
    /**
     * ゲームを終了し、モード選択画面に戻る
     */
    function showModeSelection() {
        // 実行中のタイマーをすべて停止
        if (aiTurnTimeoutId) clearTimeout(aiTurnTimeoutId);
        if (guideAnimationId) cancelAnimationFrame(guideAnimationId);

        // ゲーム状態をリセット
        gameOver = true;
        isBoardLocked = true;
        gameMode = null;
        currentPlayer = 1;
        sentePlayerName = 'プレイヤー1';
        gotePlayerName = 'プレイヤー2';
        isPaused = false;
        lastMove = null;

        // すべてのモーダルを非表示にする
        gameOverModal.classList.add('hidden');
        playerSelectionModal.classList.add('hidden');
        difficultySelectionModal.classList.add('hidden');

        // ゲームUIをすべて非表示にする
        updateUIVisibility(null);

        // モード選択モーダルのみ表示
        modeSelectionModal.classList.remove('hidden');
    }

    /**
     * 最後に打たれた石の上にマーカーを描画する
     */
    function drawLastMoveMarker() {
        if (!lastMove) return;

        const { x, y } = lastMove;
        const stoneColor = board[y][x];
        if (stoneColor === 0) return; // Should not happen, but as a safeguard

        // マーカーの色を石の色と逆にする
        const markerColor = stoneColor === 1 ? 'white' : 'black';

        ctx.strokeStyle = markerColor;
        ctx.lineWidth = 2;
        const centerX = PADDING + x * cellSize;
        const centerY = PADDING + y * cellSize;
        const radius = cellSize / 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }

    function startGame(mode) {
        gameMode = mode;
        isPaused = false;
        if (aiTurnTimeoutId) clearTimeout(aiTurnTimeoutId);

        modeSelectionModal.classList.add('hidden');
        playerSelectionModal.classList.add('hidden');
        difficultySelectionModal.classList.add('hidden');

        // --- 盤面と状態の初期化 ---
        initializeBoardAndState();
        drawGame();

        // UIの表示を更新
        updateUIVisibility(mode);
        
        // BGM再生
        playBGM();
    }

    /**
     * ゲームモードに応じてUIの表示/非表示を制御する
     * @param {string | null} mode - 現在のゲームモード ('vsAI', 'vsHuman', 'aiWatch')。nullの場合はすべて非表示。
     */
    function updateUIVisibility(mode) {
        // ゲームコンテナ
        gameContainer.classList.toggle('hidden', !mode);

        if (mode === 'vsAI') {
            // 対AI戦モード
            watchControls.classList.add('hidden');
            pauseBtn.classList.add('hidden');
            hintBtn.classList.remove('hidden');
            passBtn.classList.remove('hidden');
            resignBtn.classList.remove('hidden');
        } else if (mode === 'vsHuman') {
            // 対人戦モード
            watchControls.classList.add('hidden');
            pauseBtn.classList.add('hidden');
            hintBtn.classList.add('hidden');
            passBtn.classList.remove('hidden');
            resignBtn.classList.remove('hidden');
        } else if (mode === 'aiWatch') {
            // 観戦モード
            watchControls.classList.remove('hidden');
            pauseBtn.classList.remove('hidden');
            pauseBtn.textContent = 'いちじていし';
            pauseBtn.classList.remove('active');
            hintBtn.classList.add('hidden');
            passBtn.classList.add('hidden');
            resignBtn.classList.add('hidden');
        } else {
            // ゲーム中でない場合 (mode is null) はすべて非表示
            watchControls.classList.add('hidden');
            pauseBtn.classList.add('hidden');
            hintBtn.classList.add('hidden');
            passBtn.classList.add('hidden');
            resignBtn.classList.add('hidden');
        }
    }

    /**
     * BGMを再生する
     */
    function playBGM() {
        // BGM再生
        const bgm = document.getElementById('bgm');
        if (bgm && bgm.paused) {
            bgm.play().catch(e => console.error("BGM再生失敗", e));
        }
    }


    /**
     * AIのターンを開始する
     */
    function startAITurn() {
        // AI観戦モードなら最初のAIのターンを開始
        if (gameMode === 'aiWatch') {
            aiLevel = 'hard'; // 観戦モードではAIレベルを「強い」に固定
            aiTurnTimeoutId = setTimeout(aiTurn, 1000);
        }
    }

    // --- 描画関連 ---
    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // 盤の色
        ctx.fillStyle = '#e6bf83';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 罫線
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        for (let i = 0; i < boardSize; i++) {
            // 縦線
            ctx.beginPath();
            ctx.moveTo(PADDING + i * cellSize, PADDING);
            ctx.lineTo(PADDING + i * cellSize, canvas.height - PADDING);
            ctx.stroke();
            // 横線
            ctx.beginPath();
            ctx.moveTo(PADDING, PADDING + i * cellSize);
            ctx.lineTo(canvas.width - PADDING, PADDING + i * cellSize);
            ctx.stroke();
        }

        // 星
        let starPoints = [];
        if (boardSize === 9) {
            starPoints = [[2, 2], [6, 2], [2, 6], [6, 6], [4, 4]];
        } else if (boardSize === 13) {
            starPoints = [[3, 3], [9, 3], [3, 9], [9, 9], [6, 6]];
        } else if (boardSize === 19) {
            starPoints = [
                [3, 3], [9, 3], [15, 3],
                [3, 9], [9, 9], [15, 9],
                [3, 15], [9, 15], [15, 15]
            ];
        }
        starPoints.forEach(([x, y]) => drawStar(x, y));
    }

    function drawStar(x, y) {
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(PADDING + x * cellSize, PADDING + y * cellSize, 4, 0, 2 * Math.PI);
        ctx.fill();
    }

    function drawStones() {
        for (let y = 0; y < boardSize; y++) {
            for (let x = 0; x < boardSize; x++) {
                if (board[y][x] !== 0) {
                    ctx.beginPath();
                    ctx.arc(PADDING + x * cellSize, PADDING + y * cellSize, cellSize / 2 * 0.95, 0, 2 * Math.PI);
                    ctx.fillStyle = board[y][x] === 1 ? '#000' : '#fff';
                    ctx.fill();
                }
            }
        }
    }

    function drawGame() {
        drawBoard();
        drawStones();
        drawLastMoveMarker();
    }

    // --- ルールガイドアニメーション ---
    let guideAnimationId = null;
    let currentGuideTopic = null; // 現在再生中のトピックを追跡

    function drawGuideUiButton(gCtx, text, x, y, width, height, color = '#4caf50') {
        gCtx.fillStyle = color;
        gCtx.fillRect(x, y, width, height);
        gCtx.fillStyle = 'white';
        gCtx.font = 'bold 18px sans-serif';
        gCtx.textAlign = 'center';
        gCtx.textBaseline = 'middle';
        gCtx.fillText(text, x + width / 2, y + height / 2);
    }

    function drawGuideStoneWithAnimation(gCtx, x, y, player, size, canvasSize, scale = 1, opacity = 1) {
        const guidePadding = 20;
        const guideCellSize = (canvasSize - guidePadding * 2) / (size - 1);
        gCtx.save();
        gCtx.globalAlpha = opacity;
        gCtx.translate(guidePadding + x * guideCellSize, guidePadding + y * guideCellSize);
        gCtx.scale(scale, scale);
        gCtx.beginPath();
        gCtx.arc(0, 0, guideCellSize / 2 * 0.9, 0, 2 * Math.PI);
        gCtx.fillStyle = player === 1 ? '#000' : '#fff';
        gCtx.fill();
        gCtx.restore();
    }

    function drawGuideBoard(gCtx, size, canvasSize) {
        const guidePadding = 20;
        const guideCellSize = (canvasSize - guidePadding * 2) / (size - 1);

        gCtx.clearRect(0, 0, canvasSize, canvasSize);
        gCtx.fillStyle = '#e6bf83';
        gCtx.fillRect(0, 0, canvasSize, canvasSize);

        gCtx.strokeStyle = '#000';
        gCtx.lineWidth = 1;
        for (let i = 0; i < size; i++) {
            gCtx.beginPath();
            gCtx.moveTo(guidePadding + i * guideCellSize, guidePadding);
            gCtx.lineTo(guidePadding + i * guideCellSize, canvasSize - guidePadding);
            gCtx.stroke();
            gCtx.beginPath();
            gCtx.moveTo(guidePadding, guidePadding + i * guideCellSize);
            gCtx.lineTo(canvasSize - guidePadding, guidePadding + i * guideCellSize);
            gCtx.stroke();
        }
    }

    function drawGuideStone(gCtx, x, y, player, size, canvasSize) {
        const guidePadding = 20;
        const guideCellSize = (canvasSize - guidePadding * 2) / (size - 1);
        gCtx.beginPath();
        gCtx.arc(guidePadding + x * guideCellSize, guidePadding + y * guideCellSize, guideCellSize / 2 * 0.9, 0, 2 * Math.PI);
        gCtx.fillStyle = player === 1 ? '#000' : '#fff';
        gCtx.fill();
    }

    function drawGuideMarker(gCtx, x, y, size, canvasSize, text = '×') {
        const guidePadding = 20;
        const guideCellSize = (canvasSize - guidePadding * 2) / (size - 1);
        gCtx.font = 'bold 24px sans-serif';
        gCtx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        gCtx.textAlign = 'center';
        gCtx.textBaseline = 'middle';
        gCtx.fillText(text, guidePadding + x * guideCellSize, guidePadding + y * guideCellSize);
    }

    function animateStonePlacement(gCtx, x, y, player, size, canvasSize, drawBackground) {
        return new Promise(resolve => {
            const duration = 300;
            let startTime = null;
            const animate = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const elapsedTime = timestamp - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                const p = progress;
                const c1 = 1.70158;
                const c3 = c1 + 1;
                const scale = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);

                drawBackground();
                drawGuideStoneWithAnimation(gCtx, x, y, player, size, canvasSize, scale);

                if (progress < 1) {
                    guideAnimationId = requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            guideAnimationId = requestAnimationFrame(animate);
        });
    }

    function animateStoneRemoval(gCtx, stonesToRemove, duration, boardState, size, canvasSize) {
        return new Promise(resolve => {
            const startTime = performance.now();
            const animate = (timestamp) => {
                const elapsedTime = timestamp - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                const scale = 1 - progress;
                const opacity = 1 - progress;

                drawGuideBoard(gCtx, size, canvasSize);
                boardState.forEach((row, y) => row.forEach((p, x) => {
                    const isRemoving = stonesToRemove.some(s => s.x === x && s.y === y);
                    if (p !== 0 && !isRemoving) drawGuideStone(gCtx, x, y, p, size, canvasSize);
                }));
                stonesToRemove.forEach(s => drawGuideStoneWithAnimation(gCtx, s.x, s.y, boardState[s.y][s.x], size, canvasSize, scale, opacity));

                if (progress < 1) {
                    guideAnimationId = requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            guideAnimationId = requestAnimationFrame(animate);
        });
    }

    function flashStones(gCtx, stonesToFlash, duration, boardState, size, canvasSize) {
        return new Promise(resolve => {
            const startTime = performance.now();
            const animate = (timestamp) => {
                const elapsedTime = timestamp - startTime;
                if (elapsedTime >= duration) {
                    drawGuideBoard(gCtx, size, canvasSize);
                    boardState.forEach((row, y) => row.forEach((p, x) => {
                        if (p !== 0) drawGuideStone(gCtx, x, y, p, size, canvasSize);
                    }));
                    resolve();
                    return;
                }
                const isVisible = Math.floor(elapsedTime / 300) % 2 === 0;
                drawGuideBoard(gCtx, size, canvasSize);
                boardState.forEach((row, y) => row.forEach((p, x) => {
                    if (p !== 0) {
                        const isFlashing = stonesToFlash.some(s => s.x === x && s.y === y);
                        if (!isFlashing || (isFlashing && isVisible)) {
                            drawGuideStone(gCtx, x, y, p, size, canvasSize);
                        }
                    }
                }));
                guideAnimationId = requestAnimationFrame(animate);
            };
            guideAnimationId = requestAnimationFrame(animate);
        });
    }

    function flashHintStone(gCtx, x, y, player, duration, boardState, size, canvasSize) {
        return new Promise(resolve => {
            const startTime = performance.now();
            const animate = (timestamp) => {
                const elapsedTime = timestamp - startTime;
                if (elapsedTime >= duration) {
                    drawGuideBoard(gCtx, size, canvasSize);
                    boardState.forEach((row, y) => row.forEach((p, x) => {
                        if (p !== 0) drawGuideStone(gCtx, x, y, p, size, canvasSize);
                    }));
                    resolve();
                    return;
                }
                const opacity = Math.abs(Math.sin(elapsedTime * 0.005));
                drawGuideBoard(gCtx, size, canvasSize);
                boardState.forEach((row, y) => row.forEach((p, x) => {
                    if (p !== 0) drawGuideStone(gCtx, x, y, p, size, canvasSize);
                }));
                drawGuideStoneWithAnimation(gCtx, x, y, player, size, canvasSize, 1, opacity);
                guideAnimationId = requestAnimationFrame(animate);
            };
            guideAnimationId = requestAnimationFrame(animate);
        });
    }

    /**
     * 盤面とゲーム状態を初期化する
     */
    function initializeBoardAndState() {
        // キャンバスのサイズ設定
        const containerWidth = 500; // 碁盤の描画サイズ
        canvas.width = containerWidth;
        canvas.height = containerWidth;
        cellSize = (containerWidth - PADDING * 2) / (boardSize - 1);
        window.igoAIHelpers.BOARD_SIZE = boardSize; // AIヘルパーの盤サイズも更新
    
        // ゲーム状態のリセット
        board = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));
        isBoardLocked = false; // ロックを解除
        currentPlayer = 1;
        gameOver = false;
        passCount = 0;
        history = [];
        blackCaptures = 0;
        lastMove = null; // 最後に打たれた石の情報をリセット
        whiteCaptures = 0;
        blackCapturesEl.textContent = 0;
        whiteCapturesEl.textContent = 0;
        updateTurnDisplay();
    }

    // --- ゲームロジック ---
    function handleCanvasClick(e) {
        // ゲームオーバー、ポーズ中、アニメーション中、AIのターン、観戦モードでは操作不可
        if (gameOver || isPaused || isBoardLocked || (gameMode === 'vsAI' && currentPlayer === 2) || gameMode === 'aiWatch') {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const gridX = Math.round((x - PADDING) / cellSize);
        const gridY = Math.round((y - PADDING) / cellSize);

        if (gridX < 0 || gridX >= boardSize || gridY < 0 || gridY >= boardSize) return;

        placeAndProceed(gridX, gridY, currentPlayer);
    }

    /**
     * 指定された場所に石を置くメインロジック。
     * @param {number} x - 石を置くX座標
     * @param {number} y - 石を置くY座標
     * @param {number} player - 石を置くプレイヤー (1:黒, 2:白)
     * @returns {Promise<boolean>} 石を置けたらtrue, 置けなければfalse
     */
    async function placeStone(x, y, player) {
        if (board[y][x] !== 0) {
            if (player === 1) console.log("そこにはすでに石があります");
            return false; // AIが不正な手を打たないように
        }

        // 仮に石を置く
        const tempBoard = JSON.parse(JSON.stringify(board));
        tempBoard[y][x] = player;
        
        // --- ルール1: 相手の石を取る ---
        // 石を置いたことで、隣接する相手の石の呼吸点(ダメ)が0になったら、その石を取る。
        const capturedStones = captureOpponentStones(x, y, player, tempBoard);

        // --- ルール2: 自殺手の禁止 ---
        // 石を置いた結果、今置いた石(とその仲間)の呼吸点が0になってしまう手は、基本的には禁止。
        // (ただし、その場所に置くことで相手の石を取れる場合は自殺手にならない)
        if (capturedStones.length === 0 && countLiberties(x, y, player, tempBoard) === 0) {
            if (player === 1) alert("そこは自殺手です！");
            return false;
        }

        // --- ルール3: コウ(劫)の禁止 ---
        // 特定の1つの石を交互に取り合う形になった場合、同じ盤面を繰り返すことを禁止するルール。
        // 直前の盤面と同じ状態になる手は打てない。
        const boardState = JSON.stringify(tempBoard);
        if (history.includes(boardState)) {
            // 厳密にはもっと複雑なコウのルールがありますが、今回は「直前の盤面に戻る手」を禁止しています。
            if (player === 1) alert("コウです！他の場所に打ってください。");
            return false;
        }
        
        // 手が確定
        board = tempBoard;
        history.push(boardState);
        lastMove = { x, y }; // 最後に打たれた石の座標を記録

        // アゲハマ（取った石）を計上
        if (capturedStones.length > 0) {
            if (player === 1) {
                blackCaptures += capturedStones.length;
            } else {
                whiteCaptures += capturedStones.length;
            }
            if (captureSound) playSE(captureSound.src);
        }

        if (placeStoneSound) playSE(placeStoneSound.src);

        passCount = 0;
        drawGame();
        updateCaptureDisplay(); // アゲハマ表示を更新
        switchPlayer();

        return true;
    }

    // 石を置き、次のターンに進む関数
    async function placeAndProceed(x, y, player) {
        const success = await placeStone(x, y, player);
        // placeStoneの中でswitchPlayerが呼ばれ、その中でAIターンがトリガーされるので、ここでの処理は不要
    }

    function updateCaptureDisplay() {
        blackCapturesEl.textContent = blackCaptures;
        whiteCapturesEl.textContent = whiteCaptures;
    }

    /**
     * 石を置いた結果、呼吸点が0になった相手の石を取り除く。
     * @param {number} x - 今置いた石のX座標
     * @param {number} y - 今置いた石のY座標
     * @param {number} player - 今石を置いたプレイヤー
     * @param {Array<Array<number>>} currentBoard - 盤面
     * @returns {Array} 取られた石の情報の配列
     */
    function captureOpponentStones(x, y, player, currentBoard) {
        const opponent = 3 - player;
        let allCaptured = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        directions.forEach(([dx, dy]) => {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && currentBoard[ny][nx] === opponent) {
                // 隣接する相手の石の呼吸点(ダメ)を数え、0なら取る
                if (countLiberties(nx, ny, opponent, currentBoard) === 0) {
                    const captured = getGroup(nx, ny, opponent, currentBoard);
                    captured.forEach(s => currentBoard[s.y][s.x] = 0);
                    allCaptured = allCaptured.concat(captured);
                }
            }
        });
        return allCaptured;
    }

    /**
     * 繋がっている同じ色の石の集まり(連)を取得する。再帰的に探索する。
     * @param {number} startX - 探索開始点のX座標
     * @param {number} startY - 探索開始点のY座標
     * @param {number} player - 探索する石の色
     * @param {Array<Array<number>>} currentBoard - 盤面
     * @param {Set<string>} visited - 探索済みの座標を記録するSet
     * @returns {Array<{x: number, y: number}>} 石のグループ
     */
    function getGroup(startX, startY, player, currentBoard, visited = new Set()) {
        const key = `${startX},${startY}`;
        if (visited.has(key) || startX < 0 || startX >= boardSize || startY < 0 || startY >= boardSize || currentBoard[startY][startX] !== player) {
            return [];
        }
        visited.add(key);
        let group = [{ x: startX, y: startY }];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        directions.forEach(([dx, dy]) => {
            group = group.concat(getGroup(startX + dx, startY + dy, player, currentBoard, visited));
        });
        return group;
    }

    /**
     * 指定した座標の石が含まれるグループの呼吸点(ダメ)の数を数える。
     * @param {number} startX - 石のX座標
     * @param {number} startY - 石のY座標
     * @param {number} player - 石の色
     * @param {Array<Array<number>>} currentBoard - 盤面
     * @returns {number} 呼吸点の数
     */
    function countLiberties(startX, startY, player, currentBoard) {
        // 1. まず、繋がっている石のグループ(連)をすべて見つける
        const group = getGroup(startX, startY, player, currentBoard);
        if (group.length === 0) return 0;
        const liberties = new Set();
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        // 2. グループの各石に隣接する空きマスを数える (Setで重複を除外)
        group.forEach(stone => {
            directions.forEach(([dx, dy]) => {
                const nx = stone.x + dx;
                const ny = stone.y + dy;
                if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && currentBoard[ny][nx] === 0) {
                    liberties.add(`${nx},${ny}`);
                }
            });
        });
        return liberties.size;
    }

    function switchPlayer() {
        currentPlayer = 3 - currentPlayer;
        if (gameOver) return;
        updateTurnDisplay();

        // ヒントボタンの状態更新
        if (gameMode === 'vsAI') {
            // プレイヤー(黒)のターンなら有効、AI(白)のターンなら無効
            hintBtn.disabled = (currentPlayer !== 1);
        }

        // AIのターンならAIの思考を開始
        if (!isPaused && !gameOver && ((gameMode === 'vsAI' && currentPlayer === 2) || gameMode === 'aiWatch')) {
            // 観戦モードと対戦モードで思考開始までの遅延を変える
            const delay = (gameMode === 'aiWatch')
                ? AI_WATCH_SPEEDS[aiWatchSpeed].base + Math.random() * AI_WATCH_SPEEDS[aiWatchSpeed].random
                : 500; // 対戦モードでは0.5秒固定
            aiTurnTimeoutId = setTimeout(aiTurn, delay);
        }
    }

    function updateTurnDisplay() {
        if (gameOver) return;
        if (gameMode === 'vsHuman') {
            const name = (currentPlayer === 1) ? sentePlayerName : gotePlayerName;
            turnIndicator.textContent = `${name}さんのばんです (${currentPlayer === 1 ? 'くろ' : 'しろ'})`;
        } else { // vsAI or aiWatch
            turnIndicator.textContent = (currentPlayer === 1) ? 'くろのばんです' : 'しろのばんです';
        }
    }
    
    async function handlePass(isAI = false) {
        if (gameOver) return;
        // プレイヤーのパスの場合、AIのターン中は受け付けない (vsAIモード)
        if (!isAI && gameMode === 'vsAI' && currentPlayer !== 1) return;

        // AIがパスした場合のモーダル表示
        lastMove = null; // パスされたので最後の着手点をクリア
        if (isAI) {
            aiThinkingTitle.textContent = 'AIがパスしました';
            aiThinkingLoader.style.display = 'none';
            aiThinkingModal.classList.remove('hidden');
            await sleep(1500); // 1.5秒表示
            aiThinkingModal.classList.add('hidden');
            // 次の思考のためにモーダルの内容を元に戻す
            aiThinkingLoader.style.display = 'block';
        }
        passCount++;
        drawGame(); // マーカーを消すために再描画
        if (passCount >= 2) {
            endGame();
        } else {
            switchPlayer();
            // switchPlayer内でAIターンが呼ばれるので、ここでの呼び出しは不要
        }
    }

    /**
     * ヒントボタンがクリックされたときの処理
     */
    async function handleHintClick() {
        if (gameOver || isBoardLocked || gameMode !== 'vsAI' || currentPlayer !== 1) {
            return;
        }

        // ヒントを一度使ったら、そのターンでは再度使えないようにする
        hintBtn.disabled = true;

        // 難易度「むずかしい」のAIに次の手を考えさせる
        const move = getIgoAIMove(board, history, 'hard', currentPlayer);

        if (move) {
            const hintElement = document.createElement('div');
            hintElement.classList.add('hint-highlight'); // CSSでスタイルを定義

            // ヒントのマスに重ねて表示
            // canvas上の座標を計算
            const cellCenterX = PADDING + move.x * cellSize;
            const cellCenterY = PADDING + move.y * cellSize;

            hintElement.style.position = 'absolute';
            hintElement.style.left = `${CONTAINER_PADDING + cellCenterX - cellSize / 2}px`;
            hintElement.style.top = `${CONTAINER_PADDING + cellCenterY - cellSize / 2}px`;
            hintElement.style.width = `${cellSize}px`;
            hintElement.style.height = `${cellSize}px`;

            canvas.closest('#board-container').appendChild(hintElement);

            // 3秒後にヒントを消す
            setTimeout(() => { hintElement.remove(); }, 3000);
        }
    }

    function handleResign() {
        if (gameOver) return;
        gameOver = true;
        isBoardLocked = true; // ゲーム終了なのでロック

        // スコア詳細を非表示にする
        const scoreDetails = document.getElementById('score-details');
        if (scoreDetails) scoreDetails.classList.add('hidden');

        let winner, loser, msg;
        // 投了はプレイヤーのいるモードでのみ発生する
        if (gameMode === 'vsHuman') {
            // 投了したプレイヤーの逆が勝者
            if (currentPlayer === 1) { // 黒が投了
                winner = gotePlayerName;
                loser = sentePlayerName;
            } else { // 白が投了
                winner = sentePlayerName;
                loser = gotePlayerName;
            }
            msg = `${loser}さんが「まけました」をしました。`;
        } else { // vsAI (プレイヤーは常に黒)
            winner = 'コンピューター';
            msg = 'あなたが「まけました」を しました。';
        }

        modalTitle.textContent = `${winner}のかち！`;
        modalMessage.textContent = msg;
        gameOverModal.classList.remove('hidden');
        if (gameMode === 'vsAI' && loseSound) playSE(loseSound.src);
    }

    function endGame() {
        gameOver = true;
        isBoardLocked = true; // ゲーム終了なのでロック
        const scores = calculateTerritoryAndScore();

        // スコア詳細を表示する
        const scoreDetails = document.getElementById('score-details');
        if (scoreDetails) scoreDetails.classList.remove('hidden');

        // モーダルに詳細スコアを表示
        blackTerritoryEl.textContent = scores.blackTerritory;
        blackFinalCapturesEl.textContent = scores.blackCaptures;
        blackTotalScoreEl.textContent = scores.blackTotal;
        whiteTerritoryEl.textContent = scores.whiteTerritory;
        whiteFinalCapturesEl.textContent = scores.whiteCaptures;
        whiteTotalScoreEl.textContent = scores.whiteTotal.toFixed(1); // 小数点表示

        let winner, msg;
        const scoreDiff = Math.abs(scores.blackTotal - scores.whiteTotal);

        if (scores.blackTotal > scores.whiteTotal) {
            winner = (gameMode === 'vsHuman') ? sentePlayerName : (gameMode === 'vsAI' ? 'あなた' : 'くろ');
            msg = `ごうけい ${scoreDiff.toFixed(1)} もくさで、${winner}のかちです！`;
            if (gameMode === 'vsAI' && winSound) playSE(winSound.src);
        } else if (scores.whiteTotal > scores.blackTotal) {
            winner = (gameMode === 'vsHuman') ? gotePlayerName : (gameMode === 'vsAI' ? 'コンピューター' : 'しろ');
            msg = `ごうけい ${scoreDiff.toFixed(1)} もくさで、${winner}のかちです。`;
            if (gameMode === 'vsAI' && loseSound) playSE(loseSound.src);
        } else {
            winner = "ひきわけ";
            msg = "ひきわけです！";
            if (gameMode === 'vsAI' && winSound) playSE(winSound.src);
        }

        if (winner === "ひきわけ") {
            modalTitle.textContent = "ひきわけ！";
        } else {
            modalTitle.textContent = `${winner}のかち！`;
        }
        modalMessage.textContent = msg;
        gameOverModal.classList.remove('hidden');
    }

    // 終局時の地合い計算
    function calculateTerritoryAndScore() {
        // --- 1. 地の所有者を判定 ---
        // territoryOwner: 0:未定, 1:黒の地, 2:白の地, 3:ダメ(中立)
        const territoryOwner = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));
        const visitedTerritory = Array.from({ length: boardSize }, () => Array(boardSize).fill(false));
        
        for (let y = 0; y < boardSize; y++) {
            for (let x = 0; x < boardSize; x++) {
                // 空きマスで、まだ調べていない場所から探索を開始
                if (board[y][x] === 0 && !visitedTerritory[y][x]) {
                    const area = exploreArea(x, y, visitedTerritory);
                    let owner = 0; // 0:未定
                    if (area.bordersBlack && !area.bordersWhite) {
                        owner = 1; // 黒の地
                    } else if (area.bordersWhite && !area.bordersBlack) {
                        owner = 2; // 白の地
                    } else if (area.bordersBlack && area.bordersWhite) {
                        owner = 3; // ダメ
                    }
                    // 探索した領域全体に所有者情報を書き込む
                    area.points.forEach(p => {
                        territoryOwner[p.y][p.x] = owner;
                    });
                }
            }
        }

        // --- 2. 死に石を判定 ---
        const deadStones = [];
        const visitedStones = Array.from({ length: boardSize }, () => Array(boardSize).fill(false));
        
        for (let y = 0; y < boardSize; y++) {
            for (let x = 0; x < boardSize; x++) {
                // 石があり、まだ調べていないグループから探索を開始
                if (board[y][x] !== 0 && !visitedStones[y][x]) {
                    const player = board[y][x];
                    const group = getGroup(x, y, player, board, new Set());
                    group.forEach(s => { visitedStones[s.y][s.x] = true; });

                    let isAlive = false;
                    // グループに隣接する空きマスを調べる
                    for (const stone of group) {
                        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                        for (const [dx, dy] of directions) {
                            const nx = stone.x + dx;
                            const ny = stone.y + dy;

                            if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && board[ny][nx] === 0) {
                                // 隣接する空きマスが「自分の地」であれば、そのグループは生きていると判断
                                if (territoryOwner[ny][nx] === player) {
                                    isAlive = true;
                                    break;
                                }
                            }
                        }
                        if (isAlive) break;
                    }
                    
                    // 複雑な「セキ」の形を考慮できていないため、ダメに接しているグループも生きとみなす
                    if (!isAlive) {
                        for (const stone of group) {
                            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                            for (const [dx, dy] of directions) {
                                const nx = stone.x + dx;
                                const ny = stone.y + dy;
                                if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && board[ny][nx] === 0) {
                                    if (territoryOwner[ny][nx] === 3) { // ダメに接している
                                        isAlive = true;
                                        break;
                                    }
                                }
                            }
                            if (isAlive) break;
                        }
                    }

                    if (!isAlive) {
                        deadStones.push(...group);
                    }
                }
            }
        }

        // --- 3. 日本ルールに基づいてスコアを計算 ---
        let blackTerritory = 0;
        let whiteTerritory = 0;

        // 地を数える
        for (let y = 0; y < boardSize; y++) {
            for (let x = 0; x < boardSize; x++) {
                if (board[y][x] === 0) {
                    if (territoryOwner[y][x] === 1) blackTerritory++;
                    if (territoryOwner[y][x] === 2) whiteTerritory++;
                }
            }
        }

        // 死に石をアゲハマに加算
        let deadWhiteCount = deadStones.filter(s => board[s.y][s.x] === 2).length;
        let deadBlackCount = deadStones.filter(s => board[s.y][s.x] === 1).length;

        const finalBlackCaptures = whiteCaptures + deadWhiteCount;
        const finalWhiteCaptures = blackCaptures + deadBlackCount;

        const blackTotal = blackTerritory + finalBlackCaptures;
        const whiteTotal = whiteTerritory + finalWhiteCaptures + 6.5; // コミ

        return {
            blackTerritory,
            whiteTerritory,
            blackCaptures: finalBlackCaptures,
            whiteCaptures: finalWhiteCaptures,
            blackTotal,
            whiteTotal
        };
    }

    function exploreArea(startX, startY, visited) {
        const queue = [[startX, startY]];
        visited[startY][startX] = true;
        
        let size = 0;
        let bordersBlack = false;
        let bordersWhite = false;
        const points = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        while (queue.length > 0) {
            const [x, y] = queue.shift();
            size++;
            points.push({x, y});

            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;

                if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize) {
                    if (board[ny][nx] === 0) { // 空きマス
                        if (!visited[ny][nx]) {
                            visited[ny][nx] = true;
                            queue.push([nx, ny]);
                        }
                    } else if (board[ny][nx] === 1) { // 黒石
                        bordersBlack = true;
                    } else { // 白石
                        bordersWhite = true;
                    }
                }
            }
        }
        return { size, bordersBlack, bordersWhite, points };
    }

    // --- AIロジック ---
    async function aiTurn() {
        if (gameOver || isPaused) return;

        isBoardLocked = true; // プレイヤーの入力をロック

        // 思考中モーダルを表示（内容をリセットしてから表示）
        aiThinkingTitle.textContent = 'AIが かんがえています...';
        aiThinkingLoader.style.display = 'block';
        // 思考中モーダルを表示
        aiThinkingModal.classList.remove('hidden');

        // 思考時間をランダムに設定
        const thinkingTime = (gameMode === 'aiWatch')
            ? AI_WATCH_SPEEDS[aiWatchSpeed].base + Math.random() * AI_WATCH_SPEEDS[aiWatchSpeed].random
            : 500 + Math.random() * 1000; // 0.5〜1.5秒

        await sleep(thinkingTime);

        // 待っている間にゲームがリセット/一時停止された場合は中断
        if (gameOver || isPaused) {
            aiThinkingModal.classList.add('hidden');
            isBoardLocked = false; // ロックを解除
            return;
        }

        // 外部ファイル(igo-ai.js)の関数を呼び出す
        const move = getIgoAIMove(board, history, aiLevel, currentPlayer);

        // 思考中モーダルを非表示
        aiThinkingModal.classList.add('hidden');

        // ユーザーがモーダルが消えたことを認識し、駒が置かれるのを待つための時間。
        // モーダルのフェードアウトが0.3sなので、それが完了してから
        // さらに少し待つことで、石が置かれるまでの「間」をしっかり作ります。
        await sleep(700); // 300ms (fade) + 400ms (pause)

        if (move) {
            const success = await placeStone(move.x, move.y, currentPlayer);
            if (!success) {
                console.error("AI generated an invalid move:", move);
                await handlePass(true); // 不正な手を生成したらパス扱いにする
            }
        } else {
            // 打てる場所がない場合はパス
            await handlePass(true);
        }

        // AIの石が描画された後、ユーザーが手を認識するための短い待機時間
        await sleep(250);

        // ゲームが終了していなければ、プレイヤーの入力を許可
        if (!gameOver) {
            isBoardLocked = false;
        }
    }

    function togglePause() {
        if (gameMode !== 'aiWatch' || gameOver) return;
        isPaused = !isPaused;
        if (isPaused) {
            if (aiTurnTimeoutId) clearTimeout(aiTurnTimeoutId);
            pauseBtn.textContent = 'さいかい';
            pauseBtn.classList.add('active');
        } else {
            pauseBtn.textContent = 'いちじていし';
            pauseBtn.classList.remove('active');
            // ターンを再開
            switchPlayer(); // 現在のプレイヤーから再開
        }
    }

    async function animateRule(topic) {
        // 新しいアニメーションが開始されたことを記録
        currentGuideTopic = topic;

        // 既存のアニメーションフレームがあればキャンセル
        if (guideAnimationId) cancelAnimationFrame(guideAnimationId); 

        // シチョウの時は盤面を大きくする
        const isShicho = topic === 'shicho';
        const size = isShicho ? 7 : 5;
        const canvasSize = isShicho ? 280 : 200;
        const gCtx = ruleGuideCanvas.getContext('2d');
        ruleGuideCanvas.width = canvasSize;
        ruleGuideCanvas.height = canvasSize;

        // アニメーション開始時にテキストをクリア
        ruleGuideAnimationText.innerHTML = '';

        let currentBoardState = [];

        const drawCurrentState = () => {
            drawGuideBoard(gCtx, size, canvasSize);
            currentBoardState.forEach((row, y) => row.forEach((p, x) => {
                if (p !== 0) drawGuideStone(gCtx, x, y, p, size, canvasSize);
            }));
        };

        const animationSteps = getAnimationSteps(topic, size, canvasSize);
        if (!animationSteps) {
            drawGuideBoard(gCtx, size, canvasSize);
            return;
        }

        currentBoardState = JSON.parse(JSON.stringify(animationSteps.initialBoard));
        drawCurrentState();

        for (const step of animationSteps.steps) {
            // モーダルが閉じられたか、別のルールが選択されたらアニメーションを中断
            if (ruleGuideModal.classList.contains('hidden') || currentGuideTopic !== topic) break;

            await sleep(step.delay || 0);

            switch (step.action) {
                case 'reset':
                    currentBoardState = JSON.parse(JSON.stringify(step.board));
                    ruleGuideAnimationText.innerHTML = ''; // 盤面リセット時にテキストもクリア
                    drawCurrentState();
                    break;
                case 'place':
                    await animateStonePlacement(gCtx, step.x, step.y, step.player, size, canvasSize, drawCurrentState);
                    currentBoardState[step.y][step.x] = step.player;
                    drawCurrentState();
                    break;
                case 'remove':
                    if (captureSound) playSE(captureSound.src);
                    await animateStoneRemoval(gCtx, step.stones, 300, currentBoardState, size, canvasSize);
                    step.stones.forEach(s => { currentBoardState[s.y][s.x] = 0; });
                    drawCurrentState();
                    break;
                case 'flash':
                    await flashStones(gCtx, step.stones, step.duration || 1500, currentBoardState, size, canvasSize);
                    break;
                case 'flashHint':
                    await flashHintStone(gCtx, step.x, step.y, step.player, step.duration || 2000, currentBoardState, size, canvasSize);
                    break;
                case 'marker':
                    drawGuideMarker(gCtx, step.x, step.y, size, canvasSize, step.text);
                    break;
                case 'highlight':
                    drawCurrentState();
                    gCtx.fillStyle = step.color;
                    const guidePadding = 20;
                    const guideCellSize = (canvasSize - guidePadding * 2) / (size - 1);
                    // 陣地がマスの中央に描画されるように、座標を半マス分左上にずらす
                    const startX = guidePadding + step.x * guideCellSize - guideCellSize / 2;
                    const startY = guidePadding + step.y * guideCellSize - guideCellSize / 2;
                    const width = step.w * guideCellSize;
                    const height = step.h * guideCellSize;
                    gCtx.fillRect(startX, startY, width, height);
                    break;
                case 'text':
                    // Canvasではなく、専用のdivにテキストを表示
                    ruleGuideAnimationText.innerHTML = step.text;
                    ruleGuideAnimationText.style.color = step.color || 'black';
                    ruleGuideAnimationText.style.fontSize = step.fontSize || '18px';
                    break;
                case 'button':
                    drawCurrentState();
                    drawGuideUiButton(gCtx, step.text, step.x, step.y, step.w, step.h, step.color);
                    break;
            }
        }
    }

    async function showRuleGuide(topic) {
        const data = GUIDE_DATA[topic];
        if (!data) return;

        // 新しいルールが選択されたので、現在のアニメーションを停止させる
        if (guideAnimationId) cancelAnimationFrame(guideAnimationId);
        currentGuideTopic = topic; // これから再生するトピックをセット

        ruleGuideModalTitle.innerHTML = data.title;
        ruleGuideModalText.innerHTML = data.text;
        ruleGuideModal.classList.remove('hidden');
        animateRule(topic); // アニメーションを1回だけ再生
    }

    // --- イベントリスナー設定 ---    
    function addEventListeners() {
        canvas.addEventListener('click', handleCanvasClick);
        
        // モーダル内の盤面サイズボタンのイベントリスナーを設定するヘルパー関数
        const setupBoardSizeButtons = (containerId) => {
            const container = document.getElementById(containerId);
            const buttons = container.querySelectorAll('.board-size-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    boardSize = parseInt(btn.dataset.size, 10);
                    // 同じコンテナ内のボタンの選択状態を更新
                    buttons.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                });
            });
        };

        guideButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (ruleGuideModal.classList.contains('hidden')) {
                    guideButtons.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                }
                const topic = btn.dataset.topic;
                showRuleGuide(topic);
            });
        });

        passBtn.addEventListener('click', () => handlePass(false));
        resignBtn.addEventListener('click', handleResign);
        hintBtn.addEventListener('click', handleHintClick);
        playAgainBtn.addEventListener('click', showModeSelection);

        // --- モード選択リスナー ---
        modeSelectionModal.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (mode === 'vsHuman') {
                    modeSelectionModal.classList.add('hidden');
                    playerSelectionModal.classList.remove('hidden');
                } else if (mode === 'vsAI') {
                    modeSelectionModal.classList.add('hidden');
                    difficultySelectionModal.classList.remove('hidden');
                    // 難易度選択モーダル内のボタンに現在の選択状態を反映
                    difficultySelectionModal.querySelectorAll('.difficulty-btn').forEach(dBtn => {
                        dBtn.classList.toggle('selected', dBtn.dataset.level === aiLevel);
                    });
                } else if (mode === 'aiWatch') {
                    startGame(mode);
                    startAITurn();
                }
            });
        });

        backToModeBtn.addEventListener('click', () => {
            showModeSelection();
        });

        startHumanGameBtn.addEventListener('click', () => {
            sentePlayerName = senteNameInput.value || 'プレイヤー1';
            gotePlayerName = goteNameInput.value || 'プレイヤー2';
            startGame('vsHuman');
        });

        // --- AI難易度選択モーダルリスナー ---
        difficultySelectionModal.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                aiLevel = btn.dataset.level;
                difficultySelectionModal.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
        startAIGameBtn.addEventListener('click', () => {
            difficultySelectionModal.classList.add('hidden');
            startGame('vsAI');
        });
        backToModeFromDifficultyBtn.addEventListener('click', () => {
            showModeSelection();
        });

        // 各モーダルの盤面サイズボタンを初期化
        setupBoardSizeButtons('board-size-selector-ai');
        setupBoardSizeButtons('board-size-selector-human');

        // --- 観戦モードリスナー ---
        const aiThinkingLoader = aiThinkingModal.querySelector('.loader');
        if (!aiThinkingLoader) {
            console.error("AI thinking loader element not found!");
            // You might want to create it dynamically if it's missing,
            // but for now, we'll just log an error to avoid crashes.
            return; 
        }

        pauseBtn.addEventListener('click', togglePause);
        speedBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                aiWatchSpeed = btn.dataset.speed;
                speedBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        // --- ルールガイドモーダルを閉じる処理 ---
        const closeRuleGuide = () => {
            ruleGuideModal.classList.add('hidden');
            if (guideAnimationId) cancelAnimationFrame(guideAnimationId);
            currentGuideTopic = null; // アニメーションを完全に停止させる
        };

        closeRuleGuideModalBtn.addEventListener('click', closeRuleGuide);

        ruleGuideModal.addEventListener('click', (e) => {
            if (e.target === ruleGuideModal) { // 背景のオーバーレイ部分をクリックしたか判定
                closeRuleGuide();
            }
        });
    }
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getAnimationSteps(topic, size, canvasSize) {
        const baseSteps = {
            'capture': {
                initialBoard: [[0,0,0,0,0],[0,0,2,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
                steps: [
                    { action: 'text', text: 'この しろい いしを とってみよう！', delay: 500 },
                    { action: 'delay', delay: 1500 },
                    { action: 'place', x: 2, y: 0, player: 1 },
                    { action: 'delay', delay: 500 },
                    { action: 'place', x: 3, y: 1, player: 1 },
                    { action: 'delay', delay: 500 },
                    { action: 'place', x: 2, y: 2, player: 1 },
                    { action: 'delay', delay: 1000 },
                    { action: 'text', text: 'さいごの ひとつを かこむと…' },
                    { action: 'marker', x: 1, y: 1, text: 'ここ！', delay: 1000 },
                    { action: 'delay', delay: 1000 },
                    { action: 'place', x: 1, y: 1, player: 1 },
                    { action: 'delay', delay: 200 },
                    { action: 'remove', stones: [{ x: 2, y: 1 }] },
                ]
            },
            'atari': {
                initialBoard: [[0,0,0,0,0],[0,0,2,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
                steps: [
                    { action: 'text', text: 'いしを かこんでいくと…', delay: 500 },
                    { action: 'delay', delay: 1000 },
                    { action: 'place', x: 2, y: 0, player: 1 },
                    { action: 'delay', delay: 500 },
                    { action: 'place', x: 3, y: 1, player: 1 },
                    { action: 'delay', delay: 1000 },
                    { action: 'text', text: 'にげみちが ふたつに なったね' },
                    { action: 'delay', delay: 1500 },
                    { action: 'place', x: 2, y: 2, player: 1 },
                    { action: 'delay', delay: 500 },
                    { action: 'text', text: 'アタリ！ にげみちは あと ひとつ！', color: '#a00' },
                    { action: 'flash', stones: [{ x: 2, y: 1 }], duration: 2000 },
                    { action: 'delay', delay: 500 },
                    { action: 'marker', x: 1, y: 1, text: 'ここ！', delay: 500 },
                ]
            },
            'dame': {
                initialBoard: [[0,0,0,0,0],[0,0,1,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
                steps: [
                    { action: 'text', text: 'この いしの まわりの あいているマスが…', delay: 500 },
                    { action: 'delay', delay: 1500 },
                    { action: 'marker', x: 2, y: 0, text: '×' },
                    { action: 'delay', delay: 500 },
                    { action: 'marker', x: 3, y: 1, text: '×' },
                    { action: 'delay', delay: 500 },
                    { action: 'marker', x: 2, y: 2, text: '×' },
                    { action: 'delay', delay: 500 },
                    { action: 'marker', x: 1, y: 1, text: '×' },
                    { action: 'delay', delay: 1000 },
                    { action: 'text', text: '「ダメ」だよ！', color: '#00695c' },
                ]
            },
            'ji': {
                initialBoard: [[1, 1, 1, 1, 1], [1, 0, 0, 0, 1], [0, 0, 0, 0, 0], [2, 0, 0, 0, 2], [2, 2, 2, 2, 2]],
                steps: [
                    { action: 'text', text: 'くろい いしで かこんだところが くろの じんち', delay: 500 },
                    { action: 'delay', delay: 1500 },
                    { action: 'highlight', x: 1, y: 1, w: 3, h: 1, color: 'rgba(0, 0, 0, 0.25)' },
                    { action: 'delay', delay: 2000 },
                    { action: 'text', text: 'しろい いしで かこんだところが しろの じんちだよ', delay: 500 },
                    { action: 'delay', delay: 1500 },
                    { action: 'highlight', x: 1, y: 3, w: 3, h: 1, color: 'rgba(255, 255, 255, 0.35)' },
                ]
            },
            'ko': {
                initialBoard: [[0,1,0,0,0],[1,2,1,0,0],[0,1,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
                steps: [
                    { action: 'text', text: 'くろが この しろい いしを とると…', delay: 500 },
                    { action: 'delay', delay: 1500 },
                    { action: 'place', x: 2, y: 1, player: 1 },
                    { action: 'delay', delay: 200 },
                    { action: 'remove', stones: [{ x: 1, y: 1 }] },
                    { action: 'delay', delay: 1000 },
                    { action: 'text', text: 'しろは すぐには とりかえせないよ！(コウ)', color: '#a00' },
                    { action: 'marker', x: 1, y: 1, text: '×' },
                ]
            },
            'eye': {
                initialBoard: [[2, 2, 2, 2, 0], [2, 1, 1, 2, 0], [2, 1, 0, 1, 2], [2, 1, 1, 1, 2], [2, 2, 2, 2, 2]],
                steps: [
                    { action: 'text', text: '眼が１つだと…', color: '#a00', fontSize: '20px', delay: 1000 },
                    { action: 'delay', delay: 1500 },
                    { action: 'place', x: 2, y: 2, player: 2 },
                    { action: 'delay', delay: 200 },
                    { action: 'remove', stones: [{x:1,y:1},{x:2,y:1},{x:1,y:2},{x:3,y:2},{x:1,y:3},{x:2,y:3},{x:3,y:3}] },
                    { action: 'delay', delay: 2000 },
                    { action: 'reset', board: [[1,1,1,0,0],[1,0,1,0,0],[1,1,1,0,0],[0,1,0,1,0],[0,1,1,1,0]] },
                    { action: 'text', text: '眼が２つあると生き！', color: '#00695c', fontSize: '20px', delay: 500 },
                    { action: 'delay', delay: 1500 },
                    { action: 'marker', x: 1, y: 1, text: '×' },
                    { action: 'delay', delay: 200 },
                    { action: 'marker', x: 3, y: 1, text: '×' },
                ]
            },
            'seki': {
                initialBoard: [[0,0,0,0,0],[0,1,1,1,0],[0,1,2,1,0],[0,2,0,2,0],[0,0,2,2,0]],
                steps: [
                    { action: 'text', text: 'おたがいに とれない かたち (セキ)', color: '#00695c', fontSize: '20px', delay: 1000 },
                    { action: 'delay', delay: 1500 },
                    { action: 'marker', x: 2, y: 3, text: '×' },
                ]
            },
            'damezumari': {
                initialBoard: [[0,0,0,0,0],[0,2,1,0,0],[2,1,2,0,0],[0,1,2,0,0],[0,0,2,0,0]],
                steps: [
                    { action: 'text', text: 'くろが この しろを とると…', color: '#000', fontSize: '18px', delay: 1000 },
                    { action: 'delay', delay: 1500 },
                    { action: 'place', x: 3, y: 2, player: 1 },
                    { action: 'delay', delay: 200 },
                    { action: 'remove', stones: [{ x: 2, y: 2 }] },
                    { action: 'delay', delay: 800 },
                    { action: 'flash', stones: [{ x: 3, y: 2 }], duration: 1500 },
                    { action: 'delay', delay: 200 },
                    { action: 'text', text: 'すぐに取り返されちゃう！', color: '#a00', fontSize: '18px', delay: 500 },
                    { action: 'delay', delay: 1500 },
                    { action: 'place', x: 2, y: 2, player: 2 },
                    { action: 'delay', delay: 200 },
                    { action: 'remove', stones: [{x:2,y:1},{x:1,y:2},{x:1,y:3},{x:3,y:2}] },
                    { action: 'delay', delay: 500 },
                ]
            },
            'geta': {
                initialBoard: [[0,0,0,0,0],[0,0,0,0,0],[0,0,1,0,0],[0,2,0,2,0],[0,0,0,0,0]],
                steps: [
                    { action: 'text', text: 'くろが このみちから にげようとすると…', color: '#000', fontSize: '16px', delay: 1000 },
                    { action: 'delay', delay: 1500 },
                    { action: 'place', x: 2, y: 1, player: 1 },
                    { action: 'delay', delay: 800 },
                    { action: 'text', text: 'しろが フタをして とらえる！(ゲタ)', color: '#a00', fontSize: '16px', delay: 500 },
                    { action: 'delay', delay: 1500 },
                    { action: 'place', x: 2, y: 3, player: 2 },
                    { action: 'delay', delay: 200 },
                    { action: 'remove', stones: [{x: 2, y: 1}, {x: 2, y: 2}] },
                ]
            },
            'suicide': {
                initialBoard: [[0,2,2,0,0],[2,1,0,2,0],[0,2,2,0,0],[0,0,0,0,0],[0,0,0,0,0]],
                steps: [
                    { action: 'text', text: 'ここに うつと とられちゃうから…', color: '#a00', fontSize: '16px', delay: 1000 },
                    { action: 'delay', delay: 1500 },
                    { action: 'marker', x: 2, y: 1, text: '×' },
                    { action: 'delay', delay: 2000 },
                    { action: 'reset', board: [[0,1,1,0,0],[1,2,0,1,0],[0,1,1,0,0],[0,0,0,0,0],[0,0,0,0,0]] },
                    { action: 'text', text: 'でも、あいての いしを とれるなら オーケー！', color: '#00695c', fontSize: '16px', delay: 500 },
                    { action: 'delay', delay: 1500 },
                    { action: 'place', x: 2, y: 1, player: 1 },
                    { action: 'delay', delay: 200 },
                    { action: 'remove', stones: [{ x: 1, y: 1 }] },
                ]
            },
            'ending': {
                initialBoard: Array.from({ length: 5 }, () => Array(5).fill(0)),
                steps: [
                    { action: 'button', text: 'パス', x: 50, y: 80, w: 100, h: 40 },
                    { action: 'text', text: 'くろが パス', delay: 500 },
                    { action: 'delay', delay: 1500 },
                    { action: 'text', text: 'しろも パス', delay: 500 },
                    { action: 'delay', delay: 1500 },
                    { action: 'reset', board: Array.from({ length: 5 }, () => Array(5).fill(0)) },
                    { action: 'text', text: 'ゲームしゅうりょう！', color: '#d32f2f', fontSize: '24px' },
                    { action: 'delay', delay: 2000 },
                    { action: 'reset', board: Array.from({ length: 5 }, () => Array(5).fill(0)) },
                    { action: 'button', text: 'まけました', x: 50, y: 80, w: 100, h: 40, color: '#f44336' },
                    { action: 'text', text: '「まけました」でも おわれるよ', delay: 500 },
                    { action: 'delay', delay: 1500 },
                ]
            },
            'scoring': {
                initialBoard: [[1,1,1,1,1],[1,0,0,0,1],[0,0,0,0,0],[2,0,0,0,2],[2,2,2,2,2]],
                steps: [
                    { action: 'text', text: 'まず、くろの じんちを かぞえるよ', delay: 1000 },
                    { action: 'delay', delay: 1000 },
                    { action: 'highlight', x: 1, y: 1, w: 3, h: 1, color: 'rgba(0,0,0,0.3)' },
                    { action: 'text', text: 'くろの じんちは 3もく', delay: 200 },
                    { action: 'delay', delay: 2000 },
                    { action: 'reset', board: [[1,1,1,1,1],[1,0,0,0,1],[0,0,0,0,0],[2,0,0,0,2],[2,2,2,2,2]] },
                    { action: 'text', text: 'つぎに、しろの じんちを かぞえるよ', delay: 500 },
                    { action: 'delay', delay: 1000 },
                    { action: 'highlight', x: 1, y: 3, w: 3, h: 1, color: 'rgba(255,255,255,0.4)' },
                    { action: 'text', text: 'しろの じんちは 3もく', delay: 200 },
                    { action: 'delay', delay: 2000 },
                    { action: 'reset', board: [[0,1,0,0,0],[1,2,1,0,0],[0,1,0,0,0],[0,0,0,0,0],[0,0,0,0,0]] },
                    { action: 'text', text: 'くろが とった いし(アゲハマ)は…', delay: 500 },
                    { action: 'delay', delay: 1000 },
                    { action: 'place', x: 2, y: 1, player: 1 },
                    { action: 'delay', delay: 300 },
                    { action: 'remove', stones: [{x: 1, y: 1}] },
                    { action: 'text', 'text': '1こ！', delay: 200 },
                    { action: 'delay', delay: 2000 },
                    { action: 'reset', board: Array.from({ length: 5 }, () => Array(5).fill(0)) },
                    { action: 'text', text: '【けいさん】', color: '#004d40', fontSize: '20px', delay: 200 },
                    { action: 'delay', delay: 1000 },
                    { action: 'text', text: 'くろ: 3(じ) + 1(アゲハマ) = 4てん', delay: 500 },
                    { action: 'delay', delay: 2000 },
                    { action: 'text', text: 'しろ: 3(じ) + 0(アゲハマ) + 6.5(コミ) = 9.5てん', delay: 500 },
                    { action: 'delay', delay: 2000 },
                    { action: 'text', text: 'しろの かち！', color: '#d32f2f', fontSize: '22px' },
                ]
            },
            'shicho': {
                initialBoard: Array.from({ length: 7 }, () => Array(7).fill(0)),
                steps: [
                    { action: 'reset', board: [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,2,1,0,0,0],[0,0,1,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]] },
                    { action: 'delay', delay: 500 },
                    { action: 'place', x: 4, y: 2, player: 1 }, // 黒が逃げる
                    { action: 'delay', delay: 500 },
                    { action: 'place', x: 4, y: 3, player: 2 }, // 白がアタリ
                    { action: 'delay', delay: 500 },
                    { action: 'place', x: 5, y: 3, player: 1 }, // 黒が逃げる
                    { action: 'delay', delay: 500 },
                    { action: 'place', x: 5, y: 4, player: 2 }, // 白がアタリ
                    { action: 'delay', delay: 500 },
                    { action: 'place', x: 6, y: 4, player: 1 }, // 黒が逃げる
                    { action: 'delay', delay: 500 },
                    { action: 'place', x: 6, y: 5, player: 2 }, // 白がアタリ
                    { action: 'delay', delay: 200 },
                    { action: 'remove', stones: [{x:3,y:2},{x:4,y:2},{x:4,y:3},{x:5,y:3},{x:5,y:4},{x:6,y:4}] },
                ]
            },
        };
        const definition = baseSteps[topic];
        if (!definition) return null;

        const finalSteps = [];
        for (const step of definition.steps) {
            finalSteps.push(step);
        }
        return { initialBoard: definition.initialBoard, steps: finalSteps };
    }

    // --- 実行 ---
    addEventListeners();
    showModeSelection(); // 最初にモード選択画面を表示
});
