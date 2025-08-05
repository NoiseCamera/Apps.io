document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); // for flood fill
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const penToolBtn = document.getElementById('pen-tool');
    const eraserToolBtn = document.getElementById('eraser-tool');
    const fillToolBtn = document.getElementById('fill-tool');
    const penWidthSlider = document.getElementById('pen-width');
    const penWidthDisplay = document.getElementById('pen-width-display');
    const colorPalette = document.getElementById('color-palette');
    const clearBtn = document.getElementById('clear-btn');
    const saveBtn = document.getElementById('save-btn');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const stampToolBtn = document.getElementById('stamp-tool');
    const stampControls = document.getElementById('stamp-controls');
    const stampSizeSlider = document.getElementById('stamp-size');
    const stampSizeDisplay = document.getElementById('stamp-size-display');
    const stampSelector = document.getElementById('stamp-selector');

    // --- State ---
    let isDrawing = false;
    let currentTool = 'pen';
    let currentColor = '#000000';
    let currentWidth = 5;
    let lastX = 0;
    let lastY = 0;
    let currentStamp = 'circle'; // デフォルトのスタンプを図形に変更
    let stampSize = 50;
    let historyStack = [];
    let redoStack = [];
    const MAX_HISTORY_SIZE = 30; // 履歴の最大保存数（メモリ使用量対策）
    let bgmInitialized = false; // BGMが初期化されたかどうかのフラグ

    // --- Colors ---
    const COLORS = [
        // 1段目：基本の色
        '#000000', '#FFFFFF', '#FF0000', '#00FF00',
        '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
        // 2段目：よく使う色
        '#808080', '#A52A2A', '#FFA500', '#800080',
        '#008000', '#FFC0CB', '#E6E6FA', '#F5DEB3',
        // 3段目：あわい色（パステルカラー）
        '#FADBD8', '#D5F5E3', '#D6EAF8', '#FCF3CF',
        '#E8DAEF', '#A9DFBF', '#AED6F1', '#F9E79F',
        // 4段目：こい色・めずらしい色
        '#E74C3C', '#2ECC71', '#3498DB', '#9B59B6',
        '#F1C40F', '#1ABC9C', '#34495E', '#7F8C8D'
    ];

    // --- Stamps (図形に変更) ---
    const STAMPS = [
        { id: 'circle', name: 'まる' },
        { id: 'square', name: 'しかく' },
        { id: 'triangle', name: 'さんかく' },
        { id: 'star', name: 'ほし' },
        { id: 'heart', name: 'はーと' }
    ];

    // --- Stamp Icons (他の関数からアクセスできるようスコープを移動) ---
    const STAMP_ICONS = {
        circle: '<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor" stroke="black" stroke-width="1"/></svg>',
        square: '<svg width="24" height="24" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" fill="currentColor" stroke="black" stroke-width="1"/></svg>',
        triangle: '<svg width="24" height="24" viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22" fill="currentColor" stroke="black" stroke-width="1"/></svg>',
        star: '<svg width="24" height="24" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="currentColor" stroke="black" stroke-width="1"/></svg>',
        heart: '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" fill="currentColor" stroke="black" stroke-width="1"/></svg>'
    };

    // --- Initialization ---
    function initialize() {
        resizeCanvas();

        // 初期背景を白で塗りつぶし、最初の履歴として保存
        clearCanvas(false);

        createColorPalette();
        createStampSelector();
        addEventListeners();
        updateToolUI();
        updateUndoRedoButtons();

        // ウィンドウリサイズ時にキャンバスサイズを調整
        window.addEventListener('resize', handleResize);

        // ユーザーの最初の操作でBGMを再生
        document.body.addEventListener('click', initializeBgm, { once: true });
        document.body.addEventListener('touchstart', initializeBgm, { once: true });
    }

    /**
     * ユーザーの最初の操作でBGMを再生する
     */
    function initializeBgm() {
        if (bgmInitialized) return;
        // settings.jsによって<audio>要素が生成される
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.play().catch(error => console.log('BGMの再生にはユーザーの操作が必要です。', error));
            bgmInitialized = true;
        }
    }

    // --- Canvas Sizing ---
    function resizeCanvas() {
        const rect = canvasWrapper.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1; // 高解像度ディスプレイ対応
        
        // 実際のピクセルサイズを設定
        canvas.width = (rect.width - 10) * dpr;
        canvas.height = (rect.height - 10) * dpr;
        
        // CSSで表示サイズを設定
        canvas.style.width = `${rect.width - 10}px`;
        canvas.style.height = `${rect.height - 10}px`;
        
        // コンテキストをスケール
        ctx.scale(dpr, dpr);
    }

    function handleResize() {
        if (confirm('がめんの おおきさを かえると、かいた えが きえちゃうけど いい？')) {
            resizeCanvas();
            clearCanvas(false); // 確認なしでクリア
        }
    }

    // --- UI Creation ---
    function createColorPalette() {
        COLORS.forEach(color => {
            const button = document.createElement('button');
            button.classList.add('color-btn');
            button.style.backgroundColor = color;
            button.dataset.color = color;
            if (color === '#FFFFFF') {
                button.style.borderColor = '#ccc'; // 白いボタンが見えるように
            }
            button.addEventListener('click', () => {
                currentColor = color;
                updateToolUI();
            });
            colorPalette.appendChild(button);
        });
    }

    function createStampSelector() {
        STAMPS.forEach(stamp => {
            const button = document.createElement('button');
            button.classList.add('stamp-btn');
            button.dataset.stampId = stamp.id;
            // 画像の代わりにSVGアイコンを設定
            button.innerHTML = STAMP_ICONS[stamp.id] || '';
            button.title = stamp.name; // ホバーで名前表示

            button.addEventListener('click', () => {
                // スタンプの形を選ぶと、自動的にスタンプツールに切り替わります
                currentStamp = stamp.id;
                switchTool('stamp');
            });

            stampSelector.appendChild(button);
        });
    }

    // --- Event Listeners ---
    function addEventListeners() {
        canvas.addEventListener('mousedown', startAction);
        canvas.addEventListener('mousemove', moveAction);
        canvas.addEventListener('mouseup', stopAction);
        canvas.addEventListener('mouseleave', stopAction);

        canvas.addEventListener('touchstart', startAction, { passive: false });
        canvas.addEventListener('touchmove', moveAction, { passive: false });
        canvas.addEventListener('touchend', stopAction);

        penToolBtn.addEventListener('click', () => switchTool('pen'));
        eraserToolBtn.addEventListener('click', () => switchTool('eraser'));
        fillToolBtn.addEventListener('click', () => switchTool('fill'));
        stampToolBtn.addEventListener('click', () => switchTool('stamp'));

        penWidthSlider.addEventListener('input', (e) => {
            currentWidth = e.target.value;
            penWidthDisplay.textContent = currentWidth;
        });

        stampSizeSlider.addEventListener('input', (e) => {
            stampSize = e.target.value;
            stampSizeDisplay.textContent = stampSize;
        });

        clearBtn.addEventListener('click', () => clearCanvas(true));
        saveBtn.addEventListener('click', saveCanvas);
        undoBtn.addEventListener('click', undo);
        redoBtn.addEventListener('click', redo);
    }

    // --- Drawing Logic ---
    function getEventPosition(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        // CSSで設定されたサイズに対する座標を返す
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function startAction(e) {
        e.preventDefault();
        const { x, y } = getEventPosition(e);

        if (currentTool === 'fill') {
            // floodFillには実際のピクセル座標を渡す
            const dpr = window.devicePixelRatio || 1;
            floodFill(Math.floor(x * dpr), Math.floor(y * dpr), hexToRgba(currentColor));
            return;
        }

        if (currentTool === 'stamp') {
            drawStamp(x, y);
            return;
        }

        isDrawing = true;
        [lastX, lastY] = [x, y];
        // 点を描画するために、開始時にもdrawを呼び出す
        draw(x, y);
    }

    function moveAction(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const { x, y } = getEventPosition(e);
        draw(x, y);
    }

    function draw(x, y) {
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);

        if (currentTool === 'pen') {
            ctx.strokeStyle = currentColor;
        } else if (currentTool === 'eraser') {
            ctx.strokeStyle = '#FFFFFF'; // 消しゴムは白いペン
        }
        ctx.lineWidth = currentWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        [lastX, lastY] = [x, y];
    }

    function stopAction() {
        if (!isDrawing) return; // 線を引いていない場合は何もしない
        isDrawing = false;
        // 描画が終わったタイミングで履歴を保存
        saveState();
    }

    function drawStamp(x, y) {
        ctx.save();
        ctx.fillStyle = currentColor; // 選択中の色を使用
        ctx.beginPath();

        const size = parseInt(stampSize, 10);
        const halfSize = size / 2;

        switch (currentStamp) {
            case 'circle':
                ctx.arc(x, y, halfSize, 0, Math.PI * 2);
                break;
            case 'square':
                ctx.rect(x - halfSize, y - halfSize, size, size);
                break;
            case 'triangle':
                ctx.moveTo(x, y - halfSize);
                ctx.lineTo(x + halfSize, y + halfSize);
                ctx.lineTo(x - halfSize, y + halfSize);
                ctx.closePath();
                break;
            case 'star':
                const spikes = 5;
                const outerRadius = halfSize;
                const innerRadius = halfSize / 2.5;
                let rot = Math.PI / 2 * 3;
                let step = Math.PI / spikes;

                ctx.moveTo(x, y - outerRadius);
                for (let i = 0; i < spikes; i++) {
                    let currentX = x + Math.cos(rot) * outerRadius;
                    let currentY = y + Math.sin(rot) * outerRadius;
                    ctx.lineTo(currentX, currentY);
                    rot += step;

                    currentX = x + Math.cos(rot) * innerRadius;
                    currentY = y + Math.sin(rot) * innerRadius;
                    ctx.lineTo(currentX, currentY);
                    rot += step;
                }
                ctx.lineTo(x, y - outerRadius);
                ctx.closePath();
                break;
            case 'heart':
                const d = Math.min(size, size);
                const k = x - d / 2;
                const l = y - d / 2;
                ctx.moveTo(k + d / 2, l + d / 4);
                ctx.bezierCurveTo(k + d / 2, l, k, l, k, l + d / 4);
                ctx.bezierCurveTo(k, l + d / 2, k + d / 2, l + d * 3 / 4, k + d / 2, l + d);
                ctx.bezierCurveTo(k + d / 2, l + d * 3 / 4, k + d, l + d / 2, k + d, l + d / 4);
                ctx.bezierCurveTo(k + d, l, k + d / 2, l, k + d / 2, l + d / 4);
                ctx.closePath();
                break;
        }

        ctx.fill();
        ctx.restore();
        // スタンプを押した後に履歴を保存
        saveState();
    }
    // --- Tool Management ---
    function switchTool(tool) {
        currentTool = tool;
        updateToolUI();
    }

    function updateToolUI() {
        // ツールボタンの選択状態を更新
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.tool === currentTool);
        });

        // スタンプ選択ボタンの選択状態を更新
        document.querySelectorAll('.stamp-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.stampId === currentStamp);
        });

        // カラーパレットの選択状態を更新
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.color === currentColor);
        });

        // ツールごとのコントロールパネルの表示/非表示
        const showPenWidth = currentTool === 'pen' || currentTool === 'eraser';
        // スタンプツールでもカラーパレットを表示
        const showColorPalette = currentTool === 'pen' || currentTool === 'fill' || currentTool === 'stamp';
        const isStampToolActive = currentTool === 'stamp';

        penWidthSlider.parentElement.classList.toggle('hidden', !showPenWidth);
        colorPalette.classList.toggle('hidden', !showColorPalette);
        stampControls.classList.toggle('hidden', !isStampToolActive);

        // カーソルの見た目を更新
        if (currentTool === 'pen') {
            canvas.style.cursor = 'crosshair';
        } else if (currentTool === 'eraser') {
            canvas.style.cursor = 'url("assets/images/icon_eraser.svg") 16 16, auto';
        } else if (currentTool === 'fill') {
            canvas.style.cursor = 'url("assets/images/icon_fill.svg") 16 16, auto';
        } else if (currentTool === 'stamp') {
            // 選択中のスタンプと色を反映したカーソルを動的に生成
            const svgTemplate = STAMP_ICONS[currentStamp] || STAMP_ICONS['circle'];
            // SVG内の 'currentColor' を選択中の色に置き換える
            const coloredSvg = svgTemplate.replace(/currentColor/g, currentColor);
            // SVGをData URL用にエンコード
            const encodedSvg = encodeURIComponent(coloredSvg);
            canvas.style.cursor = `url("data:image/svg+xml;charset=utf-8,${encodedSvg}") 12 12, auto`;
        }
    }

    // --- Canvas Actions ---
    function clearCanvas(askConfirmation = true) {
        const doClear = askConfirmation ? confirm('ぜんぶけしても いいですか？') : true;
        if (doClear) {
            // 描画コンテキストの状態をリセット（DPR対応で重要）
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.restore();

            // 背景を白で塗りつぶす
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
            saveState(); // クリアした状態を履歴に保存
        }
    }

    function saveCanvas() {
        const link = document.createElement('a');
        link.download = 'おえかき.png';
        link.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
        link.click();
    }

    // --- Utility Functions ---
    function hexToRgba(hex) {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return { r, g, b, a: 255 };
    }

    // --- Flood Fill Algorithm ---
    function floodFill(startX, startY, fillColor) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const startPos = (startY * canvas.width + startX) * 4;
        const startR = data[startPos];
        const startG = data[startPos + 1];
        const startB = data[startPos + 2];

        // 開始地点の色が塗りつぶす色と同じなら何もしない
        if (startR === fillColor.r && startG === fillColor.g && startB === fillColor.b) {
            return;
        }

        const pixelStack = [[startX, startY]];

        while (pixelStack.length) {
            let [x, y] = pixelStack.pop();
            let currentPos = (y * canvas.width + x) * 4;

            while (y >= 0 && data[currentPos] === startR && data[currentPos + 1] === startG && data[currentPos + 2] === startB) {
                currentPos -= canvas.width * 4;
                y--;
            }
            currentPos += canvas.width * 4;
            y++;

            let reachLeft = false;
            let reachRight = false;

            while (y < canvas.height && data[currentPos] === startR && data[currentPos + 1] === startG && data[currentPos + 2] === startB) {
                data[currentPos] = fillColor.r;
                data[currentPos + 1] = fillColor.g;
                data[currentPos + 2] = fillColor.b;
                data[currentPos + 3] = fillColor.a;

                if (x > 0) {
                    if (data[currentPos - 4] === startR && data[currentPos - 3] === startG && data[currentPos - 2] === startB) {
                        if (!reachLeft) {
                            pixelStack.push([x - 1, y]);
                            reachLeft = true;
                        }
                    } else if (reachLeft) {
                        reachLeft = false;
                    }
                }

                if (x < canvas.width - 1) {
                    if (data[currentPos + 4] === startR && data[currentPos + 5] === startG && data[currentPos + 6] === startB) {
                        if (!reachRight) {
                            pixelStack.push([x + 1, y]);
                            reachRight = true;
                        }
                    } else if (reachRight) {
                        reachRight = false;
                    }
                }

                y++;
                currentPos += canvas.width * 4;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        saveState(); // 塗りつぶした状態を履歴に保存
    }

    // --- History (Undo/Redo) ---
    function saveState() {
        // 新しい操作をしたら、やり直し履歴は消去
        redoStack = [];
        // 現在のキャンバスの状態を履歴に追加
        historyStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        // 履歴が最大サイズを超えたら、古いものから削除
        if (historyStack.length > MAX_HISTORY_SIZE) {
            historyStack.shift();
        }
        updateUndoRedoButtons();
    }

    function undo() {
        if (historyStack.length > 1) { // The first state is the blank canvas, so we need at least 2 states to undo
            // 現在の状態をredoスタックに移す
            redoStack.push(historyStack.pop());
            // 1つ前の状態を取り出してキャンバスに描画
            const lastState = historyStack[historyStack.length - 1];
            ctx.putImageData(lastState, 0, 0);
            updateUndoRedoButtons();
        }
    }

    function redo() {
        if (redoStack.length > 0) {
            // やり直しスタックから状態を取り出す
            const nextState = redoStack.pop();
            // キャンバスに描画
            ctx.putImageData(nextState, 0, 0);
            // 履歴スタックに戻す
            historyStack.push(nextState);
            updateUndoRedoButtons();
        }
    }

    function updateUndoRedoButtons() {
        // 履歴が1つしかない（最初の白紙状態のみ）場合は「もどる」を無効化
        undoBtn.disabled = historyStack.length <= 1;
        // やり直し履歴がなければ「すすむ」を無効化
        redoBtn.disabled = redoStack.length === 0;
    }

    // --- Run ---
    initialize();
});
