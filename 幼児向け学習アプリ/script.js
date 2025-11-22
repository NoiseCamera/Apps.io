// DOMの読み込みが完了したら処理を開始
document.addEventListener('DOMContentLoaded', () => {
    // ダブルタップによるズームを防止
    document.body.style.touchAction = 'manipulation';

    // HTML要素の取得
    const num1Elem = document.getElementById('num1');
    const operatorElem = document.getElementById('operator');
    const num2Elem = document.getElementById('num2');
    const answerInput = document.getElementById('answer-input');
    const checkBtn = document.getElementById('check-btn');
    const clearBtn = document.getElementById('clear-btn'); // けすボタン
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const nextBtn = document.getElementById('next-btn');
    const feedbackElem = document.getElementById('feedback');
    const interactiveElements = document.querySelectorAll('button, input'); // 操作可能な要素を全て
    const leftItemsContainer = document.getElementById('left-items');
    const rightItemsContainer = document.getElementById('right-items');
    const hintBtn = document.getElementById('hint-btn');
    const numberButtons = document.querySelectorAll('.number-btn');
    const carryToggle = document.getElementById('carry-toggle'); // ★ 繰り上がりトグルスイッチ
    const calculationLayout = document.querySelector('.calculation-layout'); // あおむしコンテナの親

    // このゲームで使う効果音のリスト
    const SOUND_EFFECTS = [
        'assets/sounds/seikai.mp3',
        'assets/sounds/incorrect.mp3',
        'assets/sounds/attention.mp3',
        'assets/sounds/eat.mp3',
        'assets/sounds/gather.mp3',
        'assets/sounds/transform.mp3',
        'assets/sounds/appear.mp3',
        // 数字の音もプリロード
        'assets/sounds/kazu/0.mp3', 'assets/sounds/kazu/1.mp3', 'assets/sounds/kazu/2.mp3',
        'assets/sounds/kazu/3.mp3', 'assets/sounds/kazu/4.mp3', 'assets/sounds/kazu/5.mp3', 'assets/sounds/kazu/6.mp3',
        'assets/sounds/kazu/7.mp3', 'assets/sounds/kazu/8.mp3', 'assets/sounds/kazu/9.mp3', 'assets/sounds/kazu/10.mp3',
        // 100以上の位の音も追加
        'assets/sounds/kazu/100.mp3', 'assets/sounds/kazu/300.mp3', 'assets/sounds/kazu/600.mp3', 'assets/sounds/kazu/800.mp3'
    ];

    // 現在の問題の状態をまとめて管理するオブジェクト
    let currentProblem = {};
    let currentAnswerString = ''; // 現在の答えを文字列で保持
    let audioInitialized = false; // 音声再生の準備ができたか
    let currentMode = 'mixed'; // 'mixed', 'addition', 'subtraction'
    let currentDifficulty = 'mixed'; // 'mixed', '1', '2', '3'
    let isCarryEnabled = false; // ★ 繰り上がり・繰り下がりが有効か
    let aomusiContainer; // あおむしのコンテナを保持する変数

    // ユーザーの最初の操作で音声再生の準備をする関数
    function initializeAudio() {
        if (audioInitialized) return;
        // BGM要素を取得して再生を試みる
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.play().catch(e => console.error("BGMの自動再生がブロックされました。", e));
        }

        if (typeof preloadAudioSources === 'function') {
            preloadAudioSources(SOUND_EFFECTS);
        }

        audioInitialized = true;
        console.log('音声の準備ができました。');
    }

    /**
     * 指定された難易度に基づいてランダムな数値を生成する
     * @param {string} difficulty - '1', '2', '3', or 'mixed'
     * @returns {number} 生成された数値
     */
    function generateRandomNumber(difficulty) {
        let digits;
        if (difficulty === 'mixed') {
            // 繰り上がりモードがONの時は、2桁以上を優先的に生成
            if (isCarryEnabled && Math.random() < 0.8) {
                digits = Math.floor(Math.random() * 2) + 2; // 2 or 3
            } else {
                digits = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
            }
        } else {
            digits = parseInt(difficulty, 10);
        }

        if (digits === 1) {
            return Math.floor(Math.random() * 9) + 1; // 1-9
        } else {
            const min = Math.pow(10, digits - 1);
            const max = Math.pow(10, digits) - 1;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    }
    /**
     * 繰り上がり・繰り下がりがないかチェックする関数
     * @param {number} n1 - 1つ目の数値
     * @param {number} n2 - 2つ目の数値
     * @param {boolean} isAddition - 足し算の場合はtrue
     * @returns {boolean} - 繰り上がり・繰り下がりがある場合はtrue
     */
    function hasCarryOrBorrow(n1, n2, isAddition) {
        // 文字列に変換し、桁数を3桁に揃える
        const s1 = String(n1).padStart(3, '0');
        const s2 = String(n2).padStart(3, '0');

        for (let i = 2; i >= 0; i--) { // 一の位からチェック
            const d1 = parseInt(s1[i]);
            const d2 = parseInt(s2[i]);
            if (isAddition) {
                if (d1 + d2 >= 10) return true; // 繰り上がり
            } else {
                // 繰り下がりがあるかどうかのより正確なチェック
                let tempS1 = String(n1).split('').map(Number);
                let tempS2 = String(n2).padStart(tempS1.length, '0').split('').map(Number);

                for (let j = tempS1.length - 1; j >= 0; j--) {
                    if (tempS1[j] < tempS2[j]) {
                        // 繰り下がりが発生
                        if (j === 0) return true; // 最上位の桁で借りる必要がある場合
                        // 上の桁から借りるシミュレーション
                        let k = j - 1;
                        while (k >= 0 && tempS1[k] === 0) k--; // 0が続く場合はさらに上の桁から探す
                        if (k < 0) return true; // 借りる元がない（実際にはn1>=n2なので発生しないはず）
                        return true; // 繰り下がりが必要
                    }
                }
            }
        }
        return false;
    }

    /**
     * 数字を桁ごとに色分けして表示する関数
     * @param {HTMLElement} element - 表示先の親要素 (e.g., num1Elem)
     * @param {number} number - 表示する数値
     */
    function displayColoredNumber(element, number) {
        element.innerHTML = ''; // 中身を一度クリア

        const numberStr = String(number);
        // 最大3桁として、桁が足りない分は'0'で埋める
        const paddedStr = numberStr.padStart(3, '0');
        const colorClasses = ['digit-hundreds', 'digit-tens', 'digit-ones'];

        for (let i = 0; i < paddedStr.length; i++) {
            const digitSpan = document.createElement('span');
            digitSpan.textContent = paddedStr[i];
            digitSpan.classList.add(colorClasses[i]);

            // 先頭の余分な'0'は非表示にするためのクラスを追加
            if (i < 3 - numberStr.length) {
                digitSpan.classList.add('digit-zero');
            }
            element.appendChild(digitSpan);
        }
    }

    /**
     * 指定された数値と最大の桁数に基づいて、桁ごとの表示要素（DOM）を生成する
     * @param {number} number - 表示する数値
     * @param {number} maxDigits - 表示する最大の桁数 (1, 2, or 3)
     * @returns {HTMLElement[]} 生成された桁グループ要素の配列
     */
    function createDigitGroups(number, maxDigits) {
        const elements = [];
        const placeNames = ['hundreds', 'tens', 'ones'];
        const placeValues = [100, 10, 1];

        // 3桁からmaxDigitsに合わせて開始インデックスを調整
        const startIndex = 3 - maxDigits;

        for (let i = startIndex; i < 3; i++) {
            const placeName = placeNames[i];
            const placeValue = placeValues[i];

            // この桁の数字を計算
            const digit = Math.floor((number % (placeValue * 10)) / placeValue);

            const groupContainer = document.createElement('div');
            groupContainer.classList.add('digit-group', placeName);

            const digitLabel = document.createElement('div');
            digitLabel.classList.add('digit-label');
            digitLabel.textContent = digit;
            groupContainer.appendChild(digitLabel);

            const itemsWrapper = document.createElement('div');
            itemsWrapper.classList.add('digit-items');
            for (let j = 0; j < digit; j++) {
                const imgWrapper = document.createElement('div');
                imgWrapper.classList.add('item-img-wrapper');
                const img = document.createElement('img');
                img.src = 'assets/images/ringo.png';
                img.alt = 'りんご';
                img.classList.add('item-img');
                imgWrapper.appendChild(img);
                itemsWrapper.appendChild(imgWrapper);
            }
            groupContainer.appendChild(itemsWrapper);
            elements.push(groupContainer);
        }
        return elements;
    }

    /**
     * あおむしを表示するための桁ごとの表示要素（DOM）を生成する
     * @param {number} number - 表示する数値
     * @param {number} maxDigits - 表示する最大の桁数
     * @returns {HTMLElement[]} 生成された桁グループ要素の配列
     */
    function createAomusiGroups(number, maxDigits) { // ★関数名を createAomusiGroups に変更
        const elements = [];
        const placeNames = ['hundreds', 'tens', 'ones'];
        const placeValues = [100, 10, 1];
        const startIndex = 3 - maxDigits;

        for (let i = startIndex; i < 3; i++) {
            const placeName = placeNames[i];
            const placeValue = placeValues[i];
            const digit = Math.floor((number % (placeValue * 10)) / placeValue);

            const groupContainer = document.createElement('div');
            groupContainer.classList.add('digit-group', placeName);

            const digitLabel = document.createElement('div');
            digitLabel.classList.add('digit-label');
            digitLabel.textContent = digit;
            groupContainer.appendChild(digitLabel);

            const itemsWrapper = document.createElement('div');
            itemsWrapper.classList.add('digit-items');
            for (let j = 0; j < digit; j++) {
                const imgWrapper = document.createElement('div');
                imgWrapper.classList.add('item-img-wrapper');
                const aomusiImg = document.createElement('img');
                aomusiImg.src = 'assets/images/aomusi.png';
                aomusiImg.alt = 'あおむし';
                aomusiImg.classList.add('item-img', 'aomusi-item');
                imgWrapper.appendChild(aomusiImg);
                itemsWrapper.appendChild(imgWrapper);
            }
            groupContainer.appendChild(itemsWrapper);
            elements.push(groupContainer);
        }
        return elements;
    }
    /**
     * 計算を視覚的に表現するためのアイテム（リンゴ）を表示する
     * @param {HTMLElement} container - アイテムを表示するコンテナ要素
     * @param {number} totalNumber - 表示するアイテムの合計数
     * @param {number} maxDigits - 表示する最大の桁数
     */
    function displayVisualItems(container, totalNumber, maxDigits) {
        container.innerHTML = ''; // 中身をクリア
        let groups;
        if (container === rightItemsContainer && currentProblem.operator === '-') {
            groups = createAomusiGroups(totalNumber, maxDigits);
        } else {
            // 0の場合でも、桁のプレースホルダーは表示する
            groups = createDigitGroups(totalNumber, maxDigits);
        }
        groups.forEach(group => container.appendChild(group));
    }

    /**
     * 答えの入力欄を初期状態（「こたえ」）に戻す
     */
    function resetAnswerInput() {
        currentAnswerString = '';
        answerInput.textContent = 'こたえ';
        answerInput.classList.add('is-placeholder');
    }

    /**
     * 指定されたミリ秒だけ処理を待機する
     * @param {number} ms - 待機する時間（ミリ秒）
     * @returns {Promise<void>}
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 右側のアイテムを左側に移動させるアニメーション
     * @param {HTMLElement} rightItemsWrapper - 右側のアイテムコンテナ
     * @param {HTMLElement} leftItemsWrapper - 左側のアイテムコンテナ
     */
    async function animateRightToLeftTransfer(rightItemsWrapper, leftItemsWrapper, rightDigitLabel, leftDigitLabel) {
        const itemsToMove = Array.from(rightItemsWrapper.querySelectorAll('.item-img-wrapper'));
        for (const item of itemsToMove) {
            await moveItem(item, leftItemsWrapper);
            if (rightDigitLabel) rightDigitLabel.textContent = parseInt(rightDigitLabel.textContent) - 1;
            if (leftDigitLabel) leftDigitLabel.textContent = parseInt(leftDigitLabel.textContent) + 1;

            await sleep(50); // アイテム間の移動ディレイ
        }
    }

    /**
     * 新しい問題を作成して表示する関数
     */
    function generateProblem() {
        // 問題生成の最初に、フィードバックと答えの入力欄をリセットする
        feedbackElem.textContent = '';
        feedbackElem.className = '';
        resetAnswerInput();

        let num1, num2;
        let isAddition; // 足し算かどうかのフラグ
        let attempts = 0; // 無限ループを避けるためのカウンター

        // 現在のモードに応じて、足し算か引き算かを決定
        if (currentMode === 'addition') {
            isAddition = true;
        } else if (currentMode === 'subtraction') {
            isAddition = false;
        } else { // 'mixed' モードの場合
            isAddition = Math.random() < 0.5;
        }

        // ★ 修正: 条件に合致するまで問題を生成し続けるため、無限ループとbreak文の構成に変更
        while (true) {
            let difficultyForGen = currentDifficulty;
            if (isCarryEnabled && difficultyForGen === '1') {
                difficultyForGen = '2';
            }
            
            num1 = generateRandomNumber(difficultyForGen);
            num2 = generateRandomNumber(difficultyForGen);

            // 引き算で num1 < num2 になるのを防ぐため、単純に入れ替える
            if (!isAddition && num1 < num2) {
                [num1, num2] = [num2, num1];
            }

            // ★ 追加: 足し算において、右の数字の桁数が左より大きい場合、数字を入れ替える
            if (isAddition && String(num2).length > String(num1).length) {
                [num1, num2] = [num2, num1];
            }

            // ★ 修正: 足し算の答えが999を超える場合（4桁以上になる場合）は問題を作り直す
            if (isAddition && num1 + num2 > 999) {
                continue;
            }

            // 引き算で答えが0にならないように、同数の場合は再生成する
            if (!isAddition && num1 === num2) {
                continue;
            }
            
            // 1桁同士の計算では繰り上がり/繰り下がりは発生しないのでループ条件から除外
            if (num1 < 10 && num2 < 10) {
                if (isCarryEnabled && isAddition && num1 + num2 < 10) continue; // 繰り上がり必須なのに発生しない
                break;
            }

            // isCarryEnabled を使って条件を判定
            const needsCarry = isCarryEnabled;
            const hasCarry = hasCarryOrBorrow(num1, num2, isAddition);

            // 条件が一致すればループを抜ける (例: 繰り上がり必須で、実際に繰り上がりがある)
            if (needsCarry === hasCarry) {
                break;
            }
        }

        // 現在の問題をオブジェクトとして保存
        currentProblem = {
            num1,
            num2,
            operator: isAddition ? '+' : '-',
            answer: isAddition ? num1 + num2 : num1 - num2
        };

        // 問題の数字と演算子を表示
        displayColoredNumber(num1Elem, num1);
        displayColoredNumber(num2Elem, num2);
        operatorElem.textContent = currentProblem.operator;

        // --- 視覚的なアイテム表示を更新 ---
        const maxDigits = Math.max(String(num1).length, String(num2).length, String(currentProblem.answer).length);

        displayVisualItems(leftItemsContainer, currentProblem.num1, maxDigits);
        displayVisualItems(rightItemsContainer, currentProblem.num2, maxDigits);

        // ヒントボタンを有効化
        if (hintBtn) {
            hintBtn.disabled = false;
        }

    }

    /**
     * ヒントボタンが押されたときに桁ごとにアニメーションを実行する関数
     */
    async function handleHintAnimation() {
        if (!leftItemsContainer || !rightItemsContainer || !hintBtn) {
            console.error("アニメーションに必要な要素が見つかりません。");
            return;
        }

        const { operator } = currentProblem;
        const placeNames = ['ones', 'tens', 'hundreds']; // 一の位から順に処理

        for (const placeName of placeNames) {
            const leftDigitGroup = leftItemsContainer.querySelector(`.digit-group.${placeName}`);
            const rightDigitGroup = rightItemsContainer.querySelector(`.digit-group.${placeName}`);

            if (!leftDigitGroup || !rightDigitGroup) continue;

            if (operator === '+') {
                await handleAdditionAnimation(placeName, leftDigitGroup, rightDigitGroup, placeNames);
            } else {
                await handleSubtractionAnimation(placeName, leftDigitGroup, rightDigitGroup, placeNames);
            }
            await sleep(500); // 次の桁のアニメーションまで少し待つ
        }
    }

    /**
     * 1つの桁の足し算アニメーションを処理する
     * @param {string} placeName - 'ones', 'tens', 'hundreds'
     * @param {HTMLElement} leftDigitGroup - 左側の桁グループ要素
     * @param {HTMLElement} rightDigitGroup - 右側の桁グループ要素
     * @param {string[]} placeNames - 全ての桁名の配列
     */
    async function handleAdditionAnimation(placeName, leftDigitGroup, rightDigitGroup, placeNames) {
        const leftDigitLabel = leftDigitGroup.querySelector('.digit-label');
        const rightDigitLabel = rightDigitGroup.querySelector('.digit-label');
        const leftItemsWrapper = leftDigitGroup.querySelector('.digit-items');
        const rightItemsWrapper = rightDigitGroup.querySelector('.digit-items');

        // 1. 右から左へリンゴを移動アニメーション
        await animateRightToLeftTransfer(rightItemsWrapper, leftItemsWrapper, rightDigitLabel, leftDigitLabel);
        await sleep(100); // 移動完了後、少し待つ

        // 2. 繰り上がり処理
        if (leftItemsWrapper.children.length >= 10) {
            leftDigitLabel.classList.add('carry-highlight');
            await sleep(500);

            const itemsToCarry = Array.from(leftItemsWrapper.children).slice(0, 10);
            const nextPlaceIndex = placeNames.indexOf(placeName) + 1; // 'ones' -> 1, 'tens' -> 2

            if (nextPlaceIndex < placeNames.length) { // 100の位からの繰り上がりも考慮
                const nextPlaceName = placeNames[nextPlaceIndex]; // ★ 次の桁の名前を定義
                const nextLeftDigitGroup = leftItemsContainer.querySelector(`.digit-group.${nextPlaceName}`);
                if (nextLeftDigitGroup) { // 次の桁が存在するかチェック
                    const nextLeftItemsWrapper = nextLeftDigitGroup.querySelector('.digit-items');

                    // ★ 刷新: 新しい繰り上がりアニメーション関数を呼び出す
                    await handleCarryUpAnimation(itemsToCarry, nextLeftItemsWrapper, leftItemsWrapper);

                    // ★ 修正: アニメーション完了後に元の10個のリンゴを削除する
                    itemsToCarry.forEach(item => item.remove());

                    // +1を隣の位にアニメーションさせる
                    const carryOneIndicator = document.createElement('div');
                    carryOneIndicator.textContent = '+1';
                    carryOneIndicator.classList.add('carry-one-animation');
                    leftDigitGroup.appendChild(carryOneIndicator);

                    // 移動先の位置を計算
                    const currentRect = carryOneIndicator.getBoundingClientRect(); // ★基準を+1要素に変更
                    const nextRect = nextLeftDigitGroup.getBoundingClientRect(); // ★基準を次の桁グループ全体に変更

                    // 現在の桁グループの中心から次の桁グループの中心への相対的な移動量を計算
                    const targetX = (nextRect.left + nextRect.width / 2) - (currentRect.left + currentRect.width / 2);
                    const targetY = 0; // ★ 真横に移動させるため、Y方向の移動量を0に固定

                    carryOneIndicator.style.setProperty('--carry-move-x', `${targetX}px`);
                    carryOneIndicator.style.setProperty('--carry-move-y', '0px');

                    await new Promise(resolve => {
                        carryOneIndicator.addEventListener('animationend', () => {
                            carryOneIndicator.remove();
                            // アニメーション終了後に隣の位の数字を更新
                            const nextLeftDigitLabel = nextLeftDigitGroup.querySelector('.digit-label');
                            if (nextLeftDigitLabel) {
                                nextLeftDigitLabel.textContent = parseInt(nextLeftDigitLabel.textContent) + 1;
                            }
                            resolve();
                        }, { once: true });
                    });
                }
            }

            // ラベルを更新
            leftDigitLabel.textContent = leftItemsWrapper.children.length; // 繰り上がり後の残りの数
            leftDigitLabel.classList.remove('carry-highlight');
        } else {
            // 繰り上がりがなくても、移動後の合計数をラベルに反映
            // animateRightToLeftTransferで更新済みのため、ここでは不要
        }
    }

    /**
     * あおむしがリンゴを食べるアニメーションを実行する
     * @param {HTMLElement[]} aomusiItems - 食べる側のあおむしの要素の配列
     * @param {HTMLElement[]} itemsToEat - 食べられる側のリンゴの要素の配列
     */
    async function animateAomusiEating(aomusiItems, itemsToEat, rightDigitLabel, leftDigitLabel) {
        // 渡されたあおむしの数だけループし、1匹ずつ順番にアニメーションを実行する
        for (let i = 0; i < aomusiItems.length; i++) {
            const aomusi = aomusiItems[i];
            const itemToEat = itemsToEat[i];

            // このループで処理すべきあおむし、またはリンゴがなければ処理を終了
            if (!aomusi || !itemToEat) break;

            // --- 1. あおむしがリンゴの位置へ移動 ---
            const aomusiRect = aomusi.getBoundingClientRect();
            const itemRect = itemToEat.getBoundingClientRect();

            // アニメーション用のクローンを生成
            const aomusiClone = aomusi.cloneNode(true);
            aomusiClone.style.position = 'fixed';
            aomusiClone.style.left = `${aomusiRect.left}px`;
            aomusiClone.style.top = `${aomusiRect.top}px`;
            aomusiClone.style.width = `${aomusiRect.width}px`;
            aomusiClone.style.height = `${aomusiRect.height}px`;
            aomusiClone.style.transition = 'transform 0.5s ease-in-out, opacity 0.2s ease-in-out';
            aomusiClone.style.zIndex = '50';
            document.body.appendChild(aomusiClone);
            aomusi.style.visibility = 'hidden'; // 元の要素は隠す

            // requestAnimationFrameを挟むことで、移動アニメーションが確実に開始される
            await new Promise(resolve => requestAnimationFrame(resolve));

            aomusiClone.style.transform = `translate(${itemRect.left - aomusiRect.left}px, ${itemRect.top - aomusiRect.top}px)`;
            await waitForTransition(aomusiClone, 'transform');

            // --- 2. リンゴが食べられて消える ---
            if (typeof playSE === 'function') playSE('assets/sounds/eat.mp3');
            if (leftDigitLabel) leftDigitLabel.textContent = parseInt(leftDigitLabel.textContent) - 1;
            if (rightDigitLabel) rightDigitLabel.textContent = parseInt(rightDigitLabel.textContent) - 1;

            // ★ 修正: animationからtransitionによる方法に変更し、タイムアウト警告を回避する
            itemToEat.style.transition = 'opacity 0.3s, transform 0.3s';
            itemToEat.style.opacity = '0';
            itemToEat.style.transform = 'scale(0)';

            await waitForTransition(itemToEat, 'opacity'); // opacityのtransition完了を待つ
            itemToEat.remove(); // アニメーション完了後に要素を削除

            // --- 3. あおむしも消える ---
            // ★ 修正: animationからtransitionによるopacity変化に変更し、waitForTransitionで待つ
            aomusiClone.style.opacity = '0';
            await waitForTransition(aomusiClone, 'opacity');
            aomusiClone.remove(); // クローンを削除
            aomusi.remove(); // 元の要素も削除

            // 次のループに進む前に少し待つ（アニメーションが連続しすぎないように）
            await sleep(100);
        }
    }

    /**
     * 1つの桁の引き算アニメーションを処理する (★ アニメーション処理を刷新)
     * @param {string} placeName - 'ones', 'tens', 'hundreds'
     * @param {HTMLElement} leftDigitGroup - 左側の桁グループ要素
     * @param {HTMLElement} rightDigitGroup - 右側の桁グループ要素
     * @param {string[]} placeNames - 全ての桁名の配列
     */
    async function handleSubtractionAnimation(placeName, leftDigitGroup, rightDigitGroup, placeNames) {
        // 1. 必要なDOM要素と現在の数値を取得
        const leftDigitLabel = leftDigitGroup.querySelector('.digit-label');
        const rightDigitLabel = rightDigitGroup.querySelector('.digit-label');
        const leftItemsWrapper = leftDigitGroup.querySelector('.digit-items');
        const rightItemsWrapper = rightDigitGroup.querySelector('.digit-items');

        const initialLeftDigit = parseInt(leftDigitLabel.textContent);
        const rightDigit = parseInt(rightDigitLabel.textContent);

        // 引く数（あおむし）が0なら、この桁の処理は不要
        if (rightDigit === 0) {
            return;
        }

        // --- ステップ1: 繰り下がり処理 ---
        // 左のリンゴが右のあおむしより少ない場合、上の桁から借りてくる
        if (initialLeftDigit < rightDigit) {
            const nextPlaceIndex = placeNames.indexOf(placeName) + 1;
            if (nextPlaceIndex < placeNames.length) {
                const nextPlaceName = placeNames[nextPlaceIndex];
                const sourceDigitGroup = leftItemsContainer.querySelector(`.digit-group.${nextPlaceName}`);

                if (sourceDigitGroup) {
                    const sourceItemsWrapper = sourceDigitGroup.querySelector('.digit-items');
                    const sourceDigitLabel = sourceDigitGroup.querySelector('.digit-label');

                    // ★ 修正: 二重繰り下がり（借りる先が0の場合）に対応
                    if (parseInt(sourceDigitLabel.textContent) === 0) {
                        // 借りる先の位が0の場合、さらにその上の位から借りる処理を再帰的に行う
                        // (例: 203 - 177 の場合、一の位が十の位から借りようとすると、まず十の位が百の位から借りる)
                        await handleSubtractionAnimation(nextPlaceName, sourceDigitGroup, rightItemsContainer.querySelector(`.digit-group.${nextPlaceName}`), placeNames);
                    }

                    // 上の桁から借りる処理を実行
                    // ★「-1」が真横に移動するアニメーションを追加
                    const borrowOneIndicator = document.createElement('div');
                    borrowOneIndicator.textContent = '-1';
                    borrowOneIndicator.classList.add('borrow-one-animation');
                    sourceDigitGroup.appendChild(borrowOneIndicator);

                    const currentRect = borrowOneIndicator.getBoundingClientRect();
                    const targetRect = leftDigitGroup.getBoundingClientRect();

                    const targetX = (targetRect.left + targetRect.width / 2) - (currentRect.left + currentRect.width / 2);
                    const targetY = 0; // ★ 真横に移動させるため、Y方向の移動量を0に固定

                    borrowOneIndicator.style.setProperty('--carry-move-x', `${targetX}px`);
                    borrowOneIndicator.style.setProperty('--carry-move-y', '0px');

                    // ★ 修正: 「-1」のアニメーションが完了するのを待つ
                    await new Promise(resolve => {
                        borrowOneIndicator.addEventListener('animationend', () => {
                            borrowOneIndicator.remove();
                            resolve();
                        }, { once: true });
                    });

                    // ★ 修正: 「-1」が消えた後に、繰り下がりアニメーションを実行し、数字を更新する
                    await handleBorrowDownAnimation(sourceItemsWrapper, leftItemsWrapper, leftDigitLabel);
                    sourceDigitLabel.textContent = parseInt(sourceDigitLabel.textContent) - 1;
                }
            }
        }

        // --- ステップ2: 引き算（あおむしが食べる）アニメーション実行 ---
        // 繰り下がり処理でDOMが変更された可能性があるので、必ず最新の要素リストを取得する
        const aomusiToEat = Array.from(rightItemsWrapper.querySelectorAll('.item-img-wrapper'));
        const applesToEat = Array.from(leftItemsWrapper.querySelectorAll('.item-img-wrapper:not(.subtracted)'));

        // 食べるあおむしがいる場合のみアニメーションを実行
        if (aomusiToEat.length > 0) {
            // あおむしの数に合わせて、食べるリンゴのリストを作成
            const targetApples = applesToEat.slice(0, aomusiToEat.length); // 食べる対象のリンゴ
            await animateAomusiEating(aomusiToEat, targetApples, rightDigitLabel, leftDigitLabel);
        }

        // --- ステップ3: アニメーション後の状態更新 ---
        // animateAomusiEating内で数字はリアルタイム更新されるため、ここでの最終更新は不要。
        // ただし、念のため最終的なDOMの状態と一致させる
        const remainingApples = leftItemsWrapper.querySelectorAll('.item-img-wrapper:not(.subtracted)').length; // 残ったリンゴの数を再確認
        leftDigitLabel.textContent = remainingApples; // ラベルを最終的な数に確定
        rightDigitLabel.textContent = 0; // あおむしは全て消えるので0に確定
    }

    // アイテムを移動させる汎用関数
    async function moveItem(item, targetWrapper) {
        return new Promise(resolve => {
            // ターゲットの最終位置を計算するためにプレースホルダーを使用
            const placeholder = document.createElement('div');
            placeholder.style.width = '30px';
            placeholder.style.height = '30px';
            targetWrapper.appendChild(placeholder);
            const targetRect = placeholder.getBoundingClientRect();
            placeholder.remove();

            // アイテムを fixed にして、現在の表示位置を保持
            const itemRect = item.getBoundingClientRect();
            item.style.position = 'fixed';
            item.style.left = `${itemRect.left}px`;
            item.style.top = `${itemRect.top}px`;
            
            // 移動アニメーションを開始
            // requestAnimationFrame を挟むことで、スタイルの変更が確実に適用される
            requestAnimationFrame(() => {
                item.classList.add('moving');
                item.style.transform = `translate(${targetRect.left - itemRect.left}px, ${targetRect.top - itemRect.top}px)`;
            });

            const onTransitionEnd = () => {
                item.removeEventListener('transitionend', onTransitionEnd);
                item.classList.remove('moving');
                // スタイルをリセットして、新しい親要素内でのレイアウトに追従させる
                item.style.position = '';
                item.style.left = '';
                item.style.top = '';
                item.style.transform = '';
                targetWrapper.appendChild(item);
                
                // ★ 修正: bounce-inアニメーションを削除し、即座にresolveする
                resolve();
            };
            item.addEventListener('transitionend', onTransitionEnd, { once: true });
        });
    }

    /**
     * 要素の animation が完了するのを待つ Promise を返す
     * @param {HTMLElement} element - 対象の要素
     * @returns {Promise<void>}
     */
    function waitForAnimation(element, timeout = 500) { // タイムアウトのデフォルト値を500msに設定
        return new Promise((resolve, reject) => {
            let resolved = false;
            const onAnimationEnd = () => {
                if (resolved) return;
                resolved = true;
                element.removeEventListener('animationend', onAnimationEnd);
                clearTimeout(timer);
                resolve();
            };

            const timer = setTimeout(() => {
                if (resolved) return;
                console.warn('waitForAnimation timed out. Forcing resolve.', element);
                onAnimationEnd(); // タイムアウトした場合でもイベントハンドラを呼び出してクリーンアップと解決を行う
            }, timeout);

            element.addEventListener('animationend', onAnimationEnd, { once: true });
        });
    }

    function waitForTransition(element, propertyName, timeout = 500) {
        return new Promise((resolve) => {
            let resolved = false;
            const onTransitionEnd = (event) => {
                if (resolved) return;
                // 指定されたプロパティのtransitionが完了した場合、または指定がない場合に解決
                if (event.target === element && (!propertyName || event.propertyName === propertyName)) {
                    resolved = true;
                    element.removeEventListener('transitionend', onTransitionEnd);
                    clearTimeout(timer);
                    resolve();
                }
            };

            const timer = setTimeout(() => {
                if (resolved) return;
                console.warn(`waitForTransition timed out for property "${propertyName}". Forcing resolve.`, element);
                // タイムアウトした場合でもイベントハンドラを呼び出してクリーンアップと解決を行う
                onTransitionEnd({ target: element, propertyName: propertyName });
            }, timeout);

            element.addEventListener('transitionend', onTransitionEnd, { once: true });
        });
    }

    /**
     * 10個のアイテムが中央に集まるアニメーション
     * @param {HTMLElement[]} items - 対象のアイテム要素の配列
     * @param {HTMLElement} sourceWrapper - 親コンテナ
     * @returns {Promise<void>}
     */
    async function animateItemGather(items, targetElement) {
        const targetRect = targetElement.getBoundingClientRect();
        const centerX = targetRect.left + targetRect.width / 2;
        const centerY = targetRect.top + targetRect.height / 2;

        const gatheringPromises = items.map(item => {
            const itemRect = item.getBoundingClientRect();
            const moveX = centerX - itemRect.left - (itemRect.width / 2);
            const moveY = centerY - itemRect.top - (itemRect.height / 2);

            item.classList.add('carrying-out');
            item.style.transform = `translate(${moveX}px, ${moveY}px) scale(0.1)`;
            item.style.opacity = '0';
            return waitForTransition(item, 'transform');
        });

        await Promise.all(gatheringPromises);
    }

    /**
     * 1個のアイテムが中央に「変身」して現れるアニメーション
     * @param {HTMLElement} sourceWrapper - 元の親コンテナ
     * @param {boolean} isGroup - グループ（箱）として表示するか
     * @returns {Promise<HTMLElement>} 表示された新しいアイテム要素
     */
    async function animateItemAppear(sourceWrapper, isGroup = false) {
        const sourceRect = sourceWrapper.getBoundingClientRect();
        const centerX = sourceRect.left + sourceRect.width / 2;
        const centerY = sourceRect.top + sourceRect.height / 2;

        const newItem = createSingleItem(isGroup); // ★変更
        newItem.style.position = 'fixed';
        newItem.style.left = `${centerX - 15}px`;
        newItem.style.top = `${centerY - 15}px`;
        newItem.style.transform = 'scale(0)';
        document.body.appendChild(newItem);

        await sleep(50);

        newItem.classList.add('carrying-in');
        newItem.style.transform = 'scale(1)';

        await waitForTransition(newItem, 'transform');
        return newItem;
    }

    /**
     * 1個のアイテムが「ポンッ」と弾けるアニメーション
     * @param {HTMLElement} itemToBurst - 弾けるアイテム要素
     * @returns {Promise<void>}
     */
    async function animateItemBurst(itemToBurst) {
        // 明示的にtransitionを設定し、opacityを0にすることで弾けるアニメーションを確実に実行
        itemToBurst.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out'; // transformも考慮
        itemToBurst.classList.add('borrow-burst');
        itemToBurst.style.opacity = '0'; // opacityを0にしてトランジションをトリガー
        await waitForTransition(itemToBurst, 'opacity'); 
        itemToBurst.remove();
    }

    /**
     * 10個のアイテムが中央からそれぞれの位置に散らばるアニメーション
     * @param {HTMLElement} targetWrapper - 親コンテナ
     * @param {DOMRect} burstOriginRect - 弾けるアニメーションの発生元座標
     * @returns {Promise<void>}
     */
    async function animateItemsScatter(targetWrapper, burstOriginRect) {
        const newItems = [];
        for (let i = 0; i < 10; i++) {
            const newItem = createSingleItem();
            newItem.classList.add('newly-borrowed');
            // ★ 修正: アニメーションの基準をビューポートに合わせるため 'fixed' に変更
            newItem.style.position = 'fixed';
            newItem.style.left = `${burstOriginRect.left}px`;
            newItem.style.top = `${burstOriginRect.top}px`;
            newItem.style.opacity = '0';
            // 一時的にbodyに追加して座標計算の基準を合わせる
            document.body.appendChild(newItem);
            newItems.push(newItem);
        }
        
        // ターゲットコンテナにプレースホルダーを配置して最終位置を計算
        // ★ 修正: for...ofループを使い、並列処理ではなく順次処理で位置を計算する
        const positions = [];
        for (const item of newItems) {
            const placeholder = document.createElement('div');
            placeholder.style.width = '30px';
            placeholder.style.height = '30px';
            // 既存のアイテムの後ろに追加
            targetWrapper.appendChild(placeholder);
            const targetRect = placeholder.getBoundingClientRect();
            placeholder.remove();
            positions.push({ item, targetRect });
        }

        const animationPromises = positions.map(async ({ item, targetRect }) => {
            const itemRect = item.getBoundingClientRect();
            const moveX = targetRect.left - itemRect.left;
            const moveY = targetRect.top - itemRect.top;
            
            // 少し遅延させてアニメーション開始
            await sleep(10);

            item.style.opacity = '1';
            item.style.transform = `translate(${moveX}px, ${moveY}px)`;

            await waitForTransition(item, 'transform');

            // アニメーション完了後、スタイルをリセットして正式にコンテナに追加
            item.style.position = '';
            item.style.left = '';
            item.style.top = '';
            item.style.transform = '';
            item.style.opacity = '';
            item.classList.remove('newly-borrowed');
            targetWrapper.appendChild(item);
        });

        await Promise.all(animationPromises);
    }

    // --- 繰り上がり・繰り下がりアニメーション (刷新版) ---

    /**
     * [繰り下がり] 隣の桁から1個借りてきて10個にするアニメーション
     * @param {HTMLElement} sourceWrapper - 借りる元のアイテムコンテナ
     * @param {HTMLElement} targetWrapper - 借りる先のアイテムコンテナ
     * @param {HTMLElement} targetDigitLabel - 借りる先の数字ラベル
     */
    async function handleBorrowDownAnimation(sourceWrapper, targetWrapper, targetDigitLabel) {
        // この関数全体が完了するまで呼び出し元を待たせるためのPromise
        return new Promise(async (resolve) => {
            const itemToBorrow = sourceWrapper.querySelector('.item-img-wrapper:not(.subtracted):last-child');
            if (!itemToBorrow) {
                resolve(); // 借りるアイテムがなければ即座に完了
                return;
            }

            // --- ステップ1: 上の桁のリンゴが、その場で「10個の箱」に変身する ---
            const sourceRect = itemToBorrow.getBoundingClientRect();
            itemToBorrow.remove(); // 元のリンゴは消す

            // 箱を生成し、元のリンゴの位置でポップインさせる
            const boxItem = createSingleItem(true);
            boxItem.style.position = 'fixed';
            boxItem.style.left = `${sourceRect.left}px`;
            boxItem.style.top = `${sourceRect.top}px`;
            boxItem.style.transform = 'scale(0)';
            document.body.appendChild(boxItem);
            if (typeof playSE === 'function') playSE('assets/sounds/transform.mp3');
            await sleep(50);
            boxItem.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
            boxItem.style.transform = 'scale(1)';
            await waitForTransition(boxItem, 'transform');

            // --- ステップ2: 変身した「10個の箱」が隣の桁に移動する ---
            await moveItem(boxItem, targetWrapper);
            if (typeof playSE === 'function') playSE('assets/sounds/appear.mp3');

            // --- ステップ3: 移動先で箱が弾けて10個のリンゴになる ---
            const burstOriginRect = boxItem.getBoundingClientRect();
            // a. 箱が弾けるアニメーションと、10個のリンゴが散らばるアニメーション（両方の完了を待つ）
            await Promise.all([
                animateItemBurst(boxItem),
                animateItemsScatter(targetWrapper, burstOriginRect)
            ]);

            // --- ステップ4: 最終的な数字をラベルに反映し、処理の完了を通知 ---
            targetDigitLabel.textContent = parseInt(targetDigitLabel.textContent) + 10;
            resolve(); // 全てのアニメーションが完了したことを通知
        });
    }

    /**
     * [繰り上がり] 10個のリンゴを集め、隣の桁に1個として運ぶアニメーション
     * @param {HTMLElement[]} items - 集める10個のリンゴ要素
     * @param {HTMLElement} sourceWrapper - 元の桁のアイテムコンテナ
     * @param {HTMLElement} targetWrapper - 移動先の桁のアイテムコンテナ
     */
    async function handleCarryUpAnimation(items, targetWrapper, sourceWrapper) { // バスケットを使わないシンプルな実装に刷新
        // 1. 10個のリンゴを元の桁の中央に集める
        const sourceRect = sourceWrapper.getBoundingClientRect();
        const gatherTarget = document.createElement('div'); // 集まる先となるダミー要素
        gatherTarget.style.position = 'fixed';
        gatherTarget.style.left = `${sourceRect.left + sourceRect.width / 2}px`;
        gatherTarget.style.top = `${sourceRect.top + sourceRect.height / 2}px`;
        document.body.appendChild(gatherTarget);

        await animateItemGather(items, gatherTarget);
        if (typeof playSE === 'function') playSE('assets/sounds/gather.mp3');
        // items.forEach(item => item.remove()); // ここでは削除しない
        gatherTarget.remove();

        // 2. 集まった場所から新しい1個のリンゴを生成
        const newItem = createSingleItem(false);
        newItem.style.position = 'fixed';
        newItem.style.left = `${sourceRect.left + sourceRect.width / 2 - 15}px`; // 30px幅を想定
        newItem.style.top = `${sourceRect.top + sourceRect.height / 2 - 15}px`; // 30px高さを想定
        newItem.style.transform = 'scale(0)';
        document.body.appendChild(newItem);

        // ポップインアニメーション
        await sleep(50);
        newItem.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        newItem.style.transform = 'scale(1)';
        await waitForTransition(newItem, 'transform');
        if (typeof playSE === 'function') playSE('assets/sounds/appear.mp3');

        // 3. 新しい1個のリンゴを隣の桁に移動させる
        await moveItem(newItem, targetWrapper);
    }

    /**
     * 全ての操作可能要素（ボタン、入力欄）を無効化/有効化する
     * @param {boolean} disabled - trueで無効化, falseで有効化
     */
    function setInteractiveElementsDisabled(disabled) {
        interactiveElements.forEach(elem => {
            elem.disabled = disabled;
        });
    }

    /**
     * 単一のアイテム要素を作成するヘルパー関数
     * @param {boolean} isGroup - グループ（箱）として表示するか
     * @returns {HTMLElement}
     */
    function createSingleItem(isGroup = false) {
        const imgWrapper = document.createElement('div');
        imgWrapper.classList.add('item-img-wrapper');
        imgWrapper.style.position = 'relative'; // ★追加
        if (isGroup) {
            const itemBoxDiv = document.createElement('div');
            itemBoxDiv.classList.add('item-basket', 'item-img'); // item-box から item-basket に変更
            for (let i = 0; i < 10; i++) {
                const smallApple = document.createElement('img');
                smallApple.src = 'assets/images/ringo.png';
                smallApple.classList.add('item-img', 'item-img-small');
                itemBoxDiv.appendChild(smallApple);
            }
            itemBoxDiv.alt = '10の箱';
            imgWrapper.appendChild(itemBoxDiv);
        } else {
            const appleImg = document.createElement('img');
            appleImg.src = 'assets/images/ringo.png';
            appleImg.alt = 'りんご';
            appleImg.classList.add('item-img');
            imgWrapper.appendChild(appleImg);
        }
        return imgWrapper;
    }

    /**
     * 数値を読み上げるための音声ファイルパスのリストを生成する
     * @param {number} number - 読み上げる数値
     * @returns {string[]} 音声ファイルのパスの配列
     */
    function getSoundQueueForNumber(number) {
        const queue = [];
        if (number === 0) return ['assets/sounds/kazu/0.mp3'];

        let tempNum = number;

        // 百の位
        const hundreds = Math.floor(tempNum / 100);
        if (hundreds > 0) {
            switch (hundreds) {
                case 3: queue.push('assets/sounds/kazu/300.mp3'); break;
                case 6: queue.push('assets/sounds/kazu/600.mp3'); break;
                case 8: queue.push('assets/sounds/kazu/800.mp3'); break;
                case 1: queue.push('assets/sounds/kazu/100.mp3'); break;
                default:
                    queue.push(`assets/sounds/kazu/${hundreds}.mp3`);
                    queue.push('assets/sounds/kazu/100.mp3');
                    break;
            }
            tempNum %= 100;
        }

        // 十の位
        const tens = Math.floor(tempNum / 10);
        if (tens > 0) {
            if (tens === 1) {
                queue.push('assets/sounds/kazu/10.mp3');
            } else {
                queue.push(`assets/sounds/kazu/${tens}.mp3`);
                queue.push('assets/sounds/kazu/10.mp3');
            }
            tempNum %= 10;
        }

        // 一の位
        const ones = tempNum;
        if (ones > 0) {
            queue.push(`assets/sounds/kazu/${ones}.mp3`);
        }

        return queue;
    }

    /**
     * 音声ファイルのリストを順番に再生する (async/await版)
     * @param {string[]} soundQueue - 再生する音声ファイルのパスの配列
     */
    async function playSoundsSequentially(soundQueue) {
        if (!soundQueue || soundQueue.length === 0) return;
        for (const soundPath of soundQueue) {
            // settings.jsで定義されたグローバルなplaySE関数を使用
            if (typeof playSE === 'function') {
                await playSE(soundPath);
            }
        }
    }

    /**
     * 答えをチェックする関数（async/await版）
     */
    async function checkAnswer() {
        initializeAudio();

        const userAnswerStr = currentAnswerString;
        if (userAnswerStr === '') {
            feedbackElem.textContent = 'すうじをいれてね';
            feedbackElem.className = 'incorrect';
            if (typeof playSE === 'function') await playSE('assets/sounds/attention.mp3');
            return;
        }

        const userAnswer = parseInt(userAnswerStr, 10);

        const soundQueue = getSoundQueueForNumber(userAnswer);
        await playSoundsSequentially(soundQueue);

        if (userAnswer === currentProblem.answer) {
            feedbackElem.textContent = 'せいかい！すごい！';
            feedbackElem.className = 'correct';
            if (typeof playSE === 'function') await playSE('assets/sounds/seikai.mp3');
            if (typeof addPoints === 'function') addPoints(1); // 正解で1ポイント追加

            // 正解を1秒間表示してから、次の問題へ
            await sleep(1000);

            generateProblem(); // 次の問題を自動で生成
        } else {
            feedbackElem.textContent = 'おしい！もういちど';
            feedbackElem.className = 'incorrect';
            if (typeof playSE === 'function') await playSE('assets/sounds/incorrect.mp3');
        }
    }

    // --- イベントリスナーの設定 ---

    // 数字ボタン
    numberButtons.forEach(button => {
        button.addEventListener('click', () => {
            initializeAudio();
            const number = button.textContent;
            if (typeof playSE === 'function') playSE(`assets/sounds/kazu/${number}.mp3`);

            // 3桁より多くは入力させない
            if (currentAnswerString.length >= 3) {
                return;
            }

            // 最初の1文字が入力されるときにプレースホルダー状態を解除
            if (currentAnswerString === '') {
                answerInput.classList.remove('is-placeholder');
            }
            currentAnswerString += number;

            // 色付きで答えの欄に表示する
            displayColoredNumber(answerInput, parseInt(currentAnswerString, 10));
        });
    });

    // けすボタン
    if(clearBtn) clearBtn.addEventListener('click', resetAnswerInput);

    // 難易度選択ボタン
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            // ★ 「くりあがり」ボタンは除外
            if (button.id === 'difficulty-carry') return;
            difficultyButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            currentDifficulty = button.id.replace('difficulty-', '');
            generateProblem();
        });
    });

    // モード選択ボタン
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modeButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            currentMode = button.id.replace('mode-', '');
            generateProblem();
        });
    });

    // ★ 繰り上がりトグルスイッチ
    if (carryToggle) {
        carryToggle.addEventListener('change', () => {
            isCarryEnabled = carryToggle.checked;
            generateProblem();
        });
    }

    // こたえあわせボタン
    if(checkBtn) checkBtn.addEventListener('click', checkAnswer);
    // つぎのもんだいボタン
    if(nextBtn) nextBtn.addEventListener('click', generateProblem);
    // ヒントボタン
    if (hintBtn) {
        hintBtn.addEventListener('click', handleHintAnimation);
    }

    // 主要なボタンをカラフルにする
    if(checkBtn) checkBtn.classList.add('colorful-btn');
    if(clearBtn) clearBtn.classList.add('colorful-btn');
    if(nextBtn) nextBtn.classList.add('colorful-btn');

    // 最初に問題を表示
    generateProblem();

    // ユーザーの最初の操作でBGMを含む音声を初期化する
    document.body.addEventListener('click', initializeAudio, { once: true });
    document.body.addEventListener('touchstart', initializeAudio, { once: true });
});
