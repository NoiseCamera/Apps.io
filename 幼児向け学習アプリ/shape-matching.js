document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const questionShapeContainer = document.getElementById('question-shape-container');
    const optionsContainer = document.getElementById('options-container');
    const feedbackText = document.getElementById('feedback-text');

    // --- Shape Definitions ---
    // SVGで様々な図形を定義します
    const shapes = [
        { id: 'circle', name: 'まる', color: '#ef5350', svg: '<circle cx="50" cy="50" r="45" fill="currentColor"/>' },
        { id: 'square', name: 'しかく', color: '#42a5f5', svg: '<rect x="10" y="10" width="80" height="80" rx="5" fill="currentColor"/>' },
        { id: 'triangle', name: 'さんかく', color: '#66bb6a', svg: '<polygon points="50,10 95,90 5,90" fill="currentColor"/>' },
        { id: 'star', name: 'ほし', color: '#ffca28', svg: '<polygon points="50,5 61,40 98,40 68,62 79,96 50,75 21,96 32,62 2,40 39,40" fill="currentColor"/>' },
        { id: 'heart', name: 'ハート', color: '#ec407a', svg: '<path d="M50,25 C20,0 20,50 50,80 C80,50 80,0 50,25 Z" fill="currentColor"/>' },
        { id: 'hexagon', name: 'ろっかっけい', color: '#ab47bc', svg: '<polygon points="25,10 75,10 95,50 75,90 25,90 5,50" fill="currentColor"/>' },
        { id: 'diamond', name: 'ひしがた', color: '#26a69a', svg: '<polygon points="50,5 95,50 50,95 5,50" fill="currentColor"/>' },
        { id: 'oval', name: 'だえん', color: '#ff7043', svg: '<ellipse cx="50" cy="50" rx="45" ry="30" fill="currentColor"/>' },
        { id: 'cross', name: 'じゅうじ', color: '#78909c', svg: '<polygon points="35,5 65,5 65,35 95,35 95,65 65,65 65,95 35,95 35,65 5,65 5,35 35,35" fill="currentColor"/>' }
    ];

    // このゲームで使う効果音のリスト
    const SOUND_EFFECTS = [
        'assets/sounds/seikai.mp3',
        'assets/sounds/incorrect.mp3'
    ];

    let currentCorrectShape = null;
    let isAnswered = false;
    let bgmInitialized = false;

    // --- Functions ---

    /**
     * 配列をシャッフルする（Fisher-Yatesアルゴリズム）
     * @param {Array} array シャッフルしたい配列
     * @returns {Array} シャッフルされた配列
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * 新しい問題と選択肢を生成して表示する
     */
    function generateQuestion() {
        isAnswered = false;
        feedbackText.textContent = '';
        feedbackText.className = '';
        questionShapeContainer.innerHTML = '';
        optionsContainer.innerHTML = '';

        // 1. 図形のリストをシャッフルし、問題と選択肢を選ぶ
        const shuffledShapes = shuffleArray([...shapes]);
        currentCorrectShape = shuffledShapes[0];
        const options = shuffleArray(shuffledShapes.slice(0, 3));

        // 2. 問題の図形を表示する
        const questionSvg = document.createElement('div');
        questionSvg.innerHTML = `<svg viewBox="0 0 100 100" class="shape-svg" style="color:${currentCorrectShape.color};">${currentCorrectShape.svg}</svg>`;
        questionShapeContainer.appendChild(questionSvg);

        // 3. 選択肢の図形を表示する
        options.forEach(shape => {
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('option-shape');
            optionDiv.dataset.shapeId = shape.id;
            optionDiv.innerHTML = `
                <svg viewBox="0 0 100 100" class="shape-svg" style="color:${shape.color};">${shape.svg}</svg>
                <p class="shape-name">${shape.name}</p>
            `;
            optionDiv.addEventListener('click', handleOptionClick);
            optionsContainer.appendChild(optionDiv);
        });
    }

    /**
     * 選択肢がクリックされたときの処理
     * @param {Event} event クリックイベント
     */
    function handleOptionClick(event) {
        if (isAnswered) return; // 正解後は何もしない

        const selectedOption = event.currentTarget;
        const selectedShapeId = selectedOption.dataset.shapeId;

        // 4. 答え合わせ
        if (selectedShapeId === currentCorrectShape.id) {
            // --- 正解の場合 ---
            isAnswered = true; // もう回答できないようにする

            // すべての選択肢を操作不可にする
            document.querySelectorAll('.option-shape').forEach(opt => {
                opt.classList.add('disabled');
            });

            // 選択したものを正解スタイルに
            selectedOption.classList.remove('incorrect'); // 間違えた後でも正しいスタイルに
            selectedOption.classList.add('selected', 'correct');
            feedbackText.textContent = 'せいかい！';
            feedbackText.style.color = '#e53935'; // 赤色
            playSE('assets/sounds/seikai.mp3');
            addPoints(1); // 正解で1ポイント追加
            animateFeedback(feedbackText);

            // 5. 1.5秒後に自動で次の問題へ進む
            setTimeout(generateQuestion, 1500);
        } else {
            // --- 不正解の場合 ---
            selectedOption.classList.add('selected', 'incorrect', 'disabled'); // 間違えた選択肢は操作不可に
            feedbackText.textContent = 'ちがうかな？';
            feedbackText.style.color = '#1e88e5'; // 青色
            playSE('assets/sounds/incorrect.mp3');

            // アニメーションが終わったら、スタイルをリセットしてdisabled状態だけ残す
            selectedOption.addEventListener('animationend', () => {
                selectedOption.classList.remove('selected', 'incorrect');
            }, { once: true });

            // 2秒後にフィードバックを消す
            setTimeout(() => {
                // まだ正解していない場合のみフィードバックを消す
                if (!isAnswered) {
                    feedbackText.textContent = '';
                }
            }, 2000);
        }
    }

    /**
     * フィードバックテキストにアニメーションを適用する
     * @param {HTMLElement} element アニメーションを適用する要素
     */
    function animateFeedback(element) {
        element.style.transform = 'scale(1)';
        element.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.2)' },
            { transform: 'scale(1)' }
        ], {
            duration: 500,
            easing: 'ease-in-out'
        });
    }

    /**
     * BGMの再生を試みる
     */
    function initializeBgm() {
        if (bgmInitialized) return;
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.play().catch(error => console.log("BGMの自動再生がブロックされました:", error));
        }
        if (typeof preloadAudioSources === 'function') {
            preloadAudioSources(SOUND_EFFECTS);
        }
        bgmInitialized = true;
    }

    // --- Initialization ---
    generateQuestion();
    document.body.addEventListener('click', initializeBgm, { once: true });
    document.body.addEventListener('touchstart', initializeBgm, { once: true });
});
