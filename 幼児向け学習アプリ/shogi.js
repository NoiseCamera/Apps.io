// 1/7
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const gameContainer = document.getElementById('game-container');
    const boardElement = document.getElementById('shogi-board');
    const playerCapturedElement = document.getElementById('player-captured-pieces').querySelector('.pieces-holder');
    const opponentCapturedElement = document.getElementById('opponent-captured-pieces').querySelector('.pieces-holder');
    const turnDisplay = document.getElementById('turn-display');
    const undoBtn = document.getElementById('undo-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const moveGuidePieceName = document.getElementById('guide-piece-name');
    const moveGuideBoard = document.getElementById('guide-board');
    const moveGuideText = document.getElementById('guide-text');

    // --- モーダル関連の要素 ---
    const gameModeModal = document.getElementById('game-mode-modal');
    const aiLevelModal = document.getElementById('ai-level-modal');
    const gameResultModal = document.getElementById('game-result-modal');
    const aiThinkingModal = document.getElementById('ai-thinking-modal');
    const promotionModal = document.getElementById('promotion-modal');
    const pauseModal = document.getElementById('pause-modal');
    const viewBoardBtn = document.getElementById('view-board-btn');

    // --- UI要素 ---
    const watchControls = document.getElementById('watch-controls');
    const pointsCounter = document.getElementById('points-counter');
    const settingsBtn = document.getElementById('settings-btn');
    // --- ゲーム状態管理 ---
    let board = []; // 9x9の盤面状態を保持する2次元配列
    let currentPlayer = 'player'; // 'player' or 'opponent'
    let selectedPiece = null; // { piece, row, col, isCaptured }
    let gameMode = null; // 'ai', 'human', 'tsume', 'watch'
    let aiLevel = 1;
    let gameHistory = []; // 手の履歴を保存する配列
    let aiWatchSpeed = 'normal'; // 'fast', 'normal', 'slow'
    let lastMove = null; // { from: {row, col}, to: {row, col} }
    let isGameOver = false;
    let promotionPromise = null; // 成り確認のPromiseを管理
    // 一時停止関連
    let isPaused = false;
    let wasPausedBeforeSettings = false;
    let aiTurnTimeoutId = null;

    // --- 定数定義 ---
    const PLAYER = 'player';
    const OPPONENT = 'opponent';

    // 観戦モードのスピード設定
    const AI_WATCH_SPEEDS = {
        fast: { base: 200, random: 100 },   // 0.2-0.3s
        normal: { base: 500, random: 500 }, // 0.5-1.0s
        slow: { base: 1500, random: 1000 }  // 1.5-2.5s
    };

    // 駒の定義 (名前、動き、成り情報)
    const PIECE_DATA = {
        '歩': { name: '歩', displayName: '歩兵', reading: 'ふひょう', name_en: 'Pawn', moves: [[-1, 0]], promoted: 'と', description: 'まえに 1マス すすめるよ。' },
        '香': { name: '香', displayName: '香車', reading: 'きょうしゃ', name_en: 'Lance', moves: [[-Infinity, 0]], promoted: '成香', description: 'まえに なんマスでも すすめるよ。' },
        '桂': { name: '桂', displayName: '桂馬', reading: 'けいま', name_en: 'Knight', moves: [[-2, -1], [-2, 1]], promoted: '成桂', description: 'まえに 2マス、ななめに 1マス とべるよ。' },
        '銀': { name: '銀', displayName: '銀将', reading: 'ぎんしょう', name_en: 'Silver', moves: [[-1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]], promoted: '成銀', description: 'ななめ と まえに 1マス すすめるよ。' },
        '金': { name: '金', displayName: '金将', reading: 'きんしょう', name_en: 'Gold', moves: [[-1, 0], [-1, -1], [-1, 1], [0, -1], [0, 1], [1, 0]], description: 'ななめうしろ いがいに 1マス すすめるよ。' },
        '角': { name: '角', displayName: '角行', reading: 'かくぎょう', name_en: 'Bishop', moves: [[-Infinity, -Infinity], [-Infinity, Infinity], [Infinity, -Infinity], [Infinity, Infinity]], promoted: '馬', description: 'ななめに なんマスでも すすめるよ。' },
        '飛': { name: '飛', displayName: '飛車', reading: 'ひしゃ', name_en: 'Rook', moves: [[-Infinity, 0], [Infinity, 0], [0, -Infinity], [0, Infinity]], promoted: '龍', description: 'たてと よこに なんマスでも すすめるよ。' },
        '王': { name: '王', displayName: '王将', reading: 'おうしょう', name_en: 'King', moves: [[-1, 0], [-1, -1], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 1], [1, 0]], description: 'すべてのほうこうに 1マス すすめるよ。' },
        '玉': { name: '玉', displayName: '玉将', reading: 'ぎょくしょう', name_en: 'King', moves: [[-1, 0], [-1, -1], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 1], [1, 0]], description: 'すべてのほうこうに 1マス すすめるよ。' },
        'と': { name: 'と', displayName: 'と金', reading: 'ときん', name_en: 'Tokin', moves: [[-1, 0], [-1, -1], [-1, 1], [0, -1], [0, 1], [1, 0]], description: '「金」と おなじうごきだよ。' },
        '成香': { name: '成香', displayName: '成香', reading: 'なりきょう', name_en: 'Promoted Lance', moves: [[-1, 0], [-1, -1], [-1, 1], [0, -1], [0, 1], [1, 0]], description: '「金」と おなじうごきだよ。' },
        '成桂': { name: '成桂', displayName: '成桂', reading: 'なりけい', name_en: 'Promoted Knight', moves: [[-1, 0], [-1, -1], [-1, 1], [0, -1], [0, 1], [1, 0]], description: '「金」と おなじうごきだよ。' },
        '成銀': { name: '成銀', displayName: '成銀', reading: 'なりぎん', name_en: 'Promoted Silver', moves: [[-1, 0], [-1, -1], [-1, 1], [0, -1], [0, 1], [1, 0]], description: '「金」と おなじうごきだよ。' },
        '馬': { name: '馬', displayName: '龍馬', reading: 'りゅうま', name_en: 'Horse', moves: [[-Infinity, -Infinity], [-Infinity, Infinity], [Infinity, -Infinity], [Infinity, Infinity], [-1, 0], [1, 0], [0, -1], [0, 1]], description: '「角」のうごきに、たてと よこに 1マス すすめるよ。' },
        '龍': { name: '龍', displayName: '龍王', reading: 'りゅうおう', name_en: 'Dragon', moves: [[-Infinity, 0], [Infinity, 0], [0, -Infinity], [0, Infinity], [-1, -1], [-1, 1], [1, -1], [1, 1]], description: '「飛車」のうごきに、ななめに 1マス すすめるよ。' },
    };

    // 駒の価値 (AIの評価関数と成りの判断で使用)
    const PIECE_VALUES = {
        '歩': 1, '香': 3, '桂': 4, '銀': 5, '金': 6,
        '角': 8, '飛': 10,
        'と': 6, '成香': 6, '成桂': 6, '成銀': 6,
        '馬': 11, '龍': 13,
        '王': 10000, '玉': 10000
    };

    /**
     * 駒の種類に応じて、サイズを決定するためのCSSクラス名を返す
     * @param {string} pieceName - 駒の名前
     * @returns {string} - サイズ用のCSSクラス名
     */
    function getPieceSizeClass(pieceName) {
        // 成り駒の場合は、元の駒を基準にサイズを決定する
        const basePieceName = Object.keys(PIECE_DATA).find(key => PIECE_DATA[key].promoted === pieceName) || pieceName;

        switch (basePieceName) {
            case '王':
            case '玉':
                return 'size-l'; // 大
            case '飛':
            case '角':
                return 'size-m'; // 中
            case '金':
            case '銀':
                return 'size-s'; // 小
            default: // 歩, 香, 桂
                return 'size-xs'; // 極小
        }
    }
    // --- モード選択ボタンのイベントリスナー ---
    gameModeModal.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // BGMの再生を開始（ユーザー操作があった後なので安全）
            const bgm = document.getElementById('bgm');
            if (bgm && bgm.paused) {
                bgm.play().catch(error => console.error("BGMの再生に失敗しました:", error));
            }
            // 効果音をプリロード
            if (typeof preloadAudioSources === 'function') {
                preloadAudioSources(['assets/sounds/koma.mp3', 'assets/sounds/komaget.mp3', 'assets/sounds/naru.mp3']);
            }

            const mode = e.target.dataset.mode;
            gameModeModal.classList.add('hidden');

            switch (mode) {
                case 'ai':
                    aiLevelModal.classList.remove('hidden');
                    break;
                case 'human':
                    gameMode = 'human';
                    startGame();
                    break;
                case 'watch':
                    gameMode = 'watch';
                    startGame();
                    break;
            }
        });
    });

    // --- AIレベル選択ボタンのイベントリスナー ---
    aiLevelModal.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            aiLevel = parseInt(e.target.dataset.level, 10);
            gameMode = 'ai';
            aiLevelModal.classList.add('hidden');
            startGame();
        });
    });
    // AIレベル選択モーダルの「もどる」ボタン
    aiLevelModal.querySelector('.back-btn').addEventListener('click', () => {
        aiLevelModal.classList.add('hidden');
        gameModeModal.classList.remove('hidden');
    });

    // --- その他のUIイベントリスナー ---
    document.getElementById('back-to-menu-from-result-btn').addEventListener('click', resetGame);
    document.getElementById('play-again-btn').addEventListener('click', () => {
        gameHistory = []; // 「もう一度」でも履歴をリセット
        gameResultModal.classList.add('hidden');
        startGame();
    });
    viewBoardBtn.addEventListener('click', () => {
        gameResultModal.classList.add('hidden');
        // isGameOver は true のままなので、盤面は操作不可
    });
    document.getElementById('promote-yes-btn').addEventListener('click', () => resolvePromotion(true));
    document.getElementById('promote-no-btn').addEventListener('click', () => resolvePromotion(false));
    document.getElementById('back-to-menu-from-game-btn').addEventListener('click', resetGame);
    undoBtn.addEventListener('click', handleUndoClick);
    pauseBtn.addEventListener('click', toggleManualPause);

    // ゲームの一時停止・再開イベントをリッスン
    window.addEventListener('gamePaused', () => {
        // 将棋ゲームがアクティブな時だけ処理
        if (!gameContainer.classList.contains('hidden')) {
            wasPausedBeforeSettings = isPaused; // 設定を開く前の状態を記憶
            isPaused = true; // 設定画面表示中は強制的に一時停止
            if (aiTurnTimeoutId) {
                clearTimeout(aiTurnTimeoutId);
                aiTurnTimeoutId = null;
            }
            // AI思考中モーダルも隠す
            if (aiThinkingModal && !aiThinkingModal.classList.contains('hidden')) {
                aiThinkingModal.classList.add('hidden');
            }
        }
    });

    window.addEventListener('gameResumed', () => {
        if (!gameContainer.classList.contains('hidden')) {
            isPaused = wasPausedBeforeSettings; // 設定を開く前の状態に戻す

            // ゲームが再開されるべき状態（手動で一時停止されていなかった）なら、AIのターンを再開
            if (!isPaused && !isGameOver && ((gameMode === 'ai' && currentPlayer === OPPONENT) || gameMode === 'watch')) {
                aiTurnTimeoutId = setTimeout(aiTurn, 500);
            }
        }
    });

    // 観戦モードの速度変更ボタン
    const speedBtnContainer = watchControls.querySelector('.speed-btn-container');
    if (speedBtnContainer) {
        speedBtnContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.speed-btn');
            if (!button || button.classList.contains('selected')) return;

            // 他のボタンの .selected を削除
            speedBtnContainer.querySelectorAll('.speed-btn').forEach(btn => {
                btn.classList.remove('selected');
            });

            // クリックされたボタンに .selected を追加
            button.classList.add('selected');

            // 速度を更新
            aiWatchSpeed = button.dataset.speed;
        });
    }

    /**
     * ゲームを開始する
     */
    function startGame() {
        // ゲームコンテナを表示
        gameContainer.classList.remove('hidden');

        isGameOver = false;
        selectedPiece = null;
        lastMove = null;
        gameHistory = [];
        currentPlayer = PLAYER;

        // 盤面を初期化
        initializeBoard();
        renderBoard();
        updateTurnDisplay();

        // 観戦モードの場合のみ速度コントロールを表示し、「まった」ボタンを隠す
        if (gameMode === 'watch') {
            // 観戦モードではAIレベルを最強に設定
            aiLevel = 3;
            watchControls.classList.remove('hidden');
            undoBtn.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
            aiTurnTimeoutId = setTimeout(aiTurn, 1000); // 最初のAIのターンを開始
        } else {
            watchControls.classList.add('hidden');
            undoBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
        }
        gameHistory.push(cloneBoardState(board, currentPlayer, lastMove));
        updateUndoButtonState();
    }

    /**
     * ゲームをリセットしてモード選択画面に戻る
     */
    function resetGame() {
        // ゲームコンテナを非表示
        gameContainer.classList.add('hidden');

        // 盤面と状態をクリア
        // board = []; // エラーの原因だった行
        // renderBoardがエラーを起こさないように、空の盤面と持ち駒配列をセットする
        board = Array(9).fill(null).map(() => Array(9).fill(null));
        board.playerCaptured = [];
        board.opponentCaptured = [];
        isGameOver = true; // ゲーム操作を不可にする
        gameHistory = [];
        gameMode = null;
        currentPlayer = PLAYER;
        selectedPiece = null;
        isPaused = false; // 一時停止状態をリセット
        wasPausedBeforeSettings = false; // 記憶した状態もリセット
        if (aiTurnTimeoutId) clearTimeout(aiTurnTimeoutId); // 残っているタイマーをクリア
        lastMove = null;
        updateMoveGuide(null); // ガイドをリセット
        renderBoard(); // 空の盤面を描画
        gameResultModal.classList.add('hidden');
        gameModeModal.classList.remove('hidden');
        watchControls.classList.add('hidden'); // 観戦モードUIを非表示
        undoBtn.classList.add('hidden');
        pauseBtn.classList.add('hidden');
        pauseModal.classList.add('hidden');
    }

    /**
     * 将棋盤の初期配置を行う
     */
    function initializeBoard() {
        // 盤面を9x9のnullで満たされた配列として作成
        board = Array(9).fill(null).map(() => Array(9).fill(null));

        // 持ち駒用の配列を盤面オブジェクトに追加
        board.playerCaptured = [];
        board.opponentCaptured = [];

        // 初期配置の駒データ
        const initialSetup = {
            0: { 0: '香', 1: '桂', 2: '銀', 3: '金', 4: '王', 5: '金', 6: '銀', 7: '桂', 8: '香' },
            1: { 1: '飛', 7: '角' },
            2: { 0: '歩', 1: '歩', 2: '歩', 3: '歩', 4: '歩', 5: '歩', 6: '歩', 7: '歩', 8: '歩' },
            6: { 0: '歩', 1: '歩', 2: '歩', 3: '歩', 4: '歩', 5: '歩', 6: '歩', 7: '歩', 8: '歩' },
            7: { 1: '角', 7: '飛' },
            8: { 0: '香', 1: '桂', 2: '銀', 3: '金', 4: '玉', 5: '金', 6: '銀', 7: '桂', 8: '香' }
        };

        // 駒を配置
        for (let row in initialSetup) {
            for (let col in initialSetup[row]) {
                const r = parseInt(row, 10);
                const c = parseInt(col, 10);
                const pieceName = initialSetup[row][col];
                const owner = (r <= 4) ? OPPONENT : PLAYER;
                board[r][c] = { name: pieceName, owner: owner };
            }
        }
    }
    /**
     * 盤面を描画する
     */
    function renderBoard() {
        boardElement.innerHTML = '';
        playerCapturedElement.innerHTML = '';
        opponentCapturedElement.innerHTML = '';

        // 盤面のマスを描画
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;

                const piece = board[r][c];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.classList.add('piece', piece.owner, getPieceSizeClass(piece.name));
                    // 正式名称を表示
                    pieceElement.textContent = PIECE_DATA[piece.name]?.displayName || piece.name;
                if (piece.isPromoted) {
                    pieceElement.classList.add('promoted');
                }
                    cell.appendChild(pieceElement);
                }
                boardElement.appendChild(cell);
            }
        }
        // 持ち駒を描画
        renderCapturedPieces(board.playerCaptured, playerCapturedElement, PLAYER);
        renderCapturedPieces(board.opponentCaptured, opponentCapturedElement, OPPONENT);
        highlightLastMove();
    }

    /**
     * 持ち駒を描画する
     * @param {Array} capturedPieces - 持ち駒の配列
     * @param {HTMLElement} container - 描画先のコンテナ
     * @param {string} owner - 持ち駒の所有者
     */
    function renderCapturedPieces(capturedPieces, container, owner) {
        // 持ち駒を種類ごとにカウント
        const pieceCounts = capturedPieces.reduce((acc, p) => {
            acc[p.name] = (acc[p.name] || 0) + 1;
            return acc;
        }, {});

        // 駒の種類ごとに表示
        for (const pieceName in pieceCounts) {
            const piece = { name: pieceName, owner: owner };
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('piece', owner, getPieceSizeClass(piece.name));
            // 正式名称を表示
            pieceElement.textContent = PIECE_DATA[pieceName]?.displayName || pieceName;
            pieceElement.dataset.piece = JSON.stringify(piece);

            const count = pieceCounts[pieceName];
            if (count > 1) {
                const countBadge = document.createElement('span');
                countBadge.classList.add('piece-count');
                countBadge.textContent = count;
                pieceElement.appendChild(countBadge);
            }

            pieceElement.addEventListener('click', () => handleCapturedPieceClick(piece));
            container.appendChild(pieceElement);
        }
    }

    /**
     * 手番表示を更新する
     */
    function updateTurnDisplay() {
        if (isGameOver) {
            turnDisplay.textContent = "ゲームしゅうりょう";
            return;
        }
        if (gameMode === 'watch') {
            turnDisplay.textContent = (currentPlayer === PLAYER) ? "AI (せんて) のばん" : "AI (ごて) のばん";
        } else if (gameMode === 'ai') {
            turnDisplay.textContent = (currentPlayer === PLAYER) ? "あなたのばん" : "AIのばん";
        } else { // human
            turnDisplay.textContent = (currentPlayer === PLAYER) ? "あなたのばん" : "あいてのばん";
        }
    }

    /**
     * 最後の指し手をハイライトする
     */
    function highlightLastMove() {
        // 既存のハイライトを削除
        document.querySelectorAll('.last-move-from, .last-move-to').forEach(el => {
            el.classList.remove('last-move-from', 'last-move-to');
        });

        if (lastMove) {
            const { from, to } = lastMove;
            // 持ち駒を打った場合は 'from' がないので、'to' のみハイライト
            if (from && from.row !== -1) {
                const fromCell = boardElement.querySelector(`[data-row='${from.row}'][data-col='${from.col}']`);
                if (fromCell) fromCell.classList.add('last-move-from');
            }
            const toCell = boardElement.querySelector(`[data-row='${to.row}'][data-col='${to.col}']`);
            if (toCell) toCell.classList.add('last-move-to');
        }
    }
    // --- イベントハンドラ ---
    boardElement.addEventListener('click', (e) => {
        const cell = e.target.closest('.cell');
        if (!cell) return;
        handleCellClick(parseInt(cell.dataset.row, 10), parseInt(cell.dataset.col, 10));
    });

    /**
     * 盤面のセルがクリックされたときの処理
     * @param {number} row - クリックされた行
     * @param {number} col - クリックされた列
     */
    async function handleCellClick(row, col) {
        if (isGameOver) return;
        if (gameMode === 'ai' && currentPlayer === OPPONENT) return;
        if (gameMode === 'watch') return;

        const clickedPieceData = board[row][col];

        if (selectedPiece) {
            // --- 駒を選択済みの状態で、移動先をクリックした場合 ---
            const move = {
                piece: selectedPiece.piece,
                from: { row: selectedPiece.row, col: selectedPiece.col },
                to: { row, col },
                isCaptured: selectedPiece.isCaptured
            };

            // 合法手かチェック
            const possibleMoves = getPossibleMovesForPiece(board, selectedPiece.piece, selectedPiece.row, selectedPiece.col, selectedPiece.isCaptured);
            const isValidMove = possibleMoves.some(p => p.row === row && p.col === col);

            if (isValidMove) {
                await executeMove(move);
            } else {
                // 不正な移動先なので、選択を解除するか、別の自駒なら選択し直す
                if (clickedPieceData && clickedPieceData.owner === currentPlayer) {
                    selectPiece(clickedPieceData, row, col, false);
                } else {
                    deselectPiece();
                }
            }
        } else {
            // --- 駒を未選択の状態で、自駒をクリックした場合 ---
            if (clickedPieceData && clickedPieceData.owner === currentPlayer) {
                selectPiece(clickedPieceData, row, col, false);
            }
        }
    }

    /**
     * 持ち駒がクリックされたときの処理
     * @param {object} piece - クリックされた持ち駒
     */
    function handleCapturedPieceClick(piece) {
        if (isGameOver) return;
        if (gameMode === 'ai' && currentPlayer === OPPONENT) return;
        if (gameMode === 'watch') return;
        if (piece.owner !== currentPlayer) return;

        // 既に同じ駒を選択中なら選択解除、そうでなければ選択
        if (selectedPiece && selectedPiece.isCaptured && selectedPiece.piece.name === piece.name) {
            deselectPiece();
        } else {
            selectPiece(piece, -1, -1, true);
        }
    }

    /**
     * 駒を選択する
     * @param {object} piece - 選択する駒
     * @param {number} row - 駒の行 (-1なら持ち駒)
     * @param {number} col - 駒の列 (-1なら持ち駒)
     * @param {boolean} isCaptured - 持ち駒かどうか
     */
    function selectPiece(piece, row, col, isCaptured) {
        selectedPiece = { piece, row, col, isCaptured };
        updateMoveGuide(piece);
        highlightPossibleMoves();
    }

    /**
     * 駒の選択を解除する
     */
    function deselectPiece() {
        selectedPiece = null;
        // ハイライトを全て消す（セレクタが広すぎて観戦スピードボタンの .selected も消してしまう問題を修正）
        // 盤面と持ち駒台の中のハイライトだけを消すようにセレクタを限定
        boardElement.querySelectorAll('.possible-move, .selected').forEach(el => el.classList.remove('possible-move', 'selected'));
        playerCapturedElement.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        opponentCapturedElement.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        updateMoveGuide(null);
    }

    /**
     * 選択した駒の移動可能なマスをハイライトする
     */
    function highlightPossibleMoves() {
        // 既存のハイライトを全て消す
        document.querySelectorAll('.possible-move, .selected').forEach(el => {
            el.classList.remove('possible-move', 'selected');
        });

        if (!selectedPiece) return;

        const { piece, row, col, isCaptured } = selectedPiece;
        const possibleMoves = getPossibleMovesForPiece(board, piece, row, col, isCaptured);

        possibleMoves.forEach(move => {
            const cell = boardElement.querySelector(`[data-row='${move.row}'][data-col='${move.col}']`);
            if (cell) {
                cell.classList.add('possible-move');
            }
        });

        // 選択中の駒をハイライト
        if (isCaptured) {
            // 持ち駒のハイライト
            const capturedPieceElements = (piece.owner === PLAYER) ? playerCapturedElement.querySelectorAll('.piece') : opponentCapturedElement.querySelectorAll('.piece');
            capturedPieceElements.forEach(el => {
                if (JSON.parse(el.dataset.piece).name === piece.name) {
                    el.classList.add('selected');
                }
            });
        } else {
            // 盤上の駒のハイライト
            const cell = boardElement.querySelector(`[data-row='${row}'][data-col='${col}']`);
            if (cell) cell.classList.add('selected');
        }
    }

    /**
     * 駒の動きガイドを更新する
     * @param {object|null} piece - 表示する駒。nullなら初期状態に戻す
     */
    function updateMoveGuide(piece) {
        if (!moveGuideBoard || !moveGuidePieceName || !moveGuideText) return;

        moveGuideBoard.innerHTML = ''; // ガイド盤をクリア
        moveGuidePieceName.innerHTML = ''; // 駒名表示もクリア

        if (!piece) {
            moveGuidePieceName.textContent = 'こまを えらんでね';
            moveGuideText.textContent = '';
            return;
        }

        const pieceData = PIECE_DATA[piece.name];
        if (!pieceData) return;

        // 駒名（漢字）と読みがなを別々のspanで表示
        const kanjiSpan = document.createElement('span');
        kanjiSpan.className = 'kanji-name';
        kanjiSpan.textContent = pieceData.displayName;
        moveGuidePieceName.appendChild(kanjiSpan);

        const readingSpan = document.createElement('span');
        readingSpan.className = 'hiragana-reading';
        readingSpan.textContent = `(${pieceData.reading || ''})`;
        moveGuidePieceName.appendChild(readingSpan);

        moveGuideText.textContent = pieceData.description || '';

        // 5x5のガイド盤を作成
        for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
                const cell = document.createElement('div');
                cell.classList.add('guide-cell');

                if (r === 0 && c === 0) {
                    cell.classList.add('center-piece');
                    // 盤面と同じ駒エレメントを生成
                    const pieceElement = document.createElement('div');
                    // ガイドの駒は常にプレイヤー向き（回転なし）で表示
                    pieceElement.classList.add('piece', PLAYER);
                    pieceElement.textContent = PIECE_DATA[piece.name]?.displayName || piece.name;
                    if (piece.isPromoted) {
                        pieceElement.classList.add('promoted');
                    }
                    cell.appendChild(pieceElement);
                } else {
                    // このマスが移動可能かどうかをチェック
                    const isPossible = pieceData.moves.some(move => {
                        const [dr, dc] = move;
                        // 無限の動き（飛車、角、香車）の処理
                        if (Math.abs(dr) === Infinity || Math.abs(dc) === Infinity) {
                            // ガイド盤のマス(r, c)が、駒の動きの方向(dr, dc)と同じ方向にあるか
                            const sameDirection = (Math.sign(dr) === Math.sign(r) && Math.sign(dc) === Math.sign(c));
                            if (!sameDirection) return false;

                            // 方向が同じ場合、それが斜め(角)か、まっすぐ(飛,香)かを判定
                            const isDiagonalMove = Math.abs(dr) === Math.abs(dc);
                            if (isDiagonalMove) {
                                // 角の動き: (r,c)も斜め上にあるか
                                return Math.abs(r) === Math.abs(c);
                            } else {
                                // 飛車・香車の動き: (r,c)も直線上にあるか
                                return r === 0 || c === 0;
                            }
                        }
                        // 通常の動き
                        return dr === r && dc === c;
                    });
                    if (isPossible) {
                        cell.classList.add('possible');
                    }
                }
                moveGuideBoard.appendChild(cell);
            }
        }
    }

    /**
     * 手を実行する
     * @param {object} move - 実行する手
     */
    async function executeMove(move) {
        gameHistory.push(cloneBoardState(board, currentPlayer, lastMove));
        updateUndoButtonState();

        const { piece, from, to, isCaptured } = move;

        // 駒を取る動きかどうかを、盤面更新前に判定
        const isCaptureMove = !isCaptured && board[to.row] && board[to.row][to.col] !== null;

        // 観戦モードの場合、動かす駒の情報をガイドに表示する
        if (gameMode === 'watch') {
            updateMoveGuide(piece);
        }

        // --- 駒の移動アニメーション ---
        let fromElement = null;
        const toElement = boardElement.querySelector(`[data-row='${to.row}'][data-col='${to.col}']`);
        let pieceElementForClone = null;

        if (isCaptured) { // 持ち駒を打つ場合
            const fromContainer = piece.owner === PLAYER ? playerCapturedElement : opponentCapturedElement;
            // 持ち駒の中から、打つ駒と同じ種類の駒要素を探す
            const capturedPieceElements = fromContainer.querySelectorAll('.piece');
            for (const el of capturedPieceElements) {
                if (JSON.parse(el.dataset.piece).name === piece.name) {
                    fromElement = el;
                    break;
                }
            }
            pieceElementForClone = fromElement;
        } else if (from.row !== -1) { // 盤上の駒を動かす場合
            fromElement = boardElement.querySelector(`[data-row='${from.row}'][data-col='${from.col}']`);
            pieceElementForClone = fromElement ? fromElement.querySelector('.piece') : null;
        }

        if (fromElement && toElement && pieceElementForClone) {
            const fromRect = pieceElementForClone.getBoundingClientRect();

            // --- Calculate final position and size ---
            // Temporarily place a piece of the correct type in the destination cell
            // to calculate its exact final position and size. This ensures the animation
            // ends exactly where the new piece will appear, avoiding any "jumps".

            // If there's a piece to be captured, hide it temporarily so it doesn't affect the position calculation.
            const capturedPieceElement = toElement.querySelector('.piece');
            if (capturedPieceElement) {
                capturedPieceElement.style.display = 'none';
            }

            const tempPieceForSizing = document.createElement('div');
            tempPieceForSizing.classList.add('piece', piece.owner, getPieceSizeClass(piece.name));
            toElement.appendChild(tempPieceForSizing);
            const finalRect = tempPieceForSizing.getBoundingClientRect();
            toElement.removeChild(tempPieceForSizing);
            // --- End of calculation ---
            // The captured piece remains hidden (display: none) and will be removed from the DOM by the next renderBoard() call.
            const clone = pieceElementForClone.cloneNode(true);
            const countBadge = clone.querySelector('.piece-count');
            if (countBadge) countBadge.remove(); // アニメーション中は枚数表示を消す

            let initialLeft = fromRect.left,
                initialTop = fromRect.top,
                initialWidth = fromRect.width,
                initialHeight = fromRect.height;
            
            // If dropping a captured piece, the clone should start with the final (larger) size,
            // but be centered over the original small piece in the captured area.
            if (isCaptured) {
                initialWidth = finalRect.width;
                initialHeight = finalRect.height;
                initialLeft = fromRect.left - (initialWidth - fromRect.width) / 2;
                initialTop = fromRect.top - (initialHeight - fromRect.height) / 2;
            }

            clone.style.position = 'fixed';
            clone.style.left = `${initialLeft}px`;
            clone.style.top = `${initialTop}px`;
            clone.style.width = `${initialWidth}px`;
            clone.style.height = `${initialHeight}px`;
            clone.style.zIndex = '2000';
            document.body.appendChild(clone);

            if (!isCaptured) { // 盤上の駒を動かす時だけ元の駒を消す
                pieceElementForClone.style.opacity = '0';
            }

            // 移動量とスケールをCSSカスタムプロパティで設定
            const moveX = finalRect.left - initialLeft;
            const moveY = finalRect.top - initialTop;
            clone.style.setProperty('--move-x', `${moveX}px`);
            clone.style.setProperty('--move-y', `${moveY}px`);
            // The end scale is always 1 because we are animating from the initial size to the final size
            // by setting the clone's width/height directly. For captured pieces, the clone starts
            // at the final size. For board pieces, the start and end sizes are the same.
            clone.style.setProperty('--end-scale', '1');

            // AI(相手)の駒の向きをアニメーション中に維持する
            const rotation = piece.owner === OPPONENT ? 'rotate(180deg)' : 'rotate(0deg)';
            clone.style.setProperty('--piece-rotation', rotation);

            // アニメーションクラスを付与
            clone.classList.add('piece-moving-arc');

            // アニメーションの最後に効果音が鳴るようにタイマーをセット
            const animationDuration = 500; // CSSの0.5sと合わせる
            setTimeout(() => {
                if (typeof playSE === 'function') {
                    if (isCaptureMove) {
                        playSE('assets/sounds/komaget.mp3');
                    } else {
                        playSE('assets/sounds/koma.mp3');
                    }
                }
            }, animationDuration * 0.85); // 85%の時点で再生すると自然に聞こえる

            // アニメーションの終了を待つ
            await new Promise(resolve => {
                clone.addEventListener('animationend', () => {
                    clone.remove();
                    resolve();
                }, { once: true });
            });
        } else {
            // アニメーションがない場合（エラーケースなど）でも、すぐに効果音を再生
            if (typeof playSE === 'function') playSE(isCaptureMove ? 'assets/sounds/komaget.mp3' : 'assets/sounds/koma.mp3');
        }

        let promote = false;

        // --- 成りの確認 ---
        // 駒が敵陣に「入る」「動く」「出る」動きをしたときに成れる、という公式ルールに戻します。
        const canPromote = PIECE_DATA[piece.name].promoted && !isCaptured &&
            ((piece.owner === PLAYER && (to.row < 3 || from.row < 3)) || (piece.owner === OPPONENT && (to.row > 5 || from.row > 5)));

        const isForcedPromotion = (
            (piece.name === '歩' || piece.name === '香') && ((piece.owner === PLAYER && to.row === 0) || (piece.owner === OPPONENT && to.row === 8))
        ) || (
                piece.name === '桂' && ((piece.owner === PLAYER && to.row <= 1) || (piece.owner === OPPONENT && to.row >= 7))
            );

        if (isForcedPromotion) {
            promote = true;
        } else if (canPromote && (gameMode !== 'watch' && currentPlayer === PLAYER)) {
            // プレイヤーのターンで、かつ観戦モードでない場合のみ成りの確認を行う
            promote = await askForPromotion();
        } else if (canPromote && (gameMode === 'ai' || gameMode === 'watch')) {
            // AIのターンでは、価値が上がるなら常に成る（簡易ロジック）
            const originalValue = PIECE_VALUES[piece.name] || 0;
            const promotedValue = PIECE_VALUES[PIECE_DATA[piece.name].promoted] || 0;
            if (promotedValue > originalValue) {
                promote = true;
            }
        }
        move.promote = promote;

        // --- 盤面の更新 ---
        board = applyMoveToBoard(board, move);
        lastMove = { from, to };

        // --- 状態の更新 ---
        // 観戦モードでは選択解除を行わない（ガイド表示を維持するため）
        if (gameMode !== 'watch') {
            deselectPiece();
        }
        renderBoard();

        // --- 成りアニメーション ---
        if (move.promote) {
            const toCell = boardElement.querySelector(`[data-row='${move.to.row}'][data-col='${move.to.col}']`);
            if (toCell) {
                const pieceElement = toCell.querySelector('.piece');
                if (pieceElement) {
                    // 効果音を再生
                    if (typeof playSE === 'function') {
                        playSE('assets/sounds/naru.mp3');
                    }
                    // アニメーション用のクラスを追加
                    pieceElement.classList.add('promoting');
                    // アニメーションが終わるのを待ってから次の処理に進む
                    await new Promise(resolve => {
                        pieceElement.addEventListener('animationend', () => {
                            pieceElement.classList.remove('promoting');
                            resolve();
                        }, { once: true });
                    });
                }
            }
        }
        switchPlayer();
        updateUndoButtonState(); // AIのターンが終わった後、ボタンの状態を更新

        // --- ゲーム終了判定 ---
        if (isCheckmate(board, currentPlayer)) {
            handleGameOver(currentPlayer === PLAYER ? OPPONENT : PLAYER, 'checkmate');
            return;
        }

        // --- 次のターンへ ---
        if (gameMode === 'ai' && currentPlayer === OPPONENT) {
            aiTurnTimeoutId = setTimeout(aiTurn, 500);
        } else if (gameMode === 'watch' && !isGameOver) { // ゲームオーバーでなければ次の手をスケジュール
            const speed = AI_WATCH_SPEEDS[aiWatchSpeed];
            const delay = Math.random() * speed.random + speed.base;
            updateUndoButtonState(); // AIのターンに入る前にボタン状態を更新
            aiTurnTimeoutId = setTimeout(aiTurn, delay);
        }
    }

    /**
     * 観戦モードで「一時停止/再開」ボタンが押されたときの処理
     */
    function toggleManualPause() {
        if (gameMode !== 'watch' || isGameOver) return;

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
            aiTurnTimeoutId = setTimeout(aiTurn, 500);
        }
    }

    /**
     * 「まった」ボタンがクリックされたときの処理
     */
    function handleUndoClick() {
        if (isGameOver || (gameMode === 'ai' && currentPlayer === OPPONENT)) return;

        // 履歴が1つ（初期状態）しかない場合は戻れない
        if (gameHistory.length <= 1) return;

        // AI戦でプレイヤーのターンの場合、2手戻す（プレイヤーの手 + AIの応手）
        if (gameMode === 'ai' && currentPlayer === PLAYER) {
            if (gameHistory.length > 2) {
                gameHistory.pop(); // AIの応手
                gameHistory.pop(); // プレイヤーの手
            } else {
                gameHistory.pop(); // プレイヤーの手
            }
        } else {
            // それ以外（対人戦）は1手戻す
            gameHistory.pop();
        }

        // 履歴の最新の状態を復元
        const lastState = gameHistory[gameHistory.length - 1];
        restoreFromState(lastState);

        // UIを更新
        renderBoard();
        updateTurnDisplay();
        updateUndoButtonState();
        deselectPiece(); // 選択状態を解除
    }

    /**
     * 盤面の状態をディープコピーして返す
     * @param {Array} boardToClone - 盤面
     * @param {string} playerToClone - 現在のプレイヤー
     * @param {object} lastMoveToClone - 最後の指し手
     * @returns {object} 状態オブジェクト
     */
    function cloneBoardState(boardToClone, playerToClone, lastMoveToClone) {
        return {
            board: JSON.parse(JSON.stringify(boardToClone)),
            currentPlayer: playerToClone,
            lastMove: JSON.parse(JSON.stringify(lastMoveToClone)),
        };
    }

    /**
     * 保存された状態オブジェクトからゲームの状態を復元する
     * @param {object} state - 復元する状態オブジェクト
     */
    function restoreFromState(state) {
        board = state.board;
        currentPlayer = state.currentPlayer;
        lastMove = state.lastMove;
    }


    /**
     * ゲーム終了処理
     * @param {string} winner - 'player' or 'opponent'
     * @param {string} reason - 'checkmate' or 'resign'
     */
    function handleGameOver(winner, reason) {
        isGameOver = true;
        const resultMessage = gameResultModal.querySelector('#result-message');
        const resultTitle = gameResultModal.querySelector('#result-title');

        let reasonText = '';
        if (reason === 'checkmate') {
            reasonText = '詰み';
        } else if (reason === 'resign') {
            reasonText = '投了';
        }

        resultTitle.textContent = reasonText; // 「詰み」や「投了」を大きく表示

        if (gameMode === 'watch') {
            // 観戦モードの場合
            const winnerName = (winner === PLAYER) ? 'せんて(AI)' : 'ごて(AI)';
            resultMessage.textContent = `${winnerName} の かち！\nすごい しょうぶだったね！`;
        } else {
            // 通常の対戦モードの場合
            if (winner === PLAYER) {
                resultMessage.textContent = 'あなたの かち！ おめでとう！';
                addPoints(5); // 勝利で5ポイント
            } else {
                resultMessage.textContent = 'あなたの まけ… つぎは がんばろう！';
            }
        }
        gameResultModal.classList.remove('hidden');
    }

    /**
     * プレイヤーを切り替える
     */
    function switchPlayer() {
        currentPlayer = (currentPlayer === PLAYER) ? OPPONENT : PLAYER;
        updateTurnDisplay();
    }

    /**
     * AIのターン処理
     */
    async function aiTurn() {
        if (isGameOver || isPaused) return;

        // AI思考中モーダルを表示
        if (aiThinkingModal) {
            aiThinkingModal.classList.remove('hidden');
        }

        // AIに少し考えさせる時間を与える（UXのため）
        // 観戦モードでは設定された速度、対戦モードではランダムな遅延
        const thinkingTime = (gameMode === 'watch')
            ? AI_WATCH_SPEEDS[aiWatchSpeed].base + Math.random() * AI_WATCH_SPEEDS[aiWatchSpeed].random
            : 500 + Math.random() * 1000; // 0.5〜1.5秒

        // 思考時間を待つ
        await new Promise(resolve => setTimeout(resolve, thinkingTime));

        // shogi-ai.js の getAIMove を呼び出す
        const bestMove = getAIMove(board, aiLevel, currentPlayer);

        // AI思考中モーダルを隠す
        if (aiThinkingModal) {
            aiThinkingModal.classList.add('hidden');
        }

        // 駒を打つ前に少し待つ（ユーザーが思考終了を認識できるように）
        await new Promise(resolve => setTimeout(resolve, 200));

        if (bestMove) {
            await executeMove(bestMove); // awaitを追加
        } else {
            // AIが投了
            handleGameOver(currentPlayer === PLAYER ? OPPONENT : PLAYER, 'resign');
        }
    }

    /**
     * プレイヤーに成るかどうかの確認を求める
     * @returns {Promise<boolean>} - 成る場合はtrue, 成らない場合はfalse
     */
    function askForPromotion() {
        return new Promise(resolve => {
            promotionPromise = resolve;
            promotionModal.classList.remove('hidden');
        });
    }

    /**
     * 成り確認のPromiseを解決する
     * @param {boolean} promote - 成るかどうか
     */
    function resolvePromotion(promote) {
        if (promotionPromise) {
            promotionPromise(promote);
            promotionPromise = null;
            promotionModal.classList.add('hidden');
        }
    }

    /**
     * 「まった」ボタンの有効/無効状態を更新する
     */
    function updateUndoButtonState() {
        if (!undoBtn) return;
        // 履歴が1つ（初期状態）より多い場合、かつAIのターン中でない場合に有効化
        undoBtn.disabled = gameHistory.length <= 1 || (gameMode === 'ai' && currentPlayer === OPPONENT);
    }

    // --- ゲームロジック関数 (グローバルスコープ) ---
    // 以下の関数は shogi-ai.js からも参照されるため、グローバルスコープに配置します。

    /**
     * 盤面に手を適用した新しい盤面状態を返す（非破壊的）
     * @param {Array} currentBoard - 現在の盤面
     * @param {object} move - 適用する手
     * @returns {Array} - 手が適用された新しい盤面
     */
    window.applyMoveToBoard = function (currentBoard, move) {
        // ディープコピーで元の盤面を破壊しないようにする。
        // 配列に付与したプロパティ(playerCapturedなど)はJSON.stringifyで失われるため、
        // 別々にコピーして再結合する。
        const newBoard = JSON.parse(JSON.stringify(currentBoard)); // 9x9の盤面部分をコピー
        newBoard.playerCaptured = JSON.parse(JSON.stringify(currentBoard.playerCaptured || []));
        newBoard.opponentCaptured = JSON.parse(JSON.stringify(currentBoard.opponentCaptured || []));
        const { piece, from, to, isCaptured, promote } = move;

        if (isCaptured) {
            // 持ち駒を打つ場合
            const owner = piece.owner;
            const capturedArray = (owner === PLAYER) ? newBoard.playerCaptured : newBoard.opponentCaptured;
            const pieceIndex = capturedArray.findIndex(p => p.name === piece.name);
            if (pieceIndex > -1) {
                capturedArray.splice(pieceIndex, 1);
                newBoard[to.row][to.col] = { ...piece };
            }
        } else {
            // 盤上の駒を動かす場合
            const movingPiece = newBoard[from.row][from.col];
            const targetPiece = newBoard[to.row][to.col];

            if (targetPiece) {
                // 駒を取る場合
                const capturedArray = (movingPiece.owner === PLAYER) ? newBoard.playerCaptured : newBoard.opponentCaptured;
                // 取った駒は元の名前に戻す
                const originalName = Object.keys(PIECE_DATA).find(key => PIECE_DATA[key].promoted === targetPiece.name) || targetPiece.name;
                capturedArray.push({ name: originalName, owner: movingPiece.owner });
            }

            newBoard[to.row][to.col] = movingPiece;
            newBoard[from.row][from.col] = null;

            // 成る場合
            if (promote) {
                const promotedName = PIECE_DATA[movingPiece.name].promoted;
                if (promotedName) {
                    newBoard[to.row][to.col].name = promotedName;
                    newBoard[to.row][to.col].isPromoted = true;
                }
            }
        }
        return newBoard;
    }
    /**
     * 特定の駒が移動可能なすべてのマスを返す（禁じ手は考慮しない）
     * @param {Array} boardState - 盤面状態
     * @param {object} piece - 駒オブジェクト
     * @param {number} row - 駒の行 (-1なら持ち駒)
     * @param {number} col - 駒の列 (-1なら持ち駒)
     * @param {boolean} isCaptured - 持ち駒かどうか
     * @returns {Array<{row: number, col: number}>} - 移動可能なマスの配列
     */
    window.getPossibleMovesForPiece = function (boardState, piece, row, col, isCaptured) {
        if (isCaptured) {
            // 持ち駒を打つ場合
            const moves = [];
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (boardState[r][c] === null) {
                        // 二歩チェック
                        if (piece.name === '歩') {
                            let isNifu = false;
                            for (let i = 0; i < 9; i++) {
                                const p = boardState[i][c];
                                if (p && p.name === '歩' && p.owner === piece.owner) {
                                    isNifu = true;
                                    break;
                                }
                            }
                            if (isNifu) continue;
                        }
                        // 行き所のない駒チェック
                        if ((piece.name === '歩' || piece.name === '香') && r === (piece.owner === PLAYER ? 0 : 8)) continue;
                        if (piece.name === '桂' && (piece.owner === PLAYER ? r <= 1 : r >= 7)) continue;

                        moves.push({ row: r, col: c });
                    }
                }
            }
            return moves;
        }

        // 盤上の駒を動かす場合
        const moves = [];
        const pieceData = PIECE_DATA[piece.name];
        if (!pieceData) return [];

        const direction = (piece.owner === PLAYER) ? 1 : -1;

        for (const move of pieceData.moves) {
            const [dr, dc] = move;
            const isInfinite = Math.abs(dr) === Infinity || Math.abs(dc) === Infinity;

            if (isInfinite) {
                // 飛車、角、香車のような長い動き
                const rStep = Math.sign(dr);
                const cStep = Math.sign(dc);
                for (let i = 1; i < 9; i++) {
                    const newRow = row + (i * rStep * direction);
                    const newCol = col + (i * cStep * direction);

                    if (newRow < 0 || newRow >= 9 || newCol < 0 || newCol >= 9) break;
                    const targetPiece = boardState[newRow][newCol];
                    if (targetPiece) {
                        // 相手の駒で、かつ王様でなければ取れる
                        if (targetPiece.owner !== piece.owner && targetPiece.name !== '王' && targetPiece.name !== '玉') {
                            moves.push({ row: newRow, col: newCol });
                        }
                        break; // 自分の駒か相手の王様なら、そこで止まる
                    }
                    moves.push({ row: newRow, col: newCol });
                }
            } else {
                // 短い動き
                const newRow = row + (dr * direction);
                const newCol = col + (dc * direction);
                if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
                    const targetPiece = boardState[newRow][newCol];
                    // 空きマスか、相手の駒（王様以外）なら移動できる
                    if (!targetPiece || (targetPiece.owner !== piece.owner && targetPiece.name !== '王' && targetPiece.name !== '玉')) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
            }
        }
        return moves;
    }
    /**
     * 特定の駒が攻撃可能なすべてのマスを返す（王を取る動きも含む、禁じ手は考慮しない）
     * isCheckの判定のために使用する
     * @param {Array} boardState - 盤面状態
     * @param {object} piece - 駒オブジェクト
     * @param {number} row - 駒の行
     * @param {number} col - 駒の列
     * @returns {Array<{row: number, col: number}>} - 攻撃可能なマスの配列
     */
    function getAttackMovesForPiece(boardState, piece, row, col) {
        // この関数は盤上の駒専用
        const moves = [];
        const pieceData = PIECE_DATA[piece.name];
        if (!pieceData) return [];

        const direction = (piece.owner === PLAYER) ? 1 : -1;

        for (const move of pieceData.moves) {
            const [dr, dc] = move;
            const isInfinite = Math.abs(dr) === Infinity || Math.abs(dc) === Infinity;

            if (isInfinite) {
                // 飛車、角、香車のような長い動き
                const rStep = Math.sign(dr);
                const cStep = Math.sign(dc);
                for (let i = 1; i < 9; i++) {
                    const newRow = row + (i * rStep * direction);
                    const newCol = col + (i * cStep * direction);
                    if (newRow < 0 || newRow >= 9 || newCol < 0 || newCol >= 9) break;
                    moves.push({ row: newRow, col: newCol }); // 利きなので、駒があっても追加
                    if (boardState[newRow][newCol]) break; // 駒にぶつかったらそこで終わり
                }
            } else {
                // 短い動き
                const newRow = row + (dr * direction);
                const newCol = col + (dc * direction);
                if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        return moves;
    }
    /**
     * 指定されたプレイヤーの全ての合法手（王手放置などを除く）を返す
     * @param {Array} boardState - 盤面状態
     * @param {string} player - 'player' or 'opponent'
     * @returns {Array<object>} - 合法手の配列
     */
    window.getAllPossibleMoves = function (boardState, player) {
        const allMoves = [];
        // 盤上の駒の動き
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = boardState[r][c];
                if (piece && piece.owner === player) {
                    const possibleMoves = getPossibleMovesForPiece(boardState, piece, r, c, false);
                    for (const move of possibleMoves) {
                        allMoves.push({ piece, from: { row: r, col: c }, to: move, isCaptured: false });
                    }
                }
            }
        }
        // 持ち駒を打つ動き
        const capturedPieces = (player === PLAYER) ? boardState.playerCaptured : boardState.opponentCaptured;
        const uniqueCaptured = [...new Map(capturedPieces.map(p => [p.name, p])).values()]; // 駒種ごとに1つ
        for (const piece of uniqueCaptured) {
            const possibleDrops = getPossibleMovesForPiece(boardState, piece, -1, -1, true);
            for (const drop of possibleDrops) {
                // 打ち歩詰めチェック
                if (piece.name === '歩') {
                    const tempBoard = applyMoveToBoard(boardState, { piece, from: { row: -1, col: -1 }, to: drop, isCaptured: true, promote: false });
                    const opponent = (player === PLAYER) ? OPPONENT : PLAYER;
                    if (isCheckmate(tempBoard, opponent)) {
                        continue; // 打ち歩詰めは禁じ手
                    }
                }
                allMoves.push({ piece, from: { row: -1, col: -1 }, to: drop, isCaptured: true });
            }
        }

        // 王手放置などの反則手をフィルタリング
        const legalMoves = allMoves.filter(move => {
            const tempBoard = applyMoveToBoard(boardState, move);
            return !isCheck(tempBoard, player);
        });

        return legalMoves;
    }

    /**
     * 指定されたプレイヤーが王手されているかチェックする
     * @param {Array} boardState - 盤面状態
     * @param {string} player - チェックされるプレイヤー
     * @returns {boolean} - 王手されていればtrue
     */
    window.isCheck = function (boardState, player) {
        const opponent = (player === PLAYER) ? OPPONENT : PLAYER;
        let kingPosition = null;

        // 王（玉）の位置を探す
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = boardState[r][c];
                if (piece && (piece.name === '王' || piece.name === '玉') && piece.owner === player) {
                    kingPosition = { row: r, col: c };
                    break;
                }
            }
            if (kingPosition) break;
        }

        if (!kingPosition) return false; // 王がいなければ王手はありえない

        // 相手の全ての駒が、王の位置に移動できるかチェック
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = boardState[r][c];
                if (piece && piece.owner === opponent) {
                    // ★変更: 駒の「利き」をチェックする専用の関数を使う
                    const moves = getAttackMovesForPiece(boardState, piece, r, c);
                    if (moves.some(move => move.row === kingPosition.row && move.col === kingPosition.col)) {
                        return true; // 王に利きがある
                    }
                }
            }
        }

        // 王手は盤上の駒からのみ発生する。持ち駒を打つことによる王手(打ち歩詰めなど)は
        // getAllPossibleMovesの中で、手を適用した後の盤面でisCheckmateを呼ぶことで判定される。
        // したがって、ここでは盤上の駒の利きのみをチェックすればよい。
        return false;
    }

    /**
     * 指定されたプレイヤーが詰んでいるかチェックする
     * @param {Array} boardState - 盤面状態
     * @param {string} player - チェックされるプレイヤー
     * @returns {boolean} - 詰んでいればtrue
     */
    window.isCheckmate = function (boardState, player) {
        // 1. 王手がかかっているか？
        if (!isCheck(boardState, player)) {
            return false;
        }

        // 2. 王手を回避する手があるか？
        const legalMoves = getAllPossibleMoves(boardState, player);
        // 合法手（王手を回避できる手）が一つもなければ詰み
        return legalMoves.length === 0;
    }
});
