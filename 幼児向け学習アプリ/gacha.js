document.addEventListener('DOMContentLoaded', () => {
    // ダブルタップによるズームを防止
    document.body.style.touchAction = 'manipulation';

    const gachaButton = document.getElementById('gacha-button');
    const gachaImage = document.getElementById('gacha-image');
    const rewardModal = document.getElementById('reward-modal');
    const rewardImage = document.getElementById('reward-image');
    const rewardName = document.getElementById('reward-name');
    const closeRewardBtn = document.getElementById('close-reward-btn');

    // ページ下部のボタンを「コレクション画面に行く」に変更し、クリックイベントを設定
    const footerNavButton = document.getElementById('footer-nav-button');
    if (footerNavButton) {
        footerNavButton.textContent = 'コレクションがめんにいく';
        footerNavButton.addEventListener('click', () => {
            window.location.href = 'collection.html';
        });
    }

    const GACHA_COST = 3;
    let bgmInitialized = false; // BGMが初期化されたかどうかのフラグ

    // このゲームで使う効果音のリスト
    const SOUND_EFFECTS = [
        'assets/sounds/gacha-shake.mp3',
        'assets/sounds/gacha-open.mp3',
        'assets/sounds/gacha-fanfare.mp3'
    ];

    // ごほうびのリスト (IDは動物の画像ファイル名、nameは表示用)
    const REWARDS = [
        { id: 'usagi', name: 'うさぎ' },
        { id: 'アシカ', name: 'アシカ' },
        { id: 'イヌ', name: 'イヌ' },
        { id: 'イルカ', name: 'イルカ' },
        { id: 'ウマ', name: 'ウマ' },
        { id: 'キリン', name: 'キリン' },
        { id: 'クジラ', name: 'クジラ' },
        { id: 'クマ', name: 'クマ' },
        { id: 'ゴリラ', name: 'ゴリラ' },
        { id: 'サメ', name: 'サメ' },
        { id: 'サル', name: 'サル' },
        { id: 'シャチ', name: 'シャチ' },
        { id: 'トラ', name: 'トラ' },
        { id: 'ネコ', name: 'ネコ' },
        { id: 'ハムスター', name: 'ハムスター' },
        { id: 'パンダ', name: 'パンダ' },
        { id: 'ペンギン', name: 'ペンギン' },
        { id: 'ライオン', name: 'ライオン' },
        { id: 'リス', name: 'リス' },
        { id: 'レッサーパンダ', name: 'レッサーパンダ' }
    ];

    /**
     * ユーザーの最初の操作でBGMを再生する
     */
    function initializeBgm() {
        if (bgmInitialized) return;
        // settings.jsによって<audio>要素が生成される
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.play().catch(error => console.log('BGMの再生にはユーザーの操作が必要です。', error));
        }
        // 効果音もこのタイミングでプリロードする
        if (typeof preloadAudioSources === 'function') {
            preloadAudioSources(SOUND_EFFECTS);
        }
        bgmInitialized = true;
    }

    /**
     * ユーザーのコレクションデータをlocalStorageから取得する
     * @returns {string[]} 獲得したリワードIDの配列
     */
    function getCollection() {
        const collectionJSON = localStorage.getItem('userCollection');
        return collectionJSON ? JSON.parse(collectionJSON) : [];
    }

    /**
     * ユーザーのコレクションデータをlocalStorageに保存する
     * @param {string[]} collection - 保存するコレクションの配列
     */
    function saveCollection(collection) {
        localStorage.setItem('userCollection', JSON.stringify(collection));
    }

    /**
     * ガチャを引く処理
     */
    async function drawGacha() {
        // ポイントが足りるかチェック
        if (getPoints() < GACHA_COST) {
            alert('ほしが たりないよ！\nゲームをあそんで ほしをあつめてね。');
            return;
        }

        // ガチャ実行中はボタンを無効化
        gachaButton.disabled = true;

        // 1. ポイントを消費
        spendPoints(GACHA_COST);

        // 2. アニメーションと効果音
        gachaImage.classList.add('shake');
        await playSE('assets/sounds/gacha-shake.mp3'); // シェイク音

        // 3. 宝箱が開く
        gachaImage.src = 'assets/images/treasure_chest_open.png';
        gachaImage.classList.remove('shake');
        await playSE('assets/sounds/gacha-open.mp3'); // 開く音

        // 4. ごほうびをランダムに選ぶ
        const reward = REWARDS[Math.floor(Math.random() * REWARDS.length)];

        // 5. コレクションに追加
        const collection = getCollection();
        if (!collection.includes(reward.id)) {
            collection.push(reward.id);
            saveCollection(collection);
        }

        // 6. モーダルにごほうびを表示
        rewardImage.src = `assets/images/${reward.id}.png`;
        rewardName.textContent = `${reward.name} をてにいれた！`;
        rewardModal.classList.remove('hidden');
        await playSE('assets/sounds/gacha-fanfare.mp3'); // ファンファーレ
    }

    // ボタンにスタイルを適用
    gachaButton.classList.add('colorful-btn');
    closeRewardBtn.classList.add('colorful-btn');
    if (footerNavButton) {
        footerNavButton.classList.add('colorful-btn');
    }

    gachaButton.addEventListener('click', drawGacha);

    closeRewardBtn.addEventListener('click', () => {
        rewardModal.classList.add('hidden');
        gachaImage.src = 'assets/images/treasure_chest_closed.png'; // 宝箱を閉じた状態に戻す
        gachaButton.disabled = false; // ボタンを再度有効化
    });

    // ユーザーの最初の操作でBGMを再生
    document.body.addEventListener('click', initializeBgm, { once: true });
    document.body.addEventListener('touchstart', initializeBgm, { once: true });
});