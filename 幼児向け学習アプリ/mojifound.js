document.addEventListener('DOMContentLoaded', () => {
    // スマホやタブレットでダブルタップによる拡大を無効にする
    document.body.style.touchAction = 'manipulation';

    // DOM要素
    const characterContainer = document.getElementById('character-container');
    const questionDisplay = document.getElementById('question-display');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const startScreen = document.getElementById('start-screen');
    const resultScreen = document.getElementById('result-screen');
    const restartButton = document.getElementById('restart-button');
    const finalScoreDisplay = document.getElementById('final-score');
    // IDではなくクラス名でボタンを取得するように変更
    const backToMenuButton = resultScreen.querySelector('.btn-back');
    const earnedStarsDisplay = document.getElementById('earned-stars');
    let characterContainerBuffer = null; // 問題を事前に読み込むための裏ステージ

    // 問題文の要素を、スコアとタイマーの間に移動する
    // ヘッダーの見た目はすべてCSSファイルで管理します
    if (questionDisplay && timerDisplay && timerDisplay.parentNode) {
        const parent = timerDisplay.parentNode;
        // 問題文をスコアとタイマーの間に移動
        parent.insertBefore(questionDisplay, timerDisplay);
    }

    // BGM
    const bgm = new Audio('assets/sounds/bgm4.mp3');
    bgm.loop = true;
    bgm.volume = 0.3; // BGMの音量を少し下げる

    // ゲーム設定
    const GAME_TIME = 60; // 制限時間（秒）
    let NUM_CHARS = 10; // 表示する文字の数（難易度によって変わる）
    let POINTS_PER_CORRECT = 10; // 1問正解あたりのスコア
    let STAR_DIVISOR = 100; // 星を獲得するためのスコアの割り算の数
    const HIRAGANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ'.split('');
    const KATAKANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ'.split('');
    const ALL_CHARS = [...HIRAGANA, ...KATAKANA];
    const COLORS = ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#be2edd', '#f368e0', '#00d2d3'];

    // 効果音をあらかじめ読み込んでおく
    const SOUNDS = {
        correct: new Audio('assets/sounds/seikai2.mp3'),
        incorrect: new Audio('assets/sounds/fuseikai.mp3')
    };

    // ゲーム状態
    let score = 0;
    let timer = GAME_TIME;
    let timerId = null;
    let currentQuestion = '';
    let isPlaying = false;
    let nextQuestionAnswer = '';
    let nextQuestionPrepared = false;

    /**
     * 事前読み込み用の非表示コンテナを作成/取得する
     */
    function getBufferContainer() {
        if (!characterContainerBuffer) {
            let buffer = document.getElementById('character-container-buffer');
            if (!buffer) {
                buffer = document.createElement('div');
                buffer.id = 'character-container-buffer';
                buffer.style.position = 'absolute';
                buffer.style.left = '-9999px'; // 画面外に配置して見えなくする
                document.body.appendChild(buffer);
            }
            characterContainerBuffer = buffer;
        }
        return characterContainerBuffer;
    }

    // イベントリスナー
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const difficulty = e.target.dataset.difficulty;
            switch (difficulty) {
                case 'easy':
                    NUM_CHARS = 5;
                    POINTS_PER_CORRECT = 5;
                    STAR_DIVISOR = 120; // やさしいモードでは、ほしを もらいにくくする
                    break;
                case 'hard':
                    NUM_CHARS = 15;
                    POINTS_PER_CORRECT = 15;
                    STAR_DIVISOR = 80; // むずかしいモードでは、ほしを もらいやすくする
                    break;
                case 'normal':
                default:
                    NUM_CHARS = 10;
                    POINTS_PER_CORRECT = 10;
                    STAR_DIVISOR = 100; // ふつう
            }
            startGame();
        });
    });
    restartButton.addEventListener('click', startGame); // 「もういちど」は最後に選んだ難易度で再開
    backToMenuButton.addEventListener('click', () => {
        resultScreen.classList.remove('visible'); // 結果画面を隠す
        startScreen.classList.add('visible');    // スタート画面を表示する
    });

    function startGame() {
        // BGMを再生（ユーザーの操作をきっかけに再生を開始）
        // play()はPromiseを返すので、エラーハンドリングをしておくと親切
        bgm.play().catch(e => console.error("BGMの再生に失敗しました:", e));

        // タイマーの警告スタイルをリセット
        timerDisplay.classList.remove('is-warning');

        score = 0;
        timer = GAME_TIME;
        isPlaying = true;
        updateScore();
        updateTimer();

        startScreen.classList.remove('visible');
        resultScreen.classList.remove('visible');

        setupNewQuestion(characterContainer, false); // 最初の問題を直接表示
        prepareNextQuestion(); // 次の問題の事前読み込みを開始
        // 既存のタイマーがあればクリアしてから新しいタイマーを開始
        if (timerId) {
            clearInterval(timerId);
        }
        timerId = setInterval(countDown, 1000);
    }

    // ヘルパー関数: 2つのDOMRectオブジェクトが重なっているかチェックする
    function checkOverlap(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                 rect1.left > rect2.right || 
                 rect1.bottom < rect2.top || 
                 rect1.top > rect2.bottom);
    }

    function countDown() {
        timer--;
        updateTimer();
        if (timer <= 0) {
            endGame();
        }
    }

    function endGame() {
        clearInterval(timerId);
        isPlaying = false;
        // ゲーム終了時にタイマーの色を元に戻す
        timerDisplay.classList.remove('is-warning');

        finalScoreDisplay.textContent = `あなたのスコアは ${score} てんでした！`;

        // スコアに応じて獲得する星の数を計算
        const starsEarned = Math.floor(score / STAR_DIVISOR); // 難易度に応じた割り算の数を使用

        if (earnedStarsDisplay) {
            earnedStarsDisplay.textContent = starsEarned;
        }

        // settings.jsなどにある共通のポイント加算関数を呼び出す
        if (typeof window.addPoints === 'function') {
            window.addPoints(starsEarned);
        }

        resultScreen.classList.add('visible');
    }

    // ヘルパー関数: 指定された範囲のランダムな整数を取得する
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 次の問題を裏で準備する
     */
    function prepareNextQuestion() {
        nextQuestionPrepared = false;
        // 見えないバッファコンテナで次の問題を作成
        const buffer = getBufferContainer();
        setupNewQuestion(buffer, true);
    }

    /**
     * 準備済みの問題を画面に表示する
     */
    function showNextQuestion() {
        const buffer = getBufferContainer();
        // 裏で準備した文字たちを表のステージに移動
        characterContainer.innerHTML = '';
        while (buffer.firstChild) {
            characterContainer.appendChild(buffer.firstChild);
        }

        // 問題文と現在の正解を更新
        currentQuestion = nextQuestionAnswer;
        updateQuestionDisplay(currentQuestion);
    }

    /**
     * 問題文の表示を更新する
     * @param {string} char 表示する文字
     */
    function updateQuestionDisplay(char) {
        // 「さがしてね！」というテキストと、探す文字を大きく表示するHTMLを生成
        questionDisplay.innerHTML = `さがしてね！<span class="question-char">${char}</span>`;
    }

    function setupNewQuestion(targetContainer, isPreload = false) {
        targetContainer.innerHTML = ''; // 対象のコンテナをクリア

        // ランダムに10文字選ぶ（重複なし）
        const shuffled = ALL_CHARS.sort(() => 0.5 - Math.random());
        const targetChars = shuffled.slice(0, NUM_CHARS);

        // 正解の文字を決める
        const answer = targetChars[Math.floor(Math.random() * targetChars.length)];
        if (isPreload) {
            nextQuestionAnswer = answer; // 事前読み込みの場合は、次の答えとして保存
        } else {
            currentQuestion = answer; // 通常表示の場合は、現在の答えとして設定
            updateQuestionDisplay(answer);
        }

        // コンテナの寸法を一度取得
        const containerRect = characterContainer.getBoundingClientRect();

        // はみ出し防止のため、コンテナ内に安全な領域（セーフエリア）を設定
        const SAFE_AREA_PADDING = 30; // 上下左右に30pxの余白

        // 問題文はコンテナの外に移動したので、コンテナ全体を配置エリアとして使う
        const safeAreaWidth = containerRect.width - (SAFE_AREA_PADDING * 2);
        const safeAreaHeight = containerRect.height - (SAFE_AREA_PADDING * 2);

        // グリッド設定
        let GRID_COLS, GRID_ROWS;
        if (NUM_CHARS <= 5) {
            GRID_COLS = 3;
            GRID_ROWS = 2; // 6 cells
        } else if (NUM_CHARS <= 10) {
            GRID_COLS = 4;
            GRID_ROWS = 3; // 12 cells
        } else { // <= 15
            GRID_COLS = 5;
            GRID_ROWS = 4; // 20 cells
        }
        const cellWidth = safeAreaWidth / GRID_COLS;
        const cellHeight = safeAreaHeight / GRID_ROWS;

        // グリッドセルのインデックスを作成し、シャッフルする
        let cellIndices = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => i);
        cellIndices.sort(() => Math.random() - 0.5);

        // 文字を画面に配置
        targetChars.forEach((char, index) => {
            const charElement = document.createElement('span');
            charElement.textContent = char;
            charElement.classList.add('character');
            charElement.dataset.char = char;

            // スタイルを適用して文字のサイズを決定
            charElement.style.fontSize = `${Math.random() * 4 + 2}em`; // フォントサイズを大きく: 2em ~ 6em
            charElement.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];

            // 一時的にDOMに追加して寸法を計測
            charElement.style.position = 'absolute';
            charElement.style.visibility = 'hidden';
            targetContainer.appendChild(charElement);
            const charRect = charElement.getBoundingClientRect();
            const charWidth = charRect.width;
            const charHeight = charRect.height;

            // 文字を配置するセルを決定
            const cellIndex = cellIndices[index];
            const gridCol = cellIndex % GRID_COLS;
            const gridRow = Math.floor(cellIndex / GRID_COLS);

            // セル内でのランダムな位置を計算
            const randomXInCell = Math.random() * Math.max(0, cellWidth - charWidth);
            const randomYInCell = Math.random() * Math.max(0, cellHeight - charHeight);

            // 最終的な位置を決定
            const finalLeft = SAFE_AREA_PADDING + (gridCol * cellWidth) + randomXInCell;
            const finalTop = SAFE_AREA_PADDING + (gridRow * cellHeight) + randomYInCell;

            charElement.style.left = `${finalLeft}px`;
            charElement.style.top = `${finalTop}px`;

            // 位置が確定したので、文字を表示する
            charElement.style.visibility = 'visible';

            // アニメーションの種類と、そのアニメーションで使う値を設定
            const animType = Math.random();
            if (animType < 0.33) {
                // 「拡大・縮小」アニメーション用の値を設定
                charElement.style.setProperty('--start-scale-rotate', `${Math.random() * 10 - 5}deg`); // -5degから5deg
                charElement.style.setProperty('--end-scale-rotate', `${Math.random() * 10 - 5}deg`);
                charElement.classList.add('anim-scale');
            } else if (animType < 0.66) {
                // 「揺れ」アニメーション用の値を設定
                charElement.style.setProperty('--start-sway-rotate', `${Math.random() * 40 - 20}deg`); // -20degから20deg
                charElement.style.setProperty('--end-sway-rotate', `${Math.random() * 40 - 20}deg`);
                charElement.classList.add('anim-rotate');
            } else {
                // 「ぐるぐる」回転アニメーションを適用
                charElement.classList.add('anim-spin');
            }
            charElement.style.animationDuration = `${Math.random() * 3 + 2}s`;
            // 事前読み込みの場合は遅延なしで即アニメーション開始
            charElement.style.animationDelay = isPreload ? '0s' : `${Math.random() * 1}s`;

            charElement.addEventListener('click', handleCharacterClick);
        });

        if (isPreload) {
            nextQuestionPrepared = true;
        }
    }

    function handleCharacterClick(e) {
        if (!isPlaying) return;

        // バッファ内の文字はクリックを無視
        if (e.target.parentElement.id === 'character-container-buffer') return;

        const clickedChar = e.target.dataset.char;

        if (clickedChar === currentQuestion) {
            // 正解
            score += POINTS_PER_CORRECT;
            updateScore();
            createStarburstEffect(e.target);
            playSE('correct');

            // 正解した文字を少し派手にする
            e.target.style.transition = 'all 0.3s';
            e.target.style.transform = 'scale(1.5) rotate(0deg)';
            e.target.style.opacity = '0';

            setTimeout(() => {
                if (isPlaying) {
                    if (nextQuestionPrepared) {
                        showNextQuestion();
                        prepareNextQuestion(); // すぐに次の問題の準備を始める
                    } else {
                        // 準備が間に合わなかった場合の予備処理
                        setupNewQuestion(characterContainer, false);
                    }
                }
            }, 500); // 0.5秒後に次の問題へ
        } else {
            // 不正解
            playSE('incorrect');

            // すでに震えている場合は処理しない
            if (e.target.classList.contains('is-shaking')) {
                return;
            }
            e.target.classList.add('is-shaking');

            // 要素に適用されている全てのアニメーションを取得し、一時停止する
            const animations = e.target.getAnimations();
            animations.forEach(animation => animation.pause());

            // 現在の計算済みtransform値を取得
            const computedStyle = window.getComputedStyle(e.target);
            const baseTransform = computedStyle.transform === 'none' ? '' : computedStyle.transform;

            // ブルブル震えるアニメーションを再生
            e.target.animate([
                { transform: `${baseTransform} translateX(5px)` },
                { transform: `${baseTransform} translateX(-5px)` },
                { transform: `${baseTransform} translateX(5px)` },
                { transform: `${baseTransform} translateX(-5px)` },
                { transform: baseTransform }
            ], {
                duration: 300,
                easing: 'ease-in-out'
            }).onfinish = () => {
                // 震えるアニメーションが終わったら、一時停止していたアニメーションを再開
                animations.forEach(animation => animation.play());
                e.target.classList.remove('is-shaking');
            };
        }
    }

    function updateScore() {
        scoreDisplay.innerHTML = `スコア<br>${score}`;
    }

    function updateTimer() {
        timerDisplay.innerHTML = `のこりじかん<br>${timer}`;

        // 残り10秒以下で警告スタイルを適用
        if (timer <= 10 && timer > 0) {
            timerDisplay.classList.add('is-warning');
        } else {
            // 10秒より多い、または0になったら警告を解除
            timerDisplay.classList.remove('is-warning');
        }
    }

    /**
     * 効果音を再生する
     * @param {('correct'|'incorrect')} soundName - 再生する音声の名前
     */
    function playSE(soundName) {
        const sound = SOUNDS[soundName];
        if (sound) {
            // 連続で再生される場合も最初から再生されるようにする
            sound.currentTime = 0;
            sound.play().catch(e => console.error(`Audio play failed for ${soundName}:`, e));
        }
    }

    /**
     * 星が飛び散るエフェクトを生成する
     * @param {HTMLElement} element エフェクトの中心となる要素
     */
    function createStarburstEffect(element) {
        const rect = element.getBoundingClientRect();
        // エフェクトの中心座標を計算
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;

        // スコアに応じて星の数を変える
        const baseParticles = 10; // 基本の星の数
        const bonusParticles = Math.floor(score / 50); // 50点ごとに1つ星が増える
        const particleCount = Math.min(30, baseParticles + bonusParticles); // 最大30個まで

        for (let i = 0; i < particleCount; i++) {
            const star = document.createElement('div');
            star.classList.add('star'); // CSSでスタイルを適用するためのクラス
            
            // 星の初期位置をクリックされた文字の中心に設定
            star.style.left = `${originX}px`;
            star.style.top = `${originY}px`;
            
            // 飛び散る方向と距離をランダムに計算
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * 80 + 50; // 50pxから130pxの範囲
            const translateX = Math.cos(angle) * distance;
            const translateY = Math.sin(angle) * distance;

            // CSSアニメーションで使うためのカスタムプロパティを設定
            star.style.setProperty('--translate-x', `${translateX}px`);
            star.style.setProperty('--translate-y', `${translateY}px`);

            document.body.appendChild(star);

            // アニメーションが終了したら星の要素を削除する
            star.addEventListener('animationend', () => {
                star.remove();
            });
        }
    }
});
