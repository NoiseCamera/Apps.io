// DOMの読み込みが完了したら処理を開始
document.addEventListener('DOMContentLoaded', () => {
    // HTML要素の取得
    const num1Elem = document.getElementById('num1');
    const operatorElem = document.getElementById('operator');
    const num2Elem = document.getElementById('num2');
    const answerInput = document.getElementById('answer-input');
    const checkBtn = document.getElementById('check-btn');
    const clearBtn = document.getElementById('clear-btn'); // けすボタン
    const modeButtons = document.querySelectorAll('.mode-btn');
    const nextBtn = document.getElementById('next-btn');
    const feedbackElem = document.getElementById('feedback');
    const interactiveElements = document.querySelectorAll('button, input'); // 操作可能な要素を全て
    const leftItemsContainer = document.getElementById('left-items');
    const rightItemsContainer = document.getElementById('right-items');
    const operatorSymbolElem = document.querySelector('.operator-symbol');
    const hintBtn = document.getElementById('hint-btn');

    // 音声ファイルを読み込んでおく
    const correctSound = new Audio('assets/sounds/seikai.mp3');
    const numberButtons = document.querySelectorAll('.number-btn');
    const incorrectSound = new Audio('assets/sounds/incorrect.mp3'); // 不正解の音
    const attentionSound = new Audio('assets/sounds/attention.mp3'); // 数字が空の時の音
    const bgm = new Audio('assets/sounds/bgm.mp3'); // BGM

    // 現在の問題の状態をまとめて管理するオブジェクト
    let currentProblem = {};
    let currentAnswerString = ''; // 現在の答えを文字列で保持
    let audioInitialized = false; // 音声再生の準備ができたか
    let currentMode = 'mixed'; // 'mixed', 'addition', 'subtraction'

    // ユーザーの最初の操作で音声再生の準備をする関数
    function initializeAudio() {
        if (audioInitialized) return;
        // .load()を呼び出すことで、ブラウザに音声を使う意図を伝える
        correctSound.load();
        incorrectSound.load();
        attentionSound.load();
        bgm.load();
        bgm.loop = true; // BGMをループ再生する
        // BGMを少し小さめの音量で再生する（0.0〜1.0）
        bgm.volume = 0.2;
        bgm.play().catch(e => console.error("BGMの自動再生がブロックされました。", e));

        audioInitialized = true;
        console.log('音声の準備ができました。');
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

        for (let i = 0; i < 3; i++) {
            const d1 = parseInt(s1[i]);
            const d2 = parseInt(s2[i]);
            if (isAddition) {
                if (d1 + d2 >= 10) return true; // 繰り上がり
            } else {
                if (d1 < d2) return true; // 繰り下がり
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
     * 計算を視覚的に表現するためのアイテム（リンゴ）を表示する
     * @param {HTMLElement} container - アイテムを表示するコンテナ要素
     * @param {number} totalNumber - 表示するアイテムの合計数
     * @param {number} maxDigits - 表示する最大の桁数
     */
    function displayVisualItems(container, totalNumber, maxDigits) {
        container.innerHTML = ''; // 中身をクリア
        // 0の場合でも、桁のプレースホルダーは表示する
        const groups = createDigitGroups(totalNumber, maxDigits);
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
     * 新しい問題を作成して表示する関数
     */
    function generateProblem() {
        // 問題生成の最初に、フィードバックと答えの入力欄をリセットする
        feedbackElem.textContent = '';
        feedbackElem.className = '';
        resetAnswerInput();

        let num1, num2;
        let isAddition; // 足し算かどうかのフラグ

        // 現在のモードに応じて、足し算か引き算かを決定
        if (currentMode === 'addition') {
            isAddition = true;
        } else if (currentMode === 'subtraction') {
            isAddition = false;
        } else { // 'mixed' モードの場合
            isAddition = Math.random() < 0.5;
        }

        function generateRandomNumber(maxDigits = 3) {
            // 1〜maxDigits桁の数値を生成
            const digits = Math.floor(Math.random() * maxDigits) + 1;
            const maxValue = Math.pow(10, digits) - 1;
            return Math.floor(Math.random() * maxValue) + 1;
        }

        do {
            num1 = generateRandomNumber();
            num2 = generateRandomNumber();

            if (isAddition) {
                const num1Str = num1.toString();
                const num2Str = num2.toString();
                if (num1Str.length < num2Str.length) {
                    [num1, num2] = [num2, num1];
                }
            } else {
                const num1Str = num1.toString();
                const num2Str = num2.toString();

                if (num1Str.length < num2Str.length) {
                    num2 = generateRandomNumber(num1Str.length);
                } else if (num1Str.length === num2Str.length && num1 < num2) {
                    [num1, num2] = [num2, num1];
                }
            }
        } while (hasCarryOrBorrow(num1, num2, isAddition));

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

        // 演算子の記号と色を更新
        operatorSymbolElem.textContent = currentProblem.operator;
        if (currentProblem.operator === '-') {
            operatorSymbolElem.classList.add('subtraction');
        } else {
            operatorSymbolElem.classList.remove('subtraction');
        }

        // ヒントボタンを有効化
        if (hintBtn) {
            hintBtn.disabled = false;
        }

    }

    /**
     * ヒントボタンが押されたときに桁ごとにアニメーションを実行する関数
     */
    async function handleHintAnimation() {
        const { operator } = currentProblem;

        if (!leftItemsContainer || !rightItemsContainer || !hintBtn) {
            console.error("アニメーションに必要な要素が見つかりません。");
            return;
        }

        hintBtn.disabled = true;

        const placeNames = ['ones', 'tens', 'hundreds'];

        for (const placeName of placeNames) {
            const leftDigitGroup = leftItemsContainer.querySelector(`.digit-group.${placeName}`);
            const rightDigitGroup = rightItemsContainer.querySelector(`.digit-group.${placeName}`);

            if (!leftDigitGroup || !rightDigitGroup) continue;

            const itemsToMove = Array.from(rightDigitGroup.querySelectorAll('.item-img-wrapper'));
            if (itemsToMove.length === 0) continue;

            const leftItemsWrapper = leftDigitGroup.querySelector('.digit-items');

            if (operator === '+') {
                // 足し算も1つずつ順番にアニメーションさせる
                for (const item of itemsToMove) {
                    await new Promise(resolve => {
                        const itemRect = item.getBoundingClientRect();
                        // 移動先のプレースホルダーを作って座標を取得
                        const targetItemPlaceholder = document.createElement('div');
                        targetItemPlaceholder.style.width = '30px';
                        targetItemPlaceholder.style.height = '30px';
                        leftItemsWrapper.appendChild(targetItemPlaceholder);
                        const targetRect = targetItemPlaceholder.getBoundingClientRect();
                        targetItemPlaceholder.remove(); // 座標取得後は削除

                        item.style.setProperty('--move-x', `${targetRect.left - itemRect.left}px`);
                        item.style.setProperty('--move-y', `${targetRect.top - itemRect.top}px`);

                        item.addEventListener('animationend', () => {
                            item.classList.remove('moving');
                            leftItemsWrapper.appendChild(item); // 実際にDOMを移動
                            resolve();
                        }, { once: true });

                        item.classList.add('moving');
                    });
                    await sleep(100); // 1つずつ動いているのが分かりやすいように少し待つ
                }
            } else { // '-'
                // 引き算は1つずつ順番にアニメーションさせる
                for (const item of itemsToMove) {
                    await new Promise(resolve => {
                        const itemRect = item.getBoundingClientRect();

                        // 消される対象（灰色になっていない最後のリンゴ）を探す
                        const leftItems = Array.from(leftItemsWrapper.querySelectorAll('.item-img-wrapper:not(.subtracted)'));
                        const targetItem = leftItems[leftItems.length - 1]; // 配列の最後の要素

                        if (!targetItem) {
                            resolve(); // 消す対象がなければ終了
                            return;
                        }
                        const targetRect = targetItem.getBoundingClientRect();

                        item.style.setProperty('--move-x', `${targetRect.left - itemRect.left}px`);
                        item.style.setProperty('--move-y', `${targetRect.top - itemRect.top}px`);

                        item.addEventListener('animationend', () => {
                            // アニメーション終了後、対象を灰色にする
                            targetItem.classList.add('subtracted');
                            item.remove(); // 移動したリンゴは消す
                            resolve();
                        }, { once: true });

                        item.classList.add('moving');
                    });
                    await sleep(100); // 1つずつ動いているのが分かりやすいように少し待つ
                }
            }

            // アニメーション後に数字ラベルを更新
            const leftDigitLabel = leftDigitGroup.querySelector('.digit-label');
            const rightDigitLabel = rightDigitGroup.querySelector('.digit-label');
            if (operator === '+') {
                leftDigitLabel.textContent = leftItemsWrapper.children.length;
            } else { // '-'
                // 残っている（灰色になっていない）アイテムの数を数える
                const remainingItems = leftItemsWrapper.querySelectorAll('.item-img-wrapper:not(.subtracted)').length;
                leftDigitLabel.textContent = remainingItems;
            }
            rightDigitLabel.textContent = 0;

            await sleep(500); // 次の桁のアニメーションまで少し待つ
        }

        // 全てのアニメーションが終わったらボタンを再度有効化
        hintBtn.disabled = false;
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
     * 音声ファイルを再生し、再生完了を待つPromiseを返す (タイムアウト付き)
     * @param {HTMLAudioElement} audio - 再生するAudioオブジェクト
     * @param {number} timeout - タイムアウト時間 (ミリ秒)
     * @returns {Promise<void>}
     */
    function playAudio(audio, timeout = 2000) {
        return new Promise((resolve) => {
            let timeoutId = null;

            const cleanup = () => {
                if (timeoutId) clearTimeout(timeoutId);
                audio.onended = null;
                audio.onerror = null;
            };

            timeoutId = setTimeout(() => {
                console.warn(`音声再生がタイムアウトしました: ${audio.src}`);
                cleanup();
                resolve(); // タイムアウトしても次に進む
            }, timeout);

            audio.onended = () => {
                cleanup();
                resolve();
            };

            audio.onerror = () => {
                console.error(`音声ファイルの読み込み/再生エラー: ${audio.src}`);
                cleanup();
                resolve(); // エラーでも次に進む
            };

            audio.currentTime = 0;
            audio.play().catch(() => {
                console.error(`play()の呼び出しに失敗しました: ${audio.src}`);
                cleanup();
                resolve(); // play()の失敗でも次に進む
            });
        });
    }

    /**
     * 音声ファイルのリストを順番に再生する (async/await版)
     * @param {string[]} soundQueue - 再生する音声ファイルのパスの配列
     */
    async function playSoundsSequentially(soundQueue) {
        if (!soundQueue || soundQueue.length === 0) {
            return;
        }
        for (const soundPath of soundQueue) {
            const audio = new Audio(soundPath);
            await playAudio(audio);
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
            await playAudio(attentionSound);
            return;
        }

        const userAnswer = parseInt(userAnswerStr, 10);
        setInteractiveElementsDisabled(true);

        try {
            const soundQueue = getSoundQueueForNumber(userAnswer);
            await playSoundsSequentially(soundQueue);

            if (userAnswer === currentProblem.answer) {
                feedbackElem.textContent = 'せいかい！すごい！';
                feedbackElem.className = 'correct';
                await playAudio(correctSound);

                // 正解を1秒間表示してから、次の問題へ
                await sleep(1000);

                generateProblem(); // 次の問題を自動で生成
            } else {
                feedbackElem.textContent = 'おしい！もういちど';
                feedbackElem.className = 'incorrect';
                await playAudio(incorrectSound);
            }
        } catch (error) {
            console.error("checkAnswer内で予期せぬエラーが発生しました:", error);
        } finally {
            // 処理が完了したら（正解・不正解・エラー問わず）、UIを再度有効化する
            setInteractiveElementsDisabled(false);
        }
    }

    // --- イベントリスナーの設定 ---

    // 数字ボタン
    numberButtons.forEach(button => {
        button.addEventListener('click', () => {
            initializeAudio();
            const number = button.textContent;
            const numberSound = new Audio(`assets/sounds/kazu/${number}.mp3`);
            numberSound.play().catch(e => console.error(`音声ファイル assets/sounds/kazu/${number}.mp3 の再生に失敗しました。`, e));

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
    clearBtn.addEventListener('click', resetAnswerInput);

    // モード選択ボタン
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modeButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            currentMode = button.id.replace('mode-', '');
            generateProblem();
        });
    });

    // こたえあわせボタン
    checkBtn.addEventListener('click', checkAnswer);
    // つぎのもんだいボタン
    nextBtn.addEventListener('click', generateProblem);
    // ヒントボタン
    if (hintBtn) {
        hintBtn.addEventListener('click', handleHintAnimation);
    }

    // 最初に問題を表示
    generateProblem();
});
