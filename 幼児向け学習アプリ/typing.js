document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const timeLeftContainer = document.getElementById('time-left-container');
    const timeLeftDisplay = document.getElementById('time-left');
    const elapsedTimeContainer = document.getElementById('elapsed-time-container');
    const elapsedTimeDisplay = document.getElementById('elapsed-time');
    const scoreDisplay = document.getElementById('score');
    const questionContainer = document.getElementById('question-container');
    const questionDisplay = document.getElementById('question-display');
    const questionRomajiDisplay = document.getElementById('question-romaji');
    const virtualKeyboardContainer = document.getElementById('virtual-keyboard');
    const hiddenInput = document.getElementById('typing-input-hidden');
    const difficultySelector = document.getElementById('difficulty-selector');
    const resultModal = document.getElementById('result-modal');
    const countdownNumber = document.getElementById('countdown-number');
    const finalScoreDisplay = document.getElementById('final-score');
    const accuracyDisplay = document.getElementById('accuracy');
    const wpmScoreDisplay = document.getElementById('wpm-score');
    const playAgainBtn = document.getElementById('play-again-btn');
    const typedWordsContainer = document.getElementById('typed-words-container');
    const typedWordsList = document.getElementById('typed-words-list');
    const startGameBtn = document.getElementById('start-game-btn');
    const stopGameBtn = document.getElementById('stop-game-btn');

    // --- Constants ---
    const DIFFICULTIES = {
        easy: { time: 60, maxLength: 4 },
        normal: { time: 60, maxLength: 99 },
        hard: { time: 60, minLength: 5 },
        training: { time: Infinity, minLength: 1, maxLength: 99 }
    };
    const KEY_LAYOUT = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '-', 'Backspace'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];
    const FINGER_MAP = {
        'finger-pinky-l': ['Q', 'A', 'Z'],
        'finger-ring-l': ['W', 'S', 'X'],
        'finger-middle-l': ['E', 'D', 'C'],
        'finger-index-l': ['R', 'F', 'V', 'T', 'G', 'B'],
        'finger-index-r': ['Y', 'H', 'N', 'U', 'J', 'M'],
        'finger-middle-r': ['I', 'K'],
        'finger-ring-r': ['O', 'L'],
        'finger-pinky-r': ['P', '-'],
    };
    const SOUNDS = {
        type: 'assets/sounds/type.mp3',
        correct: 'assets/sounds/seikai2.mp3',      // 単語正解 (他のゲームと統一)
        wrong: 'assets/sounds/fuseikai.mp3',   // タイプミス (他のゲームと統一)
        finish: 'assets/sounds/finish.mp3',     // ゲーム終了・モード解除
        secret: 'assets/sounds/seikai2.mp3'     // 裏コード成功
    };
    const SOUND_EFFECTS = Object.values(SOUNDS);
    // キーと指のマッピングを逆引きできるように作成
    const KEY_TO_FINGER_MAP = Object.entries(FINGER_MAP).reduce((acc, [fingerClass, keys]) => {
        keys.forEach(key => {
            acc[key] = fingerClass;
        });
        return acc;
    }, {});

    // --- Game State & Config ---
    const gameState = {
        score: 0,
        timeLeft: 0,
        elapsedTime: 0,
        timerId: null,
        currentWord: null,    // { h: 'ひらがな', r: '表示用R' , rSanitized: 'ASCIIのみ大文字' }
        typedRomaji: '',
        totalTyped: 0,
        totalCorrect: 0,
        typedWordsHistory: [], // 今回タイプした単語の履歴
        isPlaying: false,     // 実際に入力を受け付けるかどうか（カウントダウン後に true にする）
    };
    let gameConfig = {
        difficulty: 'normal',
        isAdultMode: false, // ★追加: おとなモードの状態
    };
    let bgmInitialized = false;
    let countdownIntervalId = null;
    // ★追加: 裏コード関連
    let secretCodeBuffer = '';
    const SECRET_CODE = 'OTAKU';

    // --- Helpers ---
    function sanitizeRomaji(str) {
        if (!str) return '';
        return String(str).toUpperCase().replace(/[^A-Z-]/g, '');
    }

    // --- Initialization functions (BGM/SFX) ---
    function initializeBGM() {
        if (bgmInitialized) return;
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.play().catch(error => console.log('BGMの再生にはユーザーの操作が必要です。', error));
        }
        if (typeof preloadAudioSources === 'function') {
            preloadAudioSources(SOUND_EFFECTS);
        }
        bgmInitialized = true;
    }

    // --- Virtual keyboard creation ---
    function createVirtualKeyboard() {
        virtualKeyboardContainer.innerHTML = '';
        KEY_LAYOUT.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            row.forEach(key => {
                const keyBtn = document.createElement('button');
                keyBtn.className = 'keyboard-key';
                keyBtn.dataset.key = key; // Backspace は 'Backspace'、文字は 'A' など

                if (key === 'Backspace') {
                    keyBtn.textContent = 'けす';
                    keyBtn.classList.add('key-backspace');
                } else {
                    keyBtn.textContent = key;
                    for (const fingerClass in FINGER_MAP) {
                        if (FINGER_MAP[fingerClass].includes(key)) {
                            keyBtn.classList.add(fingerClass);
                            break;
                        }
                    }
                }
                rowDiv.appendChild(keyBtn);
            });
            virtualKeyboardContainer.appendChild(rowDiv);
        });
    }

    // --- Timer ---
    function updateTimerDisplay() {
        if (gameConfig.difficulty === 'training') {
            elapsedTimeDisplay.textContent = gameState.elapsedTime;
        } else {
            timeLeftDisplay.textContent = gameState.timeLeft;
        }
    }

    function startTimer() {
        stopTimer(); // 念のためクリア
        gameState.timerId = setInterval(() => {
            gameState.elapsedTime++;
            if (gameConfig.difficulty !== 'training') {
                gameState.timeLeft--;
                if (gameState.timeLeft <= 0) {
                    endGame();
                }
            }
            updateTimerDisplay();
        }, 1000);
    }

    function stopTimer() {
        if (gameState.timerId) {
            clearInterval(gameState.timerId);
            gameState.timerId = null;
        }
    }

    // --- Game control: start / end / countdown ---
    function startGame() {
        initializeBGM();

        // リセット（カウントダウン開始前は isPlaying=false）
        gameState.score = 0;
        gameState.elapsedTime = 0;
        gameState.totalTyped = 0;
        gameState.totalCorrect = 0;
        gameState.timeLeft = DIFFICULTIES[gameConfig.difficulty].time;
        gameState.typedRomaji = '';
        gameState.typedWordsHistory = [];
        gameState.currentWord = null;
        gameState.isPlaying = false; // カウントダウンが終わるまで false

        updateTimerDisplay();
        scoreDisplay.textContent = gameState.score;
        resultModal.classList.add('hidden');

        typedWordsContainer.classList.add('hidden');
        // UI
        startGameBtn.classList.add('hidden');
        stopGameBtn.classList.remove('hidden');
        difficultySelector.querySelectorAll('.difficulty-btn').forEach(btn => btn.disabled = true);

        questionContainer.classList.add('countdown-active');
        runCountdown();
    }

    function endGame() {
        // カウントダウン中の場合もタイマーを止め、UIをリセット
        if (countdownIntervalId) {
            clearInterval(countdownIntervalId);
            countdownIntervalId = null;
            countdownNumber.classList.add('hidden');
            questionContainer.classList.remove('countdown-active');
        }

        // 停止タイマー
        stopTimer();

        // isPlaying を false にして入力を無効化
        const wasPlaying = gameState.isPlaying;
        gameState.isPlaying = false;

        if (wasPlaying && typeof playSE === 'function') {
            playSE(SOUNDS.finish);
        }

        // 結果表示（ゲーム中でなくても表示する仕様）
        finalScoreDisplay.textContent = gameState.score || 0;
        const accuracy = gameState.totalTyped > 0 ? Math.round((gameState.totalCorrect / gameState.totalTyped) * 100) : 0;
        accuracyDisplay.textContent = accuracy;
        const elapsedTimeInMinutes = gameState.elapsedTime / 60;
        const wpm = elapsedTimeInMinutes > 0 ? Math.round((gameState.totalCorrect / 5) / elapsedTimeInMinutes) : 0;
        wpmScoreDisplay.textContent = wpm;

        // 「れんしゅう」モード以外で、単語リストを表示
        if (gameConfig.difficulty !== 'training' && gameState.typedWordsHistory.length > 0) {
            typedWordsList.innerHTML = ''; // 前回のリストをクリア
            gameState.typedWordsHistory.forEach(word => {
                const wordItem = document.createElement('div');
                wordItem.classList.add('typed-word-item');
                wordItem.textContent = word;
                typedWordsList.appendChild(wordItem);
            });
            typedWordsContainer.classList.remove('hidden');
        } else {
            typedWordsContainer.classList.add('hidden');
        }
        resultModal.classList.remove('hidden');

        // UIリセット
        stopGameBtn.classList.add('hidden');
        startGameBtn.classList.remove('hidden');
        difficultySelector.querySelectorAll('.difficulty-btn').forEach(btn => btn.disabled = false);
        questionDisplay.textContent = 'おつかれさまでした！';
        questionRomajiDisplay.textContent = '';
    }

    function runCountdown() {
        let count = 3;
        countdownNumber.textContent = count;
        countdownNumber.classList.remove('hidden', 'start-text');

        // 既存のカウントインターバルがあればクリア
        if (countdownIntervalId) {
            clearInterval(countdownIntervalId);
            countdownIntervalId = null;
        }

        countdownIntervalId = setInterval(() => {
            count--;
            countdownNumber.classList.remove('countdown-animation');
            void countdownNumber.offsetWidth; // reflow to restart animation
            countdownNumber.classList.add('countdown-animation');

            if (count > 0) {
                countdownNumber.textContent = count;
            } else if (count === 0) {
                countdownNumber.textContent = 'スタート！';
                countdownNumber.classList.add('start-text');
            } else {
                // カウントダウン終了
                clearInterval(countdownIntervalId);
                countdownIntervalId = null;
                countdownNumber.classList.add('hidden');
                questionContainer.classList.remove('countdown-active');

                // タイマー開始・問題出題・入力受付開始
                startTimer();
                gameState.isPlaying = true;
                nextQuestion();

                // hidden input にフォーカスを当てておく（任意）
                try { hiddenInput.focus(); } catch (e) { /* ignore */ }
            }
        }, 1000);
    }

    // --- Word selection / display ---
    function getFilteredWords() {
        const { maxLength, minLength } = DIFFICULTIES[gameConfig.difficulty];
        // ★変更: おとなモードか、またWORDS_ADULTが存在するかで単語リストを切り替える
        const sourceWords = (gameConfig.isAdultMode && typeof WORDS_ADULT !== 'undefined') ? WORDS_ADULT : WORDS;
        // フィルタは正規化したローマ字の長さで行う（表示と判定の不整合を避けるため）
        return sourceWords.filter(word => {
            const s = sanitizeRomaji(word.r);
            if (maxLength && s.length > maxLength) return false;
            if (minLength && s.length < minLength) return false;
            return s.length > 0; // 絶対に空文字列は除外
        });
    }

    function nextQuestion() {
        const wordPool = getFilteredWords();
        if (!wordPool || wordPool.length === 0) {
            endGame();
            questionDisplay.textContent = 'もんだいがありません';
            return;
        }

        gameState.typedRomaji = '';

        // ランダム選択（シンプル）
        const randomIndex = Math.floor(Math.random() * wordPool.length);
        const word = wordPool[randomIndex];

        // 表示用ローマ字と、比較用（アルファベットのみ大文字）を保持
        const displayR = String(word.r || '').toUpperCase();
        const sanitizedR = sanitizeRomaji(displayR);

        // 安全性: sanitizedR が空の場合は別の単語を選ぶ（ただの保険）
        if (sanitizedR.length === 0) {
            // 再帰的に次を選ぶ（wordPool は sanitized length >0 になっているはずなので通常はここに来ない）
            nextQuestion();
            return;
        }

        gameState.currentWord = {
            h: word.h,
            r: displayR,
            rSanitized: sanitizedR
        };

        // 表示更新
        updateQuestionDisplay();
        highlightNextKey();
    }

    function updateQuestionDisplay() {
        const cw = gameState.currentWord;
        if (!cw) {
            questionDisplay.innerHTML = '';
            questionRomajiDisplay.innerHTML = '';
            return;
        }

        const hiragana = cw.h || '';
        const romaji = cw.rSanitized || '';
        const typed = gameState.typedRomaji || '';

        // ひらがな表示（元の文字列そのまま）
        let html = '';
        for (let i = 0; i < hiragana.length; i++) {
            html += `<span>${hiragana[i]}</span>`;
        }
        questionDisplay.innerHTML = html;

        // ローマ字表示（1文字ずつ正誤反映 & 指の色分け）
        let romajiHtml = '';
        for (let i = 0; i < romaji.length; i++) {
            const char = romaji[i];
            if (i < typed.length) {
                romajiHtml += `<span class="char-typed">${char}</span>`;
            } else {
                const fingerClass = KEY_TO_FINGER_MAP[char] || '';
                const colorClass = fingerClass.replace('finger-', 'color-');
                romajiHtml += `<span class="${colorClass}">${char}</span>`;
            }
        }
        questionRomajiDisplay.innerHTML = romajiHtml;
    }

    // --- Input handling ---
    function handleInput(rawKey) {
        if (!gameState.isPlaying) return;

        if (!rawKey || typeof rawKey !== 'string') return;

        // Backspace は handleBackspace() で処理されるためここでは A-Z の単一文字のみ扱う
        const key = String(rawKey).toUpperCase();

        if (!/^[A-Z-]$/.test(key)) return;

        // currentWord があるか（ないなら無視）
        const cw = gameState.currentWord;
        if (!cw || !cw.rSanitized) return;

        const romaji = cw.rSanitized;
        const nextChar = romaji[gameState.typedRomaji.length];

        // nextChar が undefined のとき（すでに完了している等）は無視
        if (!nextChar) return;

        if (key === nextChar) {
            if (typeof playSE === 'function') playSE(SOUNDS.type);
            gameState.typedRomaji += key;
            gameState.totalTyped++;
            gameState.totalCorrect++;

            // 完了判定（sanitized 長さで比較）
            if (gameState.typedRomaji.length === romaji.length) {
                if (typeof playSE === 'function') playSE(SOUNDS.correct);
                gameState.score++;
                scoreDisplay.textContent = gameState.score;

                if (typeof addPoints === 'function') {
                    try { addPoints(1); } catch (e) { /* 外部実装が例外を投げても続行 */ }
                }
            
            // 単語履歴に追加
            if (cw.h) {
                gameState.typedWordsHistory.push(cw.h);
            }

                // 次の問題へ移る
                nextQuestion();
            } else {
                // 次に押すべきキーをハイライト
                highlightNextKey();
                // 表示更新（部分正解反映）
                updateQuestionDisplay();
            }
        } else {
            // 不正解: サウンドのみ・typed はリセットしない（以前の仕様に合わせる）
            if (typeof playSE === 'function') playSE(SOUNDS.wrong);
            gameState.totalTyped++;
            // 表示更新（間違いを反映しない設計ならここでは変化なし）
            updateQuestionDisplay();
        }

        // キーフィードバック（仮想キーボード）
        showKeyFeedback(key);
    }

    function handleBackspace() {
        if (!gameState.isPlaying) return;
        if (!gameState.typedRomaji || gameState.typedRomaji.length === 0) return;

        gameState.typedRomaji = gameState.typedRomaji.slice(0, -1);
        updateQuestionDisplay();
        highlightNextKey();
        showKeyFeedback('Backspace');
    }

    // ★追加: おとなモード切り替え
    function toggleAdultMode() {
        gameConfig.isAdultMode = !gameConfig.isAdultMode;
        document.body.classList.toggle('adult-mode', gameConfig.isAdultMode);

        // モードが切り替わったことをユーザーにフィードバック
        if (gameConfig.isAdultMode) {
            questionDisplay.textContent = 'おたくモード';
            questionRomajiDisplay.textContent = 'OTONA-MODE';
            if (typeof playSE === 'function') playSE(SOUNDS.secret);
        } else {
            questionDisplay.textContent = 'こどもモード';
            questionRomajiDisplay.textContent = 'KODOMO-MODE';
            if (typeof playSE === 'function') playSE(SOUNDS.finish); // 違う音でフィードバック
        }

        // 2秒後に表示をリセット
        setTimeout(() => {
            if (!gameState.isPlaying) {
                questionDisplay.textContent = 'スタートボタンを おしてね！';
                questionRomajiDisplay.textContent = '';
            }
        }, 2000);
    }

    // --- UI helpers ---
    function showKeyFeedback(keyChar) {
        const lookupKey = keyChar === 'Backspace' ? 'Backspace' : String(keyChar).toUpperCase();
        const keyElement = virtualKeyboardContainer.querySelector(`[data-key="${lookupKey}"]`);
        if (keyElement) {
            keyElement.classList.add('active');
            setTimeout(() => keyElement.classList.remove('active'), 150);
        }
    }

    function highlightNextKey() {
        virtualKeyboardContainer.querySelectorAll('.key-highlight').forEach(el => el.classList.remove('key-highlight'));

        const cw = gameState.currentWord;
        if (!gameState.isPlaying || !cw || !cw.rSanitized) return;

        const nextChar = cw.rSanitized[gameState.typedRomaji.length];
        if (nextChar) {
            const keyElement = virtualKeyboardContainer.querySelector(`[data-key="${nextChar}"]`);
            if (keyElement) keyElement.classList.add('key-highlight');
        }
    }

    // --- Event listeners ---
    document.addEventListener('keydown', (e) => {
        // ★追加: 裏コードのチェック (ゲーム中でないときだけ)
        if (!gameState.isPlaying && e.key.length === 1 && /[a-z]/i.test(e.key)) {
            const key = e.key.toUpperCase();
            secretCodeBuffer = (secretCodeBuffer + key).slice(-SECRET_CODE.length);
            if (secretCodeBuffer === SECRET_CODE) {
                toggleAdultMode();
                secretCodeBuffer = ''; // バッファをリセット
                e.preventDefault(); // 他の処理を中断
                return;
            }
        }

        // Enter でゲームスタート（スタートボタンが見えているとき）
        if (!gameState.isPlaying && e.key === 'Enter' && !startGameBtn.classList.contains('hidden')) {
            startGameBtn.click();
            return;
        }

        // カウントダウン中やゲーム外ではそれ以外は無視
        if (!gameState.isPlaying) return;

        if (e.key === 'Backspace') {
            e.preventDefault();
            handleBackspace();
        } else if ((e.key.length === 1 && /[a-z]/i.test(e.key)) || e.key === '-') {
            e.preventDefault();
            handleInput(e.key.toUpperCase());
        }
    });

    // 仮想キーボードのクリック
    virtualKeyboardContainer.addEventListener('click', (e) => {
        if (!e.target.classList.contains('keyboard-key')) return;
        if (!gameState.isPlaying) return;

        const key = e.target.dataset.key;
        if (!key) return;

        if (key === 'Backspace') {
            handleBackspace();
        } else {
            handleInput(String(key).toUpperCase());
        }
    });

    // 難易度セレクタ
    difficultySelector.addEventListener('click', (e) => {
        if (!e.target.classList.contains('difficulty-btn') || gameState.isPlaying) return;
        gameConfig.difficulty = e.target.dataset.difficulty;

        difficultySelector.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');

        if (gameConfig.difficulty === 'training') {
            elapsedTimeContainer.classList.remove('hidden');
            timeLeftContainer.classList.add('hidden');
            gameState.elapsedTime = 0;
        } else {
            elapsedTimeContainer.classList.add('hidden');
            timeLeftContainer.classList.remove('hidden');
            gameState.timeLeft = DIFFICULTIES[gameConfig.difficulty].time;
        }
        updateTimerDisplay();
    });

    // ボタン
    startGameBtn.addEventListener('click', startGame);
    stopGameBtn.addEventListener('click', endGame);
    playAgainBtn.addEventListener('click', () => {
        resultModal.classList.add('hidden');
    });

    // 初期化
    function initializeGame() {
        createVirtualKeyboard();
        gameState.timeLeft = DIFFICULTIES[gameConfig.difficulty].time;
        updateTimerDisplay();
        const btn = difficultySelector.querySelector(`[data-difficulty="${gameConfig.difficulty}"]`);
        if (btn) btn.classList.add('selected');

        // サウンド系プリロード（最初のタッチ／クリックで実行）
        document.body.addEventListener('click', initializeBGM, { once: true });
        document.body.addEventListener('touchstart', initializeBGM, { once: true });
    }

    initializeGame();
}); // DOMContentLoaded end
