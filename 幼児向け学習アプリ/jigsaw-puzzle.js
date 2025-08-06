document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Element References ---
  const canvas = document.getElementById('puzzle-canvas');
  const ctx = canvas.getContext('2d');
  const referenceImage = document.getElementById('current-reference-image');
  const animalSelectorGrid = document.getElementById('animal-selector-grid');
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');
  const winMessage = document.getElementById('win-message');
  const winImage = document.getElementById('win-image');
  const playAgainBtn = document.getElementById('play-again-btn');

  // --- Audio References ---
  const snapSound = document.getElementById('snap-sound');
  const winSound = document.getElementById('win-sound');

  // このゲームで使う効果音のリスト
  const SOUND_EFFECTS = [
    'assets/sounds/snap.mp3', // snapSound.src
    'assets/sounds/win.mp3'   // winSound.src
  ];

  // --- Game Configuration ---
  const ANIMALS = [
    'usagi', 'アシカ', 'イヌ', 'イルカ', 'ウマ', 'キリン', 'クジラ', 'クマ',
    'ゴリラ', 'サメ', 'サル', 'シャチ', 'トラ', 'ネコ', 'ハムスター',
    'パンダ', 'ペンギン', 'ライオン', 'リス', 'レッサーパンダ'
  ];
  const PUZZLE_SIZE = 480; // パズルエリアの基本サイズを縮小
  const MARGIN = 120; // 周囲の余白も縮小
  const SNAP_DISTANCE = 20;

  // --- Game State ---
  let pieces = [];
  let puzzleGridSize = 3; // Default to 'easy' (3x3)
  let pieceSize = PUZZLE_SIZE / puzzleGridSize;
  let currentAnimal = 'usagi';
  let image = new Image();
  let selectedPiece = null;
  let offsetX = 0;
  let offsetY = 0;
  let bgmInitialized = false;
  let isGameWon = false;

  let hintTimer = null;
  let showHintHighlight = false;
  const HINT_TIMEOUT = 2000; // ヒントが表示されるまでの時間 (2秒)

  // --- Core Functions ---

  /**
   * パズルピースを配置するランダムな初期座標を、完成エリアの外側に生成します。
   * @param {number} pieceSize - ピースのサイズ
   * @returns {{x: number, y: number}} - 生成された座標
   */
  function getRandomSpawnPoint(pieceSize) {
    const canvasWidth = PUZZLE_SIZE + MARGIN * 2;
    const canvasHeight = PUZZLE_SIZE + MARGIN * 2;
    let x, y;

    const side = Math.floor(Math.random() * 4); // 0:上, 1:下, 2:左, 3:右

    switch (side) {
      case 0: // 上エリア
        x = Math.random() * (canvasWidth - pieceSize);
        y = Math.random() * (MARGIN - pieceSize);
        break;
      case 1: // 下エリア
        x = Math.random() * (canvasWidth - pieceSize);
        y = (PUZZLE_SIZE + MARGIN) + Math.random() * (MARGIN - pieceSize);
        break;
      case 2: // 左エリア
        x = Math.random() * (MARGIN - pieceSize);
        y = MARGIN + Math.random() * (PUZZLE_SIZE - pieceSize);
        break;
      case 3: // 右エリア
        x = (PUZZLE_SIZE + MARGIN) + Math.random() * (MARGIN - pieceSize);
        y = MARGIN + Math.random() * (PUZZLE_SIZE - pieceSize);
        break;
    }
    return { x, y };
  }

  /**
   * Initializes or resets the puzzle with the current settings.
   */
  function initializePuzzle() {
    isGameWon = false;
    winMessage.classList.add('hidden');
    pieceSize = PUZZLE_SIZE / puzzleGridSize;
    pieces = [];

    // Calculate the size of a piece on the source image based on its actual dimensions
    const imagePieceWidth = image.naturalWidth / puzzleGridSize;
    const imagePieceHeight = image.naturalHeight / puzzleGridSize;

    // Create puzzle pieces
    for (let y = 0; y < puzzleGridSize; y++) {
      for (let x = 0; x < puzzleGridSize; x++) {
        const spawnPoint = getRandomSpawnPoint(pieceSize);
        const piece = {
          sx: x * imagePieceWidth,  // Source x on actual image
          sy: y * imagePieceHeight, // Source y on actual image
          sWidth: imagePieceWidth,  // Source width on actual image
          sHeight: imagePieceHeight,// Source height on actual image
          correctX: x * pieceSize + MARGIN,  // The correct final X position on the canvas
          correctY: y * pieceSize + MARGIN,  // The correct final Y position on the canvas
          dx: spawnPoint.x, // Destination x on canvas (random, outside puzzle area)
          dy: spawnPoint.y, // Destination y on canvas (random, outside puzzle area)
          width: pieceSize,         // The size of the piece on the canvas
          height: pieceSize,        // The size of the piece on the canvas
          topTab: 0,
          rightTab: 0,
          bottomTab: 0,
          leftTab: 0,
          isLocked: false,
          isAnimating: false, // アニメーション中かどうかのフラグ
        };
        pieces.push(piece);
      }
    }

    // Set canvas dimensions
    canvas.width = PUZZLE_SIZE + MARGIN * 2;
    canvas.height = PUZZLE_SIZE + MARGIN * 2;

    // Assign tab shapes to each piece
    for (let y = 0; y < puzzleGridSize; y++) {
      for (let x = 0; x < puzzleGridSize; x++) {
        const piece = pieces[y * puzzleGridSize + x];
        
        // Top tab
        if (y > 0) {
          piece.topTab = -pieces[(y - 1) * puzzleGridSize + x].bottomTab;
        } else {
          piece.topTab = 0;
        }
        // Right tab
        if (x < puzzleGridSize - 1) {
          piece.rightTab = Math.random() > 0.5 ? 1 : -1;
        } else {
          piece.rightTab = 0;
        }
        // Bottom tab
        if (y < puzzleGridSize - 1) {
          piece.bottomTab = Math.random() > 0.5 ? 1 : -1;
        } else {
          piece.bottomTab = 0;
        }
        // Left tab
        if (x > 0) {
          piece.leftTab = -pieces[y * puzzleGridSize + (x - 1)].rightTab;
        } else {
          piece.leftTab = 0;
        }
      }
    }

    // Re-attach event listeners in case they were removed by the win animation
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    draw();
  }

  /**
   * Draws all puzzle pieces onto the canvas.
   */
  function drawPiecePath(ctx, piece) {
    const sz = piece.width; // piece size
    const tabSize = sz * 0.2; // size of the tab

    ctx.beginPath();
    ctx.moveTo(piece.dx, piece.dy);

    // Top
    if (piece.topTab !== 0) {
      ctx.lineTo(piece.dx + sz * 0.5 - tabSize, piece.dy);
      ctx.bezierCurveTo(
        piece.dx + sz * 0.5 - tabSize, piece.dy - tabSize * piece.topTab,
        piece.dx + sz * 0.5 + tabSize, piece.dy - tabSize * piece.topTab,
        piece.dx + sz * 0.5 + tabSize, piece.dy
      );
    }
    ctx.lineTo(piece.dx + sz, piece.dy);

    // Right
    if (piece.rightTab !== 0) {
      ctx.lineTo(piece.dx + sz, piece.dy + sz * 0.5 - tabSize);
      ctx.bezierCurveTo(
        piece.dx + sz + tabSize * piece.rightTab, piece.dy + sz * 0.5 - tabSize,
        piece.dx + sz + tabSize * piece.rightTab, piece.dy + sz * 0.5 + tabSize,
        piece.dx + sz, piece.dy + sz * 0.5 + tabSize
      );
    }
    ctx.lineTo(piece.dx + sz, piece.dy + sz);

    // Bottom
    if (piece.bottomTab !== 0) {
      ctx.lineTo(piece.dx + sz * 0.5 + tabSize, piece.dy + sz);
      ctx.bezierCurveTo(
        piece.dx + sz * 0.5 + tabSize, piece.dy + sz + tabSize * piece.bottomTab,
        piece.dx + sz * 0.5 - tabSize, piece.dy + sz + tabSize * piece.bottomTab,
        piece.dx + sz * 0.5 - tabSize, piece.dy + sz
      );
    }
    ctx.lineTo(piece.dx, piece.dy + sz);

    // Left
    if (piece.leftTab !== 0) {
      ctx.lineTo(piece.dx, piece.dy + sz * 0.5 + tabSize);
      ctx.bezierCurveTo(
        piece.dx - tabSize * piece.leftTab, piece.dy + sz * 0.5 + tabSize,
        piece.dx - tabSize * piece.leftTab, piece.dy + sz * 0.5 - tabSize,
        piece.dx, piece.dy + sz * 0.5 - tabSize
      );
    }
    ctx.lineTo(piece.dx, piece.dy);
    ctx.closePath();
  }

  /**
   * Draws a single piece, handling its state (locked, selected, animating).
   * @param {object} piece - The piece to draw.
   */
  function drawSinglePiece(piece) {
    ctx.save();

    // Apply scaling animation if the piece is snapping into place
    if (piece.isAnimating && piece.scale) {
      const centerX = piece.dx + piece.width / 2;
      const centerY = piece.dy + piece.height / 2;
      ctx.translate(centerX, centerY);
      ctx.scale(piece.scale, piece.scale);
      ctx.translate(-centerX, -centerY);
    }

    drawPiecePath(ctx, piece);
    ctx.clip();

    // Draw the image onto the piece shape
    const tabSize = piece.width * 0.2;
    const sTabSizeX = piece.sWidth * 0.2;
    const sTabSizeY = piece.sHeight * 0.2;
    ctx.drawImage(
      image,
      piece.sx - sTabSizeX, piece.sy - sTabSizeY,
      piece.sWidth + sTabSizeX * 2, piece.sHeight + sTabSizeY * 2,
      piece.dx - tabSize, piece.dy - tabSize,
      piece.width + tabSize * 2, piece.height + tabSize * 2
    );

    // ctx.restore() は、枠線を描画した後に呼び出し元の draw() 関数で実行されるように変更
  }


  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the faint guide image in the center if the puzzle hasn't been won
    if (winMessage.classList.contains('hidden')) {
      ctx.globalAlpha = 0.2;
      // Draw the full image as a guide in the puzzle area
      ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, MARGIN, MARGIN, PUZZLE_SIZE, PUZZLE_SIZE);
      ctx.globalAlpha = 1.0;

      // Draw a border around the puzzle area
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.strokeRect(MARGIN, MARGIN, PUZZLE_SIZE, PUZZLE_SIZE);
    }

    // Draw hint highlight if active
    if (showHintHighlight && selectedPiece) {
      ctx.save();
      ctx.strokeStyle = '#fdd835'; // 黄色
      ctx.lineWidth = 5;
      ctx.setLineDash([12, 8]); // 点線
      ctx.globalAlpha = 0.9;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;

      // Create a temporary piece object with correct coordinates for drawing the path
      const hintPiece = {
        ...selectedPiece,
        dx: selectedPiece.correctX,
        dy: selectedPiece.correctY
      };
      drawPiecePath(ctx, hintPiece);
      ctx.stroke();
      ctx.restore();
    }

    // Draw locked pieces first (in the background)
    pieces.filter(p => p.isLocked && p !== selectedPiece).forEach(piece => {
      drawSinglePiece(piece);
      ctx.restore(); // Restore from the save() in drawSinglePiece
    });

    // Draw unlocked pieces on top
    pieces.filter(p => !p.isLocked && p !== selectedPiece).forEach(piece => {
      drawSinglePiece(piece); // This saves, transforms, defines path, clips, and draws image
      // Draw border for unlocked pieces
      ctx.strokeStyle = '#ab47bc'; // Purple border
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore(); // Now restore the context
    });

    // Redraw the selected piece last so it's on top
    if (selectedPiece) {
      drawSinglePiece(selectedPiece); // This saves, transforms, defines path, clips, and draws image
      // Draw highlight border for the selected piece
      ctx.strokeStyle = '#fbc02d'; // Highlight selected piece
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore(); // Restore the context
    }
  }

  /**
   * Loads the selected animal image and starts the puzzle.
   */
  function loadImage() {
    image.src = `assets/images/${currentAnimal}.png`;
    image.onload = () => {
      initializePuzzle();
    };
    image.onerror = () => {
      console.error(`画像の読み込みに失敗しました: ${image.src}`);
    };
  }

  /**
   * Animates a piece to its final correct position.
   * @param {object} piece - The puzzle piece to animate.
   */
  function animatePieceToFinalPosition(piece) {
    const startX = piece.dx;
    const startY = piece.dy;
    const endX = piece.correctX;
    const endY = piece.correctY;
    const duration = 300; // 0.3秒でアニメーション
    const peakScale = 1.15; // 115%まで拡大
    let startTime = null;

    piece.isAnimating = true;

    function animationStep(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic for smooth deceleration

      // Interpolate position
      piece.dx = startX + (endX - startX) * easeProgress;
      piece.dy = startY + (endY - startY) * easeProgress;

      // "Pop" animation for scale: grows to peakScale then shrinks back to 1.
      // This uses a parabolic curve (4 * (x - x^2)).
      const scaleProgress = 4 * (progress - (progress * progress));
      piece.scale = 1 + (peakScale - 1) * scaleProgress;

      draw();

      if (progress < 1) {
        requestAnimationFrame(animationStep);
      } else {
        // Animation finished, clean up and lock the piece
        piece.dx = endX; // Ensure it's exactly at the end position
        piece.dy = endY;
        piece.isLocked = true;
        piece.isAnimating = false; // Stop the animation flag
        delete piece.scale; // Remove the temporary scale property

        if (snapSound) {
          playSE(snapSound.src);
        }
        draw(); // Final redraw in its correct state
        checkWin();
      }
    }
    requestAnimationFrame(animationStep);
  }
  /**
   * Animates the final win sequence where pieces gather and form the complete image.
   */
  function animateWinSequence() {
    // Disable interaction during animation
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('mouseleave', onMouseUp);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);

    const gatherDuration = 1000; // 1 second to gather
    const expandDuration = 500;  // 0.5 seconds to expand
    const totalDuration = gatherDuration + expandDuration;
    let startTime = null;

    const centerX = MARGIN + PUZZLE_SIZE / 2;
    const centerY = MARGIN + PUZZLE_SIZE / 2;

    const initialPositions = pieces.map(p => ({ x: p.dx, y: p.dy }));

    function animationStep(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (elapsedTime < gatherDuration) {
        const progress = elapsedTime / gatherDuration;
        const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

        pieces.forEach((piece, i) => {
          const initial = initialPositions[i];
          piece.dx = initial.x + (centerX - piece.width / 2 - initial.x) * easeProgress;
          piece.dy = initial.y + (centerY - piece.height / 2 - initial.y) * easeProgress;
          drawSinglePiece(piece);
          ctx.restore();
        });
      } else {
        const progress = Math.min((elapsedTime - gatherDuration) / expandDuration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const currentSize = PUZZLE_SIZE * easeProgress;
        const currentX = centerX - currentSize / 2;
        const currentY = centerY - currentSize / 2;
        ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, currentX, currentY, currentSize, currentSize);
      }

      if (elapsedTime < totalDuration) {
        requestAnimationFrame(animationStep);
      } else {
        // Final state: show win message and confetti
        triggerConfetti();
        if (winSound) {
          playSE(winSound.src);
        }
        winImage.src = `assets/images/${currentAnimal}.png`;
        winMessage.classList.remove('hidden');
      }
    }
    requestAnimationFrame(animationStep);
  }
  /**
   * Checks if all pieces are locked in place.
   */
  function checkWin() {
    if (isGameWon || !pieces.every(p => p.isLocked)) return;

    isGameWon = true;

    // 難易度に応じてポイントを追加 (3x3: 3点, 4x4: 4点, 5x5: 5点)
    addPoints(puzzleGridSize);

    animateWinSequence();
  }

  /**
   * Triggers a confetti animation from the top of the screen.
   */
  function triggerConfetti() {
    const duration = 3 * 1000; // 3秒間
    const animationEnd = Date.now() + duration;
    // 紙吹雪の基本設定
    const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 100 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // 画面の上部からランダムに発射
      // origin.yをマイナスにすることで、画面外の上部から発射されるように見せる
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
  }

  // --- Event Handlers ---

  function onMouseDown(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find the topmost, unlocked piece that was clicked
    for (let i = pieces.length - 1; i >= 0; i--) {
      const piece = pieces[i];
      if (!piece.isLocked && !piece.isAnimating &&
          mouseX > piece.dx && mouseX < piece.dx + piece.width &&
          mouseY > piece.dy && mouseY < piece.dy + piece.height) {
        
        selectedPiece = piece;
        offsetX = mouseX - piece.dx;
        offsetY = mouseY - piece.dy;

        // Move the selected piece to the end of the array to draw it on top
        pieces.splice(i, 1);
        pieces.push(selectedPiece);

        // Start hint timer
        clearTimeout(hintTimer);
        hintTimer = setTimeout(() => {
          showHintHighlight = true;
          draw(); // Redraw to show the hint
        }, HINT_TIMEOUT);

        break;
      }
    }
  }

  function onMouseMove(e) {
    if (!selectedPiece) return;
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    selectedPiece.dx = mouseX - offsetX;
    selectedPiece.dy = mouseY - offsetY;

    draw();
  }

  function onMouseUp(e) {
    // Always clear hint timer and hide highlight on mouse up
    clearTimeout(hintTimer);
    const needsRedrawToClearHint = showHintHighlight;
    showHintHighlight = false;

    // If we were not holding a piece but a hint was showing, redraw to clear it.
    if (!selectedPiece && needsRedrawToClearHint) {
      draw();
    }

    if (!selectedPiece) return;
    e.preventDefault();

    const diffX = Math.abs(selectedPiece.dx - selectedPiece.correctX);
    const diffY = Math.abs(selectedPiece.dy - selectedPiece.correctY);

    // Snap to place if close enough
    if (diffX < SNAP_DISTANCE && diffY < SNAP_DISTANCE) {
      animatePieceToFinalPosition(selectedPiece);
      selectedPiece = null; // アニメーションに任せるので、ドラッグは終了
    } else {
      selectedPiece = null;
      draw();
    }
  }

  // --- Touch Event Handlers (for mobile) ---
  function onTouchStart(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      onMouseDown(mouseEvent);
    }
  }

  function onTouchMove(e) {
    if (!selectedPiece) {
      return; // ピースを掴んでいないときは、通常のスクロールを許可
    }
    // ピースを掴んでいるときは、ページのスクロールを無効にする
    e.preventDefault();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      onMouseMove(mouseEvent);
    }
  }

  function onTouchEnd(e) {
    const mouseEvent = new MouseEvent("mouseup", {});
    onMouseUp(mouseEvent);
  }

  /**
   * Creates the animal selection buttons.
   */
  function createAnimalSelector() {
    ANIMALS.forEach(animal => {
      const btn = document.createElement('button');
      btn.classList.add('animal-select-btn');
      btn.dataset.animal = animal;
      btn.style.backgroundImage = `url('assets/images/${animal}.png')`;
      btn.addEventListener('click', (e) => {
        currentAnimal = e.target.dataset.animal;
        referenceImage.src = `assets/images/${currentAnimal}.png`;
        loadImage();
      });
      animalSelectorGrid.appendChild(btn);
    });
  }

  /**
   * Initializes BGM on the first user interaction.
   */
  function initializeBgm() {
    if (bgmInitialized) return;
    const bgm = document.getElementById('bgm');
    if (bgm) {
      bgm.play().catch(error => console.log('BGMの再生にはユーザーの操作が必要です。', error));
    }
    if (typeof preloadAudioSources === 'function') {
      preloadAudioSources(SOUND_EFFECTS);
    }
    bgmInitialized = true;
  }

  /**
   * The main function to initialize the game.
   */
  function initialize() {
    difficultyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        difficultyButtons.forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        // ピース数が約半分になるように、各難易度のグリッドサイズを小さく調整します。
        // 元の想定: かんたん(4x4=16), ふつう(6x6=36), むずかしい(8x8=64)
        // 変更後: かんたん(3x3=9), ふつう(4x4=16), むずかしい(5x5=25)
        const originalSize = parseInt(e.target.dataset.size, 10);
        if (originalSize <= 4) {
          puzzleGridSize = 3;
        } else if (originalSize <= 6) {
          puzzleGridSize = 4;
        } else {
          puzzleGridSize = 5;
        }
        initializePuzzle();
      });
    });

    playAgainBtn.addEventListener('click', () => {
      winMessage.classList.add('hidden');
      // initializePuzzle will re-attach event listeners
      initializePuzzle();
    });

    // Initial setup
    createAnimalSelector();
    loadImage();

    // Add a general listener to initialize BGM on any first click/touch
    document.body.addEventListener('click', initializeBgm, { once: true });
    document.body.addEventListener('touchstart', initializeBgm, { once: true });
  }

  initialize();
});