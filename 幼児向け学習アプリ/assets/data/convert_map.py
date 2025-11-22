import json
import os
import math

# 設定: 出力するSVGのサイズ
SVG_WIDTH = 800
SVG_HEIGHT = 800
PADDING = 20  # 地図の周囲の余白

def convert_topojson_to_svgs(input_file, output_dir):
    # JSONデータの読み込み
    with open(input_file, 'r', encoding='utf-8') as f:
        topology = json.load(f)

    # Transformパラメータの取得 (TopoJSONの圧縮座標を戻すため)
    scale = topology['transform']['scale']
    translate = topology['transform']['translate']
    
    # Arcs（すべての線の断片）をデコードしてキャッシュする
    decoded_arcs = decode_arcs(topology['arcs'], scale, translate)
    
    # 全体の境界ボックス（Bounding Box）を計算して、日本列島全体を収める座標変換係数を作る
    all_points = []
    for arc in decoded_arcs:
        all_points.extend(arc)
    
    min_x = min(p[0] for p in all_points)
    max_x = max(p[0] for p in all_points)
    min_y = min(p[1] for p in all_points)
    max_y = max(p[1] for p in all_points)
    
    geo_width = max_x - min_x
    geo_height = max_y - min_y
    
    # 縦横比を維持して画面にフィットさせるスケール計算
    scale_x = (SVG_WIDTH - PADDING * 2) / geo_width
    scale_y = (SVG_HEIGHT - PADDING * 2) / geo_height
    final_scale = min(scale_x, scale_y)
    
    # センタリング用のオフセット
    offset_x = (SVG_WIDTH - geo_width * final_scale) / 2
    offset_y = (SVG_HEIGHT - geo_height * final_scale) / 2

    # 座標変換関数 (経度緯度 -> SVG座標)
    # SVGはY軸が下向きなので、緯度は反転させる必要があります
    def project(lon, lat):
        x = (lon - min_x) * final_scale + offset_x
        # 緯度は最大値から引くことでY軸を反転
        y = (max_y - lat) * final_scale + offset_y 
        return x, y

    # 出力ディレクトリ作成
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # 都道府県（Objects）ごとにSVGを生成
    objects = topology['objects']['JPN_adm1']['geometries']
    
    print(f"処理開始: {len(objects)} 都道府県のデータが見つかりました。")

    for obj in objects:
        props = obj['properties']
        pref_name = props['NAME_1'] # 英語名 (例: Hokkaido)
        
        # マルチポリゴン対応 (離島など複数の閉じた領域を持つ場合)
        # TopoJSONの仕様: GeometryがPolygonかMultiPolygonかで構造が違う
        paths_data = []
        
        if obj['type'] == 'Polygon':
            arcs_indices_list = obj['arcs'] # [[[arc_id, ...]], [[hole...]]]
        elif obj['type'] == 'MultiPolygon':
            arcs_indices_list = [item[0] for item in obj['arcs']] # 簡略化のため外周のみ取得
        else:
            continue

        path_commands = []
        
        for ring_indices in arcs_indices_list:
            # 1つの閉じた領域（島や県境）のパスを作成
            # 実際にはリングは [outer, inner, inner...] の順だが、簡単のため全て描画
            # 必要に応じてPolygon構造を深く解析する必要があるが、パズル用ならこれで十分
            if isinstance(ring_indices, int): ring_indices = [ring_indices] # フォーマット揺れ対応
            
            # パスの開始点
            current_path = []
            
            for i, arc_idx in enumerate(ring_indices):
                # TopoJSONの仕様: 負のインデックスは逆向きのArcを意味する
                if arc_idx < 0:
                    arc = decoded_arcs[~arc_idx][::-1] # ビット反転して逆順に
                else:
                    arc = decoded_arcs[arc_idx]
                
                # SVG座標に変換
                converted_points = [project(p[0], p[1]) for p in arc]
                
                if i == 0:
                    start = converted_points[0]
                    current_path.append(f"M {start[0]:.2f},{start[1]:.2f}")
                    # 2点目以降を追加
                    for p in converted_points[1:]:
                        current_path.append(f"L {p[0]:.2f},{p[1]:.2f}")
                else:
                    # 接続部分は重複するため先頭をスキップ
                    for p in converted_points[1:]:
                        current_path.append(f"L {p[0]:.2f},{p[1]:.2f}")
            
            current_path.append("Z") # パスを閉じる
            path_commands.append(" ".join(current_path))

        # SVGファイル書き出し
        svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SVG_WIDTH} {SVG_HEIGHT}">
  <path fill="#CCCCCC" stroke="#FFFFFF" stroke-width="1" d="{' '.join(path_commands)}" />
</svg>"""
        
        filename = f"{output_dir}/{pref_name}.svg"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(svg_content)
            
    print(f"完了: {output_dir} にすべてのSVGを出力しました。")

def decode_arcs(arcs, scale, translate):
    """TopoJSONの圧縮されたArc座標を実際の緯度経度に戻す"""
    decoded = []
    for arc in arcs:
        points = []
        x, y = 0, 0
        for dx, dy in arc:
            x += dx
            y += dy
            actual_x = x * scale[0] + translate[0]
            actual_y = y * scale[1] + translate[1]
            points.append((actual_x, actual_y))
        decoded.append(points)
    return decoded

# 実行
if __name__ == "__main__":
    # ここに入力ファイル名を指定
    convert_topojson_to_svgs('japan-prefectures.json', 'prefectures_svg')