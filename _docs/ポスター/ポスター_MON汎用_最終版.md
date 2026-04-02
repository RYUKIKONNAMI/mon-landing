# MONシリーズ 汎用ポスター 最終確定版

作成日: 2026-03-31
改善ラウンド: 3回（v1→v2→v3）
最終スコア: 98/100

---

## 1. コピー全文

### メインキャッチコピー
```
どうせ読むなら、もっと深く。
```
（Noto Sans JP Black / チャコール #2d2d2d / 54px / 左揃え）

### サブコピー
```
読んだ。でも、わかってない。
——その違和感、撮るだけで変わる。
```
（Noto Sans JP Regular / チャコール #2d2d2d / 18px）

### 3アプリ紹介コピー（各カラム内）

| アプリ | ラベル | 説明文 |
|--------|--------|--------|
| EIGOモン | 英語テキスト | 英文を撮る → 読解問題、自動で届く |
| SAKUモン | 論文・本 | ページを撮る → 採点付き読解問題 |
| SHIKENモン | 授業スライド | 撮る → 暗記カード＋確認テスト生成 |

### CTA
```
全部、無料3回から試せる →
```
（Noto Sans JP Bold / オフホワイト #f8f9fa / チャコール背景 #2d2d2d / 丸角ボタン）

---

## 2. デザイン仕様

### 基本情報
- サイズ: A3（297mm × 420mm）/ 縦向き
- 用紙: マット系コート紙（光沢なし）推奨
- 解像度: 300dpi以上（印刷時）
- カラーモード: CMYK（入稿時）/ RGB（デジタル表示用）

### カラーパレット

| 用途 | 色名 | カラーコード |
|------|------|-------------|
| 背景 | オフホワイト | #f8f9fa |
| 主要テキスト | チャコール | #2d2d2d |
| EIGOモン帯 | ネイビー | #1e507f |
| SAKUモン帯 | テラコッタ | #b83232 |
| SHIKENモン帯 | アンバー | #c9871a |
| CTA背景 | チャコール | #2d2d2d |
| CTAテキスト | オフホワイト | #f8f9fa |

### タイポグラフィ

| 要素 | フォント | ウェイト | サイズ |
|------|----------|----------|--------|
| キャッチコピー | Noto Sans JP | Black (900) | 54px |
| サブコピー | Noto Sans JP | Regular (400) | 18px |
| アプリ名 | Noto Sans JP | Bold (700) | 22px |
| 説明文 | Noto Sans JP | Regular (400) | 15px |
| CTA | Noto Sans JP | Bold (700) | 20px |

### レイアウト構成

```
[上部エリア 上から30%]
  左: MONシリーズバッジ（小）
  右上: "MONシリーズ" 統一ロゴ（チャコール、小）

  「どうせ読むなら、もっと深く。」（大・左揃え）
  「読んだ。でも、わかってない。——その違和感、撮るだけで変わる。」（中・左揃え）

[中央エリア 30〜75%]
  3カラム均等配置（左右余白16px / カラム間隔12px）

  ┌────────────┐  ┌────────────┐  ┌────────────┐
  │ [ネイビー帯] │  │[テラコッタ帯]│  │ [アンバー帯] │
  │ EIGOモン    │  │  SAKUモン   │  │ SHIKENモン  │
  │             │  │             │  │             │
  │ スマホ画面   │  │ スマホ画面   │  │ スマホ画面   │
  │ イメージ     │  │ イメージ     │  │ イメージ     │
  │             │  │             │  │             │
  │ 英文を撮る  │  │ ページを撮る │  │ 撮る→カード │
  │ → 読解問題  │  │ → 採点付き  │  │ ＋テスト生成 │
  └────────────┘  └────────────┘  └────────────┘

[下部エリア 75〜100%]
  中央: 「全部、無料3回から試せる →」 丸角ボタン（幅60%）
  右: QRコード（mon-landing.vercel.app/try）
  最下段: "© MONシリーズ" 小テキスト
```

### ビジュアル・質感

- 背景: オフホワイト無地（#f8f9fa）。極薄グレー（#e8e8e8）のドット格子テクスチャ（不透明度8%）で知的空間演出
- 3アプリカラム: 上部に各アプリカラーの帯（高さ6px）。白背景の角丸カード（border-radius 12px）。チャコールの薄いドロップシャドウ
- スマホモックアップ: 軽い15度傾斜、ソフトシャドウ
- 矢印: なし（シンプル化。各カラム内の説明文で「撮る → 〇〇」フローを表現）

---

## 3. Gemini画像生成プロンプト（英語）

```
University campus poster, A3 portrait orientation (297mm x 420mm), minimalist Japanese academic design style. Off-white background (#f8f9fa) with an extremely subtle dot-grid texture at 8% opacity in light grey (#e8e8e8), barely visible, adding intellectual depth without distraction.

Top section (upper 30% of poster): Large bold Japanese-style catchphrase "どうせ読むなら、もっと深く。" in Noto Sans JP Black 54px, charcoal (#2d2d2d), left-aligned with generous left margin. Below in 18px regular weight: "読んだ。でも、わかってない。——その違和感、撮るだけで変わる。" in charcoal. Top-right corner: small "MON series" wordmark badge in charcoal, elegant and understated.

Center section (middle 45%): Three equal-width columns arranged side by side, each a white rounded-corner card (border-radius 12px) with a soft charcoal drop shadow (2px blur, 8% opacity). Each card has a 6px color accent stripe at the top: left card navy (#1e507f) labeled "EIGOモン", center card terracotta-red (#b83232) labeled "SAKUモン", right card amber (#c9871a) labeled "SHIKENモン". Inside each card: a slightly tilted smartphone mockup (15 degrees) showing the relevant app screen — left phone displays English academic text with highlighted sentences and a quiz question overlay, center phone shows an open book page being scanned with a graded quiz card result, right phone shows a lecture slide being captured with flashcard output. Below each phone: 2-line description text in charcoal, app name in bold 22px, description in regular 15px.

Bottom section (lower 25%): Centered large rounded-rectangle CTA button in charcoal (#2d2d2d) with off-white text (#f8f9fa) "全部、無料3回から試せる →", button width 60% of poster width, bold 20px. To the right of the button: a clean QR code square. Below everything: tiny copyright line in light grey.

Overall aesthetic: clean, trustworthy, intellectually stimulating, appropriate for university bulletin boards and campus hallways. Inspired by minimalist Japanese design principles — generous white space, precise typography hierarchy, restrained color use. No decorative flourishes, no photography beyond smartphone mockups.

No text other than the Japanese text and labels specified above. No additional English words, logos, or symbols not described.
```

---

## 4. 最終スコア内訳

| 評価軸 | 得点 | 満点 | コメント |
|--------|------|------|---------|
| 軸1: 学生の共感・刺さり度 | 25 | 25 | 「読んだ。でも、わかってない。」が大学生の日常の違和感を完璧に言語化。「どうせ読むなら」というキャッチとの二段構えで問いかけが機能している |
| 軸2: 情報の明瞭さ・伝達速度 | 24 | 25 | 3アプリが使用シーン×アウトプット形式で瞬時に伝わる。1点マイナスはA3実物での視認テスト未実施 |
| 軸3: 大学キャンパスへの適合性 | 25 | 25 | ミニマル・知的・掲示板映え。ドット格子テクスチャが学術空間らしさを演出しつつ邪魔にならない |
| 軸4: MONブランド統一感 | 24 | 25 | シリーズ入口として機能し、3アプリのカラーが統一感を持って並ぶ。1点マイナスはMONシリーズバッジの視覚インパクト強化余地あり |
| **合計** | **98** | **100** | **確定（95点以上達成）** |

---

## 改善ラウンド記録

| ラウンド | スコア | 主な改善点 |
|----------|--------|-----------|
| v1 | 80点 | 初期案。キャッチは良いがサブコピーの共感度不足、3アプリの情報伝達が弱い |
| v2 | 89点 | 「また読んだだけで終わった」追加、フローを視覚化。情報過多リスク残存 |
| v3 | 98点 | 「読んだ。でも、わかってない。」に昇華。フロー矢印削除でシンプル化。ドット格子テクスチャ追加で知的空間演出 |

---

## Canva仕上げチェックリスト

- [ ] キャッチコピー「どうせ読むなら、もっと深く。」（大・チャコール）
- [ ] サブコピー「読んだ。でも、わかってない。——その違和感、撮るだけで変わる。」
- [ ] EIGOモン カラム（ネイビー帯 #1e507f）
- [ ] SAKUモン カラム（テラコッタ帯 #b83232）
- [ ] SHIKENモン カラム（アンバー帯 #c9871a）
- [ ] CTAボタン「全部、無料3回から試せる →」
- [ ] QRコード（mon-landing.vercel.app/try）
- [ ] MONシリーズバッジ（右上、小）

サイズ展開:
- [ ] A3縦（297mm×420mm）← メイン / 印刷掲示板
- [ ] 1:1（Instagram投稿）← Canvaでトリミング
- [ ] 9:16（IGストーリーズ / Xモバイル）← Canvaでリサイズ
- [ ] 16:9（X投稿 / OGP）← Canvaでリサイズ
