document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const videoPlayer = document.getElementById('video-player');
    const movieTitle = document.getElementById('movie-title');
    const movieSelector = document.getElementById('movie-selector');
    const bgm = document.getElementById('bgm');

    // --- State ---
    let bgmInitialized = false;
    let currentMovieIndex = 0; // 現在再生中の動画のインデックスを追跡

    // --- Movie Data ---
    const MOVIES = [
        {
            id: 'oyasumi',
            title: 'おやすみソング',
            src: 'assets/movies/おやすみソング.mp4'
        },
        {
            id: 'ofuro',
            title: 'おふろソング',
            src: 'assets/movies/お風呂ソング.mp4'
        },
        {
            id: 'hamigaki',
            title: 'はみがきソング',
            src: 'assets/movies/歯磨きソング.mp4'
        },
        {
            id: 'ippai-tabeyou',
            title: 'いっぱいたべようソング',
            src: 'assets/movies/いっぱいたべようソング.mp4'
        }
    ];

    /**
     * ユーザーの最初の操作でBGMを再生する関数
     */
    function initializeBgm() {
        if (bgmInitialized || !bgm) return;
        bgm.play().catch(error => console.log('BGMの再生にはユーザーの操作が必要です。', error));
        bgmInitialized = true;
    }

    /**
     * 動画の指定された時間からサムネイルを生成する (Data URL形式)
     * @param {string} videoSrc 動画ファイルのパス
     * @returns {Promise<string>} サムネイルのData URLを解決するPromise
     */
    function generateThumbnail(videoSrc) {
         return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            let resolved = false; // 複数回resolve/rejectが呼ばれるのを防ぐフラグ

            // スマホでの動作を安定させるための属性
            video.playsinline = true;
            video.muted = true;
            video.preload = 'metadata'; // メタデータのプリロードを推奨
            video.src = videoSrc;

            const cleanup = () => {
                video.removeEventListener('loadeddata', onDataLoaded);
                video.removeEventListener('seeked', onSeeked);
                video.removeEventListener('error', onError);
                clearTimeout(timeoutId);
            };

            const doResolve = (dataUrl) => {
                if (resolved) return;
                resolved = true;
                cleanup();
                resolve(dataUrl);
            };

            const doReject = (reason) => {
                if (resolved) return;
                resolved = true;
                cleanup();
                reject(reason);
            };

            const onSeeked = () => {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                doResolve(canvas.toDataURL('image/jpeg'));
            };

            const onDataLoaded = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                video.currentTime = 1.0; // 1秒時点に移動
            };

            const onError = (e) => {
                console.error('サムネイル生成のための動画読み込みエラー:', videoSrc, e);
                doReject('サムネイル生成エラー');
            };

            // タイムアウト処理 (5秒で失敗とみなす)
            const timeoutId = setTimeout(() => {
                doReject('サムネイル生成がタイムアウトしました');
            }, 5000);

            video.addEventListener('loadeddata', onDataLoaded);
            video.addEventListener('seeked', onSeeked);
            video.addEventListener('error', onError);

            // iOS Safariなどでは、load()を呼ばないとイベントが発火しないことがある
            video.load();
        });
    }

    /**
     * インデックスを指定して動画を選択し、再生する
     * @param {number} index - 再生する動画のMOVIES配列におけるインデックス
     * @param {boolean} [autoPlay=true] - trueの場合、自動的に再生を開始する
     */
    function selectMovieByIndex(index, autoPlay = true) {
        // インデックスが範囲外なら何もしない
        if (index < 0 || index >= MOVIES.length) {
            console.error('無効な動画インデックスです:', index);
            return;
        }

        currentMovieIndex = index;
        const movieData = MOVIES[currentMovieIndex];

        // BGMが再生中なら停止する
        if (bgm && !bgm.paused) {
            bgm.pause();
        }

        videoPlayer.src = movieData.src;
        videoPlayer.load();
        if (autoPlay) {
            const playPromise = videoPlayer.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('動画の自動再生に失敗しました:', error);
                });
            }
        }
        movieTitle.textContent = movieData.title;

        // 選択されたボタンのスタイルを更新
        document.querySelectorAll('.movie-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.movieId === movieData.id);
        });
    }

    /**
     * 動画選択ボタンを生成する
     */
    async function createMovieButtons() {
        movieSelector.innerHTML = ''; // コンテナをクリア

        for (const [index, movie] of MOVIES.entries()) {
            const button = document.createElement('button');
            button.classList.add('movie-btn');
            button.dataset.movieId = movie.id;

            // サムネイル生成中はプレースホルダーを表示
            button.innerHTML = `
                <div class="thumbnail-placeholder"></div>
                <p>${movie.title}</p>`;
            movieSelector.appendChild(button);

            try {
                // サムネイルを非同期で生成
                const thumbnailSrc = await generateThumbnail(movie.src);
                button.innerHTML = `
                    <img src="${thumbnailSrc}" alt="${movie.title}">
                    <p>${movie.title}</p>
                `;
            } catch (error) {
                console.error(`サムネイル生成失敗: ${movie.src}`, error);
                // エラーの場合はプレースホルダーのままにする
            }

            button.addEventListener('click', () => {
                initializeBgm();
                selectMovieByIndex(index);
            });
        }
    }

    /**
     * 初期化処理
     */
    async function initialize() {
        // ボタンとサムネイルの生成を待つ
        await createMovieButtons();

        // 最初の動画をデフォルトで設定（再生はしない）
        if (MOVIES.length > 0) {
            selectMovieByIndex(0, false); // 最初の動画をロードするが再生はしない
        }

        // 動画が終了したら次の動画を再生する
        videoPlayer.addEventListener('ended', () => {
            // 次の動画のインデックスを計算（リストの最後に達したら最初に戻る）
            const nextIndex = (currentMovieIndex + 1) % MOVIES.length;
            selectMovieByIndex(nextIndex);
        });
    }

    initialize();
});