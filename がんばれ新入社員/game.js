document.addEventListener('DOMContentLoaded', () => {
    // HTML要素の取得
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');    
    const timerElement = document.getElementById('timer');
    const areaElement = document.getElementById('area');
    const rankElement = document.getElementById('rank');
    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-button');
    const gameOverScreen = document.getElementById('game-over-screen');    
    const gameOverTitleElement = gameOverScreen.querySelector('h2');
    const finalScoreElement = document.getElementById('final-score').querySelector('span');
    const finalRankElement = document.getElementById('display-rank');
    const restartButton = document.getElementById('restart-button');

    // ゲームの基本設定
    const GAME_DURATION = 60; // 制限時間（秒）

    // ゲーム状態を管理する変数
    let timeLeft = GAME_DURATION;
    let areaPercentage = 100;
    let timerInterval = null;
    let gameRunning = false;
    let kills = 0;    
    let currentRankIndex = 0;
    let enemySpawnInterval = 40; // 敵の出現間隔（フレーム数）。初期値をかなり早めます。

    const backgroundImage = new Image();
    backgroundImage.src = 'data/background.png';

    const playerImage = new Image();
    playerImage.src = 'data/player.png';

    // 敵の画像
    const enemyImages = [
        'data/enemy01.png',
        'data/enemy02.png',
        'data/enemy03.png',
        'data/enemy04.png',
        'data/enemy05.png'
    ].map(src => { const img = new Image(); img.src = src; return img; });

    // BGM
    const bgm = new Audio('data/bgm.mp3');
    bgm.loop = true; // BGMをループ再生

    // 階級の設定 (名前、昇進に必要な撃破数、プレイヤーの半径)
    const ranks = [
        { name: '新入社員', kills: 0, radius: 15 },
        { name: '平社員',   kills: 38, radius: 16 },
        { name: '主任',     kills: 50, radius: 18 },
        { name: '係長',     kills: 65, radius: 20 },
        { name: '課長',     kills: 85, radius: 23 },
        { name: '次長',     kills: 110, radius: 26 },
        { name: '部長',     kills: 140, radius: 30 },
        { name: '本部長',   kills: 175, radius: 33 },
        { name: '役員',     kills: 215, radius: 36 },
        { name: '社長',     kills: 260, radius: 40 },
        { name: '会長',     kills: 310, radius: 45 }        
    ];

    // ブルーシートの初期サイズを保持
    const initialBlueSheet = {
        width: 500,
        height: 375
    };

    // ブルーシートの現在の状態（サイズや位置）
    const blueSheet = {
        width: initialBlueSheet.width,
        height: initialBlueSheet.height,
        x: (canvas.width - initialBlueSheet.width) / 2,
        y: (canvas.height - initialBlueSheet.height) / 2,        
        color: 'rgb(50, 149, 255)'

    };

    // プレイヤー（自分の社員）
    const player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 15,        
        color: 'orange',
        rotation: 0
    };

    // 敵（ライバル会社の新人）
    let enemies = [];
    let enemySpawnCounter = 0;
    let slowEnemies = false; // 敵が遅くなっている状態かどうかのフラグ

    // --- イベントリスナーの設定 ---    

    // ゲーム開始ボタン
    startButton.addEventListener('click', startGame);    
    restartButton.addEventListener('click', restartGame);

    function restartGame() {startGame();}

    // マウスの動きに合わせてプレイヤーを操作
    canvas.addEventListener('mousemove', (e) => {
        if (!gameRunning) return;
        const rect = canvas.getBoundingClientRect();
        player.x = e.clientX - rect.left;
        player.y = e.clientY - rect.top;
    });

    // キーボード入力のイベントリスナー
    document.addEventListener('keydown', (e) => {
        if (e.key === 's' && gameRunning) {
            slowEnemies = !slowEnemies; // sキーでスロー状態を切り替え
            console.log('敵の動きが', slowEnemies ? '遅く' : '通常に', 'なりました。');
        }
    });

    
    // --- ゲームのメイン関数 ---

    function startGame() {
        // ゲーム状態を初期化
        timeLeft = GAME_DURATION;
        areaPercentage = 100;
        kills = 0;
        currentRankIndex = 0;
        enemySpawnInterval = 35; // 敵の出現間隔をリセット (難易度UP)
        enemies = [];
        gameOverScreen.style.display = 'none';

        // ブルーシートのサイズと面積表示をリセット
        blueSheet.width = initialBlueSheet.width;
        blueSheet.height = initialBlueSheet.height;
        blueSheet.x = (canvas.width - blueSheet.width) / 2;
        blueSheet.y = (canvas.height - blueSheet.height) / 2;
        gameRunning = true;
        startScreen.style.display = 'none';
        canvas.style.cursor = 'none'; // ゲーム中はカーソルを非表示

        // BGMを再生
        bgm.currentTime = 0;
        bgm.play();

        // UIを更新        
        player.radius = ranks[currentRankIndex].radius;
        timerElement.textContent = timeLeft;
        areaElement.textContent = Math.round(areaPercentage); // 念のため整数に丸める
        rankElement.textContent = ranks[currentRankIndex].name;

        // タイマーを開始
        timerInterval = setInterval(updateTimer, 1000);

        // ゲームループを開始
        gameLoop();
    }

    function updateTimer() {
        timeLeft--;
        // 時間経過で難易度上昇（敵の出現間隔を短くする）
        if (timeLeft === 40) {
            enemySpawnInterval = 25; // 序盤から加速
        } else if (timeLeft === 25) {
            enemySpawnInterval = 15; // 中盤のラッシュ
        } else if (timeLeft === 10) {
            enemySpawnInterval = 8; // 終盤の猛攻！
        }

        timerElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame(areaPercentage > 0); // 時間切れの場合、面積が残っていれば勝利
        }
    }    

    function gameLoop() {
        if (!gameRunning) return;

        update(); // ゲーム状態の更新
        draw();   // 画面の描画
        
        requestAnimationFrame(gameLoop);
    }

    function update() {
        // プレイヤーの回転を更新 (ブルーシートの中心を向くように)
        const targetX = blueSheet.x + blueSheet.width / 2;
        const targetY = blueSheet.y + blueSheet.height / 2;
        player.rotation = Math.atan2(targetY - player.y, targetX - player.x);

        // 一定間隔で敵を生成
        enemySpawnCounter++;
        if (enemySpawnCounter > enemySpawnInterval) {
            spawnEnemy();            
            enemySpawnCounter = 0;
        }

        moveEnemies();
        checkPlayerEnemyCollision();
        checkEnemyBlueSheetCollision();
    }

    function draw() {
        // 画面をクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 背景画像を描画
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        // ブルーシートを描画
        ctx.fillStyle = blueSheet.color;
        ctx.fillRect(blueSheet.x, blueSheet.y, blueSheet.width, blueSheet.height);

         // 敵を描画
        enemies.forEach(enemy => {
            ctx.save(); // 現在の描画状態を保存
            ctx.translate(enemy.x, enemy.y); // 敵の中心に移動
            // 画像が右向きなので、-90度回転させて上を向くように調整
            ctx.rotate(enemy.rotation - Math.PI / 2);

            const enemyImage = enemyImages[enemy.imageId];
            // 画像の中心が(0,0)になるように描画
            ctx.drawImage(enemyImage, -enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);

            ctx.restore(); // 描画状態を復元
        });

        // プレイヤーを描画 (ゲーム中のみ)
        if (gameRunning) {
            ctx.save();
            ctx.translate(player.x, player.y);
            // プレイヤーの画像の頭（上方向）が中心を向くように回転を調整します。
            ctx.rotate(player.rotation + Math.PI / 2); // 画像が元々上向きの場合、+90度の補正で進行方向を向きます。
            const size = player.radius * 2;
            ctx.drawImage(playerImage, -player.radius, -player.radius, size, size);
            ctx.restore();
        }

        // UI（残り時間など）を描画
        drawUI();
    }

    function drawUI() {
        const rankName = ranks[currentRankIndex] ? ranks[currentRankIndex].name : '新入社員';
        const displayArea = Math.round(areaPercentage); // 表示用の面積を整数にする

        ctx.fillStyle = 'white'; // 文字の色
        ctx.strokeStyle = 'black'; // 文字のフチの色
        ctx.lineWidth = 4; // フチの太さ
        ctx.font = 'bold 22px "Helvetica", "Arial", sans-serif'; // 文字のスタイル
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const texts = [
            `残り時間: ${timeLeft}秒`,
            `確保面積: ${displayArea}%`,
            `階級: ${rankName}`
        ];

        texts.forEach((text, i) => {
            const y = 30 + i * 30; // 上部表示に変更
            ctx.strokeText(text, 15, y); // フチを描画
            ctx.fillText(text, 15, y);   // 文字本体を描画
        });
    }

    function drawUI() {
        const rankName = ranks[currentRankIndex] ? ranks[currentRankIndex].name : '新入社員';
        const displayArea = Math.round(areaPercentage); // 表示用の面積を整数にする

        ctx.fillStyle = 'white'; // 文字の色
        ctx.strokeStyle = 'black'; // 文字のフチの色
        ctx.lineWidth = 4; // フチの太さ
        ctx.font = 'bold 22px "Helvetica", "Arial", sans-serif'; // 文字のスタイル
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const texts = [
            `残り時間: ${timeLeft}秒`,
            `確保面積: ${displayArea}%`,
            `階級: ${rankName}`
        ];

        texts.forEach((text, i) => {
            const y = 30 + i * 30; // 上部表示に変更
            ctx.strokeText(text, 15, y); // フチを描画
            ctx.fillText(text, 15, y);   // 文字本体を描画
        });
    }

    function spawnEnemy() {
        const radius = 20; // 敵の半径を大きくする
        const color = '#d9534f'; // 赤色
        let x, y;

        // キャンバスの外周からランダムに出現
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        const imageId = Math.floor(Math.random() * enemyImages.length); // ランダムに画像を選択

        // ブルーシートの中心を狙うように初期角度を設定
        const targetX = blueSheet.x + blueSheet.width / 2;
        const targetY = blueSheet.y + blueSheet.height / 2;
        const rotation = Math.atan2(targetY - y, targetX - x);

        // 敵ごとに1.2から2.2の範囲で速度をランダムに設定 (難易度UP)
        const speed = 1.2 + Math.random() * 1.0;
        enemies.push({ x, y, radius, color, imageId, rotation, speed });        
    }

    function moveEnemies() {
        enemies.forEach(enemy => {            
            // ブルーシートの中心に向かって移動
            const targetX = blueSheet.x + blueSheet.width / 2;
            const targetY = blueSheet.y + blueSheet.height / 2;
            const angle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
            // スロー状態に応じて速度を調整
            const speedModifier = slowEnemies ? 0.5 : 1;
            enemy.x += Math.cos(angle) * enemy.speed * speedModifier;
            enemy.y += Math.sin(angle) * enemy.speed * speedModifier;
            enemy.rotation = angle; // 進行方向を向くように回転を更新
        });
    }    

    function checkPlayerEnemyCollision() {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // プレイヤーと敵がぶつかったら敵を消す
            if (distance < player.radius + enemy.radius) {
                enemies.splice(i, 1);
                kills++; // 撃破数を増やす
                checkPromotion(); // 昇進チェック
            }
        }
    }    

    function checkEnemyBlueSheetCollision() {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            // 敵がブルーシート内に入ったら
            if (enemy.x > blueSheet.x && enemy.x < blueSheet.x + blueSheet.width &&
                enemy.y > blueSheet.y && enemy.y < blueSheet.y + blueSheet.height) {

                enemies.splice(i, 1); // 敵を消す
                areaPercentage -= 18; // 面積を減らすペナルティを増加 (難易度UP)
                if (areaPercentage < 0) areaPercentage = 0;
                areaElement.textContent = Math.round(areaPercentage);

                // 確保面積率に応じてブルーシートの表示サイズを更新
                // 面積は縦x横なので、スケールは面積率の平方根とする
                const scale = Math.sqrt(areaPercentage / 100);
                blueSheet.width = initialBlueSheet.width * scale;
                blueSheet.height = initialBlueSheet.height * scale;
                blueSheet.x = (canvas.width - blueSheet.width) / 2;
                blueSheet.y = (canvas.height - blueSheet.height) / 2;

                if (areaPercentage <= 0) {
                    endGame(false); // 面積が0になったらゲームオーバー
                }
            }
        }        
    }

    function checkPromotion() {
        // 次の階級が存在し、昇進条件を満たしているかチェック
        if (currentRankIndex < ranks.length - 1 && kills >= ranks[currentRankIndex + 1].kills) {
            currentRankIndex++;
            player.radius = ranks[currentRankIndex].radius;
            rankElement.textContent = ranks[currentRankIndex].name;
        }        
    }

    function endGame(isWin) {
        bgm.pause(); // BGMを停止
        gameRunning = false;
        clearInterval(timerInterval);
        canvas.style.cursor = 'default'; // ゲーム終了時にカーソルを再表示

        // 勝利・敗北に応じてゲームオーバー画面のタイトルを変更
        if (isWin) {
            gameOverTitleElement.textContent = 'ゲームクリア！';
        } else {
            gameOverTitleElement.textContent = 'ゲームオーバー';
        }

        // 最終スコアを計算 (勝利ボーナス + 確保面積 + 撃破数ボーナス)。スコア評価を厳格化。
        const winBonus = isWin ? 50 : 0 ;
        const scoreFromArea = isWin ? areaPercentage : 0; // 敗北時は面積スコアを0に
        const finalScore = Math.round(winBonus + scoreFromArea + (kills * 2)) ;
        
        // 最終スコアに基づいて最終階級を決定
        let finalRank;
        if (isWin){ // ゲームクリア時のみスコアで階級を決定
            finalRank = '新入社員'; // デフォルトの階級
            if (finalScore >= 400) {
                finalRank = '会長';
            } else if (finalScore >= 370) {
                finalRank = '社長';
            } else if (finalScore >= 340) {
                finalRank = '役員';
            } else if (finalScore >= 310) {
                finalRank = '本部長';
            } else if (finalScore >= 280) {
                finalRank = '部長';
            } else if (finalScore >= 250) {
                finalRank = '次長';
            } else if (finalScore >= 220) {
                finalRank = '課長';
            } else if (finalScore >= 180) {
                finalRank = '係長';
            } else if (finalScore >= 140) {
                finalRank = '主任';
            } else if (finalScore >= 100) {
                finalRank = '平社員';
            }
        } else { // ゲームオーバー時
            finalRank = '懲戒免職';
        }

        finalScoreElement.textContent = finalScore;
        finalRankElement.textContent = finalRank;
        gameOverScreen.style.display = 'block';
        draw();
    }

    draw();
});
