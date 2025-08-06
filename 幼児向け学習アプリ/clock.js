document.addEventListener('DOMContentLoaded', () => {
    class ClockGame {
        constructor() {
            // DOM Elements
            this.canvas = document.getElementById('clock-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.questionText = document.getElementById('question-text');
            this.controlsDiv = document.getElementById('controls');
            this.feedbackDiv = document.getElementById('feedback');
            this.modeButtons = document.querySelectorAll('.mode-btn');
            this.correctSound = document.getElementById('correct-sound');
            this.incorrectSound = document.getElementById('incorrect-sound');
            this.advancedModeToggle = document.getElementById('advanced-mode-toggle');
            this.minuteDisplayToggle = document.getElementById('minute-display-toggle');

            // このゲームで使う効果音のリスト
            this.SOUND_EFFECTS = [
                'assets/sounds/seikai.mp3',
                'assets/sounds/incorrect.mp3'
            ];

            // State
            this.state = {
                mode: 'read', // 'read' or 'set'
                hour: 12,
                minute: 0,
                targetHour: 0,
                targetMinute: 0,
                isDragging: null, // 'hour', 'minute', or null
                isAnswered: false,
                isAdvancedMode: false, // 「ほんもの とけい」モードの状態
                showMinuteNumbers: false, // 分の数字を表示するかの状態
                bgmInitialized: false,
            };

            // Bind `this` for event handlers
            this.handleModeChange = this.handleModeChange.bind(this);
            this.handleMouseDown = this.handleMouseDown.bind(this);
            this.handleMouseMove = this.handleMouseMove.bind(this);
            this.handleMouseUp = this.handleMouseUp.bind(this);

            this.init();
        }

        // --- Initialization ---
        init() {
            this.modeButtons.forEach(btn => {
                btn.addEventListener('click', this.handleModeChange);
            });
            this.advancedModeToggle.addEventListener('change', (e) => {
                this.state.isAdvancedMode = e.target.checked;
                this.draw(); // モードを切り替えたら時計を再描画
            });
            this.minuteDisplayToggle.addEventListener('change', (e) => {
                this.state.showMinuteNumbers = e.target.checked;
                this.draw(); // モードを切り替えたら時計を再描画
            });
            this.switchMode('read');
            document.body.addEventListener('click', this.initializeBgm.bind(this), { once: true });
            document.body.addEventListener('touchstart', this.initializeBgm.bind(this), { once: true });
        }

        initializeBgm() {
            if (this.state.bgmInitialized) return;
            const bgm = document.getElementById('bgm');
            if (bgm) {
                bgm.play().catch(error => console.log('BGMの再生にはユーザーの操作が必要です。', error));
            }
            if (typeof preloadAudioSources === 'function') {
                preloadAudioSources(this.SOUND_EFFECTS);
            }
            this.state.bgmInitialized = true;
        }

        // --- Event Listener Management ---
        addEventListeners() {
            this.canvas.addEventListener('mousedown', this.handleMouseDown);
            window.addEventListener('mousemove', this.handleMouseMove);
            window.addEventListener('mouseup', this.handleMouseUp);
            // Touch support
            this.canvas.addEventListener('touchstart', this.handleMouseDown, { passive: false });
            window.addEventListener('touchmove', this.handleMouseMove, { passive: false });
            window.addEventListener('touchend', this.handleMouseUp);
        }

        removeEventListeners() {
            this.canvas.removeEventListener('mousedown', this.handleMouseDown);
            window.removeEventListener('mousemove', this.handleMouseMove);
            window.removeEventListener('mouseup', this.handleMouseUp);
            this.canvas.removeEventListener('touchstart', this.handleMouseDown);
            window.removeEventListener('touchmove', this.handleMouseMove);
            window.removeEventListener('touchend', this.handleMouseUp);
        }

        // --- Mode Switching ---
        handleModeChange(e) {
            this.switchMode(e.target.dataset.mode);
        }

        switchMode(newMode) {
            if (this.state.mode === newMode && newMode !== 'read') return;
            this.state.mode = newMode;

            this.modeButtons.forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.mode === newMode);
            });

            // Add a class to the container for mode-specific styling
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.classList.remove('read-mode', 'set-mode');
                gameContainer.classList.add(`${newMode}-mode`);
            }

            this.removeEventListeners(); // Clean up old listeners
            this.addEventListeners();    // Add new listeners

            if (newMode === 'read') this.setupReadMode();
            else this.setupSetMode();
        }
        // --- Mode Setups ---
        setupReadMode() {
            this.state.isAnswered = false;
            this.questionText.textContent = 'この とけいは なんじかな？';
            this.feedbackDiv.textContent = '';
            this.feedbackDiv.className = '';
            this.canvas.style.cursor = 'default';

            // Generate a random time for the clock face
            this.state.hour = Math.floor(Math.random() * 12) + 1;
            this.state.minute = Math.floor(Math.random() * 12) * 5;

            // Create answer choices
            const correctAnswer = { h: this.state.hour, m: this.state.minute };
            const choices = [correctAnswer];
            while (choices.length < 4) {
                const wrongHour = Math.floor(Math.random() * 12) + 1;
                const wrongMinute = Math.floor(Math.random() * 12) * 5;
                if (!choices.some(c => c.h === wrongHour && c.m === wrongMinute)) {
                    choices.push({ h: wrongHour, m: wrongMinute });
                }
            }

            // Shuffle choices
            choices.sort(() => Math.random() - 0.5);

            const choiceButtonsHTML = choices.map(choice => {
                const timeString = `${choice.h}じ ${choice.m === 0 ? 'ちょうど' : `${choice.m}ふん`}`;
                return `<button class="choice-btn" data-hour="${choice.h}" data-minute="${choice.m}">${timeString}</button>`;
            }).join('');

            this.controlsDiv.innerHTML = `
                <div class="choice-grid">${choiceButtonsHTML}</div>
                <button id="next-question-btn">つぎのもんだい</button>
            `;

            this.controlsDiv.querySelectorAll('.choice-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.checkReadAnswer(e));
            });
            document.getElementById('next-question-btn').addEventListener('click', this.setupReadMode.bind(this));

            this.draw();
        }

        setupSetMode() {
            this.state.targetHour = Math.floor(Math.random() * 12) + 1;
            this.state.targetMinute = Math.floor(Math.random() * 12) * 5;
            this.state.hour = 12; // Reset user's clock
            this.state.minute = 0;
            this.feedbackDiv.textContent = '';
            this.feedbackDiv.className = '';
            this.canvas.style.cursor = 'default';

            const targetText = `${this.state.targetHour}じ ${this.state.targetMinute === 0 ? 'ちょうど' : this.state.targetMinute + 'ふん'}`;
            this.questionText.innerHTML = `【もくひょう】<br><span class="target-time">${targetText}</span> に あわせてね！`;

            this.controlsDiv.innerHTML = `
                <div class="time-setter-grid">
                    <button id="hour-minus" class="time-adjust-btn">-</button>
                    <label>じかん</label>
                    <button id="hour-plus" class="time-adjust-btn">+</button>
                    <button id="minute-minus" class="time-adjust-btn">-</button>
                    <label>ふん</label>
                    <button id="minute-plus" class="time-adjust-btn">+</button>
                </div>
                <div class="main-action-buttons">
                    <button id="check-answer-btn">できた！</button>
                    <button id="next-question-btn">つぎのもんだい</button>
                </div>
            `;

            document.getElementById('hour-plus').addEventListener('click', () => {
                this.state.hour = (this.state.hour % 12) + 1;
                this.draw();
            });
            document.getElementById('hour-minus').addEventListener('click', () => {
                this.state.hour = (this.state.hour === 1) ? 12 : this.state.hour - 1;
                this.draw();
            });
            document.getElementById('minute-plus').addEventListener('click', () => {
                this.state.minute = (this.state.minute + 5) % 60;
                this.draw();
            });
            document.getElementById('minute-minus').addEventListener('click', () => {
                this.state.minute = (this.state.minute === 0) ? 55 : this.state.minute - 5;
                this.draw();
            });
            document.getElementById('check-answer-btn').addEventListener('click', () => this.checkSetAnswer());
            document.getElementById('next-question-btn').addEventListener('click', this.setupSetMode.bind(this));

            this.draw();
        }

        // --- Answer Checking ---
        checkReadAnswer(e) {
            if (this.state.isAnswered) return;
 
            const clickedBtn = e.target;
            const selectedHour = parseInt(clickedBtn.dataset.hour, 10);
            const selectedMinute = parseInt(clickedBtn.dataset.minute, 10);
 
            const isCorrect = (selectedHour === this.state.hour && selectedMinute === this.state.minute);
 
            if (isCorrect) {
                this.state.isAnswered = true; // 正解した場合にのみ、以降の操作をロックする
                // 全ての選択肢ボタンを無効化
                this.controlsDiv.querySelectorAll('.choice-btn').forEach(btn => {
                    btn.disabled = true;
                });
                clickedBtn.classList.add('correct-answer');
                addPoints(1); // 正解で1ポイント追加
                this.showFeedback('せいかい！すごい！', 'correct', this.setupReadMode.bind(this));
            } else {
                clickedBtn.disabled = true; // 間違えたボタンのみ無効化
                clickedBtn.classList.add('wrong-answer');
                this.showFeedback('おしい！もういちど', 'incorrect'); // 次の問題には進まない
            }
        }

        checkSetAnswer() {
            if (this.state.hour === this.state.targetHour && this.state.minute === this.state.targetMinute) {
                addPoints(1); // 正解で1ポイント追加
                this.showFeedback('せいかい！すごい！', 'correct', this.setupSetMode.bind(this));
            } else {
                this.showFeedback('おしい！もういちど', 'incorrect'); // 次の問題には進まない
            }
        }

        showFeedback(message, type, nextAction = null) {
            this.feedbackDiv.textContent = message;
            this.feedbackDiv.className = type;
            if (type === 'correct') {
                playSE(this.correctSound.src);
                this.playCorrectAnimation(); // 正解アニメーションを再生
            } else {
                playSE(this.incorrectSound.src);
                // 不正解のフィードバックも2秒後に消す
                setTimeout(() => {
                    // メッセージがまだ表示されている場合（他のメッセージに上書きされていない場合）のみクリアする
                    if (this.feedbackDiv.classList.contains('incorrect')) {
                        this.feedbackDiv.textContent = '';
                        this.feedbackDiv.className = '';
                    }
                }, 2000);
            }

            if (nextAction) {
                setTimeout(nextAction, 2000);
            }
        }

        playCorrectAnimation() {
            // canvas-confettiライブラリが読み込まれているか確認
            if (typeof confetti !== 'function') {
                console.error('Confetti library is not loaded.');
                return;
            }

            const duration = 2 * 1000; // 2秒間
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000, scalar: 2 }; // scalar: 2 でパーティクルの大きさを2倍に

            function randomInRange(min, max) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(function() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                // 画面の左下と右下から打ち上げる
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);
        }
        // --- Drawing ---
        draw() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const radius = this.canvas.width / 2;

            this.drawClockFace(radius);
            this.drawHand(this.state.hour, this.state.minute, radius);
        }

        drawClockFace(radius) {
            this.ctx.save();
            this.ctx.translate(radius, radius);

            // --- NEW: Draw a background circle for better contrast ---
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius * 0.98, 0, 2 * Math.PI);
            this.ctx.fillStyle = '#ede7f6'; // A very light, cool lavender color
            this.ctx.fill();
            // --- END NEW ---

            // Face
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius * 0.8, 0, 2 * Math.PI); // 時計を少し小さくして余白を作る
            this.ctx.fillStyle = '#fff9c4'; // 明るいクリーム色
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffb74d'; // オレンジ
            this.ctx.lineWidth = 12; // 枠線を少し太く
            this.ctx.stroke();

            // Center dot
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 12, 0, 2 * Math.PI); // 中心点を少し大きく
            this.ctx.fillStyle = '#ff8a65'; // 濃いオレンジ
            this.ctx.fill();

            // Numbers
            this.ctx.font = radius * 0.18 + 'px "Kosugi Maru", sans-serif'; // 数字を少し大きく
            this.ctx.textBaseline = 'middle';
            this.ctx.textAlign = 'center';
            
            // カラフルな色の配列を定義
            const numberColors = [
                '#e53935', // 1時 (赤)
                '#ff7043', // 2時 (オレンジ)
                '#ffb300', // 3時 (アンバー)
                '#7cb342', // 4時 (黄緑)
                '#43a047', // 5時 (緑)
                '#00acc1', // 6時 (シアン)
                '#42a5f5', // 7時 (青)
                '#5c6bc0', // 8時 (インディゴ)
                '#8e24aa', // 9時 (紫)
                '#d81b60', // 10時 (ピンク)
                '#f4511e', // 11時 (ディープレッドオレンジ)
                '#6d4c41'  // 12時 (茶色)
            ];

            for (let num = 1; num <= 12; num++) {
                const angle = num * Math.PI / 6;
                const x = Math.sin(angle) * radius * 0.65; // 小さくした時計に合わせる
                const y = -Math.cos(angle) * radius * 0.65;
                this.ctx.fillStyle = numberColors[num - 1]; // 数字ごとに色を設定
                this.ctx.fillText(num.toString(), x, y);
            }

            // Draw minute numbers if toggled on
            if (this.state.showMinuteNumbers) {
                this.ctx.font = radius * 0.1 + 'px "Kosugi Maru", sans-serif'; // 時間の数字より小さく
                // --- NEW: Darker, more saturated colors for minute numbers ---
                const minuteColors = [
                    '#c62828', // 00 (Red)
                    '#fb8c00', // 05 (Orange)
                    '#f9a825', // 10 (Yellow)
                    '#558b2f', // 15 (Light Green)
                    '#2e7d32', // 20 (Green)
                    '#00838f', // 25 (Cyan)
                    '#0277bd', // 30 (Light Blue)
                    '#1a237e', // 35 (Indigo)
                    '#6a1b9a', // 40 (Purple)
                    '#ad1457', // 45 (Pink)
                    '#d84315', // 50 (Deep Orange)
                    '#c0ca33'  // 55 (Lime)
                ];
                for (let min = 0; min < 60; min += 5) {
                    const angle = (min * 6) * Math.PI / 180;
                    // 時計の枠線の外側に配置
                    const x = Math.sin(angle) * radius * 0.92;
                    const y = -Math.cos(angle) * radius * 0.92;
                    this.ctx.fillStyle = minuteColors[min / 5];
                    this.ctx.fillText(min.toString().padStart(2, '0'), x, y);
                }
            }
            this.ctx.restore();
        }

        drawHand(h, m, radius) {
            // Hour hand
            let hourAngle;
            if (this.state.isAdvancedMode) {
                // 「ほんもの」モード：分に合わせて短針が動く
                hourAngle = ((h % 12) + m / 60) * 30 * Math.PI / 180;
            } else {
                // 「かんたん」モード：短針は常に正時を指す
                hourAngle = (h % 12) * 30 * Math.PI / 180;
            }
            this.drawHandSegment(hourAngle, radius * 0.45, 12, '#42a5f5', radius); // 小さくした時計に合わせて針も少し短く

            // Minute hand
            const minuteAngle = (m * 6) * Math.PI / 180;
            this.drawHandSegment(minuteAngle, radius * 0.65, 8, '#ff7043', radius); // 小さくした時計に合わせて針も少し短く
        }

        drawHandSegment(angle, length, width, color, radius) {
            this.ctx.save();
            this.ctx.translate(radius, radius);
            this.ctx.rotate(angle);
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(0, -length);
            this.ctx.lineWidth = width;
            this.ctx.strokeStyle = color;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
            this.ctx.restore();
        }

        // --- Dragging Handlers for 'set' mode ---
        handleMouseDown(e) {
            if (this.state.mode !== 'set') {
                // 「よむ れんしゅう」モードでは、時計をクリックしても何もしない
                return;
            }
            // 「とけいをあわせる」モードでは、時計のクリック（ドラッグ）操作を無効化
            e.preventDefault();
            return;
        }

        handleMouseMove(e) {
            if (!this.state.isDragging) return;
            e.preventDefault();

            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const y = (e.clientY || e.touches[0].clientY) - rect.top;
            const radius = this.canvas.width / 2;
            const dx = x - radius;
            const dy = y - radius;

            let angle = Math.atan2(dy, dx) + Math.PI / 2;
            if (angle < 0) angle += 2 * Math.PI;

            const newMinute = Math.round((angle * 180 / Math.PI) / 6) % 60;
            const oldMinute = this.state.minute;

            if (oldMinute >= 55 && newMinute <= 5) {
                this.state.hour = (this.state.hour % 12) + 1;
            } else if (oldMinute <= 5 && newMinute >= 55) {
                this.state.hour = (this.state.hour === 1) ? 12 : this.state.hour - 1;
            }

            this.state.minute = Math.round(newMinute / 5) * 5;
            if (this.state.minute === 60) this.state.minute = 0;
            
            // Update button displays
            const hourDisplay = document.getElementById('hour-display');
            const minuteDisplay = document.getElementById('minute-display');
            if(hourDisplay) hourDisplay.textContent = this.state.hour;
            if(minuteDisplay) minuteDisplay.textContent = this.state.minute;

            this.draw();
        }

        handleMouseUp() {
            if (!this.state.isDragging) return;
            this.state.isDragging = null;
            this.canvas.style.cursor = 'default';
            this.draw();
        }
    } // <-- Class ClockGame ends here

    // --- Instantiate the game ---
    new ClockGame();
}); // <-- DOMContentLoaded listener ends here
