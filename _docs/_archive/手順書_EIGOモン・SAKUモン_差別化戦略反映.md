# 手順書：EIGOモン・SAKUモン 差別化戦略反映

作成日: 2026-04-02

---

## 全体フロー

```
[あなたがやること]            [ClaudeCodeがやること]
      ↓
Stripeで¥398商品を作成
      ↓
env.local に price_id 追記
      ↓
EIGOモンのSupabaseでSQL実行   ←── 1-1のSQLを貼り付けて実行
      ↓                      ←── Phase 1 (1-2〜1-9) 自動実装
                             ←── Phase 2 自動実装
      ↓
動作確認（Stripe test mode）
      ↓
デプロイ（Vercel）
```

---

## Step 0: 事前準備（あなたが行う）

### 0-1. Stripeで7日間エントリーパスを作成

1. Stripe ダッシュボード → 商品カタログ → 「商品を追加」
2. 以下で設定:
   - 商品名: `7日間エントリーパス`
   - 価格: `¥398`（JPY）
   - 課金タイプ: **一回払い（One time）**
3. 作成後、「価格 ID」をコピー（`price_` から始まる文字列）

### 0-2. 環境変数に追加

**eigomon/.env.local** に追記:
```
STRIPE_ENTRY_PASS_PRICE_ID=price_（上でコピーしたID）
```

**sakumon/.env.local** に追記:
```
STRIPE_ENTRY_PASS_PRICE_ID=price_（同じID）
```

### 0-3. EIGOモンのSupabaseでDBマイグレーション実行

EIGOモンのSupabaseダッシュボード → SQL Editor → 以下を実行:

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS light_pass_status TEXT,
  ADD COLUMN IF NOT EXISTS light_pass_end TIMESTAMPTZ;
```

---

## Step 1: Phase 1 実装（¥398 7日間エントリーパス）

Claude Codeに以下を渡す:

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン・SAKUモン_差別化戦略反映.md（Phase 1セクション）
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts
- /Users/ryuki/Desktop/eigomon/src/lib/hooks.ts
- /Users/ryuki/Desktop/eigomon/src/app/api/stripe/checkout/route.ts
- /Users/ryuki/Desktop/eigomon/src/app/api/stripe/webhook/route.ts
- /Users/ryuki/Desktop/eigomon/src/app/billing/page.tsx
- /Users/ryuki/Desktop/sakumon/src/app/api/stripe/checkout/route.ts
- /Users/ryuki/Desktop/sakumon/src/app/api/stripe/webhook/route.ts
- /Users/ryuki/Desktop/sakumon/src/app/billing/page.tsx

Phase 1 の 1-2 〜 1-9 を順番に実装してください。
（1-1のDBマイグレーションはSupabaseで手動実行済みです）
```

### Phase 1 確認ポイント

| 確認項目 | 方法 |
|---|---|
| billing page に ¥398カードが表示される | localhost:3000/billing を開く |
| ¥398 ボタンを押すとStripe checkout に遷移する | テストモードで購入フロー確認 |
| テスト購入完了後、profiles.light_pass_status = 'active' になる | Supabaseで確認 |
| light_pass_end が 7日後になっている | Supabaseで確認 |

---

## Step 2: Phase 2 実装（Self-Compassionフィードバック）

Claude Codeに以下を渡す:

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン・SAKUモン_差別化戦略反映.md（Phase 2セクション）
- /Users/ryuki/Desktop/eigomon/src/app/api/weekly-review/route.ts

Phase 2 の変更内容に従い、generateWeeklyReview 関数のみを修正してください。
```

### Phase 2 確認ポイント

| 確認項目 | 方法 |
|---|---|
| スコア低下週でも `trendNote` が数値を含まない | コードレビュー |
| AI プロンプトに Self-Compassion 指示が入っている | コードレビュー |
| `diff` 変数がプロンプト生成時のスコープにある | コードレビュー |

---

## Step 3: デプロイ

### 3-1. Vercel環境変数の追加

Vercel ダッシュボード → EIGOモンプロジェクト → Settings → Environment Variables:
```
STRIPE_ENTRY_PASS_PRICE_ID = price_xxxxxxxxxx
```

Vercel ダッシュボード → SAKUモンプロジェクト → 同様に追加。

### 3-2. git commit & push

```bash
cd /Users/ryuki/Desktop/eigomon
git add -p  # 変更ファイルを確認しながらステージング
git commit -m "feat: ¥398 7日間エントリーパス + Self-Compassionフィードバック修正"
git push

cd /Users/ryuki/Desktop/sakumon
git add -p
git commit -m "feat: ¥398 7日間エントリーパス追加"
git push
```

### 3-3. Stripe Webhook の確認

- EIGOモン・SAKUモン両方のStripe webhook endpointが `checkout.session.completed` を受信できるか確認
- Stripe CLI でテスト: `stripe trigger checkout.session.completed`

---

## 優先順位と期待効果

| Phase | 実装時間目安 | 期待効果 |
|---|---|---|
| Phase 1: ¥398エントリーパス | 半日〜1日 | 無料枠切れたユーザーの課金入口を作る。¥398→MONパス転換率15%でMRR改善 |
| Phase 2: Self-Compassionフィードバック | 2〜3時間 | スコア低下週のチャーン防止。再開率向上 |

---

## 次フェーズ（後回し）

- **マイゴール機能**: DBにgoal_*フィールド追加 + UI実装（1〜2週間）
- **成長レポート（SAKUモン）**: SAKUモンにweeklyReview相当の機能を新規実装（1〜2週間）
- **SM-2/FSRS + ZPD**: SHIKENモンリリース後に全アプリ共通で設計・実装（1ヶ月+）
