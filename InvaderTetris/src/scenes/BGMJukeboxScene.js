import BGMManager from '../BGMManager.js';

class BGMJukeboxScene extends Phaser.Scene {
    constructor() {
        super('BGMJukeboxScene');
        this.bgmManager = BGMManager.getInstance();
    }

    create() {
        // --- HTML UIの制御 ---
        // ゲームUIコンテナを表示
        const gameUi = document.getElementById('game-ui');
        if (gameUi) gameUi.classList.remove('hidden');

        // タイトル選択画面は非表示
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) titleScreen.classList.add('hidden');

        // BGMコントローラー以外のゲームUIを非表示にする
        const tetrisTitle = document.getElementById('tetris-title');
        const invaderTitle = document.getElementById('invader-title');
        const tetrisControls = document.getElementById('tetris-controls');
        const invaderControls = document.getElementById('invader-controls');
        const seVolumeLabel = document.querySelector('label[for="se-volume"]');
        const seVolumeSlider = document.getElementById('se-volume');
        const pauseButton = document.getElementById('pause-button');
        if (tetrisTitle) tetrisTitle.style.display = 'none';
        if (invaderTitle) invaderTitle.style.display = 'none';
        if (tetrisControls) tetrisControls.style.display = 'none';
        if (invaderControls) invaderControls.style.display = 'none';
        if (seVolumeLabel) seVolumeLabel.style.display = 'none';
        if (seVolumeSlider) seVolumeSlider.style.display = 'none';
        if (pauseButton) pauseButton.style.display = 'none';

        // BGMコントローラーに中央配置用のスタイルを適用
        const bgmControls = document.getElementById('bgm-controls');
        if (bgmControls) {
            bgmControls.style.display = 'grid'; // 表示を確実に有効にする
            bgmControls.classList.add('jukebox-mode');
        }

        // --- Phaser UIの作成 ---
        // タイトルに戻るボタン
        this.add.text(this.sys.game.config.width - 150, this.sys.game.config.height - 50, 'Back to Title', {
            fontSize: '24px',
            fill: '#00ff9f',
            backgroundColor: 'rgba(13, 2, 33, 0.7)',
            padding: { x: 10, y: 5 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            // BGMの状態をリセット
            this.bgmManager.reset();
            this.scene.start('TitleScene');
        });

        // 背景にビジュアライザーを描画するためのループ
        this.time.addEvent({
            delay: 16, // 約60fps
            callback: this.update,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        // BGMマネージャーにビジュアライザーを描画させる
        this.bgmManager.drawVisualizer();
    }

    shutdown() {
        // タイトル画面に戻るため、ゲームUI全体を非表示にする
        const gameUi = document.getElementById('game-ui');
        if (gameUi) gameUi.classList.add('hidden');

        // タイトル選択画面を再表示
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) titleScreen.classList.remove('hidden');

        // BGMコントローラーのスタイルを元に戻す
        const bgmControls = document.getElementById('bgm-controls');
        if (bgmControls) {
            bgmControls.classList.remove('jukebox-mode');
            bgmControls.style.display = ''; // style属性を削除してデフォルト(grid)に戻す
        }

        // 非表示にしたUIを元に戻す
        document.getElementById('tetris-title').style.display = 'block';
        document.getElementById('invader-title').style.display = 'block';
        document.getElementById('tetris-controls').style.display = 'block';
        document.getElementById('invader-controls').style.display = 'block';
        const seVolumeLabel = document.querySelector('label[for="se-volume"]');
        const seVolumeSlider = document.getElementById('se-volume');
        if (seVolumeLabel) seVolumeLabel.style.display = '';
        if (seVolumeSlider) seVolumeSlider.style.display = '';
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) pauseButton.style.display = '';
    }
}

export default BGMJukeboxScene;
