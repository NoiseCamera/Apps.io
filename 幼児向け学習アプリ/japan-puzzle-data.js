// japan-puzzle-data.js

// 注意：このファイルを使用するには、各県の画像ファイルが必要です。
// 'assets/images/prefectures/' フォルダ内に、'hokkaido.png', 'aomori.png' ... のように
// 47都道府県すべての画像（背景が透明なPNG形式推奨）を配置してください。
//
// また、correctX, correctY の値は、
// 使用する地図画像(800x600)に合わせて調整が必要です。
// correctX/Y: 地図上の正しい位置（左上座標）
// width/height: ピース画像のサイズ

const REGIONS = {
    'hokkaido_tohoku': '北海道・東北',
    'kanto': '関東',
    'chubu': '中部',
    'kinki': '近畿',
    'chugoku_shikoku': '中国・四国',
    'kyushu_okinawa': '九州・沖縄'
};

// 全47都道府県のデータをここに追加します。
// 以下はサンプルデータです。座標(correctX, correctY)とサイズ(width, height)の調整が必要です。
const PREFECTURES_DATA = [
    // 北海道・東北
    { id: 'hokkaido', name: '北海道', region: 'hokkaido_tohoku', image: 'assets/images/prefectures/hokkaido.png', correctX: 550, correctY: 10, width: 200, height: 150 },
    { id: 'aomori', name: '青森県', region: 'hokkaido_tohoku', image: 'assets/images/prefectures/aomori.png', correctX: 580, correctY: 160, width: 90, height: 70 },
    { id: 'iwate', name: '岩手県', region: 'hokkaido_tohoku', image: 'assets/images/prefectures/iwate.png', correctX: 600, correctY: 200, width: 80, height: 100 },
    // ... 他の東北の県
    
    // 関東
    { id: 'tokyo', name: '東京都', region: 'kanto', image: 'assets/images/prefectures/tokyo.png', correctX: 555, correctY: 355, width: 60, height: 50 },
    { id: 'kanagawa', name: '神奈川県', region: 'kanto', image: 'assets/images/prefectures/kanagawa.png', correctX: 545, correctY: 380, width: 60, height: 50 },
    // ... 他の関東の県

    // 他の地方の県...
    { id: 'osaka', name: '大阪府', region: 'kinki', image: 'assets/images/prefectures/osaka.png', correctX: 420, correctY: 380, width: 50, height: 50 },
    { id: 'hiroshima', name: '広島県', region: 'chugoku_shikoku', image: 'assets/images/prefectures/hiroshima.png', correctX: 320, correctY: 380, width: 80, height: 60 },
    { id: 'fukuoka', name: '福岡県', region: 'kyushu_okinawa', image: 'assets/images/prefectures/fukuoka.png', correctX: 220, correctY: 430, width: 70, height: 60 },
    { id: 'okinawa', name: '沖縄県', region: 'kyushu_okinawa', image: 'assets/images/prefectures/okinawa.png', correctX: 100, correctY: 500, width: 80, height: 60 },
    { id: 'aichi', name: '愛知県', region: 'chubu', image: 'assets/images/prefectures/aichi.png', correctX: 480, correctY: 380, width: 70, height: 60 },
];