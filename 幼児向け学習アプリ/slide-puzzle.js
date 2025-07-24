// Wait for the DOM to be fully loaded before running the script.
document.addEventListener('DOMContentLoaded', () => {

  // --- DOM Element References ---
  const gameArea = document.getElementById('game-area');
  const puzzleGrid = document.getElementById('puzzle-grid');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const moveCountElem = document.getElementById('move-count');
  const winMessage = document.getElementById('win-message');
  const titleScreen = document.getElementById('title-screen');
  const startBtn = document.getElementById('start-btn');
  const animalSelectorGrid = document.getElementById('animal-selector-grid');
  const currentReferenceImage = document.getElementById('current-reference-image');
  const winImage = document.getElementById('win-image');
  const bgm = document.getElementById('bgm');
  const winSound = document.getElementById('win-sound');
  const playAgainBtn = document.getElementById('play-again-btn');

  // --- Game Configuration ---
  const ANIMALS = [
    'usagi', 'アシカ', 'イヌ', 'イルカ', 'ウマ', 'キリン', 'クジラ', 'クマ',
    'ゴリラ', 'サメ', 'サル', 'シャチ', 'トラ', 'ネコ', 'ハムスター',
    'パンダ', 'ペンギン', 'ライオン', 'リス', 'レッサーパンダ'
  ];
  const GRID_SIZE = 3;
  const TILE_COUNT = GRID_SIZE * GRID_SIZE;
  const EMPTY_VALUE = TILE_COUNT - 1; // The last tile is the empty one.
  const TILE_SIZE = 150; // Corresponds to CSS .puzzle-tile width/height

  // --- Game State ---
  let tiles = []; // Array representing the logical state of the puzzle grid.
  let moveCount = 0;
  let currentAnimal = 'usagi';
  let bgmInitialized = false; // BGMが初期化されたかどうかのフラグ

  // --- Core Functions ---

  /**
   * Creates the tile DOM elements and appends them to the grid.
   * This is called only once when the page loads.
   */
  function createTiles() {
    puzzleGrid.innerHTML = ''; // Clear any existing tiles
    for (let i = 0; i < TILE_COUNT; i++) {
      const tile = document.createElement('div');
      tile.classList.add('puzzle-tile');
      tile.dataset.value = i; // The tile's correct, original value (0-8)

      if (i === EMPTY_VALUE) {
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
        const col = index % GRID_SIZE;
        const row = Math.floor(index / GRID_SIZE);
        tileElement.style.left = `${col * TILE_SIZE}px`;
        tileElement.style.top = `${row * TILE_SIZE}px`;

        // Set the background image position for this specific tile
        if (value !== EMPTY_VALUE) {
          const imageCol = value % GRID_SIZE;
          const imageRow = Math.floor(value / GRID_SIZE);
          tileElement.style.backgroundPosition = `-${imageCol * TILE_SIZE}px -${imageRow * TILE_SIZE}px`;
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
    tiles = Array.from({ length: TILE_COUNT }, (_, i) => i);

    let shuffleMoves = 100;
    for (let i = 0; i < shuffleMoves; i++) {
      const emptyIndex = tiles.indexOf(EMPTY_VALUE);
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
    moveCountElem.textContent = moveCount;
    winMessage.classList.add('hidden');
    gameArea.classList.remove('hidden-win'); // ゲームエリアを再表示

    // Before shuffling, ensure the empty tile is visually reset to its empty state,
    // in case it was filled in from a previous win.
    const emptyTile = puzzleGrid.querySelector(`[data-value='${EMPTY_VALUE}']`);
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
    const emptyIndex = tiles.indexOf(EMPTY_VALUE);

    // Check if the clicked tile is a neighbor of the empty tile
    const neighbors = getNeighbors(emptyIndex);
    if (neighbors.includes(clickedIndex)) {
      // Swap tiles in the logical array
      [tiles[emptyIndex], tiles[clickedIndex]] = [tiles[clickedIndex], tiles[emptyIndex]];

      moveCount++;
      moveCountElem.textContent = moveCount;

      // Update the visual grid
      render();

      // Check for win condition
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

    // Start a new game with the new image
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

    const emptyIndex = tiles.indexOf(EMPTY_VALUE);
    let targetIndex = -1; // The index of the tile to swap with the empty one.

    // Determine which tile to move based on the arrow key pressed.
    // The logic is "which tile should move INTO the empty space".
    switch (e.key) {
      case 'ArrowUp': // Move the tile BELOW the empty space UP.
        targetIndex = emptyIndex + GRID_SIZE;
        break;
      case 'ArrowDown': // Move the tile ABOVE the empty space DOWN.
        targetIndex = emptyIndex - GRID_SIZE;
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
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;

    if (row > 0) neighbors.push(index - GRID_SIZE); // Top
    if (row < GRID_SIZE - 1) neighbors.push(index + GRID_SIZE); // Bottom
    if (col > 0) neighbors.push(index - 1); // Left
    if (col < GRID_SIZE - 1) neighbors.push(index + 1); // Right

    return neighbors;
  }

  /**
   * Checks if the puzzle is in a solved state.
   */
  function checkWin() {
    const isSolved = tiles.every((value, index) => value === index);
    if (isSolved) {
      // 効果音を再生
      if (winSound) {
        winSound.currentTime = 0; // 再生位置を先頭に戻す
        winSound.play();
      }

      // The puzzle is solved!
      // 1. Find the last piece (the one that was empty).
      const lastPiece = puzzleGrid.querySelector(`[data-value='${EMPTY_VALUE}']`);

      if (lastPiece) {
        // 2. Make it visible by removing the 'empty' class.
        lastPiece.classList.remove('empty');

        // 3. Explicitly set its background position to show the final part of the image,
        //    as the render() function skips the empty tile.
        const imageCol = EMPTY_VALUE % GRID_SIZE;
        const imageRow = Math.floor(EMPTY_VALUE / GRID_SIZE);
        lastPiece.style.backgroundPosition = `-${imageCol * TILE_SIZE}px -${imageRow * TILE_SIZE}px`;
      }

      // ゲームエリアをフェードアウトさせる
      gameArea.classList.add('hidden-win');

      // Update the win message image to the current animal
      winImage.src = `assets/images/${currentAnimal}.png`;

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
    if (bgmInitialized || !bgm) return;
    // 音量設定はsettings.jsに一任する
    bgm.play().catch(error => console.log('BGMの再生にはユーザーの操作が必要です。', error));
    bgmInitialized = true;
  }

  // --- Initialization ---

  /**
   * The main function to initialize the game.
   */
  function initialize() {
    // 1. Set up all event listeners first for robustness.
    startBtn.addEventListener('click', () => {
      initializeBgm(); // 最初のクリックでBGMを再生
      titleScreen.classList.add('hidden');
      startNewGame();
    });

    shuffleBtn.addEventListener('click', startNewGame);
    puzzleGrid.addEventListener('click', handleGridClick);
    createAnimalSelector(); // Create animal buttons
    document.addEventListener('keydown', handleKeyDown);

    playAgainBtn.addEventListener('click', () => {
      winMessage.classList.add('hidden');
      startNewGame();
    });

    // 2. Create the physical tile elements once.
    createTiles();

    // 3. Display the solved puzzle behind the title screen initially.
    tiles = Array.from({ length: TILE_COUNT }, (_, i) => i);
    render();
  }

  // Run the initialization function.
  initialize();
});