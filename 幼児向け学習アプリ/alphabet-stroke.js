document.addEventListener('DOMContentLoaded', () => {
    // --- 工事中対応 ---
    document.body.innerHTML = `
        <style>
            @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
            @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
            .construction-icon { animation: bounce 2s infinite ease-in-out; display: inline-block; }
            .construction-title { animation: float 3s infinite ease-in-out; }
            .back-btn { transition: transform 0.2s; }
            .back-btn:hover { transform: scale(1.1); }
            .back-btn:active { transform: scale(0.95); }
        </style>
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f0f8ff; font-family: 'M PLUS Rounded 1c', sans-serif;">
            <h1 class="construction-title" style="color: #ff9800; font-size: 2em; margin-bottom: 20px;">ただいま こうじちゅう</h1>
            <div class="construction-icon" style="font-size: 4em; margin-bottom: 20px;">🚧</div>
            <p style="font-size: 1.2em; color: #333; text-align: center;">このゲームは まだ つくっている とちゅうだよ。<br>かんせいするまで まっててね！</p>
            <button class="back-btn" onclick="history.back()" style="margin-top: 30px; padding: 15px 30px; font-size: 1.2em; background-color: #4caf50; color: white; border: none; border-radius: 50px; cursor: pointer; box-shadow: 0 4px #2e7d32;">もどる</button>
        </div>
    `;
    return; // 以降の処理を実行しない

    // --- DOM Elements ---
    document.body.style.touchAction = 'manipulation';

    const characterGrid = document.getElementById('character-grid');
    const modelCharDisplay = document.getElementById('model-character-display');
    const replayBtn = document.getElementById('replay-btn');
    const watchModeBtn = document.getElementById('watch-mode-btn');
    const practiceModeBtn = document.getElementById('practice-mode-btn');
    const stepModeBtn = document.getElementById('step-mode-btn');
    const toggleNumbersBtn = document.getElementById('toggle-numbers-btn');

    // SVG Elements
    const strokeSvg = document.getElementById('stroke-svg');
    const guidePathsGroup = document.getElementById('guide-paths-group');
    const animatedPathsGroup = document.getElementById('animated-paths-group');
    const userPathsGroup = document.getElementById('user-paths-group');
    const strokeNumbersGroup = document.getElementById('stroke-numbers-group');

    // --- State ---
    let bgmInitialized = false;
    let isAnimating = false;
    let currentCharacter = 'A';
    let currentMode = 'watch'; // 'watch' or 'practice'
    let isDrawing = false;
    let showStrokeNumbers = true;
    let isAudioPlaying = false;
    let currentStepStrokeIndex = 0;
    let userPath = [];
    let userStrokes = [];

    // --- Settings ---
    const ANIMATION_SPEED = 150; // 1秒あたりに描画するピクセル数

    // --- Data ---
    // 300x300のSVGを基準とした書き順データ (d属性の文字列)
    const SVG_PATH_DATA = {
        // Numbers (Fixed)
        '0': ["M150,40 C80,40 70,100 70,150 C70,200 80,260 150,260 C220,260 230,200 230,150 C230,100 220,40 150,40 Z"],
        '1': ["M110,80 L150,40 V260"],
        '2': ["M80,100 C120,40 200,40 220,100 C220,150 100,220 80,260 H230"],
        '3': ["M80,80 C100,40 200,40 220,80 C220,120 180,140 150,140 C200,140 230,180 230,220 C230,260 190,270 150,270 C110,270 80,250 80,250"],
        '4': ["M100,40 V180 H220", "M180,40 V260"],
        '5': ["M220,60 H80 V140 C120,110 220,130 220,210 C220,260 160,270 100,250"],
        '6': ["M220,80 C180,40 100,40 80,150 C80,220 120,270 160,270 C200,270 220,230 220,190 C220,150 190,140 160,140 C130,140 110,160 110,160"],
        '7': ["M60,60 H240 L110,260"],
        '8': ["M150,150 C100,150 80,120 80,100 C80,80 100,50 150,50 C200,50 220,80 220,100 C220,120 200,150 150,150 C100,150 80,180 80,200 C80,220 100,250 150,250 C200,250 220,220 220,200 C220,180 200,150 150,150 Z"],
        '9': ["M220,120 C220,80 190,50 150,50 C110,50 80,80 80,120 C80,160 110,190 150,190 V260"],
        
        // Uppercase
        'A': ["M150,40 L60,260", "M150,40 L240,260", "M95,160 H205"],
        'B': ["M80,40 V260", "M80,40 H160 C220,40 220,130 160,150 C230,160 230,260 160,260 H80"],
        'C': ["M220,70 C200,40 100,40 80,150 C80,230 150,260 220,230"],
        'D': ["M80,40 V260", "M80,40 H140 C230,40 230,260 140,260 H80"],
        'E': ["M80,40 V260", "M80,40 H220", "M80,150 H200", "M80,260 H220"],
        'F': ["M80,40 V260", "M80,40 H220", "M80,150 H200"],
        'G': ["M220,70 C200,40 100,40 80,150 C80,230 150,260 220,260 V180 H160"],
        'H': ["M80,40 V260", "M220,40 V260", "M80,150 H220"],
        'I': ["M150,40 V260", "M100,40 H200", "M100,260 H200"],
        'J': ["M220,40 V200 C220,250 170,260 120,230"],
        'K': ["M80,40 V260", "M220,40 L80,150", "M120,120 L220,260"],
        'L': ["M80,40 V260 H220"],
        'M': ["M60,260 V40 L150,200 L240,40 V260"],
        'N': ["M80,260 V40 L220,260 V40"],
        'O': ["M150,40 C80,40 70,120 70,150 C70,180 80,260 150,260 C220,260 230,180 230,150 C230,120 220,40 150,40 Z"],
        'P': ["M80,40 V260", "M80,40 H160 C220,40 220,150 160,150 H80"],
        'Q': ["M150,40 C80,40 70,120 70,150 C70,180 80,260 150,260 C220,260 230,180 230,150 C230,120 220,40 150,40 Z", "M170,200 L240,270"],
        'R': ["M80,40 V260", "M80,40 H160 C220,40 220,150 160,150 H80", "M150,150 L220,260"],
        'S': ["M220,70 C200,40 150,40 120,60 C90,80 90,120 150,140 C210,160 210,200 180,220 C150,240 100,240 80,210"],
        'T': ["M60,40 H240", "M150,40 V260"],
        'U': ["M80,40 V200 C80,250 120,260 150,260 C180,260 220,250 220,200 V40"],
        'V': ["M60,40 L150,260 L240,40"],
        'W': ["M50,40 L90,260 L150,120 L210,260 L250,40"],
        'X': ["M60,40 L240,260", "M240,40 L60,260"],
        'Y': ["M60,40 L150,150", "M240,40 L150,150", "M150,150 V260"],
        'Z': ["M70,40 H230 L70,260 H230"],

        // Lowercase (and fixes)
        'a': ["M210,100 C180,80 140,80 100,120 C80,150 80,200 110,230 C140,260 180,250 210,220", "M210,80 V260"],
        'b': ["M80,40 V260", "M80,120 C120,100 180,100 200,140 C220,180 200,260 140,260 C100,260 80,230 80,230"],
        'c': ["M210,120 C190,100 140,100 100,140 C80,180 100,260 150,260 C190,260 210,230 210,230"],
        'd': ["M220,40 V260", "M220,120 C180,100 120,100 100,140 C80,180 100,260 160,260 C200,260 220,230 220,230"],
        'e': ["M80,180 H220 C220,120 150,100 100,140 C80,180 100,260 150,260 C190,260 220,230 220,230"],
        'f': ["M180,60 C150,40 120,40 120,80 V260", "M80,140 H160"],
        'g': ["M210,100 C180,80 140,80 100,120 C80,150 80,200 110,230 C140,260 180,250 210,220", "M210,100 V240 C210,280 180,300 140,300"],
        'h': ["M80,40 V260", "M80,140 C120,100 180,100 200,140 V260"],
        'i': ["M150,120 V260", "M150,70 V90"],
        'j': ["M180,120 V240 C180,280 150,300 110,300", "M180,70 V90"],
        'k': ["M80,40 V260", "M180,120 L80,180", "M120,160 L200,260"],
        'l': ["M150,40 V260"],
        'm': ["M80,120 V260", "M80,140 C110,110 150,110 160,140 V260", "M160,140 C190,110 230,110 240,140 V260"],
        'n': ["M80,120 V260", "M80,140 C120,100 180,100 200,140 V260"],
        'o': ["M150,120 C100,120 80,160 80,190 C80,220 100,260 150,260 C200,260 220,220 220,190 C220,160 200,120 150,120 Z"],
        'p': ["M80,120 V300", "M80,140 C120,100 180,100 200,140 C220,180 200,260 140,260 C100,260 80,230 80,230"],
        'q': ["M220,120 V300", "M220,140 C180,100 120,100 100,140 C80,180 100,260 160,260 C200,260 220,230 220,230"],
        'r': ["M80,120 V260", "M80,160 C110,120 150,120 170,130"],
        's': ["M200,140 C180,120 150,120 130,130 C110,140 110,160 150,170 C190,180 190,210 170,230 C150,250 110,250 90,230"],
        't': ["M120,60 V250 C120,260 130,260 150,260", "M80,140 H160"],
        'u': ["M80,120 V220 C80,250 120,260 150,260 C180,260 220,250 220,220 V260"],
        'v': ["M80,120 L150,260 L220,120"],
        'w': ["M60,120 L100,260 L150,160 L200,260 L240,120"],
        'x': ["M80,120 L220,260", "M220,120 L80,260"],
        'y': ["M80,120 L150,200", "M220,120 L100,300"],
        'z': ["M80,120 H220 L80,260 H220"]
    };

    // --- Functions ---

    function clearSvg() {
        guidePathsGroup.innerHTML = '';
        animatedPathsGroup.innerHTML = '';
        userPathsGroup.innerHTML = '';
        strokeNumbersGroup.innerHTML = '';
    }

    function drawStrokeNumber(number, position) {
        const ns = 'http://www.w3.org/2000/svg';
        let { x, y } = position;
        const radius = 16;
        x = Math.max(radius, Math.min(x, 300 - radius));
        y = Math.max(radius, Math.min(y, 300 - radius));

        const circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', '#ff8f00');

        const text = document.createElementNS(ns, 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('fill', 'white');
        text.setAttribute('font-family', '"M PLUS Rounded 1c", sans-serif');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('font-size', '24px');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.textContent = number;

        strokeNumbersGroup.appendChild(circle);
        strokeNumbersGroup.appendChild(text);
    }

    function drawFullGuideStrokes() {
        guidePathsGroup.innerHTML = '';
        const allStrokes = SVG_PATH_DATA[currentCharacter];
        if (!allStrokes) return;

        allStrokes.forEach(pathData => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#e0e0e0');
            path.setAttribute('stroke-width', '22');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            guidePathsGroup.appendChild(path);
        });
    }

    function initializeBgm() {
        if (bgmInitialized) return;
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.play().catch(error => console.log('BGMの再生にはユーザーの操作が必要です。', error));
        }
        if (typeof preloadAudioSources === 'function') {
            // preloadAudioSources(SOUND_EFFECTS); // 必要なら追加
        }
        bgmInitialized = true;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getPathStartPosition(pathData) {
        const match = pathData.match(/M\s*([\d.]+)\s*,?\s*([\d.]+)/);
        if (match) {
            return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
        }
        return { x: 50, y: 50 }; // fallback
    }

    async function animateSvgPath(pathElement, duration) {
        return new Promise(resolve => {
            const length = pathElement.getTotalLength();
            pathElement.style.strokeDasharray = length;
            pathElement.style.strokeDashoffset = length;

            const onEnd = () => {
                pathElement.removeEventListener('transitionend', onEnd);
                resolve();
            };
            pathElement.addEventListener('transitionend', onEnd);
            // 万が一transitionendが発火しない場合の保険
            setTimeout(onEnd, (duration * 1000) + 100);

            // アニメーションを開始
            setTimeout(() => {
                pathElement.style.transition = `stroke-dashoffset ${duration}s ease-in-out`;
                pathElement.style.strokeDashoffset = '0';
            }, 20); // 描画が更新されるのを待つ
        });
    }

    async function animateStrokes(character) {
        if (isAnimating) return;
        const strokes = SVG_PATH_DATA[character];
        if (!strokes) return;

        isAnimating = true;
        replayBtn.disabled = true;
        clearSvg();
        drawFullGuideStrokes();

        let strokeIndex = 0;
        const ns = 'http://www.w3.org/2000/svg';

        for (const pathData of strokes) {
            const strokeNumber = strokeIndex + 1;
            const offset = 30;
            const startPos = getPathStartPosition(pathData);
            const numberPosition = { x: startPos.x - offset, y: startPos.y - offset };

            // 番号を表示して少し待つ
            strokeNumbersGroup.innerHTML = '';
            if (showStrokeNumbers) {
                drawStrokeNumber(strokeNumber, numberPosition);
            }
            await sleep(400);

            const pathElement = document.createElementNS(ns, 'path');
            pathElement.setAttribute('d', pathData);
            pathElement.setAttribute('fill', 'none');
            pathElement.setAttribute('stroke', '#004d40');
            pathElement.setAttribute('stroke-width', '22');
            pathElement.setAttribute('stroke-linecap', 'round');
            pathElement.setAttribute('stroke-linejoin', 'round');
            animatedPathsGroup.appendChild(pathElement);

            const length = pathElement.getTotalLength();
            const duration = length / ANIMATION_SPEED;

            await animateSvgPath(pathElement, duration);

            await sleep(300);
            strokeIndex++;
        }

        isAnimating = false;
        replayBtn.disabled = false;
    }

    function setupStepMode(character) {
        isAnimating = false;
        currentStepStrokeIndex = 0;
        replayBtn.textContent = 'つぎへ';
        replayBtn.disabled = false;

        clearSvg();
        drawFullGuideStrokes(); // お手本として完成形を薄く表示

        const strokes = SVG_PATH_DATA[character];
        if (!strokes || strokes.length === 0) return;

        if (showStrokeNumbers) {
            const offset = 30;
            const startPos = getPathStartPosition(strokes[0]);
            const numberPosition = { x: startPos.x - offset, y: startPos.y - offset };
            drawStrokeNumber(1, numberPosition);
        }
    }

    async function advanceStep() {
        const strokes = SVG_PATH_DATA[currentCharacter];
        if (!strokes || currentStepStrokeIndex >= strokes.length) return;

        isAnimating = true;
        replayBtn.disabled = true;
        strokeNumbersGroup.innerHTML = '';

        const ns = 'http://www.w3.org/2000/svg';
        const pathData = strokes[currentStepStrokeIndex];
        const pathElement = document.createElementNS(ns, 'path');
        pathElement.setAttribute('d', pathData);
        pathElement.setAttribute('fill', 'none');
        pathElement.setAttribute('stroke', '#004d40');
        pathElement.setAttribute('stroke-width', '22');
        pathElement.setAttribute('stroke-linecap', 'round');
        pathElement.setAttribute('stroke-linejoin', 'round');
        animatedPathsGroup.appendChild(pathElement);

        const length = pathElement.getTotalLength();
        const duration = length / ANIMATION_SPEED;

        await animateSvgPath(pathElement, duration);

        currentStepStrokeIndex++;

        if (currentStepStrokeIndex >= strokes.length) {
            replayBtn.textContent = 'もういちど';
        } else {
            if (showStrokeNumbers) {
                const nextStrokeNumber = currentStepStrokeIndex + 1;
                const startPos = getPathStartPosition(strokes[currentStepStrokeIndex]);
                const nextPos = { x: startPos.x - 30, y: startPos.y - 30 };
                drawStrokeNumber(nextStrokeNumber, nextPos);
            }
        }

        isAnimating = false;
        replayBtn.disabled = false;
    }

    // --- Practice Mode Functions ---

    function getEventPosition(e) {
        const rect = strokeSvg.getBoundingClientRect();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        return {
            x: (clientX - rect.left) * (300 / rect.width),
            y: (clientY - rect.top) * (300 / rect.height)
        };
    }

    function drawPracticeScreen() {
        clearSvg();
        drawFullGuideStrokes();

        const ns = 'http://www.w3.org/2000/svg';
        userStrokes.forEach(stroke => {
            const path = document.createElementNS(ns, 'path');
            path.setAttribute('d', pointsToPathString(stroke));
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#d32f2f');
            path.setAttribute('stroke-width', '18');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            userPathsGroup.appendChild(path);
        });

        if (userPath.length > 1) {
            const currentPath = document.createElementNS(ns, 'path');
            currentPath.setAttribute('d', pointsToPathString(userPath));
            currentPath.setAttribute('fill', 'none');
            currentPath.setAttribute('stroke', '#d32f2f');
            currentPath.setAttribute('stroke-width', '18');
            currentPath.setAttribute('stroke-linecap', 'round');
            currentPath.setAttribute('stroke-linejoin', 'round');
            userPathsGroup.appendChild(currentPath);
        }
    }

    function pointsToPathString(points) {
        if (!points || points.length === 0) return '';
        const start = `M ${points[0].x} ${points[0].y}`;
        const rest = points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
        return `${start} ${rest}`;
    }

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
        if (userPath.length > 1) {
            userStrokes.push(userPath);
        }
        userPath = [];
    }

    // --- Main Logic ---

    function selectCharacter(char) {
        currentCharacter = char;
        modelCharDisplay.textContent = char;

        const strokes = SVG_PATH_DATA[char];
        if (!strokes) {
            isAnimating = false;
            clearSvg();
            const ns = 'http://www.w3.org/2000/svg';
            const text = document.createElementNS(ns, 'text');
            text.setAttribute('x', '150');
            text.setAttribute('y', '165');
            text.setAttribute('font-size', '30');
            text.setAttribute('text-anchor', 'middle');
            text.textContent = 'じゅんびちゅう';
            animatedPathsGroup.appendChild(text);
            replayBtn.disabled = true;
            return;
        }
        replayBtn.disabled = false;

        if (currentMode === 'watch') {
            animateStrokes(char);
        } else if (currentMode === 'step') {
            setupStepMode(char);
        } else if (currentMode === 'practice') {
            isAnimating = false;
            userStrokes = [];
            userPath = [];
            drawPracticeScreen();
        }
    }
    function createCharacterButtons() {
        characterGrid.innerHTML = '';
        
        const groups = [
            { title: 'おおもじ', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') },
            { title: 'こもじ', chars: 'abcdefghijklmnopqrstuvwxyz'.split('') },
            { title: 'すうじ', chars: '0123456789'.split('') }
        ];

        groups.forEach(group => {
            if (group.chars.length === 0) return;

            const groupWrapper = document.createElement('div');
            groupWrapper.style.width = '100%';
            groupWrapper.style.marginBottom = '15px';

            const title = document.createElement('div');
            title.textContent = group.title;
            title.style.fontWeight = 'bold';
            title.style.marginBottom = '5px';
            title.style.color = '#333';
            title.style.borderBottom = '2px solid #eee';
            groupWrapper.appendChild(title);

            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexWrap = 'wrap';
            container.style.gap = '5px';
            
            group.chars.forEach(char => {
                const btn = document.createElement('button');
                btn.textContent = char;
                btn.classList.add('char-btn');
                btn.addEventListener('click', () => {
                    selectCharacter(char);
                });
                container.appendChild(btn);
            });
            groupWrapper.appendChild(container);
            characterGrid.appendChild(groupWrapper);
        });
    }

    function switchMode(mode) {
        if (currentMode === mode) return;
        currentMode = mode;
        const svgContainer = strokeSvg.parentNode;

        if (mode === 'watch') {
            watchModeBtn.classList.add('selected');
            practiceModeBtn.classList.remove('selected');
            stepModeBtn.classList.remove('selected');
            svgContainer.classList.remove('practice-mode');
            replayBtn.textContent = 'もういちど';
            replayBtn.style.visibility = 'visible';
            toggleNumbersBtn.style.visibility = 'visible';
            animateStrokes(currentCharacter);
        } else if (mode === 'step') {
            watchModeBtn.classList.remove('selected');
            stepModeBtn.classList.add('selected');
            practiceModeBtn.classList.remove('selected');
            svgContainer.classList.remove('practice-mode');
            replayBtn.style.visibility = 'visible';
            toggleNumbersBtn.style.visibility = 'visible';
            setupStepMode(currentCharacter);
        } else {
            watchModeBtn.classList.remove('selected');
            stepModeBtn.classList.remove('selected');
            practiceModeBtn.classList.add('selected');
            svgContainer.classList.add('practice-mode');
            replayBtn.textContent = 'ぜんぶけす';
            replayBtn.style.visibility = 'visible';
            toggleNumbersBtn.style.visibility = 'hidden';
            isAnimating = false;
            userStrokes = [];
            userPath = [];
            drawPracticeScreen();
        }
    }

    function initialize() {
        createCharacterButtons();
        replayBtn.addEventListener('click', () => {
            if (isAnimating) return;
            if (currentMode === 'watch') {
                animateStrokes(currentCharacter);
            } else if (currentMode === 'step') {
                const strokes = SVG_PATH_DATA[currentCharacter];
                if (currentStepStrokeIndex >= strokes.length) {
                    setupStepMode(currentCharacter);
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
            if (currentMode === 'watch' && !isAnimating) {
                animateStrokes(currentCharacter);
            } else if (currentMode === 'step') {
                setupStepMode(currentCharacter);
            }
        });

        watchModeBtn.addEventListener('click', () => switchMode('watch'));
        stepModeBtn.addEventListener('click', () => switchMode('step'));
        practiceModeBtn.addEventListener('click', () => switchMode('practice'));

        replayBtn.classList.add('colorful-btn');
        watchModeBtn.classList.add('colorful-btn');
        practiceModeBtn.classList.add('colorful-btn');
        stepModeBtn.classList.add('colorful-btn');
        toggleNumbersBtn.classList.add('colorful-btn');

        strokeSvg.addEventListener('mousedown', startDrawing);
        strokeSvg.addEventListener('mousemove', continueDrawing);
        strokeSvg.addEventListener('mouseup', stopDrawing);
        strokeSvg.addEventListener('mouseleave', stopDrawing);
        strokeSvg.addEventListener('touchstart', startDrawing, { passive: false });
        strokeSvg.addEventListener('touchmove', continueDrawing, { passive: false });
        strokeSvg.addEventListener('touchend', stopDrawing);

        selectCharacter('A');

        document.body.addEventListener('click', initializeBgm, { once: true });
        document.body.addEventListener('touchstart', initializeBgm, { once: true });
    }

    initialize();
});
