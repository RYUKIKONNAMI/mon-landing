# MONシリーズ ポスタープロンプト v4 最終版

作成日: 2026-03-31
ベース: v3から最小修正のみ適用

---

## 印刷仕様（全案共通）

- サイズ: A3（297mm × 420mm）
- 用紙: マット系コート紙（光沢なし）推奨
- 解像度: 300dpi以上
- カラーモード: CMYK（入稿時）

---

## 4案 最終コピー一覧

| 案 | キャッチコピー | サブコピー | CTA |
|---|---|---|---|
| 案1（MON汎用） | 全部、撮るだけでよかった。 | 撮った瞬間に、問題が届く。 | まず無料で3回 → |
| 案2（EIGOモン） | 精読したつもり、だった。 | スマホで英文を撮るだけ。読解問題が自動で届く。 | 今持ってる英文で3分試す |
| 案3（SAKUモン） | ゼミ前日、また読むだけで終わった。 | 読んだページから、採点付き問題が届く。 | 無料3回 / この本で今すぐ試す → |
| 案4（SHIKENモン） | 同じ学部の先輩カードが、今すぐ使える。 | 先輩が撮って、共有して、あなたが解く。 | 先輩のカードを今すぐ見る（大）＋ まず無料で3回（小・直下） |

---

## アクセントカラーコード

| 案 | メインカラー | アクセントカラー | 背景色 |
|---|---|---|---|
| 案1（MON汎用） | チャコール #2d2d2d | チャコール #2d2d2d | オフホワイト #f8f9fa |
| 案2（EIGOモン） | ホワイト #ffffff | ホワイト #ffffff | ネイビー #1e507f |
| 案3（SAKUモン） | テラコッタレッド #b83232 | テラコッタレッド #b83232 | オフホワイト #f8f9fa |
| 案4（SHIKENモン） | チャコール #2d2d2d | アンバー #c9871a | オフホワイト #f8f9fa |

---

## 案1（MON汎用）— v4 Gemini Prompt

**変更点（v3→v4）:** サブコピーのみ変更
- v3: 「英語・論文・スライド。どのページも問題になる。」
- v4: 「撮った瞬間に、問題が届く。」

```
University campus poster, A3 portrait orientation, minimalist Japanese design style. Off-white background (#f8f9fa). Large bold Japanese-style heading "全部、撮るだけでよかった。" top-left in charcoal (#2d2d2d), Noto Sans JP Black, 52px. Below: subtitle "撮った瞬間に、問題が届く。" in medium weight 18px. Center: two smartphone mockups at 15-degree angle with soft drop shadows, left phone showing English text scan with highlighted sentences and quiz question overlay, right phone showing lecture slide scan with flashcard output. Bottom center: white rounded rectangle CTA "まず無料で3回 →" with QR code to the right. Top-right: small "MON series" badge circle in charcoal. Clean, academic, trustworthy. No decorative elements. No text other than specified.
```

---

## 案2（EIGOモン）— v4 Gemini Prompt

**変更点（v3→v4）:** 背景色のみ変更
- v3: #1e3a5f
- v4: #1e507f（明度UP）

```
University campus poster, A3 portrait orientation, sophisticated Japanese design. Rich navy-blue background (#1e507f). Top section: large white bold Japanese heading "精読したつもり、だった。" Noto Sans JP Black, 58px, left-aligned. Below in smaller light-weight white text: "スマホで英文を撮るだけ。読解問題が自動で届く。" Right two-thirds: smartphone mockup showing English academic text with three red marker highlights, floating quiz question card above phone, subtle glow. Bottom: white pill CTA "今持ってる英文で3分試す" with small downward arrow pointing to QR code below. Top-right: white circular "MON" badge with 1px white drop shadow. All text white. No text other than specified.
```

---

## 案3（SAKUモン）— v4 Gemini Prompt

**変更点（v3→v4）:** CTAを1行統合のみ
- v3: 「この本で今すぐ試す」＋「無料3回スタート」（2行）
- v4: 「無料3回 / この本で今すぐ試す →」（1行統合）

```
University campus poster, A3 portrait orientation, clean Japanese minimalist design. Off-white background (#f8f9fa). Top-left: bold Japanese heading "ゼミ前日、また読むだけで終わった。" Noto Sans JP Black, terracotta-red (#b83232), 50px, two-line. Below in charcoal: "読んだページから、採点付き問題が届く。" Center: top-down bird's-eye view photo of open book on desk, hand holding smartphone taking a photo, warm lighting. Overlaid: quiz result card with red pen annotation marks, letter grade "A" in circle, correction marks in terracotta-red (#b83232). Bottom: single-line CTA button "無料3回 / この本で今すぐ試す →" in charcoal pill shape. Top-right: small "MON series" badge. No text other than specified.
```

---

## 案4（SHIKENモン）— v4 Gemini Prompt

**変更点（v3→v4）:**
- フラッシュカード枚数: 5枚→3枚（中央大・左右小、扇状）
- CTA: 「先輩のカードを今すぐ見る」（大）＋「まず無料で3回」（小・直下）に階層化

```
University campus poster, A3 portrait orientation, warm academic Japanese design. Off-white background (#f8f9fa). Top bold Japanese heading "同じ学部の先輩カードが、今すぐ使える。" Noto Sans JP Black, charcoal, 46px. Below in smaller charcoal: "先輩が撮って、共有して、あなたが解く。" Center: three flashcard paper cards fanned in slight arc, center card large and front, two side cards smaller and behind, amber (#c9871a) top border stripe on each card, handwritten-style Japanese text on card faces, center card shows star rating "★★★★☆ 4.6 / 先輩作成" in handwritten font, cards cast gentle shadows. Bottom: large amber rounded CTA "先輩のカードを今すぐ見る" with QR code, directly below in small text "まず無料で3回". Top-right: small "MON series" badge charcoal. Nostalgic analog college aesthetic. No digital UI. No text other than specified.
```

---

## v3→v4 差分サマリー

| 案 | 変更箇所 | 変更内容 |
|---|---|---|
| 案1 | サブコピー | 「英語・論文・スライド。どのページも問題になる。」→「撮った瞬間に、問題が届く。」 |
| 案2 | 背景色 | #1e3a5f → #1e507f（明度UP） |
| 案3 | CTA | 2行構成 → 「無料3回 / この本で今すぐ試す →」1行統合 |
| 案4 | ビジュアル・CTA | カード5枚→3枚扇状、CTA階層化（大・小2段） |
