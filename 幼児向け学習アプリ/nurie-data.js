// nurie-data.js

// ぬりえの絵のリスト
// ここに新しいぬりえの画像を追加していくと、自動的に選択画面に表示されます。
// id: 他の絵と重ならないユニークな名前（半角英数字）
// name: 選択画面に表示される名前
// src: 画像ファイルのパス
const NURIE_IMAGES = [
    { id: 'ahiru', name: 'あひる', src: 'assets/images/nurie/あひる.png' },
    { id: 'inu', name: 'いぬ', src: 'assets/images/nurie/いぬ.png' },
    { id: 'ushi', name: 'うし', src: 'assets/images/nurie/うし.png' },
    { id: 'kaeru', name: 'かえる', src: 'assets/images/nurie/かえる.png' },
    { id: 'kaba', name: 'かば', src: 'assets/images/nurie/かば.png' },
    { id: 'kame', name: 'かめ', src: 'assets/images/nurie/かめ.png' },
    { id: 'kangaroo', name: 'かんがるー', src: 'assets/images/nurie/かんがるー.png' },
    { id: 'kitsune', name: 'きつね', src: 'assets/images/nurie/きつね.png' },
    { id: 'kirin', name: 'きりん', src: 'assets/images/nurie/きりん.png' },
    { id: 'kuma', name: 'くま', src: 'assets/images/nurie/くま.png' },
    { id: 'sakana', name: 'さかな', src: 'assets/images/nurie/さかな.png' },
    { id: 'saru', name: 'さる', src: 'assets/images/nurie/さる.png' },
    { id: 'zou', name: 'ぞう', src: 'assets/images/nurie/ぞう.png' },
    { id: 'niwatori', name: 'にわとり', src: 'assets/images/nurie/にわとり.png' },
    { id: 'usagi', name: 'うさぎ', src: 'assets/images/nurie/ぬりえウサギ.png' },
    { id: 'hachi', name: 'はち', src: 'assets/images/nurie/はち.png' },
    { id: 'panda', name: 'ぱんだ', src: 'assets/images/nurie/ぱんだ.png' },
    { id: 'fukurou', name: 'ふくろう', src: 'assets/images/nurie/ふくろう.png' },
    { id: 'buta', name: 'ぶた', src: 'assets/images/nurie/ぶた.png' },
    { id: 'raion', name: 'らいおん', src: 'assets/images/nurie/らいおん.png' },
    { id: 'risu', name: 'りす', src: 'assets/images/nurie/りす.png' },
    // --- のりもの ---
    { id: 'patrol_car', name: 'パトカー', src: 'assets/images/nurie/パトカー.png' },
    { id: 'ambulance', name: 'きゅうきゅうしゃ', src: 'assets/images/nurie/きゅうきゅうしゃ.png' },
    { id: 'garbage_truck', name: 'ゴミしゅうしゅうしゃ', src: 'assets/images/nurie/ゴミしゅうしゅうしゃ.png' },
    { id: 'motorcycle', name: 'バイク', src: 'assets/images/nurie/バイク.png' },
    { id: 'road_roller', name: 'ロードローラー', src: 'assets/images/nurie/ロードローラー.png' },
    { id: 'tractor', name: 'トラクター', src: 'assets/images/nurie/トラクター.png' },
    { id: 'forklift', name: 'フォークリフター', src: 'assets/images/nurie/フォークリフター.png' },
    { id: 'garbage_truck2', name: 'ゴミしゅうしゅうしゃ２', src: 'assets/images/nurie/ゴミしゅうしゅうしゃ２.png' },
    { id: 'crane', name: 'クレーン', src: 'assets/images/nurie/クレーン.png' },
    { id: 'mixer_truck', name: 'ミキサーしゃ', src: 'assets/images/nurie/ミキサーしゃ.png' },
    { id: 'shovel_car', name: 'ショベルカー', src: 'assets/images/nurie/ショベルカー.png' },
    { id: 'bulldozer', name: 'ブルドーザー', src: 'assets/images/nurie/ブルドーザー.png' },
    { id: 'truck', name: 'トラック', src: 'assets/images/nurie/トラック.png' },
    { id: 'car', name: 'くるま', src: 'assets/images/nurie/くるま.png' },
    { id: 'yacht', name: 'ヨット', src: 'assets/images/nurie/ヨット.png' },
    { id: 'airplane', name: 'ひこうき', src: 'assets/images/nurie/ひこうき.png' },
    { id: 'steam_locomotive', name: 'きかんしゃ', src: 'assets/images/nurie/きかんしゃ.png' },
    { id: 'school_bus', name: 'スクールバス', src: 'assets/images/nurie/スクールバス.png' },
    { id: 'patrol_car2', name: 'パトカー２', src: 'assets/images/nurie/パトカー２.png' },
    { id: 'fire_truck', name: 'しょうぼうしゃ', src: 'assets/images/nurie/しょうぼうしゃ.png' }
];