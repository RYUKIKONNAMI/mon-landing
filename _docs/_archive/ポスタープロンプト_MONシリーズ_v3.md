# MONシリーズ ポスタープロンプト v3（評価AI改善版・4案）

> 作成日: 2026-03-31
> 前バージョンからの主な変更: 共通カラーシステム導入・MONバッジ位置厳密固定・「無料3回」訴求統一・各案コピー精錬

---

## 全案共通設計ルール（v3）

| 要素 | 仕様 |
|------|------|
| 基調背景色 | ブランドホワイト `#f8f9fa`（暗色案を除く） |
| アクセントカラー | EIGO=ネイビー `#1e3a5f`、SAKU=テラコッタ赤 `#b83232`、SHIKEN=アンバー `#c9871a`、汎用=チャコール `#2d2d2d` |
| 右上バッジ | 「MON series」バッジを全案右上・同一サイズ・同一余白に厳密固定 |
| キャッチフォント | Noto Sans JP Black（全案統一） |
| QRコード | 1点のみ → mon-landing.vercel.app（シリーズLP）へ集約 |
| 無料訴求 | 全案に「まず無料で3回 →」または同等フォーマットを統一記載 |
| CTA最大数 | 1つに絞る |

---

## 案1 v3：MONシリーズ汎用版（啓発・橋渡し）

### デザイン仕様

| 項目 | 仕様 |
|------|------|
| 背景色 | `#f8f9fa`（ブランドホワイト） |
| アクセントカラー | チャコール `#2d2d2d` |
| キャッチコピー | 「全部、撮るだけでよかった。」 |
| キャッチフォント | Noto Sans JP Black、52px、チャコール `#2d2d2d`、左上揃え |
| サブコピー | 「英語・論文・スライド。どのページも問題になる。」 |
| サブフォント | Noto Sans JP Medium、18px |
| ビジュアル | スマートフォンモックアップ2枚・15度傾き・斜め配列 |
| 内容（左） | 英文スキャン結果：ハイライト文 + クイズ問題オーバーレイ |
| 内容（右） | 講義スライドスキャン結果：フラッシュカード出力 |
| 影 | ソフトドロップシャドウ |
| CTA | 「まず無料で3回 →」白角丸ボタン + QRコード右隣 |
| バッジ | 右上・チャコール系「MON series」バッジ、固定位置 |

### コピー全文

```
全部、撮るだけでよかった。

英語・論文・スライド。どのページも問題になる。

まず無料で3回 →  [QRコード]
```

### Gemini 画像生成プロンプト（英語）

```
University campus poster, A3 portrait orientation, minimalist Japanese design style. Off-white background (#f8f9fa). Large bold Japanese-style heading font top-left area: main heading in charcoal (#2d2d2d), 52px weight, two-line layout. Below: subtitle text in medium weight charcoal, 18px. Center composition: two smartphone mockups tilted at 15-degree angle arranged in diagonal layout — left phone showing English academic text scan with three highlighted sentences and a floating quiz question card overlay, right phone showing lecture slide scan with flashcard output cards appearing below. Both phones cast soft drop shadows on the white background. Bottom section: white rounded-rectangle CTA button on the left, QR code to the right, both vertically centered. Top-right corner: small circular badge "MON series" in charcoal color, fixed position with consistent margin. Noto Sans JP Black weight for all headings. Clean, academic, trustworthy aesthetic. No decorative illustrations. No gradients. No text or letters anywhere in the image other than abstract UI suggestion only.
```

### v2 → v3 変更点要約

| 変更項目 | v2 | v3 |
|----------|----|----|
| キャッチコピー | 「英語も論文もスライドも、撮るだけ。」（機能列挙型） | 「全部、撮るだけでよかった。」（体験総括・解放感） |
| サブコピー | なし | 「英語・論文・スライド。どのページも問題になる。」追加 |
| 背景 | ダークネイビーグラデーション | `#f8f9fa` ブランドホワイト（シリーズ統一） |
| スマホ枚数 | 3枚 | 2枚に削減（視覚的整理） |
| 無料訴求 | 「まず試してみる（無料）」 | 「まず無料で3回 →」に統一フォーマット化 |
| バッジ色 | 未規定 | チャコール `#2d2d2d` に統一 |

---

## 案2 v3：EIGOモン（英語長文精読 × 大学生）

### デザイン仕様

| 項目 | 仕様 |
|------|------|
| 背景色 | ネイビー `#1e3a5f`（EIGOアクセント） |
| テキスト色 | 白・ライトグレー |
| キャッチコピー | 「精読したつもり、だった。」 |
| キャッチフォント | Noto Sans JP Black、58px、白、左揃え・右マージンあり |
| サブコピー | 「スマホで英文を撮るだけ。読解問題が自動で届く。」 |
| サブフォント | Noto Sans JP Light、白 |
| ビジュアル | スマホモックアップ（右2/3配置）：英語学術テキスト + 赤マーカー3箇所ハイライト + フローティングクイズカード |
| 演出 | スマホ背後にサブトルグロー効果 |
| CTA | 白ピル型ボタン「今持ってる英文で3分試す」 + 下向き小矢印 → QRコードへ視線誘導 |
| 無料訴求 | CTAボタン下に「まず無料で3回」小テキスト |
| バッジ | 右上・白抜き「MON」バッジ（背景が暗色のため白抜き仕様） |

### コピー全文

```
精読したつもり、だった。

スマホで英文を撮るだけ。読解問題が自動で届く。

今持ってる英文で3分試す  ↓
まず無料で3回  [QRコード]
```

### Gemini 画像生成プロンプト（英語）

```
University campus poster, A3 portrait orientation, sophisticated Japanese design. Deep navy background (#1e3a5f). Top-left section: large white bold Japanese heading text area in Noto Sans JP Black weight, 58px, left-aligned with slight right margin, two-line layout. Below heading: smaller light-weight white subtitle text line. Right two-thirds of composition: single smartphone mockup showing English academic text page with exactly three red marker highlight bars on key sentences, one floating quiz question card positioned above the phone screen, subtle soft glow effect emanating from behind the phone. Bottom section: white pill-shaped CTA button centered, small downward-pointing arrow below the button, QR code below the arrow to visually guide the eye downward. Below QR: small white "無料3回" note text. Top-right corner: white circular "MON" badge, fixed position with consistent margin. All visual elements in white or light colors against navy. No clutter, no extra decorations. No readable text or letters in the image.
```

### v2 → v3 変更点要約

| 変更項目 | v2 | v3 |
|----------|----|----|
| 背景色 | `#0f172a`（フル黒に近い） | `#1e3a5f`（ネイビー）へ変更してシリーズ感を確保しつつ差別化維持 |
| サブコピー | 「英文を撮るだけで、読解問題が生まれる。」 | 「スマホで英文を撮るだけ。読解問題が自動で届く。」（行為→結果の流れを明確化） |
| CTA動線 | CTAテキストのみ | CTAボタン下に小さな矢印を追加→QRコードへの視線誘導を明示 |
| 無料訴求 | なし | 「まず無料で3回」をQR下に追加 |
| バッジ | ネイビー系（背景と馴染む） | 白抜きに変更（暗背景での視認性確保） |

---

## 案3 v3：SAKUモン（論文・レポート添削）

### デザイン仕様

| 項目 | 仕様 |
|------|------|
| 背景色 | `#f8f9fa`（ブランドホワイト） |
| アクセントカラー | テラコッタ赤 `#b83232` |
| キャッチコピー | 「ゼミ前日、また読むだけで終わった。」 |
| キャッチフォント | Noto Sans JP Black、50px、テラコッタ赤 `#b83232`、2行レイアウト・左上 |
| サブコピー | 「読んだページから、採点付き問題が届く。」 |
| サブフォント | Noto Sans JP Medium、チャコール |
| ビジュアル要素 | 俯瞰写真：開いた本 + 木製デスク + スマホでページ撮影中の手、暖かい自然光 |
| オーバーレイ | クイズ結果カード（赤ペン添削マーク・テラコッタ赤 `#b83232`、丸囲みグレード「A」、手書き風修正痕） |
| 廃止要素 | 和紙テクスチャ（廃止・シリーズ統一のため） |
| CTA | チャコール系ピルCTA「この本で今すぐ試す」 + 「無料3回スタート」小テキスト |
| バッジ | 右上・「MON series」バッジ、固定位置 |

### コピー全文

```
ゼミ前日、また読むだけで終わった。

読んだページから、採点付き問題が届く。

この本で今すぐ試す  無料3回スタート  [QRコード]
```

### Gemini 画像生成プロンプト（英語）

```
University campus poster, A3 portrait orientation, clean Japanese minimalist design. Off-white background (#f8f9fa). Top-left area: bold Japanese heading in Noto Sans JP Black weight, terracotta-red color (#b83232), 50px, two-line layout, left-aligned. Below in charcoal medium weight: single subtitle text line. Center visual: top-down bird's-eye view photograph of open book lying on warm wooden desk, one hand holding smartphone above the open page taking a photo, warm natural soft lighting from upper left. Overlaid in the lower half: a quiz result card with red pen annotation marks in terracotta-red (#b83232), a circular letter grade "A" badge, handwritten-style correction marks and underlines in the same terracotta-red. The card has a clean white background with subtle shadow. Bottom area: charcoal pill-shaped CTA button on left, small "無料3回スタート" note beside it, QR code to the right. Top-right corner: small "MON series" badge in charcoal, fixed position with consistent margin. No washi paper texture. No dark backgrounds. No text other than abstract annotation suggestions in the visual.
```

### v2 → v3 変更点要約

| 変更項目 | v2 | v3 |
|----------|----|----|
| 背景 | 和紙テクスチャあり | 廃止 → `#f8f9fa` ブランドホワイトに統一 |
| キャッチ文字色 | 白 | テラコッタ赤 `#b83232`（アクセントカラーに統一） |
| 赤ペン色 | `#CC2200` | `#b83232` に統一（シリーズカラーシステムと整合） |
| ビジュアル要素 | 俯瞰写真＋採点カード＋和紙テクスチャの3要素 | 俯瞰写真＋採点カードの2要素のみに削減 |
| 学部限定訴求 | 「○○学部生へ」ラベル（メイン配置） | 廃止 → 「まず無料で3回」統一フォーマットに置換 |
| CTA | 「撮って、提出できるレベルに。（無料）」 | 「この本で今すぐ試す」＋「無料3回スタート」に変更 |

---

## 案4 v3：SHIKENモン（過去問・試験対策）

### デザイン仕様

| 項目 | 仕様 |
|------|------|
| 背景色 | `#f8f9fa`（ブランドホワイト） |
| アクセントカラー | アンバー `#c9871a` |
| キャッチコピー | 「同じ学部の先輩カードが、今すぐ使える。」 |
| キャッチフォント | Noto Sans JP Black、46px、チャコール |
| サブコピー | 「先輩が撮って、共有して、あなたが解く。」 |
| サブフォント | Noto Sans JP Regular、チャコール、小サイズ |
| ビジュアル要素 | フラッシュカード5枚・扇状配置・緩やかなアーク |
| カードデザイン | アンバー `#c9871a` トップボーダーストライプ・白背景・手書き風日本語テキスト・ソフトシャドウ |
| 評価バッジ | 最前面カードに「★★★★☆ 4.6 / 先輩作成」を手書き風フォントで表示 |
| 廃止要素 | ゲームUIトーン・機能列挙サブコピー |
| CTA | アンバー角丸ボタン「先輩のカードを今すぐ見る」＋QRコード＋「まず無料で3回」小テキスト |
| バッジ | 右上・チャコール系「MON series」バッジ、固定位置 |

### コピー全文

```
同じ学部の先輩カードが、今すぐ使える。

先輩が撮って、共有して、あなたが解く。

先輩のカードを今すぐ見る  [QRコード]
まず無料で3回
```

### Gemini 画像生成プロンプト（英語）

```
University campus poster, A3 portrait orientation, warm academic Japanese design. Off-white background (#f8f9fa). Top section: bold Japanese heading in Noto Sans JP Black weight, charcoal color, 46px, single or two-line layout. Below in smaller charcoal text: short subtitle line. Center visual: five white paper flashcard index cards fanned out in a slight arc arrangement, each card has a warm amber (#c9871a) top border stripe approximately 8px thick, handwritten-style Japanese text visible on card faces suggesting study notes, top front card displays a star rating badge "★★★★☆ 4.6 / 先輩作成" in handwritten casual font style — not digital UI, but analog hand-lettered feel. Cards cast gentle soft shadows on the off-white surface below. No digital glow effects. No neon. Bottom section: amber rounded-corner CTA button on the left, QR code to the right, small "まず無料で3回" note below. Top-right corner: small "MON series" badge in charcoal, fixed position with consistent margin. Nostalgic analog college stationery aesthetic throughout. No text other than abstract handwriting suggestion marks on cards.
```

### v2 → v3 変更点要約

| 変更項目 | v2 | v3 |
|----------|----|----|
| サブコピー | 機能列挙（撮影・共有・解答の3機能を別々に記述） | 「先輩が撮って、共有して、あなたが解く。」（行為の連鎖・物語化）に圧縮 |
| カード色調 | クリーム系（`#F5ECD7`）・アナログ暖色 | アンバー `#c9871a` トップボーダーに統一（シリーズカラーシステムと整合） |
| 評価バッジ | 一般的なデジタル風 | 手書き風フォント採用でアナログ感強化 |
| 機能列挙 | CTAに機能説明を含めていた | 完全削除・物語型コピー1文に集約 |
| CTA | 「▶ [　　]学部のカードを今すぐ使う（無料）」（学部差し替え余白あり） | 「先輩のカードを今すぐ見る」＋「まず無料で3回」に変更 |
| 無料訴求 | CTAボタン内括弧表記 | 独立した「まず無料で3回」フォーマットに統一 |

---

## Canva仕上げチェックリスト（全案共通）

### 全案必須（v3更新版）

- [ ] 右上：「MON series」バッジを全案同一サイズ・同一余白で固定（位置の厳守）
- [ ] キャッチコピー（Noto Sans JP Black）
- [ ] QRコード 1点のみ（mon-landing.vercel.app）
- [ ] CTA テキスト（1点に絞る）
- [ ] 「まず無料で3回 →」または同等フォーマットを必ず記載

### 案別追加要素

- [ ] 案1（汎用）: スマホモックアップ2枚・斜め配列。チャコール系カラー
- [ ] 案2（EIGO）: CTA下矢印→QRの視線誘導ライン。白バッジ（白抜き仕様）
- [ ] 案3（SAKU）: 俯瞰写真オーバーレイ採点カード。テラコッタ赤 `#b83232` でアクセント統一。和紙テクスチャ不使用
- [ ] 案4（SHIKEN）: カード扇状配置5枚・アンバーボーダー統一。手書き風評価バッジ

### サイズ展開

- [ ] 1:1（Instagram投稿） ← 画像生成はこれ
- [ ] 9:16（IGストーリーズ / 掲示ポスター縦版） ← Canvaでリサイズ
- [ ] A3縦（学内ポスター印刷用） ← Canvaでリサイズ、余白増加

---

## v2 → v3 改善対応表（全案横断）

| 指摘項目 | v2の問題 | v3での対応 |
|----------|----------|------------|
| カラーシステム不在 | 案ごとに配色がバラバラで統一感なし | 基調=`#f8f9fa`、各アプリ1アクセントカラーのシステムを導入 |
| MONバッジ位置不統一 | 案によって位置・サイズが微妙に異なる | 右上・同一サイズ・同一余白に厳密固定をルール化 |
| 無料訴求フォーマット不統一 | 案ごとに無料表記が異なる or なし | 「まず無料で3回 →」を統一フォーマットとして全案必須化 |
| 案1キャッチが機能列挙 | 「英語も論文もスライドも、撮るだけ。」→列挙型で体験が伝わらない | 「全部、撮るだけでよかった。」→体験の総括・解放感に変更 |
| 案2背景が暗すぎ | `#0f172a`（フル黒近似）でシリーズ感が分断 | `#1e3a5f`（ネイビー）に変更して差別化維持しつつシリーズ感を確保 |
| 案2 CTA動線不明 | CTAとQRの関係が視覚的に不明 | CTAボタン下に矢印追加でQRへの視線誘導を明示 |
| 案3 和紙テクスチャ | テクスチャが背景に入りシリーズ統一感を阻害 | 廃止。`#f8f9fa` 白背景に統一 |
| 案3 アクセント赤が不統一 | `#CC2200` の赤がシリーズカラーと無関係 | `#b83232`（テラコッタ赤）に統一 |
| 案4 サブコピーが機能列挙 | 機能を箇条書き的に列挙しユーザーへの感情訴求が弱い | 「先輩が撮って、共有して、あなたが解く。」に物語化・圧縮 |
| 案4 カード色調がバラバラ | クリーム系で統一感なし | アンバー `#c9871a` トップボーダーに統一 |
| 案4 評価バッジがデジタル風 | ゲームUIに見える | 手書き風フォントでアナログ感強化 |
