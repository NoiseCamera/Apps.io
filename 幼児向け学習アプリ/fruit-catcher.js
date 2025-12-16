document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const loadingMessage = document.getElementById('loading-message');
    const gameArea = document.getElementById('game-area');
    const scoreDisplay = document.querySelector('#score-display span');
    const livesDisplay = document.querySelector('#lives-display span');
    const basket = document.getElementById('basket');
    const infoBar = document.getElementById('info-panel'); // IDを修正
    const gameOverModal = document.getElementById('game-over-modal');
    const finalScore = document.getElementById('final-score');
    const restartBtn = document.getElementById('restart-btn');
    const permissionModal = document.getElementById('camera-permission-modal');
    const startCameraBtn = document.getElementById('start-camera-btn');
    const bgm = document.getElementById('bgm');

    // --- ゲーム状態管理 ---
    let model;
    let score = 0;
    let lives = 3;
    let fallingFruits = [];
    let animationFrameId; // requestAnimationFrameのID
    let isGameOver = false;
    let lastFruitTime = 0; // 最後にフルーツを生成した時間

    // --- 定数 ---
    const FRUIT_CLASSES = ['apple', 'orange', 'banana'];

    /**
     * カメラをセットアップし、ビデオストリームを開始します。
     * @returns {Promise<HTMLVideoElement>} 準備ができたvideo要素を返します。
     */
    async function setupCamera() {
        // ★★★ 変更: Promiseベースで、より確実にカメラの準備完了を待つ ★★★
        return new Promise(async (resolve, reject) => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user' // インカメラを使用
                    }
                });
                video.srcObject = stream;
                // canplayイベントは、ビデオが再生を開始できる状態になったときに発生します
                video.onloadedmetadata = () => {
                    // ★★★ 変更: 全画面表示に対応 ★★★
                    video.play();
                    // 画面サイズに合わせてCanvasとVideoのサイズを設定
                    setFullscreenLayout();
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    video.play();
                    resolve(video);
                };
            } catch (err) {
                reject(err); // エラーが発生した場合はPromiseを失敗させる
            }
        });
    }

    /**
     * ★★★ 追加: ゲーム画面を全画面にするためのレイアウト設定 ★★★
     */
    function setFullscreenLayout() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        if (gameArea) {
            gameArea.style.position = 'fixed';
            gameArea.style.top = '0';
            gameArea.style.left = '0';
            gameArea.style.width = '100vw';
            gameArea.style.height = '100vh';
        }

        // infoBarのIDがinfo-panelなので修正
        const infoPanel = document.getElementById('info-panel');
        if (infoPanel) {
            infoPanel.style.zIndex = '100';
            infoPanel.style.position = 'fixed'; // 全画面表示時に情報パネルが隠れないように
            infoPanel.style.top = '10px';
            infoPanel.style.width = '100%';
            infoPanel.style.display = 'flex';
            infoPanel.style.justifyContent = 'space-around';
        }
    }

    /**
     * 手のひら検出モデルをロードします。
     * @returns {Promise<handPoseDetection.HandDetector>} ロードされたモデルを返します。
     */
    async function loadModel() { // ★★★ 変更: 手のひら検出モデルをロードする ★★★
        const model = handPoseDetection.SupportedModels.MediaPipeHands;
        const detectorConfig = {
            runtime: 'mediapipe', // or 'tfjs'
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
        };
        return await handPoseDetection.createDetector(model, detectorConfig);
    }

    function startGame() {
        score = 0;
        lives = 3;
        isGameOver = false;
        fallingFruits = [];
        updateScore();
        updateLives();
        gameOverModal.classList.add('hidden');
        lastFruitTime = 0; // フルーツ生成タイマーをリセット
        // ★★★ 変更: setIntervalからrequestAnimationFrameベースのループに変更 ★★★
        runGame(0); // 最初のフレームを開始
    }

    function createFallingFruit() {
        const x = Math.random() * canvas.width;
        const fruitType = FRUIT_CLASSES[Math.floor(Math.random() * FRUIT_CLASSES.length)];
        fallingFruits.push({ x, y: 0, type: fruitType, speed: 2 + Math.random() * 3 });
    }

    function updateScore() {
        scoreDisplay.textContent = score;
    }

    function updateLives() {
        livesDisplay.textContent = '❤️'.repeat(lives);
    }

    function gameOver() {
        isGameOver = true;
        // ★★★ 変更: アニメーションループを停止 ★★★
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        finalScore.textContent = score;
        gameOverModal.classList.remove('hidden');
        if (typeof playSE === 'function') playSE('assets/sounds/lose.mp3');
        if (bgm) bgm.pause(); // ゲームオーバー時にBGMを停止
    }

    // ★★★ 変更: ゲームループの構造を刷新 ★★★
    async function runGame(timestamp) {
        if (isGameOver) return;

        // 次のフレームを予約
        animationFrameId = requestAnimationFrame(runGame);

        // 2秒ごとに新しいフルーツを生成 (時間ベースの制御)
        if (timestamp - lastFruitTime > 2000) {
            createFallingFruit();
            lastFruitTime = timestamp;
        }

        const hands = await model.estimateHands(video); // ★★★ 変更: model.detect -> model.estimateHands
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ★★★ 変更: 検出された手の中で、最も大きいものを探す ★★★
        let largestObject = null;
        let maxArea = 0;

        hands.forEach(hand => {
            // hand.boundingBoxから幅と高さを取得
            const area = hand.boundingBox.width * hand.boundingBox.height;
            if (area > maxArea) {
                maxArea = area;
                largestObject = hand;
            }
        });
        // ★★★ 変更ここまで ★★★

        if (largestObject) {
            // 検出されたオブジェクトの中心にバスケットを移動
            // 映像は左右反転しているので、x座標の計算も反転させる
            const objectCenterX = largestObject.boundingBox.xMin + largestObject.boundingBox.width / 2;
            const basketX = canvas.width - objectCenterX - (basket.offsetWidth / 2);
            basket.style.left = `${basketX}px`;
        }

        // 落下するフルーツの描画と当たり判定
        const basketRect = basket.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();

        for (let i = fallingFruits.length - 1; i >= 0; i--) {
            const fruit = fallingFruits[i];
            fruit.y += fruit.speed;

            // フルーツを描画
            ctx.font = '30px sans-serif';
            let emoji = '🍎';
            if (fruit.type === 'orange') emoji = '🍊';
            if (fruit.type === 'banana') emoji = '🍌';
            ctx.fillText(emoji, fruit.x, fruit.y);

            // バスケットとの当たり判定
            // フルーツの座標はcanvas内、バスケットの座標はウィンドウ全体なので、補正が必要
            const fruitScreenX = canvasRect.left + (canvas.width - fruit.x); // 左右反転を考慮
            const fruitScreenY = canvasRect.top + fruit.y;

            if (
                fruitScreenX > basketRect.left &&
                fruitScreenX < basketRect.right &&
                fruitScreenY > basketRect.top &&
                fruitScreenY < basketRect.bottom
            ) {
                // キャッチ成功
                score += 10;
                updateScore();
                fallingFruits.splice(i, 1); // フルーツを消す
                if (typeof playSE === 'function') playSE('assets/sounds/kachi.mp3');
                if (typeof addPoints === 'function') addPoints(1);
            }
            // 地面に落ちたか判定
            else if (fruit.y > canvas.height) {
                lives--;
                updateLives();
                fallingFruits.splice(i, 1); // フルーツを消す
                if (typeof playSE === 'function') playSE('assets/sounds/incorrect.mp3');
                if (lives <= 0) {
                    gameOver();
                    break;
                }
            }
        }
    }

    restartBtn.addEventListener('click', () => {
        startGame();
        if (bgm) bgm.play().catch(e => console.error("BGMの再開に失敗:", e));
    });

    // ユーザーの最初の操作でBGMを再生
    function initializeAudio() {
        const bgm = document.getElementById('bgm');
        if (bgm && bgm.paused) {
            bgm.play().catch(e => console.error("BGMの再生に失敗しました:", e));
        }
        document.body.removeEventListener('click', initializeAudio);
        document.body.removeEventListener('touchstart', initializeAudio);
    }

    // ★★★ 追加: ウィンドウリサイズ時にレイアウトを再調整 ★★★
    window.addEventListener('resize', () => {
        if (!isGameOver) setFullscreenLayout();
    });

    document.body.addEventListener('click', initializeAudio);
    document.body.addEventListener('touchstart', initializeAudio);

    /**
     * アプリケーションのメイン処理。カメラとモデルを初期化し、ループを開始します。
     */
    async function main() {
        try {
            // ★★★ 追加: mediaDevicesがサポートされているかチェック ★★★
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                loadingMessage.innerHTML = "<p>エラー: このブラウザではカメラをりようできません。HTTPSまたはlocalhostでページをひらいてください。</p>";
                return;
            }

            await setupCamera();

            model = await loadModel();
            // ローディングメッセージを非表示にし、ゲームエリアを表示
            loadingMessage.classList.add('hidden');
            gameArea.classList.remove('hidden');

            startGame();

        } catch (error) {
            // ★★★ 変更: エラーの種類に応じて、より詳しいメッセージを表示 ★★★
            console.error("カメラまたはモデルの初期化に失敗しました:", error.name, error.message);
            let errorMessage = "エラー: カメラを起動できませんでした。";
            switch (error.name) {
                case 'NotAllowedError':
                    errorMessage = "エラー: カメラの使用が許可されていません。ブラウザのサイト設定でカメラへのアクセスを許可してください。";
                    break;
                case 'NotFoundError':
                    errorMessage = "エラー: 使用できるカメラが見つかりませんでした。カメラが接続されているか確認してください。";
                    break;
                case 'NotReadableError':
                    errorMessage = "エラー: カメラが他のアプリで使用されているか、ハードウェアの問題で起動できませんでした。";
                    break;
                default:
                    errorMessage = `エラー: カメラの起動に失敗しました。(${error.name}) ブラウザの設定や拡張機能を確認してください。`;
            }
            loadingMessage.innerHTML = `<p>${errorMessage}</p>`;
        }
    }

    // 「カメラをつかってあそぶ」ボタンがクリックされたときの処理
    startCameraBtn.addEventListener('click', () => {
        permissionModal.classList.add('hidden');
        loadingMessage.classList.remove('hidden');
        
        // Edgeでの動作安定性のため、わずかに遅延させてからメイン処理を開始
        setTimeout(main, 100);
    });
});
