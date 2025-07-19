document.addEventListener('DOMContentLoaded', () => {
    const hiraganaContainer = document.getElementById('hiragana-container');
    const bgm = document.getElementById('bgm'); // BGM要素を取得
    let bgmInitialized = false; // BGMの初期化が完了したか
    let isPlaying = false; // 音声が再生中かどうかのフラグ

    /**
     * ユーザーの最初の操作でBGMを再生する関数
     */
    function initializeBgm() {
        if (bgmInitialized || !bgm) return;
        bgm.play().catch(error => console.log('BGMの再生にはユーザーの操作が必要です。', error));
        bgmInitialized = true;
    }

    // ひらがなをグループ分け
    const groups = [
        ['あ', 'い', 'う', 'え', 'お'],
        ['か', 'き', 'く', 'け', 'こ'],
        ['さ', 'し', 'す', 'せ', 'そ'],
        ['た', 'ち', 'つ', 'て', 'と'],
        ['な', 'に', 'ぬ', 'ね', 'の'],
        ['は', 'ひ', 'ふ', 'へ', 'ほ'],
        ['ま', 'み', 'む', 'め', 'も'],
        ['や', 'ゆ', 'よ'],
        ['ら', 'り', 'る', 'れ', 'ろ'],
        ['わ', 'を', 'ん'],
        ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
        ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
        ['だ', 'ぢ', 'づ', 'で', 'ど'],
        ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
        ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ']
    ];

    // 各グループのボタンを生成して追加
    groups.forEach(group => {
        const groupContainer = document.createElement('div');
        groupContainer.classList.add('hiragana-group'); // グループ用のクラスを追加

        group.forEach(char => {
            const button = document.createElement('button');
            button.textContent = char;
            button.addEventListener('click', () => {
                // 最初のクリックでBGMを初期化
                initializeBgm();

                // 他の音声が再生中なら何もしない
                if (isPlaying) return;

                isPlaying = true;
                const audio = new Audio(`assets/sounds/hiragana/${char}.mp3`);
                audio.play();

                // 音声の再生が終わったらフラグをリセット
                audio.onended = () => {
                    isPlaying = false;
                };
                // 音声の再生でエラーが起きた場合もフラグをリセット
                audio.onerror = () => {
                    isPlaying = false;
                    console.error(`音声ファイル assets/sounds/hiragana/${char}.mp3 が見つかりません。`);
                };
            });
            groupContainer.appendChild(button);
        });

        hiraganaContainer.appendChild(groupContainer);
    });
});