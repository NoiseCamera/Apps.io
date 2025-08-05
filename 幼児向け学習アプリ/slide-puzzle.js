// Wait for the DOM to be fully loaded before running the script.
document.addEventListener('DOMContentLoaded', () => {

  // --- DOM Element References ---
  const gameArea = document.getElementById('game-area');
  const puzzleGrid = document.getElementById('puzzle-grid');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const moveCountElem = document.getElementById('move-count');
  const timeCountElem = document.getElementById('time-count');
  const winMessage = document.getElementById('win-message');
  const titleScreen = document.getElementById('title-screen');
  const startBtn = document.getElementById('start-btn');
  const animalSelectorGrid = document.getElementById('animal-selector-grid');
  const currentReferenceImage = document.getElementById('current-reference-image');
  const winImage = document.getElementById('win-image');
  const difficultySelector = document.getElementById('difficulty-selector');
  const winSound = document.getElementById('win-sound');
  const playAgainBtn = document.getElementById('play-again-btn');

  // --- Game Configuration ---
  const ANIMALS = [
    'usagi', 'アシカ', 'イヌ', 'イルカ', 'ウマ', 'キリン', 'クジラ', 'クマ',
    'ゴリラ', 'サメ', 'サル', 'シャチ', 'トラ', 'ネコ', 'ハムスター',
    'パンダ', 'ペンギン', 'ライオン', 'リス', 'レッサーパンダ'
  ];
  const PUZZLE_CONTAINER_SIZE = 540; // from CSS .puzzle-grid width/height

  let gridSize = 3;
  let tileCount = gridSize * gridSize;
  let emptyValue = tileCount - 1; // The last tile is the empty one.
  let tileSize = PUZZLE_CONTAINER_SIZE / gridSize;

  // --- Game State ---
  let tiles = []; // Array representing the logical state of the puzzle grid.
  let moveCount = 0;
  let seconds = 0;
  let timerInterval = null;
  let currentAnimal = 'usagi';
  let bgmInitialized = false; // BGMが初期化されたかどうかのフラグ

  // --- Core Functions ---

  /**
   * Sets the game difficulty by changing the grid size.
   * @param {number} size The new grid size (e.g., 3 for 3x3).
   */
  function setDifficulty(size) {
    gridSize = size;
    tileCount = gridSize * gridSize;
    emptyValue = tileCount - 1;
    tileSize = PUZZLE_CONTAINER_SIZE / gridSize;

    // Update selected button style
    difficultySelector.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.size, 10) === size);
    });

    createTiles();
    startNewGame();
  }

  /**
   * Creates the tile DOM elements and appends them to the grid.
   */
  function createTiles() {
    puzzleGrid.innerHTML = ''; // Clear any existing tiles
    for (let i = 0; i < tileCount; i++) {
      const tile = document.createElement('div');
      tile.classList.add('puzzle-tile');
      tile.dataset.value = i; // The tile's correct, original value (0-8)
      tile.style.width = `${tileSize}px`;
      tile.style.height = `${tileSize}px`;
      tile.style.backgroundImage = `url('assets/images/${currentAnimal}.png')`;

      if (i === emptyValue) {
        tile.classList.add('empty');
      }
      puzzleGrid.appendChild(tile);
    }
  }

  /**
   * Updates the visual position of each tile on the grid based on the `tiles` array.
   */
  function render() {
    tiles.forEach((value, index) => {
      // `value` is the tile's original number (0-8)
      // `index` is its current position in the grid (0-8)
      const tileElement = puzzleGrid.querySelector(`[data-value='${value}']`);
      if (tileElement) {
        const col = index % gridSize;
        const row = Math.floor(index / gridSize);
        tileElement.style.left = `${col * tileSize}px`;
        tileElement.style.top = `${row * tileSize}px`;

        // Set the background image position for this specific tile
        if (value !== emptyValue) {
          const imageCol = value % gridSize;
          const imageRow = Math.floor(value / gridSize);
          tileElement.style.backgroundPosition = `-${imageCol * tileSize}px -${imageRow * tileSize}px`;
        }
      }
    });
  }

  /**
   * Shuffles the `tiles` array by performing a series of valid moves.
   * This ensures the puzzle is always solvable.
   */
  function shuffle() {
    // Start with a solved puzzle
    tiles = Array.from({ length: tileCount }, (_, i) => i);

    let shuffleMoves = gridSize * gridSize * 5; // Increase shuffles for larger puzzles
    for (let i = 0; i < shuffleMoves; i++) {
      const emptyIndex = tiles.indexOf(emptyValue);
      const neighbors = getNeighbors(emptyIndex);
      const randomNeighborIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
      // Swap the empty tile with a random neighbor
      [tiles[emptyIndex], tiles[randomNeighborIndex]] = [tiles[randomNeighborIndex], tiles[emptyIndex]];
    }
  }

  /**
   * Starts a new game: resets state, shuffles, and renders the puzzle.
   */
  function startNewGame() {
    moveCount = 0;
    startTimer();
    moveCountElem.textContent = moveCount;
    winMessage.classList.add('hidden');
    gameArea.classList.remove('hidden-win'); // ゲームエリアを再表示

    // Before shuffling, ensure the empty tile is visually reset to its empty state,
    // in case it was filled in from a previous win.
    const emptyTile = puzzleGrid.querySelector(`[data-value='${emptyValue}']`);
    if (emptyTile && !emptyTile.classList.contains('empty')) {
      emptyTile.classList.add('empty');
    }

    shuffle();
    render();
  }

  // --- Event Handlers ---

  /**
   * Handles clicks on the puzzle grid.
   * @param {MouseEvent} e The click event.
   */
  function handleGridClick(e) {
    // Ignore clicks if the game is won or if the click is not on a tile
    if (!winMessage.classList.contains('hidden')) return;

    const clickedTile = e.target.closest('.puzzle-tile');
    if (!clickedTile || clickedTile.classList.contains('empty')) {
      return;
    }

    const clickedValue = parseInt(clickedTile.dataset.value, 10);
    const clickedIndex = tiles.indexOf(clickedValue);
    const emptyIndex = tiles.indexOf(emptyValue);

    const clickedRow = Math.floor(clickedIndex / gridSize);
    const clickedCol = clickedIndex % gridSize;
    const emptyRow = Math.floor(emptyIndex / gridSize);
    const emptyCol = emptyIndex % gridSize;

    let canMove = false;

    // Check if the clicked tile is in the same row or column as the empty tile
    if (clickedRow === emptyRow) {
      // Move tiles horizontally
      canMove = true;
      const step = (clickedIndex < emptyIndex) ? 1 : -1;
      for (let i = emptyIndex; i !== clickedIndex; i -= step) {
        tiles[i] = tiles[i - step];
      }
    } else if (clickedCol === emptyCol) {
      // Move tiles vertically
      canMove = true;
      const step = (clickedIndex < emptyIndex) ? gridSize : -gridSize;
      for (let i = emptyIndex; i !== clickedIndex; i -= step) {
        tiles[i] = tiles[i - step];
      }
    }

    if (canMove) {
      // Move the empty tile to the clicked position
      tiles[clickedIndex] = emptyValue;
      moveCount++;
      moveCountElem.textContent = moveCount;
      render();
      checkWin();
    }
  }

  /**
   * Creates the animal selection buttons and adds them to the grid.
   */
  function createAnimalSelector() {
    ANIMALS.forEach(animal => {
      const btn = document.createElement('button');
      btn.classList.add('animal-select-btn');
      btn.dataset.animal = animal;
      btn.style.backgroundImage = `url('assets/images/${animal}.png')`;
      btn.addEventListener('click', handleAnimalSelect);
      animalSelectorGrid.appendChild(btn);
    });
  }

  function handleAnimalSelect(e) {
    currentAnimal = e.target.dataset.animal;
    const newImageUrl = `assets/images/${currentAnimal}.png`;

    // Update reference image and all puzzle tiles
    currentReferenceImage.src = newImageUrl;
    puzzleGrid.querySelectorAll('.puzzle-tile').forEach(tile => {
      tile.style.backgroundImage = `url('${newImageUrl}')`;
    });

    // Re-create tiles and start a new game with the new image and current difficulty
    createTiles();
    startNewGame();
  }

  /**
   * Handles keyboard arrow key presses to move tiles.
   * @param {KeyboardEvent} e The keydown event.
   */
  function handleKeyDown(e) {
    // Ignore key presses if a modal (title or win message) is open.
    if (!titleScreen.classList.contains('hidden') || !winMessage.classList.contains('hidden')) {
      return;
    }

    const emptyIndex = tiles.indexOf(emptyValue);
    let targetIndex = -1; // The index of the tile to swap with the empty one.

    // Determine which tile to move based on the arrow key pressed.
    // The logic is "which tile should move INTO the empty space".
    switch (e.key) {
      case 'ArrowUp': // Move the tile BELOW the empty space UP.
        targetIndex = emptyIndex + gridSize;
        break;
      case 'ArrowDown': // Move the tile ABOVE the empty space DOWN.
        targetIndex = emptyIndex - gridSize;
        break;
      case 'ArrowLeft': // Move the tile to the RIGHT of the empty space LEFT.
        targetIndex = emptyIndex + 1;
        break;
      case 'ArrowRight': // Move the tile to the LEFT of the empty space RIGHT.
        targetIndex = emptyIndex - 1;
        break;
      default:
        return; // Not an arrow key, do nothing.
    }

    e.preventDefault(); // Prevent default browser action for arrow keys (like scrolling).

    // Check if the target tile is a valid neighbor of the empty tile.
    const neighbors = getNeighbors(emptyIndex);
    if (neighbors.includes(targetIndex)) {
      // It's a valid move. Find the tile and simulate a click on it.
      const valueToMove = tiles[targetIndex];
      const tileToMove = puzzleGrid.querySelector(`[data-value='${valueToMove}']`);
      if (tileToMove) {
        tileToMove.click();
      }
    }
  }

  // --- Helper Functions ---

  /**
   * Gets the valid neighbor indices for a given index in the grid.
   * @param {number} index The index to find neighbors for.
   * @returns {number[]} An array of neighbor indices.
   */
  function getNeighbors(index) {
    const neighbors = [];
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    if (row > 0) neighbors.push(index - gridSize); // Top
    if (row < gridSize - 1) neighbors.push(index + gridSize); // Bottom
    if (col > 0) neighbors.push(index - 1); // Left
    if (col < gridSize - 1) neighbors.push(index + 1); // Right

    return neighbors;
  }

  /**
   * Stops the game timer.
   */
  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  /**
   * Updates the timer display on the screen.
   */
  function updateTimerDisplay() {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    timeCountElem.textContent = `${minutes}:${remainingSeconds}`;
  }

  /**
   * Starts or resets the game timer.
   */
  function startTimer() {
    stopTimer();
    seconds = 0;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      seconds++;
      updateTimerDisplay();
    }, 1000);
  }

  /**
   * Checks if the puzzle is in a solved state.
   */
  function checkWin() {
    const isSolved = tiles.every((value, index) => value === index);
    if (isSolved) {
      // 難易度に応じてポイントを追加 (3x3: 3点, 4x4: 4点, 5x5: 5点)
      addPoints(gridSize);

      // 効果音を再生
      stopTimer();
      playSE(winSound.src);

      // The puzzle is solved!
      // 1. Find the last piece (the one that was empty).
      const lastPiece = puzzleGrid.querySelector(`[data-value='${emptyValue}']`);

      if (lastPiece) {
        // 2. Make it visible by removing the 'empty' class.
        lastPiece.classList.remove('empty');

        // 3. Explicitly set its background position to show the final part of the image,
        //    as the render() function skips the empty tile.
        const imageCol = emptyValue % gridSize;
        const imageRow = Math.floor(emptyValue / gridSize);
        lastPiece.style.backgroundPosition = `-${imageCol * tileSize}px -${imageRow * tileSize}px`;
      }

      // ゲームエリアをフェードアウトさせる
      gameArea.classList.add('hidden-win');

      // Update the win message image to the current animal
      winImage.src = `assets/images/${currentAnimal}.png`;

      // Update win stats on the win message
      const winTimeElem = document.getElementById('win-time');
      const winMovesElem = document.getElementById('win-moves');
      if (winTimeElem) winTimeElem.textContent = timeCountElem.textContent;
      if (winMovesElem) winMovesElem.textContent = moveCount;

      // 4. Wait for a moment to let the user appreciate the completed puzzle,
      //    then show the win message.
      setTimeout(() => {
        winMessage.classList.remove('hidden');
        createConfetti();
      }, 1500); // 1.5 seconds
    }
  }

  /**
   * Creates and animates confetti elements.
   */
  function createConfetti() {
    const confettiCount = 100;
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'];

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.classList.add('confetti');
      
      // Randomize properties
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.top = '-10px'; // 画面の上端から開始するように設定
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = `${Math.random() * 3 + 4}s`; // 4-7 seconds
      confetti.style.animationDelay = `${Math.random() * 2}s`; // Stagger start times
      
      // Set CSS variable for horizontal drift
      const horizontalDrift = (Math.random() - 0.5) * 300; // -150px to +150px
      confetti.style.setProperty('--drift', `${horizontalDrift}px`);

      document.body.appendChild(confetti);

      // Remove the confetti element after the animation finishes
      confetti.addEventListener('animationend', () => {
        confetti.remove();
      });
    }
  }
  /**
   * ユーザーの最初の操作でBGMを再生する関数
   */
  function initializeBgm() {
    if (bgmInitialized) return;
    const bgm = document.getElementById('bgm');
    if (!bgm) return;
    // 音量設定はsettings.jsに一任する
    bgm.play().catch(error => console.log('BGMの再生にはユーザーの操作が必要です。', error));
    bgmInitialized = true;
  }

  // --- Initialization ---

  /**
   * The main function to initialize the game.
   */
  function initialize() {
    shuffleBtn.addEventListener('click', startNewGame);
    puzzleGrid.addEventListener('click', handleGridClick);
    createAnimalSelector(); // Create animal buttons
    document.addEventListener('keydown', handleKeyDown);

    difficultySelector.addEventListener('click', (e) => {
      if (e.target.classList.contains('difficulty-btn')) {
        const newSize = parseInt(e.target.dataset.size, 10);
        if (newSize !== gridSize) {
          setDifficulty(newSize);
        }
      }
    });

    playAgainBtn.addEventListener('click', () => {
      winMessage.classList.add('hidden');
      startNewGame();
    });

    createTiles();

    // 3. Display the solved puzzle behind the title screen initially.
    tiles = Array.from({ length: tileCount }, (_, i) => i);
    render();

    // ユーザーの最初の操作でBGMを含む音声を初期化する
    document.body.addEventListener('click', initializeBgm, { once: true });
    document.body.addEventListener('touchstart', initializeBgm, { once: true });

    // スタートボタンのリスナーはBGM初期化と分離する
    startBtn.addEventListener('click', () => {
      titleScreen.classList.add('hidden');
      startNewGame();
    });
  }

  // Run the initialization function.
  initialize();
});