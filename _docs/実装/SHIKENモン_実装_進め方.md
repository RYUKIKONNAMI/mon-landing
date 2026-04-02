# SHIKENモン 実装 進め方ガイド

作成日: 2026-04-01
関連ファイル:
- SHIKENモン_実装指示書_ClaudeCode用.md（Claude Codeへの具体的な指示）v2.0
- SHIKENモン_企画書_最終版.md（設計の全体像・100/100点）

---

## ステップ全体像

```
STEP 0  プロジェクト作成・DB基盤（1週間）
        └─ Next.js作成 → テーブル作成 → 型定義

STEP 1  PDF→カード生成 MVP（2週間）
        └─ アップロード → Gemini → フラッシュカードUI
        └─ ここでベータ公開・協力者3大学にシードデッキ作成依頼

STEP 2  デッキ公開・シェア・決済（2週間）
        └─ シェアURL → Stripe → MONパス統合
        └─ ここで試験月パス販売開始（2026年9月 前期試験期）

STEP 3  OCR品質分岐・AI的中率（3週間）← v1.0
        ├─ 3-1: 画像型PDF・OCR品質分岐
        ├─ 3-2: 的中報告API・Cf計算
        ├─ 3-3: フィードバック画面（試験後3軸評価 + L1/L2/L3申告）
        ├─ 3-4: 的中率バッジUI
        ├─ 3-5: Vercel Cronジョブ（通知・集計）
        ├─ 3-6: MONポイント付与
        └─ 3-7: 解約防止フロー（/settings/cancel）
        └─ 2027年1月 v1.0リリース

STEP 4  国家試験モード・スケール（後回し）← v2.0
        └─ fuzzy match → 国試モード
        └─ 2027年7月 v2.0リリース
```

---

## STEP 0: プロジェクト作成・DB基盤

### やること（順番通りに）

1. ターミナルで以下を実行:
   ```
   cd /Users/ryuki/Desktop
   npx create-next-app@latest shikenmon --typescript --tailwind --eslint --app --src-dir
   cd shikenmon
   npm install @supabase/supabase-js @supabase/ssr stripe @google/generative-ai pdf-parse react-card-flip react-dropzone
   npm install -D @types/pdf-parse
   ```

2. Supabase で新しいプロジェクト「shikenmon」を作成
3. `.env.local` に環境変数をセット（実装指示書 0-2参照）
4. `migrations/0001_initial.sql` をSupabase SQL Editorで実行

### Claude Codeへの指示（コピペ用）

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/SHIKENモン_実装指示書_ClaudeCode用.md の「Phase 0」セクション
- /Users/ryuki/Desktop/mon-landing/SHIKENモン_企画書_最終版.md の【付録A】
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts（参考）
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts（参考）

Phase 0-3（DBマイグレーション）のSQLを作成して、
Phase 0-4（supabase.ts型定義）まで実装してください。
企画書付録Aを唯一の正典とし、カラムを1つも省略しないこと。
```

### 完了の確認方法

```
□ /Users/ryuki/Desktop/shikenmon が存在する
□ npm run dev -- -p 3001 でlocalhost:3001が起動する
□ Supabase Dashboard でテーブルが14個存在する（補完3テーブル含む）
□ RLSが全テーブルで有効になっている（profiles_ownポリシーを含む）
□ src/lib/supabase.ts に Deck, Card, HitRating, Subscription 型が定義されている
□ calcCf() がステップ関数として実装されている（対数計算ではない）
□ has_access() SQL関数が SECURITY DEFINER 付きで作成されている
```

---

## STEP 1: PDF→カード生成 MVP

### やること（順番通りに）

1. Supabase Storage でバケット「pdf-uploads」を作成（private）
2. /upload 画面（react-dropzone）
3. /api/pdf/check-duplicate（ハッシュ重複チェック）
4. /api/pdf/generate（Gemini カード生成）
5. /deck/[deckId]/study（フラッシュカード学習UI）
6. /dashboard（デッキ一覧 + 無料枠表示）

### Claude Codeへの指示（コピペ用）

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/SHIKENモン_実装指示書_ClaudeCode用.md の「Phase 1」セクション
- /Users/ryuki/Desktop/mon-landing/SHIKENモン_企画書_最終版.md のセクション4・6
- /Users/ryuki/Desktop/shikenmon/src/lib/supabase.ts

1-1（PDFアップロードUI）から順番に実装してください。
1-4bの確認テスト機能も忘れずに実装してください。
Gemini APIキーは環境変数 GEMINI_API_KEY から取得してください。
カードのimportance_scoreはFLOAT（0.0〜1.0）で保存すること（TEXT型禁止）。
```

### 完了の確認方法

```
□ /upload でPDFをドロップするとSupabase Storageにアップロードされる
□ テキスト型PDFを選ぶとカードが20〜40枚生成される（60秒以内）
□ カードのimportance_scoreがFLOAT値（0.0〜1.0）で保存されている
□ /deck/[deckId]/study でカードをフリップできる
□ /deck/[deckId]/quiz で4択または穴埋めテストができる
□ 「知ってた/知らなかった」でリピートキューが動く
□ 3回使用後に「無料枠を使い切りました」が表示される
□ PDFがStorageから削除されていることをSupabase Dashboardで確認
□ npm run build でエラーなし
```

### この時点でやること（ベータ公開前）

企画書14のコールドスタート計画に沿って実施:
| 大学 | コンタクト方法 | デッキ目標 | 期限 |
|------|--------------|-----------|------|
| 早稲田大学 商学部 | @waseda_sho_study にDM（「MONパス3ヶ月プレゼント」） | 4デッキ | **2026/8/15** |
| 慶應義塾大学 経済学部 | EIGOモン既存ユーザー（keio.jpドメイン）に一括メール | 4デッキ | **2026/8/15** |
| 明治大学 経営学部 | Discord「明治大学非公式サーバー」#勉強部屋 に告知 | 4デッキ | **2026/8/31** |

---

## STEP 2: デッキ公開・シェア・決済

### やること（順番通りに）

1. デッキ公開/非公開トグル
2. /deck/share/[deckId]（未ログイン着地画面）
3. OGP画像生成API（@vercel/og）
4. Stripe Products 作成:
   - 「試験月パス」¥398/月（recurring） → STRIPE_SHIKEN_MONTHLY_PRICE_ID を .env.local に
   - MONパス月額・年額は SAKUモンの Price ID をそのまま使用
5. /api/stripe/checkout
6. /api/stripe/webhook（冪等性込み）
7. /pricing ページ + アップセルモーダル

### Claude Codeへの指示（コピペ用）

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/SHIKENモン_実装指示書_ClaudeCode用.md の「Phase 2」セクション
- /Users/ryuki/Desktop/sakumon/src/app/api/stripe/checkout/route.ts（参考）
- /Users/ryuki/Desktop/sakumon/src/app/api/stripe/webhook/（参考）
- /Users/ryuki/Desktop/shikenmon/src/lib/supabase.ts

【Phase 2開始前の必須確認】
/Users/ryuki/Desktop/sakumon/src/lib/supabase.ts を開いて、
subscriptionsテーブルに pause_until / canceled_at / current_period_end が存在するか確認してください。
存在しない場合は syncToOther() の該当フィールドをコメントアウトして「TODO」を明記してください。

2-3（Stripe決済）から実装してください。
冪等性のために webhook_events テーブルを使用してください（stripe_eventsは使用禁止）。
```

### 完了の確認方法

```
□ Stripe テストモードで試験月パスの決済が通る
□ 決済後 subscriptions テーブルに status=active のレコードが入る
□ webhook_events テーブルに stripe_event_id が記録されている（stripe_eventsではない）
□ Webhook 受信後に free_usage の制限が解除される（has_access() = true）
□ デッキシェアURLを未ログインユーザーで開くとプレビューが表示される
□ OGPがSlack/LINEに貼ったときにカード枚数が表示される
□ SAKUモン・EIGOモンのsubscriptionsテーブルにも同期されている（syncToOther確認）
□ npm run build でエラーなし
```

### この時点でやること（リリース）

- Vercel にデプロイ（shiken-mon.com または shikenmon.vercel.app）
- Stripe を本番モードに切り替え
- SNS投稿: 「早稲田商・慶應経済・明治経営のデッキ、今すぐ使えます」
- 2026年9月 前期試験期 = リリース日

---

## STEP 3: OCR品質分岐・AI的中率

### やること（順番通りに）

1. PDF種別判定ロジック強化（画像型 → Gemini Vision）
2. /upload/review（OCR編集インライン UI）
3. /deck/[deckId]/feedback（試験後フィードバック画面・3軸評価 + L1/L2/L3申告）
4. /api/exam/report（的中した！報告 + Cf係数計算 + decks.hit_rate 更新）
5. 的中率バッジUI（学習画面・デッキカード）
6. Vercel Cron（finalize-reports: 毎時、remind: 毎朝0:00 UTC）
7. /api/mon-points/add（MONポイント付与）
8. /settings/cancel（解約防止フロー）

### Claude Codeへの指示（コピペ用）

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/SHIKENモン_実装指示書_ClaudeCode用.md の「Phase 3」セクション
- /Users/ryuki/Desktop/mon-landing/SHIKENモン_企画書_最終版.md のセクション6-2・8・9

3-1（画像型PDF）から順番に実装してください。
【重要】3-3はフィードバック画面（/deck/[deckId]/feedback）です。OCR編集UIは3-1に含まれています。
Cf係数はステップ関数で実装してください（Math.log禁止）。
lv1は廃止です。Cf=0.0の場合は'hidden'を返してください。
vercel.jsonへのCron登録: 3-2完了時にfinalize-reports、3-5完了時にremindを追加してください。
```

### 完了の確認方法

```
□ 画像型PDFをアップロードするとOCR編集画面に遷移する
□ 低スコアブロックがオレンジ枠でハイライトされる
□ インライン編集後にカード生成される
□ 試験後フィードバック画面（/deck/[deckId]/feedback）で3軸評価とL1/L2/L3申告ができる
□ フィードバック送信後に hit_ratings テーブルにレコードが入る
□ decks.hit_rate が更新される（L3×1.0 + L2×0.6 + L1×0.3 の加重計算）
□ Cf係数がステップ関数で計算されている（0-4件→0.0, 5-19件→0.5, 20-99件→0.8, 100件以上→1.0）
□ 評価4件以下のデッキは「報告待ち」グレー表示（'hidden'状態）
□ 評価20件以上のデッキは高精度バッジ（lv3）が表示される
□ MONポイントが /api/mon-points/add を通じて付与される
□ Vercel Dashboard でCronジョブが実行されている（finalize-reports: 毎時、remind: 毎朝0:00 UTC）
□ 解約ボタンを押すと蓄積データ確認画面（3ヶ月一時停止オファー付き）が表示される
□ npm run build でエラーなし
```

---

## STEP 4: 国家試験モード・スケール（v2.0）

### 実装判断タイミング

- MAU が 2,000人 を超えてから（2027年1〜3月頃）
- Option A→B DB移行は MAU 10,000 を超えてから（企画書12-2参照）

### Claude Codeへの指示（コピペ用）

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/SHIKENモン_実装指示書_ClaudeCode用.md の「Phase 4」セクション
- /Users/ryuki/Desktop/mon-landing/SHIKENモン_企画書_最終版.md のセクション4（fuzzy match）・9-1（国試モード）

4-1（fuzzy match）から実装してください。
まず Supabase で pg_trgm 拡張が有効か確認してください。
```

---

## トラブルシューティング

### Gemini API が遅い / タイムアウトする

- Vercel `maxDuration = 60` を確認（route.ts の先頭に `export const maxDuration = 60` を追加）
- プログレス表示でユーザーに待機を伝える（「平均XX秒」）
- PDF が大きすぎる場合: 「20MB以下・50P以下に分割してください」のガイダンスを返す

### Stripe Webhook が届かない

- ローカル: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- 本番: Stripe Dashboard > Webhooks > Endpoint URL が正しいか確認
- `STRIPE_WEBHOOK_SECRET` が Webhook Signing Secret と一致しているか確認

### RLS でデータが取得できない

- Supabase Dashboard > Authentication > Policies で対象テーブルのポリシーを確認
- Service Role Key でアクセスしているAPIではRLSをバイパスしてOK（Webhook等）
- クライアント側は anon key → RLS が効く → ユーザーのセッションが必要

### MONパス同期（syncToOther）が失敗する

- SAKUモン・EIGOモンの環境変数（SUPABASE_URL・SERVICE_ROLE_KEY）が設定されているか確認
- Promise.allSettled なので片方が失敗しても処理は続く（ログで確認）
- 手動再同期: Supabase Dashboard で直接 subscriptions テーブルを更新
- SAKUモン・EIGOモンの pause_until / canceled_at / current_period_end カラムが存在するか確認
- 存在しない場合は該当フィールドをコメントアウトして TODO を明記
- webhook_events テーブルを使用していること（stripe_events は使用禁止）

### hit_ratings テーブルへの書き込みが失敗する

- exams.hit: boolean は廃止。hit_ratings テーブルに l1_count/l2_count/l3_count/accuracy_score/clarity_score/coverage_score を保存すること
- RLSポリシー「hit_ratings_own」が設定されているか Supabase Dashboard で確認

### 的中率の計算が間違っている

- hit_count / total_report_count ではなく (L3×1.0 + L2×0.6 + L1×0.3) ÷ n × Cf が正しい計算式
- Cf計算は Math.log ではなくステップ関数を使用すること

---

## KPIモニタリング

| 指標 | 目標 | 確認場所 |
|------|------|---------|
| MAU | Month 3: 500人 | Supabase Dashboard > Table Editor > profiles |
| 試験月パス購入 | Month 3: 100件 | Stripe Dashboard > Payments |
| 有料転換率 | Month 3: 5% | （有料ユーザー数 ÷ MAU）|
| カード生成p95 | 60秒以内 | Vercel Dashboard > Functions > Duration |
| Webhook成功率 | 99%以上 | Stripe Dashboard > Webhooks > Recent deliveries |
| 的中フィードバック | 15%以上 | hit_ratings テーブルのレコード数 ÷ deck学習完了数 |

---

*企画書（100/100点）: /Users/ryuki/Desktop/mon-landing/SHIKENモン_企画書_最終版.md*
*実装指示書（v2.0）: /Users/ryuki/Desktop/mon-landing/SHIKENモン_実装指示書_ClaudeCode用.md*
