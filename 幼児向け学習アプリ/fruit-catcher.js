// fruit-catcher.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const video = document.getElementById('video');
    const canvas = document.getElementById('output-canvas');
    const ctx = canvas.getContext('2d');
    const basketElement = document.getElementById('basket');
    const basket2Element = document.getElementById('basket2');
    const avatar1Element = document.getElementById('avatar1');
    const avatar2Element = document.getElementById('avatar2');
    const gameArea = document.getElementById('game-area');
    const backToMenuIngameButton = document.getElementById('back-to-menu-ingame');
    const feedbackText = document.getElementById('feedback-text');
    const coOpInfo = document.getElementById('co-op-info');

    const startModal = document.getElementById('start-modal');
    const loadingModal = document.getElementById('loading-modal');
    const countdownModal = document.getElementById('countdown-modal');
    const gameOverModal = document.getElementById('game-over-modal');
    const turnSwitchModal = document.getElementById('turn-switch-modal');

    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const backToMenuButton = document.getElementById('back-to-menu-btn');
    const startCoOpButton = document.getElementById('start-co-op-btn');
    const avatarChoices = document.querySelectorAll('.avatar-choice');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const modeButtons = document.querySelectorAll('.mode-btn');

    const scoreDisplay = document.querySelector('#score-display span');
    const playerTurnDisplay = document.getElementById('player-turn-display');
    const livesDisplay = document.querySelector('#lives-display span');
    const finalScoreDisplay = document.getElementById('final-score');
    const earnedStarsDisplay = document.getElementById('earned-stars');
    const countdownDisplay = document.getElementById('countdown-display');

    // 効果音
    let bgm; // DOMContentLoadedの後、動的に取得する
    const catchSound = document.getElementById('catch-sound');
    const dropSound = document.getElementById('drop-sound');
    const gameOverSound = document.getElementById('game-over-sound');

    // ゲーム設定（基本値）
    const INITIAL_LIVES = 3;
    const FRUIT_SIZE = 65;
    const SPAWN_MARGIN = 100; // 画面の端からこのピクセル分はフルーツを発生させない
    const EXPLOSION_DURATION = 200; // 爆発エフェクトの表示時間 (ms)

    // 難易度ごとの設定
    const GAME_SETTINGS = {
        easy:   { spawnInterval: 2000, speed: 1.5, bombChance: 0.10, heartChance: 0.05 }, // 5%の確率でハートが出現
        normal: { spawnInterval: 1500, speed: 2.0, bombChance: 0.15, heartChance: 0.05 },
        hard:   { spawnInterval: 1000, speed: 2.5, bombChance: 0.25, heartChance: 0.03 }  // 難しいモードでは少し出にくい
    };

    // ゲーム状態
    let handDetector, faceDetector;
    let score = 0;
    let lives = INITIAL_LIVES;
    let fruits = [];
    let gameLoopId;
    let fruitSpawnId;
    let gameMode = 'single'; // 'single' or 'co-op'
    let currentDifficulty = 'easy'; // デフォルトの難易度
    let selectedAvatar1 = null; // 1Pのアバター
    let selectedAvatar2 = null; // 2Pのアバター
    let isGameOver = false;

    const fruitImages = [];
    const fruitPaths = [
        'assets/images/fruits/apple.png',
        'assets/images/fruits/banana.png',
        'assets/images/fruits/orange.png',
        'assets/images/fruits/strawberry.png',
        'assets/images/fruits/grape.png'
    ];
    let player1Fruits = [];
    let player2Fruits = [];
    const neutralFruits = ['banana.png']; // どちらが取ってもOK
    const fruitOwners = {};

    const bombImage = new Image();
    bombImage.src = 'assets/images/bomb.png';
    const heartImage = new Image();
    heartImage.src = 'assets/images/heart.png';
    const explosionImage = new Image();
    explosionImage.src = 'assets/images/bakuhatu.png';
    let explosionTimer = null; // 爆発タイマーを管理

    // フルーツ画像をプリロード
    let loadedImages = 0;
    fruitPaths.forEach(path => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            loadedImages++;
        };
        fruitImages.push(img);
    });

    /**
     * 協力プレイ時の担当フルーツをランダムに割り振り、UIを更新する
     */
    function assignRandomFruitsAndRender() {
        // バナナ以外のフルーツを取得
        const assignableFruits = fruitPaths
            .map(path => path.split('/').pop())
            .filter(fileName => !neutralFruits.includes(fileName));

        // シャッフル
        for (let i = assignableFruits.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [assignableFruits[i], assignableFruits[j]] = [assignableFruits[j], assignableFruits[i]];
        }

        // 半分に分ける
        const half = Math.ceil(assignableFruits.length / 2);
        player1Fruits = assignableFruits.slice(0, half);
        player2Fruits = assignableFruits.slice(half);

        // fruitOwnersを再構築
        fruitPaths.forEach(path => {
            const fileName = path.split('/').pop();
            if (player1Fruits.includes(fileName)) fruitOwners[path] = 1;
            else if (player2Fruits.includes(fileName)) fruitOwners[path] = 2;
            else fruitOwners[path] = 0; // 担当なし (バナナ)
        });

        // UIを更新
        const p1Display = document.getElementById('player1-fruits-display');
        const p2Display = document.getElementById('player2-fruits-display');
        const turnSwitchModalText = document.querySelector('#turn-switch-modal .modal-content p:nth-of-type(1)');
        
        p1Display.innerHTML = '<span class="player-label-small p1">1P</span>';
        let p1ModalHtml = '';
        player1Fruits.forEach(fruitName => {
            const fruitImageHtml = `<img src="assets/images/fruits/${fruitName}" alt="${fruitName.split('.')[0]}">`;
            p1Display.innerHTML += fruitImageHtml;
            p1ModalHtml += `<img src="assets/images/fruits/${fruitName}" class="fruit-icon"> `;
        });

        p2Display.innerHTML = '<span class="player-label-small p2">2P</span>';
        let p2ModalHtml = '';
        player2Fruits.forEach(fruitName => {
            const fruitImageHtml = `<img src="assets/images/fruits/${fruitName}" alt="${fruitName.split('.')[0]}">`;
            p2Display.innerHTML += fruitImageHtml;
            p2ModalHtml += `<img src="assets/images/fruits/${fruitName}" class="fruit-icon"> `;
        });
        // どちらも取って良いフルーツ（バナナ）を追加
        p1Display.innerHTML += `<img src="assets/images/fruits/banana.png" alt="banana" class="neutral-fruit">`;
        p2Display.innerHTML += `<img src="assets/images/fruits/banana.png" alt="banana" class="neutral-fruit">`;

        // 説明モーダルのテキストも動的に更新
        if (turnSwitchModalText) {
            turnSwitchModalText.innerHTML = `かごが２つでてくるよ！<br>1Pのかごは ${p1ModalHtml}をとってね！<br>2Pのかごは ${p2ModalHtml}をとってね！<br><img src="assets/images/fruits/banana.png" class="fruit-icon"> はどっちがとってもオーケーだよ！`;
        }
    }

    // --- 初期化処理 ---

    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modeButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            gameMode = button.dataset.mode;

            // 協力プレイの時だけ2P用のアバター選択を表示
            const p2AvatarGroup = document.getElementById('avatar-selection-p2');
            p2AvatarGroup.classList.toggle('hidden', gameMode !== 'co-op');
        });
    });

    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 他のボタンの選択状態を解除
            difficultyButtons.forEach(btn => btn.classList.remove('selected'));
            // クリックされたボタンを選択状態にする
            button.classList.add('selected');
            currentDifficulty = button.dataset.difficulty;
        });
    });

    // 1P, 2P両方のアバター選択を処理
    document.querySelectorAll('.avatar-choices').forEach(container => {
        container.addEventListener('click', (e) => {
            const choice = e.target.closest('.avatar-choice');
            if (!choice) return;

            // 同じグループ内の選択を解除して、クリックしたものを選択状態にする
            container.querySelectorAll('.avatar-choice').forEach(c => c.classList.remove('selected'));
            choice.classList.add('selected');

            const player = container.dataset.player;
            const avatarType = choice.dataset.avatar;
            const avatar = (avatarType === 'none' || !avatarType) ? null : avatarType;

            if (player === '1') {
                selectedAvatar1 = avatar;
            } else {
                selectedAvatar2 = avatar;
            }
        });
    });

    startButton.addEventListener('click', async () => {
        startModal.classList.add('hidden');
        loadingModal.classList.remove('hidden');

        // settings.jsによって動的に生成されるBGM要素を取得
        bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.play().catch(e => console.log("BGMの再生はユーザー操作後に可能です。"));
        }

        try {
            await setupCamera();
            await loadDetectors();
            document.body.classList.add('game-active');
            gameLoopId = requestAnimationFrame(gameLoop);

            loadingModal.classList.add('hidden');

            if (gameMode === 'co-op') {
                // 協力モードの場合は、まず説明モーダルを表示
                assignRandomFruitsAndRender();
                turnSwitchModal.classList.remove('hidden');
            } else {
                // シングルプレイはすぐにカウントダウン開始
                startCountdown();
            }
        } catch (error) {
            console.error("初期化に失敗しました:", error);
            loadingModal.innerHTML = `<div class="modal-content"><h2>エラー</h2><p>カメラまたはAIの準備ができませんでした。<br>ページを再読み込みしてください。</p></div>`;
        }
    });

    restartButton.addEventListener('click', () => {
        gameOverModal.classList.add('hidden');
        document.body.classList.add('game-active');
        // ゲームループを再開し、カウントダウンを開始
        gameLoopId = requestAnimationFrame(gameLoop);
        startCountdown();
    });

    startCoOpButton.addEventListener('click', () => {
        turnSwitchModal.classList.add('hidden');
        startCountdown(); // 説明が終わったらカウントダウンを開始
    });

    backToMenuButton.addEventListener('click', () => {
        // ページをリロードして最初の状態に戻す
        location.reload();
    });

    backToMenuIngameButton.addEventListener('click', () => {
        location.reload();
    });

    // --- カメラとモデルのセットアップ ---

    async function setupCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        });
        video.srcObject = stream;

        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve(); // サイズ設定はせず、カメラの準備完了のみを通知
            };
        });
    }

    async function loadDetectors() {
        await tf.setBackend('webgl');
        // 手の検出モデル
        const handModel = handPoseDetection.SupportedModels.MediaPipeHands;
        const handDetectorConfig = {
            runtime: 'mediapipe',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
            modelType: 'lite' // 'lite' or 'full'
        };
        handDetector = await handPoseDetection.createDetector(handModel, handDetectorConfig);
        console.log("手の検出モデルをロードしました。");

        // 顔の検出モデル
        const faceModel = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const faceDetectorConfig = {
            runtime: 'mediapipe',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
        };
        faceDetector = await faceDetection.createDetector(faceModel, faceDetectorConfig);
        console.log("顔の検出モデルをロードしました。");
    }

    // --- ゲームのメインロジック ---

    function startCountdown() {
        resetGame();
        gameArea.classList.remove('hidden');
        countdownModal.classList.remove('hidden');
        let count = 3;
        countdownDisplay.textContent = count;

        // gameAreaが表示された後にcanvasのサイズを設定する
        const gameAreaRect = gameArea.getBoundingClientRect();
        canvas.width = gameAreaRect.width;
        canvas.height = gameAreaRect.height;

        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownDisplay.textContent = count;
            } else {
                clearInterval(countdownInterval);
                countdownModal.classList.add('hidden');
                startGame(); // カウントダウンが終わったらゲーム開始
            }
        }, 1000);
    }

    function startGame() {
        // isGameOverフラグをfalseにして、ゲームのメインロジック（フルーツ落下など）を開始
        isGameOver = false; // ★ここでゲームロジックが有効になる
        // 選択された難易度のフルーツ出現間隔を設定
        fruitSpawnId = setInterval(spawnFruit, GAME_SETTINGS[currentDifficulty].spawnInterval);
        if (bgm && bgm.paused) bgm.play();
    }

    function resetGame() {
        score = 0;
        lives = INITIAL_LIVES;
        fruits = [];
        isGameOver = true; // ゲーム開始前はロジックを無効化
        updateUI();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        basketElement.style.opacity = 0;
        avatar1Element.classList.add('hidden');
        coOpInfo.classList.add('hidden');
        basket2Element.classList.add('hidden');
        // resetGameではアバターを隠さないように変更
    }

    function endGame() {
        if (isGameOver) return;
        isGameOver = true; // ゲーム終了
        cancelAnimationFrame(gameLoopId);
        clearInterval(fruitSpawnId);
        document.body.classList.remove('game-active');
        if (bgm) {
            bgm.pause();
            bgm.currentTime = 0;
        }
        gameOverSound.play();
        const earned = Math.floor(score / 10);
        updateStars(earned);
        finalScoreDisplay.textContent = score;
        earnedStarsDisplay.textContent = earned;
        earnedStarsDisplay.parentElement.classList.remove('hidden');

        gameArea.classList.add('hidden');
        gameOverModal.classList.remove('hidden');
    }

    async function gameLoop() {
        // isGameOverがtrueでも、アバター表示のためにループは続ける。
        // endGameでcancelAnimationFrameされるまでループは止まらない。
        gameLoopId = requestAnimationFrame(gameLoop);

        // 手と顔の検出を並行して実行
        const [hands, faces] = await Promise.all([
            handDetector.estimateHands(video, { flipHorizontal: true }),
            faceDetector.estimateFaces(video, { flipHorizontal: true })
        ]);

        // 描画クリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // カメラの解像度(video)と画面の表示領域(canvas)の比率を計算
        const scaleX = canvas.width / video.videoWidth;
        const scaleY = canvas.height / video.videoHeight;

        // 検出された顔をX座標でソート
        const sortedFaces = faces.sort((a, b) => a.box.xMin - b.box.xMin);

        // アバターの更新 (最大2つまで)
        if (gameMode === 'co-op') {
            updateAvatar(avatar1Element, sortedFaces[0], selectedAvatar1, scaleX, scaleY);
            updateAvatar(avatar2Element, sortedFaces[1], selectedAvatar2, scaleX, scaleY);
        } else {
            updateAvatar(avatar1Element, sortedFaces[0], selectedAvatar1, scaleX, scaleY);
            avatar2Element.classList.add('hidden'); // 2Pアバターは常に非表示
        }

        // かごの更新
        if (gameMode === 'co-op') {
            coOpInfo.classList.remove('hidden');
            basket2Element.classList.remove('hidden');
            // 2つの手を左右でプレイヤー1と2に割り当てる
            const handsSorted = hands.sort((a, b) => a.keypoints[0].x - b.keypoints[0].x);
            const hand1 = handsSorted[0];
            const hand2 = handsSorted[1];

            updateBasket(basketElement, hand1, scaleX, scaleY);
            updateBasket(basket2Element, hand2, scaleX, scaleY);

        } else { // シングルプレイ
            coOpInfo.classList.add('hidden');
            basket2Element.classList.add('hidden');
            updateBasket(basketElement, hands[0], scaleX, scaleY);
        }

        // フルーツの更新と描画
        // ゲームが始まっている場合のみフルーツを更新する
        if (!isGameOver) {
            updateFruits();
        }
    }

    /**
     * 1つのアバター要素を更新する
     * @param {HTMLElement} avatarEl - 更新するアバターのDOM要素
     * @param {object} face - TensorFlowから返された顔データ
     * @param {string|null} avatarType - 'boy', 'girl', または null
     * @param {number} scaleX - X軸のスケール比
     * @param {number} scaleY - Y軸のスケール比
     */
    function updateAvatar(avatarEl, face, avatarType, scaleX, scaleY) {
        if (avatarType && face && face.box) {
            const box = face.box;
            const avatarImg = avatarEl.querySelector('img');
            avatarImg.src = `assets/images/${avatarType}.png`;

            const avatarWidth = box.width * scaleX * 1.7;
            const avatarHeight = box.height * scaleY * 1.7;
            const avatarX = box.xMin * scaleX + (box.width * scaleX / 2);
            const avatarY = box.yMin * scaleY + (box.height * scaleY / 2) - (avatarHeight * 0.1);

            avatarEl.style.width = `${avatarWidth}px`;
            avatarEl.style.height = `${avatarHeight}px`;
            avatarEl.style.left = `${avatarX}px`;
            avatarEl.style.top = `${avatarY - avatarHeight / 2}px`;
            avatarEl.classList.remove('hidden');
        } else {
            avatarEl.classList.add('hidden');
        }
    }

    function updateBasket(basket, hand, scaleX, scaleY) {
        if (hand) {
            const keypoints = hand.keypoints;
            const wrist = keypoints.find(k => k.name === 'wrist');
            const middleFingerMCP = keypoints.find(k => k.name === 'middle_finger_mcp');

            if (wrist && middleFingerMCP) {
                const palmCenterX = (wrist.x + middleFingerMCP.x) / 2;
                const palmCenterY = (wrist.y + middleFingerMCP.y) / 2;

                const scaledX = palmCenterX * scaleX;
                const scaledY = palmCenterY * scaleY;

                basket.style.left = `${scaledX}px`;
                basket.style.bottom = `${canvas.height - scaledY}px`;
                basket.style.opacity = 1;
            }
        } else {
            basket.style.opacity = 0;
        }
    }

    function spawnFruit() {
        if (isGameOver || loadedImages < fruitPaths.length) return;

        const settings = GAME_SETTINGS[currentDifficulty];
        // 画面の左右にマージンを設けて、その範囲内にフルーツを生成する
        const spawnableWidth = canvas.width - (SPAWN_MARGIN * 2) - FRUIT_SIZE;
        const x = SPAWN_MARGIN + Math.random() * spawnableWidth;

        const rand = Math.random();
        let itemImage, itemOwner, isBomb, isHeart = false;

        if (rand < settings.bombChance) {
            // 爆弾
            itemImage = bombImage;
            isBomb = true;
            itemOwner = -1; // bomb
        } else if (rand < settings.bombChance + settings.heartChance) {
            // ハート
            itemImage = heartImage;
            isHeart = true;
            itemOwner = 100; // heart (特別な値)
        } else {
            // フルーツ
            const fruitPath = fruitPaths[Math.floor(Math.random() * fruitPaths.length)];
            itemImage = fruitImages.find(img => img.src.includes(fruitPath));
            itemOwner = fruitOwners[fruitPath];
        }

        fruits.push({
            x: x,
            y: -FRUIT_SIZE,
            speed: settings.speed + Math.random(), // 難易度に応じた速度にランダム性を加える
            image: itemImage,
            owner: itemOwner,
            isBomb: isBomb,
            isHeart: isHeart,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
    }

    function updateFruits() {
        const basketRect = basketElement.getBoundingClientRect();
        const basket2Rect = gameMode === 'co-op' ? basket2Element.getBoundingClientRect() : null;
        const gameAreaRect = gameArea.getBoundingClientRect();

        for (let i = fruits.length - 1; i >= 0; i--) {
            const fruit = fruits[i];
            fruit.y += fruit.speed;
            fruit.rotation += fruit.rotationSpeed;

            // 描画
            ctx.save();
            ctx.translate(fruit.x + FRUIT_SIZE / 2, fruit.y + FRUIT_SIZE / 2);
            ctx.rotate(fruit.rotation);
            ctx.drawImage(fruit.image, -FRUIT_SIZE / 2, -FRUIT_SIZE / 2, FRUIT_SIZE, FRUIT_SIZE);
            ctx.restore();

            // 爆発中のフルーツは、一定時間後に消す
            if (fruit.isExploding && Date.now() > fruit.explosionEndTime) {
                fruits.splice(i, 1);
                updateUI();
                if (lives <= 0) endGame();
                continue;
            }

            let caught = false;
            if (checkCollision(fruit, basketRect, gameAreaRect)) {
                handleCatch(fruit, 1, basketElement);
                caught = true;
            } else if (gameMode === 'co-op' && checkCollision(fruit, basket2Rect, gameAreaRect)) {
                handleCatch(fruit, 2, basket2Element);
                caught = true;
            }

            if (caught) {
                if (!fruit.isExploding) fruits.splice(i, 1); // 爆弾以外はすぐに消す
                updateUI();
                if (lives <= 0) {
                    endGame();
                }
                continue; // 当たったので以降のチェックは不要
            }

            // 画面外に落ちたか判定
            if (fruit.y > canvas.height) {
                if (!fruit.isBomb && !fruit.isHeart) { // 爆弾とハートは落としてもOK
                    lives--;
                    dropSound.play();
                }
                fruits.splice(i, 1);
                updateUI();
                if (lives <= 0) {
                    endGame();
                }
            }
        }
    }

    function checkCollision(fruit, basketRect, gameAreaRect) {
        if (!basketRect || basketRect.width === 0) return false;

        const fruitCenterX = fruit.x + FRUIT_SIZE / 2;
        const fruitCenterY = fruit.y + FRUIT_SIZE / 2;
        const basketCenterX = (basketRect.left - gameAreaRect.left) + basketRect.width / 2;
        const basketCenterY = (basketRect.top - gameAreaRect.top) + basketRect.height / 2;

        const distance = Math.sqrt(Math.pow(fruitCenterX - basketCenterX, 2) + Math.pow(fruitCenterY - basketCenterY, 2));

        return distance < (FRUIT_SIZE / 2 + basketRect.width / 3);
    }

    function handleCatch(fruit, playerNum, basket) {
        // 既に処理済みのアイテム（爆発中の爆弾など）は再度処理しない
        if (fruit.handled) return;

        if (fruit.isBomb) {
            lives = Math.max(0, lives - 1); // ライフを1つだけ減らす
            triggerExplosion(fruit); // 爆発エフェクト
            dropSound.play();
            // 爆弾はフルーツリストからすぐに削除しない（爆発エフェクト表示のため）
        } else if (fruit.isHeart) {
            // ライフが最大でなければ回復
            if (lives < INITIAL_LIVES) {
                lives++;
                showFeedback('ライフが かいふくしたよ！');
            }
            catchSound.currentTime = 0;
            catchSound.play();
        } else if (gameMode === 'co-op' && fruit.owner !== 0 && fruit.owner !== playerNum) {
            // 協力プレイで担当外のフルーツを取った場合
            lives--;
            dropSound.play();
        } else {
            // 正しいフルーツを取った場合
            score += 10;
            catchSound.currentTime = 0;
            catchSound.play();
            // かごを揺らすアニメーションクラスを追加
            basket.classList.add('basket-wobble');
            basket.addEventListener('animationend', () => {
                basket.classList.remove('basket-wobble');
            }, { once: true });
        }

        // このアイテムを処理済みとしてマークする
        fruit.handled = true;
    }

    // --- UI更新 ---

    /**
     * 爆発エフェクトと画面シェイクをトリガーする
     * @param {object} fruit - 爆発するフルーツ（爆弾）オブジェクト
     */
    function triggerExplosion(fruit) {
        // 爆弾の画像を爆発画像に一時的に変更
        fruit.image = explosionImage;
        fruit.isExploding = true; // 爆発中フラグ

        // 画面シェイククラスをbodyに追加
        document.body.classList.add('screen-shake');

        // 爆発アニメーションの終了を待つためのタイマー
        // このタイマーは、updateFruits内でフルーツが削除されるのを制御するために使用
        fruit.explosionEndTime = Date.now() + EXPLOSION_DURATION;

        // アニメーションが終わったらシェイククラスを削除
        setTimeout(() => {
            document.body.classList.remove('screen-shake');
        }, 400); // CSSのshake-animationの時間と合わせる
    }

    function showFeedback(message) {
        feedbackText.textContent = message;
        feedbackText.classList.remove('hidden');
        // アニメーションが終わったら非表示にする
        setTimeout(() => {
            feedbackText.classList.add('hidden');
        }, 1500); // CSSのアニメーション時間と合わせる
    }

    function updateUI() {
        scoreDisplay.textContent = score;
        livesDisplay.innerHTML = '❤️'.repeat(lives) + '♡'.repeat(Math.max(0, INITIAL_LIVES - lives));
    }

    // --- 星の管理 (settings.jsと連携) ---
    function updateStars(earned) {
        // settings.js の addPoints 関数を呼び出すように変更
        if (typeof window.addPoints === 'function') {
            window.addPoints(earned);
            console.log(`${earned}個の星を獲得しました！`);
        }
    }

    // 初期UI設定
    // BGM要素をこのタイミングで取得しておく
    bgm = document.getElementById('bgm');
    resetGame();
});
