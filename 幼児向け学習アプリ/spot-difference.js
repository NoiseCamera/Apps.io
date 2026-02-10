document.addEventListener('DOMContentLoaded', () => {
    // --- 設定 ---
    const IMAGE_SETS = [
        {
            id: 1,
            src1: 'assets/images/matigai/matigai1-1.png',
            src2: 'assets/images/matigai/matigai1-2.png'
        },
        {
            id: 2,
            src1: 'assets/images/matigai/matigai2-1.png',
            src2: 'assets/images/matigai/matigai2-2.png'
        },
        {
            id: 3,
            src1: 'assets/images/matigai/matigai3-1.png',
            src2: 'assets/images/matigai/matigai3-2.png'
        },
        {
            id: 4,
            src1: 'assets/images/matigai/matigai4-1.png',
            src2: 'assets/images/matigai/matigai4-2.png'
        },
        {
            id: 5,
            src1: 'assets/images/matigai/matigai5-1.png',
            src2: 'assets/images/matigai/matigai5-2.png'
        },
        {
            id: 6,
            src1: 'assets/images/matigai/matigai6-1.png',
            src2: 'assets/images/matigai/matigai6-2.png'
        }
    ];
    
    // --- DOM要素 ---
    const canvas1 = document.getElementById('canvas1');
    const canvas2 = document.getElementById('canvas2');
    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');
    const gameArea = document.getElementById('game-area');
    const foundCountEl = document.getElementById('found-count');
    const totalCountEl = document.getElementById('total-count');
    const winModal = document.getElementById('win-modal');
    const playAgainBtn = document.getElementById('play-again-btn');
    const restartBtn = document.getElementById('restart-btn');
    const titleScreen = document.getElementById('title-screen');
    const startBtn = document.getElementById('start-btn');
    const selectionArea = document.getElementById('selection-area');
    const imageList = document.getElementById('image-list');

    // 音声
    const correctSound = document.getElementById('correct-sound');
    const incorrectSound = document.getElementById('incorrect-sound');
    const fanfareSound = document.getElementById('fanfare-sound');

    // --- 状態 ---
    let differenceRegions = []; // {x, y, radius, found}
    let imagesLoaded = 0;
    const img1 = new Image();
    const img2 = new Image();
    let currentSet = null;

    // --- 初期化 ---
    function init() {
        // イベントリスナー
        canvas1.addEventListener('click', handleTap);
        canvas2.addEventListener('click', handleTap);
        
        // タッチ対応
        canvas1.addEventListener('touchstart', (e) => handleTap(e.touches[0]));
        canvas2.addEventListener('touchstart', (e) => handleTap(e.touches[0]));

        playAgainBtn.addEventListener('click', () => {
            resetGame();
        });

        // メイン画面の「もういちど」ボタン
        if (restartBtn) {
            restartBtn.addEventListener('click', resetGame);
        }

        // スタートボタンで選択画面を表示
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (titleScreen) titleScreen.classList.add('hidden');
            });
        }

        // 初期化処理
        createSelectionScreen();
        
        // 最初の問題をロードしておく
        if (IMAGE_SETS.length > 0) {
            startGame(IMAGE_SETS[0]);
        }

        window.addEventListener('resize', resizeCanvases);
    }

    // 画像選択画面を作成
    function createSelectionScreen() {
        if (!imageList) return;
        imageList.innerHTML = '';
        IMAGE_SETS.forEach(set => {
            const btn = document.createElement('button');
            btn.className = 'image-select-btn';
            
            const thumb = document.createElement('img');
            thumb.src = set.src1;
            thumb.alt = `もんだい ${set.id}`;
            
            btn.appendChild(thumb);
            
            btn.addEventListener('click', () => startGame(set));
            imageList.appendChild(btn);
        });
    }

    // ゲーム開始処理
    function startGame(set) {
        currentSet = set;
        if (gameArea) gameArea.classList.remove('hidden');
        
        // 状態リセット
        imagesLoaded = 0;
        differenceRegions = [];

        // 画像読み込み開始
        img1.onload = onImageLoad;
        img2.onload = onImageLoad;
        img1.src = set.src1;
        img2.src = set.src2;
        // img.onload が発火して analyzeImages が呼ばれる
    }

    function onImageLoad() {
        imagesLoaded++;
        if (imagesLoaded === 2) {
            analyzeImages();
        }
    }

    // --- 画像解析ロジック ---
    function analyzeImages() {
        // ImageAnalysis (image-analysis.js) を使用して解析
        // PythonのOpenCVロジックを再現したもの
        const rects = ImageAnalysis.analyze(img1, img2);

        // 面積でソートして上位5つを採用
        rects.sort((a, b) => (b.w * b.h) - (a.w * a.h));
        const finalRects = rects.slice(0, 5);

        // 結果を differenceRegions に変換
        differenceRegions = finalRects.map(r => ({
            x: r.x + r.w / 2,
            y: r.y + r.h / 2,
            radius: Math.max(r.w, r.h) / 2 + 15, // 少し余裕を持たせる
            found: false
        }));

        // ゲーム開始準備
        gameArea.classList.remove('hidden');
        
        // 表示用キャンバスのセットアップ
        resizeCanvases();
        
        // UI更新
        totalCountEl.textContent = differenceRegions.length;
        console.log("検出された間違い箇所:", differenceRegions);
    }

    // --- 描画 ---
    function resizeCanvases() {
        // 描画解像度は画像の解像度に合わせる（綺麗に表示するため）
        // 表示サイズはCSS (width: 100%; height: auto;) で制御される
        canvas1.width = img1.width;
        canvas1.height = img1.height;
        canvas2.width = img1.width;
        canvas2.height = img1.height;

        draw();
    }

    function draw() {
        // 画像を描画
        ctx1.drawImage(img1, 0, 0);
        ctx2.drawImage(img2, 0, 0);

        // 見つけた間違いに丸をつける
        differenceRegions.forEach(region => {
            if (region.found) {
                drawCircle(ctx1, region.x, region.y, region.radius);
                drawCircle(ctx2, region.x, region.y, region.radius);
            }
        });
    }

    function drawCircle(ctx, x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#ff1744'; // 赤色
        ctx.stroke();
    }

    // --- タップ処理 ---
    function handleTap(e) {
        // クリックされたキャンバスを取得
        const targetCanvas = e.target;
        const rect = targetCanvas.getBoundingClientRect();

        // クリック座標（CSSピクセル）
        const clientX = e.clientX;
        const clientY = e.clientY;

        // キャンバス内の相対座標に変換
        // 表示サイズと描画解像度の比率を使って計算
        const x = (clientX - rect.left) * (targetCanvas.width / rect.width);
        const y = (clientY - rect.top) * (targetCanvas.height / rect.height);

        let hit = false;

        // 間違いエリアとの当たり判定
        differenceRegions.forEach(region => {
            if (!region.found) {
                const dx = x - region.x;
                const dy = y - region.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                // 半径内なら正解
                if (dist <= region.radius) {
                    region.found = true;
                    hit = true;
                }
            }
        });

        if (hit) {
            playSE(correctSound);
            draw(); // 丸を描画
            updateStatus();
            checkWin();
        } else {
            // すでに見つけた場所以外をクリックしたら不正解音
            playSE(incorrectSound);
        }
    }

    function updateStatus() {
        const found = differenceRegions.filter(r => r.found).length;
        foundCountEl.textContent = found;
    }

    function checkWin() {
        const allFound = differenceRegions.every(r => r.found);
        if (allFound) {
            setTimeout(() => {
                playSE(fanfareSound);
                winModal.classList.remove('hidden');
                // ポイント付与
                if (typeof addPoints === 'function') {
                    addPoints(5);
                }
            }, 500);
        }
    }

    // ゲームリセット（一覧に戻る）
    function resetGame() {
        winModal.classList.add('hidden');
        foundCountEl.textContent = '0';
        totalCountEl.textContent = '?';
        if (currentSet) {
            startGame(currentSet);
        }
    }

    // 簡易SE再生
    function playSE(audioEl) {
        if (audioEl) {
            audioEl.currentTime = 0;
            audioEl.play().catch(()=>{});
        }
    }

    init();
});
