// ai.js
// This file contains a single-threaded implementation of the game AI.
// It finds the best move by evaluating all possible placements for the current and held piece.

(() => {
    // --- AI State and Configuration ---
    let aiEnabled = false;
    let movePlan = []; // The sequence of actions to execute the best move.

    // Heuristic weights for scoring moves. These values determine the AI's strategy.
    const WEIGHTS = {
        aggregateHeight: -0.510066, // Penalty for higher stacks
        completeLines: 0.760666,  // Reward for clearing lines
        holes: -0.35663,          // Penalty for creating holes
        bumpiness: -0.184483,      // Penalty for uneven surfaces
        garbageLinesCleared: 50.0, // Massively increased bonus to ensure garbage clearing is the absolute top priority
        unattendedDanger: -15.0    // Further increased penalty to make ignoring danger extremely costly
    };

    // Tetromino shapes, needed for simulating rotations and the held piece.
    const SHAPES = [
        [], // Empty
        [[1, 1, 1], [0, 1, 0]], // T
        [[2, 2, 2, 2]], // I
        [[3, 3], [3, 3]], // O
        [[4, 0, 0], [4, 4, 4]], // L
        [[0, 0, 5], [5, 5, 5]], // J
        [[0, 6, 6], [6, 6, 0]], // S
        [[7, 7, 0], [0, 7, 7]], // Z
    ];

    // --- AI Control Functions ---

    function enableAI() {
        if (aiEnabled) return;
        aiEnabled = true;
        console.log('AI Enabled');
    }

    function disableAI() {
        if (!aiEnabled) return;
        aiEnabled = false;
        console.log('AI Disabled');
        movePlan = []; // Clear any pending moves
    }

    // Listen for new pieces, which is the main trigger for the AI to think.
    window.addEventListener('newPiece', () => {
        if (aiEnabled && window.gameAPI.isGameRunning()) {
            findAndExecuteBestMove();
        }
    });

    // --- Main AI Orchestration ---

    /**
     * Finds the best possible move and executes it.
     * This is the main entry point for the AI's thinking process.
     */
    function findAndExecuteBestMove() {
        const gameState = window.gameAPI.getState();
        if (!gameState.player) return; // Exit if there's no active piece

        const bestMove = findBestMove(gameState);

        if (bestMove) {
            if (bestMove.useHold) {
                // If the best strategy is to hold, perform the hold action.
                // The subsequent 'newPiece' event will trigger the AI again for the new piece.
                window.gameAPI.hold();
            } else {
                // Otherwise, create a plan to execute the best move found.
                // Pass the current player state for accurate move planning.
                createMovePlan(bestMove, gameState.player);
            }
        }
    }

    // --- Core AI Calculation Logic ---

    /**
     * Evaluates all possible moves for the current and held piece to find the optimal one.
     * @param {object} gameState - The current state of the game from gameAPI.
     * @returns {object|null} The best move object, or null if no move is found.
     */
    function findBestMove(gameState) {
        // 1. Evaluate moves for the current piece
        const currentPieceMoves = getAllPossibleMoves(gameState.player, gameState);
        const bestCurrentMove = getBestMoveFromList(currentPieceMoves);

        // 2. Evaluate moves for the held piece (if possible)
        let bestHoldMove = { score: -Infinity };
        if (gameState.canHold) {
            let heldPieceTypeId = gameState.heldPieceTypeId;
            // If hold is empty, the next piece is what would be held.
            if (heldPieceTypeId === null) {
                // Ensure there is a next tetromino to simulate
                if (gameState.nextTetromino) {
                    heldPieceTypeId = gameState.nextTetromino.typeId;
                }
            }
            
            if (heldPieceTypeId) {
                const pieceForHoldSim = {
                    typeId: heldPieceTypeId,
                    shape: SHAPES[heldPieceTypeId],
                    pos: { x: Math.floor(gameState.cols / 2) - 1, y: 0 } // Standard starting position
                };
                
                const holdPieceMoves = getAllPossibleMoves(pieceForHoldSim, gameState);
                bestHoldMove = getBestMoveFromList(holdPieceMoves);
            }
        }

        // 3. Compare scores and decide whether to hold or not
        if (bestCurrentMove && bestCurrentMove.score >= bestHoldMove.score) {
            return { ...bestCurrentMove, useHold: false };
        } else if (bestHoldMove && bestHoldMove.score > -Infinity) {
            // The move object for hold needs to be returned, not just a flag
            return { ...bestHoldMove, useHold: true };
        } else {
            // Fallback to current piece if hold is not an option or has no valid moves.
            return bestCurrentMove ? { ...bestCurrentMove, useHold: false } : null;
        }
    }

    /**
     * Finds the move with the highest score from a list of possible moves.
     * @param {Array<object>} moves - An array of move objects with scores.
     * @returns {object} The move with the highest score.
     */
    function getBestMoveFromList(moves) {
        if (!moves || moves.length === 0) {
            return { score: -Infinity };
        }
        return moves.reduce((best, current) => (current.score > best.score ? current : best));
    }

    /**
     * Generates and scores every possible placement for a given piece across all layers.
     * @param {object} piece - The player piece object.
     * @param {Array<Array<Array<number>>>} boards - The game boards for all layers.
     * @param {number} rows - The number of rows in the board.
     * @param {number} cols - The number of columns in the board.
     * @returns {Array<object>} A list of all possible scored moves.
     */
    function getAllPossibleMoves(piece, gameState) {
        const moves = [];
        const { boards, rows, cols } = gameState;
        if (!piece || !piece.shape) return moves;

        for (let layer = 0; layer < boards.length; layer++) {
            const board = boards[layer];
            let rotatedPiece = JSON.parse(JSON.stringify(piece));

            for (let rot = 0; rot < 4; rot++) {
                // Iterate through all possible horizontal positions
                for (let x = -2; x < cols; x++) {
                    let testPiece = { ...rotatedPiece, pos: { x: x, y: 0 } };
                    
                    // Skip if this starting position is invalid (e.g., piece is off-screen)
                    if (isCollision(board, testPiece, rows, cols)) {
                        continue; 
                    }

                    // Simulate a hard drop to find the final landing position
                    while (!isCollision(board, { ...testPiece, pos: { ...testPiece.pos, y: testPiece.pos.y + 1 } }, rows, cols)) {
                        testPiece.pos.y++;
                    }

                    // Create a temporary board with the piece merged to score it
                    const tempBoard = JSON.parse(JSON.stringify(board));
                    mergeInto(tempBoard, testPiece);
                    const score = calculateScore(tempBoard, rows, cols, board, boards, layer);

                    moves.push({ score, layer, rotation: rot, x: testPiece.pos.x });
                }
                // Rotate piece for the next set of placements
                rotatedPiece.shape = rotateMatrix(rotatedPiece.shape);
            }
        }
        return moves;
    }

    // --- Heuristic Scoring Functions ---

    /**
     * Calculates a score for a given board state based on several heuristics.
     * @param {Array<Array<number>>} board - The board state to score.
     * @param {number} rows - The number of rows in the board.
     * @param {number} cols - The number of columns in the board.
     * @returns {number} The calculated score.
     */
    function calculateScore(board, rows, cols, originalBoard = null, allBoards = null, moveLayerIndex = -1) {
        // --- Heuristics on the new board state ---
        const columnHeights = Array(cols).fill(0);
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                if (board[r][c] !== 0) {
                    columnHeights[c] = rows - r;
                    break;
                }
            }
        }

        const aggregateHeight = columnHeights.reduce((sum, h) => sum + h, 0);

        let completeLines = 0;
        for (let r = 0; r < rows; r++) {
            if (board[r].every(cell => cell !== 0)) {
                completeLines++;
            }
        }

        let holes = 0;
        for (let c = 0; c < cols; c++) {
            let blockFound = false;
            for (let r = 0; r < rows; r++) {
                if (board[r][c] !== 0) {
                    blockFound = true;
                } else if (blockFound) {
                    holes++;
                }
            }
        }

        let bumpiness = 0;
        for (let c = 0; c < cols - 1; c++) {
            bumpiness += Math.abs(columnHeights[c] - columnHeights[c + 1]);
        }

        // --- Danger-modified line clear score ---
        let lineClearScore = WEIGHTS.completeLines * completeLines;

        // If lines were cleared, check the danger level of the original board.
        // A higher original board gives a massive bonus to the line clear score.
        if (completeLines > 0 && originalBoard) {
            let maxOriginalHeight = 0;
            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    if (originalBoard[r][c] !== 0) {
                        maxOriginalHeight = Math.max(maxOriginalHeight, rows - r);
                        break;
                    }
                }
            }
            // Danger multiplier: a board that is 75% high gets a (1 + 0.75 * 2) = 2.5x bonus for line clears.
            const dangerMultiplier = 1 + (maxOriginalHeight / rows) * 2.0;
            lineClearScore *= dangerMultiplier;
        }

        // --- Garbage Line Clear Bonus ---
        let garbageLinesCleared = 0;
        if (completeLines > 0 && originalBoard) {
            for (let r = 0; r < rows; r++) {
                // Check if this row is now complete on the new board
                if (board[r].every(cell => cell !== 0)) {
                    // Check if this row *originally* had any garbage blocks (value 8)
                    if (originalBoard[r].some(cell => cell === 8)) {
                        garbageLinesCleared++;
                    }
                }
            }
        }

        let score = WEIGHTS.aggregateHeight * aggregateHeight +
               lineClearScore + // Use the modified score
               WEIGHTS.holes * holes +
               WEIGHTS.bumpiness * bumpiness +
               (WEIGHTS.garbageLinesCleared * garbageLinesCleared);

        // --- NEW: Penalty for Unattended Danger on Other Layers ---
        // If a move is made on one layer, penalize it for the danger left on other layers.
        // This encourages the AI to address the most critical layer first.
        if (allBoards && moveLayerIndex !== -1) {
            let totalUnattendedDanger = 0;
            for (let i = 0; i < allBoards.length; i++) {
                if (i === moveLayerIndex) continue; // Don't penalize for the layer being addressed

                const otherBoard = allBoards[i];
                let maxOtherHeight = 0;
                // BUGFIX: The previous height calculation was incorrect. This correctly finds the max height.
                for (let r = 0; r < rows; r++) {
                    // Find the first row from the top that has a block.
                    if (otherBoard[r].some(cell => cell !== 0)) {
                        maxOtherHeight = rows - r; // Height is total rows minus the row index.
                        break; // Found the highest block, no need to check lower rows.
                    }
                }
                totalUnattendedDanger += maxOtherHeight;
            }
            score += totalUnattendedDanger * WEIGHTS.unattendedDanger;
        }
        return score;
    }

    // --- Simulation Helper Functions ---

    /**
     * Rotates a matrix (tetromino shape) 90 degrees clockwise.
     * @param {Array<Array<number>>} matrix - The matrix to rotate.
     * @returns {Array<Array<number>>} The new, rotated matrix.
     */
    function rotateMatrix(matrix) {
        const newMatrix = matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
        return newMatrix.reverse();
    }

    /**
     * Checks for collision between a piece and the board.
     * @param {Array<Array<number>>} board - The game board.
     * @param {object} piece - The piece to check.
     * @param {number} rows - Board rows.
     * @param {number} cols - Board columns.
     * @returns {boolean} True if there is a collision.
     */
    function isCollision(board, piece, rows, cols) {
        const { shape, pos } = piece;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] !== 0) {
                    const newY = y + pos.y;
                    const newX = x + pos.x;
                    if (newY >= rows || newX < 0 || newX >= cols || (board[newY] && board[newY][newX] !== 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Merges a piece into a temporary board for scoring.
     * @param {Array<Array<number>>} board - The board to merge into.
     * @param {object} piece - The piece to merge.
     */
    function mergeInto(board, piece) {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const boardY = y + piece.pos.y;
                    const boardX = x + piece.pos.x;
                    if (board[boardY] && board[boardY][boardX] !== undefined) {
                        board[boardY][boardX] = value;
                    }
                }
            });
        });
    }

    // --- Move Plan Execution ---

    /**
     * Creates a sequence of actions to execute the chosen move.
     * @param {object} move - The best move object { layer, rotation, x }.
     * @param {object} initialPlayerState - The player state when the calculation began.
     */
    function createMovePlan(move, initialPlayerState) {
        const { boards, activeLayerIndex, rows, cols } = window.gameAPI.getState();
        // BUGFIX: Use the target layer's board for simulation, not the current active layer's board.
        const board = boards[move.layer];
        movePlan = []; // Clear any old plan

        // 1. Plan layer switches
        const layerDiff = move.layer - activeLayerIndex;
        if (layerDiff !== 0) {
            const dir = layerDiff > 0 ? 1 : -1;
            for (let i = 0; i < Math.abs(layerDiff); i++) {
                movePlan.push({ func: 'switchLayer', param: dir, delay: 100 });
            }
        }

        // 2. Simulate rotations to find the correct X position after wall kicks
        let simulatedPiece = JSON.parse(JSON.stringify(initialPlayerState));
        for (let i = 0; i < move.rotation; i++) {
            simulatedPiece.shape = rotateMatrix(simulatedPiece.shape);
            // Simulate wall kick logic from script.js
            let offset = 1;
            while (isCollision(board, simulatedPiece, rows, cols)) {
                simulatedPiece.pos.x += offset;
                offset = -(offset + (offset > 0 ? 1 : -1));
                // Safety break to prevent infinite loops in rare, complex cases.
                if (Math.abs(offset) > simulatedPiece.shape[0].length + 2) {
                    console.error("AI: Wall kick simulation failed, move might be invalid.");
                    simulatedPiece.pos.x -= (offset > 0 ? offset - 1 : offset + 1); // Revert last offset
                    break;
                }
            }
        }

        // 3. Add rotation actions to the plan
        for (let i = 0; i < move.rotation; i++) {
            movePlan.push({ func: 'rotate', param: undefined, delay: 100 });
        }

        // 4. Plan horizontal moves from the post-rotation position to the target X
        const postRotationX = simulatedPiece.pos.x;
        const moveDir = move.x > postRotationX ? 1 : -1;
        for (let i = 0; i < Math.abs(move.x - postRotationX); i++) {
            movePlan.push({ func: 'move', param: moveDir, delay: 100 });
        }

        // 5. Plan the final drop
        movePlan.push({ func: 'hardDrop', param: undefined, delay: 0 });
    }

    /**
     * Executes the next action in the move plan. Called by the main game loop.
     * @returns {number} The delay in milliseconds before the next action can be taken.
     */
    function executeNextPlannedMove() {
        if (movePlan.length > 0) {
            const nextAction = movePlan.shift();
            // BUGFIX: Correctly call the function on the gameAPI using the name from the plan.
            // The previous line was a typo and did not execute any game actions.
            if (typeof window.gameAPI[nextAction.func] === 'function') {
                window.gameAPI[nextAction.func](nextAction.param);
            }
            return nextAction.delay;
        }
        return 0;
    }

    // --- API Exposure ---

    // Expose the AI's action executor to the main game loop in script.js
    window.aiAPI = {
        executeNextPlannedMove: executeNextPlannedMove,
        enableAI: enableAI,
        disableAI: disableAI,
        isEnabled: () => aiEnabled
    };
})();