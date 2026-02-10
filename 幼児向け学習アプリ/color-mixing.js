document.addEventListener('DOMContentLoaded', () => {
    // --- データ定義 ---
    const COLORS = {
        'red': { name: 'あか', code: '#FF1744' },
        'blue': { name: 'あお', code: '#2979FF' },
        'yellow': { name: 'きいろ', code: '#FFEA00' },
        'white': { name: 'しろ', code: '#FFFFFF' },
        'black': { name: 'くろ', code: '#37474F' }
    };

    const RECIPES = [
        { inputs: ['red', 'blue'], result: { name: 'むらさき', code: '#AA00FF' } },
        { inputs: ['red', 'yellow'], result: { name: 'オレンジ', code: '#FF9100' } },
        { inputs: ['blue', 'yellow'], result: { name: 'みどり', code: '#00C853' } },
        { inputs: ['red', 'white'], result: { name: 'ピンク', code: '#FF80AB' } },
        { inputs: ['blue', 'white'], result: { name: 'みずいろ', code: '#80D8FF' } },
        { inputs: ['yellow', 'white'], result: { name: 'クリームいろ', code: '#FFF9C4' } },
        { inputs: ['black', 'white'], result: { name: 'グレー', code: '#9E9E9E' } },
        { inputs: ['red', 'black'], result: { name: 'ちゃいろ', code: '#5D4037' } },
        { inputs: ['blue', 'black'], result: { name: 'こんいろ', code: '#1A237E' } },
        { inputs: ['yellow', 'black'], result: { name: 'おうどいろ', code: '#827717' } }
    ];

    // --- DOM要素 ---
    const modeSelectScreen = document.getElementById('mode-select-screen');
    const freeModeScreen = document.getElementById('free-mode-screen');
    const quizModeScreen = document.getElementById('quiz-mode-screen');

    // 自由モード要素
    const freePalette = document.getElementById('free-palette');
    const tube1 = document.getElementById('tube-1');
    const tube2 = document.getElementById('tube-2');
    const resultBlob = document.getElementById('result-blob');
    const resultName = document.getElementById('result-name');
    const mixBtn = document.getElementById('mix-btn');
    const resetBtn = document.getElementById('reset-btn');
    const historyList = document.getElementById('history-list');

    // クイズモード要素
    const quizPalette = document.getElementById('quiz-palette');
    const quizTube1 = document.getElementById('quiz-tube-1');
    const quizTube2 = document.getElementById('quiz-tube-2');
    const targetBlob = document.getElementById('target-blob');
    const targetName = document.getElementById('target-name');
    const quizCheckBtn = document.getElementById('quiz-check-btn');
    const quizScoreEl = document.getElementById('quiz-score');

    // 音声
    const correctSound = document.getElementById('correct-sound');
    const incorrectSound = document.getElementById('incorrect-sound');

    // --- 状態 ---
    let selectedColors = []; // ['red', 'blue'] のようにIDを格納
    let quizTarget = null; // 現在のクイズの正解レシピ
    let quizScore = 0;

    // --- 初期化 ---
    function init() {
        setupPalette(freePalette, handleFreeColorClick);
        setupPalette(quizPalette, handleQuizColorClick);
        
        document.getElementById('mode-free-btn').addEventListener('click', startFreeMode);
        document.getElementById('mode-quiz-btn').addEventListener('click', startQuizMode);
        
        document.getElementById('back-to-mode-free').addEventListener('click', showModeSelect);
        document.getElementById('back-to-mode-quiz').addEventListener('click', showModeSelect);

        mixBtn.addEventListener('click', mixColorsFree);
        resetBtn.addEventListener('click', resetFreeMode);
        quizCheckBtn.addEventListener('click', checkQuizAnswer);
    }

    function setupPalette(container, clickHandler) {
        container.innerHTML = '';
        Object.keys(COLORS).forEach(key => {
            const color = COLORS[key];
            const btn = document.createElement('div');
            btn.classList.add('color-btn');
            btn.style.backgroundColor = color.code;
            btn.dataset.colorId = key;
            btn.dataset.name = color.name;
            btn.addEventListener('click', () => clickHandler(key, btn));
            container.appendChild(btn);
        });
    }

    // --- 画面遷移 ---
    function showModeSelect() {
        modeSelectScreen.classList.remove('hidden');
        freeModeScreen.classList.add('hidden');
        quizModeScreen.classList.add('hidden');
        resetFreeMode();
        resetQuizMode();
    }

    function startFreeMode() {
        modeSelectScreen.classList.add('hidden');
        freeModeScreen.classList.remove('hidden');
        resetFreeMode();
        historyList.innerHTML = ''; // 履歴をクリア
    }

    function startQuizMode() {
        modeSelectScreen.classList.add('hidden');
        quizModeScreen.classList.remove('hidden');
        quizScore = 0;
        quizScoreEl.textContent = quizScore;
        nextQuiz();
    }

    // --- 自由モードロジック ---
    function handleFreeColorClick(colorId, btn) {
        const index = selectedColors.indexOf(colorId);
        if (index !== -1) {
            // 選択解除
            selectedColors.splice(index, 1);
            btn.classList.remove('selected');
        } else {
            if (selectedColors.length < 2) {
                // 選択
                selectedColors.push(colorId);
                btn.classList.add('selected');
            } else {
                // 既に2色ある場合、最初の色を消して新しい色を追加（押し出し）
                const removedColor = selectedColors.shift();
                const removedBtn = freePalette.querySelector(`[data-color-id="${removedColor}"]`);
                if (removedBtn) removedBtn.classList.remove('selected');
                
                selectedColors.push(colorId);
                btn.classList.add('selected');
            }
        }
        updateFreeTubes();
    }

    function updateFreeTubes() {
        updateTubeDisplay(tube1, selectedColors[0]);
        updateTubeDisplay(tube2, selectedColors[1]);

        mixBtn.disabled = selectedColors.length !== 2;
        
        // 結果をリセット
        resultBlob.style.backgroundColor = '#eee';
        resultBlob.textContent = '?';
        resultName.textContent = '';
        resultBlob.classList.remove('mixed');
    }

    function updateTubeDisplay(tubeEl, colorId) {
        const blob = tubeEl.querySelector('.paint-blob');
        const body = tubeEl.querySelector('.tube-body');
        
        if (colorId) {
            blob.style.backgroundColor = COLORS[colorId].code;
            if (body) {
                body.textContent = COLORS[colorId].name;
            }
        } else {
            blob.style.backgroundColor = '#eee';
            if (body) {
                body.textContent = '?';
            }
        }
    }

    function mixColorsFree() {
        if (selectedColors.length !== 2) return;

        const recipe = findRecipe(selectedColors);
        
        if (recipe) {
            resultBlob.style.backgroundColor = recipe.result.code;
            resultBlob.textContent = '';
            resultName.textContent = recipe.result.name;
            resultBlob.classList.add('mixed');
            playSE(correctSound); // 成功音
            addToHistory(selectedColors[0], selectedColors[1], recipe.result.code, recipe.result.name);
        } else {
            // レシピにない組み合わせ（同じ色同士など）
            if (selectedColors[0] === selectedColors[1]) {
                const color = COLORS[selectedColors[0]];
                resultBlob.style.backgroundColor = color.code;
                resultBlob.textContent = '';
                resultName.textContent = `やっぱり ${color.name}`;
                resultBlob.classList.add('mixed');
                addToHistory(selectedColors[0], selectedColors[1], color.code, color.name);
            } else {
                resultBlob.style.backgroundColor = '#555';
                resultBlob.textContent = '?';
                resultName.textContent = 'なぞのいろ';
                addToHistory(selectedColors[0], selectedColors[1], '#555', 'なぞのいろ');
            }
        }
    }

    function addToHistory(id1, id2, resCode, resName) {
        const c1 = COLORS[id1];
        const c2 = COLORS[id2];
        
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-dot" style="background-color: ${c1.code}"></div>
            <span>＋</span>
            <div class="history-dot" style="background-color: ${c2.code}"></div>
            <span>＝</span>
            <div class="history-result-dot" style="background-color: ${resCode}"></div>
            <span>${resName}</span>
        `;
        // 新しい履歴を一番上に追加
        historyList.insertBefore(item, historyList.firstChild);
    }

    function resetFreeMode() {
        selectedColors = [];
        freePalette.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('selected'));
        updateFreeTubes();
    }

    // --- クイズモードロジック ---
    function nextQuiz() {
        resetQuizSelection();
        // ランダムにレシピを選ぶ
        let newTarget;
        do {
            newTarget = RECIPES[Math.floor(Math.random() * RECIPES.length)];
        } while (quizTarget && newTarget === quizTarget && RECIPES.length > 1);
        
        quizTarget = newTarget;
        targetBlob.style.backgroundColor = quizTarget.result.code;
        targetName.textContent = quizTarget.result.name;
    }

    function handleQuizColorClick(colorId, btn) {
        const index = selectedColors.indexOf(colorId);
        if (index !== -1) {
            selectedColors.splice(index, 1);
            btn.classList.remove('selected');
        } else {
            if (selectedColors.length < 2) {
                selectedColors.push(colorId);
                btn.classList.add('selected');
            } else {
                // 押し出し
                const removedColor = selectedColors.shift();
                const removedBtn = quizPalette.querySelector(`[data-color-id="${removedColor}"]`);
                if (removedBtn) removedBtn.classList.remove('selected');
                selectedColors.push(colorId);
                btn.classList.add('selected');
            }
        }
        updateQuizTubes();
    }

    function updateQuizTubes() {
        updateTubeDisplay(quizTube1, selectedColors[0]);
        updateTubeDisplay(quizTube2, selectedColors[1]);
        quizCheckBtn.disabled = selectedColors.length !== 2;
    }

    function resetQuizSelection() {
        selectedColors = [];
        quizPalette.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('selected'));
        updateQuizTubes();
    }
    
    function resetQuizMode() {
        resetQuizSelection();
        quizScore = 0;
    }

    function checkQuizAnswer() {
        if (selectedColors.length !== 2) return;

        // 順番は関係ないのでソートして比較
        const inputSorted = [...selectedColors].sort();
        const targetSorted = [...quizTarget.inputs].sort();

        const isCorrect = JSON.stringify(inputSorted) === JSON.stringify(targetSorted);

        if (isCorrect) {
            playSE(correctSound);
            quizScore++;
            quizScoreEl.textContent = quizScore;

            // ポイント追加
            if (typeof addPoints === 'function') {
                addPoints(1);
            }
            
            // 星のエフェクト
            const rect = quizCheckBtn.getBoundingClientRect();
            createStarburst(rect.left + rect.width / 2, rect.top + rect.height / 2);

            showFeedback('せいかい！', 'correct');
            setTimeout(nextQuiz, 1500); // アニメーションを見せるため少し待つ
        } else {
            playSE(incorrectSound);
            showFeedback('ざんねん...', 'incorrect');
        }
    }

    function findRecipe(colors) {
        const sortedInput = [...colors].sort();
        return RECIPES.find(r => {
            const sortedRecipe = [...r.inputs].sort();
            return JSON.stringify(sortedInput) === JSON.stringify(sortedRecipe);
        });
    }

    function createStarburst(x, y) {
        const starCount = 30;
        const colors = ['#FFD700', '#FF6347', '#FF69B4', '#00BFFF', '#32CD32', '#9370DB'];

        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            star.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            star.style.left = `${x}px`;
            star.style.top = `${y}px`;
            document.body.appendChild(star);

            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 150;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            const anim = star.animate([
                { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 1 },
                { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1.5) rotate(${Math.random() * 360}deg)`, opacity: 0 }
            ], {
                duration: 1000 + Math.random() * 500,
                easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                fill: 'forwards'
            });

            anim.onfinish = () => star.remove();
        }
    }

    function showFeedback(text, type) {
        const overlay = document.createElement('div');
        overlay.className = 'feedback-overlay visible';
        
        const content = document.createElement('div');
        content.className = `feedback-text ${type}`;
        content.textContent = text;
        
        overlay.appendChild(content);
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }, 1500);
    }

    // 簡易SE再生
    function playSE(audioEl) {
        if (audioEl) {
            audioEl.currentTime = 0;
            audioEl.play().catch(()=>{});
        }
    }

    init();
});