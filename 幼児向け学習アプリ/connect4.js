document.addEventListener('DOMContentLoaded', () => {
    // 画面要素
    const titleScreen = document.getElementById('title-screen');
    const gameContainer = document.getElementById('game-container');
    const boardElement = document.getElementById('board');
    const turnIndicator = document.getElementById('turn-indicator');
    
    // モーダル要素
    const resultModal = document.getElementById('result-modal');
    const resultMessage = document.getElementById('result-message');
    
    // ボタン要素
    const modalRestartBtn = document.getElementById('modal-restart-btn');
    const backToTitleBtn = document.getElementById('back-to-title-btn');
    
    // その他
    const aiThinkingOverlay = document.getElementById('ai-thinking-overlay');
    const dropSound = document.getElementById('drop-sound');
    const winSound = document.getElementById('win-sound');

    const ROWS = 6;
    const COLS = 7;
    let board = [];
    let currentPlayer = 1; // 1: Yellow, 2: Red
    let isGameOver = false;
    let isCpuMode = true; // デフォルトはCPU対戦
    let isProcessing = false; // アニメーション中やCPU思考中
    let currentDifficulty = 'normal'; // easy, normal, hard

    // タイトル画面の要素
    const mode2pBtn = document.getElementById('mode-2p-btn');
    const modeCpuBtn = document.getElementById('mode-cpu-btn');
    const difficultySelection = document.getElementById('difficulty-selection');
    const difficultySelectButtons = document.querySelectorAll('.difficulty-select-btn');

    // --- タイトル画面の処理 ---

    mode2pBtn.addEventListener('click', () => {
        startGame(false, 'normal');
    });

    modeCpuBtn.addEventListener('click', () => {
        // 難易度選択を表示
        difficultySelection.classList.remove('hidden');
        mode2pBtn.classList.add('hidden'); // 一時的に隠す
        modeCpuBtn.classList.add('selected'); // 選択状態にする
    });

    difficultySelectButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const level = btn.dataset.level;
            startGame(true, level);
        });
    });

    function showTitleScreen() {
        gameContainer.classList.add('hidden');
        resultModal.classList.add('hidden');
        titleScreen.classList.remove('hidden');
        
        // タイトル画面の状態リセット
        difficultySelection.classList.add('hidden');
        mode2pBtn.classList.remove('hidden');
        modeCpuBtn.classList.remove('selected');
    }

    function startGame(cpuMode, difficulty) {
        isCpuMode = cpuMode;
        currentDifficulty = difficulty;
        
        titleScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        
        initGame();
    }

    // 初期化
    function initGame() {
        board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        currentPlayer = 1;
        isGameOver = false;
        isProcessing = false;
        updateTurnIndicator();
        renderBoard();
        resultModal.classList.add('hidden');
    }

    function updateTurnIndicator() {
        if (currentPlayer === 1) {
            turnIndicator.textContent = "きいろ の ばんです";
            turnIndicator.className = "turn-yellow";
        } else {
            turnIndicator.textContent = "あか の ばんです";
            turnIndicator.className = "turn-red";
        }
    }

    function renderBoard() {
        boardElement.innerHTML = '';
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.style.setProperty('--row', r); // CSSアニメーション用に何行目かを設定
                
                if (board[r][c] === 1) cell.classList.add('yellow');
                if (board[r][c] === 2) cell.classList.add('red');

                // どのセルをクリックしてもその列に落とす
                cell.addEventListener('click', () => handleHumanMove(c));
                cell.addEventListener('mouseover', () => highlightColumn(c));
                cell.addEventListener('mouseout', clearHighlights);
                
                boardElement.appendChild(cell);
            }
        }
    }

    function highlightColumn(col) {
        if (isGameOver || isProcessing) return;
        for (let r = 0; r < ROWS; r++) {
            const cellIndex = r * COLS + col;
            const cell = boardElement.children[cellIndex];
            if (cell) {
                cell.classList.add('column-hover');
            }
        }
    }

    function clearHighlights() {
        Array.from(boardElement.children).forEach(cell => cell.classList.remove('column-hover'));
    }

    function handleHumanMove(col) {
        if (isGameOver || isProcessing) return;
        // CPUモードで相手のターンの場合は操作不可
        if (isCpuMode && currentPlayer === 2) return;

        if (dropPiece(col)) {
            if (!isGameOver && isCpuMode && currentPlayer === 2) {
                isProcessing = true;
                if (aiThinkingOverlay) aiThinkingOverlay.classList.remove('is-hidden');
                setTimeout(cpuMove, 700); // 少し待ってからCPUが打つ
            }
        }
    }

    function dropPiece(col) {
        // その列の一番下の空きを探す
        let row = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][col] === 0) {
                row = r;
                break;
            }
        }

        if (row === -1) return false; // 列がいっぱい

        // 配置
        board[row][col] = currentPlayer;
        
        // 音を鳴らす
        if (dropSound) {
            dropSound.currentTime = 0;
            dropSound.play();
        }

        // 画面更新（アニメーションの代わりにCSSクラス付与で表現）
        const cellIndex = row * COLS + col;
        const cell = boardElement.children[cellIndex];
        cell.classList.add(currentPlayer === 1 ? 'yellow' : 'red');

        // 勝敗判定
        const winCells = checkWin(row, col, currentPlayer);
        if (winCells) {
            isGameOver = true;
            highlightWin(winCells);
            triggerWinConfetti(); // 花火エフェクトを開始
            if (winSound) winSound.play();
            setTimeout(() => {
                showResult(`${currentPlayer === 1 ? 'きいろ' : 'あか'} の かち！`);
            }, 1000);
        } else if (checkDraw()) {
            isGameOver = true;
            setTimeout(() => {
                showResult("ひきわけ！");
            }, 1000);
        } else {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            updateTurnIndicator();
        }
        return true;
    }

    function cpuMove() {
        if (isGameOver) {
            if (aiThinkingOverlay) aiThinkingOverlay.classList.add('is-hidden');
            isProcessing = false;
            return;
        }

        let col = -1;
        const validCols = [];
        for (let c = 0; c < COLS; c++) {
            if (board[0][c] === 0) validCols.push(c);
        }

        if (validCols.length === 0) {
            if (aiThinkingOverlay) aiThinkingOverlay.classList.add('is-hidden');
            isProcessing = false;
            return;
        }

        if (currentDifficulty === 'easy') {
            // かんたん: 完全ランダム
            col = validCols[Math.floor(Math.random() * validCols.length)];
        } else if (currentDifficulty === 'normal') {
            // ふつう: リーチがあれば反応、それ以外はランダム
            // 1. 自分が勝てる手があるか (CPU is 2)
            col = findWinningMove(board, 2); 
            // 2. 相手が勝ちそうなら防ぐ (Player is 1)
            if (col === -1) col = findWinningMove(board, 1);
            // 3. なければランダム
            if (col === -1) col = validCols[Math.floor(Math.random() * validCols.length)];
        } else {
            // むずかしい: Minimaxアルゴリズムで最善手を選ぶ
            col = getBestMoveHard();
        }

        if (col !== -1) {
            dropPiece(col);
        }

        if (aiThinkingOverlay) aiThinkingOverlay.classList.add('is-hidden');
        isProcessing = false;
    }

    // 指定したプレイヤーが勝てる手を探す
    function findWinningMove(currentBoard, piece) {
        const validCols = [];
        for (let c = 0; c < COLS; c++) {
            if (currentBoard[0][c] === 0) validCols.push(c);
        }

        for (let c of validCols) {
            // 仮想的に置いてみる
            const tempBoard = currentBoard.map(row => [...row]);
            const r = getNextOpenRow(tempBoard, c);
            if (r === -1) continue;
            tempBoard[r][c] = piece;
            if (checkWinForBoard(tempBoard, piece)) {
                return c;
            }
        }
        return -1;
    }

    // むずかしいモード用の思考ルーチン
    function getBestMoveHard() {
        const validCols = [];
        for (let c = 0; c < COLS; c++) {
            if (board[0][c] === 0) validCols.push(c);
        }

        let bestScore = -Infinity;
        let bestCol = validCols.includes(3) ? 3 : validCols[0]; // 定石として中央を優先、なければ最初の有効手

        // 1. AIが即勝利する手があれば、それを選択
        const winningMove = findWinningMove(board, 2);
        if (winningMove !== -1) {
            return winningMove;
        }

        // 2. 相手が即勝利する手があれば、それを防ぐ
        const blockingMove = findWinningMove(board, 1);
        if (blockingMove !== -1) {
            // その手をブロックした後の盤面で、相手にリーチを作らせないか簡易チェック
            const tempBoard = board.map(row => [...row]);
            const r = getNextOpenRow(tempBoard, blockingMove);
            if (r !== -1) {
                tempBoard[r][blockingMove] = 2; // ブロックする
                // ブロックした結果、相手が次に勝つ手がないか確認
                if (findWinningMove(tempBoard, 1) === -1) {
                    return blockingMove;
                }
            }
        }

        // 3. Minimaxで最善手を探す
        for (let c of validCols) {
            const tempBoard = board.map(row => [...row]);
            const r = getNextOpenRow(tempBoard, c);
            if (r === -1) continue;
            tempBoard[r][c] = 2; // AIの手 (AIはプレイヤー2)

            // 探索深度を5に設定（マシンスペックに応じて調整）
            const score = minimax(tempBoard, 5, -Infinity, Infinity, false); // 次は相手(minimizing)の番

            if (score > bestScore) {
                bestScore = score;
                bestCol = c;
            }
        }
        return bestCol;
    }

    function evaluateWindow(window, piece) {
        const opponent = piece === 1 ? 2 : 1;
        let score = 0;
        const myPieces = window.filter(p => p === piece).length;
        const opponentPieces = window.filter(p => p === opponent).length;
        const emptySlots = window.filter(p => p === 0).length;

        if (myPieces === 4) {
            score += 100000; // 勝利
        } else if (myPieces === 3 && emptySlots === 1) {
            score += 100; // リーチ
        } else if (myPieces === 2 && emptySlots === 2) {
            score += 10; // 2つ並び
        }

        if (opponentPieces === 3 && emptySlots === 1) {
            score -= 500; // 相手のリーチは防ぐ
        }

        return score;
    }

    function scorePosition(board, piece) {
        let score = 0;

        // 中央の列を重視
        const centerArray = board.map(row => row[3]);
        const centerCount = centerArray.filter(p => p === piece).length;
        score += centerCount * 6;

        // 水平方向の評価
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS - 3; c++) {
                const window = [board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]];
                score += evaluateWindow(window, piece);
            }
        }

        // 垂直方向の評価
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS - 3; r++) {
                const window = [board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]];
                score += evaluateWindow(window, piece);
            }
        }

        // 右下がり斜め方向の評価
        for (let r = 0; r < ROWS - 3; r++) {
            for (let c = 0; c < COLS - 3; c++) {
                const window = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]];
                score += evaluateWindow(window, piece);
            }
        }

        // 右上がり斜め方向の評価
        for (let r = 3; r < ROWS; r++) {
            for (let c = 0; c < COLS - 3; c++) {
                const window = [board[r][c], board[r - 1][c + 1], board[r - 2][c + 2], board[r - 3][c + 3]];
                score += evaluateWindow(window, piece);
            }
        }

        return score;
    }

    function minimax(board, depth, alpha, beta, isMaximizingPlayer) {
        const validCols = [];
        for (let c = 0; c < COLS; c++) {
            if (board[0][c] === 0) validCols.push(c);
        }

        const isTerminal = checkWinForBoard(board, 1) || checkWinForBoard(board, 2) || validCols.length === 0;
        if (depth === 0 || isTerminal) {
            if (isTerminal) {
                if (checkWinForBoard(board, 2)) return 1000000 + depth; // AI (player 2) wins
                if (checkWinForBoard(board, 1)) return -1000000 - depth; // Human (player 1) wins
                return 0; // Draw
            }
            return scorePosition(board, 2); // AI is player 2
        }

        if (isMaximizingPlayer) { // AI's turn
            let maxEval = -Infinity;
            for (let c of validCols) {
                const tempBoard = board.map(row => [...row]);
                const r = getNextOpenRow(tempBoard, c);
                if (r === -1) continue;
                tempBoard[r][c] = 2;
                const evaluation = minimax(tempBoard, depth - 1, alpha, beta, false);
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break; // Beta cutoff
            }
            return maxEval;
        } else { // Human's turn
            let minEval = Infinity;
            for (let c of validCols) {
                const tempBoard = board.map(row => [...row]);
                const r = getNextOpenRow(tempBoard, c);
                if (r === -1) continue;
                tempBoard[r][c] = 1;
                const evaluation = minimax(tempBoard, depth - 1, alpha, beta, true);
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break; // Alpha cutoff
            }
            return minEval;
        }
    }

    function getNextOpenRow(b, c) {
        for (let r = ROWS - 1; r >= 0; r--) {
            if (b[r][c] === 0) return r;
        }
        return -1;
    }

    // AI用の勝敗判定（引数のボードで判定）
    function checkWinForBoard(b, piece) {
        // 横
        for (let c = 0; c < COLS - 3; c++) {
            for (let r = 0; r < ROWS; r++) {
                if (b[r][c] == piece && b[r][c+1] == piece && b[r][c+2] == piece && b[r][c+3] == piece) return true;
            }
        }
        // 縦
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS - 3; r++) {
                if (b[r][c] == piece && b[r+1][c] == piece && b[r+2][c] == piece && b[r+3][c] == piece) return true;
            }
        }
        // 斜め上がり
        for (let c = 0; c < COLS - 3; c++) {
            for (let r = 0; r < ROWS - 3; r++) {
                if (b[r][c] == piece && b[r+1][c+1] == piece && b[r+2][c+2] == piece && b[r+3][c+3] == piece) return true;
            }
        }
        // 斜め下がり
        for (let c = 0; c < COLS - 3; c++) {
            for (let r = 3; r < ROWS; r++) {
                if (b[r][c] == piece && b[r-1][c+1] == piece && b[r-2][c+2] == piece && b[r-3][c+3] == piece) return true;
            }
        }
        return false;
    }

    function checkWin(r, c, player) {
        // 横、縦、斜め右下、斜め左下
        const directions = [
            [[0, 1], [0, -1]],
            [[1, 0], [-1, 0]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]]
        ];

        for (let axis of directions) {
            let cells = [[r, c]];
            for (let dir of axis) {
                let nr = r + dir[0];
                let nc = c + dir[1];
                while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) {
                    cells.push([nr, nc]);
                    nr += dir[0];
                    nc += dir[1];
                }
            }
            if (cells.length >= 4) return cells;
        }
        return null;
    }

    function highlightWin(cells) {
        cells.forEach(([r, c]) => {
            const index = r * COLS + c;
            boardElement.children[index].classList.add('win-highlight');
        });
    }

    function checkDraw() {
        return board[0].every(cell => cell !== 0);
    }

    function showResult(msg) {
        resultMessage.textContent = msg;
        resultModal.classList.remove('hidden');

        // 勝利メッセージが表示された時（引き分けでない場合）にポイントを追加
        if (msg.includes('かち')) {
            const pointsToAdd = 5; // 勝利で5ポイント獲得
            if (typeof window.addPoints === 'function') {
                window.addPoints(pointsToAdd);
                // TODO: ポイント獲得の演出を追加しても良い
            }
        }
    }

    function triggerWinConfetti() {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }

    modalRestartBtn.addEventListener('click', initGame);
    backToTitleBtn.addEventListener('click', showTitleScreen);

    // 最初はタイトル画面を表示（initGameは呼ばない）
    showTitleScreen();
});