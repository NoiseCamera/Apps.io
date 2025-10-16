class InvaderAI {
    constructor(scene) {
        // =================================================================
        // AIの挙動設定
        // =================================================================
        this.CONFIG = {
            // --- 速度 ---
            NORMAL_SPEED: 380,      // 通常時の移動速度 (少し速く)
            EVADING_SPEED: 420,     // 回避中の移動速度 (より機敏に)
            EVASION_BRAKE_FACTOR: 0.9, // 回避中に目標に近づいた際の減速率

            // --- 索敵 ---
            TARGET_ACQUISITION_INTERVAL: 250, // ターゲットを再評価する間隔 (ms)
            TARGET_SCORE_ROW_CLEAR_BONUS: 10000, // 横一列をクリアすることへの評価点
            TARGET_SCORE_HEIGHT_WEIGHT: 100,  // ターゲット評価における高さの重要度
            TARGET_SCORE_DISTANCE_WEIGHT: -1.5, // ターゲット評価における距離の重要度（近いほど良い）を少し上げる

            // --- 射撃 ---
            BULLET_SPEED: 500,      // 偏差射撃の計算に使う弾の速度
            SHOOTING_TOLERANCE: 12, // ターゲットの予測位置に対して、この範囲内(px)にいれば射撃する (精度を少し上げる)

            // --- 回避 ---
            EVASION_SCAN_STEP: 15,              // 安全な場所を探す際の走査間隔 (px)
            EVASION_SAFE_THRESHOLD: 0,          // この危険度スコア以下なら「安全」とみなす(0が安全)
            EVASION_PREDICTION_TIME_LIMIT: Infinity, // 弾道を予測する時間の上限を撤廃。神は未来永劫を見通す
            EVASION_SAFETY_MARGIN: 8,           // 安全マージンを少し広げ、過度なギリギリ回避を抑制
            EVASION_DANGER_SENSITIVITY: 2.5,    // 危険度スコアの感度。値が大きいほど遠くの弾にも敏感に反応する
            ITEM_PATH_CHECK_STEPS: 5,           // 回復アイテムへの経路の安全性を確認する分割数
            BOSS_EVASION_DANGER_SENSITIVITY: 4.0, // ボス戦での危険度感度を大幅に引き上げ、超反応にする
            BOSS_CENTER_WEIGHT: 2.0,            // ボス戦で中央に留まることへの評価点 (攻撃ウェイトと同等レベルに)
            SCORE_WEIGHT_SAFETY: 3000,          // 場所評価における「安全性」の重要度
            BOSS_SCORE_WEIGHT_SAFETY: 4500,     // ボス戦での「安全性」の重要度を調整し、攻撃とのバランスを取る
            SCORE_WEIGHT_ATTACK: 10.0,          // 攻撃の重要度をさらに引き上げ、より積極的に攻撃位置を取るようにする
            SLOW_MOTION_DANGER_THRESHOLD: 1.5,  // スローモーション発動の閾値を上げ、滅多に使わないようにする
            SLOW_MOTION_GAUGE_THRESHOLD: 30,    // ゲージがこの値以下ならスローモーションを温存 (少し高めに)
            SCORE_WEIGHT_ITEM_RECOVERY: 70000,  // 場所評価における「HP回復」の重要度（緊急時）

            LOW_HP_THRESHOLD: 0.3,              // このHP割合以下を「危険な状態」と判断する (30%)

            MOVEMENT_COST_WEIGHT: 0,            // 移動コストを無効化。神は移動距離を気にしない
            TARGET_UPDATE_SCORE_THRESHOLD: 500, // このスコア差以上でないと移動目標を更新しない
            SHOOTING_DANGER_THRESHOLD: 0.3,     // 射撃判断の危険度閾値 (より安全な時でないと撃たない)
            // --- その他 ---
            MOVEMENT_STOP_TOLERANCE: 10, // 目標地点との距離がこの値(px)未満の場合、振動を防ぐために停止する
        };
        // =================================================================

        this.scene = scene;
        this.player = scene.invaderPlayer;

        this.target = null; // 現在のターゲット
        this.targetAcquisitionTimer = 0;

        // --- 回避ロジック用の設定 ---
        this.isEvading = false; // 回避行動中かどうかのフラグ
        this.movementTargetX = this.player.x; // AIが目指すX座標
        this.lastMoveDirection = 0; // 最後に移動した方向 (-1:左, 1:右)
    }

    update(time, delta) {
        if (!this.player || !this.player.active) return;

        // 常にターゲットを意識する
        this.targetAcquisitionTimer += delta;
        if (this.targetAcquisitionTimer > this.CONFIG.TARGET_ACQUISITION_INTERVAL || !this.target || !this.target.active) {
            this.findTarget();
            this.targetAcquisitionTimer = 0;
        }

        // 思考ルーチンを通常時とボス戦で統一
        this.updateNormal(time, delta);
    }

    /** 通常戦での思考・行動ロジック */
    updateNormal(time, delta) {
        // --- 0. スローモーションの判断 (毎フレーム行う) ---
        this.decideSlowMotion(time);

        // --- 1. 移動の決定（毎フレーム思考する） ---
        const { targetX, isEvading } = this.decideMoveDirection(time);
        this.movementTargetX = targetX; // 移動目標を更新
        this.isEvading = isEvading; // 回避状態を更新

        let speed = this.isEvading ? this.CONFIG.EVADING_SPEED : this.CONFIG.NORMAL_SPEED;

        // AIもスローモーションの影響を受けるようにする
        if (this.scene.isSlowMotionActive) {
            speed /= 2;
        }

        const direction = this.movementTargetX - this.player.x;
        // 目的地が近い場合はブレーキをかける（振動防止）
        if (Math.abs(direction) < this.CONFIG.MOVEMENT_STOP_TOLERANCE) {
            this.player.body.setVelocityX(direction * this.CONFIG.EVASION_BRAKE_FACTOR);
        } else {
            this.player.body.setVelocityX(Math.sign(direction) * speed);
        }

        // --- 2. 射撃の決定 ---
        // 現在地の危険度が十分に低い場合のみ射撃を試みる
        const threats = this._getThreats();

        // ボス戦では危険度に関わらず常に射撃を試みる
        if (this.scene.isBossBattle) {
            this.shootAtTarget(time);
        } else {
            // 通常時は安全な時だけ射撃
            const currentDanger = this.getDangerScore(this.player.x, threats);
            if (currentDanger < this.CONFIG.SHOOTING_DANGER_THRESHOLD) this.shootAtTarget(time);
        }
    }

    findTarget() {
        // ボス戦中はボスを最優先ターゲットにする
        // isBossBattleフラグがtrueの間は、常にボスをターゲットとして設定し続ける。
        // これにより、ボスの出現直後やフェーズ移行時などにターゲットを見失うことを防ぐ。
        if (this.scene.isBossBattle) {
            if (this.scene.boss && this.scene.boss.active) {
            this.target = this.scene.boss;
            }
            return;
        }

        const invaders = this.scene.invaders.getChildren().filter(inv => inv.active);
        if (invaders.length === 0) {
            this.target = null;
            return;
        }

        // 1. インベーダーをY座標（行）でグループ化する
        const rows = invaders.reduce((acc, invader) => {
            const y = invader.y;
            if (!acc[y]) {
                acc[y] = [];
            }
            acc[y].push(invader);
            return acc;
        }, {});

        // 2. 各インベーダーの「戦略的価値」を評価する
        const scoredInvaders = invaders.map(invader => {
            let score = 0;
            const rowInvaders = rows[invader.y];

            // 評価1: 横列クリアボーナス (最優先)
            // その行の残りインベーダーが少ないほど、クリアボーナスが高くなる
            score += (1 / rowInvaders.length) * this.CONFIG.TARGET_SCORE_ROW_CLEAR_BONUS;

            // 評価2: 高さボーナス
            score += invader.y * this.CONFIG.TARGET_SCORE_HEIGHT_WEIGHT;

            // 評価3: 近さペナルティ (自分から遠いほどスコアが下がる)
            const distanceX = Math.abs(this.player.x - invader.x);
            score += distanceX * this.CONFIG.TARGET_SCORE_DISTANCE_WEIGHT;

            return { invader: invader, score: score };
        });

        // 最もスコアの高いインベーダーをターゲットに設定
        scoredInvaders.sort((a, b) => b.score - a.score);

        this.target = scoredInvaders[0].invader;
    }

    /**
     * 状況に応じてスローモーションを発動・停止するか判断する
     */
    decideSlowMotion() {
        const threats = this._getThreats();
        const currentDanger = this.getDangerScore(this.player.x, threats);

        // 危険度が閾値を超え、かつゲージが十分にある場合、スローモーションを発動
        if (currentDanger > this.CONFIG.SLOW_MOTION_DANGER_THRESHOLD && this.scene.slowMotionGauge > this.CONFIG.SLOW_MOTION_GAUGE_THRESHOLD) {
            this.scene.startSlowMotion();
        }
        // 危険度が低い、またはゲージが少ない場合はスローモーションを停止
        else if (this.scene.isSlowMotionActive) {
            if (currentDanger < this.CONFIG.SLOW_MOTION_DANGER_THRESHOLD * 0.5 || this.scene.slowMotionGauge <= 0) {
                this.scene.stopSlowMotion();
            }
        }
    }

    /**
     * 偏差射撃のために狙うべきX座標を計算します。
     * @param {number} [playerX=this.player.x] - 射撃主体のX座標。省略時は現在のプレイヤー位置。
     * @returns {number} 狙うべきX座標
     */
    getAimX(playerX = this.player.x) {
        if (!this.target) return this.player.x;

        const distanceY = Math.abs(this.player.y - this.target.y);
        const timeToHit = distanceY / this.CONFIG.BULLET_SPEED;

        // ボスのサインカーブ移動を予測して偏差射撃を行う
        if (this.scene.isBossBattle) {
            // GameSceneのボスの動きの計算式を元に、timeToHit秒後のX座標を予測する
            const futureTime = this.scene.time.now + (timeToHit * 1000); // timeToHitは秒なのでmsに変換
            const fieldCenterX = this.scene.INVADER_FIELD_X + this.scene.CONFIG.INVADER.FIELD_WIDTH / 2;
            const amplitude = this.scene.CONFIG.INVADER.FIELD_WIDTH / 2 - 50;
            
            // sin(time / 2000) の部分を再現
            const predictedBossX = fieldCenterX + Math.sin(futureTime / 2000) * amplitude;

            return predictedBossX;
        }

        // 通常のインベーダーの動きを予測
        const timeToNextMove = this.scene.invaderMoveInterval - this.scene.invaderMoveTimer;
        const numMoves = Math.max(0, Math.floor((timeToHit - timeToNextMove) / this.scene.invaderMoveInterval) + 1);
        return this.target.x + (numMoves * this.scene.invaderMoveDir * this.scene.invaderMoveSpeed);
    }
    
    /**
     * ターゲットに向かって射撃します。
     * @param {number} time - 現在のゲーム時間
     */
    shootAtTarget(time) {
        if (!this.target) return;

        // --- 偏差射撃ロジック ---
        // 1. 弾がターゲットに到達するまでの時間を計算
        const distanceY = Math.abs(this.player.y - this.target.y);
        const timeToHit = distanceY / this.CONFIG.BULLET_SPEED;

        const aimX = this.getAimX();
        // 弾がターゲットに到達する前にターゲットが非アクティブになる可能性がある場合は射撃しない
        if (timeToHit < 0) return;

        const playerX = this.player.x;

        // 予測位置のほぼ真下にいて、クールダウンが終わっていれば射撃
        if (Math.abs(aimX - playerX) < this.CONFIG.SHOOTING_TOLERANCE && time > this.scene.lastFired) {
            this.scene.fireInvaderBullet(time);
        }
    }

    // --- ここから回避ロジック ---

    /**
     * AIの移動方向を決定するメイン関数。
     * @returns {{targetX: number, isEvading: boolean}} 移動目標のX座標と回避状態
     */
    decideMoveDirection(time) {
        const threats = this._getThreats();
        const hpItems = this._getHpItems();

        // 1. フィールド全体をスキャンして、最善手を探す
        const positionsToScan = this._getFullScanPositions();
        const { bestPosition, bestScore } = this._findBestPositionIn(positionsToScan, threats, hpItems);

        // 2. 移動目標を更新
        const targetX = bestPosition;

        // 3. 回避状態を判断
        // 現在地の危険度と、移動先の危険度を比較して、回避中かどうかを判断する
        const currentDanger = this.getDangerScore(this.player.x, threats);
        const targetDanger = this.getDangerScore(targetX, threats);
        const isEvading = targetDanger < currentDanger;
        
        return { targetX: targetX, isEvading: isEvading };
    }

    /**
     * フィールド全体をスキャンするための座標リストを生成する
     * @returns {number[]}
     */
    _getFullScanPositions() {
        const positions = [];
        const fieldStartX = this.scene.INVADER_FIELD_X + this.player.body.width / 2;
        const fieldEndX = this.scene.INVADER_FIELD_X + this.scene.CONFIG.INVADER.FIELD_WIDTH - this.player.body.width / 2;
        for (let x = fieldStartX; x <= fieldEndX; x += this.CONFIG.EVASION_SCAN_STEP) {
            positions.push(x);
        }
        return positions;
    }

    /**
     * 指定された座標リストの中から、最も評価の高い位置を見つける。
     * @param {number[]} positions - 評価対象のX座標の配列
     * @param {Phaser.GameObjects.Sprite[]} threats - 脅威となる弾のリスト
     * @param {Phaser.GameObjects.Sprite[]} hpItems - HP回復アイテムのリスト
     * @returns {{bestPosition: number, bestScore: number}} 最も評価の高いX座標と、そのスコア
     */
    _findBestPositionIn(positions, threats, hpItems) {
        let bestPosition = this.player.x;
        let bestScore = -Infinity;

        positions.forEach(x => {
            const score = this.evaluatePosition(x, threats, hpItems);
            if (score > bestScore) {
                bestScore = score;
                bestPosition = x;
            }
        });

        return { bestPosition, bestScore };
    }

    /**
     * 指定された位置の危険度スコアを計算する。
     * @param {number} x - 評価するX座標
     * @param {Phaser.GameObjects.Sprite[]} threats - 脅威となる弾のリスト
     * @returns {number} 危険度スコア (0が安全、値が大きいほど危険)
     */
    getDangerScore(x, threats) {
        // ボス戦かどうかでパラメータを切り替える
        const isBossBattle = this.scene.isBossBattle;
        const dangerSensitivity = isBossBattle ? this.CONFIG.BOSS_EVASION_DANGER_SENSITIVITY : this.CONFIG.EVASION_DANGER_SENSITIVITY;
        const safetyMargin = this.CONFIG.EVASION_SAFETY_MARGIN;

        let dangerScore = 0;
        threats.forEach(bullet => {
            const bulletVy = bullet.body.velocity.y;
            const distanceY = this.player.y - bullet.y;
            const timeToImpact = distanceY / bulletVy;

            // 弾が自分に到達するまでの時間と、衝突予測に基づいて危険度を計算
            if (timeToImpact > 0 && timeToImpact < this.CONFIG.EVASION_PREDICTION_TIME_LIMIT) {
                const predictedBulletX = bullet.x + bullet.body.velocity.x * timeToImpact;
                if (Math.abs(x - predictedBulletX) < (this.player.body.width / 2 + bullet.displayWidth / 2 + safetyMargin)) {
                    // 時間が近いほど危険度が高くなるように指数関数でスコア付け
                    dangerScore += Math.exp(-timeToImpact * dangerSensitivity);
                }
            }
        });
        return dangerScore;
    }

    evaluatePosition(x, threats, hpItems, safetyOnly = false) {
        const safetyWeight = this.scene.isBossBattle ? this.CONFIG.BOSS_SCORE_WEIGHT_SAFETY : this.CONFIG.SCORE_WEIGHT_SAFETY;
        const safetyMargin = this.CONFIG.EVASION_SAFETY_MARGIN;

        // --- 評価1: 安全性スコア ---
        const dangerScore = this.getDangerScore(x, threats);
        let safetyScore = -dangerScore;
 
        // --- 評価2: 攻撃スコア（ターゲットへの射線確保） ---
        // 攻撃の評価をより洗練させる
        let attackScore = 0;
        // 射線が通っているか（ターゲットの真下に近いか）を評価する
        if (this.target && !safetyOnly) {
            // この場所 'x' に移動した場合の、偏差射撃目標地点との距離を評価する
            // これにより、移動後に即座に攻撃できる位置を高く評価する
            const aimX = this.getAimX(x); // 評価地点xを基準に偏差射撃位置を計算
            const distanceToAim = Math.abs(x - aimX); // 評価地点xと、そこから狙うべき位置との差

            // 偏差射撃の目標地点との距離が近いほど、攻撃スコアは高くなる
            // (フィールド幅 - 距離) でスコアを算出
            attackScore = this.scene.CONFIG.INVADER.FIELD_WIDTH - distanceToAim;
        }

        // --- 評価3: 中央維持スコア（ボス戦のみ） ---
        let centerScore = 0;
        // ボス戦の場合、中央に近いほど評価を高くする
        if (this.scene.isBossBattle) {
            const fieldCenterX = this.scene.INVADER_FIELD_X + this.scene.CONFIG.INVADER.FIELD_WIDTH / 2;
            const distanceFromCenter = Math.abs(x - fieldCenterX);
            centerScore = (this.scene.CONFIG.INVADER.FIELD_WIDTH / 2 - distanceFromCenter) * this.CONFIG.BOSS_CENTER_WEIGHT;
        }

        // --- 評価4: HP回復アイテムスコア ---
        let recoveryScore = 0;
        const hpRatio = this.scene.invaderPlayerHP / this.scene.invaderPlayerMaxHP;

        // HPが満タンでない場合、回復アイテムを評価する
        if (hpRatio < 1.0 && hpItems.length > 0) {
            let maxItemScore = 0;
            hpItems.forEach(item => {
                // --- アイテムへの経路の安全性をチェック ---
                let isPathSafe = true;
                const pathSteps = this.CONFIG.ITEM_PATH_CHECK_STEPS;
                // 評価対象の地点 'x' からアイテムまでの経路をチェックする
                for (let i = 1; i <= pathSteps; i++) {
                    const checkX = x + (item.x - x) * (i / pathSteps); // 評価地点xからアイテムへの線分上の点
                    const checkY = this.player.y + (item.y - this.player.y) * (i / pathSteps);

                    for (const bullet of threats) {
                        const timeToReachCheckY = (checkY - bullet.y) / bullet.body.velocity.y;
                        if (timeToReachCheckY > 0 && timeToReachCheckY < this.CONFIG.EVASION_PREDICTION_TIME_LIMIT) {
                            const predictedBulletX = bullet.x + bullet.body.velocity.x * timeToReachCheckY;
                            if (Math.abs(checkX - predictedBulletX) < (this.player.body.width / 2 + bullet.displayWidth / 2 + safetyMargin)) {
                                isPathSafe = false;
                                break;
                            }
                        }
                    }
                    if (!isPathSafe) break;
                }

                // 安全な経路が確保されているアイテムのみスコアを計算
                if (isPathSafe) {
                    // アイテムの価値 (画面幅 - アイテムまでの水平距離)
                    const itemValue = this.scene.CONFIG.INVADER.FIELD_WIDTH - Math.abs(x - item.x);
                    // この場所xからアイテムを取得するための移動コスト (現在地からの移動距離)
                    const moveCost = Math.abs(x - this.player.x);
                    const currentItemScore = itemValue - moveCost;

                    if (currentItemScore > maxItemScore) maxItemScore = currentItemScore;
                }
            });
            // 失っているHPの割合に応じてスコアをスケーリングする
            // HPが少ないほど、回復の価値が高まる
            recoveryScore = maxItemScore * (1.0 - hpRatio);
        }

        // --- 評価5: 移動コスト ---
        // 現在地から評価地点xまでの距離をコストとする
        const movementCost = Math.abs(x - this.player.x);

        // --- 総合スコア ---
        return (safetyScore * safetyWeight) + (attackScore * this.CONFIG.SCORE_WEIGHT_ATTACK) + centerScore + (recoveryScore * this.CONFIG.SCORE_WEIGHT_ITEM_RECOVERY) + (movementCost * this.CONFIG.MOVEMENT_COST_WEIGHT);
    }

    /**
     * 脅威となる敵の弾をリストアップして返す。
     * @returns {Phaser.GameObjects.Sprite[]}
     */
    _getThreats() {
        return this.scene.enemyBullets.getChildren().filter(bullet =>
            bullet.active &&
            bullet.body.velocity.y > 0 && // 下に向かっている
            bullet.y < this.player.y + 20 // プレイヤーより少し下まで見る
        );
    }

    /**
     * フィールド上のHP回復アイテムをリストアップして返す。
     * @returns {Phaser.GameObjects.Sprite[]}
     */
    _getHpItems() {
        return this.scene.hpItems.getChildren().filter(item => item.active);
    }
}
export default InvaderAI;
