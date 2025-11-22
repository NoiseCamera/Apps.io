// Japan Map Puzzle Game Logic

// 都道府県のIDとひらがな名の対応表
const PREF_MAP = {
    "aichi": "あいち", "akita": "あきた", "aomori": "あおもり", "chiba": "ちば", "ehime": "えひめ",
    "fukui": "ふくい", "fukuoka": "ふくおか", "fukushima": "ふくしま", "gifu": "ぎふ", "gunma": "ぐんま", "hiroshima": "ひろしま",
    "hokkaido": "ほっかいどう", "hyogo": "ひょうご", "ibaraki": "いばらき", "ishikawa": "いしかわ", "iwate": "いわて",
    "kagawa": "かがわ", "kagoshima": "かごしま", "kanagawa": "かながわ", "kochi": "こうち", "kumamoto": "くまもと",
    "kyoto": "きょうと", "mie": "みえ", "miyagi": "みやぎ", "miyazaki": "みやざき", "nagano": "ながの",
    "nagasaki": "ながさき", "nara": "なら", "niigata": "にいがた", "oita": "おおいた", "okayama": "おかやま",
    "okinawa": "おきなわ", "osaka": "おおさか", "saga": "さが", "saitama": "さいたま", "shiga": "しが",
    "shimane": "しまね", "shizuoka": "しずおか", "tochigi": "とちぎ", "tokushima": "とくしま", "tokyo": "とうきょう",
    "tottori": "とっとり", "toyama": "とやま", "wakayama": "わかやま", "yamagata": "やまがた", "yamaguchi": "やまぐち",
    "yamanashi": "やまなし"
};


// --- Game State ---
let mapFeatures = [];
let allPiecesData = []; // 全てのピースのデータと状態を管理
let placedPieces = new Set(); // 配置済みのピースのIDを管理
let currentRegion = "all";
let svg, gMap, gPieces, projection, pathGenerator;
let width, height;

// --- Constants ---
const SNAP_DISTANCE = 25; // この距離以内ならスナップする
const TOPOJSON_URL = 'assets/data/japan-prefectures.json';

// --- Audio ---
const SOUND_EFFECTS = [
    'assets/sounds/snap.mp3',
    'assets/sounds/fanfare.mp3',
];

/**
 * PREFECTURES_DATAが利用可能になるまで待機する関数
 * @param {function} callback - データが利用可能になった後に実行するコールバック関数
 */
function waitForData(callback) {
    if (typeof PREFECTURES_DATA !== 'undefined' && typeof REGIONS !== 'undefined') {
        callback();
    } else {
        // 100ミリ秒ごとにデータが定義されるかチェックする
        setTimeout(() => waitForData(callback), 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // PREFECTURES_DATAが読み込まれるのを待ってからゲームの初期化を開始
    waitForData(initializeGame);
});

/**
 * TopoJSONのfeatureプロパティから都道府県IDを取得する
 * @param {object} properties - featureのpropertiesオブジェクト
 * @returns {string} 都道府県ID（小文字）
 */
function getPrefectureId(properties) {
    if (!properties) return null;

    // idフィールドがある場合
    if (properties.id) {
        return properties.id.toLowerCase();
    }

    // NAME_1フィールドがある場合（例: "Tokyo" -> "tokyo"）
    if (properties.NAME_1) {
        return properties.NAME_1.toLowerCase();
    }

    // nameフィールドがある場合
    if (properties.name) {
        return properties.name.toLowerCase();
    }

    return null;
}

async function initializeGame() {
    // --- Initialize SVG ---
    const container = document.getElementById('puzzle-container');
    width = container.clientWidth;
    height = container.clientHeight;
    svg = d3.select("#map-svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`);

    // --- Setup Projection ---
    // Center on Japan roughly
    projection = d3.geoMercator()
        .center([137, 38])
        .scale(width * 1.5) // Adjust scale based on width
        .translate([width / 2, height / 2]);

    gMap = svg.append("g").attr("id", "map-slots-layer"); // 背景スロット用
    gPieces = svg.append("g").attr("id", "pieces-layer");   // ドラッグするピース用

    // Zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", (e) => {
            gMap.attr("transform", e.transform);
            gPieces.attr("transform", e.transform);
        });
    svg.call(zoom);

    pathGenerator = d3.geoPath().projection(projection);

    // --- Load Data and Initialize Game ---
    try {
        const topology = await d3.json(TOPOJSON_URL);
        const geojson = topojson.feature(topology, topology.objects["JPN_adm1"]);
        mapFeatures = geojson.features;

        // デバッグ: 最初のfeatureの構造を確認
        console.log("mapFeatures[0]:", mapFeatures[0]);
        console.log("mapFeatures[0].properties:", mapFeatures[0].properties);

        renderMapSlots();
        setupRegionButtons();
        await createAllPieces();
        startRegion("all");
        updateStats();
    } catch (error) {
        console.error("地図データの読み込みに失敗しました:", error);
        alert("ちずデータの よみこみに しっぱいしました。");
    }

    // 最初のユーザー操作で音声を初期化
    document.body.addEventListener('click', initializeAudio, { once: true });
    document.body.addEventListener('touchstart', initializeAudio, { once: true });
    // Window resize handling
    window.addEventListener('resize', () => {
        width = container.clientWidth;
        height = container.clientHeight;
        svg.attr("width", width).attr("height", height);
    });
}

/**
 * 音声関連の初期化
 */
function initializeAudio() {
    const bgm = document.getElementById('bgm');
    if (bgm && bgm.paused) {
        bgm.play().catch(e => console.error("BGMの再生に失敗しました:", e));
    }
    if (typeof preloadAudioSources === 'function') {
        preloadAudioSources(SOUND_EFFECTS);
    }
}

function renderMapSlots() {
    gMap.selectAll("path.prefecture-slot")
        .data(mapFeatures)
        .enter()
        .append("path")
        .attr("class", "prefecture-slot")
        .attr("d", pathGenerator)
        .attr("id", d => `slot-${getPrefectureId(d.properties)}`)
        .attr("fill", "#eceff1")
        .attr("stroke", "#b0bec5")
        .attr("stroke-width", 1);
}

function setupRegionButtons() {
    // HTMLに存在するすべての地方ボタンにイベントリスナーを設定
    document.querySelectorAll('#region-selector .region-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#region-selector .region-btn').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            startRegion(e.target.dataset.region);
        });
    });
}

function startRegion(region) {
    currentRegion = region;

    // ピースのハイライト状態を更新
    gPieces.selectAll(".puzzle-piece.unplaced").each(function (d) {
        const piece = d3.select(this);
        const isTarget = (region === 'all' || d.properties.region === region);
        piece.classed("highlight", isTarget);
    });
}

async function createAllPieces() {
    const dragHandler = d3.drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded);

    // TopoJSONのfeatureから直接ピースを生成
    allPiecesData = PREFECTURES_DATA.map((pieceInfo) => {
        const feature = mapFeatures.find(f => {
            const featureId = getPrefectureId(f.properties);
            return featureId === pieceInfo.id.toLowerCase();
        });

        if (!feature) {
            console.warn(`TopoJSONデータに ${pieceInfo.id} (${pieceInfo.name}) が見つかりません。`);
            console.log('利用可能なプロパティ:', mapFeatures[0]?.properties);
            return null;
        }

        const spawnPoint = getRandomSpawnPoint(pieceInfo);

        return {
            properties: pieceInfo,
            feature: feature,
            color: REGIONS[pieceInfo.region]?.color || "#81d4fa",
            currentPos: spawnPoint,
            scale: 1
        };
    }).filter(p => p !== null);

    // ピースを作成
    gPieces.selectAll("g.puzzle-piece")
        .data(allPiecesData)
        .enter()
        .append("g")
        .attr("class", "puzzle-piece unplaced")
        .attr("id", d => `piece-${d.properties.id}`)
        .attr("data-name", d => d.properties.id)
        .each(function (d) {
            // TopoJSONのfeatureから直接パスを生成
            const pathElement = d3.select(this)
                .append("path")
                .attr("d", pathGenerator(d.feature))
                .attr("fill", d.color)
                .attr("stroke", "white")
                .attr("stroke-width", 2);

            // 初期位置に移動
            d3.select(this).attr('transform', `translate(${d.currentPos.x}, ${d.currentPos.y})`);
        })
        .call(dragHandler);
}

function getRandomSpawnPoint(pieceData) {
    const pieceWidth = pieceData.width || 100;
    const pieceHeight = pieceData.height || 100;
    const margin = 50;
    let x, y;

    const side = Math.floor(Math.random() * 4); // 0:上, 1:下, 2:左, 3:右

    switch (side) {
        case 0: // Top
            x = Math.random() * (width - pieceWidth);
            y = -margin - pieceHeight - Math.random() * 50;
            break;
        case 1: // Bottom
            x = Math.random() * (width - pieceWidth);
            y = height + margin + Math.random() * 50;
            break;
        case 2: // Left
            x = -margin - pieceWidth - Math.random() * 50;
            y = Math.random() * (height - pieceHeight);
            break;
        case 3: // Right
        default:
            x = width + margin + Math.random() * 50;
            y = Math.random() * (height - pieceHeight);
            break;
    }
    return { x: x, y: y };
}

// --- Drag Handlers ---
function dragStarted(event, d) {
    if (placedPieces.has(d.properties.id)) return;
    d3.select(this).raise().classed("dragging", true);
}

function dragged(event, d) {
    if (placedPieces.has(d.properties.id)) return;
    d.currentPos.x += event.dx;
    d.currentPos.y += event.dy;
    d3.select(this).attr("transform", `translate(${d.currentPos.x}, ${d.currentPos.y})`);
}

function dragEnded(event, d) {
    if (placedPieces.has(d.properties.id)) return;
    const pieceElement = d3.select(this);
    pieceElement.classed("dragging", false);

    // Check for snap
    const correctBbox = pathGenerator.bounds(d.feature);
    const correctX = correctBbox[0][0];
    const correctY = correctBbox[0][1];

    const dx = d.currentPos.x - correctX;
    const dy = d.currentPos.y - correctY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < SNAP_DISTANCE) {
        d.currentPos = { x: correctX, y: correctY };
        pieceElement.transition().duration(250)
            .attr("transform", `translate(${d.currentPos.x}, ${d.currentPos.y})`)
            .on("end", () => {
                snapToPlace(d, pieceElement.node());
            });
    }
}

/**
 * 紙吹雪アニメーションをトリガーする
 */
function triggerConfetti() {
    const duration = 3 * 1000; // 3秒間
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 1000 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // 画面の上部からランダムに発射
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

function snapToPlace(pieceData, pieceElement) {
    if (typeof playSE === 'function') {
        playSE('assets/sounds/snap.mp3');
    }

    const hiraganaName = PREF_MAP[pieceData.properties.id];
    if (hiraganaName && typeof playSE === 'function') {
        setTimeout(() => {
            playSE(`assets/sounds/hiragana/${hiraganaName}.mp3`);
        }, 300);
    }

    placedPieces.add(pieceData.properties.id);
    d3.select(pieceElement).classed("unplaced", false).classed("placed", true);

    // Fill the map slot
    const slotId = getPrefectureId(pieceData.feature.properties);
    d3.select(`#slot-${slotId}`)
        .transition().duration(300)
        .attr("fill", pieceData.color);

    updateStats();
    checkRegionCompletion(pieceData.properties.region);

    if (placedPieces.size === mapFeatures.length) {
        setTimeout(showWinModal, 500);
    }
}

function updateStats() {
    document.getElementById('remaining-count').textContent = mapFeatures.length - placedPieces.size;
}

/**
 * 特定の地方のすべてのピースが配置されたかチェックし、ボタンのスタイルを更新する
 * @param {string} regionId - チェックする地方のID
 */
function checkRegionCompletion(regionId) {
    if (regionId === 'all') return;

    const regionPrefs = mapFeatures.filter(p => p.properties.region === regionId);
    const isRegionComplete = regionPrefs.every(p => placedPieces.has(getPrefectureId(p.properties)));

    if (isRegionComplete) {
        const regionBtn = document.querySelector(`.region-btn[data-region="${regionId}"]`);
        if (regionBtn) {
            regionBtn.classList.add('completed');
        }
    }
}

function showWinModal() {
    const modal = document.getElementById('win-modal');
    modal.classList.remove('hidden');

    if (window.addPoints) {
        window.addPoints(10); // 10ポイント加算
    }

    if (typeof playSE === 'function') {
        playSE('assets/sounds/fanfare.mp3');
    }

    triggerConfetti();

    document.getElementById('play-again-btn').addEventListener('click', () => {
        location.reload();
    });

    document.getElementById('close-modal-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}
