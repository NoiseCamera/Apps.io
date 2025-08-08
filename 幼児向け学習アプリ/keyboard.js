// keyboard.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const piano = document.querySelector('.piano');
    const modePlayBtn = document.getElementById('mode-play');
    const modeQuizBtn = document.getElementById('mode-quiz');
    const instructionText = document.getElementById('instruction-text');
    const quizFeedback = document.getElementById('quiz-feedback');
    const keyboardContainer = document.getElementById('keyboard-container');
    let audioInitialized = false;

    // --- State ---
    let currentMode = 'play'; // 'play' or 'quiz'
    let currentQuizNote = null;
    let isQuizActive = false; // To prevent multiple answers during feedback

    // --- Constants ---
    const notes = ['do', 're', 'mi', 'fa', 'so', 'ra', 'shi', 'do2'];

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
        if (!keyElement || !keyElement.classList.contains('key')) return;

        const note = keyElement.dataset.note;
        keyElement.classList.add('active');

        // どのモードでも、押した鍵盤の音は鳴らす
        playNoteSound(note);

        // クイズモードの場合、答え合わせの処理を追加で行う
        if (currentMode === 'quiz' && !isQuizActive) {
            checkAnswer(note);
        }
    }

    function releaseKey(keyElement) {
        if (keyElement && keyElement.classList.contains('key')) {
            keyElement.classList.remove('active');
        }
    }

    // --- Mode Switching ---
    function switchMode(newMode) {
        currentMode = newMode;
        if (newMode === 'play') {
            modePlayBtn.classList.add('selected');
            modeQuizBtn.classList.remove('selected');
            keyboardContainer.classList.add('play-mode');
            keyboardContainer.classList.remove('quiz-mode');
            instructionText.textContent = 'すきな けんばんを おしてね！';
            quizFeedback.classList.remove('visible', 'correct', 'incorrect');
            quizFeedback.textContent = '';
        } else { // quiz mode
            modePlayBtn.classList.remove('selected');
            modeQuizBtn.classList.add('selected');
            keyboardContainer.classList.remove('play-mode');
            keyboardContainer.classList.add('quiz-mode');
            startQuiz();
        }
    }

    // --- Quiz Logic ---
    function startQuiz() {
        isQuizActive = false;
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
            quizFeedback.textContent = 'せいかい！';
            quizFeedback.classList.add('correct');
            playNoteSound('correct');
            if (typeof addPoints === 'function') {
                addPoints(1); // 正解で1ポイント追加
            }
            setTimeout(nextQuestion, 1500); // 1.5秒後に次の問題へ
        } else {
            // 不正解
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

    document.body.addEventListener('click', initializeAudio, { once: true });
    document.body.addEventListener('touchstart', initializeAudio, { once: true });
});