// camera.js

async function setupCamera() {
    const video = document.createElement('video');
    video.width = 640;
    video.height = 480;
    document.body.appendChild(video);

    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            video.play();
            resolve(video);
        };
    });
}

async function loadModel() {
    // COCO SSD モデルをロード
    return cocoSsd.load();
}

async function detectFruits(model, video) {
    // モデルによる物体の検出
    const predictions = await model.detect(video);
    return predictions;
}

function drawBox(predictions, video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.width;
    canvas.height = video.height;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach((prediction) => {
        if (prediction.class === 'apple' || prediction.class === 'banana' || prediction.class === 'orange') {
            const [x, y, width, height] = prediction.bbox;

            // 枠を描画
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            // ラベルを描画
            ctx.fillStyle = '#00FF00';
            ctx.font = '16px sans-serif';
            ctx.fillText(`${prediction.class} (${Math.round(prediction.score * 100)}%)`, x + 5, y + 20);
        }
    });
    return canvas;
}

async function runCoco() {
    const video = await setupCamera();
    const model = await loadModel();

    async function detectFrame() {
        const predictions = await detectFruits(model, video);
        const canvas = drawBox(predictions, video);
        requestAnimationFrame(detectFrame);
    }

    detectFrame();
}

runCoco();