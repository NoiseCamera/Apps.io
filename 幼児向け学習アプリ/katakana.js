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
    const groups = [
        ['ア', 'イ', 'ウ', 'エ', 'オ'],
        ['カ', 'キ', 'ク', 'ケ', 'コ'],
        ['サ', 'シ', 'ス', 'セ', 'ソ'],
        ['タ', 'チ', 'ツ', 'テ', 'ト'],
        ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
        ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
        ['マ', 'ミ', 'ム', 'メ', 'モ'],
        ['ヤ', 'ユ', 'ヨ'],
        ['ラ', 'リ', 'ル', 'レ', 'ロ'],
        ['ワ', 'ヲ', 'ン'],
        ['ガ', 'ギ', 'グ', 'ゲ', 'ゴ'],
        ['ザ', 'ジ', 'ズ', 'ゼ', 'ゾ'],
        ['ダ', 'ヂ', 'ヅ', 'デ', 'ド'],
        ['バ', 'ビ', 'ブ', 'ベ', 'ボ'],
        ['パ', 'ピ', 'プ', 'ペ', 'ポ']
    ];

    // 各グループのボタンを生成して追加
    groups.forEach(group => {
        const groupContainer = document.createElement('div');
        groupContainer.classList.add('katakana-group'); // グループ用のクラスを追加

        group.forEach(char => {
            const button = document.createElement('button');
            button.textContent = char;
            button.addEventListener('click', () => {
                // 最初のクリックでBGMを初期化
                initializeBgm();

                // 他の音声が再生中なら何もしない
                if (isPlaying) return;

                isPlaying = true;
                const hiraganaChar = katakanaToHiragana(char);
                const audio = new Audio(`assets/sounds/hiragana/${hiraganaChar}.mp3`);
                audio.play();

                // 音声の再生が終わったらフラグをリセット
                audio.onended = () => {
                    isPlaying = false;
                };
                // 音声の再生でエラーが起きた場合もフラグをリセット
                audio.onerror = () => {
                    isPlaying = false;
                    console.error(`音声ファイル assets/sounds/hiragana/${hiraganaChar}.mp3 が見つかりません。`);
                };
            });
            groupContainer.appendChild(button);
        });

        katakanaContainer.appendChild(groupContainer);
    });
});