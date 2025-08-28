// shogi-ai.js

// このファイルは shogi.js の後に読み込む必要があります。
// shogi.js で定義されている getAllPossibleMoves や applyMoveToBoard などの
// ゲームルール関数を利用して、AIの思考ルーチンを実装します。

const AI_PLAYER = 'opponent';
const HUMAN_PLAYER = 'player';

// --- 評価のための駒の価値 ---
const PIECE_VALUES = {
    '歩': 1, '香': 3, '桂': 4, '銀': 5, '金': 6,
    '角': 8, '飛': 10,
    'と': 6, '成香': 6, '成桂': 6, '成銀': 6,
    '馬': 11, '龍': 13,
    '王': 10000, '玉': 10000
};

// --- 戦術的評価ボーナス ---
const CHECK_BONUS = 3; // 王手をかけた時の評価ボーナス

// --- 駒の位置評価 (Piece-Square Tables, 簡略版) ---
// 敵陣にいる駒にボーナスを与え、駒の働きを評価する
const PST_BONUS = {
    '歩': 0.5, '香': 0.5, '桂': 0.5, '銀': 0.5,
    '角': 1, '飛': 1,
    'と': 1, '成香': 1, '成桂': 1, '成銀': 1,
    '馬': 2, '龍': 2,
};

/**
 * AIのメインエントリーポイント
 * @param {Array} boardState - shogi.jsからの現在の盤面状態
 * @param {number} level - AIの難易度 (1, 2, or 3)
 * @param {string} player - 手を生成するプレイヤー ('player' or 'opponent')
 * @returns {object|null} 最善手、または指せる手がない場合はnull
 */
function getAIMove(boardState, level, player) {
    // shogi.js の getAllPossibleMoves を呼び出す
    // この関数は、王手放置や打ち歩詰めなどの禁じ手を除いた合法手を返す
    const allMoves = getAllPossibleMoves(boardState, player);

    if (allMoves.length === 0) {
        return null; // 指せる合法手がない場合、AIは投了
    }

    switch (level) {
        case 1: // よわい (幼児向け)
            return findToddlerMove(boardState, allMoves, player);
        case 2: // ふつう (駒取り・成りを優先)
            return findWeakestGoodMove(boardState, allMoves, player);
        case 3: // つよい (NegaMax法で探索)
            return findBestMoveNegaMax(boardState, 2, player); // 深さ2で探索
        default:
            return findRandomMove(allMoves);
    }
}
/**
 * AIレベル1: 幼児向け
 * - 90%の確率でランダムな手を指す
 * - 10%の確率で、取れる駒があればその中からランダムに1つ取ってみる
 * @param {Array} boardState - 盤面状態
 * @param {Array} allMoves - 全ての合法手
 * @param {string} player - AIプレイヤー名
 * @returns {object} 選択された手
 */
function findToddlerMove(boardState, allMoves, player) {
    // 10%の確率で駒を取ることを試みる
    if (Math.random() < 0.1) {
        const captureMoves = allMoves.filter(move => {
            const targetPiece = boardState[move.to.row][move.to.col];
            // 相手の駒を取る手
            return targetPiece && targetPiece.owner !== player;
        });

        if (captureMoves.length > 0) {
            // 取れる駒があるなら、その中からランダムに選ぶ
            return findRandomMove(captureMoves);
        }
    }
    // 基本的には完全にランダムな手
    return findRandomMove(allMoves);
}

/**
 * ランダムな手を返す
 * @param {Array} allMoves - 全ての合法手
 * @returns {object} 選択された手
 */
function findRandomMove(allMoves) {
    const randomIndex = Math.floor(Math.random() * allMoves.length);
    return allMoves[randomIndex];
}

/**
 * AIレベル2: 駒取りはするけど、一番価値の低い駒を狙う
 * 取れる駒の中では一番価値の低いものを、成れる場合は価値の上がりが少ないものを優先する
 * @param {Array} boardState - 盤面状態
 * @param {Array} allMoves - 全ての合法手
 * @param {string} player - AIプレイヤー名
 * @returns {object} 選択された手
 */
function findWeakestGoodMove(boardState, allMoves, player) {
    let movesWithScore = [];

    for (const move of allMoves) {
        let score = 0;
        const { piece, to, promote } = move;

        // 駒取り評価: 価値の低い駒を取るほど高得点
        const targetPiece = boardState[to.row][to.col];
        if (targetPiece && targetPiece.owner !== player) {
            score += 100 - (PIECE_VALUES[targetPiece.name] || 0);
        }

        // 成り評価: 価値の上昇が少ないほど高得点
        if (promote) {
            const originalValue = PIECE_VALUES[piece.name] || 0;
            const promotedName = PIECE_DATA[piece.name].promoted;
            const promotedValue = PIECE_VALUES[promotedName] || 0;
            score += 10 - (promotedValue - originalValue);
        }

        if (score > 0) {
            movesWithScore.push({ move, score });
        }
    }

    // 評価できる手（駒取り or 成り）がなければランダム
    if (movesWithScore.length === 0) {
        return findRandomMove(allMoves);
    }

    // 最もスコアが高い（＝一番しょぼい）手を選ぶ
    movesWithScore.sort((a, b) => b.score - a.score);
    return movesWithScore[0].move;
}

/**
 * 盤面を評価する関数
 * @param {Array} boardState - 評価する盤面
 * @param {string} player - 評価の視点となるプレイヤー
 * @returns {number} 評価値 (正ならplayer有利, 負ならopponent有利)
 */
function evaluateBoard(boardState, player) {
    let totalScore = 0;
    const opponent = (player === HUMAN_PLAYER) ? AI_PLAYER : HUMAN_PLAYER;

    // 盤上の駒の評価
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const piece = boardState[r][c];
            if (piece) {
                const value = PIECE_VALUES[piece.name] || 0;
                const sign = (piece.owner === player) ? 1 : -1;
                totalScore += value * sign;

                // 駒の位置評価 (PST)
                // 敵陣（相手から見て奥の3段）にいる駒にボーナス
                if (piece.owner === player && (player === HUMAN_PLAYER ? r < 3 : r > 5)) {
                    totalScore += (PST_BONUS[piece.name] || 0);
                } else if (piece.owner === opponent && (opponent === HUMAN_PLAYER ? r < 3 : r > 5)) {
                    totalScore -= (PST_BONUS[piece.name] || 0);
                }
            }
        }
    }

    // 持ち駒の評価
    const humanCaptured = boardState.playerCaptured || [];
    const aiCaptured = boardState.opponentCaptured || [];

    humanCaptured.forEach(p => {
        const value = PIECE_VALUES[p.name] || 0;
        totalScore += (player === HUMAN_PLAYER) ? value : -value;
    });
    aiCaptured.forEach(p => {
        const value = PIECE_VALUES[p.name] || 0;
        totalScore += (player === AI_PLAYER) ? value : -value;
    });

    // 王手ボーナス
    if (isCheck(boardState, opponent)) {
        totalScore += CHECK_BONUS;
    }
    if (isCheck(boardState, player)) {
        totalScore -= CHECK_BONUS;
    }

    return totalScore;
}

/**
 * AIレベル3: NegaMax法による探索
 * @param {Array} boardState - 盤面状態
 * @param {number} depth - 探索の深さ
 * @param {string} player - 現在の手番のプレイヤー
 * @returns {object|null} 最善手
 */
function findBestMoveNegaMax(boardState, depth, player) {
    const allMoves = getAllPossibleMoves(boardState, player);
    if (allMoves.length === 0) return null;

    let bestMove = null;
    let maxScore = -Infinity;
    const alpha = -Infinity;
    const beta = Infinity;

    // 候補手をシャッフルして、同じ評価値の手が複数ある場合に多様性を持たせる
    const shuffledMoves = allMoves.sort(() => 0.5 - Math.random());

    for (const move of shuffledMoves) {
        const newBoard = applyMoveToBoard(boardState, move);
        // 相手の視点から評価するので、スコアの符号を反転させる
        const score = -negaMax(newBoard, depth - 1, -beta, -alpha, (player === HUMAN_PLAYER) ? AI_PLAYER : HUMAN_PLAYER);

        if (score > maxScore) {
            maxScore = score;
            bestMove = move;
        }
    }
    return bestMove;
}

/**
 * NegaMax法（αβ探索付き）
 * @param {Array} boardState - 盤面状態
 * @param {number} depth - 残りの探索の深さ
 * @param {number} alpha - アルファ値
 * @param {number} beta - ベータ値
 * @param {string} player - 現在の手番のプレイヤー
 * @returns {number} 評価値
 */
function negaMax(boardState, depth, alpha, beta, player) {
    // 深さが0に達したら、静的評価関数で盤面を評価
    if (depth === 0) {
        return evaluateBoard(boardState, player);
    }

    const allMoves = getAllPossibleMoves(boardState, player);

    // 指せる手がない場合（詰み or ステイルメイト）
    if (allMoves.length === 0) {
        // 詰まされているので、非常に低い評価値を返す
        return -PIECE_VALUES['王'];
    }

    let maxScore = -Infinity;
    for (const move of allMoves) {
        const newBoard = applyMoveToBoard(boardState, move);
        const score = -negaMax(newBoard, depth - 1, -beta, -alpha, (player === HUMAN_PLAYER) ? AI_PLAYER : HUMAN_PLAYER);

        if (score > maxScore) {
            maxScore = score;
        }
        // α値を更新
        if (score > alpha) {
            alpha = score;
        }
        // βカット
        if (alpha >= beta) {
            break;
        }
    }
    return maxScore;
}
