/**
 * 画像解析用ユーティリティ
 * PythonのOpenCVコードを参考に、JavaScriptで同等の処理を実装
 */
const ImageAnalysis = {
    /**
     * 2つの画像を比較して間違い箇所（矩形）のリストを返す
     * @param {HTMLImageElement} img1 
     * @param {HTMLImageElement} img2 
     * @returns {Array<{x, y, w, h}>} 間違い箇所の矩形リスト
     */
    analyze: function(img1, img2) {
        const width = img1.width;
        const height = img1.height;

        // 画像データを取得
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const getImageData = (img) => {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0);
            return ctx.getImageData(0, 0, width, height).data;
        };

        const data1 = getImageData(img1);
        const data2 = getImageData(img2);

        // 1. チャンネルごとにブラーをかけて差分をとる (色味の違いを検出するため)
        // グレースケールだと赤と青の輝度が近くて差が出ない場合があるため、RGBそれぞれで比較する
        const blurSize1 = 9; // 小さな違いも残すため少し小さめに
        const diffMap = new Uint8Array(width * height);
        
        for (let c = 0; c < 3; c++) { // R, G, B
            const ch1 = this.extractChannel(data1, c);
            const ch2 = this.extractChannel(data2, c);
            const blurred1 = this.boxBlur(ch1, width, height, blurSize1);
            const blurred2 = this.boxBlur(ch2, width, height, blurSize1);
            
            for (let i = 0; i < diffMap.length; i++) {
                const diff = Math.abs(blurred1[i] - blurred2[i]);
                // 各チャンネルの差分の最大値をとる
                if (diff > diffMap[i]) {
                    diffMap[i] = diff;
                }
            }
        }

        // 4. 二値化 (cv2.threshold(diff, 60, 255, cv2.THRESH_BINARY))
        // 元のコードでは60でしたが、JavaScript版ではPythonのCLAHE処理（コントラスト強調）
        // がないため、より小さな差を検出できるよう閾値を下げます。
        // 風船のような色の差が小さい間違いを検出するため、閾値をさらに下げます。(35 -> 25)
        const threshMap = this.threshold(diffMap, 20);

        // 5. 差分画像のブラー (cv2.GaussianBlur(diff, (11,11), 0))
        // ノイズを除去し、近い領域を結合する効果がある
        // キリンの柄のような散らばった間違いを一つにまとめるため、ブラーを強くします。(11 -> 21)
        const blurSize2 = 50;
        const blurredDiff = this.boxBlur(threshMap, width, height, blurSize2);
        
        // ブラー後の画像を再度二値化して明確な領域にする（輪郭抽出のため）
        const finalMap = this.threshold(blurredDiff, 10);

        // 6. 輪郭抽出 (cv2.findContours & cv2.boundingRect)
        const rects = this.findConnectedComponents(finalMap, width, height);

        // 7. サイズでフィルタリング (w > 15 and h > 15)
        const filteredRects = rects.filter(r => r.w > 15 && r.h > 15);

        return filteredRects;
    },

    /**
     * RGBAデータから指定したチャンネル(0:R, 1:G, 2:B)を抽出する
     */
    extractChannel: function(data, channelOffset) {
        const len = data.length / 4;
        const channel = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            channel[i] = data[i * 4 + channelOffset];
        }
        return channel;
    },

    /**
     * RGBAデータをグレースケール(Uint8Array)に変換
     */
    toGrayscale: function(data) {
        const gray = new Uint8Array(data.length / 4);
        for (let i = 0; i < gray.length; i++) {
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];
            // 輝度計算: 0.299*R + 0.587*G + 0.114*B
            gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
        }
        return gray;
    },

    /**
     * 簡易的なボックスブラー（ガウシアンブラーの近似として使用）
     * セパラブルフィルタとして実装（水平パス -> 垂直パス）
     */
    boxBlur: function(data, w, h, size) {
        const radius = Math.floor(size / 2);
        const len = data.length;
        const temp = new Float32Array(len);
        const output = new Uint8Array(len);

        // 水平方向
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let sum = 0;
                let count = 0;
                for (let k = -radius; k <= radius; k++) {
                    const px = x + k;
                    if (px >= 0 && px < w) {
                        sum += data[y * w + px];
                        count++;
                    }
                }
                temp[y * w + x] = sum / count;
            }
        }

        // 垂直方向
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                let sum = 0;
                let count = 0;
                for (let k = -radius; k <= radius; k++) {
                    const py = y + k;
                    if (py >= 0 && py < h) {
                        sum += temp[py * w + x];
                        count++;
                    }
                }
                output[y * w + x] = sum / count;
            }
        }
        return output;
    },

    /**
     * 2つの画像の差分の絶対値を計算
     */
    absDiff: function(d1, d2) {
        const diff = new Uint8Array(d1.length);
        for (let i = 0; i < d1.length; i++) {
            diff[i] = Math.abs(d1[i] - d2[i]);
        }
        return diff;
    },

    /**
     * 二値化処理
     */
    threshold: function(data, thresh) {
        const output = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
            output[i] = data[i] > thresh ? 255 : 0;
        }
        return output;
    },

    /**
     * 連結成分（領域）の抽出
     * cv2.findContours + cv2.boundingRect に相当
     */
    findConnectedComponents: function(data, w, h) {
        const visited = new Uint8Array(data.length);
        const rects = [];
        const stack = [];

        for (let i = 0; i < data.length; i++) {
            // 輝度がある（白）かつ未訪問のピクセルを見つけたら探索開始
            if (data[i] === 255 && visited[i] === 0) {
                let minX = i % w;
                let maxX = i % w;
                let minY = Math.floor(i / w);
                let maxY = Math.floor(i / w);

                stack.push(i);
                visited[i] = 1;

                while (stack.length > 0) {
                    const idx = stack.pop();
                    const cx = idx % w;
                    const cy = Math.floor(idx / w);

                    if (cx < minX) minX = cx;
                    if (cx > maxX) maxX = cx;
                    if (cy < minY) minY = cy;
                    if (cy > maxY) maxY = cy;

                    // 4近傍探索
                    const neighbors = [idx - 1, idx + 1, idx - w, idx + w];
                    for (const nIdx of neighbors) {
                        if (nIdx >= 0 && nIdx < data.length && data[nIdx] === 255 && visited[nIdx] === 0) {
                            // 左右の端またぎ防止
                            const nx = nIdx % w;
                            if (Math.abs(nx - cx) > 1) continue;

                            visited[nIdx] = 1;
                            stack.push(nIdx);
                        }
                    }
                }
                rects.push({
                    x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1
                });
            }
        }
        return rects;
    }
};
