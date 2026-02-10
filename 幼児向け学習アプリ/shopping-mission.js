document.addEventListener('DOMContentLoaded', () => {
    // --- 定数・設定 ---
    const ITEMS = [
        { id: 'apple', name: 'リンゴ', emoji: '🍎', price: 100 },
        { id: 'banana', name: 'バナナ', emoji: '🍌', price: 50 },
        { id: 'orange', name: 'みかん', emoji: '🍊', price: 40 },
        { id: 'grape', name: 'ブドウ', emoji: '🍇', price: 150 },
        { id: 'bread', name: 'パン', emoji: '🍞', price: 120 },
        { id: 'milk', name: 'ぎゅうにゅう', emoji: '🥛', price: 180 },
        { id: 'carrot', name: 'にんじん', emoji: '🥕', price: 30 },
        { id: 'piman', name: 'ピーマン', emoji: '🫑', price: 40 },
        { id: 'cake', name: 'ケーキ', emoji: '🍰', price: 250 },
        { id: 'candy', name: 'アメ', emoji: '🍬', price: 10 }
    ];

    // --- DOM要素 ---
    const instructionText = document.getElementById('instruction-text');
    const shelfItemsContainer = document.getElementById('shelf-items');
    const basketArea = document.getElementById('basket-area');
    const basketContent = document.getElementById('basket-content');
    const basketPlaceholder = document.getElementById('basket-placeholder');
    const checkBtn = document.getElementById('check-btn');
    const scoreEl = document.getElementById('score');
    const resultModal = document.getElementById('result-modal');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const resultItemsContainer = document.getElementById('result-items-container');
    const nextBtn = document.getElementById('next-btn');
    // レシートモーダル用
    const receiptModal = document.getElementById('receipt-modal');
    const receiptDisplayArea = document.getElementById('receipt-display-area');
    const receiptNextBtn = document.getElementById('receipt-next-btn');
    // フィードバックモーダル用
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackMessage = document.getElementById('feedback-message');
    const feedbackCloseBtn = document.getElementById('feedback-close-btn');
    
    const calcModeToggle = document.getElementById('calc-mode-toggle');
    const moneyDisplay = document.getElementById('money-display');
    const totalPriceEl = document.getElementById('total-price');
    const budgetPriceEl = document.getElementById('budget-price');
    const budgetAlert = document.getElementById('budget-alert');
    // お釣りクイズ用
    const changeQuizModal = document.getElementById('change-quiz-modal');
    const quizTotalEl = document.getElementById('quiz-total');
    const quizPaidEl = document.getElementById('quiz-paid');
    const quizAnswerDisplay = document.getElementById('quiz-answer-display');
    const keypad = document.getElementById('keypad');
    const changeCoinsArea = document.getElementById('change-coins-area');

    // 音声
    const correctSound = document.getElementById('correct-sound');
    const incorrectSound = document.getElementById('incorrect-sound');
    const fanfareSound = document.getElementById('fanfare-sound');
    const popSound = document.getElementById('pop-sound'); // カゴに入れた音（なければ省略可）

    // --- 状態 ---
    let currentProblem = {
        targets: [], // { item, count } の配列
        budget: 0
    };
    let basketItems = []; // { id, emoji, price, name }
    let score = 0;
    let isCalcMode = false;
    let quizState = {
        total: 0,
        paid: 0,
        input: ''
    };

    // --- 初期化 ---
    function init() {
        setupShelf();
        setupEventListeners();
        startNewProblem();
    }

    // 棚のセットアップ（アイテム一覧を表示）
    function setupShelf() {
        shelfItemsContainer.innerHTML = '';
        ITEMS.forEach(item => {
            const el = document.createElement('div');
            el.className = 'item-source';
            el.dataset.id = item.id;
            el.dataset.emoji = item.emoji;
            el.dataset.price = item.price;
            el.dataset.name = item.name;
            el.innerHTML = `
                <span class="item-emoji">${item.emoji}</span>
                <span class="item-name">${item.name}</span>
                <span class="item-price hidden">${item.price}円</span>
            `;
            
            // タッチ/マウスイベントの設定
            el.addEventListener('mousedown', handleDragStart);
            el.addEventListener('touchstart', handleDragStart, { passive: false });

            shelfItemsContainer.appendChild(el);
        });
    }

    function setupEventListeners() {
        checkBtn.addEventListener('click', checkAnswer);
        nextBtn.addEventListener('click', () => {
            resultModal.classList.add('hidden');
            startNewProblem();
        });
        receiptNextBtn.addEventListener('click', () => {
            receiptModal.classList.add('hidden');
            startNewProblem();
        });
        feedbackCloseBtn.addEventListener('click', () => {
            feedbackModal.classList.add('hidden');
        });
        
        calcModeToggle.addEventListener('change', (e) => {
            isCalcMode = e.target.checked;
            toggleCalcMode();
        });

        // キーパッドのイベント
        keypad.addEventListener('click', (e) => {
            if (e.target.classList.contains('key-btn')) {
                const num = e.target.dataset.num;
                if (num !== undefined) {
                    handleKeyInput(num);
                } else if (e.target.id === 'key-clear') {
                    handleKeyClear();
                } else if (e.target.id === 'key-enter') {
                    checkChangeQuizAnswer();
                }
            }
        });
    }

    function toggleCalcMode() {
        const priceTags = document.querySelectorAll('.item-price');
        if (isCalcMode) {
            moneyDisplay.classList.remove('hidden');
            priceTags.forEach(tag => tag.classList.remove('hidden'));
        } else {
            moneyDisplay.classList.add('hidden');
            priceTags.forEach(tag => tag.classList.add('hidden'));
        }
        updateBasketDisplay(); // 合計金額の再計算のため
    }

    // --- ゲームロジック ---

    function startNewProblem() {
        // 1〜2種類のアイテムを選ぶ
        const numTypes = Math.random() < 0.5 ? 1 : 2;
        
        // シャッフルして先頭から取る
        const shuffled = [...ITEMS].sort(() => 0.5 - Math.random());
        const selectedItems = shuffled.slice(0, numTypes);
        
        const targets = selectedItems.map(item => {
            return {
                item: item,
                count: Math.floor(Math.random() * 3) + 1 // 1〜3個
            };
        });

        const totalBudget = targets.reduce((sum, t) => sum + (t.item.price * t.count), 0);

        currentProblem = {
            targets: targets,
            budget: totalBudget
        };

        // カゴを空にする
        basketItems = [];
        updateBasketDisplay();

        // 指示文の更新
        const instructionParts = targets.map(t => 
            `<span class="highlight-text">${t.item.name}</span>を<span class="highlight-text">${t.count}こ</span>`
        );
        
        instructionText.innerHTML = instructionParts.join(' と ') + ' カゴに いれてね';
        
        budgetPriceEl.textContent = currentProblem.budget;
    }

    // --- ドラッグ＆ドロップ処理 ---
    let activeDrag = null; // { element, emoji, id, startX, startY }

    function handleDragStart(e) {
        e.preventDefault(); // スクロール防止など
        const target = e.currentTarget;
        const emoji = target.dataset.emoji;
        const id = target.dataset.id;
        const price = parseInt(target.dataset.price);
        const name = target.dataset.name;

        // タッチかマウスか座標取得
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // クローンを作成して追従させる
        const clone = document.createElement('div');
        clone.className = 'drag-clone';
        clone.textContent = emoji;
        document.body.appendChild(clone);

        // 初期位置
        clone.style.left = clientX + 'px';
        clone.style.top = clientY + 'px';

        activeDrag = {
            clone: clone,
            emoji: emoji,
            id: id,
            price: price,
            name: name
        };

        // move/end イベントを document に登録
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);
    }

    function handleDragMove(e) {
        if (!activeDrag) return;
        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        activeDrag.clone.style.left = clientX + 'px';
        activeDrag.clone.style.top = clientY + 'px';

        // カゴの上に来たら視覚的フィードバック
        const basketRect = basketArea.getBoundingClientRect();
        if (clientX >= basketRect.left && clientX <= basketRect.right &&
            clientY >= basketRect.top && clientY <= basketRect.bottom) {
            basketArea.classList.add('drag-over');
        } else {
            basketArea.classList.remove('drag-over');
        }
    }

    function handleDragEnd(e) {
        if (!activeDrag) return;

        // フィードバックを解除
        basketArea.classList.remove('drag-over');

        // ドロップ位置の判定
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        // カゴエリアの矩形を取得
        const basketRect = basketArea.getBoundingClientRect();

        // カゴの中に入っているか？
        if (clientX >= basketRect.left && clientX <= basketRect.right &&
            clientY >= basketRect.top && clientY <= basketRect.bottom) {
            
            // カゴに追加
            addItemToBasket(activeDrag.id, activeDrag.emoji, activeDrag.price, activeDrag.name);

            // 計算モードなら値段をポップアップ表示
            if (isCalcMode) {
                showPricePopup(clientX, clientY, activeDrag.price);
            }
        }

        // クリーンアップ
        activeDrag.clone.remove();
        activeDrag = null;

        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
    }

    function addItemToBasket(id, emoji, price, name) {
        basketItems.push({ id, emoji, price, name });
        playSE(popSound); // ポップ音（あれば）
        updateBasketDisplay();
    }

    function removeItemFromBasket(index, e) {
        const item = basketItems[index];
        
        // 計算モードならマイナスのポップアップを表示
        if (isCalcMode && item && e) {
            showPricePopup(e.clientX, e.clientY, item.price, true);
        }

        basketItems.splice(index, 1);
        playSE(popSound);
        updateBasketDisplay();
    }

    function updateBasketDisplay() {
        basketContent.innerHTML = '';
        
        // 合計金額の計算
        const total = basketItems.reduce((sum, item) => sum + item.price, 0);
        totalPriceEl.textContent = total;

        // 予算オーバー警告
        if (isCalcMode && total > currentProblem.budget) {
            moneyDisplay.classList.add('warning');
            totalPriceEl.classList.add('over-budget');
            budgetAlert.classList.remove('hidden');
        } else {
            moneyDisplay.classList.remove('warning');
            totalPriceEl.classList.remove('over-budget');
            budgetAlert.classList.add('hidden');
        }
        
        if (basketItems.length === 0) {
            basketContent.appendChild(basketPlaceholder);
            basketPlaceholder.style.display = 'block';
        } else {
            basketPlaceholder.style.display = 'none';
            
            basketItems.forEach((item, index) => {
                const el = document.createElement('div');
                el.className = 'basket-item';
                el.textContent = item.emoji;
                el.title = 'タップして戻す';
                
                // クリックで削除
                el.addEventListener('click', (e) => removeItemFromBasket(index, e));
                
                basketContent.appendChild(el);
            });
        }
    }

    // --- 判定 ---
    function checkAnswer() {
        // 合計金額
        const total = basketItems.reduce((sum, item) => sum + item.price, 0);

        // アニメーションクラスをリセット
        const itemElements = basketContent.querySelectorAll('.basket-item');
        itemElements.forEach(el => {
            el.classList.remove('bounce', 'shake');
            el.style.backgroundColor = '';
        });

        // 判定ロジック
        let isCorrectCount = true;
        let wrongItems = false;
        let missingItems = false;

        // ターゲットごとの個数チェック
        currentProblem.targets.forEach(target => {
            const count = basketItems.filter(item => item.id === target.item.id).length;
            if (count !== target.count) {
                isCorrectCount = false;
                if (count < target.count) missingItems = true;
            }
        });

        // ターゲット以外のアイテムが含まれていないかチェック
        const targetIds = currentProblem.targets.map(t => t.item.id);
        const unknownItems = basketItems.filter(item => !targetIds.includes(item.id));
        if (unknownItems.length > 0) {
            wrongItems = true;
        }

        // 正解条件: 指定個数あり、余計なものなし、(計算モードなら)予算内
        const isBudgetOk = !isCalcMode || (total <= currentProblem.budget);

        if (isCorrectCount && !wrongItems && isBudgetOk) {
            // 正解！
            playSE(correctSound);
            score++;
            scoreEl.textContent = score;
            
            // ご褒美の星を追加
            if (typeof addPoints === 'function') {
                addPoints(1);
            }
            
            // カゴの中のアイテムを跳ねさせる
            itemElements.forEach((item, i) => {
                setTimeout(() => {
                    item.classList.add('bounce');
                }, i * 100); // 順番に跳ねるようにタイミングをずらす
            });
            
            if (isCalcMode) {
                // 計算モードならお釣りクイズへ
                setTimeout(() => {
                    startChangeQuiz(total);
                }, 1000);
            } else {
                // 通常モードなら結果表示へ
                showResultModal();
            }
        } else {
            // 不正解
            playSE(incorrectSound);
            
            // 間違ったアイテムを震わせる
            basketItems.forEach((item, index) => {
                if (!targetIds.includes(item.id)) {
                    if (itemElements[index]) {
                        itemElements[index].classList.add('shake');
                    }
                }
            });

            // ヒントを表示
            let message = '';
            if (wrongItems) {
                message = 'ちがうものが はいっているよ';
            } else if (missingItems) {
                message = 'まだ たりないよ';
            } else if (isCalcMode && total > currentProblem.budget) {
                message = 'よさんオーバーだよ！';
            } else {
                message = 'かずが ちがうよ';
            }
            
            // アニメーションが見えるように少し待ってからアラートを出す
            setTimeout(() => {
                showFeedback(message);
            }, 500);
        }
    }

    function showResultModal() {
        if (isCalcMode) {
            // 計算モード：レシートモーダルを表示
            createReceipt();
            playSE(fanfareSound);
            receiptModal.classList.remove('hidden');
            
            // ぴったり賞判定
            const total = basketItems.reduce((sum, item) => sum + item.price, 0);
            if (total === currentProblem.budget && typeof addPoints === 'function') {
                addPoints(3); // ぴったり賞ポイント
            }
        } else {
            // 通常モード：結果モーダルを表示
            resultTitle.textContent = 'すごい！';
            resultTitle.style.color = '#e65100';
            resultMessage.innerHTML = 'ぜんぶ かえたね！';
            
            // 買ったアイテムを表示
            resultItemsContainer.innerHTML = '';
            basketItems.forEach((item, index) => {
                const el = document.createElement('div');
                el.className = 'result-item-icon';
                el.textContent = item.emoji;
                // 少しずつ遅らせて表示
                el.style.animationDelay = `${index * 0.1}s`;
                resultItemsContainer.appendChild(el);
            });
            
            playSE(fanfareSound);
            resultModal.classList.remove('hidden');
        }
    }

    // --- お釣りクイズ ---
    function startChangeQuiz(total) {
        // おあずかり金額を決定（合計より大きい、キリの良い金額）
        let candidates = [];
        // 100円単位で切り上げ
        const ceil100 = Math.ceil((total + 1) / 100) * 100;
        candidates.push(ceil100);
        
        // 500円単位
        const ceil500 = Math.ceil((total + 1) / 500) * 500;
        if (!candidates.includes(ceil500)) candidates.push(ceil500);
        
        // 1000円単位
        const ceil1000 = Math.ceil((total + 1) / 1000) * 1000;
        if (!candidates.includes(ceil1000)) candidates.push(ceil1000);

        // ランダムに選択
        const paid = candidates[Math.floor(Math.random() * candidates.length)];

        quizState = {
            total: total,
            paid: paid,
            input: ''
        };

        quizTotalEl.textContent = total;
        quizPaidEl.textContent = paid;
        updateQuizDisplay();

        // お釣りの硬貨を表示
        changeCoinsArea.innerHTML = '';
        const change = paid - total;
        if (change > 0) {
            const coins = [500, 100, 50, 10]; // 幼児向けなので10円単位まで
            let remaining = change;
            
            coins.forEach(val => {
                const count = Math.floor(remaining / val);
                remaining %= val;
                for(let i = 0; i < count; i++) {
                    const coin = document.createElement('div');
                    coin.className = `coin coin-${val}`;
                    coin.textContent = val;
                    changeCoinsArea.appendChild(coin);
                }
            });
        }
        
        changeQuizModal.classList.remove('hidden');
    }

    function handleKeyInput(num) {
        if (quizState.input.length < 5) { // 桁数制限
            quizState.input += num;
            updateQuizDisplay();
        }
    }

    function handleKeyClear() {
        quizState.input = '';
        updateQuizDisplay();
    }

    function updateQuizDisplay() {
        quizAnswerDisplay.textContent = quizState.input === '' ? '0' : quizState.input;
    }

    function checkChangeQuizAnswer() {
        const answer = parseInt(quizState.input || '0');
        const correctChange = quizState.paid - quizState.total;

        if (answer === correctChange) {
            playSE(correctSound);
            changeQuizModal.classList.add('hidden');
            showResultModal();
        } else {
            playSE(incorrectSound);
            alert('あれ？ もういちど けいさんしてみてね');
            handleKeyClear();
        }
    }

    function createReceipt() {
        const container = receiptDisplayArea;
        container.innerHTML = '';

        // 計算モードでない場合はレシートを表示しない
        if (!isCalcMode) {
            return;
        }

        const summary = {};
        let total = 0;
        
        basketItems.forEach(item => {
            if (!summary[item.id]) {
                summary[item.id] = { name: item.name, price: item.price, count: 0 };
            }
            summary[item.id].count++;
            total += item.price;
        });

        const list = document.createElement('ul');
        list.className = 'receipt-list';

        for (const id in summary) {
            const item = summary[id];
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="receipt-name">${item.name} (@${item.price}円)</span>
                <span class="receipt-count">x${item.count}</span>
                <span class="receipt-price">${item.price * item.count}円</span>
            `;
            list.appendChild(li);
        }
        container.appendChild(list);

        const totalDiv = document.createElement('div');
        totalDiv.className = 'receipt-total';
        totalDiv.textContent = `ごうけい: ${total}円`;
        container.appendChild(totalDiv);

        // おあずかり・おつりの表示を追加
        if (quizState.paid > 0) {
            const paidDiv = document.createElement('div');
            paidDiv.className = 'receipt-detail';
            paidDiv.textContent = `おあずかり: ${quizState.paid}円`;
            container.appendChild(paidDiv);

            const changeDiv = document.createElement('div');
            changeDiv.className = 'receipt-detail';
            changeDiv.textContent = `おつり: ${quizState.paid - total}円`;
            container.appendChild(changeDiv);
        }
    }

    function showFeedback(msg) {
        feedbackMessage.textContent = msg;
        feedbackModal.classList.remove('hidden');
    }

    function showPricePopup(x, y, price, isNegative = false) {
        const popup = document.createElement('div');
        popup.className = 'price-popup';
        
        if (isNegative) {
            popup.textContent = `-${price}円`;
            popup.classList.add('negative');
        } else {
            popup.textContent = `+${price}円`;
        }
        
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        document.body.appendChild(popup);

        popup.addEventListener('animationend', () => {
            popup.remove();
        });
    }

    function playSE(audio) {
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(()=>{});
        }
    }

    init();
});