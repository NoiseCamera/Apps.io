document.addEventListener('DOMContentLoaded', () => {
    const collectionGrid = document.getElementById('collection-grid');
    const collectionStats = document.getElementById('collection-stats');
    const completeRewardDiv = document.getElementById('complete-reward');
    const useRewardBtn = document.getElementById('use-reward-btn');
    const toggleCollectionViewBtn = document.getElementById('toggle-collection-view-btn');
    // モーダル関連の要素を取得
    const itemDetailModal = document.getElementById('item-detail-modal');
    const modalItemImage = document.getElementById('modal-item-image');
    const modalItemName = document.getElementById('modal-item-name');
    const closeModalBtn = document.getElementById('close-detail-modal-btn');

    // ページ下部のボタンを「ガチャ画面に行く」に変更し、クリックイベントを設定
    const footerNavButton = document.getElementById('footer-nav-button');
    if (footerNavButton) {
        footerNavButton.textContent = 'ガチャがめんにいく';
        footerNavButton.addEventListener('click', () => {
            window.location.href = 'gacha.html';
        });
    }

    // gacha.jsと同じリストを使用
    const ALL_REWARDS = [
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

    const userCollection = JSON.parse(localStorage.getItem('userCollection') || '[]');

    // モーダルを閉じる関数
    const closeModal = () => {
        itemDetailModal.classList.add('hidden');
    };

    // モーダルを閉じるイベントリスナー
    closeModalBtn.addEventListener('click', closeModal);
    itemDetailModal.addEventListener('click', (e) => {
        if (e.target === itemDetailModal) {
            closeModal();
        }
    });

    // 統計情報を更新
    collectionStats.textContent = `あつめたかず： ${userCollection.length} / ${ALL_REWARDS.length}`;

    // グリッドにアイテムを表示 (コンプリート状態でも裏で生成しておく)
    ALL_REWARDS.forEach(reward => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('collection-item');
        const isCollected = userCollection.includes(reward.id);

        if (isCollected) {
            itemDiv.classList.add('collected');
            itemDiv.innerHTML = `<img src="assets/images/${reward.id}.png" alt="${reward.name}"><p>${reward.name}</p>`;
            itemDiv.addEventListener('click', () => {
                modalItemImage.src = `assets/images/${reward.id}.png`;
                modalItemImage.alt = reward.name;
                modalItemName.textContent = reward.name;
                itemDetailModal.classList.remove('hidden');
                if (typeof playSE === 'function') playSE('assets/sounds/kachi.mp3');
            });
        } else {
            itemDiv.innerHTML = `<p class="unknown">？</p>`;
        }
        collectionGrid.appendChild(itemDiv);
    });

    // --- コンプリート判定 ---
    if (userCollection.length >= ALL_REWARDS.length) {
        // コンプリート時の処理
        collectionGrid.style.display = 'none';
        collectionStats.style.display = 'none';
        completeRewardDiv.classList.remove('hidden');

        if (typeof playSE === 'function') playSE('assets/sounds/kirakira.mp3');

        useRewardBtn.addEventListener('click', () => {
            if (confirm('ほんとうに けんを つかいますか？\nまた いちから あつめなおしに なります。')) {
                localStorage.removeItem('userCollection');
                alert('けんをつかいました！\nまた たくさん あつめてね！');
                // ページをリロードして、リセットされたコレクション画面を表示します
                window.location.reload();
            }
        });

        toggleCollectionViewBtn.addEventListener('click', () => {
            // .hidden クラスの有無で表示を切り替える
            const isRewardHidden = completeRewardDiv.classList.contains('hidden');

            if (isRewardHidden) {
                // ごほうびを表示し、コレクションを非表示にする
                completeRewardDiv.classList.remove('hidden');
                collectionGrid.style.display = 'none';
                collectionStats.style.display = 'none';
                toggleCollectionViewBtn.textContent = 'あつめたコレクションを見る';
            } else {
                // コレクションを表示し、ごほうびを非表示にする
                completeRewardDiv.classList.add('hidden');
                collectionGrid.style.display = 'grid';
                collectionStats.style.display = 'inline-block';
                toggleCollectionViewBtn.textContent = 'ごほうび画面にもどる';
            }
        });
    }
});