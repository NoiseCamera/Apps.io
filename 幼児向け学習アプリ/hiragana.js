document.addEventListener('DOMContentLoaded', () => {
    const hiraganaContainer = document.getElementById('hiragana-container');
    let bgmInitialized = false; // BGMの初期化が完了したか
    let isPlaying = false; // 音声が再生中かどうかのフラグ

    /**
     * ユーザーの最初の操作でBGMを再生する関数
     */
    function initializeBgm() {
        if (bgmInitialized) return;
        const bgm = document.getElementById('bgm');
        if (!bgm) return;
        bgm.play().catch(error => console.log('BGMの再生にはユーザーの操作が必要です。', error));
        bgmInitialized = true;
    }

    // ひらがなをグループ分け
    const hiraganaGroups = [
        ['あ', 'い', 'う', 'え', 'お'],
        ['か', 'き', 'く', 'け', 'こ'],
        ['さ', 'し', 'す', 'せ', 'そ'],
        ['た', 'ち', 'つ', 'て', 'と'],
        ['な', 'に', 'ぬ', 'ね', 'の'],
        ['は', 'ひ', 'ふ', 'へ', 'ほ'],
        ['ま', 'み', 'む', 'め', 'も'],
        ['や', '　', 'ゆ', '　', 'よ'], // レイアウトを揃えるために空白を追加
        ['ら', 'り', 'る', 'れ', 'ろ'],
        ['わ', '　', 'を', '　', 'ん'], // レイアウトを揃えるために空白を追加
        ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
        ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
        ['だ', 'ぢ', 'づ', 'で', 'ど'],
        ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
        ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ']
    ];

    // 各グループのボタンを生成して追加
    hiraganaGroups.forEach(group => {
        const groupContainer = document.createElement('div');
        groupContainer.classList.add('hiragana-group'); // グループ用のクラスを追加

        group.forEach(char => {
            const button = document.createElement('button');
            button.textContent = char;
            button.addEventListener('click', async () => {
                if (isPlaying || char === '　') return;

                isPlaying = true;
                await playSE(`assets/sounds/hiragana/${char}.mp3`);
                isPlaying = false;
            });
            groupContainer.appendChild(button);
        });

        hiraganaContainer.appendChild(groupContainer);
    });

    document.body.addEventListener('click', initializeBgm, { once: true });
    document.body.addEventListener('touchstart', initializeBgm, { once: true });
});