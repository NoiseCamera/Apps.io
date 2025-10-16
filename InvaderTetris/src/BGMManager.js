/**
 * BGMの再生、プレイリスト、UI、ビジュアライザーを管理するシングルトンクラス。
 * アプリケーション全体で単一のインスタンスを共有し、シーンをまたいでBGMの状態を維持します。
 */
class BGMManager {
    /**
     * BGMManagerの唯一のインスタンスを返します。
     * @returns {BGMManager}
     */
    static getInstance() {
        if (!BGMManager.instance) {
            BGMManager.instance = new BGMManager();
        }
        return BGMManager.instance;
    }

    constructor() {
        if (BGMManager.instance) {
            throw new Error("BGMManager is a singleton. Use getInstance() to get the instance.");
        }

        // --- DOM Elements ---
        this.bgmPlayer = document.getElementById('bgm-player');
        this.visualizerCanvas = document.getElementById('visualizer-canvas');
        this.visualizerCtx = this.visualizerCanvas.getContext('2d');

        // --- Audio Properties ---
        this.audioContext = null;
        this.analyser = null;
        this.sourceNode = null;
        this.frequencyData = null;

        // --- Playlist Properties ---
        this.playlist = [
            'assets/bgm/track1.mp3', 'assets/bgm/track2.mp3', 'assets/bgm/track3.mp3',
            'assets/bgm/track4.mp3', 'assets/bgm/track5.mp3', 'assets/bgm/track6.mp3',
            'assets/bgm/track7.mp3', 'assets/bgm/track8.mp3',
        ];
        this.currentTrackIndex = -1;

        // --- State ---
        this.isInitialized = false;
        this.isPlaying = false;
    }

    /**
     * BGMシステムを初期化します。AudioContextの作成とUIイベントリスナーの設定を一度だけ行います。
     */
    initialize() {
        if (this.isInitialized) return;

        try {
            // --- Canvas Size Setup ---
            this.resizeCanvas(); // 初期サイズを設定

            // --- AudioContext and Analyser Setup ---
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

            // --- Audio Source and Connections ---
            this.sourceNode = this.audioContext.createMediaElementSource(this.bgmPlayer);
            this.sourceNode.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            // --- UI Event Listeners ---
            this.setupControls();

            this.isInitialized = true;
            console.log("BGMManager initialized successfully.");

        } catch (e) {
            console.error("BGMManager initialization failed:", e);
            this.isInitialized = false;
        }
    }

    /**
     * UIコントロールのイベントリスナーを設定します。この処理は一度だけ実行されます。
     */
    setupControls() {
        // --- イベントリスナーの再設定処理 ---
        // 既存のリスナーを確実に削除し、新しいリスナーを1つだけ設定するヘルパー関数
        const rebind = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                // cloneNodeを使って、すべてのイベントリスナーを一度に、かつ確実に削除する
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
                // 新しくなった要素にリスナーを設定する
                newElement.addEventListener(event, handler);
            }
        };

        // ヘルパー関数を使って各UIコントロールのイベントを再設定
        rebind('prev-track-button', 'click', () => this.playPrev());
        rebind('next-track-button', 'click', () => this.playNext());
        rebind('bgm-volume', 'input', (event) => { this.bgmPlayer.volume = event.target.value; });
        rebind('play-pause-button', 'click', () => this.togglePlayPause());
        rebind('progress-bar', 'input', (event) => { this.handleProgressBarInput(event); });

        // ウィンドウリサイズ時にキャンバスの解像度を更新する
        window.addEventListener('resize', () => this.resizeCanvas());

        // 曲の再生が終了したら、自動的に次の曲を再生する
        this.bgmPlayer.addEventListener('ended', () => this.playNext());

        // 再生時間の更新イベント
        this.bgmPlayer.addEventListener('timeupdate', () => this.updateProgress());

        // 初期音量を設定
        this.bgmPlayer.volume = document.getElementById('bgm-volume').value;
    }

    handleProgressBarInput(event) {
        if (this.bgmPlayer.duration) {
            // isPlayingフラグをチェックし、再生中のみcurrentTimeを変更する
            this.bgmPlayer.currentTime = this.bgmPlayer.duration * (event.target.value / 100);
        }
    }

    /**
     * BGMの再生を開始または再開します。
     */
    start() {
        this.initialize(); // 未初期化の場合は初期化
        if (!this.isInitialized) return;

        // AudioContextがユーザー操作なしに開始できない場合があるため、ここで再開を試みる
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        if (!this.isPlaying) {
            this.playNext();
        }
    }

    /**
     * BGMの状態をリセットします。タイトル画面に戻る際に使用します。
     */
    reset() {
        if (!this.isInitialized) return;

        this.bgmPlayer.pause();
        this.bgmPlayer.currentTime = 0;
        this.isPlaying = false;
        this.currentTrackIndex = -1; // 次に再生する曲がリストの最初になるように
        document.getElementById('play-pause-button').innerText = 'PLAY';
    }

    playNext() {
        if (this.playlist.length === 0) return;
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.playCurrent();
    }

    playPrev() {
        if (this.playlist.length === 0) return;
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        this.playCurrent();
    }

    playCurrent() {
        const trackPath = this.playlist[this.currentTrackIndex];
        this.bgmPlayer.src = trackPath;
        this.bgmPlayer.play()
            .then(() => {
                this.isPlaying = true;
                document.getElementById('play-pause-button').innerText = 'PAUSE';
                this.updateTrackInfo(trackPath);
            })
            .catch(e => {
                console.error("BGM playback failed:", e);
                this.isPlaying = false;
                document.getElementById('play-pause-button').innerText = 'PLAY';
            });
    }

    togglePlayPause() {
        if (!this.isInitialized || !this.bgmPlayer.src) return;

        if (this.isPlaying) {
            this.bgmPlayer.pause();
            this.isPlaying = false;
            document.getElementById('play-pause-button').innerText = 'PLAY';
        } else {
            this.bgmPlayer.play().then(() => {
                this.isPlaying = true;
                document.getElementById('play-pause-button').innerText = 'PAUSE';
            });
        }
    }

    updateProgress() {
        if (!this.bgmPlayer.duration) return;

        // プログレスバーの更新
        const progress = (this.bgmPlayer.currentTime / this.bgmPlayer.duration) * 100;
        document.getElementById('progress-bar').value = progress;

        // 時間表示の更新
        document.getElementById('current-time').innerText = this.formatTime(this.bgmPlayer.currentTime);
        document.getElementById('total-duration').innerText = this.formatTime(this.bgmPlayer.duration);
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    }

    /**
     * UIに表示されるトラック名を更新します。
     * @param {string} trackPath - 現在のトラックのパス
     */
    updateTrackInfo(trackPath) {
        const trackInfoText = document.getElementById('track-info-text');
        if (trackInfoText) {
            trackInfoText.innerText = trackPath.split('/').pop().replace(/\.mp3$/, '');
        }
    }

    /**
     * 現在のBGMの周波数データを返します。
     * @returns {Uint8Array|null}
     */
    getFrequencyData() {
        return this.isInitialized && this.isPlaying ? this.frequencyData : null;
    }

    /**
     * ビジュアライザーのキャンバスサイズを現在のウィンドウサイズに合わせます。
     */
    resizeCanvas() {
        this.visualizerCanvas.width = window.innerWidth;
        this.visualizerCanvas.height = window.innerHeight;
    }

    /**
     * ビジュアライザーを描画します。GameSceneのupdateループから呼び出されることを想定しています。
     */
    drawVisualizer() {
        if (!this.isInitialized || !this.isPlaying) {
            // 再生中でない場合はキャンバスをクリア
            this.visualizerCtx.clearRect(0, 0, this.visualizerCanvas.width, this.visualizerCanvas.height);
            return;
        }

        this.analyser.getByteFrequencyData(this.frequencyData);

        const ctx = this.visualizerCtx;
        const canvas = this.visualizerCanvas;

        // 背景をクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // --- パルス状のコアエフェクト ---
        const coreX = canvas.width / 2;
        const coreY = canvas.height * 0.6; // 地平線
        const coreBass = this.frequencyData.slice(1, 4).reduce((a, b) => a + b, 0) / 3;
        const corePulse = (coreBass / 255) * 2; // パルスの感度を少し下げる (2 -> 1.5)

        for (let i = 3; i > 0; i--) {
            const radius = (40 + i * 50) * corePulse; // パルスの基本サイズを小さくする (50 -> 40)
            if (radius < 5) continue;
            const alpha = (0.1 - i * 0.02) * corePulse;
            ctx.beginPath();
            ctx.arc(coreX, coreY, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(240, 56, 255, ${alpha})`; // マゼンタ色
            ctx.fill();
        }

        // --- バーの描画 ---
        const barCount = this.frequencyData.length * 0.8;
        const barWidth = canvas.width / barCount;
        const horizon = canvas.height * 0.6;

        for (let i = 0; i < barCount; i++) {
            const barHeight = this.frequencyData[i] * 1.5; // バーの高さを少し下げる (1.5 -> 1.2)
            if (barHeight < 2) continue;

            const x = i * barWidth;
            const y = horizon - barHeight;

            // 色相を計算 (シアン -> ブルー -> パープル)
            const hue = 180 + (i / barCount) * 120;

            // メインのバー
            const mainGradient = ctx.createLinearGradient(x, y, x, horizon);
            mainGradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.6)`);
            mainGradient.addColorStop(1, `hsla(${hue}, 70%, 40%, 0.8)`);
            ctx.fillStyle = mainGradient;
            ctx.fillRect(x, y, barWidth, barHeight);

            // 反射
            const reflectionGradient = ctx.createLinearGradient(x, horizon, x, horizon + barHeight);
            reflectionGradient.addColorStop(0, `hsla(${hue}, 70%, 40%, 0.3)`);
            reflectionGradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);
            ctx.fillStyle = reflectionGradient;
            ctx.fillRect(x, horizon, barWidth, barHeight);
        }
    }
}

export default BGMManager;