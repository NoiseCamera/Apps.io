import GameScene from './scenes/GameScene.js';
import TitleScene from './scenes/TitleScene.js';
import SoundTestScene from './scenes/SoundTestScene.js';
import BGMJukeboxScene from './scenes/BGMJukeboxScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 650,
    transparent: true, // ゲームキャンバスの背景を透明にする
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            // gravity: { y: 0 },
            // debug: true // デバッグ表示が必要な場合はtrueにする
        }
    },
    scene: [TitleScene, GameScene, SoundTestScene, BGMJukeboxScene]
};

const game = new Phaser.Game(config);

// --- UIイベントリスナー ---
document.addEventListener('DOMContentLoaded', () => {
    const tetrisButton = document.getElementById('tetris-button');
    const invaderButton = document.getElementById('invader-button');
    const spectatorButton = document.getElementById('spectator-button');
    const pvpButton = document.getElementById('pvp-button');
    const seTestButton = document.getElementById('se-test-button');
    const bgmJukeboxButton = document.getElementById('bgm-jukebox-button');
    const howToPlayButton = document.getElementById('how-to-play-button');
    const howToPlayScreen = document.getElementById('how-to-play-screen');
    const howToPlayBackButton = document.getElementById('how-to-play-back-button');

    tetrisButton.addEventListener('click', () => {
        // TitleSceneからGameSceneへ遷移
        const titleScene = game.scene.getScene('TitleScene');
        if (titleScene) {
            titleScene.scene.start('GameScene', { playerSide: 'TETRIS' });
        }
    });

    invaderButton.addEventListener('click', () => {
        const titleScene = game.scene.getScene('TitleScene');
        if (titleScene) {
            titleScene.scene.start('GameScene', { playerSide: 'INVADER' });
        }
    });

    spectatorButton.addEventListener('click', () => {
        const titleScene = game.scene.getScene('TitleScene');
        if (titleScene) {
            // 'SPECTATOR'という特別なplayerSideを渡す
            titleScene.scene.start('GameScene', { playerSide: 'SPECTATOR' });
        }
    });

    pvpButton.addEventListener('click', () => {
        const titleScene = game.scene.getScene('TitleScene');
        if (titleScene) {
            titleScene.scene.start('GameScene', { playerSide: 'PVP' });
        }
    });

    seTestButton.addEventListener('click', () => {
        const titleScene = game.scene.getScene('TitleScene');
        if (titleScene) {
            titleScene.scene.start('SoundTestScene');
        }
    });

    bgmJukeboxButton.addEventListener('click', () => {
        const titleScene = game.scene.getScene('TitleScene');
        if (titleScene) {
            titleScene.scene.start('BGMJukeboxScene');
        }
    });

    howToPlayButton.addEventListener('click', () => {
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) titleScreen.classList.add('hidden');
        if (howToPlayScreen) howToPlayScreen.classList.remove('hidden');
    });

    howToPlayBackButton.addEventListener('click', () => {
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) titleScreen.classList.remove('hidden'); // hiddenクラスを削除して再表示
        if (howToPlayScreen) howToPlayScreen.classList.add('hidden');
    });
});