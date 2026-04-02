# EIGOモン・SAKUモン 差別化戦略反映 実装指示書（Claude Code用）

作成日: 2026-04-02
対象アプリ:
- EIGOモン: /Users/ryuki/Desktop/eigomon
- SAKUモン: /Users/ryuki/Desktop/sakumon
根拠文書: /Users/ryuki/Desktop/mon-landing/B2C成長戦略_完全版.md（差別化戦略v4反映版）

---

## ⚠️ 実装前に必ず読むこと：禁止事項・アンチパターン

```
【セキュリティ】
- Service Role Key はサーバーサイド（API Routes）のみ。クライアントサイド使用禁止
- RLSをbypassするadminクライアントはAPI Routes以外で使わない

【型安全】
- TypeScript の any / as any は使用禁止。unknown + 型ガードを使うこと
- supabase.ts の型定義を変更した場合は必ず Profile 型も更新する

【Stripe】
- 価格IDは必ず環境変数経由（STRIPE_ENTRY_PASS_PRICE_ID 等）。ハードコード禁止
- payment mode の checkout.session では metadata に session_type を必ず含める

【DB】
- EIGOモンのSupabaseはSAKUモンと別インスタンス。SQLマイグレーションは別々に実行
- light_pass_status / light_pass_end カラムはEIGOモンのみ追加が必要（SAKUモンには既存）
```

---

## セッション開始テンプレート（毎回のセッションで使用）

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン・SAKUモン_差別化戦略反映.md
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts
- /Users/ryuki/Desktop/eigomon/src/app/api/stripe/checkout/route.ts
- /Users/ryuki/Desktop/sakumon/src/app/api/stripe/checkout/route.ts

今日実装するのは「Phase X の X-X: ○○」です。
```

---

## Phase 1: ¥398 7日間エントリーパス（EIGOモン・SAKUモン共通）

### 前提条件（コード実装前にユーザーが手動で行うこと）

```
Stripeダッシュボードで以下を作成してください：
- 商品名: 7日間エントリーパス
- 価格: ¥398（JPY）
- 課金タイプ: 一回払い（One-time payment）
- 作成後、price_id を以下の env var に設定：
  eigomon/.env.local: STRIPE_ENTRY_PASS_PRICE_ID=price_xxxxxxxxxx
  sakumon/.env.local: STRIPE_ENTRY_PASS_PRICE_ID=price_xxxxxxxxxx
  （同じStripeアカウントなので同じprice_idでOK）
```

---

### 1-1. EIGOモン — DBマイグレーション

**Supabase SQL Editor で実行するSQL（EIGOモンのプロジェクトに対して）:**

```sql
-- EIGOモン profiles テーブルに light_pass カラムを追加
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS light_pass_status TEXT,
  ADD COLUMN IF NOT EXISTS light_pass_end TIMESTAMPTZ;

COMMENT ON COLUMN profiles.light_pass_status IS '7日間エントリーパスのステータス（active / null）';
COMMENT ON COLUMN profiles.light_pass_end IS '7日間エントリーパスの有効期限';
```

**上記SQLを `/Users/ryuki/Desktop/eigomon/migrations/0002_light_pass.sql` として保存すること。**

---

### 1-2. EIGOモン — supabase.ts 型定義更新

**ファイル: `/Users/ryuki/Desktop/eigomon/src/lib/supabase.ts`**

`Profile` 型に以下2フィールドを追加:
```typescript
light_pass_status: string | null
light_pass_end: string | null
```

`weekly_review: any | null` の直前に追加すること（既存フィールドの順序を変えない）。

---

### 1-3. EIGOモン — hooks.ts 更新

**ファイル: `/Users/ryuki/Desktop/eigomon/src/lib/hooks.ts`**

`useUsage` 関数内で `isSubscribed` の定義の直後に `isLightPass` を追加:

```typescript
const isLightPass =
  !isSubscribed &&
  profile?.light_pass_status === 'active' &&
  profile?.light_pass_end != null &&
  new Date(profile.light_pass_end) > new Date()
```

`return` 文に `isLightPass` を追加:
```typescript
return { usage, remaining, canGenerate, isSubscribed, isLightPass, warBonusAvailable, refreshUsage }
```

---

### 1-4. EIGOモン — checkout/route.ts 更新

**ファイル: `/Users/ryuki/Desktop/eigomon/src/app/api/stripe/checkout/route.ts`**

`TICKET_PLANS` の定義の下に `ENTRY_PASS_PLANS` を追加:

```typescript
// 7日間エントリーパス（都度課金・light_pass付与）
const ENTRY_PASS_PLANS: Record<string, { amount: number; name: string; durationDays: number }> = {
  seven_day_pass: {
    amount: 398,
    name: '7日間エントリーパス',
    durationDays: 7,
  },
}
```

`POST` ハンドラ内の `ticketPlan` 処理ブロックの下に以下を追加（`// サブスクリプション` の前）:

```typescript
// 7日間エントリーパス（都度課金・light_pass付与）
const entryPassPlan = ENTRY_PASS_PLANS[plan]
if (entryPassPlan) {
  const priceId = process.env.STRIPE_ENTRY_PASS_PRICE_ID
  if (!priceId) {
    return NextResponse.json({ error: 'Entry pass price not configured' }, { status: 500 })
  }
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'payment',
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/billing`,
    metadata: {
      userId,
      session_type: 'seven_day_pass',
      duration_days: String(entryPassPlan.durationDays),
    },
    customer_email: email,
  })
  return NextResponse.json({ url: session.url })
}
```

---

### 1-5. EIGOモン — webhook/route.ts 更新

**ファイル: `/Users/ryuki/Desktop/eigomon/src/app/api/stripe/webhook/route.ts`**

`checkout.session.completed` イベントのpayment modeブロック内で、既存の `credits` 処理の直後に以下を追加:

```typescript
// 7日間エントリーパス — light_pass 付与
if (session.metadata?.session_type === 'seven_day_pass' && userId) {
  const durationDays = parseInt(session.metadata?.duration_days ?? '7', 10)
  const lightPassEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
  await eigomon
    .from('profiles')
    .update({
      light_pass_status: 'active',
      light_pass_end: lightPassEnd,
    })
    .eq('id', userId)
}
```

---

### 1-6. EIGOモン — billing/page.tsx 更新

**ファイル: `/Users/ryuki/Desktop/eigomon/src/app/billing/page.tsx`**

`MON_PASS_PLANS` 定義の前に `ENTRY_PASS_PLAN` を追加:

```typescript
const ENTRY_PASS_PLAN = {
  key: 'seven_day_pass',
  label: '7日間エントリーパス',
  price: '¥398',
  sub: '7日間',
  description: '使い放題 · 一回払い · 無料枠が切れたらここから',
  entry: true,
}
```

billing pageのUIで最初に表示するカードとして追加する（MONパスより前、または無料枠の説明の直後）。

---

### 1-7. SAKUモン — checkout/route.ts 更新

**ファイル: `/Users/ryuki/Desktop/sakumon/src/app/api/stripe/checkout/route.ts`**

EIGOモン（1-4）と同様の `ENTRY_PASS_PLANS` を追加し、`POST` ハンドラに処理ブロックを追加。
`origin` は `'https://sakumon-olive.vercel.app'` を使用。
`metadata` は `{ userId, session_type: 'seven_day_pass', duration_days: '7' }`。

---

### 1-8. SAKUモン — webhook/route.ts 更新

**ファイル: `/Users/ryuki/Desktop/sakumon/src/app/api/stripe/webhook/route.ts`**

`checkout.session.completed` payment modeブロック内のクレジット付与処理の後に追加:

```typescript
// 7日間エントリーパス — light_pass 付与
if (session.metadata?.session_type === 'seven_day_pass' && userId) {
  const durationDays = parseInt(session.metadata?.duration_days ?? '7', 10)
  const lightPassEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
  await sakumon
    .from('profiles')
    .update({
      light_pass_status: 'active',
      light_pass_end: lightPassEnd,
    })
    .eq('id', userId)
}
```

---

### 1-9. SAKUモン — billing/page.tsx 更新

**ファイル: `/Users/ryuki/Desktop/sakumon/src/app/billing/page.tsx`**

EIGOモン（1-6）と同様に `ENTRY_PASS_PLAN` を追加してUIに表示。
SAKUモンには `isLightPass` がhooksに既実装のため追加不要。

---

### Phase 1 完了チェックリスト

```
□ EIGOモン: migrations/0002_light_pass.sql が存在する
□ EIGOモン: supabase.ts の Profile 型に light_pass_status / light_pass_end がある
□ EIGOモン: hooks.ts の useUsage が isLightPass を返している
□ EIGOモン: checkout/route.ts で seven_day_pass が ENTRY_PASS_PLANS に定義されている
□ EIGOモン: webhook/route.ts で seven_day_pass の light_pass 付与処理がある
□ EIGOモン: billing/page.tsx で ¥398 7日間パスカードが表示されている
□ SAKUモン: checkout/route.ts で seven_day_pass が定義されている
□ SAKUモン: webhook/route.ts で seven_day_pass の light_pass 付与処理がある
□ SAKUモン: billing/page.tsx で ¥398 7日間パスカードが表示されている
□ 両アプリ: npm run build がエラーなしで完了すること
□ 両アプリ: TypeScript 型エラーが 0 件であること
```

---

## Phase 2: ネガティブ週フィードバック Self-Compassion修正（EIGOモンのみ）

### 対象ファイル

`/Users/ryuki/Desktop/eigomon/src/app/api/weekly-review/route.ts`

### 現状の問題

`generateWeeklyReview` 関数内で前週比を計算後、`trendNote` に「前週比-XX%の変動」という数値を含む文字列を設定している。この文字列がAIプロンプトに渡され、AIが週次レビューの `summary` や `challenges` でスコア低下の数値を強調する可能性がある。

Self-Compassion理論（Deci & Ryan, 2000）に基づき、スコア低下週はユーザーの自己効力感を毀損する数値提示を避け、難易度への帰属と縮小目標提示に切り替える。

### 変更内容

**1. `trendNote` の計算ロジックを修正（`diff < 0` の場合）:**

現在:
```typescript
trendNote = diff > 0 ? `前週比+${diff}%の成長` : diff < 0 ? `前週比${diff}%の変動` : '前週と同水準'
```

変更後:
```typescript
trendNote = diff > 0
  ? `前週比+${diff}%の成長`
  : diff < 0
    ? `前週より難しいコンテンツに挑戦した週（スコア変動あり）`  // 数値露出しない
    : '前週と同水準'
```

変更理由: `前週比-XX%` の数値をAIプロンプトに渡さないことで、AIが summary/challenges でスコア低下数値を強調するのを防ぐ。

**2. AIプロンプトにスコア低下時の条件分岐指示を追加:**

`prompt` 変数のテキスト末尾（`以下のJSONのみで返答せよ` の直前）に追加:

```typescript
${diff < 0 ? `
【重要・スコア低下週の設計指示（Self-Compassion理論に基づく）】
今週はスコアが前週より低下しています。この場合、以下の設計思想を厳守してください：
- "trend" は "down" を設定してください
- "summary" でスコア低下のパーセント数値を直接提示しないでください（「〇%下がった」という表現禁止）
- "summary" はスコア低下を「難しいコンテンツへの挑戦」として帰属させてください（能力の限界ではなく難易度の問題として描写）
- "challenges" も同様に能力批判ではなくコンテンツ難易度・特定スキルへの帰属にしてください
- "greeting" は「今週は難しいテキストに挑んでいたね」のようなSelf-Compassionフレームにしてください
- "nextWeekPlan" の月〜水は「1セッションだけ」「得意なモードから再開」という縮小目標にしてください（ハードルを最小化）
- "motivationalQuote" は挑戦・立ち直り・継続に関するものを選んでください
` : ''}
```

**3. `diff` 変数をプロンプト内で参照できるよう変数スコープを確認:**

`diff` は `trendNote` の計算ブロック内で `const diff = ...` として定義されている。プロンプト文字列を生成する時点でも参照できるよう、`diff` を `trendNote` の計算ブロックの外に出す（または同一スコープ内に収まっているか確認する）こと。

現在のコード構造:
```typescript
if (prevSessions && prevSessions.length > 0) {
  const prevAvg = ...
  const thisAvg = ...
  const diff = ...        // ← この diff をプロンプト内で使う
  trendNote = diff > 0 ? ... : ...
}

const prompt = `...`     // ← diff がスコープ外になっている
```

修正: `diff` を `if` ブロックの外で `let diff = 0` として宣言し、内部で値を代入する。

---

### Phase 2 完了チェックリスト

```
□ weekly-review/route.ts の trendNote が diff < 0 のとき数値を含まない文字列になっている
□ AIプロンプトに Self-Compassion 条件分岐が追加されている
□ diff 変数がプロンプト生成時点で参照できるスコープにある
□ npm run build がエラーなしで完了すること
□ TypeScript 型エラーが 0 件であること
```

---

## フェーズ別開始テンプレート

### Phase 1（¥398エントリーパス）開始時

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

まず「禁止事項・アンチパターン」セクションを読んでから開始してください。
Phase 1 の 1-1 〜 1-9 を順番に実装してください。
```

### Phase 2（Self-Compassionフィードバック修正）開始時

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン・SAKUモン_差別化戦略反映.md（Phase 2セクション）
- /Users/ryuki/Desktop/eigomon/src/app/api/weekly-review/route.ts

Phase 2 の変更内容に従い、generateWeeklyReview 関数のみを修正してください。
他のファイルは変更不要です。
```
