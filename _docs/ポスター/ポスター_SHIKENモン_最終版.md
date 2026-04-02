# SHIKENモン キャンパスポスター 最終確定版

作成日: 2026-03-31
反復回数: 3ラウンド
最終スコア: 96/100

---

## 反復改善サマリー

| ラウンド | スコア | 主な改善点 |
|---|---|---|
| V1（初回案） | 72/100 | 基本設計。過去問習慣への言及が弱く、フローが不明瞭 |
| V2（2回目） | 86/100 | 「先輩からのプリント」明示、3ステップフローバー追加 |
| V3（最終） | **96/100** | 大キャッチに習慣への呼びかけ統合、ビジュアルのみでフロー表現、重複削除 |

---

## 1. コピー全文（最終確定）

### 大キャッチコピー（メインヘッドライン）

```
先輩から過去問をもらう時代は、
もう終わりにしよう。
```

### ブランドライン（大キャッチ直下・細め）

```
過去問の時代は、もう終わり。 — SHIKENモン
```

### サブコピー（ビジュアル下・3行）

```
今学期の授業スライドをスマホで撮るだけで、
暗記カード＋確認テストが自動で届く。
同じ学部の仲間の★評価でAIが的中率を磨き続ける。
```

### CTA（行動喚起）

```
まず無料で3回 →
```

---

## 2. デザイン仕様

### 基本フォーマット

| 項目 | 仕様 |
|---|---|
| サイズ | A3縦（297mm × 420mm） |
| 用紙 | マット系コート紙（光沢なし） |
| 解像度 | 300dpi以上 |
| カラーモード | CMYK（入稿時） |

### カラーパレット

| 役割 | 色名 | HEX |
|---|---|---|
| 背景 | オフホワイト | #f8f9fa |
| メイン本文・見出し | チャコール | #2d2d2d |
| SHIKENモン固有アクセント | アンバー | #c9871a |
| CTAボタン背景 | アンバー | #c9871a |
| CTAボタン文字 | ホワイト | #ffffff |
| カード天帯・矢印 | アンバー | #c9871a |
| セカンダリテキスト | グレー | #6c757d |

### タイポグラフィ

| 要素 | フォント | ウェイト | サイズ | 色 |
|---|---|---|---|---|
| 大キャッチ（2行） | Noto Sans JP | Black | 58px | #2d2d2d |
| ブランドライン | Noto Sans JP | Regular | 14px | #6c757d |
| サブコピー（3行） | Noto Sans JP | Regular | 18px | #2d2d2d |
| CTAボタン | Noto Sans JP | Bold | 16px | #ffffff |
| バッジ（SHIKENモン/MON） | Noto Sans JP | Medium | 11px | #2d2d2d |

### レイアウト構成（縦3分割）

```
┌──────────────────────────────────┐
│ [上部ゾーン 30%]                  │
│  左上: SHIKENモン / MONシリーズ    │
│       バッジ（小・チャコール）      │
│                                  │
│  大キャッチ（2行、左揃え）         │
│  「先輩から過去問をもらう時代は、  │
│   もう終わりにしよう。」          │
│   ↑ Noto Sans JP Black 58px      │
│   ↑ 文末にアンバー太下線（4px）   │
│                                  │
│  ブランドライン（下線直下、細め）  │
│  「過去問の時代は、もう終わり。    │
│   — SHIKENモン」                 │
├──────────────────────────────────┤
│ [中央ビジュアルゾーン 40%]         │
│                                  │
│  [スマホ1台]  →(アンバー矢印)→   │
│  スライド撮影シーン               │
│  （授業スライドが画面に映る）      │
│                                  │
│  →(アンバー手描き矢印)→          │
│                                  │
│  [フラッシュカード3枚扇状]        │
│  ・中央カード: 前面・大           │
│  ・左右カード: 後方・小           │
│  ・全カード: アンバー天帯         │
│  ・中央カード: ★4.6 / 同学部生作成│
├──────────────────────────────────┤
│ [下部ゾーン 30%]                  │
│                                  │
│  サブコピー（3行、左揃え）         │
│  「今学期の授業スライドを撮るだけで│
│   暗記カード＋確認テストが届く。   │
│   仲間の★評価でAIが磨き続ける。」 │
│                                  │
│  [アンバーCTAボタン] [QRコード]   │
│  「まず無料で3回 →」              │
│                                  │
└──────────────────────────────────┘
```

### アンバーの使用箇所（3点集中）

1. 大キャッチ下の太下線（#c9871a, 4px）
2. ビジュアルゾーンの手描き矢印 + カード天帯
3. CTAボタン背景

---

## 3. Gemini画像生成プロンプト（英語）

```
University campus bulletin board poster, A3 portrait orientation (297mm x 420mm), clean minimalist Japanese design style. Off-white background (#f8f9fa).

Top section (upper 30% of poster): Left-aligned bold Japanese-style heading in charcoal (#2d2d2d), Noto Sans JP Black weight, 58px equivalent. Below the heading, a thick amber (#c9871a) horizontal underline accent bar, 4px height, spanning the text width. Immediately below the amber underline, a smaller secondary line of text in grey (#6c757d), thin weight, 14px.

Center section (middle 40%): A horizontal visual flow composition. On the left, a single modern smartphone mockup held in a hand, the screen displaying a university lecture slide with text and diagrams, soft natural lighting, warm campus atmosphere. A hand-drawn style amber (#c9871a) arrow pointing right from the phone toward the center-right. On the right, three flashcard-style paper cards arranged in a gentle fan arc — the center card large and front-facing, two side cards smaller and partially behind. Each card has an amber (#c9871a) stripe across its top edge. The center front card displays a star rating "★★★★☆ 4.6" and a small "同学部生作成" label in handwritten-style Japanese characters. Cards cast gentle natural shadows on the background.

Bottom section (lower 30%): Three lines of body text in charcoal (#2d2d2d), Noto Sans JP Regular, 18px, left-aligned. Below the body text, a wide amber (#c9871a) rounded rectangle CTA button with white text inside, flanked on the right by a small clean QR code. Small "SHIKENモン / MON series" badge text in charcoal at the bottom-right corner.

Overall atmosphere: clean, academic, trustworthy, warm. No excessive decoration. Suitable for university exam season bulletin board display. Noto Sans JP typography throughout.

No text other than specified above. No additional words, letters, or characters anywhere in the image.
```

---

## 4. 最終スコア

### 採点結果

| 評価軸 | 詳細 | スコア |
|---|---|---|
| 軸1: 学生の共感・刺さり度 | 「先輩から過去問をもらう時代は、もう終わりにしよう」というキャッチが習慣への直接的な呼びかけとして機能。学生が自分事として読める。★評価という社会的証明も共感を強化 | **25/25** |
| 軸2: 情報の明瞭さ・伝達速度 | 「スマホ撮影→カード生成→★評価」の3ステップがビジュアル（図+矢印）だけで3秒以内に伝わる。サブコピーは補完的な役割に絞り情報の重複を排除 | **23/25** |
| 軸3: 大学キャンパス適合性 | A3縦・掲示板フォーマット完全準拠。「今学期の授業スライド」という言葉が試験期間前の緊張感と直結。余白設計でキャンパス環境に馴染む | **24/25** |
| 軸4: MONブランド統一感 | アンバーを下線・矢印・CTAの3点に集中してSHIKENモン固有のアクセント確立。オフホワイト背景×チャコール文字のMONシリーズ共通言語を完全踏襲 | **24/25** |
| **合計** | | **96/100** |

### 判定: 確定（95点基準クリア）

---

## 5. Canva仕上げチェックリスト

- [ ] 大キャッチコピー（Noto Sans JP Black, 58px, #2d2d2d）
- [ ] アンバー下線（#c9871a, 4px, キャッチ直下）
- [ ] ブランドライン「過去問の時代は、もう終わり。— SHIKENモン」
- [ ] スマホ撮影モックアップ画像（中央左）
- [ ] アンバー手描き矢印（モックアップ→カード）
- [ ] フラッシュカード3枚扇状配置（アンバー天帯, ★評価表示）
- [ ] サブコピー3行（Noto Sans JP Regular, 18px）
- [ ] アンバーCTAボタン「まず無料で3回 →」
- [ ] QRコード（mon-landing.vercel.app）
- [ ] SHIKENモン / MONシリーズバッジ（右下小）

### サイズ展開

- [ ] A3（297×420mm / 300dpi）← 印刷・掲示板用
- [ ] 1:1（Instagram投稿）← Gemini生成ベース
- [ ] 9:16（IGストーリーズ）← Canvaリサイズ
- [ ] 16:9（X投稿 / OGP）← Canvaリサイズ
