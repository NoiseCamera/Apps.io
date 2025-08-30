document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const currentQEl = document.getElementById('current-q');
    const totalQEl = document.getElementById('total-q');
    const hintTextEl = document.getElementById('hint-text');
    const hintImageEl = document.getElementById('hint-image');
    const answerArea = document.getElementById('answer-area');
    const choicesArea = document.getElementById('choices-area');
    const checkButton = document.getElementById('check-button');
    // --- 難易度選択とメインゲームの要素 ---
    const difficultySelectionArea = document.getElementById('difficulty-selection-area');
    const mainGame = document.getElementById('main-game');
    const pauseBtn = document.getElementById('pause-btn');
    const backToDifficultyBtn = document.getElementById('back-to-difficulty-btn');
    const totalTimeEl = document.getElementById('total-time');
    // --- モーダル関連 ---
    const resultModalOverlay = document.getElementById('result-modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const pauseModalOverlay = document.getElementById('pause-modal-overlay');
    const resumeGameBtn = document.getElementById('resume-game-btn');
    const quitToDifficultyBtn = document.getElementById('quit-to-difficulty-btn');
    // --- 新しい要素と音声の追加 ---
    const feedbackOverlay = document.getElementById('feedback-overlay');
    const feedbackIcon = document.getElementById('feedback-icon');
    const seikaiSound = new Audio('assets/sounds/seikai.mp3');
    const incorrectSound = new Audio('assets/sounds/incorrect.mp3');
    const bgm = new Audio('assets/sounds/bgm4.mp3');
    bgm.loop = true;
    bgm.volume = 0.3; // BGMの音量を少し下げる

    const QUESTIONS_PER_GAME = 10;

    // --- ゲームの状態 ---
    let currentPuzzleIndex = 0;
    let currentPuzzles = []; // 選択された難易度の問題リスト
    let currentAnswerSlots = []; // ユーザーが選択した答えを格納
    let isChecking = false; // 重複チェック防止フラグ
    let isAnimating = false; // アニメーション中の操作を禁止するフラグ
    let gameStartTime = 0;
    let totalTimeTimerId = null;
    let lastDifficulty = ''; // 最後に選んだ難易度を保存
    let pauseStartTime = 0; // タイマー一時停止時の時刻を保存

    // --- 関数 ---

    // --- アニメーション関数 ---
    function animateCharSelect(choiceEl, box) {
        const char = choiceEl.textContent;
        if (!char) return;
        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        const choiceRect = choiceEl.getBoundingClientRect();
        const boxRect = box.getBoundingClientRect();
        const flyingChar = document.createElement('div');
        flyingChar.textContent = char;
        flyingChar.className = 'flying-char';
        flyingChar.style.left = `${choiceRect.left - containerRect.left}px`;
        flyingChar.style.top = `${choiceRect.top - containerRect.top}px`;
        container.appendChild(flyingChar);
        // 元のタイルを即座に使用済みの灰色にする
        choiceEl.classList.add('used');
        requestAnimationFrame(() => {
            const deltaX = boxRect.left - choiceRect.left;
            const deltaY = boxRect.top - choiceRect.top;
            flyingChar.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        });
        flyingChar.addEventListener('transitionend', () => {
            flyingChar.remove();
            box.textContent = char;
            box.classList.add('filled');
            isAnimating = false;
        }, { once: true });
    }

    function animateCharReturn(box, choiceEl) {
        const char = box.textContent;
        if (!char) return;
        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        const boxRect = box.getBoundingClientRect();
        const choiceRect = choiceEl.getBoundingClientRect();
        const flyingChar = document.createElement('div');
        flyingChar.textContent = char;
        flyingChar.className = 'flying-char';
        flyingChar.style.left = `${boxRect.left - containerRect.left}px`;
        flyingChar.style.top = `${boxRect.top - containerRect.top}px`;
        container.appendChild(flyingChar);
        box.textContent = '';
        box.classList.remove('filled');
        requestAnimationFrame(() => {
            const deltaX = choiceRect.left - boxRect.left;
            const deltaY = choiceRect.top - boxRect.top;
            flyingChar.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        });
        flyingChar.addEventListener('transitionend', () => {
            flyingChar.remove();
            choiceEl.classList.remove('used');
            isAnimating = false;
        }, { once: true });
    }

    // --- タイマー関数 ---
    function stopTotalTimer() {
        if (totalTimeTimerId) {
            clearInterval(totalTimeTimerId);
            totalTimeTimerId = null;
        }
    }

    function resumeTotalTimer() {
        if (pauseStartTime > 0) {
            const pausedDuration = Date.now() - pauseStartTime;
            gameStartTime += pausedDuration;
            pauseStartTime = 0;
        }
        // Restart the visual update
        if (!totalTimeTimerId) {
            totalTimeTimerId = setInterval(() => {
                const elapsedTime = Math.floor((Date.now() - gameStartTime) / 1000);
                totalTimeEl.textContent = elapsedTime;
            }, 1000);
        }
    }

    function startTotalTimer() {
        stopTotalTimer();
        gameStartTime = Date.now();
        totalTimeEl.textContent = 0;
        totalTimeTimerId = setInterval(() => {
            const elapsedTime = Math.floor((Date.now() - gameStartTime) / 1000);
            totalTimeEl.textContent = elapsedTime;
        }, 1000);
    }

    // 配列をシャッフルする関数
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 次の問題に進むか、最終結果を表示する関数
    function goToNextQuestionOrShowResult() {
        if (currentPuzzleIndex < currentPuzzles.length - 1) {
            currentPuzzleIndex++;
            setupPuzzle();
        } else {
            showFinalResult();
        }
    }

    // 問題をセットアップする関数
    function setupPuzzle() {
        answerArea.innerHTML = '';
        choicesArea.innerHTML = '';
        currentAnswerSlots = [];
        const puzzle = currentPuzzles[currentPuzzleIndex];
        const answer = puzzle.answer;
        hintTextEl.textContent = puzzle.hint;
        hintImageEl.src = puzzle.image;
        hintImageEl.alt = answer;
        currentQEl.textContent = currentPuzzleIndex + 1;
        totalQEl.textContent = currentPuzzles.length;
        answerArea.classList.remove('shake');
        for (let i = 0; i < answer.length; i++) {
            const box = document.createElement('div');
            box.classList.add('answer-box');
            box.dataset.index = i;
            box.addEventListener('click', () => returnChar(box));
            answerArea.appendChild(box);
        }
        const shuffledChars = shuffle([...answer]);
        shuffledChars.forEach((char, index) => {
            const charEl = document.createElement('div');
            charEl.classList.add('choice-char');
            charEl.textContent = char;
            charEl.dataset.id = index;
            charEl.addEventListener('click', () => selectChar(charEl));
            choicesArea.appendChild(charEl);
        });
        resultModalOverlay.classList.remove('visible');
        isChecking = false;
        checkButton.style.display = 'block';
        checkButton.disabled = false;
    }

    // 選択肢の文字を選んだ時の処理
    function selectChar(charEl) {
        if (charEl.classList.contains('used') || isChecking || isAnimating) return;
        const emptyBox = Array.from(answerArea.children).find(box => !box.textContent);
        if (emptyBox) {
            isAnimating = true;
            animateCharSelect(charEl, emptyBox);
            currentAnswerSlots[parseInt(emptyBox.dataset.index, 10)] = {
                char: charEl.textContent,
                choiceElement: charEl
            };
        }
    }
    
    // 間違えたときにすべての文字をアニメーションで戻す
    function resetAllCharsWithAnimation() {
        Array.from(answerArea.children).forEach(box => {
            const index = parseInt(box.dataset.index, 10);
            const slotData = currentAnswerSlots[index];
            if (slotData) {
                animateCharReturn(box, slotData.choiceElement);
                delete currentAnswerSlots[index];
            }
        });
    }

    // 答えのボックスから文字を戻す処理
    function returnChar(box) {
        if (isChecking || isAnimating) return;
        const index = parseInt(box.dataset.index, 10);
        const slotData = currentAnswerSlots[index];
        if (!slotData) return;
        isAnimating = true;
        animateCharReturn(box, slotData.choiceElement);
        delete currentAnswerSlots[index];
    }

    // 答えをチェックする関数
    function checkAnswer() {
        if (isChecking || isAnimating) return;
        const userAnswer = Array.from(answerArea.children).map(box => box.textContent).join('');
        const correctAnswer = currentPuzzles[currentPuzzleIndex].answer;
        if (userAnswer.length !== correctAnswer.length) {
            showAlertModal('すべてのマスにもじをいれてね！');
            return;
        }

        stopTotalTimer();
        pauseStartTime = Date.now();

        isChecking = true;
        checkButton.disabled = true;
        if (userAnswer === correctAnswer) {
            showFeedback(true);
            setTimeout(() => {
                resumeTotalTimer();
                goToNextQuestionOrShowResult();
            }, 1500);
        } else {
            showFeedback(false);
            answerArea.classList.add('shake');
            answerArea.addEventListener('animationend', () => {
                answerArea.classList.remove('shake');
            }, { once: true });
            setTimeout(() => {
                resetAllCharsWithAnimation();
                setTimeout(() => {
                    isChecking = false;
                    checkButton.disabled = false;
                    resumeTotalTimer();
                }, 500);
            }, 1500);
        }
    }

    // アラート用のモーダルを表示する関数
    function showAlertModal(message) {
        stopTotalTimer();
        pauseStartTime = Date.now();

        modalTitle.textContent = 'おしらせ';
        modalMessage.innerHTML = message; // innerHTMLでテキストを設定
        document.getElementById('reward-message').classList.add('hidden'); // 念のため報酬メッセージは隠す
        nextQuestionBtn.textContent = 'わかった';
        backToDifficultyBtn.classList.add('hidden');
        nextQuestionBtn.onclick = () => {
            resultModalOverlay.classList.remove('visible');
            resumeTotalTimer();
        };
        resultModalOverlay.classList.add('visible');
    }

    // 正解・不正解のフィードバックを表示する関数
    function showFeedback(isCorrect) {
        if (isCorrect) {
            feedbackIcon.textContent = '〇';
            feedbackIcon.className = 'feedback-icon correct';
            seikaiSound.play();
        } else {
            feedbackIcon.textContent = '×';
            feedbackIcon.className = 'feedback-icon incorrect';
            incorrectSound.play();
        }
        feedbackOverlay.classList.add('visible');
        setTimeout(() => {
            feedbackOverlay.classList.remove('visible');
            feedbackIcon.textContent = '';
        }, 1200);
    }
    
    // 最終結果を表示する関数
    function showFinalResult() {
        stopTotalTimer();
        const elapsedTime = Math.floor((Date.now() - gameStartTime) / 1000);
        let starsEarned = 0;
        const averageTimePerQuestion = currentPuzzles.length > 0 ? elapsedTime / currentPuzzles.length : 0;
        
        // 1問あたりの平均時間で星の数を決定
        if (averageTimePerQuestion <= 20) { // 平均10秒以内
            starsEarned = 6;
        } else if (averageTimePerQuestion <= 30) { // 平均20秒以内
            starsEarned = 3;
        } else if (averageTimePerQuestion > 0) { // クリアはした
            starsEarned = 1;
        }

        // アプリ共通のポイント加算関数を呼び出す
        if (typeof window.addPoints === 'function') {
            window.addPoints(starsEarned);
        }

        // --- モーダル内の要素を更新 ---
        const rewardMessageEl = document.getElementById('reward-message');
        const earnedStarsEl = document.getElementById('earned-stars');
        
        modalMessage.innerHTML = `かかったじかんは <span id="final-time">${elapsedTime}</span> びょうでした！`;

        if (starsEarned > 0) {
            earnedStarsEl.textContent = starsEarned;
            rewardMessageEl.classList.remove('hidden');
        } else {
            rewardMessageEl.classList.add('hidden');
        }

        modalTitle.textContent = 'ゲームクリア！';
        nextQuestionBtn.textContent = 'おなじなんいどでもういちど';
        backToDifficultyBtn.classList.remove('hidden');
        checkButton.style.display = 'none';
        resultModalOverlay.classList.add('visible');

        nextQuestionBtn.onclick = () => {
            resultModalOverlay.classList.remove('visible');
            rewardMessageEl.classList.add('hidden');
            backToDifficultyBtn.classList.add('hidden');
            startGame(lastDifficulty);
        };
    }

    // 難易度選択画面を表示する関数
    function showDifficultySelection() {
        mainGame.classList.add('hidden');
        resultModalOverlay.classList.remove('visible');
        pauseModalOverlay.classList.remove('visible'); // ポーズ画面も閉じる
        difficultySelectionArea.classList.remove('hidden');
        backToDifficultyBtn.classList.add('hidden');
        stopTotalTimer();
    }

    // ゲームを開始する関数
    function startGame(difficulty) {
        lastDifficulty = difficulty; // 最後に選んだ難易度を保存
        if (bgm.paused) {
            bgm.play().catch(e => console.error("BGMの再生に失敗しました:", e));
        }
        let filteredPuzzles = [];
        
        // 難易度に応じて問題をフィルタリング
        if (difficulty === 'easy') {
            filteredPuzzles = puzzles.filter(p => p.answer.length >= 2 && p.answer.length <= 3);
        } else if (difficulty === 'normal') {
            filteredPuzzles = puzzles.filter(p => p.answer.length >= 3 && p.answer.length <= 4);
        } else if (difficulty === 'hard') {
            filteredPuzzles = puzzles.filter(p => p.answer.length >= 4);
        } else if (difficulty === 'all') {
            filteredPuzzles = [...puzzles];
        }

        if (filteredPuzzles.length < QUESTIONS_PER_GAME && difficulty !== 'all') {
            alert(`このなんいどのもんだいは${QUESTIONS_PER_GAME}もんありません。(${filteredPuzzles.length}もん)`);
            return;
        }
        if (filteredPuzzles.length === 0) {
            alert('このなんいどのもんだいは まだありません。');
            return;
        }

        shuffle(filteredPuzzles);
        if (difficulty === 'all') {
            currentPuzzles = filteredPuzzles;
        } else {
            currentPuzzles = filteredPuzzles.slice(0, QUESTIONS_PER_GAME);
        }

        currentPuzzleIndex = 0;
        difficultySelectionArea.classList.add('hidden');
        mainGame.classList.remove('hidden');
        setupPuzzle();
        startTotalTimer();
    }

    // --- イベントリスナー ---
    checkButton.addEventListener('click', checkAnswer);

    // 「難易度選択に戻る」ボタン（結果画面）
    backToDifficultyBtn.addEventListener('click', showDifficultySelection);

    // 難易度選択ボタン
    document.querySelectorAll('.btn-difficulty').forEach(button => {
        button.addEventListener('click', (e) => startGame(e.target.dataset.difficulty));
    });

    // 一時停止ボタン
    pauseBtn.addEventListener('click', () => {
        stopTotalTimer();
        pauseStartTime = Date.now();
        pauseModalOverlay.classList.add('visible');
    });

    // ゲームに戻るボタン（一時停止画面）
    resumeGameBtn.addEventListener('click', () => {
        pauseModalOverlay.classList.remove('visible');
        resumeTotalTimer();
    });

    // 難易度選択に戻るボタン（一時停止画面）
    quitToDifficultyBtn.addEventListener('click', showDifficultySelection);
});
