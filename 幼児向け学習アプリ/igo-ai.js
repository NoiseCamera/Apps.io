// igo-ai.js

/**
 * AIの次の手を決定するメイン関数
 * @param {Array<Array<number>>} board - 現在の盤面
 * @param {Array<string>} history - これまでの棋譜（コウ判定用）
 * @param {string} aiLevel - AIの難易度 ('easy', 'normal', 'hard')
 * @param {number} player - AIが担当するプレイヤー (1:黒, 2:白)
 * @returns {{x: number, y: number}|null} - AIが打つべき手の座標、またはnull
 */
function getIgoAIMove(board, history, aiLevel, player) {
    const { BOARD_SIZE, captureOpponentStones, countLiberties, getGroup } = window.igoAIHelpers;

    // 1. まず、全ての有効な手をリストアップする
    const allValidMoves = [];
    let emptyPointsCount = 0;
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === 0) {
                emptyPointsCount++;
                // この手が有効かチェック
                const tempBoard = JSON.parse(JSON.stringify(board));
                tempBoard[y][x] = player;
                const captured = captureOpponentStones(x, y, player, tempBoard);
                if ((captured.length > 0 || countLiberties(x, y, player, tempBoard) > 0) && !history.includes(JSON.stringify(tempBoard))) {
                    allValidMoves.push({ x, y });
                }
            }
        }
    }

    // 2. 有効な手がない場合は、即座にパス(null)を返す
    if (allValidMoves.length === 0) {
        return null;
    }

    // 3. 終盤のパス判定ロジック
    const passThreshold = Math.floor(BOARD_SIZE * BOARD_SIZE * 0.25);
    if (emptyPointsCount < passThreshold) {
        // 空きマスが少なく、かつ有効な手がほとんどない場合（例えば3手以下）はパスしやすくする
        const passProbability = (allValidMoves.length <= 3) ? 0.5 : 0.1; // 有効手が3以下なら50%, それ以外は10%
        if (Math.random() < passProbability) {
            console.log(`AI (${player}) is passing strategically.`);
            return null;
        }
    }

    // 4. 有効な手の中から、難易度に応じた手を選ぶ
    let move;
    if (aiLevel === 'easy') {
        move = findRandomMove(allValidMoves);
    } else if (aiLevel === 'normal') {
        move = findNormalMove(board, allValidMoves, player);
    } else { // hard
        move = findHardMove(board, allValidMoves, player);
    }
    return move;
}

/**
 * 有効な手のリストからランダムに1つ選ぶ (難易度:かんたん)
 * @param {Array<{x: number, y: number}>} validMoves - 有効な手のリスト
 * @returns {{x: number, y: number}|null} - 見つかった手、またはnull
 */
function findRandomMove(validMoves) {
    if (validMoves.length === 0) return null;
    const index = Math.floor(Math.random() * validMoves.length);
    return validMoves[index];
}

function findNormalMove(board, validMoves, player) {
    const scoredMoves = evaluateAllMoves(board, validMoves, player);
    if (scoredMoves.length === 0) return findRandomMove(validMoves); // 評価できる手がなければランダム

    // 上位3つの手の中からランダムに選ぶ（多様性を持たせる）
    const topMoves = scoredMoves.slice(0, 3);
    const randomIndex = Math.floor(Math.random() * topMoves.length);
    return topMoves[randomIndex].move;
}

function findHardMove(board, validMoves, player) {
    const scoredMoves = evaluateAllMoves(board, validMoves, player);
    if (scoredMoves.length === 0) return findRandomMove(validMoves); // 評価できる手がなければランダム

    // 最もスコアの高い手を返す
    return scoredMoves[0].move;
}

/**
 * 各手を評価し、スコアに基づいて手を選ぶ (難易度: ふつう、むずかしい)
 * @param {Array<Array<number>>} board - 現在の盤面
 * @param {Array<{x: number, y: number}>} validMoves - 有効な手のリスト
 * @param {number} player - AIのプレイヤー番号
 * @returns {Array<{move: {x: number, y: number}, score: number}>} - 評価された手のリスト
 */
function evaluateAllMoves(board, validMoves, player) {
    const { BOARD_SIZE, captureOpponentStones, countLiberties, getGroup } = window.igoAIHelpers;
    const opponent = 3 - player;
    const scoredMoves = [];

    // --- 0. 現在の盤面の陣地スコアを計算しておく ---
    const baseTerritoryScore = estimateTerritory(board, player);

    // --- 1. 現在の盤面で、アタリになっている自分の石のグループを特定する ---
    const atariGroups = new Set();
    const visitedForAtariCheck = new Set();
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === player && !visitedForAtariCheck.has(`${x},${y}`)) {
                const group = getGroup(x, y, player, board, new Set());
                if (group.length > 0) {
                    const groupKey = JSON.stringify(group.sort((a, b) => a.x - b.x || a.y - b.y));
                    group.forEach(s => visitedForAtariCheck.add(`${s.x},${s.y}`));
                    if (countLiberties(x, y, player, board) === 1) {
                        atariGroups.add(groupKey);
                    }
                }
            }
        }
    }

    // --- 2. 各有効手を評価する ---
    for (const move of validMoves) {
        let score = 0;
        const tempBoard = JSON.parse(JSON.stringify(board));
        tempBoard[move.y][move.x] = player;

        // a. 相手の石を取れるか？ (最優先)
        const captured = captureOpponentStones(move.x, move.y, player, tempBoard);
        if (captured.length > 0) {
            score += 100 * captured.length;
        }

        // b. アタリになっている自分の石を助けられるか？
        atariGroups.forEach(groupKey => {
            const group = JSON.parse(groupKey);
            const stone = group[0];
            // この手を打った後、そのグループの呼吸点が増えるかチェック
            if (countLiberties(stone.x, stone.y, player, tempBoard) > 1) {
                score += 80;
            }
        });

        // c. 相手の石をアタリにできるか？
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        directions.forEach(([dx, dy]) => {
            const nx = move.x + dx;
            const ny = move.y + dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && tempBoard[ny][nx] === opponent) {
                if (countLiberties(nx, ny, opponent, tempBoard) === 1) {
                    score += 20;
                }
            }
        });

        // d. 自殺手ではないが、打った結果アタリになる手は避ける
        if (captured.length === 0 && countLiberties(move.x, move.y, player, tempBoard) === 1) {
            score -= 50;
        }

        // f. 陣地の確保と妨害
        const newTerritoryScore = estimateTerritory(tempBoard, player);
        const territoryChange = newTerritoryScore - baseTerritoryScore;
        score += territoryChange * 5; // 陣地1つあたり5点の価値

        // e. わずかなランダム性を加えて、同じスコアの手が複数ある場合に多様性を持たせる
        score += Math.random();

        scoredMoves.push({ move, score });
    }

    // スコアの高い順にソート
    return scoredMoves.sort((a, b) => b.score - a.score);
}

/**
 * 盤面の陣地を簡易的に評価するヘルパー関数
 * @param {Array<Array<number>>} board - 盤面
 * @param {number} player - 評価するプレイヤー
 * @returns {number} - プレイヤーの陣地スコア（自分の陣地 - 相手の陣地）
 */
function estimateTerritory(board, player) {
    const { BOARD_SIZE } = window.igoAIHelpers;
    const opponent = 3 - player;
    let playerScore = 0;
    let opponentScore = 0;
    const visited = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));

    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === 0 && !visited[y][x]) {
                const queue = [{ x, y }];
                const area = [];
                let bordersPlayer = false;
                let bordersOpponent = false;
                const areaVisited = new Set([`${x},${y}`]);

                while (queue.length > 0) {
                    const current = queue.shift();
                    area.push(current);
                    visited[current.y][current.x] = true;

                    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                    for (const [dx, dy] of directions) {
                        const nx = current.x + dx;
                        const ny = current.y + dy;

                        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
                            const key = `${nx},${ny}`;
                            if (!areaVisited.has(key)) {
                                if (board[ny][nx] === 0) {
                                    queue.push({ x: nx, y: ny });
                                    areaVisited.add(key);
                                } else if (board[ny][nx] === player) {
                                    bordersPlayer = true;
                                } else if (board[ny][nx] === opponent) {
                                    bordersOpponent = true;
                                }
                            }
                        }
                    }
                }
                if (bordersPlayer && !bordersOpponent) playerScore += area.length;
                else if (!bordersPlayer && bordersOpponent) opponentScore += area.length;
            }
        }
    }
    return playerScore - opponentScore;
}