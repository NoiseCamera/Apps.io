import BGMManager from '../BGMManager.js';

class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
        this.bgmManager = BGMManager.getInstance();
    }

    create() {
        // タイトルシーンの背景を黒（テーマカラーの最も暗い色）に設定
        this.cameras.main.setBackgroundColor('#05010d');

        // --- UIの状態を完全に初期化 ---
        const titleScreen = document.getElementById('title-screen');
        const gameUi = document.getElementById('game-ui');

        // 1. タイトル画面を表示し、ゲームUIを非表示にする
        titleScreen.classList.remove('hidden');
        gameUi.classList.add('hidden');

        // 2. ゲームUI内の各要素のインラインスタイルをリセットする
        //    (他のシーンで display: 'none' などが設定されている可能性があるため)
        const elementsToReset = [
            'tetris-title', 'invader-title',
            'tetris-controls', 'invader-controls', 'se-volume',
            'bgm-controls'
        ];
        elementsToReset.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = ''; // インラインのdisplayスタイルを削除
        });

        // 3. BGMコントロールパネルの特別なクラスを削除する
        //    (BGM鑑賞モードで追加された 'jukebox-mode' をリセット)
        const bgmControls = document.getElementById('bgm-controls');
        if (bgmControls) {
            bgmControls.classList.remove('jukebox-mode');
        }
        // BGMマネージャーを初期化し、再生を開始
        this.bgmManager.start();

        // 背景にビジュアライザーを描画するためのダミーループ
        this.time.addEvent({
            delay: 16, // 約60fps
            callback: this.update,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        // BGMマネージャーに周波数データを更新させ、ビジュアライザーを描画させる
        this.bgmManager.drawVisualizer();
    }

    shutdown() {
        // シーンが終了するときにHTMLのUIを非表示にする
        const titleScreen = document.getElementById('title-screen');
        // 次のシーンで背景のビジュアライザーが見えるように、背景色を透明に戻す
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

        titleScreen.classList.add('hidden');
    }
}

export default TitleScene;