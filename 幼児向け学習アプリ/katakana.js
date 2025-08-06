document.addEventListener('DOMContentLoaded', () => {
    const katakanaContainer = document.getElementById('katakana-container');
    let bgmInitialized = false; // BGMの初期化が完了したか
    let isPlaying = false; // 音声が再生中かどうかのフラグ

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

    // プリロードする音声ファイルのリストを生成 (音声ファイルはひらがな名)
    const SOUND_EFFECTS = katakanaGroups.flat()
        .filter(char => char !== '　')
        .map(char => `assets/sounds/hiragana/${katakanaToHiragana(char)}.mp3`);

    /**
     * ユーザーの最初の操作でBGMを再生し、効果音をプリロードする関数
     */
    function initializeBgm() {
        if (bgmInitialized) return;
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.play().catch(error => console.log('BGMの再生にはユーザーの操作が必要です。', error));
        }
        if (typeof preloadAudioSources === 'function') {
            preloadAudioSources(SOUND_EFFECTS);
        }
        bgmInitialized = true;
    }

    // 各グループのボタンを生成して追加
    katakanaGroups.forEach(group => {
        const groupContainer = document.createElement('div');
        groupContainer.classList.add('katakana-group'); // グループ用のクラスを追加

        group.forEach(char => {
            const button = document.createElement('button');
            button.textContent = char;
            button.addEventListener('click', async () => {
                if (isPlaying || char === '　') return;

                isPlaying = true;
                const hiraganaChar = katakanaToHiragana(char);
                await playSE(`assets/sounds/hiragana/${hiraganaChar}.mp3`);
                isPlaying = false;
            });
            groupContainer.appendChild(button);
        });

        katakanaContainer.appendChild(groupContainer);
    });

    document.body.addEventListener('click', initializeBgm, { once: true });
    document.body.addEventListener('touchstart', initializeBgm, { once: true });
});