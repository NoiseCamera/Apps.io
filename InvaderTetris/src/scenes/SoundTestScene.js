import SEManager from '../SEManager.js';
import BGMManager from '../BGMManager.js';

class SoundTestScene extends Phaser.Scene {
    constructor() {
        super('SoundTestScene');
        this.seManager = SEManager.getInstance();
        this.bgmManager = BGMManager.getInstance();

        // SEのキーとファイル名をマッピング
        this.seMap = {
            'shot': 'shot.mp3',
            'enemy_explosion_se': 'Explosion.mp3',
            'hard_drop_se': 'hard_drop.mp3',
            'land_se': 'land.mp3',
            'hp_recovery_se': 'hp.mp3',
            'tame_se': 'tame.mp3',
            'kaihou_se': 'kaihou.mp3',
            'boss_gekiha_se': 'bossgekiha.mp3',
            'hidan_se': 'hidan.mp3',
            'kaiten_se': 'kaiten.mp3'
        };

        // 再生ボタンの表示順を定義
        this.seKeys = Object.keys(this.seMap);
    }

    preload() {
        // SEをこのシーンでも使えるように読み込む
        Object.entries(this.seMap).forEach(([key, filename]) => {
            this.load.audio(key, `assets/se/${filename}`);
        });
    }

    create() {
        // SEマネージャーをこのシーンで初期化
        this.seManager.initialize(this);

        // HTML UIの表示を制御
        const gameUi = document.getElementById('game-ui');
        gameUi.classList.remove('hidden');
        // タイトル選択画面を非表示にする
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) titleScreen.classList.add('hidden');

        // 不要なUIを非表示にする
        const tetrisTitle = document.getElementById('tetris-title');
        const invaderTitle = document.getElementById('invader-title');
        const tetrisControls = document.getElementById('tetris-controls');
        const invaderControls = document.getElementById('invader-controls');
        const bgmControls = document.getElementById('bgm-controls');
        const pauseButton = document.getElementById('pause-button');

        if (tetrisTitle) tetrisTitle.style.display = 'none';
        if (invaderTitle) invaderTitle.style.display = 'none';
        if (tetrisControls) tetrisControls.style.display = 'none';
        if (invaderControls) invaderControls.style.display = 'none';
        if (bgmControls) bgmControls.style.display = 'none';
        if (pauseButton) pauseButton.style.display = 'none';


        // --- UIの作成 ---
        const startX = 100;
        const startY = 100;
        const yGap = 40;

        this.add.text(startX, startY - 50, 'SE Test', { fontSize: '32px', fill: '#00ff9f' });

        // SE再生ボタンを作成
        this.seKeys.forEach((key, index) => {
            const button = this.add.text(startX, startY + index * yGap, `Play: ${key}`, {
                fontSize: '20px',
                fill: '#f038ff',
                backgroundColor: '#0d0221',
                padding: { x: 10, y: 5 }
            })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.seManager.play(key);
                // ボタンを点滅させてフィードバック
                button.setFill('#ffffff');
                this.time.delayedCall(150, () => button.setFill('#f038ff'));
            });
        });

        // タイトルに戻るボタン
        this.add.text(this.sys.game.config.width - 200, this.sys.game.config.height - 50, 'Back to Title', {
            fontSize: '24px',
            fill: '#00ff9f'
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            // BGMの状態をリセット
            this.bgmManager.reset();
            this.scene.start('TitleScene');
        });

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
        // シーン終了時にUIを非表示にする
        const gameUi = document.getElementById('game-ui');
        gameUi.classList.add('hidden');

        // タイトル選択画面を再表示する
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) titleScreen.classList.remove('hidden');
        
        // 非表示にしたUIを元に戻す
        const tetrisTitle = document.getElementById('tetris-title');
        const invaderTitle = document.getElementById('invader-title');
        const tetrisControls = document.getElementById('tetris-controls');
        const invaderControls = document.getElementById('invader-controls');
        const bgmControls = document.getElementById('bgm-controls');
        const pauseButton = document.getElementById('pause-button');

        if (tetrisTitle) tetrisTitle.style.display = 'block';
        if (invaderTitle) invaderTitle.style.display = 'block';
        if (tetrisControls) tetrisControls.style.display = 'block';
        if (invaderControls) invaderControls.style.display = 'block';
        if (bgmControls) bgmControls.style.display = ''; // style属性を削除してデフォルト(grid)に戻す
        if (pauseButton) pauseButton.style.display = '';

    }
}

export default SoundTestScene;