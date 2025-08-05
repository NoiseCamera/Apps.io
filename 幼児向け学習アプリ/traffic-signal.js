// traffic-signal.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Audio Element Creation ---
    // 必要な音声ファイルを動的に生成してDOMに追加する
    // これにより、settings.jsから音量が一括制御できるようになる
    const soundInfo = [
        { id: 'car-pass-sound', src: 'assets/sounds/車通過.mp3' },
        { id: 'car-horn-sound', src: 'assets/sounds/クラクション.mp3' },
        { id: 'police-car-sound', src: 'assets/sounds/パトカー.mp3', loop: true },
        { id: 'fire-truck-sound', src: 'assets/sounds/消防車.mp3', loop: true },
        { id: 'ambulance-sound', src: 'assets/sounds/救急車.mp3', loop: true }
    ];
    soundInfo.forEach(info => {
        const audio = document.createElement('audio');
        audio.id = info.id;
        audio.src = info.src;
        if (info.loop) audio.loop = true;
        document.body.appendChild(audio);
    });

    // --- DOM Elements ---
    const carLightRed = document.querySelector('#traffic-light-car .red');
    const carLightYellow = document.querySelector('#traffic-light-car .yellow');
    const carLightGreen = document.querySelector('#traffic-light-car .green');

    const pedLightRed = document.querySelector('#traffic-light-pedestrian .red');
    const pedLightGreen = document.querySelector('#traffic-light-pedestrian .green');

    const scene = document.getElementById('scene'); // 車を追加する親要素
    const pedestrian = document.getElementById('pedestrian');
    const crossBtn = document.getElementById('cross-btn');
    const waitBtn = document.getElementById('wait-btn');
    const questionText = document.getElementById('question-text');
    const feedback = document.getElementById('feedback');
    const tutorialModal = document.getElementById('tutorial-modal');
    const startGameBtn = document.getElementById('start-game-btn');
    const trafficAppContainer = document.getElementById('traffic-app-container');

    // --- Sounds ---
    const correctSound = document.getElementById('correct-sound');
    const incorrectSound = document.getElementById('incorrect-sound'); // 元の不正解音はクラクションに置き換える
    const walkSound = document.getElementById('walk-sound');

    // 新しく追加したAudio要素を取得
    const carPassSound = document.getElementById('car-pass-sound');
    const carHornSound = document.getElementById('car-horn-sound');
    const policeCarSound = document.getElementById('police-car-sound');
    const fireTruckSound = document.getElementById('fire-truck-sound');
    const ambulanceSound = document.getElementById('ambulance-sound');

    // 緊急車両ごとの音を管理
    let currentSiren = null; // 現在再生中のサイレン

    // --- Game State & Constants ---
    let signalState = 'PED_RED_CAR_GREEN'; // 最初の状態
    let canCross = false; // 歩行者が渡れるかどうかのフラグ
    let isEmergencyVehicleApproaching = false; // 緊急車両イベント中かどうかのフラグ
    let isCrossing = false; // 歩行者が横断中かどうかのフラグ
    let pedestrianAtStart = true; // true: 手前側, false: 向こう側
    let bgmInitialized = false;
    let currentEmergencyVehicleData = null; // 現在のイベントで使う緊急車両のデータ
    let carCreationInterval; // 車を生成するタイマー
    const INITIAL_QUESTION = 'ひとの しんごうが あおになったら「わたる」をおしてね';
    let signalTimer;
    let gameRoundTimer; // 次のラウンドを開始するためのタイマー

    // 信号の各色の時間を定義
    const DURATION = {
        GREEN: 12000,     // 青信号の時間 (12秒)
        BLINK: 3000,      // 青点滅の時間 (3秒)
        YELLOW: 2000,     // 黄色信号の時間 (2秒)
        RED_PAUSE: 2000   // 全赤の時間 (2秒)
    };

    // --- Functions ---

    /**
     * 次のゲームラウンド（通常サイクル or 緊急車両）を開始する
     */
    function startNextRound() {
        clearTimeout(gameRoundTimer);
        // UIを次のラウンドのためにリセット
        feedback.textContent = '';
        feedback.className = '';
        questionText.textContent = INITIAL_QUESTION;
        crossBtn.disabled = false;
        waitBtn.classList.add('hidden');
        waitBtn.disabled = false;
        isCrossing = false;

        // 30%の確率で緊急車両イベントを発生させる
        if (Math.random() < 0.3) {
            startEmergencyEvent();
        } else {
            startNormalSignalCycle();
        }
    }

    /**
     * 緊急車両イベントを開始する
     */
    function startEmergencyEvent() {
        clearTimeout(signalTimer);
        stopCarCreation(); // 車の生成を停止
        allLightsOff();

        // 緊急時は、車は赤、歩行者は青にして間違いを誘う
        carLightRed.classList.add('on');
        pedLightGreen.classList.add('on');

        triggerEmergencySequence();
    }

    /**
     * 通常の信号サイクルを開始する
     */
    function startNormalSignalCycle() {
        signalState = 'PED_RED_CAR_GREEN';
        updateSignalState();
    }

    function initializeBgm() {
        if (bgmInitialized) return;
        const bgm = document.getElementById('bgm');
        if (!bgm) return;
        bgm.play().catch(error => console.log('BGMの再生にはユーザーの操作が必要です。', error));
        bgmInitialized = true;
    }

    /**
     * すべての信号を消灯するヘルパー関数
     */
    function allLightsOff() {
        [carLightRed, carLightYellow, carLightGreen, pedLightRed, pedLightGreen].forEach(light => {
            light.classList.remove('on', 'blinking');
        });
    }

    /**
     * 走行する車を1台生成してアニメーションを開始する
     */
    function createAndRunCar() {
        const car = document.createElement('div');
        car.classList.add('car-instance');

        const isRedCar = Math.random() < 0.5;
        if (isRedCar) {
            // 赤い車 (奥のレーン)
            car.style.backgroundImage = "url('assets/images/car_red.png')";
            car.classList.add('driving-red');
            car.style.bottom = '20%'; // 奥のレーン
            car.style.zIndex = '4';    // 青い車より後ろ
            // アニメーションの時間を少しランダムにする
            car.style.animationDuration = `${Math.random() * 2 + 7}s`; // 7-9秒
        } else {
            // 青い車 (手前のレーン)
            car.style.backgroundImage = "url('assets/images/car_blue.png')";
            car.classList.add('driving-blue');
            car.style.bottom = '10%'; // 手前のレーン
            car.style.zIndex = '5';    // 赤い車より前
            car.style.animationDuration = `${Math.random() * 2 + 5}s`; // 5-7秒
        }

        // アニメーションが終了したら要素を削除する
        car.addEventListener('animationend', () => {
            car.remove();
        });

        // 車の通過音を再生 (車の信号が青の時のみ)
        if (carPassSound && carLightGreen.classList.contains('on')) {
            // 連続再生に対応するため、グローバルなplaySE関数を使用
            playSE(carPassSound.src);
        }

        scene.appendChild(car);
    }

    /**
     * 緊急車両のアニメーションが終了したときの処理
     * @param {AnimationEvent} event
     */
    function onEmergencyVehicleAnimationEnd(event) {
        // 車両が画面外に出たら要素だけ削除する
        event.target.remove();
        // イベントがまだ続いていれば（ユーザーが「まつ」を押していなければ）、次の緊急車両を出す
        if (isEmergencyVehicleApproaching) {
            createEmergencyVehicle();
        }
    }

    /**
     * 緊急車両を1台生成してアニメーションを開始する
     */
    function createEmergencyVehicle() {
        if (!currentEmergencyVehicleData) return; // 車両データがなければ何もしない
        const car = document.createElement('div');
        car.classList.add('car-instance');
        car.style.backgroundImage = `url('assets/images/${currentEmergencyVehicleData.file}')`;

        const fromLeft = Math.random() < 0.5;
        if (fromLeft) {
            // 左から右へ (奥のレーン)
            car.classList.add('driving-red'); // アニメーションは既存のものを流用
            car.style.bottom = '20%';
            car.style.zIndex = '4';
            car.style.animationDuration = '7s'; // 通常の車と同じくらいの速さに調整
        } else {
            // 右から左へ (手前のレーン)
            car.classList.add('driving-blue'); // アニメーションは既存のものを流用
            car.style.bottom = '10%';
            car.style.zIndex = '5';
            car.style.animationDuration = '6s'; // 通常の車と同じくらいの速さに調整
        }

        // もしサイレンが鳴っていなければ、新しいサイレンを選んで鳴らす
        if (!currentSiren) {
            currentSiren = currentEmergencyVehicleData.sound;
            if (currentSiren) {
                currentSiren.currentTime = 0;
                // Safariでの動作を安定させるため、再生直前に音量を再設定
                const seVolume = localStorage.getItem('seVolume') || 0.7;
                currentSiren.volume = parseFloat(seVolume);
                currentSiren.play().catch(e => console.error("サイレンの再生に失敗", e));
            }
        }

        car.addEventListener('animationend', onEmergencyVehicleAnimationEnd);
        scene.appendChild(car);
    }

    /**
     * 緊急車両イベントを開始する
     */
    function triggerEmergencySequence() {
        isEmergencyVehicleApproaching = true;
        canCross = false; // イベント中は通常の横断はできない
        questionText.textContent = 'きんきゅうしゃが くるよ！ どうする？';
        waitBtn.classList.remove('hidden');
        trafficAppContainer.classList.add('emergency-active');

        // イベント開始時に車両を1種類だけ選ぶ
        const vehicles = [
            { name: 'パトカー', file: 'パトカー.png', sound: policeCarSound },
            { name: '消防車', file: '消防車.png', sound: fireTruckSound },
            { name: '救急車', file: '救急車.png', sound: ambulanceSound }
        ];
        currentEmergencyVehicleData = vehicles[Math.floor(Math.random() * vehicles.length)];

        createEmergencyVehicle();
    }

    /**
     * 緊急車両イベントを解決（終了）する
     */
    function resolveEmergencySequence() {
        isEmergencyVehicleApproaching = false; // 状態をリセット
        currentEmergencyVehicleData = null; // 車両データをリセット
        trafficAppContainer.classList.remove('emergency-active'); // 背景の点滅を止める
        if (currentSiren) { // サイレンを止める
            currentSiren.pause();
            currentSiren.currentTime = 0;
            currentSiren = null;
        }

        // 画面上に残っている可能性のある緊急車両を強制的に削除
        const emergencyVehicle = scene.querySelector('.car-instance');
        if (emergencyVehicle) {
            emergencyVehicle.removeEventListener('animationend', onEmergencyVehicleAnimationEnd);
            emergencyVehicle.remove();
        }

        // 既存のタイマーをクリア
        clearTimeout(gameRoundTimer);
        // ユーザーがフィードバックを読む時間を確保してから、次のラウンドを開始
        gameRoundTimer = setTimeout(startNextRound, 2000);
    }

    /**
     * 車の生成ループを開始する
     */
    function startCarCreation() {
        stopCarCreation(); // 念のため既存のタイマーをクリア
        // 1.5秒から3秒ごとにランダムで車を生成
        const createCar = () => {
            createAndRunCar();
            const randomInterval = Math.random() * 1500 + 1500;
            carCreationInterval = setTimeout(createCar, randomInterval);
        };
        createCar();
    }

    /**
     * 車の生成ループを停止する
     */
    function stopCarCreation() {
        clearTimeout(carCreationInterval);
    }

    /**
     * 信号の状態を更新し、次の状態遷移をスケジュールする
     */
    function updateSignalState() {
        clearTimeout(signalTimer);
        stopCarCreation(); // 信号が変わるタイミングで車の生成を止める
        allLightsOff();

        switch (signalState) {
            case 'PED_RED_CAR_GREEN':
                // 車: 青 / 歩行者: 赤
                carLightGreen.classList.add('on');
                pedLightRed.classList.add('on');
                startCarCreation(); // 車の生成を開始
                canCross = false;
                signalState = 'PED_RED_CAR_YELLOW';
                signalTimer = setTimeout(updateSignalState, DURATION.GREEN);
                break;

            case 'PED_RED_CAR_YELLOW':
                // 車: 黄 / 歩行者: 赤
                carLightYellow.classList.add('on');
                pedLightRed.classList.add('on');
                canCross = false;
                signalState = 'ALL_RED_1';
                signalTimer = setTimeout(updateSignalState, DURATION.YELLOW);
                break;

            case 'ALL_RED_1':
                // 全赤 (車が止まり、歩行者信号が青になる前)
                carLightRed.classList.add('on');
                pedLightRed.classList.add('on');
                canCross = false;
                signalState = 'PED_GREEN_CAR_RED';
                signalTimer = setTimeout(updateSignalState, DURATION.RED_PAUSE);
                break;

            case 'PED_GREEN_CAR_RED':
                // 車: 赤 / 歩行者: 青
                carLightRed.classList.add('on');
                pedLightGreen.classList.add('on');
                // 通常サイクルでは、歩行者用信号が青のときは常に渡れる
                canCross = true;
                signalState = 'PED_BLINK_CAR_RED';
                signalTimer = setTimeout(updateSignalState, DURATION.GREEN);
                break;

            case 'PED_BLINK_CAR_RED':
                // 車: 赤 / 歩行者: 青点滅
                carLightRed.classList.add('on');
                pedLightGreen.classList.add('on', 'blinking');
                canCross = false; // 点滅中は渡れない
                signalState = 'ALL_RED_2';
                signalTimer = setTimeout(updateSignalState, DURATION.BLINK);
                break;

            case 'ALL_RED_2':
                // 全赤 (歩行者信号が赤になり、車が動き出す前)
                carLightRed.classList.add('on');
                pedLightRed.classList.add('on');
                canCross = false;
                // 1サイクルが完了したので、次のラウンドを開始する
                gameRoundTimer = setTimeout(startNextRound, DURATION.RED_PAUSE);
                break;
        }
    }

    /**
     * 「わたる」ボタンが押されたときの処理
     */
    function handleCross() {
        if (isCrossing) return; // 横断中はボタンを無効化

        // 緊急車両イベント中の不正解処理
        if (isEmergencyVehicleApproaching) {
            feedback.textContent = '×';
            feedback.className = 'incorrect';
            questionText.textContent = 'あぶない！きんきゅうしゃが とおるまで まってね！';
            playSE(carHornSound.src);
            // フィードバックは resolveEmergencySequence でリセットされる
            return;
        }

        if (canCross) {
            // --- 正解 ---
            isCrossing = true;
            crossBtn.disabled = true; // ボタンを無効化
            playSE(correctSound.src); // グローバル関数で再生
            if (walkSound) {
                walkSound.loop = true;
                // Safariでの動作を安定させるため、再生直前に音量を再設定
                const seVolume = localStorage.getItem('seVolume') || 0.7;
                walkSound.volume = parseFloat(seVolume);
                walkSound.play();
            }

            if (pedestrianAtStart) {
                // 手前から奥へ渡る時: 歩く画像にする
                pedestrian.classList.remove('finished');
                pedestrian.classList.add('walking');
            } else {
                // 奥から手前へ渡る時: 停止した画像のまま
                pedestrian.classList.add('finished');
                pedestrian.classList.remove('walking');
            }
            // アニメーションが終わったらリセット
            pedestrian.addEventListener('transitionend', finishCrossing, { once: true });
        } else {
            // --- 不正解 ---
            feedback.textContent = '×'; // 「×」を大きく表示
            feedback.className = 'incorrect';
            questionText.textContent = 'あぶない！いまは わたれないよ！'; // メッセージはこちらに表示
            playSE(carHornSound.src);
            setTimeout(() => {
                feedback.textContent = '';
                feedback.className = '';
                questionText.textContent = INITIAL_QUESTION; // 元のテキストに戻す
            }, 2000);
        }
    }

    /**
     * 「まつ」ボタンが押されたときの処理
     */
    function handleWait() {
        if (isEmergencyVehicleApproaching) {
            // --- 正解 ---
            feedback.textContent = '〇';
            feedback.className = 'correct';
            questionText.textContent = 'えらい！ちゃんと まてたね！';
            playSE(correctSound.src); // グローバル関数で再生
            addPoints(2); // 緊急車両を待てたら2ポイント

            // ボタンを無効化
            crossBtn.disabled = true;
            waitBtn.disabled = true;

            // イベントを終了させる
            resolveEmergencySequence();
        }
    }

    function finishCrossing() {
        if (walkSound) {
            walkSound.pause();
            walkSound.currentTime = 0;
        }
        pedestrianAtStart = !pedestrianAtStart; // 開始位置を反転させる

        feedback.textContent = '〇'; // 「〇」を大きく表示
        feedback.className = 'correct';

        if (!pedestrianAtStart) { // 奥に到着した場合
            pedestrian.classList.add('finished');
            addPoints(1); // 正しく渡れたら1ポイント
            questionText.textContent = 'じょうずに わたれたね！';
        } else { // 手前に戻ってきた場合
            pedestrian.classList.remove('finished');
            questionText.textContent = 'じょうずに もどれたね！';
        }
        
        // 少し待ってから次のターンへリセット
        setTimeout(resetForNextTurn, 2000);
    }
    
    function resetForNextTurn() {
        // pedestrianAtStart は finishCrossing で更新済み
        isCrossing = false;
        crossBtn.disabled = false;
        feedback.textContent = '';
        feedback.className = '';
        questionText.textContent = INITIAL_QUESTION;
    }

    crossBtn.addEventListener('click', handleCross);
    waitBtn.addEventListener('click', handleWait);

    // スタートボタンが押されたら、説明を非表示にしてゲームを開始する
    startGameBtn.addEventListener('click', () => {
        // CSSの詳細度の問題で classList.add('hidden') が効かないため、直接スタイルを操作する
        tutorialModal.style.display = 'none';
        startNextRound(); // ゲーム開始
    });

    document.body.addEventListener('click', initializeBgm, { once: true });
    document.body.addEventListener('touchstart', initializeBgm, { once: true });
});