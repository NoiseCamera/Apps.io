// coloring.js
document.addEventListener('DOMContentLoaded', () => { // Wait for the DOM to be fully loaded before executing the script
    // ダブルタップによるズームを防止
    document.body.style.touchAction = 'manipulation';

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
    let recentlyUsedColors = []; // Array to hold recently used colors
    const MAX_RECENT_COLORS = 4; // 最近使った色を4色まで記録 (2x2グリッド)

    // --- Pinch Zoom & Drag State ---
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isPinching = false;
    let isDragging = false;
    let lastPinchDistance = 0;
    let lastDragPosition = null;

    // --- Tap State ---
    let touchStartTime = 0;
    let touchStartPosition = null;
    const TAP_THRESHOLD_MS = 200; // 200ms
    const DRAG_THRESHOLD_PX = 5; // 5px以上動いたらドラッグとみなす

    // --- Sound Effects ---
    const SOUND_EFFECTS = [
        'assets/sounds/fill.mp3',  // ぬりつぶし音
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
        '#F1C40F', '#F39C12', '#4B0082', '#7F8C8D', // 濃い灰色(#34495E)を、線と誤認されない濃い紫色に変更
        '#FCF3CF', '#F9E79F', '#BDC3C7', '#95A5A6'
    ];

    // --- Initialization Function ---
    function initialize() {
        // 1. URLからどのぬりえを読み込むか決定する
        const urlParams = new URLSearchParams(window.location.search);
        const imageId = urlParams.get('image');

        // 2. NURIE_IMAGES (nurie-data.js) から対応する画像情報を探す
        if (typeof NURIE_IMAGES !== 'undefined') {
            currentImageInfo = NURIE_IMAGES.find(img => img.id === imageId);
        }

        // 3. 画像が見つからなかった場合の処理
        if (!currentImageInfo) { // Handle the case where the image is not found
            console.error('指定されたぬりえが見つかりません。');
            canvasWrapper.innerHTML = `<p>ぬりえが えらばれていません。<br><a href="coloring-select.html">えらぶがめんに もどる</a></p>`;
            // ツールバーを非表示にする
            document.getElementById('left-toolbar').style.display = 'none';
            document.getElementById('right-toolbar').style.display = 'none';
            return; // 初期化処理を中断
        }

        // 拡大・縮小の基準点を左上（0, 0）に設定して、座標計算のずれを防ぐ
        canvas.style.transformOrigin = '0 0';

        // カーソルをぬりつぶしアイコンに設定
        canvas.style.cursor = 'crosshair';

        loadRecentColors();
        createRecentColorsPalette(); // Populate recent color palette
        createColorPalette();        // Populate the color palette
        addEventListeners();           // Attach event listeners to DOM elements
        loadLineArt();               // Load the line art image 
        updateUI();                  // Update the UI based on initial state
        updateUndoRedoButtons();     // Update the undo/redo button states
    
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

    // --- Canvas and Image Loading Functions ---
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
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // 線画を描画（スケール後のサイズで描画）
        ctx.drawImage(lineArtImage, 0, 0, canvas.width / dpr, canvas.height / dpr);
        
        // --- 線の色を変更する処理 ---
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const newColor = { r: 85, g: 85, b: 85 }; // 濃い灰色 (#555555)
        const colorThreshold = 100; // この明るさ以下のピクセルを線とみなす100
        const alphaThreshold = 200; // この不透明度以上のピクセルを対象とする200

        for (let i = 0; i < data.length; i += 4) {
            // ピクセルが黒（またはそれに近い色）で、かつ透明でない場合
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (avg < colorThreshold && data[i + 3] > alphaThreshold) {
                data[i] = newColor.r;     // Red
                data[i + 1] = newColor.g; // Green
                data[i + 2] = newColor.b; // Blue
                // Alpha (data[i + 3]) は変更しない
            }
        }
        ctx.putImageData(imageData, 0, 0);
        // --- ここまで ---

        // 拡大・縮小・移動の状態をリセット
        scale = 1;
        offsetX = 0;
        offsetY = 0;
        updateTransform();
    }

  // --- UI Creation Functions ---
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
        updateUI();              // Update the UI to reflect the current color
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

  // --- Event Listener Functions ---
    function addEventListeners() {
        canvas.addEventListener('click', handleCanvasClick);
        clearBtn.addEventListener('click', () => {
            if (confirm('ぜんぶ やりなおしますか？')) {
                if (typeof playSE === 'function') playSE('assets/sounds/clear.mp3');
                resetCanvas(); // Clear the canvas
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

  function getPosition(event) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if (event.touches) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        const x = (clientX - rect.left) / scale - offsetX / scale;
        const y = (clientY - rect.top) / scale - offsetY / scale;
        return { x, y };
    }

  function handleCanvasClick(e) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        let clientX, clientY;

        // touchendイベントではchangedTouchesを、それ以外ではtouchesや直接の座標を参照
        if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

      // getBoundingClientRectにはtransformによる移動量(offsetX, offsetY)が既に含まれているため、
      // クリック位置と矩形の左上の差をスケールで割るだけで正しい座標が計算できる
      const x = (clientX - rect.left) / scale;
      const y = (clientY - rect.top) / scale;
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
        if (e.touches.length >= 2) { // 2本指以上はピンチ操作
            isPinching = true;
            isDragging = false; // ピンチ中はドラッグ無効
            lastPinchDistance = getDistance(e.touches);
        } else if (e.touches.length === 1) {
            // 1本指はタップかドラッグの可能性
            isDragging = false; // この時点ではまだドラッグではない
            isPinching = false;
            touchStartTime = Date.now();
            const touch = e.touches[0];
            touchStartPosition = { x: touch.clientX, y: touch.clientY };
            lastDragPosition = { x: touch.clientX, y: touch.clientY };
        }
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (isPinching && e.touches.length >= 2) { // ピンチ操作
            const newDist = getDistance(e.touches);

            // 拡大の中心点を基準にオフセットを調整
            const center = getCenter(e.touches);
            const rect = canvasWrapper.getBoundingClientRect();
            const pointX = center.x - rect.left;
            const pointY = center.y - rect.top;
            const scaleFactor = newDist / lastPinchDistance;

            scaleWithOffset(scaleFactor, pointX, pointY); // オフセットとスケールを更新
            lastPinchDistance = newDist;
            updateTransform();
        } else if (e.touches.length === 1 && touchStartPosition) { // 1本指の移動
            const touch = e.touches[0];
            const newPos = { x: touch.clientX, y: touch.clientY };
            const dx = newPos.x - touchStartPosition.x;
            const dy = newPos.y - touchStartPosition.y;

            // 一定距離以上動いたらドラッグ開始とみなす
            if (!isDragging && (dx * dx + dy * dy) > (DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX)) {
                isDragging = true;
            }

            if (isDragging) {
                drag(newPos); // ドラッグによるオフセットを更新
                lastDragPosition = newPos;
                updateTransform();
            }
        }
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        const touchEndTime = Date.now();

        // ピンチ操作の終了
        if (isPinching && e.touches.length < 2) {
            isPinching = false;
            lastDragPosition = null;
            touchStartPosition = null;
        }

        // 1本指の操作終了（タップ or ドラッグ終了）
        if (!isPinching && touchStartPosition) {
            const touchDuration = touchEndTime - touchStartTime;
            // isDraggingフラグと時間でタップを判定
            if (!isDragging && touchDuration < TAP_THRESHOLD_MS) {
                // これはタップ
                handleCanvasClick(e);
            }
            // ドラッグ終了の処理はここで行う（isDraggingフラグをリセット）
            isDragging = false;
            lastDragPosition = null;
            touchStartPosition = null;
        }

        // すべての指が離れたら状態をリセット
        if (e.touches.length === 0) {
            isPinching = false;
            isDragging = false;
            lastDragPosition = null;
            touchStartPosition = null;
        }
    }

    function scaleWithOffset(scaleFactor, pointX, pointY) {
         const newScale = Math.max(1, Math.min(scale * scaleFactor, 5)); // 1倍から5倍まで
         offsetX = pointX - (pointX - offsetX) * (newScale / scale);
         offsetY = pointY - (pointY - offsetY) * (newScale / scale);
         scale = newScale;
    }

    function drag(newPos) {
        offsetX += newPos.x - lastDragPosition.x;
        offsetY += newPos.y - lastDragPosition.y;
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
            // coloring.css に .color-btn.selected のスタイルがあることを想定
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
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
 
        const startPos = (startY * canvasWidth + startX) * 4;
        const startColor = {
            r: data[startPos],
            g: data[startPos + 1],
            b: data[startPos + 2],
            a: data[startPos + 3]
        };
 
        // --- 判定基準の定義 ---
        const boundaryColor = { r: 85, g: 85, b: 85 };
        const boundaryTolerance = 40; // 境界線とみなす色の許容誤差
 
        // 1. クリックした場所が、すでに塗ろうとしている色と同じなら何もしない
        if (startColor.r === fillColor.r && startColor.g === fillColor.g && startColor.b === fillColor.b) {
            return;
        }
 
        if (typeof playSE === 'function') {
            playSE('assets/sounds/fill.mp3');
        }
 
        const pixelStack = [[startX, startY]];
        const visited = new Uint8Array(canvasWidth * canvasHeight);
 
        while (pixelStack.length > 0) {
            const [x, y] = pixelStack.pop();
            const currentPos = (y * canvasWidth + x) * 4;
            const visitedPos = y * canvasWidth + x;

            if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight || visited[visitedPos]) {
                continue;
            }

            // 3. 現在のピクセルが「境界線」なら、そこは塗らずに探索を終了
            if (Math.abs(data[currentPos] - boundaryColor.r) < boundaryTolerance &&
                Math.abs(data[currentPos + 1] - boundaryColor.g) < boundaryTolerance &&
                Math.abs(data[currentPos + 2] - boundaryColor.b) < boundaryTolerance &&
                data[currentPos + 3] > 200) {
                continue;
            }
 
            // 4. 境界線でなければ、塗りつぶして隣のピクセルを探索リストに追加
            data[currentPos] = fillColor.r;
            data[currentPos + 1] = fillColor.g;
            data[currentPos + 2] = fillColor.b;
            data[currentPos + 3] = fillColor.a; // alpha
            visited[visitedPos] = 1;

            pixelStack.push([x + 1, y]); // right
            pixelStack.push([x - 1, y]); // left
            pixelStack.push([x, y + 1]); // down
            pixelStack.push([x, y - 1]); // up
        }
        ctx.putImageData(imageData, 0, 0);
        saveState(); // 塗りつぶし後に履歴を保存
    }

    // --- Run ---
    initialize();


});
