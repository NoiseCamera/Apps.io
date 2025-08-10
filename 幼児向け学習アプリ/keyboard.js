// keyboard.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const piano = document.querySelector('.piano');
    const modePlayBtn = document.getElementById('mode-play');
    const modeQuizBtn = document.getElementById('mode-quiz');
    const modeRecordBtn = document.getElementById('mode-record');
    const demoPlayBtn = document.getElementById('demo-play-btn');
    const instructionText = document.getElementById('instruction-text');
    const quizFeedback = document.getElementById('quiz-feedback');
    const keyboardContainer = document.getElementById('keyboard-container');
    const recordControls = document.getElementById('record-controls');
    const recordBtn = document.getElementById('record-btn');
    const playBtn = document.getElementById('play-btn');
    const stopBtn = document.getElementById('stop-btn');
    let audioInitialized = false;

    // --- State ---
    let currentMode = 'play'; // 'play', 'quiz', or 'record'
    let currentQuizNote = null;
    let isQuizActive = false; // To prevent multiple answers during feedback
    let correctStreak = 0; // 連続正解数を記録
    let isPlayingDemo = false;
    // 録音用State
    let isRecording = false;
    let isPlayingBack = false;
    let recordedSequence = [];
    let lastNoteTime = 0;
    let playbackTimeoutIds = []; // 再生中のタイマーIDを保持

    // --- Constants ---
    const notes = ['do', 're', 'mi', 'fa', 'so', 'ra', 'shi', 'do2'];
    const demoSong = [
        { note: 'do', time: 500 }, { note: 'do', time: 500 },
        { note: 'so', time: 500 }, { note: 'so', time: 500 },
        { note: 'ra', time: 500 }, { note: 'ra', time: 500 },
        { note: 'so', time: 800 },
        { note: 'fa', time: 500 }, { note: 'fa', time: 500 },
        { note: 'mi', time: 500 }, { note: 'mi', time: 500 },
        { note: 're', time: 500 }, { note: 're', time: 500 },
        { note: 'do', time: 800 }
    ];

    if (!piano) {
        console.error('Piano element not found!');
        return;
    }

    // 音声ファイルのパスを定義
    const audioFiles = {
        'do': 'assets/sounds/doremi/ド.mp3',
        're': 'assets/sounds/doremi/レ.mp3',
        'mi': 'assets/sounds/doremi/ミ.mp3',
        'fa': 'assets/sounds/doremi/ファ.mp3',
        'so': 'assets/sounds/doremi/ソ.mp3',
        'ra': 'assets/sounds/doremi/ラ.mp3',
        'shi': 'assets/sounds/doremi/シ.mp3',
        'do2': 'assets/sounds/doremi/ド2.mp3',
        'correct': 'assets/sounds/seikai.mp3',
        'incorrect': 'assets/sounds/fuseikai.mp3'
    };

    // --- Initialization ---
    function initializeAudio() {
        if (audioInitialized) return;
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.play().catch(error => console.log('BGMの再生にはユーザーの操作が必要です。', error));
        }
        if (typeof preloadAudioSources === 'function') {
            preloadAudioSources(Object.values(audioFiles));
        }
        audioInitialized = true;
    }

    // --- Core Functions ---
    function playNoteSound(note) {
        if (note && audioFiles[note] && typeof playSE === 'function') {
            playSE(audioFiles[note]);
        }
    }

    /**
     * 鍵盤が押されたときの処理
     * @param {HTMLElement} keyElement - 押された鍵盤の要素
     */
    function handleKeyPress(keyElement) {
        // 再生中やデモ中はキーを押せないようにする
        if (!keyElement || !keyElement.classList.contains('key') || isPlayingBack || isPlayingDemo) return;

        const note = keyElement.dataset.note;
        keyElement.classList.add('active');

        // どのモードでも、押した鍵盤の音は鳴らす
        playNoteSound(note);

        // クイズモードの場合、答え合わせの処理を追加で行う
        if (currentMode === 'quiz' && !isQuizActive) {
            checkAnswer(note);
        } else if (currentMode === 'record' && isRecording) {
            // 録音中の処理
            const now = Date.now();
            // 最初の音符は待ち時間0で記録
            const timeSinceLastNote = lastNoteTime === 0 ? 0 : now - lastNoteTime;
            recordedSequence.push({ note: note, time: timeSinceLastNote });
            lastNoteTime = now;
        }
    }

    function releaseKey(keyElement) {
        if (keyElement && keyElement.classList.contains('key')) {
            keyElement.classList.remove('active');
        }
    }

    // --- Mode Switching ---
    function switchMode(newMode) {
        stopAll(); // モード変更時に録音・再生を停止
        currentMode = newMode;

        // 全ボタンの選択状態をリセット
        [modePlayBtn, modeQuizBtn, modeRecordBtn].forEach(btn => btn.classList.remove('selected'));
        // UIをリセット
        keyboardContainer.classList.remove('play-mode', 'quiz-mode', 'record-mode');
        quizFeedback.classList.remove('visible', 'correct', 'incorrect');
        quizFeedback.textContent = '';
        recordControls.classList.add('hidden');

        if (newMode === 'play') {
            modePlayBtn.classList.add('selected');
            keyboardContainer.classList.add('play-mode');
            instructionText.textContent = 'すきな けんばんを おしてね！';
            correctStreak = 0; // 演奏モードに切り替えたらリセット
        } else if (newMode === 'quiz') {
            modeQuizBtn.classList.add('selected');
            keyboardContainer.classList.add('quiz-mode');
            startQuiz();
        } else if (newMode === 'record') {
            modeRecordBtn.classList.add('selected');
            keyboardContainer.classList.add('record-mode');
            instructionText.textContent = '「ろくおん」ボタンをおして えんそうしよう！';
            recordControls.classList.remove('hidden');
            updateRecordControlsState();
        }
    }

    // --- Quiz Logic ---
    function startQuiz() {
        isQuizActive = false;
        correctStreak = 0; // クイズ開始時に連続正解数をリセット
        nextQuestion();
    }

    function nextQuestion() {
        quizFeedback.classList.remove('visible', 'correct', 'incorrect');
        quizFeedback.textContent = '';
        isQuizActive = false;

        currentQuizNote = notes[Math.floor(Math.random() * notes.length)];

        instructionText.innerHTML = 'この おとは なあに？ <button id="replay-question-btn" class="button-style">もういちど きく</button>';
        
        const replayBtn = document.getElementById('replay-question-btn');
        if (replayBtn) {
            replayBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 親要素へのイベント伝播を停止
                playNoteSound(currentQuizNote);
            });
        }

        setTimeout(() => playNoteSound(currentQuizNote), 500);
    }

    function checkAnswer(selectedNote) {
        if (isQuizActive) return;
        isQuizActive = true;

        quizFeedback.classList.add('visible');

        if (selectedNote === currentQuizNote) {
            // 正解
            correctStreak++;
            let pointsToAdd = 1;
            let feedbackMessage = 'せいかい！';

            if (correctStreak >= 3) {
                pointsToAdd = 3; // 3連続正解で3ポイント！
                feedbackMessage = `すごい！ ${correctStreak}れんぞく せいかい！`;
            }

            quizFeedback.textContent = feedbackMessage;
            quizFeedback.classList.add('correct');
            playNoteSound('correct');
            if (typeof addPoints === 'function') {
                addPoints(pointsToAdd); // ポイント追加
            }
            setTimeout(nextQuestion, 1500); // 1.5秒後に次の問題へ
        } else {
            // 不正解
            correctStreak = 0; // 連続正解数をリセット
            quizFeedback.textContent = 'おしい！';
            quizFeedback.classList.add('incorrect');
            playNoteSound('incorrect');
            setTimeout(() => {
                quizFeedback.classList.remove('visible', 'incorrect');
                quizFeedback.textContent = '';
                isQuizActive = false; // 再度回答できるようにする
            }, 1500);
        }
    }

    // --- Demo Playback Logic ---
    function handleDemoPlay() {
        // 他の再生/録音/デモが実行中の場合は何もしない
        if (isRecording || isPlayingBack || isPlayingDemo) return;

        isPlayingDemo = true;
        instructionText.textContent = 'デモえんそうちゅう...♪';
        stopAll(); // ボタンの状態を更新するために呼ぶ

        let cumulativeTime = 0;
        demoSong.forEach(event => {
            cumulativeTime += event.time;
            const timeoutId = setTimeout(() => {
                playNoteSound(event.note);
                // 鍵盤を光らせる
                const keyElement = piano.querySelector(`[data-note="${event.note}"]`);
                if (keyElement) {
                    keyElement.classList.add('active');
                    // 少し経ったら光を消す
                    setTimeout(() => keyElement.classList.remove('active'), 200);
                }
            }, cumulativeTime);
            playbackTimeoutIds.push(timeoutId);
        });

        // 全ての再生が終わったら状態をリセット
        const totalPlaybackTime = cumulativeTime + 500; // 最後の音の余韻
        const finalTimeoutId = setTimeout(() => {
            stopAll(); // 状態をリセット
            // モードに応じた案内文に戻す
            if (currentMode === 'play') {
                instructionText.textContent = 'すきな けんばんを おしてね！';
            } else if (currentMode === 'record') {
                instructionText.textContent = '「ろくおん」ボタンをおして えんそうしよう！';
            }
        }, totalPlaybackTime);
        playbackTimeoutIds.push(finalTimeoutId);
    }

    // --- Record/Playback Logic ---

    function updateRecordControlsState() {
        // 録音ボタン: 再生中は無効
        recordBtn.disabled = isPlayingBack;
        // 再生ボタン: 録音中、再生中、または録音データがない場合は無効
        playBtn.disabled = isRecording || isPlayingBack || recordedSequence.length === 0;
        // 停止ボタン: 録音中でも再生中でもない場合は無効
        stopBtn.disabled = !isRecording && !isPlayingBack;

        // デモ演奏ボタン: 何か再生/録音/デモ中は無効
        demoPlayBtn.disabled = isRecording || isPlayingBack || isPlayingDemo;
    }

    function handleRecordClick() {
        if (isPlayingBack) return;

        isRecording = !isRecording;

        if (isRecording) {
            // 録音開始
            recordedSequence = [];
            lastNoteTime = Date.now();
            recordBtn.textContent = '■ ろくおんちゅう';
            recordBtn.classList.add('recording');
            instructionText.textContent = 'おわるときは 「ろくおんちゅう」ボタンをおしてね';
        } else {
            // 録音停止
            recordBtn.textContent = '● ろくおん';
            recordBtn.classList.remove('recording');
            if (recordedSequence.length > 0) {
                instructionText.textContent = '「さいせい」ボタンで きいてみよう！';
            } else {
                instructionText.textContent = '「ろくおん」ボタンをおして えんそうしよう！';
            }
        }
        updateRecordControlsState();
    }

    function handlePlayClick() {
        if (isRecording || isPlayingBack || recordedSequence.length === 0) return;

        isPlayingBack = true;
        instructionText.textContent = 'さいせいちゅう...';
        updateRecordControlsState();

        let cumulativeTime = 0;
        recordedSequence.forEach(event => {
            cumulativeTime += event.time;
            const timeoutId = setTimeout(() => {
                playNoteSound(event.note);
                // 鍵盤を光らせる
                const keyElement = piano.querySelector(`[data-note="${event.note}"]`);
                if (keyElement) {
                    keyElement.classList.add('active');
                    // 少し経ったら光を消す
                    setTimeout(() => keyElement.classList.remove('active'), 200);
                }
            }, cumulativeTime);
            playbackTimeoutIds.push(timeoutId);
        });

        // 全ての再生が終わったら状態をリセット
        const totalPlaybackTime = cumulativeTime + 500; // 最後の音の余韻
        const finalTimeoutId = setTimeout(() => {
            stopAll();
            instructionText.textContent = '「さいせい」ボタンで もういちどきけるよ！';
        }, totalPlaybackTime);
        playbackTimeoutIds.push(finalTimeoutId);
    }

    function handleStopClick() {
        stopAll();
        instructionText.textContent = '「ろくおん」ボタンをおして えんそうしよう！';
    }

    function stopAll() {
        // Stop recording
        if (isRecording) {
            isRecording = false;
            recordBtn.textContent = '● ろくおん';
            recordBtn.classList.remove('recording');
        }

        // Stop playback
        if (isPlayingBack) {
            isPlayingBack = false;
            playbackTimeoutIds.forEach(id => clearTimeout(id));
            playbackTimeoutIds = [];
            // Stop any lingering active key highlights
            document.querySelectorAll('.key.active').forEach(releaseKey);
        }
        
        // Stop demo playback
        if (isPlayingDemo) {
            isPlayingDemo = false;
            // Playback timeouts are already cleared by the above logic
        }

        // Reset state and UI
        updateRecordControlsState();
    }

    // --- Event Listeners ---
    piano.addEventListener('mousedown', (e) => handleKeyPress(e.target));
    piano.addEventListener('mouseup', (e) => releaseKey(e.target));
    piano.addEventListener('mouseleave', () => document.querySelectorAll('.key.active').forEach(releaseKey));

    piano.addEventListener('touchstart', (e) => {
        e.preventDefault(); // 画面のスクロールを防ぐ
        const touch = e.touches[0];
        const targetKey = document.elementFromPoint(touch.clientX, touch.clientY);
        handleKeyPress(targetKey);
    }, { passive: false });

    piano.addEventListener('touchend', () => document.querySelectorAll('.key.active').forEach(releaseKey));

    modePlayBtn.addEventListener('click', () => switchMode('play'));
    modeQuizBtn.addEventListener('click', () => switchMode('quiz'));
    modeRecordBtn.addEventListener('click', () => switchMode('record'));

    demoPlayBtn.addEventListener('click', handleDemoPlay);

    recordBtn.addEventListener('click', handleRecordClick);
    playBtn.addEventListener('click', handlePlayClick);
    stopBtn.addEventListener('click', handleStopClick);

    document.body.addEventListener('click', initializeAudio, { once: true });
    document.body.addEventListener('touchstart', initializeAudio, { once: true });
});