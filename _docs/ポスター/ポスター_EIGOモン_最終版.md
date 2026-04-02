# EIGOモン キャンパスポスター 最終確定版

作成日: 2026-03-31
最終スコア: **96 / 100**

---

## 改善プロセスログ

| バージョン | スコア | 主な課題 |
|---|---|---|
| v1 | 85点 | スキマ時間の訴求不在、撮影→生成UXが不可視 |
| v2 | 91点 | 試験種別が小さい、MONバッジが弱い、無料3回が埋もれている |
| v3（確定） | 96点 | 全軸クリア（各24点水準） |

---

## 1. コピー全文

### メインキャッチコピー（最重要）
```
単語アプリはある。
文法アプリはある。
読解は、なかった。
```

**コピー意図:**
「単語アプリはある。文法アプリはある。」の2行が、学生が実際に使っているAnki・スタサプ・Duolingoの存在を喚起し、「そうそう、自分はそれを使っている」という共感を生む。そして「読解は、なかった。」の3行目で市場の空白を突く。句点の前の「、」が一拍の沈黙を作り、インパクトを倍増させる。

---

### サブコピー（第1行）
```
今持ってる英文を撮るだけ。スキマ時間が、読解演習に変わる。
```

**コピー意図:**
「今持ってる」が所有物（テキスト・参考書・プリント）の活用を示唆。「撮るだけ」はゼロ準備の手軽さ。「スキマ時間が、読解演習に変わる」はジョブ理論的な価値転換を圧縮。

---

### 試験対応バッジ（中段ビジュアル内）
```
TOEIC  ／  英検  ／  大学院入試
```

---

### CTA（行動喚起）
```
まず無料で3回、試してみる →
```

**CTA直下の補足テキスト（小）:**
```
クレジットカード不要 · 登録30秒
```

---

## 2. デザイン仕様

### 基本仕様
- **サイズ:** A3縦（297mm × 420mm）／ 印刷300dpi以上
- **用紙:** マットコート紙（光沢なし推奨）
- **デジタル展開:** 1:1（SNS投稿）、9:16（ストーリーズ）はCanvaでリサイズ

---

### カラーパレット

| 役割 | カラー名 | カラーコード |
|---|---|---|
| 背景（メイン） | ディープネイビー | `#1e507f` |
| テキスト（メイン） | ピュアホワイト | `#ffffff` |
| テキスト（サブ） | アイスホワイト | `#d4e6f8` |
| アクセント（CTA） | ブライトホワイト地 | `#ffffff` |
| CTAテキスト | ネイビー | `#1e507f` |
| バッジ（試験種別） | 半透明ホワイト | `rgba(255,255,255,0.15)` |
| バッジ枠線 | 半透明ホワイト | `rgba(255,255,255,0.35)` |
| MONロゴバッジ | ホワイト | `#ffffff` |
| グラデーション補助 | ダークネイビー底 | `#0f2a4a` |

---

### レイアウト構成（A3縦 / 上から順）

```
┌─────────────────────────────────────────┐
│  [MONシリーズ ロゴ]         [EIGOモン]  │  ← ヘッダー帯（全幅 / 高さ60px / 半透明白枠下線）
│                                         │
│                                         │
│  単語アプリはある。                      │  ← キャッチ 1行目（白・Noto Sans JP Black・58px）
│  文法アプリはある。                      │  ← キャッチ 2行目（白・同上）
│  読解は、なかった。                      │  ← キャッチ 3行目（白・同上・下に8pxスペース）
│                                         │
│  今持ってる英文を撮るだけ。              │  ← サブコピー前半（アイスホワイト・18px・Medium）
│  スキマ時間が、読解演習に変わる。        │  ← サブコピー後半（同上）
│                                         │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
│                                         │
│   [スマホ写真: 英文教材を撮影する手]    │  ← メインビジュアル（縦長スペース約40%）
│        ↓                               │     スマホ画面に読解問題カードが浮かぶ
│   [読解問題カード（フローティング）]    │     背景は電車窓・ぼかし処理
│                                         │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
│                                         │
│  [TOEIC]  [英検]  [大学院入試]          │  ← 試験バッジ（横並び・半透明白・角丸pill型）
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ まず無料で3回、試してみる →         │  │  ← CTAボタン（白地・ネイビー文字・角丸16px・全幅）
│  └───────────────────────────────────┘  │
│    クレジットカード不要 · 登録30秒      │  ← 補足テキスト（12px・中央・アイスホワイト）
│                                         │
│    [QRコード]   eigomon.jp              │  ← QR + URL（白・中央揃え）
│                                         │
└─────────────────────────────────────────┘
```

---

### タイポグラフィ

| 要素 | フォント | ウェイト | サイズ（A3基準） | 色 |
|---|---|---|---|---|
| キャッチ3行 | Noto Sans JP | Black (900) | 58px | #ffffff |
| サブコピー | Noto Sans JP | Medium (500) | 18px | #d4e6f8 |
| 試験バッジ | Noto Sans JP | SemiBold (600) | 14px | #ffffff |
| CTAボタン | Noto Sans JP | Bold (700) | 20px | #1e507f |
| 補足テキスト | Noto Sans JP | Regular (400) | 12px | #d4e6f8 |
| URL | SF Mono / Fira Code | Regular | 11px | #a8c8e8 |

**フォント選定理由:**
Noto Sans JP Blackは大学掲示板での遠距離視認性が高く、既存MONシリーズランディングページ（`var(--heading)`）との統一感を保つ。英数字はSF Mono系でテック感を付加。

---

### メインビジュアル詳細

**シーン設定:**
- 電車内シーン（窓外の景色がモーションブラーでぼける）
- 主人公の手のみ写る（顔は写さない → 自己投影しやすくする）
- 手はTOEIC公式問題集を持ちつつ、スマホカメラを向けている
- スマホ画面上に半透明のUIカード（読解問題）がフローティング
- 問題カードには英文と4択設問が見える（実際の文字は判読不要）
- 照明: 窓からの自然光 + スマホ画面の青白い光

---

### 視認性チェック（A3・2m距離基準）
- キャッチコピー: 58px → 2m先から視認可能（最小36pxが限界）✓
- CTAボタン: 白地のコントラスト比 > 7:1（WCAG AAA基準）✓
- 試験バッジ: pill型で内容識別可能 ✓

---

## 3. Gemini画像生成プロンプト（英語）

```
University campus A3 portrait poster, sophisticated Japanese design.
Deep navy blue background (#1e507f) with a subtle dark-to-darker gradient toward the bottom (#0f2a4a).
Faint diagonal grid lines overlay the background at very low opacity (3%), adding subtle texture without distraction.

Top section: Three lines of large Japanese-style bold white heading text, left-aligned with generous left margin.
Line 1 and Line 2 are identical in weight and size, establishing a rhythmic pattern.
Line 3 is the same size but carries the final punchline — add 1.5x letter-spacing on this line for emphasis.
Below the heading: two lines of lighter-weight Japanese subtitle text in pale ice-blue (#d4e6f8), 18px, left-aligned.

Center section — the main visual: A close-up, realistic photograph of a human hand (gender-neutral, medium skin tone)
holding a smartphone camera aimed at a page of English text (TOEIC study material, paragraphs visible,
some sentences highlighted in pale yellow). The hand and phone are centered, slightly angled at 15 degrees clockwise.
Behind the hand and phone, the window of a moving train is visible, with the outside scenery heavily motion-blurred
in blues and grey, suggesting travel and commuting. The overall scene lighting comes from the window —
soft, diffused natural daylight hitting the hand and phone from the upper left.

Floating above the smartphone screen: a rounded-rectangle UI card (white, 80% opacity, 16px corner radius,
soft drop shadow) displaying a reading comprehension question with four answer choices labeled A B C D.
The card overlaps the phone screen naturally, as if it appeared from the scanning action.
The card content is in very small, barely legible English — just enough to suggest a real quiz interface.

Bottom section: Three pill-shaped semi-transparent badge elements, horizontally arranged, center-aligned.
Each pill has a white 1px border and white text: the three labels are for Japanese standardized English exams
(university-level, graduate school level, professional certification level).
The pill background is rgba(255,255,255,0.15).

Below the badges: a full-width white rounded-rectangle CTA button (corner radius 16px),
navy blue text inside, bold. Button height 56px.

Below the CTA: a small centered QR code (white modules on transparent background, 80x80px)
flanked by a short URL in monospace font.

Top-left corner: a small circular badge "MON" in white text on semi-transparent navy border.
Top-right: the app name "EIGOモン" in white bold text, 16px.

Style: clean, modern Japanese app marketing, premium educational aesthetic,
similar to Apple's product posters but with academic warmth. Depth of field:
hand/phone in sharp focus, train window background softly blurred.
8K resolution, photorealistic materials, professional poster layout.
Aspect ratio 2:3 (portrait A3).

No text other than specified UI elements. No English body text visible in the poster copy.
No additional decorative elements beyond what is described.
```

---

## 4. 最終スコアと採点詳細

### 総合スコア: **96 / 100**

| 評価軸 | 配点 | 得点 | 根拠 |
|---|---|---|---|
| **軸1: 学生の共感・刺さり度** | 25点 | **24点** | 「単語アプリはある。文法アプリはある。」のリズムが既存ツールの使用体験を喚起し、「読解は、なかった。」で空白を突く構造は最大級の共感装置。電車内シーンのビジュアルはスキマ時間の訴求として完璧。唯一の-1点は「大学院入試」という試験種別がコピー本文に登場しない点（バッジのみ） |
| **軸2: 情報の明瞭さ・伝達速度** | 25点 | **24点** | 3秒視認テスト: キャッチ3行で「英語読解アプリが今までなかった」と判明、CTAボタンで「無料3回」が即把握、QRで即行動。撮影→問題生成のフローがビジュアルで直感的に理解できる。-1点は試験バッジが3つ並ぶことで一瞬情報量が増す点（致命的ではないが） |
| **軸3: 大学キャンパスへの適合性** | 25点 | **24点** | A3マット印刷でネイビー×白の高コントラストは廊下・掲示板での視認性が高い。電車内の学生シーンは大学生が自己投影しやすい。-1点はポスターの「大学」色（キャンパス感・学祭感）がやや薄く、汎用感が残る点 |
| **軸4: MONブランド統一感** | 25点 | **24点** | 背景色`#1e507f`はMONシリーズv4確定のEIGOモンカラーと完全一致。「撮るだけ」のコアバリューがサブコピーに継承。MONシリーズバッジが左上に配置。-1点はSAKUモン・SHIKENモンとの「家族感」を明示するMONパスへの言及がない点（スペースの制約上仕方なし） |

---

## 制作・展開チェックリスト

### 印刷物（Canva仕上げ）
- [ ] Geminiで画像生成（上記プロンプト使用）
- [ ] Canvaに取り込み → A3テンプレートに配置
- [ ] キャッチコピー3行を追加（Noto Sans JP Black / 白）
- [ ] サブコピーを追加（Noto Sans JP Medium / #d4e6f8）
- [ ] 試験バッジ3つを追加（Canva pills形状）
- [ ] CTAボタン追加（白地 / ネイビーテキスト）
- [ ] QRコード追加（mon-landing.vercel.app/eigomon へ）
- [ ] MONシリーズバッジを左上に配置
- [ ] 300dpi書き出し → 印刷入稿

### デジタル展開
- [ ] 1:1（Instagram投稿）← Canvaでクロップ
- [ ] 9:16（IGストーリーズ / Xモバイル）← Canvaでリサイズ
- [ ] 16:9（X投稿 / OGP）← Canvaでリサイズ

### 掲示スポット候補（大学内）
- [ ] 学内の英語学習スペース・語学センター前
- [ ] 図書館入口・参考書コーナー周辺
- [ ] 就職支援センター（TOEIC受験需要）
- [ ] 学食・コンビニ（スキマ時間認知）
- [ ] 地下鉄/最寄り駅構内（通学中の訴求）

---

*本ポスターは /Users/ryuki/Desktop/mon-landing/ポスタープロンプト_MONシリーズ_v4_最終版.md のブランドガイドラインに準拠*
