import TetrisAI from '../ai/TetrisAI.js';
import InvaderAI from '../ai/InvaderAI.js';
import SEManager from '../SEManager.js';
import BGMManager from '../BGMManager.js';
import EffectManager from '../EffectManager.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');

        // =================================================================
        // ゲーム設定
        // =================================================================
        const cyberTheme = {
            BACKGROUND: 0x0d0221, // 深い藍色
            GRID: 0x261447,       // グリッドの色
            ACCENT1: 0x00ff9f,    // ネオングリーン
            ACCENT2: 0xf038ff,    // マゼンタ
            TEXT: '#00ff9f',      // テキストの色
            GARBAGE: 0x808080,    // おじゃまブロックの色（灰色に変更）
            ENEMY_COLORS: [0x00ff9f, 0xf038ff, 0x00ffff, 0xffff00], // 敵の色のバリエーション
        };
        this.CONFIG = {
            // --- フィールドサイズ ---
            TETRIS: {
                COLS: 10,
                ROWS: 20,
                BLOCK_SIZE: 27, // ブロックのサイズ
                FIELD_X: 50,
                FIELD_Y: 50,
                DROP_INTERVAL: 1000,    // テトリミノの自然落下間隔(ms)
                GARBAGE_COLOR: cyberTheme.GARBAGE,
                AI_THINK_DELAY: 500,    // AIが思考を開始するまでの時間(ms)
            },
            INVADER: {
                FIELD_X_OFFSET: 50,     // 中央線からのオフセット
                FIELD_Y: 50,
                FIELD_WIDTH: 400,
                FIELD_HEIGHT: 540,
                PLAYER_SPEED: 300,      // プレイヤーの移動速度
                PLAYER_FIRE_DELAY: 500, // プレイヤーの弾の発射間隔(ms)
                ENEMY_MOVE_INTERVAL: 1000, // 敵の移動間隔(ms)
                ENEMY_MOVE_SPEED: 10,   // 敵の水平移動距離(px)
                ENEMY_MOVE_DOWN_STEP: 20, // 敵の下降距離(px)
                ENEMY_ADD_ROW_HEIGHT: 30, // おじゃま攻撃で追加される敵の行の高さ
                PLAYER_HIT_DURATION: 100, // 被弾時の点滅間隔(ms)
                PLAYER_HIT_REPEAT: 4,   // 被弾時の点滅回数,
                ITEM_DROP_CHANCE: 0.03,  // 敵がアイテムを落とす確率 (3%)
                HP_RECOVERY_AMOUNT: 3,  // HP回復アイテム1つあたりの回復量
            },
            // --- 攻撃ルール ---
            ATTACK: {
                TETRIS_LINES_PER_ATTACK: 3, // このライン数を消す毎にインベーダー側へ攻撃
                INVADER_ROW_CLEAR_GARBAGE: 1, // インベーダーの横1列消去で送るおじゃま行数
                INVADER_WAVE_CLEAR_GARBAGE: 2, // インベーダー全滅で送るおじゃま行数
                DANMAKU_BULLET_COUNT: 5,      // テトリス1ライン消しで発動する弾幕の弾数
                DANMAKU_ANGLE: 90,            // 弾幕の広がる角度
                DANMAKU_BULLET_SPEED: 200,    // 弾幕の弾の速度
                DANMAKU_ATTACK_COUNT_SINGLE: 3, // 1ライン消し時の弾幕攻撃の回数
                DANMAKU_ATTACK_DELAY: 300,    // 連続弾幕攻撃の間隔(ms)
                SPIRAL_BULLET_SPEED: 150,     // スパイラル弾の速度
                AIMED_BULLET_SPEED: 400,      // 狙撃弾の速度
                CROSS_BULLET_COUNT: 5,        // 交差弾の片側の弾数
                CROSS_BULLET_SPEED: 250,      // 交差弾の速度
                CROSS_ANGLE_OFFSET: 20,       // 交差弾の基準角度からのオフセット
                BULLET_COLORS: {
                    FAN: 0xffff00,      // 扇状弾の色 (黄色)
                    SPIRAL: 0x00ffff,   // スパイラル弾の色 (水色)
                    AIMED: 0xff0000,    // 狙撃弾の色 (赤色)
                    CROSS: 0xffa500,    // 交差弾の色 (オレンジ)
                }
            },
            // --- ボス設定 ---
            BOSS: {
                MAX_HP: 30,
                SPAWN_COOLDOWN: 60000, //60秒
                PHASE_2_HP_THRESHOLD: 2 / 3, // HPがこの割合以下でフェーズ2へ
                PHASE_3_HP_THRESHOLD: 1 / 3, // HPがこの割合以下でフェーズ3へ
                PHASE1: {
                    ATTACK_DELAY: 2000,
                    BULLET_SPEED: 330,
                    WAVE_COUNT: 5,
                    BULLETS_PER_WAVE: 40,
                    WAVE_DELAY: 90,
                    AIMED_SPEED_MULTIPLIER: 1.4,
                    AIMED_ANGLE_TOLERANCE: 0.2,
                    TINT: 0xf038ff, // ACCENT2と同じマゼンタ
                },
                PHASE2: {
                    ATTACK_DELAY: 1800,
                    BULLET_SPEED: 400,
                    STREAMS: 8,
                    BULLETS_PER_STREAM: 14,
                    STREAM_DELAY: 35,
                    ROTATION_SPEED: 0.2,
                    TINT: 0xff8c00, // オレンジ
                },
                PHASE3: {
                    ATTACK_DELAY: 1800,
                    WALL_SPEED: 150, WALL_STREAMS: 4, WALL_BULLETS: 40, WALL_DELAY: 20, WALL_ROTATION: 0.05, WALL_TINT: 0xdc143c, // 真紅
                    SPEAR_SPEED: 600, SPEAR_COUNT: 8, SPEAR_DELAY: 100,
                    V_LASER_SPEED: 400, V_LASER_COUNT: 15, V_LASER_ANGLE: 25, V_LASER_DELAY: 500, V_LASER_TINT: 0xffffff,
                }
            },
        };
        this.THEME = cyberTheme;
        // =================================================================

        // =================================================================
        // プレイヤーサイド
        // =================================================================
        this.playerSide = 'TETRIS'; // or 'INVADER'
        this.INVADER_FIELD_X = 0; // createで動的に計算

        // =================================================================
        // ゲーム状態の管理変数
        // =================================================================
        // --- テトリス ---
        this.tetrisGrid = []; // この中身はinitで初期化
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.pieceX = 0;
        this.pieceY = 0;
        this.dropTimer = 0;
        this.dropInterval = 1000;
        this.tetrisAI = null;
        this.isTetrisPlayer = true;
        this.canHold = true;
        this.tetrisLinesCleared = 0;
        this.tetrisLightPillarGraphics = null; // テトリス用ライトピラーのGraphicsオブジェクト
        this.lastTopBlockInfo = { x: -1, y: -1, color: null }; // 一番上のブロック情報を保持
        this.linesText = null;

        // --- インベーダー ---
        this.centerDot = null; // プレイヤーの中心点を表示するオブジェクト
        this.invaderPlayer = null;
        // インベーダーフィールドの描画オブジェクトを保持
        this.invaderFieldGraphics = null; 
        this.invaderGridGraphics = null;
        this.invaderBorderGraphics = null;
        this.invaderBullets = null;
        this.invaders = null;
        this.invaderPlayerHP = 0;
        this.invaderPlayerMaxHP = 10; // プレイヤーの最大HP
        this.invaderPlayerHPBar = null;
        this.hpItems = null; // HP回復アイテム用のグループ
        this.invaderPlayerHPLabel = null; // HPラベル用のテキストオブジェクト
        this.slowMotionGauge = 100; // スローモーションゲージ
        this.slowMotionMaxGauge = 100;
        this.slowMotionGaugeBar = null;
        this.slowMotionGaugeLabel = null;
        this.isSlowMotionActive = false;
        this.invaderKeys = null;
        this.lastFired = 0;
        this.invaderAI = null;
        this.isInvaderPlayer = false;
        this.invaderMoveTimer = 0;
        this.invaderMoveInterval = this.CONFIG.INVADER.ENEMY_MOVE_INTERVAL;
        this.invaderMoveDir = 1;
        this.invaderMoveSpeed = this.CONFIG.INVADER.ENEMY_MOVE_SPEED;
        this.enemyBullets = null; // 敵の弾を管理するグループ
        this.invaderRowsClearedForAttack = 0; // インベーダー攻撃用の行クリアカウンター
        this.danmakuTimers = []; // テトリスライン消しによる弾幕タイマー

        // --- ゲーム全体 ---
        this.isGameOver = false;
        this.isPaused = false;
        this.isBossBattle = false; // ボス戦中かどうかのフラグ
        this.isBossSpawnOnCooldown = false; // ボス出現のクールダウン中か
        this.spiralAngle = 0; // スパイラル弾用の角度

        // --- ボス関連 ---
        this.boss = null;
        this.bossHP = 0;
        this.bossMaxHP = this.CONFIG.BOSS.MAX_HP; // ボスの最大体力
        this.bossHPBar = null;
        this.bossAttackTimer = null;
        this.bossCooldownTimer = null; // ボスのクールダウンタイマーイベント
        this.bossAttackTimers = []; // ボスの時間差攻撃タイマーを管理する配列
        this.isBossTransitioning = false; // ボスが形態変化中かどうかのフラグ
        this.bossPhase = 1; // ボスのフェーズ (1 or 2)

        // BGMマネージャーのインスタンスを取得
        this.bgmManager = BGMManager.getInstance();
        this.frequencyData = null; // BGMの周波数データ

        // SEマネージャーのインスタンスを取得
        this.seManager = SEManager.getInstance();

        // エフェクトマネージャーのインスタンスを作成
        this.effects = null;
    }
    init(data) {
        this.playerSide = data.playerSide || 'TETRIS';

        if (this.playerSide === 'SPECTATOR') {
            // 観戦モード: 両方のAIを有効化
            this.isTetrisPlayer = false;
            this.isInvaderPlayer = false;
        } else if (this.playerSide === 'PVP') {
            // PVPモード: 両方のプレイヤー操作を有効化
            this.isTetrisPlayer = true;
            this.isInvaderPlayer = true;
        } else {
            // プレイヤー操作モード
            this.isTetrisPlayer = (this.playerSide === 'TETRIS');
            this.isInvaderPlayer = (this.playerSide === 'INVADER');
        }

        // シーンが再起動されるたびに変数をリセット
        this.dropTimer = 0;
        this.tetrisGrid = Array.from({ length: this.CONFIG.TETRIS.ROWS }, () => Array(this.CONFIG.TETRIS.COLS).fill(0));
        this.lastFired = 0;
        this.invaderMoveDir = 1;
        this.holdPiece = null;
        this.canHold = true;
        this.tetrisLinesCleared = 0;
        this.lastTopBlockInfo = { x: -1, y: -1, color: null };

        this.isGameOver = false;
        this.spiralAngle = 0;
        this.isBossBattle = false;
        this.isBossSpawnOnCooldown = false; // フラグをリセット
        if (this.bossAttackTimer) this.bossAttackTimer.destroy();
        if (this.bossCooldownTimer) this.bossCooldownTimer.destroy();
        if (this.bossCooldownText) this.bossCooldownText.destroy(); // テキストオブジェクトも破棄
        this.bossCooldownTimer = null;
        this.bossAttackTimers.forEach(timer => timer.destroy()); // 攻撃タイマーをすべて破棄
        this.bossAttackTimers = []; // 配列をリセット
        this.bossPhase = 1;
        this.isBossTransitioning = false; // フラグをリセット
        this.danmakuTimers.forEach(timer => timer.destroy()); // 弾幕タイマーも破棄
        this.danmakuTimers = [];
        this.bossAttackTimer = null;
        this.boss = null;
        this.invaderPlayerHP = this.invaderPlayerMaxHP;
        this.invaderRowsClearedForAttack = 0;
        this.slowMotionGauge = this.slowMotionMaxGauge;
        this.isSlowMotionActive = false;
        this.invaderMoveInterval = this.CONFIG.INVADER.ENEMY_MOVE_INTERVAL; // インベーダーの速度をリセット
        this.isPaused = false;
        this.pauseButtonClickHandler = null; // ポーズボタンのイベントリスナーを保持

    }

    getTETROMINOS() {
        return {
            'I': { key: 'I', shape: [[1, 1, 1, 1]], color: 0x00ffff },
            'J': { key: 'J', shape: [[1, 0, 0], [1, 1, 1]], color: 0x0000ff },
            'L': { key: 'L', shape: [[0, 0, 1], [1, 1, 1]], color: 0xffa500 },
            'O': { key: 'O', shape: [[1, 1], [1, 1]], color: 0xffff00 },
            'S': { key: 'S', shape: [[0, 1, 1], [1, 1, 0]], color: 0x00ff00 },
            'T': { key: 'T', shape: [[0, 1, 0], [1, 1, 1]], color: 0x800080 },
            'Z': { key: 'Z', shape: [[1, 1, 0], [0, 1, 1]], color: 0xff0000 }
        };
    }

    preload() {
        // 本来はここで画像を読み込みますが、今回は図形からテクスチャを動的に生成します
        // ショット音のSEを読み込む
        this.load.audio('shot', 'assets/se/shot.mp3');
        // 敵破壊時のSEを読み込む
        this.load.audio('enemy_explosion_se', 'assets/se/Explosion.mp3');
        // テトリス着地音のSEを読み込む
        this.load.audio('hard_drop_se', 'assets/se/hard_drop.mp3');
        this.load.audio('land_se', 'assets/se/land.mp3');
        // HP回復アイテム取得時のSEを読み込む
        this.load.audio('hp_recovery_se', 'assets/se/hp.mp3');
        // ボス戦用のSEを読み込む
        this.load.audio('tame_se', 'assets/se/tame.mp3');
        this.load.audio('kaihou_se', 'assets/se/kaihou.mp3');
        this.load.audio('boss_gekiha_se', 'assets/se/bossgekiha.mp3');
        // プレイヤー被弾時のSEを読み込む
        this.load.audio('hidan_se', 'assets/se/hidan.mp3');
        // テトリミノ回転時のSEを読み込む
        this.load.audio('kaiten_se', 'assets/se/kaiten.mp3');
    }

    create() {
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;

        // HTML UIの表示を制御
        const titleScreen = document.getElementById('title-screen');
        const gameUi = document.getElementById('game-ui');
        titleScreen.classList.add('hidden');
        gameUi.classList.remove('hidden');

        // 画面中央の分割線
        const centerLineGraphics = this.add.graphics({ lineStyle: { width: 2, color: this.THEME.ACCENT1 } });
        centerLineGraphics.strokeLineShape(new Phaser.Geom.Line(gameWidth / 2, 0, gameWidth / 2, gameHeight));

        // テトリスフィールドを作成
        this.createTetrisField(this.CONFIG.TETRIS.FIELD_X, this.CONFIG.TETRIS.FIELD_Y);
        this.initTetris();

        // インベーダーフィールドを作成
        this.INVADER_FIELD_X = gameWidth / 2 + this.CONFIG.INVADER.FIELD_X_OFFSET;
        this.createInvaderField(this.INVADER_FIELD_X, this.CONFIG.INVADER.FIELD_Y);
        this.initInvader();

        // --- テトリス側のUI要素を右側に配置 ---
        const uiBoxWidth = 120;
        const rightUiX = this.CONFIG.TETRIS.FIELD_X + (this.CONFIG.TETRIS.COLS * this.CONFIG.TETRIS.BLOCK_SIZE) + 20; // フィールド右側からのオフセット

        // --- テトリスの「NEXT」ピース表示エリア ---
        const nextBoxY = this.CONFIG.TETRIS.FIELD_Y; // Y座標は変更なし
        const nextTitle = this.add.text(rightUiX + 10, nextBoxY, 'NEXT', { fontSize: '20px', fill: this.THEME.TEXT });
        nextTitle.setPadding(0, 0, 0, 5).setBackgroundColor('#0d0221').setY(nextBoxY + 30).setX(rightUiX + 10).setDepth(1);
        nextTitle.setY(nextBoxY + 30 - nextTitle.height / 2); // Y座標を補正

        const nextBoxGraphics = this.add.graphics();
        nextBoxGraphics.fillStyle(this.THEME.BACKGROUND, 0);
        nextBoxGraphics.fillRect(rightUiX, nextBoxY + 30, uiBoxWidth, 100);
        nextBoxGraphics.lineStyle(2, this.THEME.ACCENT1, 1);
        nextBoxGraphics.strokeRect(rightUiX, nextBoxY + 30, uiBoxWidth, 100);

        // --- テトリスの「HOLD」ピース表示エリア ---
        const holdBoxY = nextBoxY + 150; // NEXTボックスの下に配置
        const holdTitle = this.add.text(rightUiX + 10, holdBoxY, 'HOLD', { fontSize: '20px', fill: this.THEME.TEXT });
        holdTitle.setPadding(0, 0, 0, 5).setBackgroundColor('#0d0221').setY(holdBoxY + 30).setX(rightUiX + 10).setDepth(1);
        holdTitle.setY(holdBoxY + 30 - holdTitle.height / 2); // Y座標を補正

        const holdBoxGraphics = this.add.graphics();
        holdBoxGraphics.fillStyle(this.THEME.BACKGROUND, 0);
        holdBoxGraphics.fillRect(rightUiX, holdBoxY + 30, uiBoxWidth, 100);
        holdBoxGraphics.lineStyle(2, this.THEME.ACCENT1, 1);
        holdBoxGraphics.strokeRect(rightUiX, holdBoxY + 30, uiBoxWidth, 100);

        // --- テトリスの「LINES」表示 ---
        const linesTextY = holdBoxY + 140;
        this.linesText = this.add.text(rightUiX, linesTextY, 'LINES: 0', { fontSize: '20px', fill: this.THEME.TEXT });

        // --- ボス出現クールダウンタイマーのテキスト ---
        // テトリス側の「LINES」表示の下に移動
        const cooldownTextY = linesTextY + 40;
        this.bossCooldownText = this.add.text(rightUiX, cooldownTextY, '', {
            fontSize: '18px',
            fill: '#ff9900', // 見やすいオレンジ色に
            align: 'center' // 中央揃えにする
        }).setOrigin(0, 0).setDepth(1); // setVisible(false)は不要

        // --- BGMとビジュアライザーの初期化 ---
        // BGMマネージャーに再生開始を指示
        // ライトピラー用のGraphicsオブジェクトを初期化
        this.tetrisLightPillarGraphics = this.add.graphics();
        this.tetrisLightPillarGraphics.setDepth(0); // 他エフェクトの背後

        // エフェクトマネージャーを初期化
        this.effects = new EffectManager(this);

        this.bgmManager.start();

        // SEマネージャーを初期化
        this.seManager.initialize(this);

        // --- デバッグ用キー ---
        this.input.keyboard.on('keydown-B', this.debug_forceStartBossBattle, this);

        // --- 一時停止ボタンのイベントリスナー ---
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) {
            // リスナーをプロパティに保存してから追加
            this.pauseButtonClickHandler = () => this.togglePause();
            pauseButton.addEventListener('click', this.pauseButtonClickHandler);
        }
    }

    /**
     * シーンがシャットダウンする際に呼び出されるメソッド。
     * UI要素などをクリーンアップする。
     */
    shutdown() {
        // --- ゲームの状態を完全にリセット ---
        // 1. すべての攻撃関連タイマーを停止・リセット
        this._resetAllAttackTimers();

        // 2. ボスのクールダウンタイマーを停止
        if (this.bossCooldownTimer) this.bossCooldownTimer.destroy();

        // ポーズボタンのイベントリスナーを削除
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton && this.pauseButtonClickHandler) {
            pauseButton.removeEventListener('click', this.pauseButtonClickHandler);
            this.pauseButtonClickHandler = null;
        }

        // 3. シーン終了時にUI描画用のオブジェクトを完全に破棄する
        if (this.slowMotionGaugeBar) {
            this.slowMotionGaugeBar.destroy();
            this.slowMotionGaugeBar = null;
        }
        if (this.invaderPlayerHPBar) {
            this.invaderPlayerHPBar.destroy();
            this.invaderPlayerHPBar = null;
        }
        if (this.invaderPlayerHPLabel) {
            this.invaderPlayerHPLabel.destroy();
            this.invaderPlayerHPLabel = null;
        }
        if (this.slowMotionGaugeLabel) {
            this.slowMotionGaugeLabel.destroy();
            this.slowMotionGaugeLabel = null;
        }
    }

    update(time, delta) {
        // deltaが異常に大きい場合（タブの非アクティブ化からの復帰、リスタート直後など）は、
        // 処理をスキップして予期せぬ動作を防ぐ
        if (delta > 250) {
            return;
        }

        // ゲームオーバーでない場合のみ、ゲームロジックを更新
        if (!this.isGameOver && !this.isPaused) {
            this.updateTetris(time, delta);
            this.updateInvader(time, delta);
            this.updateTetrisLightPillar();
    
            // --- スローモーションゲージの更新 ---
            this.updateSlowMotion(delta);
        }

        // BGMの周波数データを取得
        this.frequencyData = this.bgmManager.getFrequencyData();

        // --- BGM連動エフェクト ---
        if (this.frequencyData) {
            // --- 低音域（ビート）に合わせたフィールドの明滅 ---
            const bass = (this.frequencyData[1] + this.frequencyData[2] + this.frequencyData[3]) / 3;
            const bassIntensity = Math.min(1, bass / 180); // 0.0 - 1.0
            // グリッドのアルファ値を変更して明滅させる
            if (this.invaderGridGraphics) {
                this.invaderGridGraphics.setAlpha(0.3 + bassIntensity * 0.5); // 0.3から0.8の範囲で変化
            }

            // 高音域の強さを取得 (メロディやシンバル)
            const trebleSlice = this.frequencyData.slice(60, 110);
            const treble = trebleSlice.reduce((a, b) => a + b, 0) / trebleSlice.length;
            const beatIntensity = Math.min(1, treble / 140); // 感度を少し上げる (150 -> 140)

            // --- 高音域に合わせた敵機の脈動 ---
            this.invaders.getChildren().forEach(invader => {
                if (invader.active) {
                    // ビートに合わせて拡大・縮小させる
                    const scale = 1 + beatIntensity * 0.2; // 最大1.1倍まで拡大
                    invader.setScale(scale);

                    // ビートに合わせて明るく点滅させる
                    const baseColor = Phaser.Display.Color.ValueToColor(invader.getData('baseColor'));
                    const newColor = Phaser.Display.Color.Interpolate.ColorWithColor(baseColor, Phaser.Display.Color.ValueToColor(0xffffff), 1, beatIntensity * 0.8);
                    invader.setTint(Phaser.Display.Color.GetColor(newColor.r, newColor.g, newColor.b));
                }
            });

            // --- 高音域に合わせたボスの脈動 ---
            if (this.isBossBattle && this.boss && this.boss.active && !this.isBossTransitioning) {
                // ビートに合わせて拡大・縮小させる
                const scale = 1 + beatIntensity * 0.4; // 雑魚敵と同じように大きく脈動させる
                this.boss.setScale(scale);

                // ビートに合わせて明るく点滅させる
                let baseColorHex;
                if (this.bossPhase === 1) baseColorHex = this.CONFIG.BOSS.PHASE1.TINT;
                else if (this.bossPhase === 2) baseColorHex = this.CONFIG.BOSS.PHASE2.TINT;
                else baseColorHex = this.CONFIG.BOSS.PHASE3.WALL_TINT;

                const baseColor = Phaser.Display.Color.ValueToColor(baseColorHex);
                const newColor = Phaser.Display.Color.Interpolate.ColorWithColor(baseColor, Phaser.Display.Color.ValueToColor(0xffffff), 1, beatIntensity * 0.6);
                // 被弾時のTintFillと競合しないように、setTintを使用
                this.boss.setTint(Phaser.Display.Color.GetColor(newColor.r, newColor.g, newColor.b));
            }
        }

        // ゲームオーバーでない場合のみ、UIを更新
        if (!this.isGameOver) {
            this.updateSlowMotionGaugeBar();
        }
        // ビジュアライザーの描画
        // BGMマネージャーに描画を指示
        this.bgmManager.drawVisualizer();

        // ボスクールダウンタイマーの表示を常時更新（デバッグのため）
        this.bossCooldownText.setVisible(true); // 常に表示
        if (this.isBossSpawnOnCooldown && this.bossCooldownTimer) {
            const remainingTime = this.bossCooldownTimer.getRemainingSeconds();
            this.bossCooldownText.setText(`NEXT BOSS\nIN: ${remainingTime.toFixed(1)}s`); // 改行を追加
            this.bossCooldownText.setFill('#ff9900'); // クールダウン中の色をオレンジに
            this.bossCooldownText.setShadow(0, 0, 'transparent'); // グローを解除
        } else {
            // クールダウン中でない場合の表示
            this.bossCooldownText.setText('Boss Ready');
            this.bossCooldownText.setFill('#ffff00'); // 目立つ黄色に変更
            this.bossCooldownText.setShadow(0, 0, '#ffffff', 5); // 白いグローを追加
        }
    }

    // =================================================================
    // テトリス関連のメソッド
    // =================================================================

    createTetrisField(x, y) {
        const fieldWidth = this.CONFIG.TETRIS.COLS * this.CONFIG.TETRIS.BLOCK_SIZE;
        const fieldHeight = this.CONFIG.TETRIS.ROWS * this.CONFIG.TETRIS.BLOCK_SIZE;
        const graphics = this.add.graphics();

        // 背景色
        graphics.fillStyle(this.THEME.BACKGROUND, 0.8); // 背景を透明にする
        graphics.fillRect(x, y, fieldWidth, fieldHeight);

        // 背景グリッド
        graphics.lineStyle(1, this.THEME.GRID, 0.5);
        for (let i = 1; i < this.CONFIG.TETRIS.COLS; i++) {
            graphics.lineBetween(x + i * this.CONFIG.TETRIS.BLOCK_SIZE, y, x + i * this.CONFIG.TETRIS.BLOCK_SIZE, y + fieldHeight);
        }
        for (let i = 1; i < this.CONFIG.TETRIS.ROWS; i++) {
            graphics.lineBetween(x, y + i * this.CONFIG.TETRIS.BLOCK_SIZE, x + fieldWidth, y + i * this.CONFIG.TETRIS.BLOCK_SIZE);
        }

        // 枠線
        const lineWidth = 2;
        graphics.lineStyle(lineWidth, this.THEME.ACCENT1, 1);
        graphics.strokeRect(x - lineWidth / 2, y - lineWidth / 2, fieldWidth + lineWidth, fieldHeight + lineWidth);
    }

    initTetris() {
        // ミノの描画レイヤーをここで作成する
        // 光の柱(depth:0)より手前に表示するため、depthを1に設定
        this.tetrisGraphics = this.add.graphics().setDepth(1);
        this.nextPieceGraphics = this.add.graphics();
        this.holdPieceGraphics = this.add.graphics();

        if (this.isTetrisPlayer) {
            // プレイヤーの操作を有効化
            this.tetrisKeys = this.input.keyboard.addKeys('A,D,S,W,Q,E,SPACE');
            this.input.keyboard.on('keydown-W', () => this.rotatePiece(true), this); // 順回転
            this.input.keyboard.on('keydown-Q', () => this.rotatePiece(false), this); // 逆回転
            this.input.keyboard.on('keydown-SPACE', () => this.hardDrop(true), this);
            this.input.keyboard.on('keydown-E', this.holdCurrentPiece, this); // 'E'キーでホールド
        } else {
            // AIを初期化
            this.tetrisAI = new TetrisAI(this);
        }

        // 最初のピースを準備
        this.nextPiece = this._generateRandomPiece();
        this.spawnNewTetromino();
    }

    updateTetris(time, delta) {
        // AIのロジックは新しいミノの出現時に実行されるため、updateでは主にプレイヤー操作を処理
        if (this.isTetrisPlayer && this.currentPiece) {
            if (Phaser.Input.Keyboard.JustDown(this.tetrisKeys.A)) {
                this.movePiece(-1, 0);
            } else if (Phaser.Input.Keyboard.JustDown(this.tetrisKeys.D)) {
                this.movePiece(1, 0);
            }

            if (this.tetrisKeys.S.isDown) {
                this.dropTimer += delta * 10;
            }

            this.dropTimer += delta;
            if (this.dropTimer > this.dropInterval) {
                this.dropTimer = 0;
                this.movePiece(0, 1);
            }
        }

        this.drawTetris();
    }

    _generateRandomPiece() {
        const pieces = Object.keys(this.getTETROMINOS());
        const randomPieceKey = pieces[Math.floor(Math.random() * pieces.length)];
        return JSON.parse(JSON.stringify(this.getTETROMINOS()[randomPieceKey])); // Deep copy
    }

    spawnNewTetromino() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this._generateRandomPiece(); // 新しいピースを生成
        this.drawNextPiece();
        this.pieceX = Math.floor(this.CONFIG.TETRIS.COLS / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.pieceY = 0;

        if (this.checkCollision(this.pieceX, this.pieceY, this.currentPiece.shape)) {
            this.gameOver("TETRIS LOST: Block out");
            return; // ゲームオーバーならAIの思考は不要
        }

        if (!this.isTetrisPlayer && this.tetrisAI && this.currentPiece) {
            this.time.delayedCall(this.CONFIG.TETRIS.AI_THINK_DELAY, this.tetrisAI.makeMove, [], this.tetrisAI);
        }
    }

    holdCurrentPiece() {
        if (!this.currentPiece || !this.canHold) return;

        this.canHold = false; // このターンではもうホールドできない

        if (this.holdPiece === null) {
            // ホールドが空の場合、現在のピースをホールドに移動し、新しいピースをスポーン
            this.holdPiece = JSON.parse(JSON.stringify(this.currentPiece));
            this.spawnNewTetromino();
        } else {
            // ホールドと現在のピースを交換
            const tempPiece = JSON.parse(JSON.stringify(this.currentPiece));
            this.currentPiece = JSON.parse(JSON.stringify(this.holdPiece));
            this.holdPiece = tempPiece;

            // 交換したピースを初期位置にリセット
            this.pieceX = Math.floor(this.CONFIG.TETRIS.COLS / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
            this.pieceY = 0;
        }

        // UIを更新
        this.drawHoldPiece();
        this.drawTetris();
    }

    movePiece(dx, dy) {
        if (!this.currentPiece) return;
        const newX = this.pieceX + dx;
        const newY = this.pieceY + dy;

        if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
            this.pieceX = newX;
            this.pieceY = newY;
        } else if (dy > 0) {
            this.lockPiece();
            this.spawnNewTetromino();
        }
    }

    rotatePiece(clockwise = true) {
        if (!this.currentPiece) return;
        const shape = this.currentPiece.shape;

        // 1. 行列を転置する (行と列を入れ替える)
        const newShape = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]));

        // 2. 回転方向に応じて行を反転させる
        if (clockwise) {
            // 順回転: 各行を反転
            newShape.forEach(row => row.reverse());
        } else {
            // 逆回転: 行の配列全体を反転
            newShape.reverse();
        }

        if (!this.checkCollision(this.pieceX, this.pieceY, newShape)) {
            this.currentPiece.shape = newShape;
            // 回転SEを再生
            this.seManager.play('kaiten_se', { volumeMultiplier: 0.4 });
        }
    }

    hardDrop(isPlayerAction = false) {
        if (!this.currentPiece) return;
        while (!this.checkCollision(this.pieceX, this.pieceY + 1, this.currentPiece.shape)) {
            this.pieceY++;
        }
        this.lockPiece(isPlayerAction);
        this.spawnNewTetromino();
        this.drawTetris();
        this.dropTimer = 0;
    }

    checkCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    const newX = x + col;
                    const newY = y + row;
                    if (newX < 0 || newX >= this.CONFIG.TETRIS.COLS || newY >= this.CONFIG.TETRIS.ROWS) {
                        return true;
                    }
                    if (newY >= 0 && this.tetrisGrid[newY][newX] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    lockPiece(isHardDrop = false) {
        if (!this.currentPiece) return; // 安全のためのチェック

        const pieceToLock = this.currentPiece; // これからロックするピースを保持
        const shape = pieceToLock.shape;

        // SE再生: ピース着地音（音量を30%に調整）
        if (isHardDrop) {
            this.seManager.play('hard_drop_se', { volumeMultiplier: 0.5 });
        } else {
            this.seManager.play('land_se', { volumeMultiplier: 0.5 });
        }

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    const boardY = this.pieceY + row;
                    const boardX = this.pieceX + col;
                    if (boardY >= 0 && boardY < this.CONFIG.TETRIS.ROWS && boardX >= 0 && boardX < this.CONFIG.TETRIS.COLS) {
                        this.tetrisGrid[boardY][boardX] = pieceToLock.color;
                    }
                }
            }
        }
        this.canHold = true; // 新しいピースがロックされたので、次のホールドを許可

        this.currentPiece = null; // 判定が終わったのでnullにする

        const clearedLines = this.clearLines();
        if (clearedLines > 0) {
            this.sendAttack(clearedLines);
        }

        // テトリス側がラインを消したら、インベーダー側が弾幕攻撃を行う
        if (clearedLines === 1) { // 1ライン消しの場合は3回攻撃
            const attackCount = this.CONFIG.ATTACK.DANMAKU_ATTACK_COUNT_SINGLE;
            const attackDelay = this.CONFIG.ATTACK.DANMAKU_ATTACK_DELAY;
            for (let i = 0; i < attackCount; i++) {
                const timer = this.time.delayedCall(i * attackDelay, () => {
                    const activeInvaders = this.invaders.getChildren().filter(inv => inv.active);
                    if (activeInvaders.length > 0) {
                        const randomInvader = Phaser.Utils.Array.GetRandom(activeInvaders);
                        this.triggerRandomAttack(randomInvader.x, randomInvader.y);
                    }
                });
                this.danmakuTimers.push(timer);
            }
        } else if (clearedLines > 1) { // 2ライン以上消した場合は1回攻撃
            const activeInvaders = this.invaders.getChildren().filter(inv => inv.active);
            if (activeInvaders.length > 0) {
                const randomInvader = Phaser.Utils.Array.GetRandom(activeInvaders);
                this.triggerRandomAttack(randomInvader.x, randomInvader.y);
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        for (let y = this.CONFIG.TETRIS.ROWS - 1; y >= 0; y--) {
            const isLineFull = this.tetrisGrid[y].every(cell => cell !== 0);
            if (isLineFull) {
                linesCleared++;
                this.tetrisLinesCleared++;
                this.tetrisGrid.splice(y, 1); // (エフェクト処理は削除)
                this.tetrisGrid.unshift(Array(this.CONFIG.TETRIS.COLS).fill(0));
                y++;
            }
        }

        // 4ライン以上消した場合、ボス戦を開始
        if (linesCleared >= 4 && !this.isBossBattle && !this.isBossSpawnOnCooldown) {
            this.startBossBattle();
            // ボス戦開始時は通常の攻撃は発生させない
            return linesCleared;
        }
        if (this.linesText) this.linesText.setText(`LINES: ${this.tetrisLinesCleared}`);
        return linesCleared;
    }

    sendAttack(clearedLines) {
        // 累計ライン数に基づいて攻撃力を計算
        const linesBefore = this.tetrisLinesCleared - clearedLines;
        const attackPower = Math.floor(this.tetrisLinesCleared / this.CONFIG.ATTACK.TETRIS_LINES_PER_ATTACK) - Math.floor(linesBefore / this.CONFIG.ATTACK.TETRIS_LINES_PER_ATTACK);

        // ボス戦中、またはボス出現のクールダウン中は通常攻撃を送らない
        // これにより、ボス撃破直後の敵出現とテトリス攻撃が競合するのを防ぐ
        if (attackPower > 0 && !this.isBossBattle && !this.isBossSpawnOnCooldown) {
            console.log(`Triggering Tetris attack animation with power ${attackPower}.`);
            // アニメーションを開始し、完了後に行を追加する
            this.triggerTetrisAttackAnimation(attackPower);
        }
    }

    receiveGarbage(lineCount) {
        // おじゃまブロックの処理
        if (!this.tetrisGrid) return;
        // (エフェクト処理は削除)

        for (let i = 0; i < lineCount; i++) {
            // 一番上の行を削除
            this.tetrisGrid.shift();

            // 新しいおじゃま行を作成
            const holePosition = Math.floor(Math.random() * this.CONFIG.TETRIS.COLS);
            const newRow = Array(this.CONFIG.TETRIS.COLS).fill(this.CONFIG.TETRIS.GARBAGE_COLOR);
            newRow[holePosition] = 0; // 1つだけ穴を開ける

            // 新しい行を一番下に追加
            this.tetrisGrid.push(newRow);
        }

        // おじゃまブロックによってゲームオーバーになるかチェック
        if (this.currentPiece && this.checkCollision(this.pieceX, this.pieceY, this.currentPiece.shape)) {
            this.gameOver("TETRIS LOST: Pushed out by garbage");
        }
    }

    /**
     * テトリスからインベーダーへの攻撃アニメーション
     * @param {number} attackPower 送る行数
     */
    triggerTetrisAttackAnimation(attackPower) {
        const startX = this.CONFIG.TETRIS.FIELD_X + (this.CONFIG.TETRIS.COLS * this.CONFIG.TETRIS.BLOCK_SIZE) / 2;
        const startY = this.CONFIG.TETRIS.FIELD_Y + (this.CONFIG.TETRIS.ROWS * this.CONFIG.TETRIS.BLOCK_SIZE) / 2;
        const endX = this.INVADER_FIELD_X + this.CONFIG.INVADER.FIELD_WIDTH / 2;
        const endY = this.CONFIG.INVADER.FIELD_Y;

        const attackEffect = this.add.graphics();
        attackEffect.fillStyle(this.THEME.ACCENT1, 1.0); // テトリス側の色
        attackEffect.fillCircle(0, 0, 15);
        attackEffect.setPosition(startX, startY);
        attackEffect.setDepth(100); // 最前面に表示

        this.tweens.add({
            targets: attackEffect,
            x: endX,
            y: endY,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.addInvaderRows(attackPower); // アニメーション完了後に行を追加
                attackEffect.destroy();
            }
        });
    }

    /**
     * インベーダーからテトリスへの攻撃アニメーション
     * @param {number} lineCount 送るおじゃま行数
     */
    triggerInvaderAttackAnimation(lineCount) {
        const startX = this.INVADER_FIELD_X + this.CONFIG.INVADER.FIELD_WIDTH / 2;
        const startY = this.CONFIG.INVADER.FIELD_Y;
        const endX = this.CONFIG.TETRIS.FIELD_X + (this.CONFIG.TETRIS.COLS * this.CONFIG.TETRIS.BLOCK_SIZE) / 2;
        const endY = this.CONFIG.TETRIS.FIELD_Y + (this.CONFIG.TETRIS.ROWS * this.CONFIG.TETRIS.BLOCK_SIZE);

        const attackEffect = this.add.graphics();
        attackEffect.fillStyle(this.THEME.ACCENT2, 1.0); // インベーダー側の色
        attackEffect.fillCircle(0, 0, 15);
        attackEffect.setPosition(startX, startY);
        attackEffect.setDepth(100);

        this.tweens.add({
            targets: attackEffect,
            x: endX,
            y: endY,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.receiveGarbage(lineCount); // アニメーション完了後におじゃまを反映
                attackEffect.destroy();
            }
        });
    }

    drawTetris() {
        this.tetrisGraphics.clear();
        // --- 確定済みのブロックを描画 ---
        for (let row = 0; row < this.CONFIG.TETRIS.ROWS; row++) {
            for (let col = 0; col < this.CONFIG.TETRIS.COLS; col++) {
                if (this.tetrisGrid[row][col] !== 0) {
                    const x = this.CONFIG.TETRIS.FIELD_X + col * this.CONFIG.TETRIS.BLOCK_SIZE;
                    const y = this.CONFIG.TETRIS.FIELD_Y + row * this.CONFIG.TETRIS.BLOCK_SIZE;
                    const color = this.tetrisGrid[row][col];

                    this.tetrisGraphics.fillStyle(color, color === this.THEME.GARBAGE ? 0.6 : 1.0);
                    this.tetrisGraphics.fillRect(x, y, this.CONFIG.TETRIS.BLOCK_SIZE, this.CONFIG.TETRIS.BLOCK_SIZE);

                    this.tetrisGraphics.lineStyle(1, 0x000000, 0.4);
                    this.tetrisGraphics.strokeRect(x + 0.5, y + 0.5, this.CONFIG.TETRIS.BLOCK_SIZE - 1, this.CONFIG.TETRIS.BLOCK_SIZE - 1);
                }
            }
        }

        if (this.currentPiece) {
            // --- ゴーストピースの描画 ---
            this.drawGhostPiece();

            // --- 現在のピースの描画 ---
            const shape = this.currentPiece.shape;
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col] !== 0) {
                        const x = this.CONFIG.TETRIS.FIELD_X + (this.pieceX + col) * this.CONFIG.TETRIS.BLOCK_SIZE;
                        const y = this.CONFIG.TETRIS.FIELD_Y + (this.pieceY + row) * this.CONFIG.TETRIS.BLOCK_SIZE;

                        // ブロックの塗りつぶし
                        this.tetrisGraphics.fillStyle(this.currentPiece.color);
                        this.tetrisGraphics.fillRect(x, y, this.CONFIG.TETRIS.BLOCK_SIZE, this.CONFIG.TETRIS.BLOCK_SIZE);
                        // ブロックの枠線
                        this.tetrisGraphics.lineStyle(1, 0x000000, 0.4); 
                        this.tetrisGraphics.strokeRect(x + 0.5, y + 0.5, this.CONFIG.TETRIS.BLOCK_SIZE - 1, this.CONFIG.TETRIS.BLOCK_SIZE - 1);
                    }
                }
            }
        }
    }

    drawGhostPiece() {
        if (!this.currentPiece) return;

        let ghostY = this.pieceY;
        while (!this.checkCollision(this.pieceX, ghostY + 1, this.currentPiece.shape)) {
            ghostY++;
        }

        if (ghostY <= this.pieceY) return;

        this.tetrisGraphics.fillStyle(this.currentPiece.color, 0.3);
        this.tetrisGraphics.lineStyle(1, 0xffffff, 0.3);
        const ghostShape = this.currentPiece.shape;
        for (let row = 0; row < ghostShape.length; row++) {
            for (let col = 0; col < ghostShape[row].length; col++) {
                if (ghostShape[row][col] !== 0) {
                    const x = this.CONFIG.TETRIS.FIELD_X + (this.pieceX + col) * this.CONFIG.TETRIS.BLOCK_SIZE;
                    const y = this.CONFIG.TETRIS.FIELD_Y + (ghostY + row) * this.CONFIG.TETRIS.BLOCK_SIZE;
                    this.tetrisGraphics.fillRect(x, y, this.CONFIG.TETRIS.BLOCK_SIZE, this.CONFIG.TETRIS.BLOCK_SIZE); // 塗りつぶし
                    this.tetrisGraphics.strokeRect(x, y, this.CONFIG.TETRIS.BLOCK_SIZE, this.CONFIG.TETRIS.BLOCK_SIZE); // 枠線を追加
                }
            }
        }
    }

    drawNextPiece() {
        this.nextPieceGraphics.clear();
        if (!this.nextPiece) return;

        const uiBoxWidth = 120;
        const boxX = this.CONFIG.TETRIS.FIELD_X + (this.CONFIG.TETRIS.COLS * this.CONFIG.TETRIS.BLOCK_SIZE) + 20; // 右側に配置
        const boxY = this.CONFIG.TETRIS.FIELD_Y + 30;
        const boxHeight = 100;

        const shape = this.nextPiece.shape;
        const color = this.nextPiece.color;

        // ピースの幅と高さを計算
        const pieceWidth = shape[0].length * this.CONFIG.TETRIS.BLOCK_SIZE;
        const pieceHeight = shape.length * this.CONFIG.TETRIS.BLOCK_SIZE;

        // ボックスの中央に描画するためのオフセット
        const offsetX = boxX + (uiBoxWidth - pieceWidth) / 2;
        const offsetY = boxY + (boxHeight - pieceHeight) / 2;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    const x = offsetX + col * this.CONFIG.TETRIS.BLOCK_SIZE;
                    const y = offsetY + row * this.CONFIG.TETRIS.BLOCK_SIZE;
                    this.nextPieceGraphics.fillStyle(color, 1.0);
                    this.nextPieceGraphics.fillRect(x, y, this.CONFIG.TETRIS.BLOCK_SIZE, this.CONFIG.TETRIS.BLOCK_SIZE);
                    this.nextPieceGraphics.lineStyle(1, 0x000000, 0.4);
                    this.nextPieceGraphics.strokeRect(x + 0.5, y + 0.5, this.CONFIG.TETRIS.BLOCK_SIZE - 1, this.CONFIG.TETRIS.BLOCK_SIZE - 1);
                }
            }
        }
    }

    drawHoldPiece() {
        this.holdPieceGraphics.clear();
        if (!this.holdPiece) return;

        const uiBoxWidth = 120;
        const boxX = this.CONFIG.TETRIS.FIELD_X + (this.CONFIG.TETRIS.COLS * this.CONFIG.TETRIS.BLOCK_SIZE) + 20; // 右側に配置
        const boxY = this.CONFIG.TETRIS.FIELD_Y + 180; // HOLDボックスのY座標
        const boxHeight = 100;

        const shape = this.holdPiece.shape;
        const color = this.holdPiece.color;

        // ピースの幅と高さを計算
        const pieceWidth = shape[0].length * this.CONFIG.TETRIS.BLOCK_SIZE;
        const pieceHeight = shape.length * this.CONFIG.TETRIS.BLOCK_SIZE;

        // ボックスの中央に描画するためのオフセット
        const offsetX = boxX + (uiBoxWidth - pieceWidth) / 2;
        const offsetY = boxY + (boxHeight - pieceHeight) / 2;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    const x = offsetX + col * this.CONFIG.TETRIS.BLOCK_SIZE;
                    const y = offsetY + row * this.CONFIG.TETRIS.BLOCK_SIZE;
                    this.holdPieceGraphics.fillStyle(color, 1.0);
                    this.holdPieceGraphics.fillRect(x, y, this.CONFIG.TETRIS.BLOCK_SIZE, this.CONFIG.TETRIS.BLOCK_SIZE);
                    this.holdPieceGraphics.lineStyle(1, 0x000000, 0.4);
                    this.holdPieceGraphics.strokeRect(x + 0.5, y + 0.5, this.CONFIG.TETRIS.BLOCK_SIZE - 1, this.CONFIG.TETRIS.BLOCK_SIZE - 1);
                }
            }
        }
    }

    // =================================================================
    // インベーダー関連のメソッド
    // =================================================================

    createInvaderField(x, y) {
        const fieldWidth = this.CONFIG.INVADER.FIELD_WIDTH;
        const fieldHeight = this.CONFIG.INVADER.FIELD_HEIGHT;

        // 背景色
        this.invaderFieldGraphics = this.add.graphics();
        this.invaderFieldGraphics.fillStyle(this.THEME.BACKGROUND, 0.8); // 背景を透明にする
        this.invaderFieldGraphics.fillRect(x, y, fieldWidth, fieldHeight);

        // 背景グリッド
        this.invaderGridGraphics = this.add.graphics();
        this.invaderGridGraphics.lineStyle(1, this.THEME.GRID, 0.5);
        const gridSize = 40;
        for (let i = 1; i * gridSize < fieldWidth; i++) {
            this.invaderGridGraphics.lineBetween(x + i * gridSize, y, x + i * gridSize, y + fieldHeight);
        }
        for (let i = 1; i * gridSize < fieldHeight; i++) {
            this.invaderGridGraphics.lineBetween(x, y + i * gridSize, x + fieldWidth, y + i * gridSize);
        }

        // 枠線
        const lineWidth = 2;
        this.invaderBorderGraphics = this.add.graphics({ lineStyle: { width: lineWidth, color: this.THEME.ACCENT2, alpha: 1 } });
        this.invaderBorderGraphics.strokeRect(x - lineWidth / 2, y - lineWidth / 2, fieldWidth + lineWidth, fieldHeight + lineWidth);

        // --- デッドラインの描画 ---
        const deadlineY = y + fieldHeight - 40; // デッドラインの位置を下に下げる
        const deadlineLine = this.add.line(0, 0, x, deadlineY, x + fieldWidth, deadlineY, 0xff0000).setOrigin(0, 0);
        deadlineLine.setLineWidth(2);

        // ラインを点滅させるTween
        this.tweens.add({
            targets: deadlineLine,
            alpha: 0.2,
            duration: 700,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    initInvader() {
        // --- アセットの動的生成 ---
        if (!this.textures.exists('invader_bullet')) {
            const bulletGraphics = this.add.graphics();
            bulletGraphics.fillStyle(this.THEME.ACCENT2, 1.0);
            bulletGraphics.fillRect(0, 0, 4, 12);
            bulletGraphics.generateTexture('invader_bullet', 4, 12);
            bulletGraphics.destroy();
        }
        // 敵の弾のテクスチャ
        if (!this.textures.exists('enemy_bullet_texture')) {
            const bulletGraphics = this.add.graphics();
            bulletGraphics.fillStyle(0xffffff, 1.0); // 弾のベースを白色に(色付けのため)
            bulletGraphics.fillRect(0, 0, 8, 8); // 少し大きめの円形に近い形に
            bulletGraphics.generateTexture('enemy_bullet_texture', 8, 8); // テクスチャ名を変更
            bulletGraphics.destroy();
        }
        if (!this.textures.exists('invader_ship')) {
            const shipGraphics = this.add.graphics();
            shipGraphics.fillStyle(this.THEME.ACCENT2, 1.0);
            shipGraphics.beginPath();
            shipGraphics.moveTo(16, 0);
            shipGraphics.lineTo(32, 32);
            shipGraphics.lineTo(0, 32);
            shipGraphics.closePath();
            shipGraphics.fillPath();
            shipGraphics.generateTexture('invader_ship', 32, 32);
            shipGraphics.destroy();
        }
        if (!this.textures.exists('invader_enemy')) {
            const enemyGraphics = this.add.graphics();
            enemyGraphics.fillStyle(this.THEME.ACCENT1, 1.0); // ネオングリーンの敵
            enemyGraphics.fillRect(0, 0, 32, 24);
            // ここにサイバーな敵のデザインを描画することも可能
            enemyGraphics.generateTexture('invader_enemy', 32, 24);
            enemyGraphics.destroy();
        }
        // ボス用のテクスチャ
        if (!this.textures.exists('invader_boss')) {
            const bossGraphics = this.add.graphics();
            // ボスらしい配色に変更
            bossGraphics.fillStyle(0x440022, 1.0); // ダークパープル
            bossGraphics.lineStyle(4, this.THEME.ACCENT2, 1.0); // マゼンタの枠線
            bossGraphics.fillRect(0, 0, 96, 64);
            bossGraphics.strokeRect(0, 0, 96, 64);
            bossGraphics.generateTexture('invader_boss', 96, 64);
            bossGraphics.destroy();
        }
        // HP回復アイテム用のテクスチャ
        if (!this.textures.exists('hp_item')) {
            const itemGraphics = this.add.graphics();
            itemGraphics.fillStyle(0x00ff00, 1.0); // 明るい緑色
            // 十字の形を描画
            itemGraphics.fillRect(5, 0, 10, 20);
            itemGraphics.fillRect(0, 5, 20, 10);
            itemGraphics.generateTexture('hp_item', 20, 20);
            itemGraphics.destroy();
        }

        // --- オブジェクトの配置 ---
        const playerX = this.INVADER_FIELD_X + this.CONFIG.INVADER.FIELD_WIDTH / 2; // プレイヤーの初期位置を下に下げる
        const playerY = this.CONFIG.INVADER.FIELD_Y + this.CONFIG.INVADER.FIELD_HEIGHT - 30;
        
        // プレイヤーのスプライトと中心点をコンテナにまとめる
        // スプライトの原点を左上に設定(0, 0)し、コンテナの中央に配置するために位置を調整
        const playerSprite = this.add.sprite(-16, -16, 'invader_ship').setOrigin(0, 0);
        const centerDot = this.add.graphics();
        centerDot.fillStyle(0xffffff, 1.0); // 白色
        // 中心点はコンテナの(0,0)に描画
        centerDot.fillCircle(0, 0, 2);

        // コンテナを作成し、スプライトと中心点を追加
        this.invaderPlayer = this.add.container(playerX, playerY, [playerSprite, centerDot]);
        
        // コンテナに物理ボディを追加
        this.physics.world.enable(this.invaderPlayer);

        // 当たり判定を中央の4x4ピクセルに設定
        // コンテナ内のスプライトの開始座標(-16, -16)を考慮してオフセットを計算する
        const bodySize = 4;
        // (スプライト幅 - 当たり判定サイズ) / 2 + スプライトの開始座標
        const offset = (playerSprite.width - bodySize) / 2 + playerSprite.x; // (32 - 4) / 2 + (-16) = 14 - 16 = -2
        this.invaderPlayer.body.setSize(bodySize, bodySize);
        this.invaderPlayer.body.setOffset(offset, offset);

        // --- グループの作成 ---
        this.invaderBullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            createCallback: (bullet) => {
                bullet.setName('invader_bullet');
                bullet.setTexture('invader_bullet'); // 生成時にテクスチャをセット
                // --- 当たり判定を調整 ---
                // 見た目(4x12)よりも当たり判定を細く(2x12)して、より正確な射撃を要求する
                bullet.body.setSize(2, 12);
                bullet.body.setOffset(1, 0); // (スプライト幅4 - ボディ幅2)/2
            }
        });
        this.invaders = this.physics.add.group();
        this.enemyBullets = this.physics.add.group({ // 敵の弾グループ
            classType: Phaser.Physics.Arcade.Sprite,
            createCallback: (bullet) => {
                bullet.setName('enemy_bullet');
                bullet.setTexture('enemy_bullet_texture');
                // 弾生成時に当たり判定のサイズとオフセットを一度だけ設定する
                // これにより、発射時のsetSize呼び出しによるオフセットリセットを防ぐ
                bullet.body.setSize(8, 8);
                bullet.body.setOffset(0, 0);
            }
        });
        this.hpItems = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            createCallback: (item) => {
                item.setName('hp_item');
            }
        });

        // --- 敵の初期配置 ---
        this.createInvaderWave();

        if (this.isInvaderPlayer) {
            // --- プレイヤー操作用のキーボード入力 ---
            this.invaderKeys = this.input.keyboard.createCursorKeys();
            // 右シフトキーもスローモーションに割り当てる
            this.invaderKeys.R_SHIFT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT, false);
        } else {
            // --- AIの初期化 ---
            this.invaderAI = new InvaderAI(this);
        }

        // --- 当たり判定 ---
        this.physics.add.overlap(this.invaderBullets, this.invaders, this.hitInvader, null, this);
        // プレイヤーと敵の弾との当たり判定
        this.physics.add.overlap(this.invaderPlayer, this.enemyBullets, this.hitPlayer, null, this);
        // プレイヤーとHP回復アイテムとの当たり判定
        this.physics.add.overlap(this.invaderPlayer, this.hpItems, this.collectHpItem, null, this);

        // --- ボス用のHPバーを作成 ---
        // createで再生成するため、古いインスタンスがあれば破棄する
        if (this.bossHPBar) this.bossHPBar.destroy();
        this.bossHPBar = this.add.graphics(); // ここで再生成
        this.bossHPBar.setVisible(false); // 初期状態では非表示

        // --- プレイヤー用のHPバーを作成 ---
        this.invaderPlayerHPBar = this.add.graphics();
        this.slowMotionGaugeBar = this.add.graphics().setDepth(100); // 常に最前面に表示
        const hpBarY = this.CONFIG.INVADER.FIELD_Y + this.CONFIG.INVADER.FIELD_HEIGHT + 20; // 枠外下へのマージンを調整
        this.invaderPlayerHPLabel = this.add.text(0, hpBarY + 8, 'HP', {
            fontSize: '16px',
            fill: this.THEME.TEXT,
            align: 'right'
        }).setOrigin(1, 0.5).setDepth(100); // 常に最前面に表示
        this.slowMotionGaugeLabel = this.add.text(0, hpBarY + 38, 'SLOW', {
            fontSize: '16px',
            fill: '#00ffff',
            align: 'right'
        }).setOrigin(1, 0.5).setDepth(100); // 常に最前面に表示
        this.updateInvaderPlayerHPBar(); // 初期描画
        this.updateSlowMotionGaugeBar(); // 初期描画を追加
    }

    updateInvader(time, delta) {
        if (!this.invaderPlayer || !this.invaderPlayer.active) return;

        // 被弾中はAI・プレイヤー問わず一切の操作を受け付けず、移動を停止する
        if (this.invaderPlayer.getData('isHit')) {
            this.invaderPlayer.body.setVelocityX(0);
            // 被弾したらスローモーションを強制解除
            if (this.isSlowMotionActive) {
                this.stopSlowMotion();
            }
        } else {
            // AI操作の場合
            if (!this.isInvaderPlayer) {
                this.invaderAI.update(time, delta);
            }
            // プレイヤー操作の場合
            else if (this.isInvaderPlayer) {
                // 被弾中でなければ操作を許可
                let playerSpeed = this.CONFIG.INVADER.PLAYER_SPEED;
                // スローモーションが有効な場合、移動速度を半分にする
                if (this.isSlowMotionActive) {
                    playerSpeed /= 2;
                }

                if (this.invaderKeys.left.isDown) {
                    this.invaderPlayer.body.setVelocityX(-playerSpeed);
                } else if (this.invaderKeys.right.isDown) {
                    this.invaderPlayer.body.setVelocityX(playerSpeed);
                } else {
                    this.invaderPlayer.body.setVelocityX(0);
                }
                if (this.invaderKeys.up.isDown && time > this.lastFired) {
                    this.fireInvaderBullet(time);
                }
                // Shiftキーでスローモーション
                if (this.invaderKeys.shift.isDown || this.invaderKeys.R_SHIFT.isDown) {
                    if (this.slowMotionGauge > 0) {
                        this.startSlowMotion();
                    }
                } else if (this.isSlowMotionActive) {
                    this.stopSlowMotion();
                }
            }
        }

        // ボス戦中でなければ通常の敵の移動ロジックを実行
        if (!this.isBossBattle) {
            // --- 敵の移動 ---
            this.invaderMoveTimer += delta;
            if (this.invaderMoveTimer > this.invaderMoveInterval) {
                this.invaderMoveTimer = 0;
                let moveDown = false;
                const nextXDelta = this.invaderMoveDir * this.invaderMoveSpeed;

                // 次の移動でいずれかの敵が画面端に到達するかを予測
                this.invaders.getChildren().forEach(invader => {
                    const nextX = invader.x + nextXDelta;
                    if (nextX >= this.INVADER_FIELD_X + this.CONFIG.INVADER.FIELD_WIDTH - invader.width / 2 || nextX <= this.INVADER_FIELD_X + invader.width / 2) {
                        moveDown = true;
                    }
                });

                if (moveDown) {
                    this.invaderMoveDir *= -1; // 方向転換
                    this.invaders.getChildren().forEach(invader => {
                        invader.y += this.CONFIG.INVADER.ENEMY_MOVE_DOWN_STEP; // 下に移動
                        // デッドラインを超えたかチェック (Y座標はスプライトの中心)
                        if (invader.y + invader.height / 2 > this.CONFIG.INVADER.FIELD_Y + this.CONFIG.INVADER.FIELD_HEIGHT - 40) {
                            this.gameOver("INVADER LOST: Invaders reached the bottom");
                        }
                    });
                } else {
                    // 枠内に収まる場合のみ水平移動
                    this.invaders.getChildren().forEach(invader => {
                        invader.x += nextXDelta;
                    });
                }
            }
        } else {
            // ボス戦中のボスの移動ロジック
            // (例: 左右にゆっくり移動する)
            if (this.boss && this.boss.active) {
                this.boss.x = this.INVADER_FIELD_X + this.CONFIG.INVADER.FIELD_WIDTH / 2 + Math.sin(time / 2000) * (this.CONFIG.INVADER.FIELD_WIDTH / 2 - 50);
            }
        }

        // プレイヤーの左右移動範囲を常に制限する
        const halfWidth = this.invaderPlayer.getAt(0).width / 2; // コンテナ内のスプライトの幅を取得
        this.invaderPlayer.x = Phaser.Math.Clamp(
            this.invaderPlayer.x,
            this.INVADER_FIELD_X + halfWidth,
            this.INVADER_FIELD_X + this.CONFIG.INVADER.FIELD_WIDTH - halfWidth
        );

        // --- 弾が画面外に出たら非表示にする ---
        const fieldBounds = new Phaser.Geom.Rectangle(
            this.INVADER_FIELD_X,
            this.CONFIG.INVADER.FIELD_Y,
            this.CONFIG.INVADER.FIELD_WIDTH,
            this.CONFIG.INVADER.FIELD_HEIGHT
        );

        this.invaderBullets.getChildren().forEach(bullet => {
            if (bullet.active && bullet.y < fieldBounds.top) {
                bullet.setActive(false).setVisible(false);
            }
        });
        this.enemyBullets.getChildren().forEach(bullet => {
            if (bullet.active && (
                bullet.x < fieldBounds.left ||
                bullet.x > fieldBounds.right ||
                bullet.y < fieldBounds.top ||
                bullet.y > fieldBounds.bottom
            )) {
                bullet.setActive(false).setVisible(false);
            }
        });
        this.hpItems.getChildren().forEach(item => {
            if (item.active && item.y > fieldBounds.bottom) {
                item.setActive(false).setVisible(false);
            }
        });
    }

    // どの弾幕攻撃を発動させるかランダムに決定する
    triggerRandomAttack(x, y) {
        const attackType = Phaser.Math.Between(0, 3); // 新しい弾幕を追加したので、乱数の範囲を0-3に広げる
        switch (attackType) {
            case 0:
                this.fireFanDanmaku(x, y); // 扇状弾
                break;
            case 1:
                this.fireWaveDanmaku(x, y); // スパイラル弾
                break;
            case 2:
                this.fireAimedShot(x, y); // 狙撃弾
                break;
            case 3:
                this.fireCrossDanmaku(x, y); // 交差弾
                break;
        }
    }

    fireInvaderBullet(time) {
        const bullet = this.invaderBullets.get(this.invaderPlayer.x, this.invaderPlayer.y - 20);
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setVelocityY(-500); // Use a fixed speed for player bullets
            // 新しいエフェクト呼び出し
            this.effects.create('muzzle-flash', this.invaderPlayer.x, this.invaderPlayer.y - 20);
            // ショット音を再生
            this.seManager.play('shot', { volumeMultiplier: 0.2 });
            this.lastFired = time + this.CONFIG.INVADER.PLAYER_FIRE_DELAY;
        }
    }

    // パターン1: 扇状弾幕
    fireFanDanmaku(x, y) {
        const bulletCount = this.CONFIG.ATTACK.DANMAKU_BULLET_COUNT;
        const totalAngle = this.CONFIG.ATTACK.DANMAKU_ANGLE;
        const bulletSpeed = this.CONFIG.ATTACK.DANMAKU_BULLET_SPEED;

        // 弾が1つしかない場合は中央に発射
        const angleStep = bulletCount > 1 ? totalAngle / (bulletCount - 1) : 0; // 弾と弾の間の角度
        const startAngle = bulletCount > 1 ? -totalAngle / 2 : 0; // 最初の弾の角度

        for (let i = 0; i < bulletCount; i++) {
            const angle = startAngle + i * angleStep;
            // Phaserの角度は右が0度なので、下向き(90度)を基準に角度を計算
            const angleRad = Phaser.Math.DegToRad(angle + 90);

            const bullet = this.enemyBullets.get(x, y + 20);
            if (bullet) {
                bullet.setActive(true);
                bullet.setVisible(true);
                bullet.setTint(this.CONFIG.ATTACK.BULLET_COLORS.FAN);
                // 角度と速度からベクトルを計算して弾を発射
                this.physics.velocityFromRotation(angleRad, bulletSpeed, bullet.body.velocity);
            }
        }
    }

    // パターン2: ウェーブ弾幕
    // サインカーブを描くように弾を発射し、波のような弾幕を形成する
    fireWaveDanmaku(x, y) {
        const bulletSpeed = this.CONFIG.ATTACK.SPIRAL_BULLET_SPEED;
        const bulletCount = 7; // 1つの波に含まれる弾の数
        const waveWidth = 60; // 波の広がり角度
        const waveFrequency = 5; // 波の周波数

        // プレイヤーの方向を基準に角度を計算
        const angleToPlayer = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(x, y, this.invaderPlayer.x, this.invaderPlayer.y));

        for (let i = 0; i < bulletCount; i++) {
            // サインカーブに基づいて各弾の角度オフセットを計算
            const angleOffset = Math.sin(i / (bulletCount - 1) * Math.PI * waveFrequency) * (waveWidth / 2);
            const finalAngle = angleToPlayer + angleOffset;

            const bullet = this.enemyBullets.get(x, y + 20);
            if (bullet) {
                bullet.setActive(true);
                bullet.setVisible(true);
                bullet.setTint(this.CONFIG.ATTACK.BULLET_COLORS.SPIRAL);
                this.physics.velocityFromRotation(Phaser.Math.DegToRad(finalAngle), bulletSpeed, bullet.body.velocity);
            }
        }
    }

    // パターン3: 高速狙撃弾
    fireAimedShot(x, y, speed) {
        const bulletSpeed = speed || this.CONFIG.ATTACK.AIMED_BULLET_SPEED;
        const angle = Phaser.Math.Angle.Between(x, y, this.invaderPlayer.x, this.invaderPlayer.y);

        const bullet = this.enemyBullets.get(x, y + 20);
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setTint(this.CONFIG.ATTACK.BULLET_COLORS.AIMED);
            this.physics.velocityFromRotation(angle, bulletSpeed, bullet.body.velocity);
        }
    }

    // パターン4: 交差弾幕
    fireCrossDanmaku(x, y) {
        const bulletCount = this.CONFIG.ATTACK.CROSS_BULLET_COUNT;
        const bulletSpeed = this.CONFIG.ATTACK.CROSS_BULLET_SPEED;
        const angleOffset = this.CONFIG.ATTACK.CROSS_ANGLE_OFFSET;

        // 画面下部中央を狙う角度を基準にする
        const targetX = this.INVADER_FIELD_X + this.CONFIG.INVADER.FIELD_WIDTH / 2;
        const targetY = this.CONFIG.INVADER.FIELD_Y + this.CONFIG.INVADER.FIELD_HEIGHT;
        const baseAngle = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(x, y, targetX, targetY));

        // 左下方向へ発射
        for (let i = 0; i < bulletCount; i++) {
            const angle = baseAngle - angleOffset - (i * 5); // 少しずつ角度をずらす
            const bullet = this.enemyBullets.get(x, y + 20);
            if (bullet) {
                bullet.setActive(true).setVisible(true).setTint(this.CONFIG.ATTACK.BULLET_COLORS.CROSS);
                this.physics.velocityFromRotation(Phaser.Math.DegToRad(angle), bulletSpeed, bullet.body.velocity);
            }
        }
        // 右下方向へ発射
        for (let i = 0; i < bulletCount; i++) {
            const angle = baseAngle + angleOffset + (i * 5); // 少しずつ角度をずらす
            const bullet = this.enemyBullets.get(x, y + 20);
            if (bullet) {
                bullet.setActive(true).setVisible(true).setTint(this.CONFIG.ATTACK.BULLET_COLORS.CROSS);
                this.physics.velocityFromRotation(Phaser.Math.DegToRad(angle), bulletSpeed, bullet.body.velocity);
            }
        }
    }

    /**
     * すべての攻撃関連タイマーを停止・リセットします。
     * @private
     */
    _resetAllAttackTimers() {
        // ボスのメイン攻撃タイマー
        if (this.bossAttackTimer) {
            this.bossAttackTimer.destroy();
            this.bossAttackTimer = null;
        }
        // ボスの時間差攻撃タイマー
        this.bossAttackTimers.forEach(timer => timer.destroy());
        this.bossAttackTimers = [];
        // テトリスライン消しによる弾幕タイマー
        this.danmakuTimers.forEach(timer => timer.destroy());
        this.danmakuTimers = [];
    }

    // パターン4: ボス専用弾幕
    fireBossDanmaku(bossX, bossY) {
        const phaseConfig = this.CONFIG.BOSS.PHASE1;
        const bulletSpeed = phaseConfig.BULLET_SPEED;
        const waveCount = phaseConfig.WAVE_COUNT;
        const bulletsPerWave = phaseConfig.BULLETS_PER_WAVE;
        const waveDelay = phaseConfig.WAVE_DELAY;

        for (let i = 0; i < waveCount; i++) {
            const timer = this.time.delayedCall(i * waveDelay, () => {
                // ボス戦が終了しているか、ボスが非アクティブなら弾を撃たない
                if (!this.isBossBattle || !this.boss || !this.boss.active) return;
                // プレイヤーを狙う弾と、それを囲むように広がる弾を発射
                const angleToPlayer = Phaser.Math.Angle.Between(bossX, bossY, this.invaderPlayer.x, this.invaderPlayer.y);

                for (let j = 0; j < bulletsPerWave; j++) {
                    // 360度全方位に弾を発射し、プレイヤー方向の弾を少し速くする
                    const angle = (j / bulletsPerWave) * Math.PI * 2;
                    // 弾が下半分に向かう場合のみ発射
                    if (angle >= 0 && angle <= Math.PI) {
                        const finalSpeed = (Math.abs(angle - angleToPlayer) < phaseConfig.AIMED_ANGLE_TOLERANCE) ? bulletSpeed * phaseConfig.AIMED_SPEED_MULTIPLIER : bulletSpeed;
                        const bullet = this.enemyBullets.get(bossX, bossY);
                        if (bullet) {
                            bullet.setActive(true).setVisible(true).setTint(phaseConfig.TINT);
                            this.physics.velocityFromRotation(angle, finalSpeed, bullet.body.velocity);
                        }
                    }
                }
            });
            this.bossAttackTimers.push(timer);
        }
    }

    // パターン5: ボス第2形態専用弾幕 (回転弾幕)
    fireBossPhase2Danmaku(bossX, bossY) {
        const phaseConfig = this.CONFIG.BOSS.PHASE2;

        // 新しい攻撃パターンを開始する前に、既存の時間差攻撃タイマーをクリアします。
        // メインの攻撃タイマー(bossAttackTimer)は維持します。
        this.bossAttackTimers.forEach(timer => timer.destroy());
        this.bossAttackTimers = [];
        const bulletSpeed = phaseConfig.BULLET_SPEED;
        const streams = phaseConfig.STREAMS;
        const bulletsPerStream = phaseConfig.BULLETS_PER_STREAM;
        const streamDelay = phaseConfig.STREAM_DELAY;
        const rotationSpeed = phaseConfig.ROTATION_SPEED;

        for (let i = 0; i < bulletsPerStream; i++) {
            const timer = this.time.delayedCall(i * streamDelay, () => {
                // ボス戦が終了しているか、ボスが非アクティブなら弾を撃たない
                if (!this.isBossBattle || !this.boss || !this.boss.active) return;
                for (let j = 0; j < streams; j++) {
                    const angle = this.spiralAngle + (j * (Math.PI * 2 / streams));
                    const normalizedAngle = Phaser.Math.Angle.Wrap(angle); // 角度を -PI から PI の範囲に正規化

                    // 弾が下半分に向かう場合のみ発射
                    if (normalizedAngle >= 0 && normalizedAngle <= Math.PI) {
                        const bullet = this.enemyBullets.get(this.boss.x, this.boss.y);
                        if (bullet) {
                            bullet.setActive(true).setVisible(true).setTint(phaseConfig.TINT);
                            this.physics.velocityFromRotation(normalizedAngle, bulletSpeed, bullet.body.velocity);
                        }
                    }
                }
                this.spiralAngle += rotationSpeed; // 次の弾のために角度を更新
            });
            this.bossAttackTimers.push(timer);
        }
    }

    // パターン6: ボス第3形態専用弾幕 (回転レーザー + 狙撃)
    fireBossPhase3Danmaku(bossX, bossY) {
        const phaseConfig = this.CONFIG.BOSS.PHASE3;

        // 新しい攻撃パターンを開始する前に、既存の攻撃タイマーをすべてクリアする
        // メインの攻撃タイマー(bossAttackTimer)は維持し、時間差攻撃用のタイマーのみクリアします。
        this.bossAttackTimers.forEach(timer => timer.destroy());
        this.bossAttackTimers = [];
        // --- 攻撃1: 低速高密度スパイラル（壁） ---
        for (let i = 0; i < phaseConfig.WALL_BULLETS; i++) {
            const timer = this.time.delayedCall(i * phaseConfig.WALL_DELAY, () => {
                // ボス戦が終了しているか、ボスが非アクティブなら弾を撃たない
                if (!this.isBossBattle || !this.boss || !this.boss.active) return;
                for (let j = 0; j < phaseConfig.WALL_STREAMS; j++) {
                    const angle = this.spiralAngle + (j * (Math.PI * 2 / phaseConfig.WALL_STREAMS));
                    const normalizedAngle = Phaser.Math.Angle.Wrap(angle); // 角度を -PI から PI の範囲に正規化
                    if (normalizedAngle >= 0 && normalizedAngle <= Math.PI) {
                        const bullet = this.enemyBullets.get(this.boss.x, this.boss.y);
                        if (bullet) {
                            bullet.setActive(true).setVisible(true).setTint(phaseConfig.WALL_TINT);
                            this.physics.velocityFromRotation(normalizedAngle, phaseConfig.WALL_SPEED, bullet.body.velocity);
                        }
                    }
                }
                this.spiralAngle += phaseConfig.WALL_ROTATION;
            });
            this.bossAttackTimers.push(timer);
        }

        // --- 攻撃2: 超高速ピンポイント狙撃（槍） ---
        for (let i = 0; i < phaseConfig.SPEAR_COUNT; i++) {
            const timer = this.time.delayedCall(i * phaseConfig.SPEAR_DELAY, () => {
                // ボス戦が終了しているか、ボスが非アクティブなら弾を撃たない
                if (this.isBossBattle && this.boss && this.boss.active) this.fireAimedShot(this.boss.x, this.boss.y, phaseConfig.SPEAR_SPEED);
            });
            this.bossAttackTimers.push(timer);
        }

        // --- 攻撃3: 時間差V字レーザー（薙ぎ払い） ---
        const vLaserTimer = this.time.delayedCall(phaseConfig.V_LASER_DELAY, () => { // 少し遅れて発動
            // ボス戦が終了しているか、ボスが非アクティブなら弾を撃たない
            if (!this.isBossBattle || !this.boss || !this.boss.active) return;
            const angleToPlayer = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.invaderPlayer.x, this.invaderPlayer.y));
            for (let i = 0; i < phaseConfig.V_LASER_COUNT; i++) {
                // 左右対称に発射
                const leftAngle = Phaser.Math.DegToRad(angleToPlayer - phaseConfig.V_LASER_ANGLE);
                const rightAngle = Phaser.Math.DegToRad(angleToPlayer + phaseConfig.V_LASER_ANGLE);
                const bulletL = this.enemyBullets.get(this.boss.x + i * Math.cos(leftAngle) * 10, this.boss.y + i * Math.sin(leftAngle) * 10);
                const bulletR = this.enemyBullets.get(this.boss.x + i * Math.cos(rightAngle) * 10, this.boss.y + i * Math.sin(rightAngle) * 10);
                if (bulletL) {
                    bulletL.setActive(true).setVisible(true).setTint(phaseConfig.V_LASER_TINT);
                    this.physics.velocityFromRotation(leftAngle, phaseConfig.V_LASER_SPEED, bulletL.body.velocity);
                }
                if (bulletR) {
                    bulletR.setActive(true).setVisible(true).setTint(phaseConfig.V_LASER_TINT);
                    this.physics.velocityFromRotation(rightAngle, phaseConfig.V_LASER_SPEED, bulletR.body.velocity);
                }
            }
        });
        this.bossAttackTimers.push(vLaserTimer);
    }

    createInvaderWave() {
        const rows = 5; // 縦の行数
        const cols = 7; // 横の列数を7に変更
        const xOffset = this.INVADER_FIELD_X + 40;
        const yOffset = this.CONFIG.INVADER.FIELD_Y + 50;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const invaderX = xOffset + x * 40;
                const invaderY = yOffset + y * 30;
                const invader = this.invaders.create(invaderX, invaderY, 'invader_enemy');

                // --- 当たり判定を調整 ---
                // 見た目(32x24)よりも当たり判定を小さく(28x20)して、より正確な射撃を要求する
                invader.body.setSize(28, 20);
                invader.body.setOffset(2, 2); // (32-28)/2, (24-20)/2

                // ランダムな色を設定し、データとして保持
                const color = Phaser.Utils.Array.GetRandom(this.THEME.ENEMY_COLORS);
                invader.setTint(color);
                invader.setData('baseColor', color);
                // インベーダーにユニークな列IDを付与する (行と列の組み合わせ)
                // これにより、後から追加される行が既存の列判定に影響を与えなくなる
                invader.setData('columnId', `${y}-${x}`);
            }
        }
    }

    hitInvader(bullet, invader) {
        const destroyedY = invader.y; // 破壊されたインベーダーのY座標を保持

        // 弾と敵を非アクティブ化して画面から消す
        bullet.setActive(false).setVisible(false).destroy();
        invader.setActive(false).setVisible(false).destroy();

        // 新しいエフェクト呼び出し
        this.effects.create('enemy-explosion', invader.x, invader.y, { color: invader.tintTopLeft });

        // 敵破壊時のSEを再生
        this.seManager.play('enemy_explosion_se');

        // HP回復アイテムを確率でドロップ
        if (Math.random() < this.CONFIG.INVADER.ITEM_DROP_CHANCE) {
            this.dropHpItem(invader.x, invader.y);
        }

        // 横一列が全滅したかチェック
        const remainingInvaders = this.invaders.getChildren();
        // 破壊されたインベーダーと同じY座標を持つものが他にいないかチェック
        const isRowCleared = !remainingInvaders.some(remInvader => remInvader.y === destroyedY);

        if (isRowCleared) {
            console.log("Invader row cleared.");
            this.invaderRowsClearedForAttack++; // 消した行数をカウント

            // 2行消すごとにおじゃまを1行送る
            if (this.invaderRowsClearedForAttack >= 2) {
                console.log("2 invader rows cleared. Attacking Tetris side!");
                this.triggerInvaderAttackAnimation(this.CONFIG.ATTACK.INVADER_ROW_CLEAR_GARBAGE);
                this.invaderRowsClearedForAttack -= 2; // カウンターをリセット
            }
        }

        // 全てのインベーダーを倒したかチェック
        // ボス戦中でない場合のみ、ウェーブクリアの処理を行う
        if (remainingInvaders.length === 0 && !this.isBossBattle) {
            console.log("Wave cleared! Attacking Tetris side.");
            this.triggerInvaderAttackAnimation(this.CONFIG.ATTACK.INVADER_WAVE_CLEAR_GARBAGE);
            // 新しいインベーダーのウェーブを生成
            this.invaderMoveInterval *= 0.9; // 少しスピードアップ
            this.createInvaderWave();
        }
    }

    hitBoss(boss, bullet) {
        // 形態変化アニメーション中は無敵にする
        if (this.isBossTransitioning) {
            // 弾だけ消してダメージ処理は行わない
            bullet.setActive(false).setVisible(false).destroy();
            return;
        }

        // --- ボス被弾エフェクトの強化 ---
        this.effects.create('hit-spark', bullet.x, bullet.y);

        // ボス被弾SEを再生 (敵破壊音を少し小さくして使用)
        this.seManager.play('enemy_explosion_se', { volumeMultiplier: 0.8 });

        bullet.setActive(false).setVisible(false).destroy();
        this.bossHP--;

        // ボス本体が一瞬白く点滅する
        // setTintFillではなくsetTintを使い、clearTintでリセットできるようにする
        boss.setTint(0xffffff);
        this.time.delayedCall(80, () => {
            if (boss.active) {
                // Tintをクリアする。これにより、updateループ内のBGM連動エフェクトが
                // 再び適用されるようになる。
                boss.clearTint();
            }
        });

        // HPバーを更新
        this.updateBossHPBar();

        // HPが半分になり、まだフェーズ1の場合、フェーズ2に移行
        if (this.bossHP <= (this.bossMaxHP * this.CONFIG.BOSS.PHASE_2_HP_THRESHOLD) && this.bossPhase === 1) {
            this.transitionToBossPhase2();
        }
        // HPが1/3になり、まだフェーズ2の場合、フェーズ3に移行
        else if (this.bossHP <= (this.bossMaxHP * this.CONFIG.BOSS.PHASE_3_HP_THRESHOLD) && this.bossPhase === 2) {
            this.transitionToBossPhase3();
        }

        // HPが0になったらボスを倒す
        if (this.bossHP <= 0) {
            this.defeatBoss();
        }
    }


    hitPlayer(player, bullet) {
        // ボス戦が終了し、ボスオブジェクトが破棄された直後に、
        // まだ画面に残っている弾との当たり判定が発生するのを防ぐ。
        // isBossBattleフラグがfalseになった後でもこのチェックは有効。
        if (this.isBossBattle === false && this.boss === null) {
            return;
        }

        // プレイヤーがすでに被弾中（無敵時間中）なら何もしない
        if (player.getData('isHit')) {
            return;
        }

        // HPを減少させ、ゲームオーバーかチェック
        this.invaderPlayerHP--;
        this.updateInvaderPlayerHPBar();
        if (this.invaderPlayerHP <= 0) {
            this.gameOver("INVADER LOST: Player destroyed");
            return;
        }
        // 弾を消す
        bullet.setActive(false).setVisible(false).destroy();

        // --- 被弾エフェクトをリッチにする ---
        // 新しいエフェクト呼び出し
        this.effects.create('player-hit', player.x, player.y);

        // 被弾SEを再生
        this.seManager.play('hidan_se', { volumeMultiplier: 0.8 });

        // プレイヤーを被弾状態にする
        player.setData('isHit', true);
        // プレイヤーを半透明にして点滅させる
        this.tweens.add({
            targets: player,
            alpha: { from: 0.3, to: 0.8 },
            duration: this.CONFIG.INVADER.PLAYER_HIT_DURATION,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: this.CONFIG.INVADER.PLAYER_HIT_REPEAT,
            onComplete: () => {
                player.setAlpha(1.0); // 点滅終了後、透明度を元に戻す
                player.setData('isHit', false); // 被弾状態を解除
            }
        });
    }

    dropHpItem(x, y) {
        const item = this.hpItems.get(x, y, 'hp_item');
        if (item) {
            item.setActive(true).setVisible(true);
            item.body.setVelocityY(120); // アイテムの落下速度
            item.body.setAngularVelocity(Phaser.Math.Between(-100, 100)); // 少し回転させる
        }
    }

    collectHpItem(player, item) {
        // アイテムを非アクティブ化
        item.setActive(false).setVisible(false).destroy();

        // HPを回復 (最大HPを超えないように)
        this.invaderPlayerHP = Math.min(this.invaderPlayerMaxHP, this.invaderPlayerHP + this.CONFIG.INVADER.HP_RECOVERY_AMOUNT);

        // HPバーを更新
        this.updateInvaderPlayerHPBar();

        // 回復エフェクト
        this.effects.create('hp-recovery', player.x, player.y);

        // 回復音を再生
        this.seManager.play('hp_recovery_se');
    }

    addInvaderRows(rowCount) {
        if (!this.invaders) return;

        // おじゃま攻撃着弾エフェクト
        const fieldX = this.INVADER_FIELD_X;
        const fieldWidth = this.CONFIG.INVADER.FIELD_WIDTH;
        const topY = this.CONFIG.INVADER.FIELD_Y;
        for (let i = 0; i < 15; i++) {
            const randomX = fieldX + Math.random() * fieldWidth;
            // フィールドの上から下にパーティクルを放出
            const particles = this.add.particles('particle_texture', { x: randomX, y: topY, speedY: { min: 50, max: 150 }, lifespan: 600, scale: { start: 0.7, end: 0 }, color: [ 0xffffff, this.THEME.ACCENT1 ], blendMode: 'ADD', emitting: false });
            particles.explode(3);
        }
        const yShift = rowCount * this.CONFIG.INVADER.ENEMY_ADD_ROW_HEIGHT;

        // 既存の敵を下にずらす
        this.invaders.getChildren().forEach(invader => {
            invader.y += yShift;
            // デッドラインを超えたかチェック
            if (invader.y + invader.height / 2 > this.CONFIG.INVADER.FIELD_Y + this.CONFIG.INVADER.FIELD_HEIGHT - 40) {
                this.gameOver("INVADER LOST: Invaders pushed to the bottom");
            }
        });

        // 新しい敵の列を一番上に生成
        const newInvaderTopY = this.CONFIG.INVADER.FIELD_Y + 50;
        const cols = 7; // 横の列数を7に変更
        const xOffset = this.INVADER_FIELD_X + 40;

        for (let y = 0; y < rowCount; y++) {
            for (let x = 0; x < cols; x++) {
                const invaderX = xOffset + x * 40;
                const invaderY = newInvaderTopY + y * 30;
                const invader = this.invaders.create(invaderX, invaderY, 'invader_enemy');
                const color = Phaser.Utils.Array.GetRandom(this.THEME.ENEMY_COLORS);
                invader.setTint(color);
                invader.setData('baseColor', color);
                // 新しく追加するインベーダーにもユニークな列IDを付与する
                invader.setData('columnId', `new-${y}-${x}`); // 新しい行であることがわかるようにプレフィックスを追加
            }
        }
    }

    startBossBattle() {
        if (this.isBossBattle) return;
        console.log("TETRIS! Starting Boss Battle!");
        this.isBossBattle = true;

        // 既存のインベーダーを全滅させる
        this.invaders.clear(true, true);

        // 既存の弾幕攻撃タイマーをすべてキャンセル
        this.danmakuTimers.forEach(timer => timer.destroy());
        this.danmakuTimers = [];

        // ボスを生成
        this.bossHP = this.bossMaxHP;
        const bossX = this.INVADER_FIELD_X + this.CONFIG.INVADER.FIELD_WIDTH / 2;
        const bossY = this.CONFIG.INVADER.FIELD_Y + 100;
        this.boss = this.physics.add.sprite(bossX, bossY, 'invader_boss');
        this.boss.setImmovable(true); // ボスは弾で動かないようにする

        // ボスとの当たり判定を設定
        this.physics.add.overlap(this.invaderBullets, this.boss, this.hitBoss, null, this);

        // HPバーを表示
        this.bossHPBar.setVisible(true);
        this.updateBossHPBar();

        // ボスの攻撃タイマーを開始
        if (this.bossAttackTimer) this.bossAttackTimer.destroy();
        this.bossAttackTimer = this.time.addEvent({
            delay: 2000, // 2秒ごとに攻撃
            callback: () => {
                if (this.boss && this.boss.active) {
                    this.fireBossDanmaku(this.boss.x, this.boss.y);
                }
            },
            loop: true
        });
    }

    defeatBoss() {
        if (!this.isBossBattle) return;
        console.log("Boss defeated!");

        // ボスオブジェクトを破棄する前に位置情報を保存
        const bossX = this.boss.x;
        const bossY = this.boss.y;

        // ボス戦終了フラグを立てる（最優先）
        this.isBossBattle = false;

        // 1. すべての攻撃タイマーをリセット
        this._resetAllAttackTimers();
        // 2. ボス本体と関連オブジェクトを破棄
        this.boss.destroy();
        this.boss = null;
        this.bossPhase = 1; // フェーズをリセット
        this.bossHPBar.setVisible(false);


        // 3. 画面上に残っている敵の弾をすべて消去する
        // clear(true, true) は、グループ内のすべての子をアクティブでなくし、シーンから削除し、破棄します。
        this.enemyBullets.clear(true, true);

        // 4. 撃破エフェクトとテトリス側への攻撃
        // 新しいエフェクト呼び出し
        this.effects.create('boss-explosion', bossX, bossY);

        // ボス撃破SEを再生
        this.seManager.play('boss_gekiha_se');

        this.triggerInvaderAttackAnimation(3);

        // ボス出現のクールダウンを開始
        this.isBossSpawnOnCooldown = true;
        console.log(`Boss spawn cooldown started (${this.CONFIG.BOSS.SPAWN_COOLDOWN / 1000}s).`);
        if (this.bossCooldownTimer) this.bossCooldownTimer.destroy();
        this.bossCooldownTimer = this.time.delayedCall(this.CONFIG.BOSS.SPAWN_COOLDOWN, () => {
            this.isBossSpawnOnCooldown = false;
            console.log("Boss spawn cooldown finished.");
        }, [], this);

        // 5. 少し待ってから新しいインベーダーのウェーブを生成
        this.time.delayedCall(2000, this.createInvaderWave, [], this);
    }

    transitionToBossPhase2() {
        if (!this.boss) return;
        this.isBossTransitioning = true; // 形態変化アニメーション開始
        const phaseConfig = this.CONFIG.BOSS.PHASE2;
        this.bossPhase = 2;
        console.log("Boss entering Phase 2!");

        // 攻撃タイマーを一旦停止
        if (this.bossAttackTimer) this.bossAttackTimer.paused = true;

        // 1. 画面上の弾をすべて消去
        this.enemyBullets.clear(true, true);

        // 溜めSEを再生
        this.seManager.play('tame_se', { volumeMultiplier: 0.5 });

        // 2. 溜め演出 (収縮して白く光る)
        this.tweens.add({
            targets: this.boss,
            scale: 0.8,
            duration: 800, // 溜めの時間を長くする
            ease: 'Power2.easeIn', // よりゆっくりと溜めるイージングに変更
            onStart: () => {
                if (this.boss && this.boss.active) this.boss.setTintFill(0xffffff);
            },
            onComplete: () => {
                // 3. 解放演出 (拡大してエフェクト発生)
                this.effects.shakeInvaderField(300, 4);
                // 解放SEを再生
                this.seManager.play('kaihou_se');
                this.effects.create('enemy-explosion', this.boss.x, this.boss.y, { color: phaseConfig.TINT });

                this.tweens.add({
                    targets: this.boss,
                    scale: 1.0, // 元のサイズに戻る
                    duration: 250, // 解放も少しゆっくりに
                    ease: 'Elastic.easeOut', // 弾むような解放感のあるイージングに変更
                    onComplete: () => {
                        if (this.boss && this.boss.active) {
                            this.boss.clearTint();
                            this.boss.setTint(phaseConfig.TINT);
                        }
                        // 4. 新しい攻撃パターンのタイマーを再開
                        if (this.bossAttackTimer) {
                            this.bossAttackTimer.callback = () => {
                                if (this.boss && this.boss.active) this.fireBossPhase2Danmaku(this.boss.x, this.boss.y);
                            };
                            this.bossAttackTimer.delay = phaseConfig.ATTACK_DELAY;
                            this.bossAttackTimer.paused = false;
                            this.isBossTransitioning = false; // 形態変化アニメーション終了
                        }
                    }
                });
            }
        });
    }

    transitionToBossPhase3() {
        if (!this.boss) return;
        this.isBossTransitioning = true; // 形態変化アニメーション開始
        const phaseConfig = this.CONFIG.BOSS.PHASE3;
        this.bossPhase = 3;
        console.log("Boss entering FINAL Phase!");

        // 攻撃タイマーを一旦停止
        if (this.bossAttackTimer) this.bossAttackTimer.paused = true;

        // 1. 画面上の弾をすべて消去
        this.enemyBullets.clear(true, true);

        // 溜めSEを再生
        this.seManager.play('tame_se', { volumeMultiplier: 0.7 });

        // 2. 溜め演出 (さらに小さく、激しく光る)
        this.tweens.add({
            targets: this.boss,
            scale: 0.6,
            duration: 1000, // 最終形態への溜めをさらに長く
            ease: 'Power2.easeIn',
            onStart: () => {
                if (this.boss && this.boss.active) this.boss.setTintFill(0xffffff);
            },
            onComplete: () => {
                // 3. 解放演出 (より激しいエフェクト)
                this.effects.shakeInvaderField(500, 8);
                // 解放SEを再生
                this.seManager.play('kaihou_se');
                this.effects.create('boss-explosion', this.boss.x, this.boss.y); // 撃破時と同じ派手なエフェクト

                this.tweens.add({
                    targets: this.boss,
                    scale: 1.0, // 元のサイズに戻る
                    duration: 300, // 解放も少しゆっくりに
                    ease: 'Elastic.easeOut.config(1, 0.5)', // 弾むイージングを調整
                    onComplete: () => {
                        if (this.boss && this.boss.active) {
                            this.boss.clearTint();
                            this.boss.setTint(phaseConfig.WALL_TINT);
                        }
                        // 4. 新しい攻撃パターンのタイマーを再開
                        if (this.bossAttackTimer) {
                            this.bossAttackTimer.callback = () => {
                                if (this.boss && this.boss.active) this.fireBossPhase3Danmaku(this.boss.x, this.boss.y);
                            };
                            this.bossAttackTimer.delay = phaseConfig.ATTACK_DELAY;
                            this.bossAttackTimer.paused = false;
                            this.isBossTransitioning = false; // 形態変化アニメーション終了
                        }
                    }
                });
            }
        });
    }

    updateBossHPBar() {
        this.bossHPBar.clear();
        const barWidth = this.CONFIG.INVADER.FIELD_WIDTH - 20;
        const hpPercentage = this.bossHP / this.bossMaxHP;
        this.bossHPBar.fillStyle(0xff0000, 1);
        this.bossHPBar.fillRect(this.INVADER_FIELD_X + 10, this.CONFIG.INVADER.FIELD_Y + 10, barWidth * hpPercentage, 20);
        this.bossHPBar.lineStyle(2, 0xffffff, 1);
        this.bossHPBar.strokeRect(this.INVADER_FIELD_X + 10, this.CONFIG.INVADER.FIELD_Y + 10, barWidth, 20);
    }

    updateInvaderPlayerHPBar() {
        this.invaderPlayerHPBar.clear();
        this.invaderPlayerHPBar.setDepth(100); // 常に最前面に表示
        const totalWidth = 240; // HPバー全体の幅
        const barHeight = 16;
        const barY = this.CONFIG.INVADER.FIELD_Y + this.CONFIG.INVADER.FIELD_HEIGHT + 20; // 枠外下へのマージンを調整
        const barX = this.INVADER_FIELD_X + (this.CONFIG.INVADER.FIELD_WIDTH - totalWidth) / 2;
        const segmentCount = this.invaderPlayerMaxHP;
        const segmentWidth = totalWidth / segmentCount;
        const segmentGap = 3; // セグメント間の隙間
    
        // HPラベルの位置を更新
        this.invaderPlayerHPLabel.setX(barX - 10);
        this.invaderPlayerHPLabel.setY(barY + barHeight / 2);
    
        // カラーパレット
        const colorFull = Phaser.Display.Color.ValueToColor(0x00ff9f); // ネオングリーン
        const colorMid = Phaser.Display.Color.ValueToColor(0xffff00);  // 黄色
        const colorLow = Phaser.Display.Color.ValueToColor(0xff3333);  // 明るい赤
    
        for (let i = 0; i < segmentCount; i++) {
            const segmentX = barX + i * segmentWidth;
            const hpRatio = (i + 1) / segmentCount;
    
            // HP残量に応じて色を決定
            let segmentColor;
            if (hpRatio > 0.5) {
                segmentColor = Phaser.Display.Color.Interpolate.ColorWithColor(colorMid, colorFull, 0.5, (hpRatio - 0.5) * 2);
            } else {
                segmentColor = Phaser.Display.Color.Interpolate.ColorWithColor(colorLow, colorMid, 0.5, hpRatio * 2);
            }
    
            // HPがある部分のセグメントを描画
            if (i < this.invaderPlayerHP) {
                // グロー（内側の明るい部分）
                this.invaderPlayerHPBar.fillStyle(Phaser.Display.Color.GetColor(255, 255, 255), 0.7);
                this.invaderPlayerHPBar.fillRect(segmentX, barY + 4, segmentWidth - segmentGap, barHeight - 8);
                // 本体
                this.invaderPlayerHPBar.fillStyle(Phaser.Display.Color.GetColor(segmentColor.r, segmentColor.g, segmentColor.b), 1.0);
                this.invaderPlayerHPBar.fillRect(segmentX, barY, segmentWidth - segmentGap, barHeight);
            } else {
                // HPがない部分の背景
                this.invaderPlayerHPBar.fillStyle(0x261447, 0.5); // 暗い背景色
                this.invaderPlayerHPBar.fillRect(segmentX, barY, segmentWidth - segmentGap, barHeight);
            }
        }
    }

    /**
     * スローモーションを開始します。
     */
    startSlowMotion() {
        if (this.isSlowMotionActive) return;
        this.isSlowMotionActive = true;
        // this.time.timeScale = 0.5; // ゲーム全体の速度変更は削除
    }

    /**
     * スローモーションを停止します。
     */
    stopSlowMotion() {
        if (!this.isSlowMotionActive) return;
        this.isSlowMotionActive = false;
        // this.time.timeScale = 1.0; // ゲーム全体の速度変更は削除
    }

    /**
     * スローモーションゲージの状態を更新します。
     * @param {number} delta - 前フレームからの経過時間(ms)
     */
    updateSlowMotion(delta) {
        const consumptionRate = 0.5; // ゲージ消費速度
        const recoveryRate = 0.2;    // ゲージ回復速度

        if (this.isSlowMotionActive) {
            this.slowMotionGauge -= consumptionRate * (delta / 16.67); // 60fps基準で消費
            if (this.slowMotionGauge <= 0) {
                this.slowMotionGauge = 0;
                this.stopSlowMotion();
            }
        } else {
            this.slowMotionGauge += recoveryRate * (delta / 16.67); // 60fps基準で回復
            if (this.slowMotionGauge > this.slowMotionMaxGauge) {
                this.slowMotionGauge = this.slowMotionMaxGauge;
            }
        }
    }

    /**
     * スローモーションゲージのUIを更新します。
     */
    updateSlowMotionGaugeBar() {
        // createで生成されるため、存在しない場合は何もしない
        if (!this.slowMotionGaugeBar) return;
        this.slowMotionGaugeBar.clear();

        const totalWidth = 240;
        const barHeight = 10;
        const barY = this.CONFIG.INVADER.FIELD_Y + this.CONFIG.INVADER.FIELD_HEIGHT + 20 + 16 + 5; // HPバーの下に移動
        const barX = this.INVADER_FIELD_X + (this.CONFIG.INVADER.FIELD_WIDTH - totalWidth) / 2;
        const gaugePercentage = this.slowMotionGauge / this.slowMotionMaxGauge;

        this.slowMotionGaugeLabel.setX(barX - 10).setY(barY + barHeight / 2);
        this.slowMotionGaugeBar.fillStyle(0x00ffff, 0.8);
        this.slowMotionGaugeBar.fillRect(barX, barY, totalWidth * gaugePercentage, barHeight);
    }

    // =================================================================
    // ゲーム全体関連のメソッド
    // =================================================================

    /**
     * [デバッグ用] 'B'キーで強制的にボス戦を開始します。
     */
    debug_forceStartBossBattle() {
        // すでにボス戦中なら何もしない
        if (this.isBossBattle) {
            console.log("DEBUG: Boss battle is already active.");
            return;
        }

        console.log("DEBUG: Forcing boss battle to start via 'B' key...");

        // クールダウンタイマーが動いていれば停止・破棄
        if (this.bossCooldownTimer) {
            this.bossCooldownTimer.destroy();
            this.bossCooldownTimer = null;
        }
        // クールダウンフラグをリセット
        this.isBossSpawnOnCooldown = false;

        // ボス戦を開始
        this.startBossBattle();
    }

     /**
     * テトリスフィールドの各列で最も上にあるブロックを見つけます。
     * @returns {Array<{x: number, y: number, color: number}>} 各列の最も高いブロック情報の配列
     */
    _findTopmostBlocksByColumn() {
        const topBlocks = [];
        for (let c = 0; c < this.CONFIG.TETRIS.COLS; c++) {
            for (let r = 0; r < this.CONFIG.TETRIS.ROWS; r++) {
                const color = this.tetrisGrid[r][c];
                if (color !== 0 && color !== this.CONFIG.TETRIS.GARBAGE_COLOR) {
                    topBlocks.push({
                        x: this.CONFIG.TETRIS.FIELD_X + (c + 0.5) * this.CONFIG.TETRIS.BLOCK_SIZE,
                        y: this.CONFIG.TETRIS.FIELD_Y + (r + 0.5) * this.CONFIG.TETRIS.BLOCK_SIZE,
                        color: color
                    });
                    break; // この列の探索は終了し、次の列へ
                }
            }
        }
        return topBlocks;
    }

    /**
     * テトリス側の光の柱エフェクトを更新します。
     */
    updateTetrisLightPillar() {
        const pillar = this.tetrisLightPillarGraphics;
        if (!pillar) return;

        const topBlocks = this._findTopmostBlocksByColumn();

        pillar.clear();

        if (topBlocks.length === 0) {
            return;
        }

        const barWidth = this.CONFIG.TETRIS.BLOCK_SIZE; // ブロック幅に合わせる
        const maxHeight = 250; // 柱の最大長を大きくする
        const numLayers = 5;

        // BGMの低音域の強さを取得
        let beatIntensity = 0; // 最小の明るさを確保
        if (this.frequencyData) {
            // LayerTetrisのロジックを流用: 高音域に反応させる
            const trebleSlice = this.frequencyData.slice(60, 110);
            const treble = trebleSlice.reduce((a, b) => a + b, 0) / trebleSlice.length;
            // 高音域の音量(40-120程度)を0-1の強度にマッピング
            const normalizedBeat = Math.max(0, Math.min(1, (treble - 40) / 80));
            // 指数関数を使って、ビートへの反応をより急峻にする
            beatIntensity = Math.pow(normalizedBeat, 2);
        }

        // 各列の最上部ブロックから柱を描画
        topBlocks.forEach(block => {
            let pillarHeight = maxHeight * Math.sqrt(beatIntensity);

            // 柱がフィールドの上端からはみ出さないように高さを制限する
            const maxAllowedHeight = block.y - this.CONFIG.TETRIS.FIELD_Y;
            if (pillarHeight > maxAllowedHeight) {
                pillarHeight = maxAllowedHeight;
            }

            if (pillarHeight > 0) {
                // 複数の矩形を重ねてグラデーションを表現する安定した方式に戻す
                for (let i = 0; i < numLayers; i++) {
                    const layerAlpha = (0.1 + beatIntensity * 0.9) * (1 - i / numLayers);
                    const layerHeight = pillarHeight * ((numLayers - i) / numLayers);
                    pillar.fillStyle(block.color, layerAlpha * 0.2); // 透明度をさらに下げる (0.3 -> 0.2)
                    pillar.fillRect(block.x - barWidth / 2, block.y - layerHeight, barWidth, layerHeight);
                }
            }
        });
    }


    gameOver(message) {
        if (this.isGameOver) return;
        this.isGameOver = true;
        console.log(`GAME OVER: ${message}`);

        // --- ゲームオーバー時にすべての動作を完全に停止させる ---
        // 1. 物理エンジンを停止
        this.physics.pause();

        // 2. すべてのTween、タイマー、パーティクルを停止
        this.time.timeScale = 0;

        // ゲーム操作を不能にするためのオーバーレイ
        const veil = this.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.7 } });
        veil.fillRect(0, 0, this.sys.game.config.width, this.sys.game.config.height);
        veil.setDepth(99);

        // --- 勝敗テキストの決定 ---
        let winnerText = '';
        let winnerColor = '#ffffff';
        if (message.includes('TETRIS LOST')) {
            winnerText = 'INVADER WIN';
            winnerColor = this.THEME.ACCENT2; // マゼンタ
        } else if (message.includes('INVADER LOST')) {
            winnerText = 'TETRIS WIN';
            winnerColor = this.THEME.ACCENT1; // ネオングリーン
        }

        // ゲームオーバーテキストを表示
        const text = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 - 100, winnerText, {
            fontSize: '64px',
            fontFamily: '"Courier New", Courier, monospace',
            // fill: winnerColor, // グラデーションで色付けするため、fillは使わない
            align: 'center',
            stroke: '#000000',      // 黒い縁取りを追加して視認性を向上
            strokeThickness: 8    // 縁取りの太さ
        }).setOrigin(0.5).setDepth(100);

        // --- テキストにグラデーションを適用して視認性を向上 ---
        const gradient = text.context.createLinearGradient(0, 0, 0, text.height);
        if (winnerText === 'INVADER WIN') {
            gradient.addColorStop(0, '#ff79ff'); // 明るいマゼンタ
            gradient.addColorStop(1, '#f038ff'); // 元のマゼンタ
        } else { // TETRIS WIN
            gradient.addColorStop(0, '#79ffdf'); // 明るいネオングリーン
            gradient.addColorStop(1, '#00ff9f'); // 元のネオングリーン
        }
        text.setFill(gradient);

        // リトライボタン
        const retryButton = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 50, 'Retry', {
            fontSize: '32px',
            fontFamily: '"Courier New", Courier, monospace',
            fill: '#00ff9f',
            align: 'center'
        }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true });

        retryButton.on('pointerdown', () => {
            // 停止した時間を元に戻す
            this.time.timeScale = 1;
            this.physics.resume();
            this.scene.restart();
        });
        retryButton.on('pointerover', () => retryButton.setFill('#ffffff'));
        retryButton.on('pointerout', () => retryButton.setFill('#00ff9f'));

        // タイトルへ戻るボタン
        const titleButton = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 120, 'Back to Title', {
            fontSize: '32px',
            fontFamily: '"Courier New", Courier, monospace',
            fill: '#f038ff',
            align: 'center'
        }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true });

        titleButton.on('pointerdown', () => {
            // 停止した時間を元に戻す
            this.time.timeScale = 1;
            this.physics.resume();
            // BGMの状態をリセット
            this.bgmManager.reset();
            // BGMの音量を元に戻しておく
            this.bgmManager.bgmPlayer.volume = document.getElementById('bgm-volume').value;
            this.scene.start('TitleScene');
        });
        titleButton.on('pointerover', () => titleButton.setFill('#ffffff'));
        titleButton.on('pointerout', () => titleButton.setFill('#f038ff'));
    }

    /**
     * 水平に走るスキャンラインエフェクトを生成します。
     * @param {number} y - 発生元のY座標
     * @param {number} color - ラインの色
     */
    createScanLineEffect(y, color) {
        const line = this.add.graphics();
        line.setDepth(1);
        const fieldX = this.CONFIG.TETRIS.FIELD_X;
        const fieldWidth = this.CONFIG.TETRIS.COLS * this.CONFIG.TETRIS.BLOCK_SIZE;

        this.tweens.add({
            targets: { alpha: 1, height: 15 },
            alpha: 0,
            height: 1,
            duration: 300,
            ease: 'Cubic.easeOut',
            onUpdate: (tween) => {
                const currentAlpha = tween.targets[0].alpha;
                const currentHeight = tween.targets[0].height;
                line.clear();
                line.fillStyle(color, currentAlpha);
                line.fillRect(fieldX, y - currentHeight / 2, fieldWidth, currentHeight);
            },
            onComplete: () => {
                line.destroy();
            }
        });
    }

    // =================================================================
    // 一時停止メニュー関連のメソッド
    // =================================================================

    /**
     * ゲームの一時停止状態を切り替えます。
     */
    togglePause() {
        // ゲームオーバー時はポーズ不可
        if (this.isGameOver) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.physics.pause();
            this.tweens.pauseAll();
            this.time.paused = true;
            this.bgmManager.bgmPlayer.pause();
            this.createPauseMenu();
        } else {
            this.resumeGame();
        }
    }

    /**
     * 一時停止メニューを作成します。
     */
    createPauseMenu() {
        this.pauseMenuContainer = this.add.container(0, 0).setDepth(101);

        const veil = this.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.7 } });
        veil.fillRect(0, 0, this.sys.game.config.width, this.sys.game.config.height);

        const resumeButton = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 - 50, 'RESUME', {
            fontSize: '48px', fill: '#00ff9f'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const titleButton = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 50, 'BACK TO TITLE', {
            fontSize: '48px', fill: '#f038ff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        resumeButton.on('pointerdown', () => this.togglePause());
        resumeButton.on('pointerover', () => resumeButton.setFill('#ffffff'));
        resumeButton.on('pointerout', () => resumeButton.setFill('#00ff9f'));

        titleButton.on('pointerdown', () => {
            // ゲームを再開せずに状態をリセットしてタイトルへ戻る
            this.isPaused = false;
            this.time.paused = false; // シーン遷移が止まらないように時間だけは元に戻す
            this.physics.resume();    // 物理エンジンも再開させておく

            // シーンを終了する前に、手動でクリーンアップ処理を呼び出す
            this.shutdown();

            this.bgmManager.reset();
            this.scene.start('TitleScene');
        });
        titleButton.on('pointerover', () => titleButton.setFill('#ffffff'));
        titleButton.on('pointerout', () => titleButton.setFill('#f038ff'));

        this.pauseMenuContainer.add([veil, resumeButton, titleButton]);
    }

    /**
     * ゲームを再開します。
     * @param {boolean} [resumeAudio=true] BGMを再開するかどうか
     */
    resumeGame(resumeAudio = true) {
        if (this.pauseMenuContainer) {
            this.pauseMenuContainer.destroy();
            this.pauseMenuContainer = null;
        }

        this.physics.resume();
        this.tweens.resumeAll();
        this.time.paused = false;
        if (resumeAudio) {
            this.bgmManager.bgmPlayer.play();
        }
        this.isPaused = false;
    }

    /**
     * BGMと連動する光の柱エフェクトを生成します。
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} color - 色
     * @param {number} duration - 持続時間 (ms)
     * @param {number} [scale=1.0] - スケール
     */
    createLightPillarEffect(x, y, color, duration, scale = 1.0) {
        const pillar = this.add.graphics();
        pillar.setDepth(0); // 他のエフェクトの背後に

        const barWidth = this.CONFIG.TETRIS.BLOCK_SIZE * scale; // ブロック幅に合わせる
        const maxHeight = 150 * scale;
        const numLayers = 5; // グラデーションを表現するためのレイヤー数

        const tween = this.tweens.add({
            targets: { value: 1 },
            value: 0,
            duration: duration,
            ease: 'Cubic.easeOut',
            onUpdate: () => {
                const baseAlpha = tween.getValue();

                // BGMの低音域の強さを取得
                let beatIntensity = 0.1; // 最小の明るさを確保
                if (this.frequencyData) {
                    const bass = (this.frequencyData[1] + this.frequencyData[2] + this.frequencyData[3]) / 3;
                    beatIntensity = Math.min(1, bass / 180); // 180を最大値として正規化
                }

                let pillarHeight = maxHeight * beatIntensity * baseAlpha;

                // 柱がフィールドの上端からはみ出さないように高さを制限する
                const maxAllowedHeight = y - this.CONFIG.TETRIS.FIELD_Y;
                if (pillarHeight > maxAllowedHeight) {
                    pillarHeight = maxAllowedHeight;
                }

                pillar.clear();
                if (pillarHeight > 0) {
                    // 複数の矩形を重ねてグラデーションを表現
                    for (let i = 0; i < numLayers; i++) {
                        const layerAlpha = (baseAlpha * (0.1 + beatIntensity * 0.9)) * (1 - i / numLayers);
                        const layerHeight = pillarHeight * ((numLayers - i) / numLayers);
                        pillar.fillStyle(color, layerAlpha * 0.2); // 透明度をさらに下げる (0.4 -> 0.2)
                        pillar.fillRect(x - barWidth / 2, y - layerHeight, barWidth, layerHeight);
                    }
                }
            },
            onComplete: () => {
                pillar.destroy();
            }
        });
    }
}

export default GameScene;
