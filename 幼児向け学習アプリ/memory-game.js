// memory-game.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References (Single Player) ---
    // ダブルタップによるズームを防止
    document.body.style.touchAction = 'manipulation';

    const puzzleContainer = document.getElementById('puzzle-container');
    const grid = document.getElementById('memory-grid');
    const moveCountSpan = document.getElementById('move-count');
    const timeCountSpan = document.getElementById('time-count');
    const titleScreen = document.getElementById('title-screen');
    const startBtn = document.getElementById('start-btn');
    const winModal = document.getElementById('win-modal');
    const playAgainBtn = document.getElementById('play-again-btn');
    const cpuThinkingOverlay = document.getElementById('cpu-thinking-overlay');

    // --- DOM Element References (Selectors) ---
    const modeButtons = document.querySelectorAll('#mode-selector .mode-btn');
    const cpuLevelSelector = document.getElementById('cpu-level-selector');
    const cpuLevelButtons = document.querySelectorAll('#cpu-level-selector .cpu-level-btn');
    const difficultyButtons = document.querySelectorAll('#difficulty-selector .difficulty-btn');

    // --- DOM Element References (Multiplayer) ---
    const singlePlayerStats = document.getElementById('single-player-stats');
    const multiplayerStats = document.getElementById('multiplayer-stats');
    const player1Stat = document.getElementById('player1-stat');
    const player1Label = document.getElementById('player1-label');
    const player2Stat = document.getElementById('player2-stat');
    const player2Label = document.getElementById('player2-label');
    const player1ScoreSpan = document.getElementById('player1-score');
    const player2ScoreSpan = document.getElementById('player2-score');

    // --- DOM Element References (Win Modal) ---
    const winTitle = document.getElementById('win-title');
    const winMessage = document.getElementById('win-message');
    const winStatsSingle = document.getElementById('win-stats-single');
    const winTimeSpan = document.getElementById('win-time');
    const winMovesSpan = document.getElementById('win-moves');
    const winPointsSpan = document.getElementById('win-points');
    const winStatsMulti = document.getElementById('win-stats-multi');
    const winScore1Span = document.getElementById('win-score1');
    const winScore2Span = document.getElementById('win-score2');

    // --- Game Data (スライドパズルの画像を流用) ---
    // スライドパズルやジグソーパズルで使われている動物の画像リスト
    const PUZZLE_IMAGES_DATA = [
        'usagi', 'アシカ', 'イヌ', 'イルカ', 'ウマ', 'キリン', 'クジラ', 'クマ',
        'ゴリラ', 'サメ', 'サル', 'シャチ', 'トラ', 'ネコ', 'ハムスター',
        'パンダ', 'ペンギン', 'ライオン', 'リス', 'レッサーパンダ'
    ].map(name => ({
        id: name,
        name: name,
        src: `assets/images/${name}.png`
    }));

    // --- Game State ---
    let difficulty = 4; // Default: 4x4
    let gameMode = 'single'; // 'single', 'multi', or 'cpu'
    let firstCard, secondCard;
    let lockBoard = false;
    let matchedPairs = 0;
    let totalPairs = 0;
    // Single player state
    let moves = 0;
    let timer;
    let seconds = 0;
    // Multiplayer & CPU state
    let currentPlayer = 1;
    let playerScores = { 1: 0, 2: 0 };
    // CPU-specific state
    let cpuLevel = 'easy';
    let cpuMemory = new Map(); // コンピュータの記憶
    // CPUの記憶容量と戦略の確率を定義
    const cpuConfig = {
        easy:   { memoryLimit: 4,  knownPairChance: 0.25, smartMoveChance: 0.1 },
        medium: { memoryLimit: 8,  knownPairChance: 0.75, smartMoveChance: 0.6 },
        hard:   { memoryLimit: 16, knownPairChance: 0.95, smartMoveChance: 0.9 }
    };
 
    // --- Audio Files ---
    const AUDIO_FLIP = 'assets/sounds/card-flip.mp3';
    const AUDIO_MATCH = 'assets/sounds/seikai.mp3';
    const AUDIO_MISMATCH = 'assets/sounds/fuseikai.mp3';
    const AUDIO_WIN = 'assets/sounds/win.mp3';

    /**
     * 配列をシャッフルする (Fisher-Yates algorithm)
     * @param {Array} array - シャッフルする配列
     * @returns {Array} シャッフルされた配列
     */
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /** タイマーを開始する */
    function startTimer() {
        seconds = 0;
        timeCountSpan.textContent = formatTime(seconds);
        if (timer) clearInterval(timer);
        timer = setInterval(() => {
            seconds++;
            timeCountSpan.textContent = formatTime(seconds);
        }, 1000);
    }

    /** タイマーを停止する */
    function stopTimer() {
        clearInterval(timer);
    }

    /** 秒数を MM:SS 形式の文字列にフォーマットする */
    function formatTime(sec) {
        const minutes = Math.floor(sec / 60).toString().padStart(2, '0');
        const seconds = (sec % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    /** モードに応じてUIを更新する */
    function updateUIForMode() {
        if (gameMode === 'single') {
            singlePlayerStats.classList.remove('hidden');
            multiplayerStats.classList.add('hidden');
        } else { // 'multi' or 'cpu'
            singlePlayerStats.classList.add('hidden');
            multiplayerStats.classList.remove('hidden');
            if (gameMode === 'cpu') {
                player1Label.textContent = 'あなた:';
                player2Label.textContent = 'コンピュータ:';
            } else { // 'multi'
                player1Label.textContent = 'プレイヤー1:';
                player2Label.textContent = 'プレイヤー2:';
            }
        }
    }

    /** 対戦モードで現在のプレイヤーの番であることをハイライトする */
    function updatePlayerTurnUI() {
        if (gameMode === 'single') return;
        player1Stat.classList.toggle('active', currentPlayer === 1);
        player2Stat.classList.toggle('active', currentPlayer === 2);
    }

    /** ゲームボードを作成し、ゲームを開始する */
    function createGame() {
        // 状態をリセット
        grid.innerHTML = '';
        matchedPairs = 0;
        lockBoard = false;
        firstCard = null;
        secondCard = null;

        // 難易度に応じてグリッドのクラスを更新
        puzzleContainer.classList.remove('difficulty-4', 'difficulty-6', 'difficulty-8');
        puzzleContainer.classList.add(`difficulty-${difficulty}`);

        if (gameMode === 'single') {
            moves = 0;
            moveCountSpan.textContent = moves;
            stopTimer();
            startTimer();
        } else { // 'multi' or 'cpu'
            currentPlayer = 1;
            playerScores = { 1: 0, 2: 0 };
            player1ScoreSpan.textContent = '0';
            player2ScoreSpan.textContent = '0';
            // CPUモード用のリセット
            cpuMemory.clear();
        }

        // 難易度に応じてカードを準備
        totalPairs = (difficulty * difficulty) / 2;
        const shuffledImages = shuffle([...PUZZLE_IMAGES_DATA]).slice(0, totalPairs);
        const cardData = shuffle([...shuffledImages, ...shuffledImages]);

        // グリッドのレイアウトを設定
        grid.style.gridTemplateColumns = `repeat(${difficulty}, 1fr)`;

        // カード要素を生成してグリッドに追加
        cardData.forEach(item => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card'); // 初期状態は裏面
            cardElement.dataset.name = item.id;

            cardElement.innerHTML = `
                <div class="card-face card-front"></div>
                <div class="card-face card-back">
                    <img src="${item.src}" alt="${item.name}" draggable="false">
                </div>
            `;
            cardElement.addEventListener('click', flipCard);
            grid.appendChild(cardElement);
        });

        updateUIForMode();
        updatePlayerTurnUI();

        // 最初のターンがCPUだった場合
        if (gameMode === 'cpu' && currentPlayer === 2) {
            setTimeout(cpuTurn, 1500);
        }
    }

    /** カードをクリックしたときの処理 */
    function flipCard() {
        if (lockBoard || this === firstCard) return;

        playSE(AUDIO_FLIP);
        this.classList.add('is-flipped');

        if (!firstCard) {
            firstCard = this;
            return;
        }

        secondCard = this;
        if (gameMode === 'single') {
            moves++;
            moveCountSpan.textContent = moves;
        }
        lockBoard = true;

        checkForMatch();
    }

    /** 2枚のカードが一致するか確認する */
    function checkForMatch() {
        const isMatch = firstCard.dataset.name === secondCard.dataset.name;
        isMatch ? disableCards() : unflipCards();
    }

    /** 一致したカードを無効化する */
    function disableCards() {
        playSE(AUDIO_MATCH);

        if (gameMode === 'multi' || gameMode === 'cpu') {
            // 対戦モードではプレイヤーごとのクラスを適用
            const matchClass = `is-matched-p${currentPlayer}`;
            firstCard.classList.add(matchClass);
            secondCard.classList.add(matchClass);

            playerScores[currentPlayer]++;
            document.getElementById(`player${currentPlayer}-score`).textContent = playerScores[currentPlayer];
            // 正解したので、もう一度自分のターン
        } else {
            // ひとりプレイモードではデフォルトのクラスを適用
            firstCard.classList.add('is-matched');
            secondCard.classList.add('is-matched');
        }

        matchedPairs++;

        if (matchedPairs === totalPairs) {
            // ゲームクリア。最後のアニメーションが終わるのを待ってからクリア画面を表示
            setTimeout(winGame, 1000); // 1秒待つ (アニメーションは0.8秒)
        } else {
            // 次がCPUのターンなら、ボードリセットの前にオーバーレイを表示
            if (gameMode === 'cpu' && currentPlayer === 2) {
                cpuThinkingOverlay.classList.remove('hidden');
            }
            // まだカードが残っているので、次のターンに進むためにボードをリセット
            resetBoard();
            // CPUが正解した場合、続けてCPUのターン
            if (gameMode === 'cpu' && currentPlayer === 2) {
                setTimeout(cpuTurn, 1500);
            }
        }
    }

    /** 一致しなかったカードを元に戻す */
    function unflipCards() {
        playSE(AUDIO_MISMATCH);
        if (gameMode === 'multi' || gameMode === 'cpu') {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            updatePlayerTurnUI();
        }

        // 次がCPUのターンになることが確定した瞬間にオーバーレイを表示
        if (gameMode === 'cpu' && currentPlayer === 2) {
            cpuThinkingOverlay.classList.remove('hidden');
        }

        setTimeout(() => {
            firstCard.classList.remove('is-flipped');
            secondCard.classList.remove('is-flipped');
            resetBoard();

            // プレイヤーのミス後、CPUのターンへ
            if (gameMode === 'cpu' && currentPlayer === 2) {
                setTimeout(cpuTurn, 1500);
            } else {
                // プレイヤーのターンになったら思考中オーバーレイを隠す
                cpuThinkingOverlay.classList.add('hidden');
            }
        }, 1200);
    }

    /** ターン終了後にボードの状態をリセットする */
    function resetBoard() {
        [firstCard, secondCard] = [null, null];
        lockBoard = false;
    }

    /**
     * CPUの記憶にカードを追加する。記憶上限を超えた場合は最も古い記憶を削除する。
     * @param {HTMLElement} card - 記憶するカード要素
     */
    function addToCpuMemory(card) {
        // 既に記憶している場合は一度削除して、最新の記憶として再度追加する（記憶順を更新）
        if (cpuMemory.has(card)) {
            cpuMemory.delete(card);
        }
        cpuMemory.set(card, card);

        // 記憶上限を超えていたら、一番古い記憶を忘れる
        if (cpuMemory.size > cpuConfig[cpuLevel].memoryLimit) {
            // Map.keys()は挿入順を保持するため、最初のキーが最も古い
            const oldestCardKey = cpuMemory.keys().next().value;
            cpuMemory.delete(oldestCardKey);
        }
    }

    // ===================================================================
    // --- コンピュータ対戦 (CPU) ロジック ---
    // ===================================================================

    /** CPUの思考と行動 */
    function cpuTurn() {
        // オーバーレイの表示は、ターンが移る側（unflipCards, disableCards）で行う
 
        // 少し考えているように見せるための遅延
        setTimeout(() => {
            const availableCards = Array.from(document.querySelectorAll('.card:not(.is-flipped)'));
 
            // --- 戦略1: 記憶の中に揃うペアがあれば、難易度に応じた確率でめくる ---
            if (Math.random() < cpuConfig[cpuLevel].knownPairChance) {
                const knownPair = findKnownPairInCpuMemory();
                if (knownPair) {
                    pickCards(knownPair[0], knownPair[1]);
                    return;
                }
            }
 
            // --- 戦略2: 記憶にあるカードを1枚めくり、そのペアを記憶の中から探す ---
            // (人間らしい行動: まず1枚めくってから考える)
            if (Math.random() < cpuConfig[cpuLevel].smartMoveChance) {
                const knownCards = Array.from(cpuMemory.values()).filter(c => !c.classList.contains('is-flipped'));
                if (knownCards.length > 0) {
                    // 記憶の中からランダムに1枚選ぶ
                    const firstPick = knownCards[Math.floor(Math.random() * knownCards.length)];
                    const targetName = firstPick.dataset.name;
 
                    // そのペアが記憶の中にないか探す
                    const matchingCardInMemory = knownCards.find(c => c !== firstPick && c.dataset.name === targetName);
 
                    if (matchingCardInMemory) {
                        // ペアが記憶にあった (これは戦略1でカバーされるはずだが、念のため)
                        pickCards(firstPick, matchingCardInMemory);
                        return;
                    } else {
                        // ペアが記憶にないので、残りの利用可能なカードからランダムに1枚選ぶ
                        const otherAvailableCards = availableCards.filter(c => c !== firstPick);
                        if (otherAvailableCards.length > 0) {
                            const secondPick = otherAvailableCards[Math.floor(Math.random() * otherAvailableCards.length)];
                            pickCards(firstPick, secondPick);
                            return;
                        }
                    }
                }
            }
 
            // --- 戦略3: 上記の戦略に当てはまらない場合、完全にランダムに2枚めくる ---
            const card1 = availableCards[Math.floor(Math.random() * availableCards.length)];
            const card2 = availableCards.filter(c => c !== card1)[Math.floor(Math.random() * (availableCards.length - 1))];
            pickCards(card1, card2);
        }, 500); // 0.5秒後に思考を開始
    }
 
    /** CPUがカードを2枚選ぶ実際の動作 */
    function pickCards(card1, card2) {
        if (!card1 || !card2) { // 万が一カードが選べなかった場合
            cpuThinkingOverlay.classList.add('hidden');
            unflipCards(); // ターンをプレイヤーに戻す
            return;
        }
        // 1枚目を開く
        setTimeout(() => {
            card1.click();
            // CPUの記憶にカードを追加
            addToCpuMemory(card1);
        }, 800);
 
        // 2枚目を開く
        setTimeout(() => {
            card2.click();
            // CPUの記憶にカードを追加
            addToCpuMemory(card2);
        }, 1600);
    }
 
    /** CPUの記憶の中から、揃えられるペアを探す */
    function findKnownPairInCpuMemory() {
        const seenCards = Array.from(cpuMemory.values()).filter(card => !card.classList.contains('is-flipped'));
        const names = new Map();
        for (const card of seenCards) {
            const name = card.dataset.name;
            if (names.has(name)) {
                return [names.get(name), card]; // ペアが見つかった
            }
            names.set(name, card);
        }
        return null; // ペアは見つからなかった
    }

    /** ゲームクリア時の処理 */
    function winGame() {
        playSE(AUDIO_WIN);
        // CPUのターンでゲームが終了した場合に備えて、思考中オーバーレイを隠す
        cpuThinkingOverlay.classList.add('hidden');

        if (gameMode === 'single') {
            stopTimer();
            // パフォーマンスに応じてポイントを計算
            const basePoints = difficulty; // 4, 6, or 8
            const timePenalty = Math.floor(seconds / (difficulty * 5));
            const movePenalty = Math.floor((moves - totalPairs) / (difficulty / 2));
            let points = Math.max(1, basePoints - timePenalty - movePenalty);
            if (difficulty === 8 && points < 3) points = 3;
            if (difficulty === 6 && points < 2) points = 2;

            addPoints(points);

            // クリア画面に結果を表示
            winTitle.textContent = 'クリア！';
            winMessage.classList.add('hidden');
            winStatsSingle.classList.remove('hidden');
            winStatsMulti.classList.add('hidden');
            winTimeSpan.textContent = formatTime(seconds);
            winMovesSpan.textContent = moves;
            winPointsSpan.textContent = points;
        } else {
            // 対戦モードの勝敗判定
            winTitle.textContent = 'ゲームしゅうりょう！';
            winMessage.classList.remove('hidden');
            if (playerScores[1] > playerScores[2]) {
                winMessage.textContent = gameMode === 'cpu' ? 'あなたのかち！' : 'プレイヤー1のかち！';
            } else if (playerScores[2] > playerScores[1]) {
                winMessage.textContent = gameMode === 'cpu' ? 'コンピュータのかち！' : 'プレイヤー2のかち！';
            } else {
                winMessage.textContent = 'ひきわけ！';
            }

            winStatsSingle.classList.add('hidden');
            winStatsMulti.classList.remove('hidden');
            // ラベルも更新
            const p1ResultLabel = winStatsMulti.children[0];
            const p2ResultLabel = winStatsMulti.children[1];
            p1ResultLabel.innerHTML = `${gameMode === 'cpu' ? 'あなた' : 'プレイヤー1'}: <span id="win-score1">${playerScores[1]}</span>ペア`;
            p2ResultLabel.innerHTML = `${gameMode === 'cpu' ? 'コンピュータ' : 'プレイヤー2'}: <span id="win-score2">${playerScores[2]}</span>ペア`;

            // 対戦モードではポイントは加算しない
        }

        winModal.classList.remove('hidden');
    }

    /** 初期化処理 */
    function init() {
        startBtn.addEventListener('click', () => {
            titleScreen.classList.add('hidden');

            // BGMの再生を開始
            const bgm = document.getElementById('bgm');
            if (bgm && bgm.paused) {
                bgm.play().catch(e => console.error("BGMの再生に失敗しました:", e));
            }

            // ユーザーの操作後なので、ここでオーディオをプリロードする
            preloadAudioSources([AUDIO_FLIP, AUDIO_MATCH, AUDIO_MISMATCH, AUDIO_WIN]);
            createGame();
        });

        playAgainBtn.addEventListener('click', () => {
            winModal.classList.add('hidden');
            // ゲームをリセットする代わりに、難易度選択ができるスタート画面に戻す
            titleScreen.classList.remove('hidden');
        });
        playAgainBtn.classList.add('colorful-btn');

        // スタート画面でのモード選択
        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                modeButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                gameMode = button.dataset.mode;
                // CPUモードが選ばれたら、レベル選択を表示
                cpuLevelSelector.classList.toggle('hidden', gameMode !== 'cpu');
            });
        });

        // スタート画面でのCPUレベル選択
        cpuLevelButtons.forEach(button => {
            button.addEventListener('click', () => {
                cpuLevelButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                cpuLevel = button.dataset.level;
            });
        });

        // スタート画面での難易度選択
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                difficultyButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                // ゲームはまだ開始せず、難易度だけを更新する
                difficulty = parseInt(button.dataset.size, 10);
            });
        });
    }

    init();
});