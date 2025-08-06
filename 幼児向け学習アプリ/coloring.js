// coloring.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvas = document.getElementById('coloring-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const colorPalette = document.getElementById('color-palette');
    const recentColorPalette = document.getElementById('recent-color-palette');
    const clearBtn = document.getElementById('clear-btn');
    const saveBtn = document.getElementById('save-btn');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    // --- State ---
    let currentColor = '#FF0000'; // 初期色は赤
    let lineArtImage = new Image();
    let currentImageInfo = null;
    let bgmInitialized = false;
    let historyStack = [];
    let redoStack = [];
    const MAX_HISTORY_SIZE = 20; // ぬりえはメモリ消費が大きいので少し減らす
    let recentlyUsedColors = [];
    const MAX_RECENT_COLORS = 4; // 最近使った色を4色まで記録 (2x2グリッド)

    // --- Pinch Zoom & Drag State ---
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isPinching = false;
    let isDragging = false;
    let lastPinchDistance = 0;
    let lastDragPosition = null;
    let dragJustFinished = false; // ドラッグ/ピンチ操作直後かのフラグ

    // このゲームで使う効果音のリスト
    const SOUND_EFFECTS = [
        'assets/sounds/fill.mp3', // ぬりつぶし音
        'assets/sounds/clear.mp3'  // やりなおし音
    ];

    // --- Colors (お絵描きアプリより色を増やしています) ---
    const COLORS = [
        // 1段目：基本の色
        '#000000', '#FFFFFF', '#FF0000', '#00FF00',
        '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
        // 2段目：よく使う色
        '#808080', '#A52A2A', '#FFA500', '#800080',
        '#008000', '#FFC0CB', '#F5DEB3', '#E6E6FA',
        // 3段目：はだいろ・ちゃいろ系
        '#FDEBD0', '#F5CBA7', '#E0AC69', '#C68642',
        '#8D6E63', '#6D4C41', '#D2B48C', '#A1887F',
        // 4段目：あか・むらさき系
        '#E74C3C', '#C0392B', '#9B59B6', '#8E44AD',
        '#EC407A', '#AD1457', '#FADBD8', '#FFCDD2',
        // 5段目：あお・みどり系
        '#3498DB', '#2980B9', '#1ABC9C', '#16A085',
        '#2ECC71', '#27AE60', '#AED6F1', '#A9DFBF',
        // 6段目：きいろ・そのほか
        '#F1C40F', '#F39C12', '#34495E', '#7F8C8D',
        '#FCF3CF', '#F9E79F', '#BDC3C7', '#95A5A6'
    ];

    // --- Initialization ---
    function initialize() {
        // 1. URLからどのぬりえを読み込むか決定する
        const urlParams = new URLSearchParams(window.location.search);
        const imageId = urlParams.get('image');

        // 2. NURIE_IMAGES (nurie-data.js) から対応する画像情報を探す
        if (typeof NURIE_IMAGES !== 'undefined') {
            currentImageInfo = NURIE_IMAGES.find(img => img.id === imageId);
        }

        // 3. 画像が見つからなかった場合の処理
        if (!currentImageInfo) {
            console.error('指定されたぬりえが見つかりません。');
            canvasWrapper.innerHTML = `<p>ぬりえが えらばれていません。<br><a href="coloring-select.html">えらぶがめんに もどる</a></p>`;
            // ツールバーを非表示にする
            document.getElementById('left-toolbar').style.display = 'none';
            document.getElementById('right-toolbar').style.display = 'none';
            return; // 初期化処理を中断
        }

        loadRecentColors();
        createRecentColorsPalette();
        createColorPalette();
        addEventListeners();
        loadLineArt();
        updateUI();
        updateUndoRedoButtons();

        // ユーザーの最初の操作でBGMを再生
        document.body.addEventListener('click', initializeBgm, { once: true });
        document.body.addEventListener('touchstart', initializeBgm, { once: true });
    }

    /**
     * ユーザーの最初の操作でBGMを再生する
     */
    function initializeBgm() {
        if (bgmInitialized) return;
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.play().catch(error => console.log('BGMの再生にはユーザーの操作が必要です。', error));
        } else {
            console.warn('BGM要素(#bgm)が見つかりませんでした。');
        }
        // 効果音もこのタイミングでプリロードする
        if (typeof preloadAudioSources === 'function') {
            preloadAudioSources(SOUND_EFFECTS);
        }
        bgmInitialized = true;
    }

    // --- Canvas and Image Loading ---
    function loadLineArt() {
        lineArtImage.onload = () => {
            resizeCanvas();
            // resetCanvas() は resizeCanvas() から呼ばれる
            saveState();
        };
        lineArtImage.onerror = () => {
            console.error('ぬりえの画像の読み込みに失敗しました。');
            canvasWrapper.innerHTML = '<p>ぬりえの がぞうが みつかりません。</p>';
        };
        lineArtImage.src = currentImageInfo.src;
    }

    function resizeCanvas() {
        const wrapperRect = canvasWrapper.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        const imgAspectRatio = lineArtImage.naturalWidth / lineArtImage.naturalHeight;
        let canvasWidth = wrapperRect.width;
        let canvasHeight = canvasWidth / imgAspectRatio;

        if (canvasHeight > wrapperRect.height) {
            canvasHeight = wrapperRect.height;
            canvasWidth = canvasHeight * imgAspectRatio;
        }

        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;

        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;

        ctx.scale(dpr, dpr);

        // リサイズ後に履歴から最後の状態を復元、なければリセット
        if (historyStack.length > 0) {
            ctx.putImageData(historyStack[historyStack.length - 1], 0, 0);
        } else {
            resetCanvas();
        }
    }

    function resetCanvas() {
        // キャンバスをクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // 線画を描画（スケール後のサイズで描画）
        ctx.drawImage(lineArtImage, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
        
        // 拡大・縮小・移動の状態をリセット
        scale = 1;
        offsetX = 0;
        offsetY = 0;
        updateTransform();
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
                selectColor(color);
            });
            colorPalette.appendChild(button);
        });
    }

    /**
     * 色を選択し、UIと「最近使った色」を更新する
     * @param {string} color - 選択された色のHEXコード
     */
    function selectColor(color) {
        currentColor = color;
        addRecentColor(color); // 色を選択した時点で「最近使った色」を更新
        updateUI();
    }

    /**
     * localStorageから最近使った色を読み込む
     */
    function loadRecentColors() {
        const storedColors = localStorage.getItem('coloringRecentColors');
        if (storedColors) {
            recentlyUsedColors = JSON.parse(storedColors);
        }
    }

    /**
     * 最近使った色をlocalStorageに保存する
     */
    function saveRecentColors() {
        localStorage.setItem('coloringRecentColors', JSON.stringify(recentlyUsedColors));
    }

    /**
     * 最近使った色を追加・更新する
     * @param {string} color - 追加する色のHEXコード
     */
    function addRecentColor(color) {
        // 既にリストにある場合は、一度削除して先頭に移動させる
        const existingIndex = recentlyUsedColors.indexOf(color);
        if (existingIndex > -1) {
            recentlyUsedColors.splice(existingIndex, 1);
        }

        // 配列の先頭に色を追加
        recentlyUsedColors.unshift(color);

        // 配列が最大数を超えたら、末尾の古い色を削除
        if (recentlyUsedColors.length > MAX_RECENT_COLORS) {
            recentlyUsedColors.pop();
        }

        saveRecentColors();
        createRecentColorsPalette(); // UIを更新
    }

    /**
     * 最近使った色のパレットをUIに生成する
     */
    function createRecentColorsPalette() {
        recentColorPalette.innerHTML = ''; // パレットをクリア
        recentlyUsedColors.forEach(color => {
            const button = document.createElement('button');
            button.classList.add('color-btn');
            button.style.backgroundColor = color;
            button.dataset.color = color;
            if (color === '#FFFFFF') {
                button.style.borderColor = '#ccc';
            }
            button.addEventListener('click', () => {
                selectColor(color);
            });
            recentColorPalette.appendChild(button);
        });
    }

    // --- Event Listeners ---
    function addEventListeners() {
        canvas.addEventListener('click', handleCanvasClick);
        clearBtn.addEventListener('click', () => {
            if (confirm('ぜんぶ やりなおしますか？')) {
                if (typeof playSE === 'function') playSE('assets/sounds/clear.mp3');
                resetCanvas();
                saveState(); // クリアした状態を履歴に保存
            }
        });
        saveBtn.addEventListener('click', saveCanvas);
        undoBtn.addEventListener('click', undo);
        redoBtn.addEventListener('click', redo);
        window.addEventListener('resize', resizeCanvas);

        // --- Pinch Zoom & Drag Event Listeners ---
        canvasWrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvasWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvasWrapper.addEventListener('touchend', handleTouchEnd);
    }

    function handleCanvasClick(e) {
        // ドラッグやピンチ操作の直後は、誤操作を防ぐために塗りつぶしを実行しない
        if (dragJustFinished) {
            dragJustFinished = false;
            return;
        }

        const rect = canvas.getBoundingClientRect();
        // クリック座標を、現在の拡大率と移動量を考慮したキャンバス上の座標に変換
        const x = (e.clientX - rect.left - offsetX) / scale;
        const y = (e.clientY - rect.top - offsetY) / scale;

        const dpr = window.devicePixelRatio || 1;
        floodFill(Math.floor(x * dpr), Math.floor(y * dpr), hexToRgba(currentColor));
    }
    // --- Touch Handlers for Pinch Zoom & Drag ---
    function getDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function getCenter(touches) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    }

    function handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length >= 2) {
            isPinching = true;
            isDragging = false; // ピンチ中はドラッグ無効
            lastPinchDistance = getDistance(e.touches);
        } else if (e.touches.length === 1) {
            isDragging = true;
            isPinching = false; // ドラッグ中はピンチ無効
            lastDragPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (isPinching && e.touches.length >= 2) {
            const newDist = getDistance(e.touches);
            const scaleFactor = newDist / lastPinchDistance;
            const newScale = Math.max(1, Math.min(scale * scaleFactor, 5)); // 1倍から5倍まで

            // 拡大の中心点を基準にオフセットを調整
            const center = getCenter(e.touches);
            const rect = canvasWrapper.getBoundingClientRect();
            const pointX = center.x - rect.left;
            const pointY = center.y - rect.top;

            offsetX = pointX - (pointX - offsetX) * (newScale / scale);
            offsetY = pointY - (pointY - offsetY) * (newScale / scale);

            scale = newScale;
            lastPinchDistance = newDist;
            updateTransform();
        } else if (isDragging && e.touches.length === 1) {
            const newPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            offsetX += newPos.x - lastDragPosition.x;
            offsetY += newPos.y - lastDragPosition.y;
            lastDragPosition = newPos;
            updateTransform();
        }
    }

    function handleTouchEnd(e) {
        if (isPinching && e.touches.length < 2) {
            isPinching = false;
            dragJustFinished = true;
        }
        if (isDragging && e.touches.length < 1) {
            isDragging = false;
            dragJustFinished = true;
        }
    }

    function updateTransform() {
        canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    }

    // --- Actions ---
    function saveCanvas() {
        const link = document.createElement('a');
        // ファイル名にぬりえの名前を含める
        const fileName = currentImageInfo ? `ぬりえ_${currentImageInfo.name}.png` : 'ぬりえ.png';
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function updateUI() {
        // すべてのカラーボタン（通常パレット＋最近使った色パレット）の選択状態を更新
        document.querySelectorAll('#left-toolbar .color-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.color === currentColor);
        });
    }

    // --- History (Undo/Redo) ---
    function saveState() {
        redoStack = [];
        historyStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (historyStack.length > MAX_HISTORY_SIZE) {
            historyStack.shift();
        }
        updateUndoRedoButtons();
    }

    function undo() {
        if (historyStack.length > 1) {
            redoStack.push(historyStack.pop());
            const lastState = historyStack[historyStack.length - 1];
            ctx.putImageData(lastState, 0, 0);
            updateUndoRedoButtons();
        }
    }

    function redo() {
        if (redoStack.length > 0) {
            const nextState = redoStack.pop();
            ctx.putImageData(nextState, 0, 0);
            historyStack.push(nextState);
            updateUndoRedoButtons();
        }
    }

    function updateUndoRedoButtons() {
        undoBtn.disabled = historyStack.length <= 1;
        redoBtn.disabled = redoStack.length === 0;
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

    // --- Flood Fill Algorithm (Further Improved) ---
    /**
     * 境界線を越えずに領域を塗りつぶすアルゴリズム。アンチエイリアスされた線の際まで綺麗に塗れます。
     * @param {number} startX - 塗りつぶし開始点のX座標
     * @param {number} startY - 塗りつぶし開始点のY座標
     * @param {object} fillColor - 塗りつぶす色 {r, g, b, a}
     */
    function floodFill(startX, startY, fillColor) {
        // --- 塗りつぶし条件を改善 ---
        // 以前はクリックした場所の色と「似ている色」を塗りつぶしていましたが、
        // これだと線の周りのアンチエイリアス（ぼかし）部分が塗り残しになることがありました。
        //
        // 新しい方法では、「境界線の色ではない部分」をすべて塗りつぶします。
        // これにより、線のギリギリまでキレイに色が塗られるようになります。

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const startPos = (startY * canvasWidth + startX) * 4;

        // 1. 境界線判定
        // 境界線の色（黒や濃い灰色）を定義します。
        // RGBの合計値がこの値以下なら線とみなします。アンチエイリアスを考慮して少し甘めに設定。
        const boundaryThreshold = 250; // この値より明るい色を塗りつぶす対象とします

        // クリックした場所が境界線なら何もしない
        if (data[startPos] + data[startPos + 1] + data[startPos + 2] < boundaryThreshold) {
            return;
        }

        // 2. 塗りつぶし色と同じなら何もしない
        // クリックした場所がすでに塗ろうとしている色と同じなら処理を終了
        if (data[startPos] === fillColor.r &&
            data[startPos + 1] === fillColor.g &&
            data[startPos + 2] === fillColor.b) {
            return;
        }

        if (typeof playSE === 'function') playSE('assets/sounds/fill.mp3');
        // addRecentColorはselectColorで行うように変更したため、ここでは不要

        const pixelStack = [[startX, startY]];
        const visited = new Uint8Array(canvasWidth * canvasHeight);

        while (pixelStack.length > 0) {
            const [x, y] = pixelStack.pop();
            const currentPos = (y * canvasWidth + x) * 4;
            const visitedPos = y * canvasWidth + x;

            if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight || visited[visitedPos]) {
                continue;
            }

            // 現在のピクセルが境界線でなければ塗りつぶす
            if (data[currentPos] + data[currentPos + 1] + data[currentPos + 2] >= boundaryThreshold) {
                data[currentPos] = fillColor.r;
                data[currentPos + 1] = fillColor.g;
                data[currentPos + 2] = fillColor.b;
                data[currentPos + 3] = fillColor.a;
                visited[visitedPos] = 1; // 訪問済みにマーク

                pixelStack.push([x + 1, y]);
                pixelStack.push([x - 1, y]);
                pixelStack.push([x, y + 1]);
                pixelStack.push([x, y - 1]);
            }
        }
        ctx.putImageData(imageData, 0, 0);
        saveState(); // 塗りつぶし後に履歴を保存
    }

    // --- Run ---
    initialize();
});
