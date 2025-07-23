document.addEventListener('DOMContentLoaded', () => {
    const katakanaContainer = document.getElementById('katakana-container');
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

    /**
     * カタカナをひらがなに変換する関数
     * @param {string} katakanaChar - 変換するカタカナ1文字
     * @returns {string} 変換されたひらがな
     */
    function katakanaToHiragana(katakanaChar) {
        const charCode = katakanaChar.charCodeAt(0);
        // カタカナのUnicode範囲内であれば、オフセットを引いてひらがなにする
        if (charCode >= 0x30A1 && charCode <= 0x30F6) {
            return String.fromCharCode(charCode - 0x60);
        }
        return katakanaChar; // 範囲外ならそのまま返す
    }

    // カタカナをグループ分け
    const katakanaGroups = [
        ['ア', 'イ', 'ウ', 'エ', 'オ'],
        ['カ', 'キ', 'ク', 'ケ', 'コ'],
        ['サ', 'シ', 'ス', 'セ', 'ソ'],
        ['タ', 'チ', 'ツ', 'テ', 'ト'],
        ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
        ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
        ['マ', 'ミ', 'ム', 'メ', 'モ'],
        ['ヤ', '　', 'ユ', '　', 'ヨ'], // レイアウトを揃えるために空白を追加
        ['ラ', 'リ', 'ル', 'レ', 'ロ'],
        ['ワ', '　', 'ヲ', '　', 'ン'], // レイアウトを揃えるために空白を追加
        ['ガ', 'ギ', 'グ', 'ゲ', 'ゴ'],
        ['ザ', 'ジ', 'ズ', 'ゼ', 'ゾ'],
        ['ダ', 'ヂ', 'ヅ', 'デ', 'ド'],
        ['バ', 'ビ', 'ブ', 'ベ', 'ボ'],
        ['パ', 'ピ', 'プ', 'ペ', 'ポ']
    ];

    // 各グループのボタンを生成して追加
    katakanaGroups.forEach(group => {
        const groupContainer = document.createElement('div');
        groupContainer.classList.add('katakana-group'); // グループ用のクラスを追加

        group.forEach(char => {
            const button = document.createElement('button');
            button.textContent = char;
            button.addEventListener('click', () => {
                initializeBgm();
                if (isPlaying || char === '　') return;

                isPlaying = true;
                const hiraganaChar = katakanaToHiragana(char);
                const audio = new Audio(`assets/sounds/hiragana/${hiraganaChar}.mp3`);
                const resetPlayingFlag = () => { isPlaying = false; };

                audio.play().catch(resetPlayingFlag);
                audio.onended = resetPlayingFlag;
                audio.onerror = resetPlayingFlag;
            });
            groupContainer.appendChild(button);
        });

        katakanaContainer.appendChild(groupContainer);
    });
});