# MON B2B 実装 進め方ガイド

作成日: 2026-03-31
関連ファイル:
- B2B実装指示書_ClaudeCode用.md（Claude Codeへの具体的な指示）
- B2Bアプリ設計_最終版_v22_94点.md（設計の全体像）
- B2B収益予測_v22実装版.md（収益シミュレーション）

---

## ステップ全体像

```
STEP 1  SAKUモン Phase 1（2〜3週）
        └─ 完了したら講師プランを販売開始 ← ここで収益化スタート

STEP 2  SAKUモン Phase 2（3〜4週）
        └─ ZPD追跡・教室プランが動く
        └─ M6判定（ロードマップA or B の分岐）

STEP 3  SAKUモン Phase 3（3〜4週）
        └─ 法令対応完了・塾への本格営業開始

STEP 4  SAKUモン Phase 4（2〜3週）
        └─ スケール対応・本番品質

STEP 5  EIGOモン（差分のみ、1〜2週）
        └─ SAKUモン実装を参考に4箇所だけ変える
```

---

## STEP 1: SAKUモン Phase 1

### やること

1. `migrations/0001_b2b_base.sql` をSupabaseで実行
2. `supabase.ts` に Teacher/Student/Classroom 型を追加
3. `/api/b2b/teacher/register` を実装
4. `/api/b2b/stripe/checkout` を実装（講師プラン）
5. Stripe Webhook に B2B 処理を追加
6. `/api/b2b/students` を実装（一覧・追加・更新）
7. `/b2b/dashboard` のUIを作る

### Claude Codeへの指示（コピペ用）

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/B2B実装指示書_ClaudeCode用.md の「Phase 1」セクション
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/src/app/api/stripe/checkout/route.ts

1-1（DBマイグレーション）から順番に実装してください。
1つ実装するたびに確認しながら進めてください。
```

### 完了の確認方法

```
□ Supabase Dashboard で teachers/students テーブルが存在する
□ /b2b/dashboard にアクセスして画面が出る
□ 生徒を追加できる
□ Stripe テストモードで講師プランの決済フローが通る
  （checkout → webhook → subscription_status: 'active'）
```

### STEP 1 完了後にやること

- Stripe を**本番モード**に切り替える
- 講師プランの価格ページ（`/b2b/pricing`）を作る
- ストアカ・ノート等で「講師プラン先行募集」を告知する

---

## STEP 2: SAKUモン Phase 2

### STEP 2 に進む条件

- Phase 1 の動作確認が全て完了している
- できれば講師プラン契約が1件以上ある（フィードバック収集のため）

### やること

1. `migrations/0002_zpd_tracking.sql` を実行
2. ZPD スコア更新 API を実装
3. 教室プラン Stripe 課金を実装
4. エスカレーション通知 Cron を実装
5. vercel.json に Cron を追加

### Claude Codeへの指示（コピペ用）

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/B2B実装指示書_ClaudeCode用.md の「Phase 2」セクション
- /Users/ryuki/Desktop/sakumon/src/app/api/b2b/（Phase 1の実装済みコード）
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts

2-1（ZPDテーブル）から順番に実装してください。
```

### 完了の確認方法

```
□ ZPD スコアを POST して students.current_phase が更新される
□ 教室プランの Stripe 決済が通る
□ vercel.json に escalate-assignments Cron が追加されている
□ Vercel Dashboard で Cron が認識されている
```

### STEP 2 完了後: M6 判定（ロードマップA/B 分岐）

ロードマップの M6 時点で以下を確認して、A継続かB移行かを判断してください：

| 条件 | A継続ライン | B移行ライン |
|---|---|---|
| MRR | ¥15万超 | ¥22万超 |
| B2B講師数 | 20人超 | 35人超 |
| 教室トライアル | 1塾 | 2塾 |
| チャーン率 | 15%以下 | 12%以下 |

- **3〜4条件クリア → A継続**
- **5条件クリア → B移行**（SHIKENモン開発・チーム拡大）

---

## STEP 3: SAKUモン Phase 3

### STEP 3 に進む条件

- 教室プランの契約が1件以上ある
- または講師プランが10人以上いる

### やること

1. 保護者同意システムを実装（`migrations/0003_parental_consent.sql`）
2. SDT メッセージ送信 API を実装
3. EU AI Act 月次サンプリング Cron を実装
4. 紹介プログラム Cron を実装

### Claude Codeへの指示（コピペ用）

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/B2B実装指示書_ClaudeCode用.md の「Phase 3」セクション
- /Users/ryuki/Desktop/sakumon/src/lib/consentDialogVersions.ts
- /Users/ryuki/Desktop/sakumon/src/lib/phaseRollbackSop.ts
- /Users/ryuki/Desktop/sakumon/src/app/api/b2b/（Phase 1〜2の実装済みコード）

3-1（保護者同意）から順番に実装してください。
```

### 完了の確認方法

```
□ 保護者同意の記録が teacher_consent_override_logs に入る
□ SDT メッセージ送信が encouragement_message_logs に記録される
□ sample-ai-review と process-rewards が vercel.json にある
□ vercel.json の Cron が合計 11 本以内
```

### STEP 3 完了後にやること

- 塾への本格的な営業活動を開始（ZPD分析・EU AI Act準拠を訴求ポイントに）
- M6 法務レビュー（SDT機能の GDPR 確認）を法務担当者に依頼

---

## STEP 4: SAKUモン Phase 4

### STEP 4 に進む条件

- Phase 3 が完了している
- 月間アクティブ生徒数が 50 人以上（スケール対応が意味を持つ規模）

### やること

1. 匿名化 Cron を実装
2. `zpd_weekly_stats` テーブルを作成
3. ZPD ロールバック監視 Cron を実装

### Claude Codeへの指示（コピペ用）

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/B2B実装指示書_ClaudeCode用.md の「Phase 4」セクション
- /Users/ryuki/Desktop/sakumon/src/app/api/b2b/（Phase 1〜3の実装済みコード）

4-1（匿名化 Cron）から順番に実装してください。
```

### 完了の確認方法

```
□ anonymize Cron が vercel.json にある
□ zpd_weekly_stats テーブルが Supabase に存在する
□ check-zpd-rollback-triggers Cron が動いている
□ 全 Cron が合計 11 本（Vercel Pro 上限 20 に対して余裕あり）
□ 全テーブルのRLS設定を最終確認した（38テーブル全て）
```

---

## STEP 5: EIGOモン（差分実装）

### STEP 5 に進む条件

- SAKUモン Phase 1〜4 が全て完了している
- SAKUモンで実際に講師・生徒データが動いている状態

### 差分は4箇所だけ

| 箇所 | 変更内容 |
|---|---|
| ZPD計算 | `zpdWeights.ts` 新規作成（モード別重み） |
| ダッシュボード | モード別スコア表示 + exam_mode/target_exam カラム追加 |
| SDT例文 | 英語学習向けに差し替え |
| Stripe Price ID | EIGOモン用に別途作成 |

### Claude Codeへの指示（コピペ用）

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/B2B実装指示書_ClaudeCode用.md の「EIGOモン差分セクション」
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts
- /Users/ryuki/Desktop/eigomon/src/lib/score.ts
- /Users/ryuki/Desktop/sakumon/src/app/api/b2b/（SAKUモンの完成済み実装を参考に）

E-1（DBマイグレーション）から順番に実装してください。
差分セクションに記載のない箇所はSAKUモンと同じ実装をEIGOモンにコピーしてください。
```

### 完了の確認方法

```
□ EIGOモンのSupabaseに全テーブルが作成されている
□ calcZpdScore('toeic', ...) と calcZpdScore('eiken', ...) で異なる値が返る
□ 教師ダッシュボードにモード列が表示される
□ SDTメッセージ例文が英語学習向けになっている
□ EIGOモン用 Stripe Price ID で決済が通る
```

---

## 詰まった時の判断フロー

```
エラーが出た
  ├─ RLSエラー（row violates RLS）
  │   └─ createClient に SERVICE_ROLE_KEY を使っているか確認
  │
  ├─ Stripe Webhook が届かない
  │   └─ ローカル: stripe listen --forward-to localhost:3000/api/stripe/webhook
  │   └─ 本番: Stripe Dashboard > Webhooks でエンドポイントURL確認
  │
  ├─ Cron が動かない
  │   └─ Vercel Dashboard > Cron Jobs で認識されているか確認
  │   └─ CRON_SECRET が Vercel 環境変数に設定されているか確認
  │
  ├─ 型エラーが大量に出る
  │   └─ supabase.ts の型定義が古い → supabase gen types で再生成
  │
  └─ マイグレーションエラー
      └─ Supabase Dashboard > SQL Editor で直接実行してエラー内容を確認
```

---

## 環境変数の管理

`.env.local`（ローカル開発用）と Vercel Dashboard（本番用）の両方に設定が必要です。

### SAKUモン

```bash
# Stripe（本番は本番キーに切り替え）
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_B2B_TEACHER_PLAN_PRICE_ID=price_xxx
STRIPE_B2B_CLASSROOM_BASE_PRICE_ID=price_xxx
STRIPE_B2B_CLASSROOM_PER_TEACHER_PRICE_ID=price_xxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# 運用
CRON_SECRET=your_random_32char_string
ADMIN_EMAIL=your@email.com
SLACK_ALERT_WEBHOOK_URL=https://hooks.slack.com/xxx  # 任意
```

### EIGOモン（SAKUモンとは別プロジェクト）

```bash
# Stripe（EIGOモン専用 Price ID）
STRIPE_B2B_TEACHER_PLAN_PRICE_ID=price_yyy   # ← SAKUモンとは別
STRIPE_B2B_CLASSROOM_BASE_PRICE_ID=price_yyy
STRIPE_B2B_CLASSROOM_PER_TEACHER_PRICE_ID=price_yyy

# Supabase（EIGOモン専用プロジェクト）
NEXT_PUBLIC_SUPABASE_URL=https://yyy.supabase.co   # ← SAKUモンとは別
NEXT_PUBLIC_SUPABASE_ANON_KEY=yyy
SUPABASE_SERVICE_ROLE_KEY=yyy

# 運用（SAKUモンと共通でOK）
CRON_SECRET=same_as_sakumon_is_fine
ADMIN_EMAIL=your@email.com
SLACK_ALERT_WEBHOOK_URL=https://hooks.slack.com/xxx
```

---

## 収益化のタイミング

| ステップ | 収益化開始できるもの |
|---|---|
| STEP 1 完了 | 講師プラン（¥1,980/月）の販売開始 |
| STEP 2 完了 | 教室プラン（¥9,800〜/月）の販売開始 |
| STEP 3 完了 | 法令対応完了 → 大手塾・学校法人への営業が可能に |
| STEP 5 完了 | EIGOモンでも同じプラン構成で展開 |

**STEP 1 だけでも販売できます。完璧を待たずに売り始めてください。**
