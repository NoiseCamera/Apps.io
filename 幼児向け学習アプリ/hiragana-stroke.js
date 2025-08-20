document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  // ダブルタップによるズームを防止
  document.body.style.touchAction = 'manipulation';

  const characterGrid = document.getElementById('character-grid');
  const modelCharDisplay = document.getElementById('model-character-display');
  const canvas = document.getElementById('stroke-canvas');
  const ctx = canvas.getContext('2d');
  const replayBtn = document.getElementById('replay-btn');
  const watchModeBtn = document.getElementById('watch-mode-btn');
  const practiceModeBtn = document.getElementById('practice-mode-btn');
  const stepModeBtn = document.getElementById('step-mode-btn');
  const toggleNumbersBtn = document.getElementById('toggle-numbers-btn');

  // --- State ---
  let bgmInitialized = false;
  let isAnimating = false;
  let currentCharacter = 'あ';
  let currentMode = 'watch'; // 'watch' or 'practice'
  let isDrawing = false;
  let showStrokeNumbers = true; // trueで番号表示、falseで非表示
  let isAudioPlaying = false;
  let currentStepStrokeIndex = 0;
  let userPath = [];
  let userStrokes = []; // 練習モードで書いた線を保存する配列

  // --- Data ---
  // 300x300のCanvasを基準とした書き順データ
  // 各配列が1画、その中のオブジェクトが座標点
  const STROKE_DATA = {
    'あ': [
      [{ x: 60, y: 75 }, { x: 120, y: 72 }, { x: 201, y: 57 }],
      [{ x: 127.5, y: 21 }, { x: 105, y: 156 }, { x: 123, y: 270 }],
      [{ x: 195, y: 105 }, { x: 135, y: 231 }, { x: 75, y: 270 }, { x: 37.5, y: 247.5 }, { x: 45, y: 187.5 }, { x: 142.5, y: 127.5 }, { x: 217.5, y: 135 }, { x: 270, y: 172.5 }, { x: 270, y: 240 }, { x: 225, y: 270 }, { x: 187.5, y: 280.5 }]
    ],
    'い': [
      [{ x: 42, y: 75 }, { x: 42, y: 135 }, { x: 60, y: 207 }, { x: 96, y: 246 }, { x: 96, y: 246 }, { x: 126, y: 198 }],
      [{ x: 210, y: 75 }, { x: 240, y: 120 }, { x: 264, y: 174 }]
    ],
    'う': [
      [{ x: 123, y: 21 }, { x: 159, y: 33 }, { x: 195, y: 52.5 }],
      [{ x: 75, y: 120 }, { x: 165, y: 90 }, { x: 210, y: 126 }, { x: 216, y: 180 }, { x: 195, y: 243 }, { x: 142.5, y: 279 }]
    ],
    'え': [
      [{ x: 111, y: 24 }, { x: 135, y: 33 }, { x: 180, y: 51 }],
      [{ x: 63, y: 115.5 }, { x: 120, y: 106.5 }, { x: 186, y: 94.5 }, { x: 186, y: 94.5 }, { x: 112.5, y: 186 }, { x: 51, y: 262.5 }, { x: 51, y: 262.5 }, { x: 93, y: 210 }, { x: 157.5, y: 180 }, { x: 174, y: 187.5 }, { x: 157.5, y: 249 }, { x: 187.5, y: 273 }, { x: 261, y: 264 }]
    ],
    'お': [
      [{ x: 37.5, y: 105 }, { x: 105, y: 90 }, { x: 150, y: 75 }],
      [{ x: 97.5, y: 27 }, { x: 97.5, y: 240 }, { x: 97.5, y: 274.5 }, { x: 60, y: 270 }, { x: 39, y: 240 }, { x: 45, y: 219 }, { x: 105, y: 180 }, { x: 180, y: 156 }, { x: 252, y: 168 }, { x: 264, y: 225 }, { x: 228, y: 261 }, { x: 186, y: 262.5 }],
      [{ x: 217.5, y: 52.5 }, { x: 255, y: 82.5 }, { x: 277.5, y: 105 }]
    ],
    // Expanded data from charArr, scaled for 300x300 canvas (original coords * 15)
    'か': [
      [{ x: 25.5, y: 120 }, { x: 150, y: 105 }, { x: 156, y: 165 }, { x: 141, y: 225 }, { x: 111, y: 267 }, { x: 111, y: 267 }, { x: 87, y: 249 }],
      [{ x: 117, y: 36 }, { x: 78, y: 150 }, { x: 30, y: 240 }],
      [{ x: 219, y: 90 }, { x: 255, y: 129 }, { x: 279, y: 165 }]
    ],
    'き': [
      [{ x: 60, y: 84 }, { x: 150, y: 69 }, { x: 210, y: 57 }],
      [{ x: 90, y: 144 }, { x: 150, y: 135 }, { x: 234, y: 114 }],
      [{ x: 123, y: 21 }, { x: 159, y: 99 }, { x: 216, y: 187.5 }, { x: 216, y: 187.5 }, { x: 180, y: 186 }],
      [{ x: 87, y: 225 }, { x: 112.5, y: 261 }, { x: 165, y: 273 }, { x: 195, y: 273 }]
    ],
    'く': [
      [{ x: 201, y: 27 }, { x: 141, y: 90 }, { x: 78, y: 142.5 }, { x: 78, y: 157.5 }, { x: 147, y: 210 }, { x: 202.5, y: 277.5 }]
    ],
    'け': [
      [{ x: 69, y: 45 }, { x: 54, y: 180 }, { x: 66, y: 246 }, { x: 66, y: 246 }, { x: 81, y: 216 }],
      [{ x: 135, y: 114 }, { x: 210, y: 105 }, { x: 279, y: 97.5 }],
      [{ x: 216, y: 30 }, { x: 225, y: 135 }, { x: 219, y: 225 }, { x: 174, y: 279 }]
    ],
    'こ': [
      [{ x: 81, y: 60 }, { x: 156, y: 57 }, { x: 213, y: 75 }, { x: 213, y: 75 }, { x: 195, y: 90 }, { x: 186, y: 99 }],
      [{ x: 72, y: 201 }, { x: 96, y: 231 }, { x: 150, y: 246 }, { x: 225, y: 240 }]
    ],
    'さ': [
      [{ x: 42, y: 111 }, { x: 165, y: 90 }, { x: 246, y: 69 }],
      [{ x: 129, y: 24 }, { x: 165, y: 90 }, { x: 222, y: 171 }, { x: 222, y: 171 }, { x: 180, y: 165 }],
      [{ x: 90, y: 201 }, { x: 105, y: 237 }, { x: 135, y: 261 }, { x: 195, y: 267 }]
    ],
    'し': [
      [{ x: 90, y: 36 }, { x: 90, y: 90 }, { x: 81, y: 210 }, { x: 111, y: 255 }, { x: 150, y: 264 }, { x: 195, y: 255 }, { x: 240, y: 195 }]
    ],
    'す': [
      [{ x: 27, y: 93 }, { x: 165, y: 75 }, { x: 270, y: 69 }],
      [{ x: 172.5, y: 15 }, { x: 183, y: 180 }, { x: 144, y: 222 }, { x: 93, y: 165 }, { x: 135, y: 117 }, { x: 171, y: 150 }, { x: 171, y: 210 }, { x: 153, y: 255 }, { x: 126, y: 276 }]
    ],
    'せ': [
      [{ x: 27, y: 135 }, { x: 150, y: 108 }, { x: 285, y: 87 }],
      [{ x: 210, y: 30 }, { x: 210, y: 105 }, { x: 201, y: 180 }, { x: 201, y: 180 }, { x: 180, y: 168 }],
      [{ x: 87, y: 48 }, { x: 94.5, y: 135 }, { x: 93, y: 210 }, { x: 120, y: 246 }, { x: 240, y: 243 }]
    ],
    'そ': [
      [{ x: 87, y: 48 }, { x: 135, y: 45 }, { x: 204, y: 34.5 }, { x: 204, y: 34.5 }, { x: 120, y: 111 }, { x: 42, y: 153 }, { x: 42, y: 153 }, { x: 255, y: 120 }, { x: 255, y: 120 }, { x: 165, y: 157.5 }, { x: 135, y: 231 }, { x: 204, y: 276 }]
    ],
    'た': [
      [{ x: 45, y: 93 }, { x: 105, y: 90 }, { x: 168, y: 79.5 }],
      [{ x: 117, y: 30 }, { x: 81, y: 162 }, { x: 42, y: 255 }],
      [{ x: 156, y: 150 }, { x: 210, y: 138 }, { x: 252, y: 144 }],
      [{ x: 154.5, y: 228 }, { x: 195, y: 258 }, { x: 255, y: 264 }]
    ],
    'ち': [
      [{ x: 42, y: 90 }, { x: 120, y: 85.5 }, { x: 207, y: 72 }],
      [{ x: 132, y: 21 }, { x: 105, y: 135 }, { x: 94.5, y: 196.5 }, { x: 94.5, y: 196.5 }, { x: 135, y: 174 }, { x: 195, y: 159 }, { x: 237, y: 180 }, { x: 246, y: 222 }, { x: 198, y: 264 }, { x: 150, y: 270 }]
    ],
    'つ': [
      [{ x: 24, y: 114 }, { x: 105, y: 97.5 }, { x: 237, y: 82.5 }, { x: 270, y: 150 }, { x: 243, y: 207 }, { x: 157.5, y: 240 }]
    ],
    'て': [
      [{ x: 36, y: 84 }, { x: 150, y: 69 }, { x: 255, y: 45 }, { x: 255, y: 45 }, { x: 195, y: 81 }, { x: 150, y: 135 }, { x: 141, y: 195 }, { x: 174, y: 240 }, { x: 219, y: 258 }]
    ],
    'と': [
      [{ x: 81, y: 39 }, { x: 93, y: 60 }, { x: 120, y: 141 }],
      [{ x: 225, y: 81 }, { x: 120, y: 144 }, { x: 69, y: 210 }, { x: 102, y: 255 }, { x: 225, y: 255 }]
    ],
    'な': [
      [{ x: 36, y: 84 }, { x: 90, y: 81 }, { x: 150, y: 69 }],
      [{ x: 114, y: 27 }, { x: 85.5, y: 105 }, { x: 45, y: 180 }],
      [{ x: 210, y: 78 }, { x: 240, y: 93 }, { x: 262.5, y: 118.5 }, { x: 262.5, y: 118.5 }, { x: 240, y: 123 }],
      [{ x: 183, y: 150 }, { x: 180, y: 180 }, { x: 186, y: 261 }, { x: 150, y: 279 }, { x: 102, y: 237 }, { x: 141, y: 201 }, { x: 240, y: 243 }]
    ],
    'に': [
      [{ x: 60, y: 45 }, { x: 45, y: 195 }, { x: 60, y: 255 }, { x: 66, y: 255 }, { x: 69, y: 240 }, { x: 81, y: 210 }],
      [{ x: 153, y: 97.5 }, { x: 210, y: 75 }, { x: 255, y: 75 }],
      [{ x: 147, y: 202.5 }, { x: 180, y: 234 }, { x: 261, y: 240 }]
    ],
    'ぬ': [
      [{ x: 60, y: 60 }, { x: 78, y: 165 }, { x: 114, y: 240 }],
      [{ x: 165, y: 42 }, { x: 129, y: 186 }, { x: 51, y: 261 }, { x: 18, y: 189 }, { x: 75, y: 120 }, { x: 186, y: 75 }, { x: 240, y: 96 }, { x: 270, y: 150 }, { x: 252, y: 225 }, { x: 201, y: 264 }, { x: 156, y: 225 }, { x: 201, y: 186 }, { x: 285, y: 255 }]
    ],
    'ね': [
      [{ x: 84, y: 30 }, { x: 81, y: 120 }, { x: 78, y: 276 }],
      [{ x: 18, y: 120 }, { x: 97.5, y: 93 }, { x: 97.5, y: 93 }, { x: 60, y: 171 }, { x: 18, y: 234 }, { x: 18, y: 234 }, { x: 105, y: 150 }, { x: 195, y: 66 }, { x: 255, y: 105 }, { x: 246, y: 195 }, { x: 231, y: 258 }, { x: 180, y: 261 }, { x: 151.5, y: 246 }, { x: 162, y: 210 }, { x: 198, y: 201 }, { x: 240, y: 219 }, { x: 279, y: 255 }]
    ],
    'の': [
      [{ x: 144, y: 69 }, { x: 141, y: 165 }, { x: 63, y: 255 }, { x: 27, y: 168 }, { x: 57, y: 105 }, { x: 138, y: 54 }, { x: 243, y: 81 }, { x: 264, y: 165 }, { x: 237, y: 228 }, { x: 189, y: 255 }]
    ],
    'は': [
      [{ x: 60, y: 42 }, { x: 45, y: 195 }, { x: 60, y: 258 }, { x: 60, y: 258 }, { x: 66, y: 240 }, { x: 75, y: 225 }],
      [{ x: 132, y: 105 }, { x: 210, y: 93 }, { x: 261, y: 90 }],
      [{ x: 214.5, y: 30 }, { x: 213, y: 135 }, { x: 222, y: 240 }, { x: 174, y: 267 }, { x: 117, y: 228 }, { x: 153, y: 195 }, { x: 270, y: 240 }]
    ],
    'ひ': [
      [{ x: 36, y: 72 }, { x: 75, y: 63 }, { x: 132, y: 45 }, { x: 132, y: 45 }, { x: 60, y: 150 }, { x: 63, y: 231 }, { x: 120, y: 264 }, { x: 195, y: 240 }, { x: 219, y: 150 }, { x: 222, y: 75 }, { x: 222, y: 75 }, { x: 253.5, y: 135 }, { x: 279, y: 165 }]
    ],
    'ふ': [
      [{ x: 117, y: 33 }, { x: 153, y: 45 }, { x: 180, y: 69 }, { x: 180, y: 69 }, { x: 150, y: 87 }],
      [{ x: 138, y: 150 }, { x: 189, y: 219 }, { x: 156, y: 276 }, { x: 99, y: 246 }],
      [{ x: 21, y: 195 }, { x: 33, y: 240 }, { x: 45, y: 255 }, { x: 45, y: 255 }, { x: 60, y: 225 }],
      [{ x: 240, y: 174 }, { x: 262.5, y: 195 }, { x: 279, y: 225 }]
    ],
    'へ': [
      [{ x: 24, y: 162 }, { x: 54, y: 135 }, { x: 105, y: 84 }, { x: 105, y: 84 }, { x: 195, y: 165 }, { x: 270, y: 219 }]
    ],
    'ほ': [
      [{ x: 57, y: 45 }, { x: 42, y: 180 }, { x: 57, y: 258 }, { x: 57, y: 258 }, { x: 69, y: 225 }],
      [{ x: 135, y: 54 }, { x: 210, y: 48 }, { x: 264, y: 48 }],
      [{ x: 141, y: 126 }, { x: 210, y: 126 }, { x: 261, y: 117 }],
      [{ x: 213, y: 51 }, { x: 213, y: 231 }, { x: 210, y: 252 }, { x: 165, y: 264 }, { x: 118.5, y: 234 }, { x: 135, y: 210 }, { x: 186, y: 210 }, { x: 270, y: 255 }]
    ],
    'ま': [
      [{ x: 66, y: 84 }, { x: 165, y: 69 }, { x: 225, y: 69 }],
      [{ x: 87, y: 144 }, { x: 144, y: 147 }, { x: 213, y: 138 }],
      [{ x: 165, y: 24 }, { x: 165, y: 240 }, { x: 135, y: 270 }, { x: 75, y: 258 }, { x: 60, y: 231 }, { x: 90, y: 213 }, { x: 165, y: 219 }, { x: 231, y: 261 }]
    ],
    'み': [
      [{ x: 78, y: 57 }, { x: 120, y: 54 }, { x: 171, y: 42 }, { x: 171, y: 42 }, { x: 135, y: 135 }, { x: 75, y: 240 }, { x: 42, y: 246 }, { x: 30, y: 183 }, { x: 105, y: 159 }, { x: 210, y: 177 }, { x: 273, y: 198 }],
      [{ x: 246, y: 135 }, { x: 226.5, y: 216 }, { x: 184.5, y: 270 }]
    ],
    'む': [
      [{ x: 36, y: 99 }, { x: 105, y: 93 }, { x: 156, y: 81 }],
      [{ x: 108, y: 27 }, { x: 111, y: 210 }, { x: 72, y: 273 }, { x: 33, y: 216 }, { x: 69, y: 165 }, { x: 96, y: 180 }, { x: 108, y: 255 }, { x: 156, y: 267 }, { x: 216, y: 255 }, { x: 237, y: 210 }, { x: 231, y: 165 }],
      [{ x: 219, y: 54 }, { x: 246, y: 75 }, { x: 267, y: 102 }]
    ],
    'め': [
      [{ x: 63, y: 63 }, { x: 99, y: 180 }, { x: 138, y: 249 }],
      [{ x: 186, y: 33 }, { x: 147, y: 180 }, { x: 60, y: 276 }, { x: 24, y: 195 }, { x: 63, y: 132 }, { x: 150, y: 84 }, { x: 240, y: 105 }, { x: 270, y: 180 }, { x: 246, y: 240 }, { x: 198, y: 276 }]
    ],
    'も': [
      [{ x: 132, y: 21 }, { x: 90, y: 225 }, { x: 150, y: 285 }, { x: 225, y: 255 }, { x: 240, y: 207 }, { x: 231, y: 156 }],
      [{ x: 48, y: 84 }, { x: 105, y: 81 }, { x: 165, y: 81 }],
      [{ x: 48, y: 168 }, { x: 105, y: 171 }, { x: 165, y: 165 }]
    ],
    'や': [
      [{ x: 27, y: 148.5 }, { x: 219, y: 60 }, { x: 276, y: 108 }, { x: 246, y: 154.5 }, { x: 201, y: 156 }],
      [{ x: 144, y: 24 }, { x: 168, y: 36 }, { x: 186, y: 57 }, { x: 186, y: 57 }, { x: 162, y: 57 }],
      [{ x: 63, y: 51 }, { x: 105, y: 162 }, { x: 156, y: 267 }]
    ],
    'ゆ': [
      [{ x: 37.5, y: 72 }, { x: 42, y: 165 }, { x: 51, y: 204 }, { x: 51, y: 204 }, { x: 105, y: 90 }, { x: 219, y: 51 }, { x: 282, y: 132 }, { x: 234, y: 222 }, { x: 165, y: 225 }, { x: 135, y: 207 }],
      [{ x: 174, y: 24 }, { x: 180, y: 75 }, { x: 180, y: 210 }, { x: 162, y: 255 }, { x: 141, y: 273 }]
    ],
    'よ': [
      [{ x: 153, y: 102 }, { x: 195, y: 99 }, { x: 240, y: 87 }],
      [{ x: 153, y: 21 }, { x: 154.5, y: 180 }, { x: 150, y: 255 }, { x: 87, y: 270 }, { x: 39, y: 231 }, { x: 75, y: 201 }, { x: 150, y: 207 }, { x: 240, y: 249 }]
    ],
    'ら': [
      [{ x: 120, y: 21 }, { x: 150, y: 42 }, { x: 165, y: 60 }, { x: 165, y: 60 }, { x: 141, y: 64.5 }],
      [{ x: 96, y: 90 }, { x: 81, y: 165 }, { x: 78, y: 198 }, { x: 78, y: 198 }, { x: 189, y: 156 }, { x: 243, y: 204 }, { x: 204, y: 261 }, { x: 141, y: 274.5 }]
    ],
    'り': [
      [{ x: 93, y: 30 }, { x: 81, y: 105 }, { x: 93, y: 168 }, { x: 93, y: 168 }, { x: 108, y: 144 }],
      [{ x: 201, y: 30 }, { x: 210, y: 165 }, { x: 177, y: 249 }, { x: 150, y: 273 }]
    ],
    'る': [
      [{ x: 87, y: 51 }, { x: 135, y: 48 }, { x: 192, y: 36 }, { x: 192, y: 36 }, { x: 120, y: 126 }, { x: 54, y: 192 }, { x: 54, y: 192 }, { x: 165, y: 135 }, { x: 243, y: 171 }, { x: 240, y: 240 }, { x: 150, y: 279 }, { x: 102, y: 249 }, { x: 120, y: 213 }, { x: 171, y: 222 }, { x: 195, y: 255 }]
    ],
    'れ': [
      [{ x: 87, y: 27 }, { x: 78, y: 225 }, { x: 79.5, y: 273 }],
      [{ x: 21, y: 111 }, { x: 60, y: 102 }, { x: 102, y: 87 }, { x: 102, y: 87 }, { x: 60, y: 165 }, { x: 18, y: 222 }, { x: 18, y: 222 }, { x: 120, y: 126 }, { x: 220.5, y: 63 }, { x: 220.5, y: 63 }, { x: 213, y: 228 }, { x: 249, y: 252 }, { x: 285, y: 213 }]
    ],
    'ろ': [
      [{ x: 87, y: 51 }, { x: 135, y: 45 }, { x: 187.5, y: 36 }, { x: 187.5, y: 36 }, { x: 120, y: 123 }, { x: 60, y: 186 }, { x: 60, y: 186 }, { x: 150, y: 150 }, { x: 207, y: 150 }, { x: 246, y: 195 }, { x: 210, y: 258 }, { x: 139.5, y: 274.5 }]
    ],
    'わ': [
      [{ x: 87, y: 27 }, { x: 78, y: 225 }, { x: 79.5, y: 273 }],
      [{ x: 21, y: 111 }, { x: 60, y: 102 }, { x: 102, y: 87 }, { x: 102, y: 87 }, { x: 60, y: 165 }, { x: 18, y: 222 }, { x: 18, y: 222 }, { x: 126, y: 132 }, { x: 223.5, y: 99 }, { x: 279, y: 165 }, { x: 247.5, y: 235.5 }, { x: 192, y: 253.5 }]
    ],
    'を': [
      [{ x: 54, y: 69 }, { x: 120, y: 69 }, { x: 195, y: 57 }],
      [{ x: 147, y: 18 }, { x: 105, y: 105 }, { x: 75, y: 147 }, { x: 75, y: 147 }, { x: 144, y: 123 }, { x: 162, y: 165 }, { x: 159, y: 210 }],
      [{ x: 240, y: 132 }, { x: 87, y: 210 }, { x: 102, y: 264 }, { x: 222, y: 261 }]
    ],
    'ん': [
      [{ x: 144, y: 33 }, { x: 36, y: 252 }, { x: 36, y: 252 }, { x: 105, y: 180 }, { x: 141, y: 156 }, { x: 141, y: 156 }, { x: 138, y: 243 }, { x: 195, y: 265.5 }, { x: 237, y: 240 }, { x: 264, y: 195 }]
    ],
    'が': [
      [{ x: 24, y: 114 }, { x: 135, y: 102 }, { x: 159, y: 150 }, { x: 138, y: 225 }, { x: 108, y: 270 }, { x: 108, y: 270 }, { x: 90, y: 255 }],
      [{ x: 111, y: 36 }, { x: 69, y: 165 }, { x: 36, y: 225 }],
      [{ x: 195, y: 90 }, { x: 225, y: 120 }, { x: 249, y: 165 }],
      [{ x: 228, y: 75 }, { x: 247.5, y: 90 }, { x: 258, y: 105 }],
      [{ x: 255, y: 54 }, { x: 271.5, y: 69 }, { x: 285, y: 84 }]
    ],
    'ぎ': [
      [{ x: 51, y: 84 }, { x: 135, y: 72 }, { x: 198, y: 58.5 }],
      [{ x: 75, y: 144 }, { x: 165, y: 132 }, { x: 223.5, y: 117 }],
      [{ x: 114, y: 21 }, { x: 150, y: 102 }, { x: 201, y: 186 }, { x: 201, y: 186 }, { x: 165, y: 183 }],
      [{ x: 75, y: 225 }, { x: 111, y: 264 }, { x: 177, y: 270 }],
      [{ x: 228, y: 42 }, { x: 246, y: 60 }, { x: 252, y: 72 }],
      [{ x: 258, y: 21 }, { x: 276, y: 39 }, { x: 285, y: 52.5 }]
    ],
    'ぐ': [
      [{ x: 174, y: 27 }, { x: 120, y: 90 }, { x: 60, y: 150 }, { x: 60, y: 150 }, { x: 126, y: 210 }, { x: 177, y: 270 }],
      [{ x: 216, y: 57 }, { x: 231, y: 72 }, { x: 244.5, y: 90 }],
      [{ x: 243, y: 36 }, { x: 261, y: 51 }, { x: 276, y: 72 }]
    ],
    'げ': [
      [{ x: 54, y: 48 }, { x: 39, y: 201 }, { x: 54, y: 246 }, { x: 54, y: 246 }, { x: 69, y: 219 }],
      [{ x: 120, y: 114 }, { x: 210, y: 102 }, { x: 264, y: 97.5 }],
      [{ x: 207, y: 36 }, { x: 210, y: 150 }, { x: 210, y: 222 }, { x: 168, y: 273 }],
      [{ x: 243, y: 30 }, { x: 258, y: 45 }, { x: 270, y: 63 }],
      [{ x: 270, y: 9 }, { x: 285, y: 21 }, { x: 291, y: 30 }]
    ],
    'ご': [
      [{ x: 64.5, y: 63 }, { x: 132, y: 55.5 }, { x: 195, y: 75 }, { x: 195, y: 75 }, { x: 171, y: 99 }],
      [{ x: 57, y: 204 }, { x: 90, y: 240 }, { x: 150, y: 252 }, { x: 216, y: 243 }],
      [{ x: 228, y: 51 }, { x: 246, y: 66 }, { x: 261, y: 90 }],
      [{ x: 255, y: 30 }, { x: 274.5, y: 45 }, { x: 288, y: 64.5 }]
    ],
    'ざ': [
      [{ x: 30, y: 114 }, { x: 135, y: 96 }, { x: 225, y: 72 }],
      [{ x: 117, y: 30 }, { x: 150, y: 93 }, { x: 204, y: 168 }, { x: 204, y: 168 }, { x: 165, y: 165 }],
      [{ x: 75, y: 204 }, { x: 100.5, y: 258 }, { x: 177, y: 267 }],
      [{ x: 234, y: 39 }, { x: 250.5, y: 54 }, { x: 264, y: 75 }],
      [{ x: 264, y: 21 }, { x: 279, y: 33 }, { x: 294, y: 54 }]
    ],
    'じ': [
      [{ x: 90, y: 36 }, { x: 90, y: 90 }, { x: 81, y: 210 }, { x: 111, y: 255 }, { x: 150, y: 264 }, { x: 195, y: 255 }, { x: 240, y: 195 }],
      [{ x: 168, y: 75 }, { x: 187.5, y: 90 }, { x: 198, y: 108 }],
      [{ x: 195, y: 51 }, { x: 211.5, y: 66 }, { x: 229.5, y: 87 }]
    ],
    'ず': [
      [{ x: 27, y: 93 }, { x: 165, y: 75 }, { x: 270, y: 69 }],
      [{ x: 172.5, y: 15 }, { x: 183, y: 180 }, { x: 144, y: 222 }, { x: 93, y: 165 }, { x: 135, y: 117 }, { x: 171, y: 150 }, { x: 171, y: 210 }, { x: 153, y: 255 }, { x: 126, y: 276 }],
      [{ x: 225, y: 18 }, { x: 241.5, y: 30 }, { x: 258, y: 48 }],
      [{ x: 261, y: 12 }, { x: 279, y: 27 }, { x: 291, y: 42 }]
    ],
    'ぜ': [
      [{ x: 27, y: 135 }, { x: 150, y: 108 }, { x: 285, y: 87 }],
      [{ x: 210, y: 30 }, { x: 210, y: 105 }, { x: 201, y: 180 }, { x: 201, y: 180 }, { x: 180, y: 168 }, { x: 162, y: 157.5 }],
      [{ x: 87, y: 48 }, { x: 94.5, y: 135 }, { x: 93, y: 210 }, { x: 120, y: 246 }, { x: 240, y: 243 }],
      [{ x: 232.5, y: 18 }, { x: 249, y: 30 }, { x: 262.5, y: 48 }],
      [{ x: 261, y: 12 }, { x: 279, y: 27 }, { x: 291, y: 42 }]
    ],
    'ぞ': [
      [{ x: 87, y: 48 }, { x: 135, y: 45 }, { x: 204, y: 34.5 }, { x: 204, y: 34.5 }, { x: 120, y: 111 }, { x: 42, y: 153 }, { x: 42, y: 153 }, { x: 255, y: 120 }, { x: 255, y: 120 }, { x: 165, y: 157.5 }, { x: 135, y: 231 }, { x: 204, y: 276 }],
      [{ x: 226.5, y: 18 }, { x: 243, y: 30 }, { x: 256.5, y: 48 }],
      [{ x: 261, y: 12 }, { x: 279, y: 27 }, { x: 291, y: 42 }]
    ],
    'だ': [
      [{ x: 45, y: 93 }, { x: 105, y: 90 }, { x: 168, y: 79.5 }],
      [{ x: 117, y: 30 }, { x: 81, y: 162 }, { x: 42, y: 255 }],
      [{ x: 156, y: 150 }, { x: 210, y: 138 }, { x: 252, y: 144 }],
      [{ x: 154.5, y: 228 }, { x: 195, y: 258 }, { x: 255, y: 264 }],
      [{ x: 228, y: 39 }, { x: 240, y: 51 }, { x: 258, y: 75 }],
      [{ x: 255, y: 18 }, { x: 270, y: 31.5 }, { x: 285, y: 48 }]
    ],
    'ぢ': [
      [{ x: 42, y: 90 }, { x: 120, y: 85.5 }, { x: 207, y: 72 }],
      [{ x: 132, y: 21 }, { x: 105, y: 135 }, { x: 94.5, y: 196.5 }, { x: 94.5, y: 196.5 }, { x: 135, y: 174 }, { x: 195, y: 159 }, { x: 237, y: 180 }, { x: 246, y: 222 }, { x: 198, y: 264 }, { x: 150, y: 270 }],
      [{ x: 228, y: 39 }, { x: 240, y: 51 }, { x: 258, y: 75 }],
      [{ x: 255, y: 18 }, { x: 270, y: 31.5 }, { x: 285, y: 48 }]
    ],
    'づ': [
      [{ x: 24, y: 114 }, { x: 105, y: 97.5 }, { x: 237, y: 82.5 }, { x: 270, y: 150 }, { x: 243, y: 207 }, { x: 157.5, y: 240 }],
      [{ x: 228, y: 39 }, { x: 240, y: 51 }, { x: 258, y: 75 }],
      [{ x: 255, y: 18 }, { x: 270, y: 31.5 }, { x: 285, y: 48 }]
    ],
    'で': [
      [{ x: 21, y: 90 }, { x: 135, y: 69 }, { x: 210, y: 60 }, { x: 210, y: 60 }, { x: 180, y: 81 }, { x: 135, y: 135 }, { x: 126, y: 195 }, { x: 153, y: 240 }, { x: 204, y: 267 }],
      [{ x: 228, y: 39 }, { x: 240, y: 51 }, { x: 258, y: 75 }],
      [{ x: 255, y: 18 }, { x: 270, y: 31.5 }, { x: 285, y: 48 }]
    ],
    'ど': [
      [{ x: 66, y: 39 }, { x: 78, y: 60 }, { x: 105, y: 141 }],
      [{ x: 210, y: 81 }, { x: 105, y: 144 }, { x: 54, y: 210 }, { x: 87, y: 255 }, { x: 210, y: 255 }],
      [{ x: 228, y: 39 }, { x: 240, y: 51 }, { x: 258, y: 75 }],
      [{ x: 255, y: 18 }, { x: 270, y: 31.5 }, { x: 285, y: 48 }]
    ],
    'ば': [
      [{ x: 45, y: 42 }, { x: 30, y: 195 }, { x: 45, y: 258 }, { x: 45, y: 258 }, { x: 51, y: 240 }, { x: 60, y: 225 }],
      [{ x: 117, y: 105 }, { x: 195, y: 93 }, { x: 246, y: 90 }],
      [{ x: 199.5, y: 30 }, { x: 198, y: 135 }, { x: 207, y: 240 }, { x: 159, y: 267 }, { x: 102, y: 228 }, { x: 138, y: 195 }, { x: 255, y: 240 }],
      [{ x: 243, y: 30 }, { x: 258, y: 45 }, { x: 270, y: 63 }],
      [{ x: 270, y: 9 }, { x: 285, y: 21 }, { x: 291, y: 30 }]
    ],
    'び': [
      [{ x: 36, y: 72 }, { x: 75, y: 63 }, { x: 132, y: 45 }, { x: 132, y: 45 }, { x: 60, y: 150 }, { x: 63, y: 231 }, { x: 120, y: 264 }, { x: 195, y: 240 }, { x: 219, y: 150 }, { x: 222, y: 75 }, { x: 222, y: 75 }, { x: 253.5, y: 135 }, { x: 279, y: 165 }],
      [{ x: 243, y: 30 }, { x: 258, y: 45 }, { x: 270, y: 63 }],
      [{ x: 270, y: 9 }, { x: 285, y: 21 }, { x: 291, y: 30 }]
    ],
    'ぶ': [
      [{ x: 117, y: 33 }, { x: 153, y: 45 }, { x: 180, y: 69 }, { x: 180, y: 69 }, { x: 150, y: 87 }],
      [{ x: 138, y: 150 }, { x: 189, y: 219 }, { x: 156, y: 276 }, { x: 99, y: 246 }],
      [{ x: 21, y: 195 }, { x: 33, y: 240 }, { x: 45, y: 255 }, { x: 45, y: 255 }, { x: 60, y: 225 }],
      [{ x: 240, y: 174 }, { x: 262.5, y: 195 }, { x: 279, y: 225 }],
      [{ x: 228, y: 39 }, { x: 240, y: 51 }, { x: 258, y: 75 }],
      [{ x: 255, y: 18 }, { x: 270, y: 31.5 }, { x: 285, y: 48 }]
    ],
    'べ': [
      [{ x: 24, y: 162 }, { x: 54, y: 135 }, { x: 105, y: 84 }, { x: 105, y: 84 }, { x: 195, y: 165 }, { x: 270, y: 219 }],
      [{ x: 192, y: 63 }, { x: 207, y: 78 }, { x: 225, y: 99 }],
      [{ x: 231, y: 48 }, { x: 246, y: 60 }, { x: 259.5, y: 75 }]
    ],
    'ぼ': [
      [{ x: 42, y: 45 }, { x: 27, y: 180 }, { x: 42, y: 258 }, { x: 42, y: 258 }, { x: 54, y: 225 }],
      [{ x: 105, y: 66 }, { x: 180, y: 60 }, { x: 234, y: 60 }],
      [{ x: 111, y: 126 }, { x: 180, y: 126 }, { x: 231, y: 117 }],
      [{ x: 183, y: 66 }, { x: 183, y: 231 }, { x: 180, y: 252 }, { x: 135, y: 264 }, { x: 88.5, y: 234 }, { x: 105, y: 210 }, { x: 156, y: 210 }, { x: 240, y: 255 }],
      [{ x: 249, y: 30 }, { x: 264, y: 45 }, { x: 276, y: 63 }],
      [{ x: 270, y: 9 }, { x: 285, y: 21 }, { x: 291, y: 30 }]
    ],
    'ぱ': [
      [{ x: 45, y: 42 }, { x: 30, y: 195 }, { x: 45, y: 258 }, { x: 45, y: 258 }, { x: 51, y: 240 }, { x: 60, y: 225 }],
      [{ x: 117, y: 105 }, { x: 195, y: 93 }, { x: 246, y: 90 }],
      [{ x: 199.5, y: 30 }, { x: 198, y: 135 }, { x: 207, y: 240 }, { x: 159, y: 267 }, { x: 102, y: 228 }, { x: 138, y: 195 }, { x: 255, y: 240 }],
      [{ x: 261, y: 15 }, { x: 270, y: 15.75 }, { x: 282, y: 36 }, { x: 261, y: 60 }, { x: 240, y: 36 }, { x: 252, y: 15.75 }, { x: 261, y: 15 }]
    ],
    'ぴ': [
      [{ x: 36, y: 72 }, { x: 75, y: 63 }, { x: 132, y: 45 }, { x: 132, y: 45 }, { x: 60, y: 150 }, { x: 63, y: 231 }, { x: 120, y: 264 }, { x: 195, y: 240 }, { x: 219, y: 150 }, { x: 222, y: 75 }, { x: 222, y: 75 }, { x: 253.5, y: 135 }, { x: 279, y: 165 }],
      [{ x: 261, y: 15 }, { x: 270, y: 15.75 }, { x: 282, y: 36 }, { x: 261, y: 60 }, { x: 240, y: 36 }, { x: 252, y: 15.75 }, { x: 261, y: 15 }]
    ],
    'ぷ': [
      [{ x: 117, y: 33 }, { x: 153, y: 45 }, { x: 180, y: 69 }, { x: 180, y: 69 }, { x: 150, y: 87 }],
      [{ x: 138, y: 150 }, { x: 189, y: 219 }, { x: 156, y: 276 }, { x: 99, y: 246 }],
      [{ x: 21, y: 195 }, { x: 33, y: 240 }, { x: 45, y: 255 }, { x: 45, y: 255 }, { x: 60, y: 225 }],
      [{ x: 240, y: 174 }, { x: 262.5, y: 195 }, { x: 279, y: 225 }],
      [{ x: 261, y: 30 }, { x: 270, y: 30.75 }, { x: 282, y: 51 }, { x: 261, y: 75 }, { x: 240, y: 51 }, { x: 252, y: 30.75 }, { x: 261, y: 30 }]
    ],
    'ぺ': [
      [{ x: 24, y: 162 }, { x: 54, y: 135 }, { x: 105, y: 84 }, { x: 105, y: 84 }, { x: 195, y: 165 }, { x: 270, y: 219 }],
      [{ x: 231, y: 45 }, { x: 240, y: 45.75 }, { x: 252, y: 66 }, { x: 231, y: 90 }, { x: 210, y: 66 }, { x: 222, y: 45.75 }, { x: 231, y: 45 }]
    ],
    'ぽ': [
      [{ x: 42, y: 45 }, { x: 27, y: 180 }, { x: 42, y: 258 }, { x: 42, y: 258 }, { x: 54, y: 225 }],
      [{ x: 105, y: 66 }, { x: 180, y: 60 }, { x: 234, y: 60 }],
      [{ x: 111, y: 126 }, { x: 180, y: 126 }, { x: 231, y: 117 }],
      [{ x: 183, y: 66 }, { x: 183, y: 231 }, { x: 180, y: 252 }, { x: 135, y: 264 }, { x: 88.5, y: 234 }, { x: 105, y: 210 }, { x: 156, y: 210 }, { x: 240, y: 255 }],
      [{ x: 276, y: 15 }, { x: 285, y: 15.75 }, { x: 297, y: 36 }, { x: 276, y: 60 }, { x: 255, y: 36 }, { x: 267, y: 15.75 }, { x: 276, y: 15 }]
    ]
  };

  // 右から「あ行」「か行」...と縦に並べるための配列
  const HIRAGANA_GYO = [
    ['あ', 'い', 'う', 'え', 'お'],
    ['か', 'き', 'く', 'け', 'こ'],
    ['さ', 'し', 'す', 'せ', 'そ'],
    ['た', 'ち', 'つ', 'て', 'と'],
    ['な', 'に', 'ぬ', 'ね', 'の'],
    ['は', 'ひ', 'ふ', 'へ', 'ほ'],
    ['ま', 'み', 'む', 'め', 'も'],
    ['や', '　', 'ゆ', '　', 'よ'],
    ['ら', 'り', 'る', 'れ', 'ろ'],
    ['わ', '　', 'を', '　', 'ん'],
    ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
    ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
    ['だ', 'ぢ', 'づ', 'で', 'ど'],
    ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
    ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ']
  ];

  // プリロードする音声ファイルのリストを生成
  const SOUND_EFFECTS = HIRAGANA_GYO.flat()
    .filter(char => char !== '　')
    .map(char => `assets/sounds/hiragana/${char}.mp3`);

  // 特定の文字・画数の番号表示位置を上書きするためのデータ
  const STROKE_NUMBER_POS_OVERRIDES = {
    'あ': {
      // key: 画数 (1-indexed), value: {x, y} 座標
      // 3画目の開始点だと他の線と被るため、右上に見やすく表示する
      3: { x: 250, y: 50 }
    }
  };

  // --- Functions ---

  /**
   * Draws the guide character faintly on the canvas for tracing.
   * @param {string} char - The character to draw.
   */
  function drawGuideCharacter(char) {
    ctx.save();
    ctx.font = '260px "Kosugi Maru", sans-serif';
    ctx.fillStyle = '#e0e0e0'; // Light gray for tracing
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, canvas.width / 2, canvas.height / 2 + 10);
    ctx.restore();
  }

  /**
   * Draws guide lines (a cross) in the center of the canvas.
   */
  function drawGuideLines() {
    ctx.save();
    ctx.strokeStyle = '#e0e0e0'; // Light gray
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Dashed line

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draws the stroke number in a circle.
   * @param {number} number - The stroke number to draw.
   * @param {{x: number, y: number}} position - The position to draw the number near.
   */
  function drawStrokeNumber(number, position) {
    ctx.save();
    ctx.fillStyle = '#ff8f00'; // Amber color
    ctx.font = 'bold 24px "Kosugi Maru", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // The provided position IS the center of the circle.
    let { x, y } = position;
    const radius = 16;

    // 番号がキャンバスの外に出ないように位置を調整
    x = Math.max(radius, Math.min(x, canvas.width - radius));
    y = Math.max(radius, Math.min(y, canvas.height - radius));

    // Draw circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw number text
    ctx.fillStyle = 'white';
    ctx.fillText(number, x, y + 2); // Adjust for vertical alignment

    ctx.restore();
  }

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

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  /**
   * Generates a dense array of points for a smooth curve using a uniform cubic B-spline.
   * The curve is influenced by control points but does not necessarily pass through them,
   * resulting in a very smooth, rounded path.
   * @param {Array<{x: number, y: number}>} keyPoints - The key points of the stroke.
   * @returns {Array<{x: number, y: number}>} A dense array of points on the curve.
   */
  function generateSmoothPath(keyPoints) {
    if (keyPoints.length < 2) {
      return keyPoints;
    }

    // To generate a B-spline curve that approximates the full set of key points,
    // we need to add dummy control points at the beginning and end. This helps
    // the curve start and end closer to the intended points.
    const points = [
        keyPoints[0], // Repeat the first point
        ...keyPoints,
        keyPoints[keyPoints.length - 1] // Repeat the last point
    ];

    const path = [];
    const numSegments = 20; // Increase segments for a smoother curve

    // We need at least 4 points to form a cubic B-spline segment.
    if (points.length < 4) {
      // Fallback for very short strokes (2 or 3 points): just draw straight lines.
      return keyPoints;
    }

    // Iterate through the control points to generate curve segments.
    // Each segment is defined by 4 consecutive points (p0, p1, p2, p3).
    // The curve is generated for the part "between" p1 and p2.
    for (let i = 0; i < points.length - 3; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const p2 = points[i + 2];
      const p3 = points[i + 3];

      for (let j = 0; j < numSegments; j++) {
        const t = j / numSegments;
        const t2 = t * t;
        const t3 = t2 * t;

        // Uniform cubic B-spline basis functions
        const b0 = (1 - t) * (1 - t) * (1 - t) / 6.0;
        const b1 = (3 * t3 - 6 * t2 + 4) / 6.0;
        const b2 = (-3 * t3 + 3 * t2 + 3 * t + 1) / 6.0;
        const b3 = t3 / 6.0;

        const x = b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x;
        const y = b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y;

        path.push({ x, y });
      }
    }
    return path;
  }

  /**
   * 1画分の書き順アニメーションを滑らかに描画します。
   * @param {Array} path - 描画する画の滑らかな座標点配列
   * @param {Array} previousStrokes - すでに描画済みの画の配列 (これも滑らかなパス)
   * @param {number} duration - アニメーション時間 (ms)
   * @param {number} strokeNumber - 書き順の番号
   * @param {{x: number, y: number}} numberPosition - 番号を描画する基準位置
   */
  function animateStrokeOnPath(path, previousStrokes, duration, strokeNumber, numberPosition) {
    return new Promise(resolve => {
      let startTime = null;
      const totalPoints = path.length;

      function animate(time) {
        if (!startTime) startTime = time;
        const progress = Math.min((time - startTime) / duration, 1);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGuideLines();

        // Draw the stroke number
        if (showStrokeNumbers && strokeNumber && numberPosition) {
          drawStrokeNumber(strokeNumber, numberPosition);
        }

        // 描画スタイルを設定
        ctx.strokeStyle = '#004d40'; // ボタンの文字と同じ濃いティール色
        ctx.lineWidth = 22;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 1. 描画済みの画を再描画
        previousStrokes.forEach(strokePath => {
          if (strokePath.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(strokePath[0].x, strokePath[0].y);
          for (let i = 1; i < strokePath.length; i++) {
            ctx.lineTo(strokePath[i].x, strokePath[i].y);
          }
          ctx.stroke();
        });

        // 2. 現在の画をアニメーション描画
        if (path.length < 2) {
          if (progress >= 1) resolve();
          else requestAnimationFrame(animate);
          return;
        }

        const currentPointIndex = Math.floor(progress * (totalPoints - 1));
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i <= currentPointIndex; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(animate);
    });
  }

  async function animateStrokes(character) {
    if (isAnimating) return;
    const strokes = STROKE_DATA[character];
    if (!strokes) {
      console.warn(`「${character}」の書き順データがありません。`);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    isAnimating = true;
    replayBtn.disabled = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const completedPaths = [];
    let strokeIndex = 0;

    for (const strokePoints of strokes) {
      // 1. 番号の表示位置を決定（特別指定があればそれを使う）
      let numberPosition;
      const strokeNumber = strokeIndex + 1;
      const overridePos = STROKE_NUMBER_POS_OVERRIDES[character]?.[strokeNumber];

      if (overridePos) {
        numberPosition = overridePos;
      } else {
        const offset = 30;
        numberPosition = { x: strokePoints[0].x - offset, y: strokePoints[0].y - offset };
      }

      // 番号を表示して少し待つ
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGuideLines();
      ctx.strokeStyle = '#004d40';
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      completedPaths.forEach(p => {
        if (p.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(p[0].x, p[0].y);
        for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y);
        ctx.stroke();
      });
      if (showStrokeNumbers) {
        drawStrokeNumber(strokeNumber, numberPosition);
      }
      await sleep(400); // 番号表示後に0.4秒待機

      // 2. キーポイントから滑らかなパスを生成
      const smoothPath = generateSmoothPath(strokePoints);
      
      // 3. 生成したパスを使ってアニメーション
      // 描画時間はパスの長さに比例させると自然
      await animateStrokeOnPath(smoothPath, completedPaths, smoothPath.length * 15, strokeNumber, numberPosition);
      
      // 4. 完了したパスをリストに追加
      completedPaths.push(smoothPath);
      await sleep(300); // 次の画までの待ち時間
      strokeIndex++;
    }

    isAnimating = false;
    replayBtn.disabled = false;
  }

  /**
   * 「ひとふでずつ」モードの初期設定またはリセットを行う
   */
  function setupStepMode(character) {
    isAnimating = false;
    currentStepStrokeIndex = 0;
    replayBtn.textContent = 'つぎへ';
    replayBtn.disabled = false;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGuideLines();

    const strokes = STROKE_DATA[character];
    if (!strokes || strokes.length === 0) return;

    // 最初の画の番号を表示
    if (showStrokeNumbers) {
      const strokeNumber = 1;
      const overridePos = STROKE_NUMBER_POS_OVERRIDES[character]?.[strokeNumber];
      let numberPosition;
      if (overridePos) {
        numberPosition = overridePos;
      } else {
        const offset = 30;
        numberPosition = { x: strokes[0][0].x - offset, y: strokes[0][0].y - offset };
      }
      drawStrokeNumber(strokeNumber, numberPosition);
    }
  }

  /**
   * 「ひとふでずつ」モードで次の画を描画する
   */
  async function advanceStep() {
    isAnimating = true;
    replayBtn.disabled = true;

    const strokes = STROKE_DATA[currentCharacter];
    const strokeToAnimate = strokes[currentStepStrokeIndex];
    const previousStrokes = strokes.slice(0, currentStepStrokeIndex);

    const previousSmoothPaths = previousStrokes.map(p => generateSmoothPath(p));
    const currentSmoothPath = generateSmoothPath(strokeToAnimate);

    // 番号の位置を決定
    const strokeNumber = currentStepStrokeIndex + 1;
    const overridePos = STROKE_NUMBER_POS_OVERRIDES[currentCharacter]?.[strokeNumber];
    let numberPosition;
    if (overridePos) {
      numberPosition = overridePos;
    } else {
      const offset = 30;
      numberPosition = { x: strokeToAnimate[0].x - offset, y: strokeToAnimate[0].y - offset };
    }

    await animateStrokeOnPath(currentSmoothPath, previousSmoothPaths, currentSmoothPath.length * 15, strokeNumber, numberPosition);

    currentStepStrokeIndex++;

    if (currentStepStrokeIndex >= strokes.length) {
      replayBtn.textContent = 'もういちど';
    } else if (showStrokeNumbers) {
      // 次の画の番号を描画
      const nextStrokeNumber = currentStepStrokeIndex + 1;
      const nextOverridePos = STROKE_NUMBER_POS_OVERRIDES[currentCharacter]?.[nextStrokeNumber];
      const nextPos = nextOverridePos ? nextOverridePos : { x: strokes[currentStepStrokeIndex][0].x - 30, y: strokes[currentStepStrokeIndex][0].y - 30 };
      drawStrokeNumber(nextStrokeNumber, nextPos);
    }

    isAnimating = false;
    replayBtn.disabled = false;
  }

  /**
   * Gets the mouse/touch position relative to the canvas.
   * @param {MouseEvent|TouchEvent} e - The event object.
   * @returns {{x: number, y: number}} The coordinates.
   */
  function getEventPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  /**
   * Draws the user's path in practice mode.
   */
  function drawPracticeScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGuideLines();
    drawGuideCharacter(currentCharacter); // なぞり用のお手本を描画

    // 確定した線（ストローク）をすべて描画
    ctx.strokeStyle = '#d32f2f'; // User's drawing color
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    userStrokes.forEach(stroke => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    });

    // 現在書いている途中の線を描画
    if (userPath.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(userPath[0].x, userPath[0].y);
    for (let i = 1; i < userPath.length; i++) {
      ctx.lineTo(userPath[i].x, userPath[i].y);
    }
    ctx.stroke();
  }

  // --- Drawing Event Handlers ---

  function startDrawing(e) {
    if (currentMode !== 'practice' || isAnimating) return;
    e.preventDefault();
    isDrawing = true;
    userPath = [getEventPosition(e)];
    drawPracticeScreen();
  }

  function continueDrawing(e) {
    if (!isDrawing || currentMode !== 'practice') return;
    e.preventDefault();
    userPath.push(getEventPosition(e));
    drawPracticeScreen();
  }

  function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    // 書き終わった線を確定済みのストロークとして保存
    if (userPath.length > 1) {
      userStrokes.push(userPath);
    }
    userPath = []; // 現在のパスをリセット
  }

  function selectCharacter(char) {
    currentCharacter = char;
    modelCharDisplay.textContent = char;
    if (currentMode === 'watch') {
      animateStrokes(char);
    } else if (currentMode === 'step') {
      setupStepMode(char);
    } else {
      // 練習モード
      isAnimating = false;
      userStrokes = [];
      userPath = [];
      drawPracticeScreen();
    }
  }

  function createCharacterButtons() {
    characterGrid.innerHTML = ''; // Clear existing buttons
    HIRAGANA_GYO.forEach(group => {
      const groupContainer = document.createElement('div');
      groupContainer.classList.add('char-group');

      group.forEach(char => {
        const btn = document.createElement('button');
        btn.classList.add('char-btn');
        btn.textContent = char;

        if (char === '　') {
          btn.classList.add('empty');
          btn.disabled = true;
        } else {
          btn.addEventListener('click', async () => {

            // 他の音声が再生中でなければ、文字の音声を再生
            if (isAudioPlaying) return;
            isAudioPlaying = true;
            await playSE(`assets/sounds/hiragana/${char}.mp3`);
            isAudioPlaying = false;

            selectCharacter(char);
          });
        }
        groupContainer.appendChild(btn);
      });
      characterGrid.appendChild(groupContainer);
    });
  }

  function switchMode(mode) {
    if (currentMode === mode) return;
    currentMode = mode;
    const canvasContainer = canvas.parentNode;

    if (mode === 'watch') {
      watchModeBtn.classList.add('selected');
      practiceModeBtn.classList.remove('selected');
      stepModeBtn.classList.remove('selected');
      canvasContainer.classList.remove('practice-mode');
      replayBtn.textContent = 'もういちど';
      replayBtn.style.visibility = 'visible';
      toggleNumbersBtn.style.visibility = 'visible';
      // Re-run animation for the current character
      animateStrokes(currentCharacter);
    } else if (mode === 'step') {
      watchModeBtn.classList.remove('selected');
      stepModeBtn.classList.add('selected');
      practiceModeBtn.classList.remove('selected');
      canvasContainer.classList.remove('practice-mode');
      replayBtn.style.visibility = 'visible';
      toggleNumbersBtn.style.visibility = 'visible';
      setupStepMode(currentCharacter);
    } else { // practice mode
      watchModeBtn.classList.remove('selected');
      stepModeBtn.classList.remove('selected');
      practiceModeBtn.classList.add('selected');
      canvasContainer.classList.add('practice-mode');
      replayBtn.textContent = 'ぜんぶけす';
      replayBtn.style.visibility = 'visible';
      toggleNumbersBtn.style.visibility = 'hidden';
      // Clear canvas for drawing
      isAnimating = false; // Stop any ongoing animation
      userStrokes = [];
      userPath = [];
      drawPracticeScreen();
    }
  }
  // --- Initialization ---
  function initialize() {
    createCharacterButtons();
    replayBtn.addEventListener('click', () => {
      if (isAnimating) return;
      if (currentMode === 'watch') {
        animateStrokes(currentCharacter);
      } else if (currentMode === 'step') {
        const strokes = STROKE_DATA[currentCharacter];
        if (currentStepStrokeIndex >= strokes.length) {
          setupStepMode(currentCharacter); // Reset if finished
        } else {
          advanceStep();
        }
      } else if (currentMode === 'practice') {
        userStrokes = [];
        userPath = [];
        drawPracticeScreen();
      }
    });

    toggleNumbersBtn.addEventListener('click', () => {
      showStrokeNumbers = !showStrokeNumbers;
      if (showStrokeNumbers) {
        toggleNumbersBtn.textContent = 'ばんごう ON';
        toggleNumbersBtn.classList.remove('off');
      } else {
        toggleNumbersBtn.textContent = 'ばんごう OFF';
        toggleNumbersBtn.classList.add('off');
      }
      // モードが「おてほん」で、アニメーション中でなければ、表示を更新するために再描画
      if (currentMode === 'watch' && !isAnimating) {
        animateStrokes(currentCharacter);
      } else if (currentMode === 'step') {
        setupStepMode(currentCharacter); // Reset step mode to show/hide number
      }
    });

    // Mode buttons
    watchModeBtn.addEventListener('click', () => switchMode('watch'));
    stepModeBtn.addEventListener('click', () => switchMode('step'));
    practiceModeBtn.addEventListener('click', () => switchMode('practice'));

    // ボタンにスタイルを適用
    replayBtn.classList.add('colorful-btn');
    watchModeBtn.classList.add('colorful-btn');
    practiceModeBtn.classList.add('colorful-btn');
    stepModeBtn.classList.add('colorful-btn');
    toggleNumbersBtn.classList.add('colorful-btn');

    // Canvas drawing events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', continueDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', continueDrawing, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    // Initial animation
    selectCharacter('あ');

    document.body.addEventListener('click', initializeBgm, { once: true });
    document.body.addEventListener('touchstart', initializeBgm, { once: true });
  }

  initialize();
});