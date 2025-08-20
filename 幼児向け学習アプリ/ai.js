/**
 * オセロのAI思考ロジックをカプセル化したクラス。
 * ミニマックス法（ネガマックス法）とαβ法を用いて、最善手を探索します。
 */
class OthelloAI {
    constructor(player, opponent, difficulty) {
        this.player = player; // AIの石 (例: 2)
        this.opponent = opponent; // 相手の石 (例: 1)
        this.searchDepth = this.getSearchDepth(difficulty);

        // 石をひっくり返せるかチェックするための8方向のベクトル
        this.directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        /**
         * 盤面の各マスの価値を定義した評価値テーブル。
         * AIは、この値が高いマスに石を置くことを優先します（例: 角は120点と非常に高い）。
         */
        this.positionalWeights = [
            [120, -20, 20, 5, 5, 20, -20, 120],
            [-20, -40, -5, -5, -5, -5, -40, -20],
            [20, -5, 15, 3, 3, 15, -5, 20],
            [5, -5, 3, 3, 3, 3, -5, 5],
            [5, -5, 3, 3, 3, 3, -5, 5],
            [20, -5, 15, 3, 3, 15, -5, 20],
            [-20, -40, -5, -5, -5, -5, -40, -20],
            [120, -20, 20, 5, 5, 20, -20, 120]
        ];
    }

    /**
     * 難易度設定に応じて、AIが何手先まで読み込むか（探索深度）を決定します。
     * @param {string} difficulty - 難易度 ('Weak', 'Normal', 'Strong', 'Strongest')
     * @returns {number} 探索深度
     */
    getSearchDepth(difficulty) {
        switch (difficulty) {
            case 'Weak': return 1;
            case 'Normal': return 3;
            case 'Strong': return 5;
            case 'Strongest': return 7; // 注意: 探索深度が深いと非常に時間がかかります
            default: return 3;
        }
    }

    /**
     * AIの思考を開始し、最善手を決定するメイン関数。
     * @param {number[][]} board - 現在の盤面情報
     * @param {object[]} validMoves - AIが現在打てる手のリスト
     * @returns {object|null} 最善手 (例: {row: 5, col: 3})、またはnull
     */
    findBestMove(board, validMoves) {
        let bestMove = null;
        let bestScore = -Infinity;

        // 同じスコアの最善手が複数ある場合に、そのうちの1つをランダムに選ぶためのリスト
        let bestMoves = [];

        // ★★★ 変更点: 「よわい」モードの特別ロジック ★★★
        // 探索深度が1（よわい）の場合、複雑な評価はせず、
        // 単純に「最も多くの石をひっくり返せる手」を選ぶように変更します。
        // これにより、AIが目先の利益に飛びつく、より子供らしい思考になります。
        if (this.searchDepth === 1) {
            let bestFlippableCount = -1;

            for (const move of validMoves) {
                const flippableCount = this.calculateFlippableStones(board, move.row, move.col, this.player).length;
                if (flippableCount > bestFlippableCount) {
                    bestFlippableCount = flippableCount;
                    bestMoves = [move];
                } else if (flippableCount === bestFlippableCount) {
                    bestMoves.push(move);
                }
            }
            // 最も多く返せる手が複数ある場合は、その中からランダムに選ぶ
            return bestMoves.length > 0 ? bestMoves[Math.floor(Math.random() * bestMoves.length)] : null;
        }
        // ★★★ 変更ここまで ★★★

        /**
         * 探索効率を上げるための工夫（ソート）。
         * あらかじめ簡易的な評価関数（ヒューリスティック）で有望そうな手から順に並べ替えることで、
         * 無駄な探索（αβカット）が発生しやすくなり、より速く良い手を見つけられます。
         */
        const sortedMoves = validMoves.sort((a, b) => {
            const scoreA = this.calculateHeuristicScore(board, a, this.player);
            const scoreB = this.calculateHeuristicScore(board, b, this.player);
            return scoreB - scoreA; // 降順ソート
        });

        // ソートされた手の中から、それぞれの手を打った場合の未来を予測していく
        for (const move of sortedMoves) {
            const newBoard = this.getBoardAfterMove(board, move, this.player);
            // negamax関数を呼び出して、その手を打った後の盤面のスコアを計算する。
            // 相手のターンになるので、スコアはマイナス(-)で反転させる。
            const score = -this.negamax(newBoard, this.searchDepth - 1, -Infinity, Infinity, this.opponent);

            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move]; // 新しい最高のスコアが見つかった場合はリストをリセット
            } else if (score === bestScore) {
                bestMoves.push(move); // 同じスコアの手をリストに追加
            }
        }

        // 同じスコアの最善手が複数あった場合、その中からランダムに1つ選ぶことで、AIの指し手に多様性を持たせる
        if (bestMoves.length > 0) {
            bestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }

        return bestMove;
    }
    // ai.js (2/5)

    // ネガマックス法による探索（αβカットあり）
    // 自分のスコアを最大化し、相手のスコアを最小化（＝相手のスコアのマイナスを最大化）する考え方
    negamax(board, depth, alpha, beta, currentPlayer) {
        // 基本条件: 探索深度が0またはゲームが終了した場合
        if (depth === 0 || this.isGameOver(board)) {
            // 評価関数は常にAI(this.player)視点のスコアを返す
            // そのため、現在の手番が相手(opponent)ならスコアを反転させる
            const score = this.calculateStaticBoardScore(board);
            return (currentPlayer === this.player) ? score : -score;
        }

        const validMoves = this.getValidMoves(board, currentPlayer);

        // パスの場合
        if (validMoves.length === 0) {
            const opponent = this.getOpponent(currentPlayer);
            // 相手もパスできる手がない場合、ゲーム終了
            if (this.getValidMoves(board, opponent).length === 0) {
                const score = this.calculateStaticBoardScore(board);
                return (currentPlayer === this.player) ? score : -score;
            }
            // 自分の手番をパスして、相手のターンとして再帰（スコアとalpha/betaを反転）
            return -this.negamax(board, depth - 1, -beta, -alpha, opponent);
        }

        let bestScore = -Infinity;
        for (const move of validMoves) {
            const newBoard = this.getBoardAfterMove(board, move, currentPlayer);
            // その手を打った後の盤面について、相手のターンとして再帰的に探索する。
            const score = -this.negamax(newBoard, depth - 1, -beta, -alpha, this.getOpponent(currentPlayer));

            if (score > bestScore) {
                bestScore = score;
            }
            // α値（これまでに見つけた最善手のスコア）を更新
            alpha = Math.max(alpha, bestScore);

            /**
             * αβカット（アルファベータ法）。
             * もしα（自分が見つけた最善手）がβ（相手が許容する最低スコア）以上になったら、
             * 相手はそもそもこの手に至る前の手を選ばないはずなので、これ以上この分岐を探索しても無駄になる。
             */
            if (beta <= alpha) {
                break;
            }
        }
        return bestScore;
    }

    /**
     * 評価関数。盤面の状況を分析し、AIにとってどれくらい有利かを数値（スコア）で返します。
     * このスコアが高いほど、AIにとって有利な盤面と判断されます。
     * @param {number[][]} board - 評価する盤面
     * @returns {number} 盤面の評価スコア
     */
    calculateStaticBoardScore(board) {
        const counts = this.countStones(board);
        const totalStones = counts.total;

        // ゲーム終盤（石が52個以上）は、単純な石の数で勝敗が決まるため、石差を最優先で評価する
        if (totalStones > 52) {
            return (counts[this.player] - counts[this.opponent]) * 10;
        }

        // 序盤・中盤は、石の数よりも戦略的な要素が重要になる
        const positionalScore = this.calculatePositionalScore(board);
        const mobilityScore = this.calculateMobilityScore(board);
        const stabilityScore = this.calculateStabilityScore(board);
        const cornerScore = this.calculateCornerScore(board);

        // 各評価要素に重みを付けて、最終的なスコアを計算する。
        // 重みが大きいほど、その要素を重視していることを示す（例: 角の確保は1000点と非常に重要）。
        const finalScore =
            (positionalScore * 10) +
            (mobilityScore * 200) +
            (stabilityScore * 300) +
            (cornerScore * 1000);

        return finalScore;
    }
    // ai.js (3/5)

    // --- 評価関数のヘルパー関数群 ---

    // 位置の価値を計算する
    calculatePositionalScore(board) {
        let score = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === this.player) {
                    score += this.positionalWeights[r][c];
                } else if (board[r][c] === this.opponent) {
                    score -= this.positionalWeights[r][c];
                }
            }
        }
        return score;
    }

    /**
     * 打てる手の数（機動力）を評価します。選択肢が多いほど有利と判断します。
     * @param {number[][]} board - 評価する盤面
     * @returns {number} 機動力に関するスコア
     */
    calculateMobilityScore(board) {
        const myMoves = this.getValidMoves(board, this.player).length;
        const opponentMoves = this.getValidMoves(board, this.opponent).length;
        return myMoves - opponentMoves;
    }

    /**
     * 確定石（絶対に相手にひっくり返されない石）の数を評価します。確定石が多いほど有利です。
     * @param {number[][]} board - 評価する盤面
     * @returns {number} 確定石に関するスコア
     */
    calculateStabilityScore(board) {
        const myStableStones = this.countStableStones(board, this.player);
        const opponentStableStones = this.countStableStones(board, this.opponent);
        return myStableStones - opponentStableStones;
    }

    /**
     * 角の確保状況を評価します。角は非常に重要な要素です。
     * @param {number[][]} board - 評価する盤面
     * @returns {number} 角に関するスコア
     */
    calculateCornerScore(board) {
        let score = 0;
        const corners = [{ r: 0, c: 0 }, { r: 0, c: 7 }, { r: 7, c: 0 }, { r: 7, c: 7 }];
        corners.forEach(corner => {
            if (board[corner.r][corner.c] === this.player) {
                score++;
            } else if (board[corner.r][corner.c] === this.opponent) {
                score--;
            }
        });
        // 角に隣接する危険なマス（C/Xマス）の評価も加える
        score += this.evaluateCAndXSquares(board);
        return score;
    }

    // 探索順序を決めるための簡易評価（ヒューリスティック）
    calculateHeuristicScore(board, move, player) {
        // 位置の価値を最優先
        const positionalValue = this.positionalWeights[move.row][move.col];

        // 次に、その手でひっくり返せる石の数を評価
        const flippableCount = this.calculateFlippableStones(board, move.row, move.col, player).length;

        // 重み付けしてスコアを返す (位置の価値を10倍重視)
        return (positionalValue * 10) + flippableCount;
    }
    // ai.js (4/5)

    // --- ゲームロジックのヘルパー関数群 ---
    // (othello.jsのロジックをAIクラス内で完結するように再実装)

    // 相手プレイヤーを取得する
    getOpponent(player) {
        return (player === this.player) ? this.opponent : this.player;
    }

    // 指定された手で石を置いた後の新しい盤面を返す
    getBoardAfterMove(board, move, player) {
        // 盤面をディープコピーして、元の盤面に影響を与えないようにする
        const newBoard = board.map(row => [...row]);
        const flippableStones = this.calculateFlippableStones(newBoard, move.row, move.col, player);

        newBoard[move.row][move.col] = player;
        flippableStones.forEach(stone => {
            newBoard[stone.row][stone.col] = player;
        });
        return newBoard;
    }

    /**
     * ゲームが終了したかどうかを判定します。
     * @param {number[][]} board - 判定する盤面
     * @returns {boolean} ゲームが終了していればtrue
     */
    isGameOver(board) {
        const myMoves = this.getValidMoves(board, this.player);
        if (myMoves.length > 0) return false;

        const opponentMoves = this.getValidMoves(board, this.opponent);
        if (opponentMoves.length > 0) return false;

        return true; // 両者とも打てる手がない場合、ゲーム終了
    }

    /**
     * 指定されたプレイヤーが現在打てる全ての有効な手を計算します。
     * @param {number[][]} board - 盤面
     * @param {number} player - 手番のプレイヤー
     * @returns {object[]} 有効な手のリスト
     */
    getValidMoves(board, player) {
        const validMoves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === 0) { // 0はEMPTY
                    const flippableStones = this.calculateFlippableStones(board, r, c, player);
                    if (flippableStones.length > 0) {
                        validMoves.push({ row: r, col: c });
                    }
                }
            }
        }
        return validMoves;
    }

    /**
     * 指定されたマスに石を置いた場合に、ひっくり返せる全ての相手の石を計算します。
     * @param {number[][]} board - 盤面
     * @param {number} row - 石を置く行
     * @param {number} col - 石を置く列
     * @param {number} player - 手番のプレイヤー
     * @returns {object[]} ひっくり返せる石のリスト
     */
    calculateFlippableStones(board, row, col, player) {
        const opponent = this.getOpponent(player);
        let allFlippableStones = [];

        this.directions.forEach(([dr, dc]) => {
            let stonesInDirection = [];
            let r = row + dr;
            let c = col + dc;

            // 盤面の端に着くまで、または空きマスが見つかるまで探索
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (board[r][c] === opponent) {
                    // 相手の石があれば、ひっくり返す候補としてリストに追加
                    stonesInDirection.push({ row: r, col: c });
                } else if (board[r][c] === player) {
                    // 自分の石が見つかったら、そこまでの候補がすべてひっくり返せる石となる
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
    // ai.js (5/5)

    // 石の数をカウントする
    countStones(board) {
        let counts = { [this.player]: 0, [this.opponent]: 0, total: 0 };
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === this.player) {
                    counts[this.player]++;
                } else if (board[r][c] === this.opponent) {
                    counts[this.opponent]++;
                }
            }
        }
        counts.total = counts[this.player] + counts[this.opponent];
        return counts;
    }

    /**
     * 確定石（stable stones）を数える関数。
     * 確定石とは、今後絶対に相手にひっくり返されることのない石のことです。
     * @param {number[][]} board - 盤面
     * @param {number} player - プレイヤー
     * @returns {number} 確定石の数
     */
    countStableStones(board, player) {
        let stableCount = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] !== player) continue;

                let isStable = true;
                // 4つの方向（水平、垂直、右斜め、左斜め）すべてで安定しているかチェック
                // ある石が確定石であるためには、全ての軸（縦、横、斜め2つ）で安定している必要がある。
                for (let i = 0; i < 4; i++) {
                    const dir1 = this.directions[i];
                    const dir2 = this.directions[7 - i];
                    let stableInDirection = false;

                    let edge1 = false;
                    // 片方の方向に、盤の端まで自分の石が連続しているかチェック
                    let nr = r + dir1[0];
                    let nc = c + dir1[1];
                    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                        if (board[nr][nc] !== player) break;
                        nr += dir1[0];
                        nc += dir1[1];
                    }
                    if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) edge1 = true;

                    let edge2 = false;
                    // 反対方向にも、盤の端まで自分の石が連続しているかチェック
                    nr = r + dir2[0];
                    nc = c + dir2[1];
                    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                        if (board[nr][nc] !== player) break;
                        nr += dir2[0];
                        nc += dir2[1];
                    }
                    if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) edge2 = true;

                    // 両方向が自分の石で壁に到達していれば、その軸では安定しているとみなす
                    if (edge1 && edge2) {
                        stableInDirection = true;
                    }

                    // 1つでも安定していない軸があれば、その石は確定石ではない
                    if (!stableInDirection) {
                        isStable = false;
                        break;
                    }
                }
                if (isStable) {
                    stableCount++;
                }
            }
        }
        return stableCount;
    }

    /**
     * 角に隣接する危険なマス（CマスやXマス）を評価します。
     * これらのマスに石を置くと、相手に角を取られるリスクが高まるため、マイナス評価とします。
     * @param {number[][]} board - 盤面
     * @returns {number} C/Xマスに関するスコア
     */
    evaluateCAndXSquares(board) {
        let score = 0;
        const corners = [{ r: 0, c: 0 }, { r: 0, c: 7 }, { r: 7, c: 0 }, { r: 7, c: 7 }];
        const cSquares = [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 0, c: 6 }, { r: 1, c: 7 }, { r: 6, c: 0 }, { r: 7, c: 1 }, { r: 6, c: 7 }, { r: 7, c: 6 }];
        const xSquares = [{ r: 1, c: 1 }, { r: 1, c: 6 }, { r: 6, c: 1 }, { r: 6, c: 6 }];

        for (let i = 0; i < 4; i++) {
            const corner = corners[i];
            // 角が空いている場合のみ評価
            if (board[corner.r][corner.c] === 0) {
                // 隣接するCマス
                if (board[cSquares[i * 2].r][cSquares[i * 2].c] === this.player) score--;
                if (board[cSquares[i * 2].r][cSquares[i * 2].c] === this.opponent) score++;
                if (board[cSquares[i * 2 + 1].r][cSquares[i * 2 + 1].c] === this.player) score--;
                if (board[cSquares[i * 2 + 1].r][cSquares[i * 2 + 1].c] === this.opponent) score++;
                // 隣接するXマス
                if (board[xSquares[i].r][xSquares[i].c] === this.player) score--;
                if (board[xSquares[i].r][xSquares[i].c] === this.opponent) score++;
            }
        }
        return score;
    }
}
