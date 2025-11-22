// japan-puzzle-data.js
// 全47都道府県のデータ

const REGIONS = {
    'hokkaido_tohoku': { name: '北海道・東北', color: '#ff8a80' },
    'kanto': { name: '関東', color: '#82b1ff' },
    'chubu': { name: '中部', color: '#b9f6ca' },
    'kinki': { name: '近畿', color: '#ffff8d' },
    'chugoku_shikoku': { name: '中国・四国', color: '#ea80fc' },
    'kyushu_okinawa': { name: '九州・沖縄', color: '#ff9e80' }
};

// 全47都道府県のデータ
// width/heightは各SVGの大まかなサイズ（ピクセル単位）
const PREFECTURES_DATA = [
    // 北海道・東北 (7県)
    { id: 'hokkaido', name: '北海道', region: 'hokkaido_tohoku', width: 200, height: 150 },
    { id: 'aomori', name: '青森県', region: 'hokkaido_tohoku', width: 90, height: 70 },
    { id: 'iwate', name: '岩手県', region: 'hokkaido_tohoku', width: 80, height: 100 },
    { id: 'miyagi', name: '宮城県', region: 'hokkaido_tohoku', width: 70, height: 80 },
    { id: 'akita', name: '秋田県', region: 'hokkaido_tohoku', width: 70, height: 90 },
    { id: 'yamagata', name: '山形県', region: 'hokkaido_tohoku', width: 60, height: 80 },
    { id: 'fukushima', name: '福島県', region: 'hokkaido_tohoku', width: 80, height: 90 },

    // 関東 (7都県)
    { id: 'ibaraki', name: '茨城県', region: 'kanto', width: 70, height: 70 },
    { id: 'tochigi', name: '栃木県', region: 'kanto', width: 60, height: 60 },
    { id: 'gunma', name: '群馬県', region: 'kanto', width: 60, height: 60 },
    { id: 'saitama', name: '埼玉県', region: 'kanto', width: 50, height: 50 },
    { id: 'chiba', name: '千葉県', region: 'kanto', width: 70, height: 70 },
    { id: 'tokyo', name: '東京都', region: 'kanto', width: 60, height: 50 },
    { id: 'kanagawa', name: '神奈川県', region: 'kanto', width: 60, height: 50 },

    // 中部 (9県)
    { id: 'niigata', name: '新潟県', region: 'chubu', width: 90, height: 100 },
    { id: 'toyama', name: '富山県', region: 'chubu', width: 60, height: 50 },
    { id: 'ishikawa', name: '石川県', region: 'chubu', width: 60, height: 70 },
    { id: 'fukui', name: '福井県', region: 'chubu', width: 60, height: 70 },
    { id: 'yamanashi', name: '山梨県', region: 'chubu', width: 50, height: 50 },
    { id: 'nagano', name: '長野県', region: 'chubu', width: 80, height: 90 },
    { id: 'gifu', name: '岐阜県', region: 'chubu', width: 70, height: 80 },
    { id: 'shizuoka', name: '静岡県', region: 'chubu', width: 90, height: 60 },
    { id: 'aichi', name: '愛知県', region: 'chubu', width: 70, height: 60 },

    // 近畿 (7府県)
    { id: 'mie', name: '三重県', region: 'kinki', width: 70, height: 80 },
    { id: 'shiga', name: '滋賀県', region: 'kinki', width: 50, height: 60 },
    { id: 'kyoto', name: '京都府', region: 'kinki', width: 60, height: 70 },
    { id: 'osaka', name: '大阪府', region: 'kinki', width: 50, height: 50 },
    { id: 'hyogo', name: '兵庫県', region: 'kinki', width: 80, height: 70 },
    { id: 'nara', name: '奈良県', region: 'kinki', width: 50, height: 50 },
    { id: 'wakayama', name: '和歌山県', region: 'kinki', width: 60, height: 70 },

    // 中国・四国 (9県)
    { id: 'tottori', name: '鳥取県', region: 'chugoku_shikoku', width: 60, height: 40 },
    { id: 'shimane', name: '島根県', region: 'chugoku_shikoku', width: 80, height: 50 },
    { id: 'okayama', name: '岡山県', region: 'chugoku_shikoku', width: 70, height: 50 },
    { id: 'hiroshima', name: '広島県', region: 'chugoku_shikoku', width: 80, height: 60 },
    { id: 'yamaguchi', name: '山口県', region: 'chugoku_shikoku', width: 90, height: 50 },
    { id: 'tokushima', name: '徳島県', region: 'chugoku_shikoku', width: 60, height: 50 },
    { id: 'kagawa', name: '香川県', region: 'chugoku_shikoku', width: 60, height: 40 },
    { id: 'ehime', name: '愛媛県', region: 'chugoku_shikoku', width: 80, height: 70 },
    { id: 'kochi', name: '高知県', region: 'chugoku_shikoku', width: 90, height: 50 },

    // 九州・沖縄 (8県)
    { id: 'fukuoka', name: '福岡県', region: 'kyushu_okinawa', width: 70, height: 60 },
    { id: 'saga', name: '佐賀県', region: 'kyushu_okinawa', width: 50, height: 50 },
    { id: 'nagasaki', name: '長崎県', region: 'kyushu_okinawa', width: 80, height: 90 },
    { id: 'kumamoto', name: '熊本県', region: 'kyushu_okinawa', width: 70, height: 80 },
    { id: 'oita', name: '大分県', region: 'kyushu_okinawa', width: 70, height: 70 },
    { id: 'miyazaki', name: '宮崎県', region: 'kyushu_okinawa', width: 60, height: 80 },
    { id: 'kagoshima', name: '鹿児島県', region: 'kyushu_okinawa', width: 80, height: 100 },
    { id: 'okinawa', name: '沖縄県', region: 'kyushu_okinawa', width: 80, height: 90 }
];