// settings.js

const DEBUG_INFINITE_STARS = false; // デバッグ用に星を無限にする場合は true に設定

// --- ポイント管理機能 ---
// このセクションの関数は、他のJSファイルからグローバルに呼び出せるように、
// DOMContentLoadedの外側で定義します。

/**
 * ポイントが追加されたときにカスタムイベントを発行します。
 * これにより、異なるページでもポイント表示をリアルタイムに更新できます。
 * @param {number} points - 更新後のポイント数
 */
function dispatchPointsUpdateEvent(points) {
    const event = new CustomEvent('pointsUpdated', { detail: { points } });
    window.dispatchEvent(event);
}

/**
 * 現在のポイント数（星の数）をlocalStorageから取得します。
 * @returns {number} 現在のポイント数
 */
function getPoints() {
    if (DEBUG_INFINITE_STARS) {
        return 999; // デバッグ中は常に999個の星を返す
    }
    return parseInt(localStorage.getItem('userPoints') || '0', 10);
}

/**
 * 指定された量のポイントを追加し、保存します。
 * @param {number} amount - 追加するポイント数
 * @returns {number} 追加後の合計ポイント数
 */
function addPoints(amount) {
    if (DEBUG_INFINITE_STARS) {
        // デバッグ中はポイントは増えないが、UI更新のためにイベントを発行
        dispatchPointsUpdateEvent(getPoints());
        return getPoints();
    }
    const currentPoints = getPoints();
    const newPoints = currentPoints + amount;
    localStorage.setItem('userPoints', newPoints);
    dispatchPointsUpdateEvent(newPoints); // ポイント更新イベントを発行
    return newPoints;
}

/**
 * 指定された量のポイントを消費し、保存します。
 * ポイントが足りない場合はfalseを返します。
 * @param {number} amount - 消費するポイント数
 * @returns {boolean} ポイントの消費に成功した場合はtrue, 失敗した場合はfalse
 */
function spendPoints(amount) {
    if (DEBUG_INFINITE_STARS) {
        // デバッグ中はポイントは消費せず、常に成功したことにする
        dispatchPointsUpdateEvent(getPoints());
        return true;
    }
    const currentPoints = getPoints();
    if (currentPoints < amount) {
        return false; // ポイントが足りない
    }
    const newPoints = currentPoints - amount;
    localStorage.setItem('userPoints', newPoints);
    dispatchPointsUpdateEvent(newPoints); // ポイント更新イベントを発行
    return true;
}

// --- Web Audio API セットアップ ---
let audioContext;
let seGainNode; // 効果音用のマスターボリューム
let bgmGainNode; // BGM用のマスターボリューム
let bgmSourceNode; // BGMのソースノード (一度しか作成できないため追跡)
const audioBuffers = new Map(); // デコード済み音声データをキャッシュする場所

/**
 * ユーザーの最初の操作でWeb Audio APIを初期化する関数
 */
function initializeWebAudio() {
    if (audioContext) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // --- SE Setup ---
        seGainNode = audioContext.createGain();
        seGainNode.connect(audioContext.destination);
        const seVolume = localStorage.getItem('seVolume') || 0.7;
        seGainNode.gain.value = parseFloat(seVolume);

        // --- BGM Setup ---
        const bgmElement = document.getElementById('bgm');
        // bgmSourceNodeが未作成の場合のみ、ソースとゲインノードを作成
        if (bgmElement && !bgmSourceNode) {
            bgmSourceNode = audioContext.createMediaElementSource(bgmElement);
            bgmGainNode = audioContext.createGain();
            
            // オーディオグラフを接続: BGM要素 -> BGMゲイン -> スピーカー
            bgmSourceNode.connect(bgmGainNode);
            bgmGainNode.connect(audioContext.destination);

            // localStorageから初期音量を読み込んで設定
            const bgmVolume = localStorage.getItem('bgmVolume') || 0.15;
            bgmGainNode.gain.value = parseFloat(bgmVolume);
        }

        console.log('Web Audio APIが正常に初期化されました。');
    } catch (e) {
        console.error('Web Audio APIはこのブラウザではサポートされていません。', e);
    }
}

/**
 * 効果音（SE）を再生するためのグローバル関数。
 * Web Audio APIを使用して、安定性とパフォーマンスを向上させます。
 * @param {string} src - 再生する音声ファイルのパス
 * @returns {Promise<void>} 再生が完了または失敗したときに解決されるPromise
 */
async function playSE(src) {
    return new Promise(async (resolve) => {
        // AudioContextが未初期化の場合、ここで初期化を試みる
        // これにより、どのタイミングで呼ばれても安全に音を再生できる
        // (この関数はユーザーのクリックイベントから呼ばれることが前提)
        if (!audioContext && typeof initializeWebAudio === 'function') {
            initializeWebAudio();
        }

        // AudioContextが準備できていない、またはsrcが指定されていない場合は何もしない
        if (!audioContext || !src) {
            resolve();
            return;
        }
        // iOSなどでユーザー操作前に停止させられている場合、再生を試みる前に再開させる
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        let buffer;
        // 1. キャッシュを確認
        if (audioBuffers.has(src)) {
            buffer = audioBuffers.get(src);
        } else {
            // 2. キャッシュになければ、音声ファイルを読み込んでデコードする
            try {
                const response = await fetch(src);
                const arrayBuffer = await response.arrayBuffer();
                buffer = await audioContext.decodeAudioData(arrayBuffer);
                audioBuffers.set(src, buffer); // 3. デコード結果をキャッシュに保存
            } catch (e) {
                console.error(`音声データのデコードエラー: ${src}`, e);
                resolve(); // エラーでも次に進む
                return;
            }
        }

        // 4. 音声ソースを作成して再生
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        // 作成したGainNode（音量調整役）に接続
        source.connect(seGainNode);
        // 再生が終了したらPromiseを解決する
        source.onended = () => {
            resolve();
        };
        source.start(0);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  // --- BGM Element Creation ---
  // すべてのページでBGMが利用できるように、<audio>要素を動的に生成する
  // これにより、各ゲームのJSファイルでgetElementById('bgm')が常に成功するようになる
  if (!document.getElementById('bgm')) {
    const bgmAudio = document.createElement('audio');
    bgmAudio.id = 'bgm';
    bgmAudio.src = 'assets/sounds/bgm5.mp3'; // BGMのソースをここで指定
    bgmAudio.loop = true;
    document.body.appendChild(bgmAudio);
  }

  // --- ポイント表示機能 ---
  // ポイントカウンターを動的に生成してbodyに追加
  const pointsCounter = document.createElement('div');
  pointsCounter.id = 'points-counter';
  document.body.appendChild(pointsCounter);

  /**
   * ポイント表示を更新する関数
   * @param {number} points - 表示するポイント数
   */
  function updatePointsDisplay(points) {
      pointsCounter.textContent = points;
      // ポイントが追加されたときにアニメーションクラスを追加
      pointsCounter.classList.add('points-added');
      // アニメーションが終わったらクラスを削除
      setTimeout(() => {
          pointsCounter.classList.remove('points-added');
      }, 500);
  }

  // ポイント更新イベントをリッスン
  window.addEventListener('pointsUpdated', (e) => {
      updatePointsDisplay(e.detail.points);
  });

  // --- DOM Element Creation ---
  // Create settings button
  const settingsBtn = document.createElement('button');
  settingsBtn.id = 'settings-btn';
  settingsBtn.innerHTML = '⚙️'; // Gear emoji
  document.body.appendChild(settingsBtn);

  // Create settings modal
  const modalHTML = `
    <div id="settings-modal" class="hidden">
      <div class="settings-content">
        <h2>おんりょう せってい</h2>
        <div class="points-display-modal">
            いまのほし: <span id="modal-points-count">0</span> ★
        </div>
        <div class="volume-control">
          <label for="bgm-volume">BGM (おんがく)</label>
          <input type="range" id="bgm-volume" min="0" max="1" step="0.1">
        </div>
        <div class="volume-control">
          <label for="se-volume">こうかおん (SE)</label>
          <input type="range" id="se-volume" min="0" max="1" step="0.1">
        </div>
        <div class="settings-buttons">
          <a href="index.html" id="back-to-menu-link" class="button-style">えらぶがめんへ</a>
          <button id="close-settings-btn">もどる</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // --- DOM Element References ---
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const backToMenuLink = document.getElementById('back-to-menu-link');
  const bgmVolumeSlider = document.getElementById('bgm-volume');
  const seVolumeSlider = document.getElementById('se-volume');
  const bgmVolumeLabel = document.querySelector('label[for="bgm-volume"]');
  const seVolumeLabel = document.querySelector('label[for="se-volume"]');
  const modalPointsCount = document.getElementById('modal-points-count');

  // --- Functions ---

  /**
   * Applies volume settings to all relevant audio elements on the page.
   * @param {number} bgmVolume - BGM volume (0.0 to 1.0)
   * @param {number} seVolume - Sound Effect volume (0.0 to 1.0)
   */
  function applyVolumeSettings(bgmVolume, seVolume) {
    // --- BGM Volume ---
    if (bgmGainNode) {
        // Web Audio APIが有効な場合、GainNodeで音量を制御
        bgmGainNode.gain.value = bgmVolume;
    } else {
        // まだ有効でない場合（ユーザー操作前）、<audio>要素の音量を直接制御
        const bgmElement = document.getElementById('bgm');
        if (bgmElement) {
            bgmElement.volume = bgmVolume;
        }
    }

    // --- Video Volume (Web Audio APIの対象外なので、常に直接制御) ---
    document.querySelectorAll('video').forEach(video => {
        video.volume = bgmVolume;
    });

    // --- SE Volume (Web Audio API) ---
    if (seGainNode) {
        seGainNode.gain.value = seVolume;
    }
  }

  /**
   * Loads volume settings from localStorage and applies them.
   */
  function loadAndApplySettings() {
    // Get stored values, or use defaults (BGM: 0.3, SE: 0.5)
    const bgmVolume = localStorage.getItem('bgmVolume') || 0.15;
    const seVolume = localStorage.getItem('seVolume') || 0.7;

    bgmVolumeSlider.value = bgmVolume;
    seVolumeSlider.value = seVolume;

    // スライダーの横に現在の音量をパーセント表示する
    if (bgmVolumeLabel) {
        bgmVolumeLabel.textContent = `BGM (おんがく): ${Math.round(bgmVolume * 100)}%`;
    }
    if (seVolumeLabel) {
        seVolumeLabel.textContent = `こうかおん (SE): ${Math.round(seVolume * 100)}%`;
    }

    applyVolumeSettings(parseFloat(bgmVolume), parseFloat(seVolume));

    // ポイント表示も初期化
    const currentPoints = getPoints();
    updatePointsDisplay(currentPoints);
    if(modalPointsCount) modalPointsCount.textContent = currentPoints;
  }

  // --- Event Listeners ---

  // ユーザーによる最初の操作でWeb Audio APIを初期化する
  document.body.addEventListener('click', initializeWebAudio, { once: true });
  document.body.addEventListener('touchstart', initializeWebAudio, { once: true });

  /**
   * モーダルを閉じる際の共通処理
   */
  const handleClose = () => {
    settingsModal.classList.add('hidden');
    // モーダルを閉じる際に、最終的な音量設定を再適用して確実にする
    const bgmVolume = bgmVolumeSlider.value;
    const seVolume = seVolumeSlider.value;
    applyVolumeSettings(parseFloat(bgmVolume), parseFloat(seVolume));

    // 動的に追加したスタイルシートを削除する
    const tempStyle = document.getElementById('temp-buttons-css');
    if (tempStyle) {
      tempStyle.remove();
    }
  };

  settingsBtn.addEventListener('click', () => {
      modalPointsCount.textContent = getPoints(); // モーダルを開くたびにポイントを更新

      // buttons.cssを動的に読み込む（すでに追加されていなければ）
      if (!document.getElementById('temp-buttons-css')) {
        const link = document.createElement('link');
        link.id = 'temp-buttons-css';
        link.rel = 'stylesheet';
        link.href = 'buttons.css';
        document.head.appendChild(link);
      }

      // 現在のページがホーム画面 (index.html) かどうかをチェック
      const path = window.location.pathname;
      // ローカルファイルでの閲覧とサーバーでの閲覧の両方に対応
      const isHomePage = path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('/HTML/幼児向け学習アプリ/');

      // ホーム画面なら「えらぶがめんへ」ボタンを隠し、そうでなければ表示する
      backToMenuLink.style.display = isHomePage ? 'none' : 'inline-block';

      settingsModal.classList.remove('hidden');
  });
  closeSettingsBtn.addEventListener('click', handleClose);
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      handleClose();
    }
  });

  bgmVolumeSlider.addEventListener('change', (e) => {
    const newVolume = e.target.value;
    if (bgmVolumeLabel) {
        bgmVolumeLabel.textContent = `BGM (おんがく): ${Math.round(newVolume * 100)}%`;
    }
    localStorage.setItem('bgmVolume', newVolume);
    applyVolumeSettings(parseFloat(newVolume), parseFloat(seVolumeSlider.value));
  });

  seVolumeSlider.addEventListener('change', (e) => {
    const newVolume = e.target.value;
    if (seVolumeLabel) {
        seVolumeLabel.textContent = `こうかおん (SE): ${Math.round(newVolume * 100)}%`;
    }
    localStorage.setItem('seVolume', newVolume);
    applyVolumeSettings(parseFloat(bgmVolumeSlider.value), parseFloat(newVolume));
    // 設定が反映されたか確認するために、テスト音を再生します
    playSE('assets/sounds/seikai.mp3');
  });

  // --- Initialization ---
  loadAndApplySettings();
});