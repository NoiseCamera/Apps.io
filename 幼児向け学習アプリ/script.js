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

    // 音声ファイルを読み込んでおく
    const correctSound = new Audio('assets/sounds/seikai.mp3');
    const numberButtons = document.querySelectorAll('.number-btn');
    const incorrectSound = new Audio('assets/sounds/incorrect.mp3'); // 不正解の音
    const attentionSound = new Audio('assets/sounds/attention.mp3'); // 数字が空の時の音
    const bgm = new Audio('assets/sounds/bgm.mp3'); // BGM

    let correctAnswer = 0;
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
        bgm.volume = 0.3;
        bgm.play(); // BGMを再生開始

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
     * 新しい問題を作成して表示する関数
     */
    function generateProblem() {
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

        do {
            // ランダムな桁数の数値を生成
            num1 = generateRandomNumber();
            num2 = generateRandomNumber();

            // 足し算の場合の調整: num1 の桁数が num2 以下になるようにする
            if (isAddition) {
                const num1Str = num1.toString();
                const num2Str = num2.toString();
                if (num1Str.length < num2Str.length) {
                    [num1, num2] = [num2, num1]; // num1 と num2 を入れ替える
                }
            }

            // 引き算の場合の調整
            if (!isAddition) {
                const num1Str = num1.toString();
                const num2Str = num2.toString();

                if (num1Str.length < num2Str.length) {
                    // num1 の方が桁数が少ない場合、num2 を再生成
                    num2 = generateRandomNumber(num1Str.length);
                } else if (num1Str.length === num2Str.length && num1 < num2) {
                    // 桁数が同じで num1 < num2 の場合、入れ替える
                    [num1, num2] = [num2, num1];
                }
            }

        } while (hasCarryOrBorrow(num1, num2, isAddition));


        displayColoredNumber(num1Elem, num1);
        displayColoredNumber(num2Elem, num2);

        operatorElem.textContent = isAddition ? '+' : '-';

        // 正解を計算
        function generateRandomNumber(maxDigits = 3) {
          // 1〜maxDigits桁の数値を生成
          const digits = Math.floor(Math.random() * maxDigits) + 1;
          const maxValue = Math.pow(10, digits) - 1;
          return Math.floor(Math.random() * maxValue) + 1;
      }



        correctAnswer = isAddition ? num1 + num2 : num1 - num2;

        // 前回の結果をクリア
        feedbackElem.textContent = '';
        feedbackElem.className = '';
        answerInput.value = '';
        answerInput.focus(); // 入力欄にフォーカスを当てる
    }

    /**
     * 答えをチェックする関数
     */
    function checkAnswer() {
        // 答え合わせ時にも音声の準備をする（キーボード入力対策）
        initializeAudio();

        const userAnswer = parseInt(answerInput.value, 10);

        if (isNaN(userAnswer)) {
            feedbackElem.textContent = 'すうじをいれてね';
            feedbackElem.className = 'incorrect';
            attentionSound.play(); // 注意を促す音を再生
            return;
        }

        if (userAnswer === correctAnswer) {
            feedbackElem.textContent = 'せいかい！すごい！';
            feedbackElem.className = 'correct';
            correctSound.play(); // 正解音を再生
            setTimeout(generateProblem, 1500); // 1.5秒後に次の問題へ
        } else {
            feedbackElem.textContent = 'おしい！もういちど';
            feedbackElem.className = 'incorrect';
            incorrectSound.play(); // 不正解音を再生
        }
    }

    // 数字ボタンのイベントリスナー
    numberButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 数字ボタンクリック時に音声の準備をする
            initializeAudio();
            answerInput.value += button.textContent;
            answerInput.focus();
        });
    });

    // けすボタンのイベントリスナー
    clearBtn.addEventListener('click', () => {
        answerInput.value = ''; // 入力欄を空にする
        answerInput.focus(); // 入力欄にフォーカスを戻す
    });

    // モード選択ボタンのイベントリスナー
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 他のボタンの選択状態を解除
            modeButtons.forEach(btn => btn.classList.remove('selected'));
            // クリックされたボタンを選択状態にする
            button.classList.add('selected');

            // モードを更新
            currentMode = button.id.replace('mode-', ''); // 'mixed', 'addition', 'subtraction'

            // 新しいモードで問題を作成
            generateProblem();
        });
    });


    // イベントリスナーの設定
    checkBtn.addEventListener('click', checkAnswer);
    nextBtn.addEventListener('click', generateProblem);
    // Enterキーでも答え合わせができるようにする
    answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });

    // 最初に問題を表示
    generateProblem();
});