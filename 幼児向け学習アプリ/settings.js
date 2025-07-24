// settings.js
document.addEventListener('DOMContentLoaded', () => {
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
        <div class="volume-control">
          <label for="bgm-volume">BGM (おんがく)</label>
          <input type="range" id="bgm-volume" min="0" max="1" step="0.1">
        </div>
        <div class="volume-control">
          <label for="se-volume">こうかおん (SE)</label>
          <input type="range" id="se-volume" min="0" max="1" step="0.1">
        </div>
        <button id="close-settings-btn">とじる</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // --- DOM Element References ---
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const bgmVolumeSlider = document.getElementById('bgm-volume');
  const seVolumeSlider = document.getElementById('se-volume');

  // --- Functions ---

  /**
   * Applies volume settings to all relevant audio elements on the page.
   * @param {number} bgmVolume - BGM volume (0.0 to 1.0)
   * @param {number} seVolume - Sound Effect volume (0.0 to 1.0)
   */
  function applyVolumeSettings(bgmVolume, seVolume) {
    const allAudioElements = document.querySelectorAll('audio');

    allAudioElements.forEach(audio => {
      // BGM elements usually have 'bgm' in their ID or the 'loop' attribute
      if (audio.id.includes('bgm') || audio.loop) {
        audio.volume = bgmVolume;
      } else {
        // Assume others are sound effects
        audio.volume = seVolume;
      }
    });
  }

  /**
   * Loads volume settings from localStorage and applies them.
   */
  function loadAndApplySettings() {
    // Get stored values, or use defaults (BGM: 0.3, SE: 0.5)
    const bgmVolume = localStorage.getItem('bgmVolume') || 0.3;
    const seVolume = localStorage.getItem('seVolume') || 0.5;

    bgmVolumeSlider.value = bgmVolume;
    seVolumeSlider.value = seVolume;

    applyVolumeSettings(parseFloat(bgmVolume), parseFloat(seVolume));
  }

  // --- Event Listeners ---

  settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
  closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });

  bgmVolumeSlider.addEventListener('input', (e) => {
    const newVolume = e.target.value;
    localStorage.setItem('bgmVolume', newVolume);
    applyVolumeSettings(parseFloat(newVolume), parseFloat(seVolumeSlider.value));
  });

  seVolumeSlider.addEventListener('input', (e) => {
    const newVolume = e.target.value;
    localStorage.setItem('seVolume', newVolume);
    applyVolumeSettings(parseFloat(bgmVolumeSlider.value), parseFloat(newVolume));
  });

  // --- Initialization ---
  loadAndApplySettings();
});