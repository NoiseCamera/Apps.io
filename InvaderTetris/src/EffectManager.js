/**
 * ゲーム内の視覚エフェクトを管理するクラス。
 * パーティクル、衝撃波、カメラシェイクなどを一元的に扱う。
 */
class EffectManager {
    constructor(scene) {
        this.scene = scene;
        this.THEME = scene.THEME;

        // パーティクル用のテクスチャが存在しない場合、動的に生成する
        if (!this.scene.textures.exists('particle_texture')) {
            const particleGraphics = this.scene.add.graphics();
            particleGraphics.fillStyle(0xffffff, 1.0);
            particleGraphics.fillRect(0, 0, 8, 8);
            particleGraphics.generateTexture('particle_texture', 8, 8);
            particleGraphics.destroy();
        }
    }

    /**
     * 指定された種類のエフェクトを生成します。
     * @param {string} type - エフェクトの種類 ('muzzle-flash', 'hit-spark', 'enemy-explosion', 'boss-explosion', 'player-hit', 'line-clear', 'block-land')
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {object} [options={}] - 追加オプション (例: { color: 0xff0000 })
     */
    create(type, x, y, options = {}) {
        switch (type) {
            case 'muzzle-flash':
                this._createBurst(x, y, 0xffa500, 12, { start: 0.7, end: 0 }, { min: 150, max: 300 }, 150, 0, { min: -110, max: -70 });
                break;

            case 'hit-spark':
                this._createBurst(x, y, options.color || 0xffffff, 15, { start: 0.8, end: 0 }, { min: 100, max: 250 }, 300);
                this._createShockwave(x, y, options.color || 0xffffff, 0.3, 250);
                break;

            case 'enemy-explosion':
                this._createBurst(x, y, options.color || this.THEME.ACCENT1, 30, { start: 1.0, end: 0 }, { min: 100, max: 400 }, 600, 200);
                this._createShockwave(x, y, options.color || this.THEME.ACCENT1, 0.5, 300);
                break;

            case 'boss-explosion':
                this._createBurst(x, y, 0xffffff, 200, { start: 1.5, end: 0 }, { min: 200, max: 800 }, 1500, 100);
                this._createShockwave(x, y, 0xffffff, 2.0, 800);
                this.shakeInvaderField(1000, 10);
                break;

            case 'player-hit':
                this.shakeInvaderField(150, 5);
                this._fieldFlash(this.scene.INVADER_FIELD_X, this.scene.CONFIG.INVADER.FIELD_Y, this.scene.CONFIG.INVADER.FIELD_WIDTH, this.scene.CONFIG.INVADER.FIELD_HEIGHT, 0xff0000, 250);
                this._createBurst(x, y, 0xffffff, 20, { start: 0.8, end: 0 }, { min: 80, max: 250 }, 500, 200);
                break;

            case 'hp-recovery':
                this._createBurst(x, y, 0x00ff00, 20, { start: 1, end: 0 }, 150, 400);
                break;
            
            // (ここに他のエフェクトを追加可能)
        }
    }

    /**
     * パーティクルバーストエフェクトを生成します。
     * @private
     */
    _createBurst(x, y, color, count = 10, scale = { start: 0.8, end: 0 }, speed = 150, lifespan = 300, gravityY = 0, angle = null) {
        // Phaser 3.60以降のワンオフエフェクト用の記述。
        // このメソッドは内部的にエミッタマネージャーを作成し、エフェクト終了後に自動で破棄します。
        const manager = this.scene.add.particles(x, y, 'particle_texture', {
            tint: { start: 0xffffff, end: color },
            lifespan: lifespan,
            speed: speed,
            angle: angle,
            scale: scale,
            gravityY: gravityY,
            blendMode: 'ADD'
            // emitting: false を指定すると、explodeが呼ばれる前にマネージャーが破棄されてしまうため削除
        });
        manager.explode(count);
    }

    /**
     * 衝撃波エフェクトを生成します。
     * @private
     */
    _createShockwave(x, y, color, scale = 1.0, duration = 400) {
        const shockwave = this.scene.add.graphics();
        shockwave.setPosition(x, y);
        shockwave.setDepth(1);

        this.scene.tweens.add({
            targets: { value: 0 },
            value: 1,
            duration: duration,
            ease: 'Quad.easeOut',
            onUpdate: (tween) => {
                const t = tween.getValue();
                const radius = 200 * t * scale;
                const alpha = 1 - t;
                const innerRadius = radius - (20 * (1 - t) * scale);

                shockwave.clear();
                if (radius > 0 && innerRadius > 0) {
                    shockwave.fillStyle(color, alpha);
                    shockwave.beginPath();
                    shockwave.arc(0, 0, radius, 0, Math.PI * 2, false);
                    shockwave.arc(0, 0, innerRadius, 0, Math.PI * 2, true);
                    shockwave.closePath();
                    shockwave.fillPath();
                }
            },
            onComplete: () => {
                shockwave.destroy();
            }
        });
    }

    /**
     * 指定された範囲にフラッシュエフェクトをかけます。
     * @private
     */
    _fieldFlash(x, y, width, height, color = 0xffffff, duration = 150) {
        const flashRect = this.scene.add.graphics();
        flashRect.setDepth(2);
        flashRect.fillStyle(color);
        flashRect.fillRect(x, y, width, height);

        this.scene.tweens.add({
            targets: flashRect,
            alpha: { from: 0.8, to: 0 },
            duration: duration,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                flashRect.destroy();
            }
        });
    }

    /**
     * インベーダーフィールドの枠線とグリッドを揺らします。
     */
    shakeInvaderField(duration = 100, intensity = 5) {
        const targets = [this.scene.invaderBorderGraphics, this.scene.invaderGridGraphics];
        targets.forEach(target => {
            if (!target) return;
            const originalX = target.x;
            const originalY = target.y;

            this.scene.tweens.add({
                targets: target,
                x: { from: originalX - intensity, to: originalX + intensity, duration: duration / 4, ease: 'Sine.easeInOut', yoyo: true, repeat: 1 },
                y: { from: originalY - intensity, to: originalY + intensity, duration: duration / 4, ease: 'Sine.easeInOut', yoyo: true, repeat: 1 },
                duration: duration,
                onComplete: () => {
                    target.setPosition(originalX, originalY);
                }
            });
        });
    }
}

export default EffectManager;