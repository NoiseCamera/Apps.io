document.addEventListener('DOMContentLoaded', () => {
    // スマホやタブレットでダブルタップによる拡大を無効にする
    document.body.style.touchAction = 'manipulation';

    // DOM要素
    const shapeContainer = document.getElementById('shape-container');
    const questionDisplay = document.getElementById('question-display');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const startScreen = document.getElementById('start-screen');
    const resultScreen = document.getElementById('result-screen');
    const restartButton = document.getElementById('restart-button');
    const finalScoreDisplay = document.getElementById('final-score');
    const backToMenuButton = resultScreen.querySelector('.btn-back');
    const earnedStarsDisplay = document.getElementById('earned-stars');

    // BGM
    const bgm = new Audio('assets/sounds/bgm4.mp3');
    bgm.loop = true;
    bgm.volume = 0.3;

    // ゲーム設定
    const GAME_TIME = 60;
    let NUM_SHAPES = 8; // 表示する図形の数（難易度によって変わる）
    let POINTS_PER_CORRECT = 10;
    let STAR_DIVISOR = 100;

    // はっきりとした原色のパレット
    const PRIMARY_COLORS = [
        { name: 'あか', code: '#FF0000' },
        { name: 'あお', code: '#0000FF' },
        { name: 'きいろ', code: '#FFFF00' },
        { name: 'みどり', code: '#008000' },
        { name: 'オレンジ', code: '#FFA500' },
        { name: 'むらさき', code: '#800080' },
        { name: 'ピンク', code: '#FFC0CB' },
        { name: 'ちゃいろ', code: '#A52A2A' },
        { name: 'くろ', code: '#000000' },
        { name: 'みずいろ', code: '#00FFFF' },
        { name: 'きみどり', code: '#ADFF2F' },
        { name: 'はいいろ', code: '#808080' }
    ];

    // 効果音
    const SOUNDS = {
        correct: new Audio('assets/sounds/seikai2.mp3'),
        incorrect: new Audio('assets/sounds/fuseikai.mp3')
    };

    // 図形とアニメーションの種類
    const SHAPE_CLASSES = ['shape-circle', 'shape-square', 'shape-triangle', 'shape-star'];
    const ANIMATION_CLASSES = ['anim-scale', 'anim-rotate', 'anim-spin'];

    // ゲーム状態
    let score = 0;
    let timer = GAME_TIME;
    let timerId = null;
    let currentQuestion = null; // 正解の色オブジェクトを保持
    let isPlaying = false;

    // イベントリスナー
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const difficulty = e.target.dataset.difficulty;
            switch (difficulty) {
                case 'easy':
                    NUM_SHAPES = 4;
                    POINTS_PER_CORRECT = 5;
                    STAR_DIVISOR = 120;
                    break;
                case 'hard':
                    NUM_SHAPES = 12;
                    POINTS_PER_CORRECT = 15;
                    STAR_DIVISOR = 80;
                    break;
                case 'normal':
                default:
                    NUM_SHAPES = 8;
                    POINTS_PER_CORRECT = 10;
                    STAR_DIVISOR = 100;
            }
            startGame();
        });
    });
    restartButton.addEventListener('click', startGame);
    backToMenuButton.addEventListener('click', () => {
        resultScreen.classList.remove('visible');
        startScreen.classList.add('visible');
    });

    function startGame() {
        bgm.play().catch(e => console.error("BGMの再生に失敗しました:", e));
        timerDisplay.classList.remove('is-warning');
        score = 0;
        timer = GAME_TIME;
        isPlaying = true;
        updateScore();
        updateTimer();
        startScreen.classList.remove('visible');
        resultScreen.classList.remove('visible');
        setupNewQuestion();
        if (timerId) clearInterval(timerId);
        timerId = setInterval(countDown, 1000);
    }

    function countDown() {
        timer--;
        updateTimer();
        if (timer <= 0) endGame();
    }

    function endGame() {
        clearInterval(timerId);
        isPlaying = false;
        timerDisplay.classList.remove('is-warning');
        finalScoreDisplay.textContent = `あなたのスコアは ${score} てんでした！`;
        const starsEarned = Math.floor(score / STAR_DIVISOR);
        if (earnedStarsDisplay) earnedStarsDisplay.textContent = starsEarned;
        if (typeof window.addPoints === 'function') window.addPoints(starsEarned);
        resultScreen.classList.add('visible');
    }

    function updateQuestionDisplay(questionColor) {
        // 「さがしてね！」テキストと、探す色の名前を組み合わせる
        questionDisplay.innerHTML = `さがしてね！<br><span class="question-target">${questionColor.name}</span>`;
        const targetSpan = questionDisplay.querySelector('.question-target');

        if (targetSpan) {
            targetSpan.style.color = questionColor.code;

            // 読みやすさのために文字にフチドリをつける
            // 黄色などの明るい色には暗いフチ、暗い色には明るいフチをつける (輝度計算)
            const hex = questionColor.code.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;

            const strokeColor = brightness > 150 ? '#555' : '#fff';
            targetSpan.style.webkitTextStroke = `1.5px ${strokeColor}`;
            targetSpan.style.textStroke = `1.5px ${strokeColor}`;
        }
    }

    function setupNewQuestion() {
        shapeContainer.innerHTML = '';

        const shuffled = PRIMARY_COLORS.sort(() => 0.5 - Math.random());
        const targetColors = shuffled.slice(0, NUM_SHAPES);
        currentQuestion = targetColors[Math.floor(Math.random() * targetColors.length)];
        updateQuestionDisplay(currentQuestion);

        const containerRect = shapeContainer.getBoundingClientRect();
        const SAFE_AREA_PADDING = 15;
        const safeAreaWidth = containerRect.width - (SAFE_AREA_PADDING * 2);
        const safeAreaHeight = containerRect.height - (SAFE_AREA_PADDING * 2);

        const placedShapes = [];

        targetColors.forEach(color => {
            const shapeElement = document.createElement('div');
            shapeElement.classList.add('color-shape');
            shapeElement.dataset.colorName = color.name;
            shapeElement.style.backgroundColor = color.code;

            // ランダムな形を適用
            const randomShape = SHAPE_CLASSES[Math.floor(Math.random() * SHAPE_CLASSES.length)];
            shapeElement.classList.add(randomShape);

            // ランダムなアニメーションを適用
            const randomAnimation = ANIMATION_CLASSES[Math.floor(Math.random() * ANIMATION_CLASSES.length)];
            shapeElement.classList.add(randomAnimation);
            shapeElement.style.animationDuration = `${Math.random() * 4 + 3}s`; // 3～7秒
            shapeElement.style.animationDelay = `${Math.random() * -5}s`; // 開始タイミングをずらす

            // アニメーション用のカスタムプロパティを設定
            shapeElement.style.setProperty('--start-scale-rotate', `${Math.random() * 40 - 20}deg`); // -20～20度
            shapeElement.style.setProperty('--end-scale-rotate', `${Math.random() * 40 - 20}deg`);   // -20～20度
            shapeElement.style.setProperty('--start-sway-rotate', `${Math.random() * 30 - 15}deg`);  // -15～15度
            shapeElement.style.setProperty('--end-sway-rotate', `${Math.random() * 30 - 15}deg`);    // -15～15度
            shapeElement.style.setProperty('--scale-factor', `${1.15 + Math.random() * 0.15}`);      // 1.15～1.3倍に拡大

            const shapeSize = Math.floor(Math.random() * 50) + 40; // 40pxから90pxのサイズ
            shapeElement.style.width = `${shapeSize}px`;
            shapeElement.style.height = `${shapeSize}px`;

            // 重ならない位置が見つかるまで試行
            let overlap = true;
            let attempts = 0;
            while (overlap && attempts < 50) {
                const x = Math.random() * (safeAreaWidth - shapeSize);
                const y = Math.random() * (safeAreaHeight - shapeSize);
                shapeElement.style.left = `${SAFE_AREA_PADDING + x}px`;
                shapeElement.style.top = `${SAFE_AREA_PADDING + y}px`;
                
                const newRect = {
                    left: x, top: y, right: x + shapeSize, bottom: y + shapeSize
                };

                overlap = placedShapes.some(placedRect => 
                    !(newRect.right < placedRect.left || 
                      newRect.left > placedRect.right || 
                      newRect.bottom < placedRect.top || 
                      newRect.top > placedRect.bottom)
                );
                attempts++;
                if (!overlap) {
                    placedShapes.push(newRect);
                }
            }

            shapeContainer.appendChild(shapeElement);
            shapeElement.addEventListener('click', handleShapeClick);
        });
    }

    function handleShapeClick(e) {
        if (!isPlaying) return;
        const clickedColorName = e.target.dataset.colorName;

        if (clickedColorName === currentQuestion.name) {
            score += POINTS_PER_CORRECT;
            updateScore();
            playSE('correct');
            createStarburstEffect(e.target); // ★星が飛び散るエフェクトを呼び出す
            e.target.style.transition = 'all 0.3s';
            e.target.style.transform = 'scale(1.5)';
            e.target.style.opacity = '0';
            setTimeout(() => {
                if (isPlaying) setupNewQuestion();
            }, 500);
        } else {
            playSE('incorrect');
            if (e.target.classList.contains('is-shaking')) return;
            e.target.classList.add('is-shaking');
            e.target.animate([
                { transform: 'translateX(5px)' }, { transform: 'translateX(-5px)' },
                { transform: 'translateX(5px)' }, { transform: 'translateX(-5px)' },
                { transform: 'translateX(0px)' }
            ], { duration: 300, easing: 'ease-in-out' })
            .onfinish = () => e.target.classList.remove('is-shaking');
        }
    }

    function updateScore() {
        scoreDisplay.innerHTML = `スコア<br>${score}`;
    }

    function updateTimer() {
        timerDisplay.innerHTML = `のこりじかん<br>${timer}`;
        if (timer <= 10 && timer > 0) {
            timerDisplay.classList.add('is-warning');
        } else {
            timerDisplay.classList.remove('is-warning');
        }
    }

    function playSE(soundName) {
        const sound = SOUNDS[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.error(`Audio play failed for ${soundName}:`, e));
        }
    }

    /**
     * 星が飛び散るエフェクトを生成する
     * @param {HTMLElement} target - エフェクトの中心となる要素
     */
    function createStarburstEffect(target) {
        const rect = target.getBoundingClientRect();
        const color = target.style.backgroundColor;
        const starCount = 15; // 飛び散る星の数

        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            star.style.backgroundColor = color;

            // ★星の視認性を確保するためのスタイルを追加
            // CSSで定義するのが理想ですが、確実性を高めるためにJSでも設定します。
            star.style.width = '20px'; // 少し大きく
            star.style.height = '20px'; // 少し大きく
            star.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)'; // 影を付けて、明るい色の星でも見えるようにする

            // 星の初期位置をクリックされた図形の中心に設定
            const startX = rect.left + rect.width / 2;
            const startY = rect.top + rect.height / 2;
            star.style.left = `${startX}px`;
            star.style.top = `${startY}px`;

            document.body.appendChild(star);

            // 飛び散る方向と距離をランダムに設定
            const angle = Math.random() * 360;
            const distance = Math.random() * 120 + 80; // 80pxから200pxの距離に
            const endX = Math.cos(angle * Math.PI / 180) * distance;
            const endY = Math.sin(angle * Math.PI / 180) * distance;

            // アニメーションを実行
            star.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${endX}px, ${endY}px) scale(0)`, opacity: 0 }
            ], {
                duration: Math.random() * 700 + 800, // 0.8秒から1.5秒に延長
                easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                fill: 'forwards'
            }).onfinish = () => {
                star.remove(); // アニメーション終了後に要素を削除
            };
        }
    }
});
