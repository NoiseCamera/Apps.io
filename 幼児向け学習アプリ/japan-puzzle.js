// japan-puzzle.js
document.addEventListener('DOMContentLoaded', () => {
    // ダブルタップによるズームを防止
    document.body.style.touchAction = 'manipulation';

    // DOM要素
    const canvas = document.getElementById('puzzle-canvas');
    const ctx = canvas.getContext('2d');
    const piecesContainer = document.getElementById('pieces-container');
    const puzzleBoard = document.getElementById('puzzle-board');
    const infoText = document.getElementById('info-text');
    const hintBtn = document.getElementById('hint-btn');
    const winModal = document.getElementById('win-modal');
    const playAgainBtn = document.getElementById('play-again-btn');

    // 地方選択ボタンは puzzle-board の子要素として扱う
    const regionSelector = document.getElementById('region-selector');

    // 音声
    const snapSound = document.getElementById('snap-sound');
    const regionCompleteSound = document.getElementById('region-complete-sound');
    const winSound = document.getElementById('win-sound');

    // ゲーム設定
    const MAP_IMAGE_SRC = 'assets/images/tizu1.png'; // 背景地図
    const MAP_WIDTH = 800;
    const MAP_HEIGHT = 600;
    const SNAP_DISTANCE = 25; // スナップ距離を少し厳しくする

    // ゲーム状態
    let mapImage = new Image();
    let allPieces = [];
    let placedPieces = new Set();
    let completedRegions = new Set();
    let currentRegion = null;
    let draggingPiece = null;
    let offsetX, offsetY;
    let bgmInitialized = false;

    // 初期化処理
    function init() {
        canvas.width = MAP_WIDTH;
        canvas.height = MAP_HEIGHT;

        mapImage.onload = () => {
            drawMap();
            createAllPieces();
            setupRegionSelector();
        };
        mapImage.src = MAP_IMAGE_SRC;

        // イベントリスナー
        hintBtn.addEventListener('click', showHint);
        playAgainBtn.addEventListener('click', () => location.reload());
        
        document.body.addEventListener('click', initializeBgm, { once: true });
        document.body.addEventListener('touchstart', initializeBgm, { once: true });
    }

    function initializeBgm() {
        if (bgmInitialized) return;
        const bgm = document.getElementById('bgm');
        if (bgm && bgm.paused) {
            bgm.play().catch(e => console.error("BGM再生失敗", e));
        }
        bgmInitialized = true;
    }

    // 地図を描画
    function drawMap(showHint = false) {
        ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
        ctx.drawImage(mapImage, 0, 0, MAP_WIDTH, MAP_HEIGHT);

        if (showHint) {
            ctx.globalAlpha = 0.4;
            allPieces.forEach(piece => {
                if (piece.region === currentRegion && !placedPieces.has(piece.id)) {
                    ctx.drawImage(piece.element, piece.correctX, piece.correctY, piece.width, piece.height);
                }
            });
            ctx.globalAlpha = 1.0;
        }
    }

    // 全てのピース要素を最初に生成
    function createAllPieces() {
        PREFECTURES_DATA.forEach(prefData => {
            const pieceEl = document.createElement('img');
            pieceEl.src = prefData.image;
            pieceEl.classList.add('prefecture-piece');
            pieceEl.classList.add('unplaced'); // 未配置クラスを追加
            pieceEl.dataset.id = prefData.id;
            pieceEl.style.width = `${prefData.width}px`;
            pieceEl.style.height = `${prefData.height}px`;
            
            allPieces.push({ ...prefData, element: pieceEl });
            puzzleBoard.appendChild(pieceEl);

            pieceEl.addEventListener('mousedown', startDrag);
            pieceEl.addEventListener('touchstart', startDrag, { passive: false });
        });
    }

    /**
     * ピースを完成エリアの外側にランダムに配置します。
     */
    function scatterPieces() {
        const boardRect = puzzleBoard.getBoundingClientRect();
        const margin = 50; // ピースが表示される盤外のマージン

        allPieces.forEach(piece => {
            if (placedPieces.has(piece.id)) return;

            let x, y;
            const side = Math.floor(Math.random() * 4); // 0:上, 1:下, 2:左, 3:右

            switch (side) {
                case 0: // 上
                    x = Math.random() * (boardRect.width - piece.width);
                    y = -margin - Math.random() * 50;
                    break;
                case 1: // 下
                    x = Math.random() * (boardRect.width - piece.width);
                    y = boardRect.height + margin + Math.random() * 50;
                    break;
                case 2: // 左
                    x = -margin - piece.width - Math.random() * 50;
                    y = Math.random() * (boardRect.height - piece.height);
                    break;
                case 3: // 右
                    x = boardRect.width + margin + Math.random() * 50;
                    y = Math.random() * (boardRect.height - piece.height);
                    break;
            }
            piece.element.style.left = `${x}px`;
            piece.element.style.top = `${y}px`;
        });
    }

    // 地方選択ボタンをセットアップ
    function setupRegionSelector() {
        Object.entries(REGIONS).forEach(([id, name]) => {
            const btn = document.createElement('button');
            btn.classList.add('region-btn');
            btn.dataset.regionId = id;
            btn.textContent = name;
            btn.addEventListener('click', () => selectRegion(id));
            regionSelector.appendChild(btn);
        });
        // 「すべて」ボタンを追加
        const allBtn = document.createElement('button');
        allBtn.classList.add('region-btn', 'selected');
        allBtn.dataset.regionId = 'all';
        allBtn.textContent = 'すべて';
        allBtn.addEventListener('click', () => selectRegion('all'));
        regionSelector.insertBefore(allBtn, regionSelector.firstChild);
    }

    // 地方を選択
    function selectRegion(regionId) {
        currentRegion = regionId;

        // ボタンの選択状態を更新
        document.querySelectorAll('.region-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.regionId === regionId);
        });

        // ピースのハイライト状態を更新
        allPieces.forEach(piece => {
            const isPlaced = placedPieces.has(piece.id);
            if (isPlaced) return;

            const isTargetRegion = regionId === 'all' || piece.region === regionId;
            piece.element.classList.toggle('highlight', isTargetRegion);
        });
    }

    // 地方を選択
    function selectRegion(regionId) {
        if (currentRegion === regionId) return;
        currentRegion = regionId;
        selectRegion(regionId);
    }

    // ドラッグ開始
    function startDrag(e) {
        e.preventDefault();
        const pieceEl = e.target;
        if (!pieceEl.classList.contains('unplaced')) return;

        draggingPiece = allPieces.find(p => p.id === pieceEl.dataset.id);
        if (!draggingPiece) return;

        pieceEl.classList.add('dragging');
        
        const rect = pieceEl.getBoundingClientRect();
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchmove', onDrag, { passive: false });
        document.addEventListener('touchend', endDrag);
    }

    // ドラッグ中
    function onDrag(e) {
        if (!draggingPiece) return;
        e.preventDefault();
        
        const boardRect = puzzleBoard.getBoundingClientRect();
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        let newX = clientX - boardRect.left - offsetX;
        let newY = clientY - boardRect.top - offsetY;

        draggingPiece.element.style.left = `${newX}px`;
        draggingPiece.element.style.top = `${newY}px`;
    }

    // ドラッグ終了
    function endDrag() {
        if (!draggingPiece) return;

        draggingPiece.element.classList.remove('dragging');

        const currentX = parseFloat(draggingPiece.element.style.left);
        const currentY = parseFloat(draggingPiece.element.style.top);

        const dx = Math.abs(currentX - draggingPiece.correctX);
        const dy = Math.abs(currentY - draggingPiece.correctY);

        if (dx < SNAP_DISTANCE && dy < SNAP_DISTANCE) {
            placePiece(draggingPiece);
        }

        draggingPiece = null;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('touchend', endDrag);
    }

    // ピースを配置
    function placePiece(piece) {
        piece.element.style.left = `${piece.correctX}px`;
        piece.element.style.top = `${piece.correctY}px`;
        piece.element.classList.replace('unplaced', 'placed');
        
        if (snapSound) playSE(snapSound.src);
        infoText.textContent = `${piece.name}、せいかい！`;

        placedPieces.add(piece.id);
        checkRegionComplete();
    }

    // 地方のクリア判定
    function checkRegionComplete() {
        // 現在選択中の地方ではなく、ピースが属する地方で判定
        const lastPlacedPiece = allPieces.find(p => p.id === Array.from(placedPieces).pop());
        if (!lastPlacedPiece) return;
        const regionOfPlacedPiece = lastPlacedPiece.region;

        const regionPrefectures = PREFECTURES_DATA.filter(p => p.region === regionOfPlacedPiece);
        const placedInRegion = Array.from(placedPieces).filter(id => regionPrefectures.some(p => p.id === id));
        if (regionPrefectures.length > 0 && regionPrefectures.length === placedInRegion.length) {
            if (regionCompleteSound) playSE(regionCompleteSound.src);
            infoText.textContent = `「${REGIONS[currentRegion]}」クリア！おめでとう！`;
            completedRegions.add(currentRegion);
            
            const btn = document.querySelector(`.region-btn[data-region-id="${currentRegion}"]`);
            if (btn) btn.classList.add('completed');

            checkAllComplete();
        }
    }

    // 全クリア判定
    function checkAllComplete() {
        if (completedRegions.size === Object.keys(REGIONS).length) {
            if (winSound) playSE(winSound.src);
            winModal.classList.remove('hidden');
        }
    }

    // ヒント表示
    function showHint() {
        drawMap(true);
        setTimeout(() => drawMap(false), 2000);
    }

    // 初期化処理の最後に呼び出す
    function setupGame() {
        scatterPieces();
        selectRegion('all'); // 最初はすべてのピースをハイライト
    }

    init();
    setupGame(); // ゲームのセットアップを実行
});