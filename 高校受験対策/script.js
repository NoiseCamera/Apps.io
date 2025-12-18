// 各ファイルから読み込んだクイズデータをまとめる
const quizzes = {
  '国語': kokugoQuiz,
  '社会': shakaiQuiz,
  '理科': rikaQuiz,
  '英語': eigoQuiz,
  '数学': [...sugakuQuiz, ...sugaku2Quiz], // 2つの配列を結合
  '漢字': kanjiQuiz
};

// DOM要素の取得
const screens = document.querySelectorAll('.screen');
const subjectContainer = document.getElementById('js-subject-container');
const subjectSelectionContainer = document.getElementById('js-subject-selection');
const levelContainer = document.getElementById('js-level-container');
const levelSelectionContainer = document.getElementById('js-level-selection');
const countContainer = document.getElementById('js-count-container');
const countSelectionContainer = document.getElementById('js-count-selection');
const quizContainer = document.getElementById('js-quiz-container');
const quizTitleElement = document.getElementById('js-quiz-title');
const questionElement = document.getElementById('js-question');
const answersContainer = document.getElementById('js-items');
const explanationContainer = document.getElementById('js-explanation');
const nextButton = document.getElementById('js-next-btn');
const backToSubjectFromQuizButton = document.getElementById('js-back-to-subject-from-quiz-btn'); // クイズ画面から科目選択へ
const backToSubjectFromLevelButton = document.getElementById('js-back-to-subject-from-level-btn'); // 学年選択画面から科目選択へ
const backToLevelButton = document.getElementById('js-back-to-level-btn'); // 問題数選択画面から学年選択へ
const progressElement = document.getElementById('js-progress'); // 追加

// クイズの状態を管理する変数
let currentQuiz = [];
let currentQuizIndex = 0;
let selectedSubject = '';
let selectedLevel = '';
let score = 0;
let incorrectQuestions = []; // 間違えた問題を保存する配列
let quizHistory = []; // 回答履歴を保存する配列
let highScores = JSON.parse(localStorage.getItem('highScores')) || {}; // 科目ごとのハイスコアを保存

// 画面表示を管理する関数
function showScreen(targetScreen) {
  screens.forEach(screen => {
    screen.style.display = 'none';
  });
  targetScreen.style.display = 'block';
}

// クイズ表示エリアを完全にリセットする関数
function resetQuizDisplay() {
  quizContainer.style.display = 'none';
  quizTitleElement.textContent = ''; // クイズタイトルもクリア
  progressElement.textContent = ''; // 追加
  questionElement.innerHTML = '';
  answersContainer.innerHTML = '';
  explanationContainer.style.display = 'none';
  nextButton.style.display = 'none'; // 次へボタンも非表示に
}

// 科目選択ボタンを生成する関数
function createSubjectButtons() {
  const subjectNames = Object.keys(quizzes);
  subjectNames.forEach(name => {
    const button = document.createElement('button');
    const totalQuestions = quizzes[name].length;
    const highScore = highScores[name] || 0; // その科目のハイスコアを取得、なければ0
    button.textContent = `${name} (${totalQuestions}問) ハイスコア: ${highScore}点`;
    subjectSelectionContainer.appendChild(button);

    // ハイスコア表示用のスタイルを適用
    if (highScore > 0) {
      button.classList.add('has-high-score');
    }

    // イベントリスナーは既存のまま
    button.addEventListener('click', () => {
      showLevelSelection(name);
    });
  });
}

// 学年選択ボタンにイベントリスナーを設定する関数
function setupLevelButtons() {
  Array.from(levelSelectionContainer.children).forEach(button => {
    button.addEventListener('click', (e) => {
      const level = e.target.dataset.level;
      if (level) { // 戻るボタンでないことを確認
        showCountSelection(level);
      }
    });
  });
}

// 問題数選択ボタンにイベントリスナーを設定する関数
function setupCountButtons() {
  Array.from(countSelectionContainer.children).forEach(button => {
      button.addEventListener('click', (e) => {
          const count = e.target.dataset.count;
          if (count) { // 戻るボタンでないことを確認
              startQuiz(selectedLevel, count);
          }
      });
  });
}

// 学年選択画面を表示する関数
function showLevelSelection(subjectName) {
  selectedSubject = subjectName;
  showScreen(levelContainer);
  resetQuizDisplay(); // レベル選択画面に遷移する際もクイズ表示をリセット
}

// 問題数選択画面を表示する関数
function showCountSelection(level) {
  selectedLevel = level;
  showScreen(countContainer);
}

// 配列をシャッフルする関数（Fisher-Yatesアルゴリズム）
function shuffleArray(array) {
  const newArray = [...array]; // 元の配列をコピーして、元の配列に影響を与えないようにする
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // 要素を交換
  }
  return newArray;
}

// 指定された科目と学年のクイズを開始する関数
function startQuiz(level, count) {
  let allQuestions = quizzes[selectedSubject];

  // 学年で問題をフィルタリング
  if (level !== 'all') {
    allQuestions = allQuestions.filter(q => q.level == level);
  }
  
  // 問題数を設定
  const questionCount = count === 'all' ? allQuestions.length : Math.min(parseInt(count, 10), allQuestions.length);

  // 状態をリセット
  currentQuiz = shuffleArray(allQuestions).slice(0, questionCount); // 問題をシャッフルして指定数取得
  currentQuizIndex = 0;
  score = 0;
  incorrectQuestions = []; // 間違えた問題リストをリセット
  quizHistory = []; // 回答履歴をリセット

  // 画面を切り替え
  showScreen(quizContainer);
  backToSubjectFromQuizButton.style.display = 'block'; // クイズ開始時から表示

  const levelText = level === 'all' ? '全範囲' : `中学${level}年生`;
  quizTitleElement.textContent = `${selectedSubject}のクイズ - ${levelText}（全${currentQuiz.length}問）`;
  setupQuiz();
  updateProgress(); // 追加
}

// クイズの問題と選択肢を画面に表示する関数
function setupQuiz() {
  questionElement.textContent = `Q. ${currentQuiz[currentQuizIndex].question}`;
  explanationContainer.style.display = 'none';
  nextButton.style.display = 'none';
  updateProgress(); // 追加
  answersContainer.innerHTML = '';
 
  const shuffledAnswers = shuffleArray(currentQuiz[currentQuizIndex].answers);
 
  shuffledAnswers.forEach(answer => {
    const button = document.createElement('button');
    button.textContent = answer;
    answersContainer.appendChild(button);

    button.addEventListener('click', (e) => {
      checkAnswer(e.target);
    });
  });
}

// 進行状況を更新する関数
function updateProgress() {
  progressElement.textContent = `${currentQuizIndex + 1}/${currentQuiz.length}問目`;
}

// 正誤を判定する関数
function checkAnswer(selectedButton) {
  const currentQuestion = currentQuiz[currentQuizIndex];
  const isCorrect = selectedButton.textContent === currentQuestion.correct;

  // 回答履歴を保存
  quizHistory.push({
    question: currentQuestion,
    selectedAnswer: selectedButton.textContent,
    isCorrect: isCorrect
  });

  if (isCorrect) {
    selectedButton.classList.add('correct');
    score++;
  } else {
    selectedButton.classList.add('incorrect');
    Array.from(answersContainer.children).forEach(button => {
      if (button.textContent === currentQuestion.correct) {
        button.classList.add('correct');
      }
    });
    incorrectQuestions.push(currentQuestion); // 間違えた問題を配列に追加
  }

  Array.from(answersContainer.children).forEach(button => {
    button.classList.add('disabled');
  });
  nextButton.style.display = 'block';

  // 解説を表示
  explanationContainer.textContent = currentQuestion.explanation;
  explanationContainer.style.display = 'block';
}

// 「次の問題へ」ボタンがクリックされたときの処理
nextButton.addEventListener('click', () => {
  currentQuizIndex++;
  if (currentQuizIndex < currentQuiz.length) {
    setupQuiz();
  } else {
    showResult();
  }
});

// 最終結果を表示する関数
function showResult() {
  quizTitleElement.textContent = 'クイズ終了！';
  questionElement.textContent = '';
  explanationContainer.style.display = 'none';

  const percentage = Math.round((score / currentQuiz.length) * 100);
  const passThreshold = 70; // 合格のボーダーラインを70%に設定
  let borderMessage = '';
  let messageClass = '';

  if (percentage === 100) {
    borderMessage = `パーフェクト！天才か？…まあ、今回は運が良かっただけかもしれないがな。`;
    messageClass = 'pass-message';
  } else if (percentage >= 90) {
    borderMessage = `やるじゃないか。だが、トップに立つにはまだ甘いな。`;
    messageClass = 'pass-message';
  } else if (percentage >= passThreshold) {
    borderMessage = `合格ライン（${passThreshold}%）は超えたか。だが、ギリギリだということを忘れるな。`;
    messageClass = 'pass-message';
  } else if (percentage >= 50) {
    borderMessage = `合格ライン（${passThreshold}%）に届かず…！話にならんな。基礎からやり直せ。`;
    messageClass = 'fail-message';
  } else {
    borderMessage = `ザコすぎwww もう一度、小学校からやり直してきたらどうだ？`;
    messageClass = 'fail-message';
  }

  // ハイスコアの更新
  if (!highScores[selectedSubject] || score > highScores[selectedSubject]) {
    highScores[selectedSubject] = score;
    localStorage.setItem('highScores', JSON.stringify(highScores));
    // ハイスコアが更新されたことをユーザーに通知するなどの処理を追加しても良い
    console.log(`${selectedSubject}のハイスコアが${score}点に更新されました！`);
  }

  let resultListHTML = '<h2 class="result-subtitle">結果一覧</h2>';
  quizHistory.forEach((result, index) => {
    const resultClass = result.isCorrect ? 'result-correct' : 'result-incorrect';
    const resultIcon = result.isCorrect ? '正解' : '不正解';
    const yourAnswer = result.selectedAnswer ? `あなたの回答: ${result.selectedAnswer}` : 'あなたの回答: 未回答';

    resultListHTML += `
        <div class="result-item ${resultClass}">
          <p class="result-question"><strong>${index + 1}. ${result.question.question}</strong></p>
          <p><strong>結果: ${resultIcon}</strong></p>
          <p>${yourAnswer}</p>
          <p>正解: ${result.question.correct}</p>
          <p class="result-explanation">解説: ${result.question.explanation}</p>
        </div>
    `;
  });

  answersContainer.innerHTML = `
    <p class="result-text">あなたの正解率は <strong>${percentage}%</strong> でした！</p>
    <p class="result-score">（${currentQuiz.length} 問中 ${score} 問正解）</p>
    <p class="border-message ${messageClass}">${borderMessage}</p>
    ${resultListHTML}
  `;

  nextButton.style.display = 'none';

  // 間違えた問題があれば復習ボタンを表示
  if (incorrectQuestions.length > 0) {
    const reviewButton = document.createElement('button');
    reviewButton.textContent = `間違えた${incorrectQuestions.length}問を復習する`;
    reviewButton.classList.add('review-btn');
    answersContainer.appendChild(reviewButton);

    reviewButton.addEventListener('click', startReview);
  }

}

// 復習クイズを開始する関数
function startReview() {
  currentQuiz = shuffleArray(incorrectQuestions); // 間違えた問題でクイズを再設定
  currentQuizIndex = 0;
  score = 0;
  incorrectQuestions = []; // 復習セッション用にリセット

  quizTitleElement.textContent = `${selectedSubject}の復習クイズ（全${currentQuiz.length}問）`;
  updateProgress(); // 追加
  setupQuiz();
}

// 科目選択画面に戻る共通の関数
function goBackToSubjectSelection() {
  resetQuizDisplay(); // クイズ表示をリセット
  showScreen(subjectContainer);
}

// クイズ中/結果画面の「科目選択に戻る」ボタンがクリックされたときの処理
backToSubjectFromQuizButton.addEventListener('click', goBackToSubjectSelection);

// 学年選択画面の「科目選択に戻る」ボタンがクリックされたときの処理
backToSubjectFromLevelButton.addEventListener('click', goBackToSubjectSelection);

// 問題数選択画面の「学年選択に戻る」ボタンがクリックされたときの処理
backToLevelButton.addEventListener('click', () => {
    showScreen(levelContainer);
});

// 初期化関数
function init() {
  createSubjectButtons();
  // 科目選択ボタンの生成後にハイスコアを読み込む
  setupLevelButtons();
  setupCountButtons();
}

// アプリケーションの開始
init();
