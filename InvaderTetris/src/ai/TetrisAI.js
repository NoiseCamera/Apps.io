class TetrisAI {
    constructor(scene) {
        // =================================================================
        // AIの挙動設定
        // =================================================================
        this.CONFIG = {
            // --- 思考速度 ---
            ACTION_DELAY: 50, // 1アクションあたりの時間 (ms)。思考の高度化に合わせて少し速くする

            // --- 評価関数の重み ---
            // AIはこれらの数値を元に「最善手」を判断します
            SCORE_GARBAGE_CLEAR: 10000, // おじゃまブロックを消すことへの評価点
            SCORE_LINE_CLEAR: 2500,       // ラインを消すことへの評価点 (より積極的に消すように)
            SCORE_TETRIS_BONUS: 70000,    // 4ライン消し（テトリス）を達成することへのボーナス
            SCORE_AGGREGATE_HEIGHT: -800, // 全体の高さ（低いほど良い）のペナルティを強化
            SCORE_HOLES: -2500,         // 穴の数（少ないほど良い）
            SCORE_BUMPINESS: -1000,     // 盤面の凹凸（平らなほど良い）のペナルティを大幅に強化
            SCORE_SAVE_I_MINO: 5000,     // Iミノを温存/維持することへの評価点
            SCORE_WELL_BONUS: 1500,    // テトリス用の「井戸」を構築することへの評価点をさらに強化
            SCORE_PERFECT_CLEAR_BONUS: 500000, // パーフェクトクリアを達成することへの絶大なボーナス
            LOOKAHEAD_WEIGHT: 0.8,     // 二手先の評価の重み付け
            SCORE_FILL_WELL_PENALTY: -80000, // Iミノ以外で井戸を埋めることへのペナルティを大幅に強化
            SCORE_WELL_GARBAGE: -5000,   // 井戸の中にゴミがあることへのペナルティ
        };
        // =================================================================

        this.scene = scene;
        this.TETRIS_COLS = scene.CONFIG.TETRIS.COLS;
        this.TETRIS_ROWS = scene.CONFIG.TETRIS.ROWS;
        this.GARBAGE_COLOR = scene.CONFIG.TETRIS.GARBAGE_COLOR;

        this.actionPlan = []; // 実行するアクションのキュー
        this.actionTimer = null; // アクションを実行するためのタイマー
    }

    makeMove() {
        if (!this.scene.currentPiece || (this.actionTimer && this.actionTimer.isPlaying)) return;

        const bestMove = this.findBestMove();

        if (bestMove) {
            // 1. アクションプランを作成
            this.actionPlan = this.createActionPlan(bestMove);

            // 2. プランの実行を開始
            if (this.actionTimer) {
                this.actionTimer.destroy();
            }
            this.actionTimer = this.scene.time.addEvent({
                delay: this.CONFIG.ACTION_DELAY,
                callback: this.executeNextAction,
                callbackScope: this,
                loop: true
            });
        }
    }

    findBestMove() {
        // --- シナリオ1: 現在のピースをそのまま使う ---
        const bestMoveCurrent = this.calculateBestPlacementWithLookahead(this.scene.currentPiece, this.scene.nextPiece, this.scene.tetrisGrid);

        // --- シナリオ2: ホールド機能を使う ---
        let bestMoveHold = { score: -Infinity };
        if (this.scene.canHold) {
            // ホールドした場合に次に操作するピースを取得
            // ホールドが空ならNEXTピース、そうでなければHOLDピース
            const pieceToEvaluateAfterHold = this.scene.holdPiece ? this.scene.holdPiece : this.scene.nextPiece; // このピースを今使う
            const nextPieceAfterHold = this.scene.holdPiece ? this.scene.currentPiece : this.scene.nextPiece; // 次に使うのは現在のピース

            if (pieceToEvaluateAfterHold) {
                bestMoveHold = this.calculateBestPlacementWithLookahead(pieceToEvaluateAfterHold, nextPieceAfterHold, this.scene.tetrisGrid);
                bestMoveHold.useHold = true;
            }
        }

        // --- 比較と決定 ---
        // Iミノを温存するための戦略的ボーナスを追加

        // 現在のピースがIミノの場合、ホールドする手（bestMoveHold）にボーナスを与える
        if (this.scene.currentPiece && this.scene.currentPiece.key === 'I') {
            bestMoveHold.score += this.CONFIG.SCORE_SAVE_I_MINO;
        }

        // ホールド中のピースがIミノの場合、ホールドを使わない手（bestMoveCurrent）にボーナスを与える
        if (this.scene.holdPiece && this.scene.holdPiece.key === 'I') {
            bestMoveCurrent.score += this.CONFIG.SCORE_SAVE_I_MINO;
        }

        if (bestMoveHold.score > bestMoveCurrent.score) {
            return bestMoveHold;
        } else {
            return bestMoveCurrent;
        }
    }

    /**
     * 二手先（NEXTピース）まで考慮して、現在のピースの最適な配置を計算します。
     * @param {object} piece - 現在操作するピース
     * @param {object} nextPiece - 次に出現するピース
     * @param {Array<Array<number>>} grid - 現在の盤面
     * @returns {object} 最適な配置情報（スコア、座標、回転数など）
     */
    calculateBestPlacementWithLookahead(piece, nextPiece, grid) {
        let bestPlacement = { score: -Infinity };
        const originalPiece = JSON.parse(JSON.stringify(piece));

        for (let r = 0; r < 4; r++) {
            const currentShape = originalPiece.shape;
            for (let x = -2; x < this.TETRIS_COLS; x++) {
                const tempGrid = grid.map(row => [...row]);
                let y = 0;
                if (this.checkCollisionOnGrid(x, 0, currentShape, tempGrid)) continue;
                while (!this.checkCollisionOnGrid(x, y + 1, currentShape, tempGrid)) {
                    y++;
                }
                if (!this.checkCollisionOnGrid(x, y, currentShape, tempGrid)) {
                    this.placePieceOnGrid(x, y, currentShape, tempGrid, 1);
                    const currentScore = this.evaluateBoard(tempGrid, originalPiece, x, y);
                    const lookaheadScore = this.calculateBestPlacement(nextPiece, tempGrid).score; // 1手先を読む
                    const totalScore = currentScore + lookaheadScore * this.CONFIG.LOOKAHEAD_WEIGHT;

                    if (totalScore > bestPlacement.score) {
                        bestPlacement = { score: totalScore, x: x, y: y, rotations: r, shape: currentShape, useHold: false };
                    }
                }
            }
            this.rotateTemporaryPiece(originalPiece);
        }
        return bestPlacement;
    }

    calculateBestPlacement(piece, grid) {
        let bestPlacement = { score: -Infinity };
        const originalPiece = JSON.parse(JSON.stringify(piece));

        // 4回の回転を試す
        for (let r = 0; r < 4; r++) {
            const currentShape = originalPiece.shape;
            for (let x = -2; x < this.TETRIS_COLS; x++) {
                const tempGrid = grid.map(row => [...row]);
                let y = 0;
                if (this.checkCollisionOnGrid(x, 0, currentShape, tempGrid)) continue;
                while (!this.checkCollisionOnGrid(x, y + 1, currentShape, tempGrid)) {
                    y++;
                }
                if (!this.checkCollisionOnGrid(x, y, currentShape, tempGrid)) {
                    this.placePieceOnGrid(x, y, currentShape, tempGrid, 1);
                    let score = this.evaluateBoard(tempGrid, originalPiece, x, y);

                    if (score > bestPlacement.score) {
                        bestPlacement = { score: score, x: x, y: y, rotations: r, shape: currentShape, useHold: false };
                    }
                }
            }
            this.rotateTemporaryPiece(originalPiece);
        }
        return bestPlacement;
    }

    createActionPlan(bestMove) {
        const plan = [];

        // ホールドを使う場合、プランの最初に'hold'を追加
        if (bestMove.useHold) {
            plan.push('hold');
        }

        let startX;
        if (bestMove.useHold && this.scene.currentPiece) {
            // ホールドを使う場合、新しいピースは中央から出現する
            const pieceAfterHold = this.scene.holdPiece ? this.scene.holdPiece : this.scene.nextPiece;
            startX = Math.floor(this.TETRIS_COLS / 2) - Math.floor(pieceAfterHold.shape[0].length / 2);
        } else {
            // ホールドを使わない場合は、現在のピースのX座標を基準にする
            startX = this.scene.pieceX;
        }

        const targetX = bestMove.x;
        const rotations = bestMove.rotations;

        // 1. 回転アクションを追加
        for (let i = 0; i < rotations; i++) {
            plan.push('rotate');
        }

        // 2. 水平移動アクションを追加
        const dx = targetX - startX;
        const moveDir = dx > 0 ? 'right' : 'left';
        for (let i = 0; i < Math.abs(dx); i++) {
            plan.push(moveDir);
        }

        // 3. 最後にドロップアクションを追加
        plan.push('drop');

        return plan;
    }

    executeNextAction() {
        if (!this.scene.currentPiece || this.actionPlan.length === 0) {
            if (this.actionTimer) this.actionTimer.remove(false);
            return;
        }

        const action = this.actionPlan.shift();

        switch (action) {
            case 'rotate':
                this.scene.rotatePiece(true); // AIは順回転のみ使用
                break;
            case 'hold':
                this.scene.holdCurrentPiece();
                break;
            case 'left':
                this.scene.movePiece(-1, 0);
                break;
            case 'right':
                this.scene.movePiece(1, 0);
                break;
            case 'drop':
                this.scene.hardDrop(true); // AIの操作もハードドロップとして音を鳴らす
                if (this.actionTimer) this.actionTimer.remove(false);
                break;
        }
        this.scene.drawTetris(); // 各アクション後に再描画
    }

    /**
     * 評価用に一時的に保持しているピースオブジェクトを回転させます。
     * @param {object} piece - 回転させるピースオブジェクト
     */
    rotateTemporaryPiece(piece) {
        const shape = piece.shape;
        const newShape = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]));
        newShape.forEach(row => row.reverse());
        piece.shape = newShape;
    }


    evaluateBoard(grid, piece, pieceX, pieceY) {
        // このAIは、盤面を低く、平らに保ち、穴を作らず、
        // テトリス、Tスピン、パーフェクトクリアを狙うことを目的とします。
        let aggregateHeight = 0;
        let holes = 0;
        let completedLines = 0;
        let bumpiness = 0;
        const colHeights = [];

        // 各列の高さ、全体の高さ、穴の数を計算
        for (let c = 0; c < this.TETRIS_COLS; c++) {
            let colHeight = 0;
            let blockFound = false;
            for (let r = 0; r < this.TETRIS_ROWS; r++) {
                if (grid[r][c] !== 0) {
                    if (!blockFound) {
                        colHeight = this.TETRIS_ROWS - r; // この列の高さを記録
                        blockFound = true;
                    }
                } else if (blockFound) {
                    holes++; // ブロックの下にある空白は「穴」としてカウント
                }
            }
            colHeights.push(colHeight);
            aggregateHeight += colHeight;
        }

        // 盤面の最大高さが3分の1を超えたら「危険モード」に移行し、ライン消去を優先する
        const maxHeight = Math.max(...colHeights);
        const isDangerMode = maxHeight > this.TETRIS_ROWS / 3;



        // 盤面の凹凸（隣接する列の高さの差）を計算
        for (let i = 0; i < colHeights.length - 1; i++) {
            bumpiness += Math.abs(colHeights[i] - colHeights[i + 1]);
        }

        // --- テトリス用の「井戸」の評価 ---
        let maxWellDepth = 0;
        let wellColumn = -1; // 井戸が存在する列
        let wellGarbage = 0; // 井戸の中のゴミの数
        for (let c = 0; c < this.TETRIS_COLS; c++) {
            // 端の列は壁とみなす
            const leftHeight = (c > 0) ? colHeights[c - 1] : this.TETRIS_ROWS;
            const rightHeight = (c < this.TETRIS_COLS - 1) ? colHeights[c + 1] : this.TETRIS_ROWS;
            const currentHeight = colHeights[c];

            // 幅1の井戸（隣との高さの差が3以上）を高く評価する
            if (leftHeight > currentHeight && rightHeight > currentHeight) {
                const leftDiff = leftHeight - currentHeight;
                const rightDiff = rightHeight - currentHeight;
                if (leftDiff >= 3 && rightDiff >= 3) {
                    const wellDepth = Math.min(leftDiff, rightDiff);
                    if (wellDepth > maxWellDepth) {
                        maxWellDepth = wellDepth;
                        wellColumn = c;
                        // 井戸の底からゴミがないかチェック
                        wellGarbage = 0;
                        for (let r = this.TETRIS_ROWS - 1; r > this.TETRIS_ROWS - 1 - currentHeight; r--) {
                            if (grid[r][c] === 0) {
                                wellGarbage++;
                            }
                        }
                    }
                }
            }
        }

        // 消去されたライン数を計算
        let linesClearedOfGarbage = 0;
        for (let r = 0; r < this.TETRIS_ROWS; r++) {
            const row = grid[r];
            if (row.every(cell => cell !== 0)) {
                completedLines++;
                // この消されたラインにおじゃまブロックが含まれているかチェック
                if (row.some(cell => cell === this.GARBAGE_COLOR)) {
                    linesClearedOfGarbage++;
                }
            }
        }

        // 4ライン消し（テトリス）に絶大なボーナスを与える
        const tetrisBonus = (completedLines >= 4) ? this.CONFIG.SCORE_TETRIS_BONUS : 0;

        // パーフェクトクリアを評価
        let perfectClearBonus = 0;
        if (completedLines > 0 && aggregateHeight === 0) {
            perfectClearBonus = this.CONFIG.SCORE_PERFECT_CLEAR_BONUS;
        }

        // Iミノ以外で井戸を埋める行為にペナルティ
        let fillWellPenalty = 0;
        if (wellColumn !== -1 && piece.key !== 'I') {
            // 置いたピースが井戸の列にまたがっているかチェック
            if (pieceX <= wellColumn && pieceX + piece.shape[0].length > wellColumn) {
                fillWellPenalty = this.CONFIG.SCORE_FILL_WELL_PENALTY;
            }
        }

        // --- 最終スコア計算 (状況に応じて重みを変える) ---
        if (isDangerMode) {
            // 危険モード: ライン消去と盤面整理を最優先。テトリス関連の評価は無視。
            return (linesClearedOfGarbage * this.CONFIG.SCORE_GARBAGE_CLEAR * 1.5) + // おじゃま消去はさらに重要
                   (completedLines * this.CONFIG.SCORE_LINE_CLEAR * 2) +           // ライン消去の価値を2倍に
                   (aggregateHeight * this.CONFIG.SCORE_AGGREGATE_HEIGHT * 1.5) +    // 高さペナルティを1.5倍に
                   (holes * this.CONFIG.SCORE_HOLES * 2) +                         // 穴ペナルティを2倍に
                   (bumpiness * this.CONFIG.SCORE_BUMPINESS * 1.5);                // 凹凸ペナルティを1.5倍に
        } else {
            // 通常モード: テトリス狙いを含めた総合評価
            return (linesClearedOfGarbage * this.CONFIG.SCORE_GARBAGE_CLEAR) +
                   (completedLines * this.CONFIG.SCORE_LINE_CLEAR) +
                   tetrisBonus +
                   perfectClearBonus +
                   fillWellPenalty +
                   (wellGarbage * this.CONFIG.SCORE_WELL_GARBAGE) +
                   (aggregateHeight * this.CONFIG.SCORE_AGGREGATE_HEIGHT) +
                   (holes * this.CONFIG.SCORE_HOLES) +
                   (bumpiness * this.CONFIG.SCORE_BUMPINESS) +
                   (maxWellDepth * this.CONFIG.SCORE_WELL_BONUS);
        }
    }

    checkCollisionOnGrid(x, y, shape, grid) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    const newX = x + col;
                    const newY = y + row;
                    if (newX < 0 || newX >= this.TETRIS_COLS || newY >= this.TETRIS_ROWS) return true;
                    if (newY >= 0 && grid[newY][newX] !== 0) return true;
                }
            }
        }
        return false;
    }

    placePieceOnGrid(x, y, shape, grid, value) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0 && y + row >= 0) grid[y + row][x + col] = value;
            }
        }
    }
}

export default TetrisAI;
