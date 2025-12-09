// japan-puzzle.js
document.addEventListener('DOMContentLoaded', () => {
    // ダブルタップによるズームを防止
    document.body.style.touchAction = 'manipulation';

    // DOM要素
    const canvas = document.getElementById('puzzle-canvas');
    const ctx = canvas.getContext('2d');
    const regionSelector = document.getElementById('region-selector');
    const piecesContainer = document.getElementById('pieces-container');
    const puzzleBoard = document.getElementById('puzzle-board');
    const infoText = document.getElementById('info-text');
    const hintBtn = document.getElementById('hint-btn');
    const winModal = document.getElementById('win-modal');
    const playAgainBtn = document.getElementById('play-again-btn');

    // 音声
    const snapSound = document.getElementById('snap-sound');
    const regionCompleteSound = document.getElementById('region-complete-sound');
    const winSound = document.getElementById('win-sound');

    // ゲーム設定
    const MAP_IMAGE_SRC = 'assets/images/tizu1.png'; // 背景地図
    const MAP_WIDTH = 800;
    const MAP_HEIGHT = 600;
    const SNAP_DISTANCE = 35; // この距離以内ならスナップする

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
            // 最初の地方を選択
            document.querySelector('.region-btn').click();
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
            pieceEl.dataset.id = prefData.id;
            pieceEl.style.width = `${prefData.width}px`;
            pieceEl.style.height = `${prefData.height}px`;
            pieceEl.style.display = 'none'; // 最初は非表示
            
            const pieceObj = { ...prefData, element: pieceEl };
            allPieces.push(pieceObj);
            puzzleBoard.appendChild(pieceEl);

            pieceEl.addEventListener('mousedown', startDrag);
            pieceEl.addEventListener('touchstart', startDrag, { passive: false });
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
    }

    // 地方を選択
    function selectRegion(regionId) {
        if (currentRegion === regionId) return;
        currentRegion = regionId;

        document.querySelectorAll('.region-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.regionId === regionId);
        });

        // ピースの表示を切り替え
        piecesContainer.innerHTML = ''; // サイドパネルをクリア
        allPieces.forEach(piece => {
            const isPlaced = placedPieces.has(piece.id);
            const isCurrentRegion = piece.region === currentRegion;

            if (!isPlaced && isCurrentRegion) {
                const sidePiece = piece.element.cloneNode(true);
                sidePiece.style.all = 'unset'; // スタイルをリセット
                sidePiece.style.width = '80px'; // サイドパネル内でのサイズ
                sidePiece.style.height = 'auto';
                sidePiece.style.cursor = 'pointer';
                sidePiece.addEventListener('click', () => bringPieceToBoard(piece.id));
                piecesContainer.appendChild(sidePiece);
                piece.element.style.display = 'none';
            } else if (!isPlaced) {
                piece.element.style.display = 'none';
            }
        });

        const regionPrefectures = PREFECTURES_DATA.filter(p => p.region === regionId);
        const unplacedCount = regionPrefectures.filter(p => !placedPieces.has(p.id)).length;

        if (unplacedCount === 0 && regionPrefectures.length > 0) {
            infoText.textContent = `「${REGIONS[regionId]}」はクリア！`;
        } else {
            infoText.textContent = `「${REGIONS[regionId]}」のピースをおいてね`;
        }
    }

    function bringPieceToBoard(pieceId) {
        const piece = allPieces.find(p => p.id === pieceId);
        if (piece) {
            piece.element.style.left = '850px';
            piece.element.style.top = '250px';
            piece.element.style.display = 'block';
            selectRegion(currentRegion); // サイドパネルを更新
        }
    }

    // ドラッグ開始
    function startDrag(e) {
        e.preventDefault();
        const pieceEl = e.target;
        if (pieceEl.classList.contains('placed')) return;

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
        piece.element.classList.add('placed');
        
        if (snapSound) playSE(snapSound.src);
        infoText.textContent = `${piece.name}、せいかい！`;

        placedPieces.add(piece.id);
        checkRegionComplete();
    }

    // 地方のクリア判定
    function checkRegionComplete() {
        const regionPrefectures = PREFECTURES_DATA.filter(p => p.region === currentRegion);
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

    init();
});