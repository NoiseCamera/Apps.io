document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
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
  let currentCharacter = 'ア';
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
    "ア": [
      [{ x: 45, y: 81 }, { x: 105, y: 79.5 }, { x: 240, y: 67.5 }, { x: 247.5, y: 75 }, { x: 225, y: 120 }, { x: 183, y: 150 }],
      [{ x: 150, y: 120 }, { x: 142.5, y: 210 }, { x: 90, y: 261 }]
    ],
    "イ": [
      [{ x: 225, y: 45 }, { x: 165, y: 117 }, { x: 60, y: 172.5 }],
      [{ x: 165, y: 120 }, { x: 165, y: 255 }]
    ],
    "ウ": [
      [{ x: 150, y: 30 }, { x: 151.5, y: 90 }],
      [{ x: 60, y: 87 }, { x: 69, y: 165 }],
      [{ x: 60, y: 97.5 }, { x: 240, y: 87 }, { x: 243, y: 90 }, { x: 225, y: 192 }, { x: 135, y: 261 }]
    ],
    "エ": [
      [{ x: 75, y: 90 }, { x: 135, y: 90 }, { x: 213, y: 81 }],
      [{ x: 150, y: 87 }, { x: 150, y: 217.5 }],
      [{ x: 30, y: 225 }, { x: 60, y: 225 }, { x: 270, y: 210 }]
    ],
    "オ": [
      [{ x: 60, y: 105 }, { x: 90, y: 105 }, { x: 255, y: 94.5 }],
      [{ x: 180, y: 30 }, { x: 183, y: 75 }, { x: 183, y: 262.5 }, { x: 181.5, y: 258 }, { x: 120, y: 231 }],
      [{ x: 180, y: 105 }, { x: 120, y: 180 }, { x: 45, y: 219 }]
    ],
    "カ": [
      [{ x: 60, y: 111 }, { x: 75, y: 109.5 }, { x: 225, y: 99 }, { x: 234, y: 105 }, { x: 195, y: 258 }, { x: 183, y: 258 }, { x: 141, y: 231 }],
      [{ x: 156, y: 37.5 }, { x: 129, y: 165 }, { x: 48, y: 246 }]
    ],
    "キ": [
      [{ x: 60, y: 105 }, { x: 135, y: 93 }, { x: 210, y: 75 }],
      [{ x: 45, y: 189 }, { x: 150, y: 171 }, { x: 255, y: 150 }],
      [{ x: 123, y: 36 }, { x: 174, y: 267 }]
    ],
    "ク": [
      [{ x: 141, y: 48 }, { x: 120, y: 93 }, { x: 69, y: 138 }],
      [{ x: 141, y: 60 }, { x: 225, y: 57 }, { x: 228, y: 60 }, { x: 195, y: 165 }, { x: 72, y: 261 }]
    ],
    "ケ": [
      [{ x: 108, y: 45 }, { x: 90, y: 105 }, { x: 36, y: 156 }],
      [{ x: 90, y: 105 }, { x: 261, y: 96 }],
      [{ x: 180, y: 105 }, { x: 165, y: 201 }, { x: 105, y: 261 }]
    ],
    "コ": [
      [{ x: 66, y: 90 }, { x: 222, y: 78 }, { x: 228, y: 84 }, { x: 210, y: 222 }],
      [{ x: 63, y: 232.5 }, { x: 90, y: 228 }, { x: 225, y: 222 }]
    ],
    "サ": [
      [{ x: 30, y: 120 }, { x: 105, y: 115.5 }, { x: 270, y: 102 }],
      [{ x: 105, y: 51 }, { x: 106.5, y: 180 }],
      [{ x: 202.5, y: 33 }, { x: 198, y: 195 }, { x: 138, y: 267 }]
    ],
    "シ": [
      [{ x: 75, y: 51 }, { x: 105, y: 64.5 }, { x: 135, y: 90 }],
      [{ x: 42, y: 120 }, { x: 75, y: 132 }, { x: 105, y: 156 }],
      [{ x: 75, y: 252 }, { x: 165, y: 219 }, { x: 258, y: 120 }]
    ],
    "ス": [
      [{ x: 69, y: 75 }, { x: 210, y: 60 }, { x: 216, y: 66 }, { x: 150, y: 180 }, { x: 45, y: 252 }],
      [{ x: 156, y: 168 }, { x: 195, y: 189 }, { x: 246, y: 243 }]
    ],
    "セ": [
      [{ x: 27, y: 135 }, { x: 150, y: 108 }, { x: 240, y: 90 }, { x: 246, y: 96 }, { x: 237, y: 120 }, { x: 195, y: 165 }],
      [{ x: 105, y: 33 }, { x: 108, y: 210 }, { x: 120, y: 237 }, { x: 237, y: 240 }]
    ],
    "ソ": [
      [{ x: 57, y: 66 }, { x: 90, y: 96 }, { x: 108, y: 123 }],
      [{ x: 232.5, y: 48 }, { x: 195, y: 180 }, { x: 105, y: 255 }]
    ],
    "タ": [
      [{ x: 141, y: 45 }, { x: 120, y: 90 }, { x: 60, y: 141 }],
      [{ x: 135, y: 60 }, { x: 225, y: 60 }, { x: 231, y: 66 }, { x: 195, y: 171 }, { x: 72, y: 267 }],
      [{ x: 114, y: 126 }, { x: 150, y: 147 }, { x: 180, y: 180 }]
    ],
    "チ": [
      [{ x: 195, y: 33 }, { x: 150, y: 57 }, { x: 75, y: 87 }],
      [{ x: 33, y: 153 }, { x: 195, y: 135 }, { x: 261, y: 135 }],
      [{ x: 150, y: 60 }, { x: 150, y: 210 }, { x: 93, y: 267 }]
    ],
    "ツ": [
      [{ x: 45, y: 75 }, { x: 67.5, y: 99 }, { x: 82.5, y: 127.5 }],
      [{ x: 120, y: 51 }, { x: 138, y: 75 }, { x: 150, y: 108 }],
      [{ x: 246, y: 60 }, { x: 210, y: 180 }, { x: 120, y: 249 }]
    ],
    "テ": [
      [{ x: 87, y: 60 }, { x: 150, y: 57 }, { x: 210, y: 51 }],
      [{ x: 30, y: 138 }, { x: 165, y: 126 }, { x: 270, y: 120 }],
      [{ x: 150, y: 135 }, { x: 150, y: 210 }, { x: 90, y: 267 }]
    ],
    "ト": [
      [{ x: 120, y: 30 }, { x: 120, y: 264 }],
      [{ x: 120, y: 123 }, { x: 165, y: 135 }, { x: 225, y: 171 }]
    ],
    "ナ": [
      [{ x: 36, y: 129 }, { x: 258, y: 108 }],
      [{ x: 150, y: 36 }, { x: 150, y: 210 }, { x: 96, y: 255 }]
    ],
    "ニ": [
      [{ x: 75, y: 90 }, { x: 135, y: 90 }, { x: 213, y: 81 }],
      [{ x: 30, y: 225 }, { x: 60, y: 225 }, { x: 270, y: 210 }]
    ],
    "ヌ": [
      [{ x: 81, y: 60 }, { x: 210, y: 54 }, { x: 216, y: 60 }, { x: 165, y: 177 }, { x: 45, y: 252 }],
      [{ x: 105, y: 120 }, { x: 165, y: 153 }, { x: 222, y: 204 }]
    ],
    "ネ": [
      [{ x: 120, y: 18 }, { x: 153, y: 45 }, { x: 165, y: 57 }],
      [{ x: 75, y: 93 }, { x: 207, y: 78 }, { x: 213, y: 84 }, { x: 150, y: 165 }, { x: 33, y: 222 }],
      [{ x: 150, y: 165 }, { x: 150, y: 270 }],
      [{ x: 180, y: 156 }, { x: 210, y: 174 }, { x: 252, y: 210 }]
    ],
    "ノ": [
      [{ x: 216, y: 30 }, { x: 156, y: 180 }, { x: 57, y: 246 }]
    ],
    "ハ": [
      [{ x: 105, y: 90 }, { x: 75, y: 165 }, { x: 30, y: 210 }],
      [{ x: 195, y: 97.5 }, { x: 225, y: 135 }, { x: 264, y: 195 }]
    ],
    "ヒ": [
      [{ x: 82.5, y: 127.5 }, { x: 180, y: 114 }, { x: 225, y: 102 }],
      [{ x: 82.5, y: 39 }, { x: 82.5, y: 210 }, { x: 105, y: 240 }, { x: 240, y: 232.5 }]
    ],
    "フ": [
      [{ x: 54, y: 81 }, { x: 225, y: 63 }, { x: 237, y: 75 }, { x: 195, y: 195 }, { x: 105, y: 249 }]
    ],
    "ヘ": [
      [{ x: 24, y: 162 }, { x: 54, y: 135 }, { x: 105, y: 84 }, { x: 105, y: 84 }, { x: 195, y: 165 }, { x: 270, y: 219 }]
    ],
    "ホ": [
      [{ x: 54, y: 106.5 }, { x: 105, y: 105 }, { x: 246, y: 93 }],
      [{ x: 150, y: 30 }, { x: 156, y: 255 }, { x: 147, y: 258 }, { x: 105, y: 231 }],
      [{ x: 82.5, y: 153 }, { x: 60, y: 201 }, { x: 36, y: 228 }],
      [{ x: 210, y: 153 }, { x: 240, y: 192 }, { x: 255, y: 228 }]
    ],
    "マ": [
      [{ x: 30, y: 102 }, { x: 90, y: 96 }, { x: 246, y: 87 }, { x: 252, y: 93 }, { x: 210, y: 156 }, { x: 153, y: 195 }],
      [{ x: 108, y: 153 }, { x: 150, y: 189 }, { x: 198, y: 246 }]
    ],
    "ミ": [
      [{ x: 105, y: 48 }, { x: 150, y: 60 }, { x: 201, y: 87 }],
      [{ x: 108, y: 123 }, { x: 150, y: 138 }, { x: 189, y: 162 }],
      [{ x: 90, y: 201 }, { x: 150, y: 222 }, { x: 207, y: 252 }]
    ],
    "ム": [
      [{ x: 150, y: 51 }, { x: 96, y: 156 }, { x: 54, y: 216 }, { x: 57, y: 228 }, { x: 75, y: 234 }, { x: 225, y: 210 }],
      [{ x: 186, y: 150 }, { x: 225, y: 192 }, { x: 255, y: 240 }]
    ],
    "メ": [
      [{ x: 222, y: 36 }, { x: 150, y: 186 }, { x: 57, y: 247.5 }],
      [{ x: 105, y: 105 }, { x: 165, y: 144 }, { x: 225, y: 195 }]
    ],
    "モ": [
      [{ x: 75, y: 66 }, { x: 120, y: 66 }, { x: 198, y: 60 }],
      [{ x: 30, y: 153 }, { x: 120, y: 141 }, { x: 270, y: 141 }],
      [{ x: 135, y: 63 }, { x: 135, y: 195 }, { x: 141, y: 240 }, { x: 240, y: 240 }]
    ],
    "ヤ": [
      [{ x: 33, y: 126 }, { x: 246, y: 81 }, { x: 252, y: 87 }, { x: 234, y: 135 }, { x: 195, y: 168 }],
      [{ x: 105, y: 45 }, { x: 135, y: 162 }, { x: 156, y: 267 }]
    ],
    "ユ": [
      [{ x: 78, y: 96 }, { x: 195, y: 90 }, { x: 201, y: 96 }, { x: 180, y: 204 }],
      [{ x: 27, y: 217.5 }, { x: 270, y: 204 }]
    ],
    "ヨ": [
      [{ x: 69, y: 81 }, { x: 213, y: 72 }, { x: 219, y: 78 }, { x: 204, y: 213 }],
      [{ x: 75, y: 150 }, { x: 210, y: 144 }],
      [{ x: 60, y: 231 }, { x: 219, y: 216 }]
    ],
    "ラ": [
      [{ x: 78, y: 66 }, { x: 135, y: 61.5 }, { x: 210, y: 57 }],
      [{ x: 45, y: 129 }, { x: 231, y: 120 }, { x: 237, y: 126 }, { x: 195, y: 225 }, { x: 117, y: 264 }]
    ],
    "リ": [
      [{ x: 96, y: 45 }, { x: 96, y: 153 }],
      [{ x: 198, y: 30 }, { x: 198, y: 150 }, { x: 186, y: 207 }, { x: 135, y: 276 }]
    ],
    "ル": [
      [{ x: 90, y: 75 }, { x: 84, y: 180 }, { x: 33, y: 237 }],
      [{ x: 150, y: 45 }, { x: 150, y: 231 }, { x: 156, y: 237 }, { x: 195, y: 228 }, { x: 273, y: 150 }]
    ],
    "レ": [
      [{ x: 90, y: 45 }, { x: 90, y: 234 }, { x: 96, y: 240 }, { x: 165, y: 216 }, { x: 240, y: 141 }]
    ],
    "ロ": [
      [{ x: 60, y: 78 }, { x: 81, y: 234 }],
      [{ x: 63, y: 90 }, { x: 225, y: 78 }, { x: 237, y: 90 }, { x: 207, y: 210 }],
      [{ x: 75, y: 219 }, { x: 219, y: 210 }]
    ],
    "ワ": [
      [{ x: 60, y: 63 }, { x: 72, y: 153 }],
      [{ x: 63, y: 72 }, { x: 225, y: 66 }, { x: 237, y: 78 }, { x: 201, y: 195 }, { x: 132, y: 249 }]
    ],
    "ヲ": [
      [{ x: 69, y: 72 }, { x: 135, y: 70.5 }, { x: 231, y: 63 }],
      [{ x: 57, y: 144 }, { x: 216, y: 129 }],
      [{ x: 231, y: 63 }, { x: 210, y: 180 }, { x: 123, y: 255 }]
    ],
    "ン": [
      [{ x: 54, y: 63 }, { x: 105, y: 93 }, { x: 129, y: 114 }],
      [{ x: 57, y: 246 }, { x: 165, y: 210 }, { x: 255, y: 114 }]
    ],
    "ガ": [
      [{ x: 45, y: 111 }, { x: 219, y: 93 }, { x: 225, y: 99 }, { x: 210, y: 210 }, { x: 177, y: 261 }, { x: 165, y: 255 }, { x: 132, y: 231 }],
      [{ x: 156, y: 37.5 }, { x: 129, y: 165 }, { x: 48, y: 246 }],
      [{ x: 225, y: 45 }, { x: 243, y: 60 }, { x: 261, y: 84 }],
      [{ x: 249, y: 21 }, { x: 270, y: 39 }, { x: 285, y: 60 }]
    ],
    "ギ": [
      [{ x: 45, y: 108 }, { x: 120, y: 96 }, { x: 207, y: 78 }],
      [{ x: 36, y: 195 }, { x: 135, y: 174 }, { x: 252, y: 150 }],
      [{ x: 120, y: 33 }, { x: 165, y: 267 }],
      [{ x: 228, y: 42 }, { x: 246, y: 60 }, { x: 252, y: 72 }],
      [{ x: 258, y: 21 }, { x: 276, y: 39 }, { x: 285, y: 52.5 }]
    ],
    "グ": [
      [{ x: 126, y: 48 }, { x: 105, y: 93 }, { x: 54, y: 138 }],
      [{ x: 126, y: 60 }, { x: 210, y: 57 }, { x: 213, y: 60 }, { x: 174, y: 180 }, { x: 57, y: 261 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "ゲ": [
      [{ x: 105, y: 45 }, { x: 75, y: 120 }, { x: 33, y: 162 }],
      [{ x: 75, y: 120 }, { x: 255, y: 105 }],
      [{ x: 180, y: 114 }, { x: 156, y: 210 }, { x: 90, y: 261 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "ゴ": [
      [{ x: 51, y: 96 }, { x: 207, y: 81 }, { x: 213, y: 87 }, { x: 195, y: 222 }],
      [{ x: 48, y: 231 }, { x: 201, y: 225 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "ザ": [
      [{ x: 21, y: 120 }, { x: 264, y: 105 }],
      [{ x: 96, y: 48 }, { x: 96, y: 180 }],
      [{ x: 195, y: 33 }, { x: 195, y: 204 }, { x: 132, y: 264 }],
      [{ x: 234, y: 39 }, { x: 250.5, y: 54 }, { x: 264, y: 75 }],
      [{ x: 264, y: 21 }, { x: 279, y: 33 }, { x: 294, y: 54 }]
    ],
    "ジ": [
      [{ x: 69, y: 48 }, { x: 105, y: 66 }, { x: 132, y: 87 }],
      [{ x: 36, y: 120 }, { x: 75, y: 135 }, { x: 105, y: 156 }],
      [{ x: 72, y: 255 }, { x: 180, y: 201 }, { x: 252, y: 108 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "ズ": [
      [{ x: 63, y: 75 }, { x: 192, y: 69 }, { x: 201, y: 78 }, { x: 150, y: 171 }, { x: 30, y: 252 }],
      [{ x: 150, y: 171 }, { x: 180, y: 192 }, { x: 240, y: 243 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "ゼ": [
      [{ x: 30, y: 141 }, { x: 231, y: 90 }, { x: 237, y: 96 }, { x: 210, y: 144 }, { x: 180, y: 166.5 }],
      [{ x: 102, y: 48 }, { x: 102, y: 210 }, { x: 120, y: 246 }, { x: 228, y: 241.5 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "ゾ": [
      [{ x: 39, y: 69 }, { x: 60, y: 90 }, { x: 90, y: 126 }],
      [{ x: 216, y: 66 }, { x: 171, y: 195 }, { x: 78, y: 255 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "ダ": [
      [{ x: 123, y: 48 }, { x: 90, y: 108 }, { x: 45, y: 144 }],
      [{ x: 114, y: 66 }, { x: 204, y: 66 }, { x: 210, y: 72 }, { x: 165, y: 180 }, { x: 105, y: 240 }, { x: 52.5, y: 264 }],
      [{ x: 102, y: 135 }, { x: 138, y: 159 }, { x: 162, y: 183 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "ヂ": [
      [{ x: 189, y: 36 }, { x: 135, y: 66 }, { x: 69, y: 84 }],
      [{ x: 33, y: 150 }, { x: 165, y: 138 }, { x: 255, y: 135 }],
      [{ x: 147, y: 69 }, { x: 150, y: 180 }, { x: 129, y: 240 }, { x: 90, y: 262.5 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "ヅ": [
      [{ x: 30, y: 75 }, { x: 57, y: 105 }, { x: 69, y: 132 }],
      [{ x: 108, y: 51 }, { x: 129, y: 90 }, { x: 135, y: 114 }],
      [{ x: 228, y: 81 }, { x: 189, y: 192 }, { x: 102, y: 252 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "デ": [
      [{ x: 75, y: 60 }, { x: 150, y: 57 }, { x: 195, y: 51 }],
      [{ x: 30, y: 138 }, { x: 165, y: 129 }, { x: 252, y: 120 }],
      [{ x: 150, y: 135 }, { x: 150, y: 210 }, { x: 90, y: 267 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "ド": [
      [{ x: 120, y: 30 }, { x: 120, y: 264 }],
      [{ x: 120, y: 123 }, { x: 165, y: 135 }, { x: 225, y: 171 }],
      [{ x: 207, y: 30 }, { x: 225, y: 48 }, { x: 240, y: 72 }],
      [{ x: 234, y: 12 }, { x: 249, y: 30 }, { x: 261, y: 45 }]
    ],
    "バ": [
      [{ x: 105, y: 90 }, { x: 75, y: 165 }, { x: 30, y: 210 }],
      [{ x: 195, y: 97.5 }, { x: 225, y: 135 }, { x: 264, y: 195 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "ビ": [
      [{ x: 225, y: 102 }, { x: 180, y: 114 }, { x: 82.5, y: 127.5 }],
      [{ x: 82.5, y: 39 }, { x: 82.5, y: 210 }, { x: 105, y: 240 }, { x: 240, y: 232.5 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "ブ": [
      [{ x: 54, y: 81 }, { x: 225, y: 63 }, { x: 237, y: 75 }, { x: 195, y: 195 }, { x: 105, y: 249 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "ベ": [
      [{ x: 24, y: 162 }, { x: 54, y: 135 }, { x: 105, y: 84 }, { x: 105, y: 84 }, { x: 195, y: 165 }, { x: 270, y: 219 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "ボ": [
      [{ x: 54, y: 106.5 }, { x: 105, y: 105 }, { x: 246, y: 93 }],
      [{ x: 150, y: 30 }, { x: 156, y: 255 }, { x: 147, y: 258 }, { x: 105, y: 231 }],
      [{ x: 82.5, y: 153 }, { x: 60, y: 201 }, { x: 36, y: 228 }],
      [{ x: 210, y: 153 }, { x: 240, y: 192 }, { x: 255, y: 228 }],
      [{ x: 222, y: 30 }, { x: 240, y: 48 }, { x: 255, y: 72 }],
      [{ x: 249, y: 12 }, { x: 264, y: 30 }, { x: 276, y: 45 }]
    ],
    "パ": [
      [{ x: 105, y: 90 }, { x: 75, y: 165 }, { x: 30, y: 210 }],
      [{ x: 195, y: 97.5 }, { x: 225, y: 135 }, { x: 264, y: 195 }],
      [{ x: 261, y: 15 }, { x: 270, y: 15.75 }, { x: 282, y: 36 }, { x: 261, y: 60 }, { x: 240, y: 36 }, { x: 252, y: 15.75 }, { x: 261, y: 15 }]
    ],
    "ピ": [
      [{ x: 225, y: 102 }, { x: 180, y: 114 }, { x: 82.5, y: 127.5 }],
      [{ x: 82.5, y: 39 }, { x: 82.5, y: 210 }, { x: 105, y: 240 }, { x: 240, y: 232.5 }],
      [{ x: 261, y: 15 }, { x: 270, y: 15.75 }, { x: 282, y: 36 }, { x: 261, y: 60 }, { x: 240, y: 36 }, { x: 252, y: 15.75 }, { x: 261, y: 15 }]
    ],
    "プ": [
      [{ x: 54, y: 81 }, { x: 225, y: 63 }, { x: 237, y: 75 }, { x: 195, y: 195 }, { x: 105, y: 249 }],
      [{ x: 261, y: 15 }, { x: 270, y: 15.75 }, { x: 282, y: 36 }, { x: 261, y: 60 }, { x: 240, y: 36 }, { x: 252, y: 15.75 }, { x: 261, y: 15 }]
    ],
    "ペ": [
      [{ x: 24, y: 162 }, { x: 54, y: 135 }, { x: 105, y: 84 }, { x: 105, y: 84 }, { x: 195, y: 165 }, { x: 270, y: 219 }],
      [{ x: 261, y: 15 }, { x: 270, y: 15.75 }, { x: 282, y: 36 }, { x: 261, y: 60 }, { x: 240, y: 36 }, { x: 252, y: 15.75 }, { x: 261, y: 15 }]
    ],
    "ポ": [
      [{ x: 54, y: 106.5 }, { x: 105, y: 105 }, { x: 246, y: 93 }],
      [{ x: 150, y: 30 }, { x: 156, y: 255 }, { x: 147, y: 258 }, { x: 105, y: 231 }],
      [{ x: 82.5, y: 153 }, { x: 60, y: 201 }, { x: 36, y: 228 }],
      [{ x: 210, y: 153 }, { x: 240, y: 192 }, { x: 255, y: 228 }],
      [{ x: 261, y: 15 }, { x: 270, y: 15.75 }, { x: 282, y: 36 }, { x: 261, y: 60 }, { x: 240, y: 36 }, { x: 252, y: 15.75 }, { x: 261, y: 15 }]
    ]
  };
 // End of STROKE_DATA

  // 右から「あ行」「か行」...と縦に並べるための配列
  const KATAKANA_GYO = [
    ['ア', 'イ', 'ウ', 'エ', 'オ'],
    ['カ', 'キ', 'ク', 'ケ', 'コ'],
    ['サ', 'シ', 'ス', 'セ', 'ソ'],
    ['タ', 'チ', 'ツ', 'テ', 'ト'],
    ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
    ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
    ['マ', 'ミ', 'ム', 'メ', 'モ'],
    ['ヤ', '　', 'ユ', '　', 'ヨ'],
    ['ラ', 'リ', 'ル', 'レ', 'ロ'],
    ['ワ', '　', 'ヲ', '　', 'ン'],
    ['ガ', 'ギ', 'グ', 'ゲ', 'ゴ'],
    ['ザ', 'ジ', 'ズ', 'ゼ', 'ゾ'],
    ['ダ', 'ヂ', 'ヅ', 'デ', 'ド'],
    ['バ', 'ビ', 'ブ', 'ベ', 'ボ'],
    ['パ', 'ピ', 'プ', 'ペ', 'ポ']
  ];

  // プリロードする音声ファイルのリストを生成 (音声ファイルはひらがな名)
  const SOUND_EFFECTS = KATAKANA_GYO.flat()
    .filter(char => char !== '　')
    .map(char => `assets/sounds/hiragana/${katakanaToHiragana(char)}.mp3`);


  // 特定の文字・画数の番号表示位置を上書きするためのデータ
  const STROKE_NUMBER_POS_OVERRIDES = {
    'ア': {
      // 'ア'は2画なので、3画目の指定は不要でした。
      // 必要に応じて、ここに正しい画数の上書き設定を追加できます。
    }
  };

  // --- Functions ---

  /**
   * カタカナをひらがなに変換する関数
   * @param {string} katakanaChar - 変換するカタカナ1文字
   * @returns {string} 変換されたひらがな
   */
  function katakanaToHiragana(katakanaChar) {
    const charCode = katakanaChar.charCodeAt(0);
    // カタカナのUnicode範囲内であれば、オフセットを引いてひらがなにする
    if (charCode >= 0x30A1 && charCode <= 0x30F6) {
      return String.fromCharCode(charCode - 0x60);
    }
    return katakanaChar; // 範囲外ならそのまま返す
  }

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
    KATAKANA_GYO.forEach(group => {
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
            const hiraganaChar = katakanaToHiragana(char);
            await playSE(`assets/sounds/hiragana/${hiraganaChar}.mp3`);
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

    // Canvas drawing events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', continueDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', continueDrawing, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    // Initial animation
    selectCharacter('ア');

    document.body.addEventListener('click', initializeBgm, { once: true });
    document.body.addEventListener('touchstart', initializeBgm, { once: true });
  }

  initialize();
});
