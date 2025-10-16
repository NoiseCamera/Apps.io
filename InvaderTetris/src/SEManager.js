/**
 * 効果音（SE）の再生と音量管理を行うシングルトンクラス。
 */
class SEManager {
    /**
     * SEManagerの唯一のインスタンスを返します。
     * @returns {SEManager}
     */
    static getInstance() {
        if (!SEManager.instance) {
            SEManager.instance = new SEManager();
        }
        return SEManager.instance;
    }

    constructor() {
        if (SEManager.instance) {
            throw new Error("SEManager is a singleton. Use getInstance() to get the instance.");
        }

        this.scene = null;
        this.volume = 1.0;
        this.isInitialized = false;
        this.volumeChangeHandler = null; // イベントリスナーを保持するプロパティ
    }

    /**
     * SEManagerを初期化します。UIイベントリスナーの設定を一度だけ行います。
     * @param {Phaser.Scene} scene - 呼び出し元のシーン
     */
    initialize(scene) {
        this.scene = scene;

        const seVolumeSlider = document.getElementById('se-volume');
        if (seVolumeSlider) {
            // cloneNodeを使って、すべてのイベントリスナーを一度に、かつ確実に削除する
            const newSlider = seVolumeSlider.cloneNode(true);
            seVolumeSlider.parentNode.replaceChild(newSlider, seVolumeSlider);

            // 新しくなったスライダーにリスナーを設定する
            newSlider.addEventListener('input', (event) => {
                this.volume = event.target.value;
            });
            // 現在のスライダーの値で音量を初期化
            this.volume = newSlider.value;
        }

        this.isInitialized = true;
        console.log("SEManager initialized successfully.");
    }

    /**
     * 指定されたキーの効果音を再生します。
     * @param {string} key - 再生するSEのアセットキー
     * @param {object} [config={}] - 追加設定 (例: { volumeMultiplier: 0.5 })
     */
    play(key, config = {}) {
        if (!this.isInitialized || !this.scene) {
            console.warn("SEManager is not initialized or scene is not set.");
            return;
        }
        const volumeMultiplier = config.volumeMultiplier || 1.0;
        // PhaserのSoundManagerを使ってSEを再生
        this.scene.sound.play(key, { volume: this.volume * volumeMultiplier });
    }
}

export default SEManager;