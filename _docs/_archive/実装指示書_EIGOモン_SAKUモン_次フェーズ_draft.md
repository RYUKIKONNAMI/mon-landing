# EIGOモン・SAKUモン 次フェーズ実装指示書（Claude Code用）

作成日: 2026-04-02
対象アプリ:
- EIGOモン: /Users/ryuki/Desktop/eigomon
- SAKUモン: /Users/ryuki/Desktop/sakumon
- LPサイト: /Users/ryuki/Desktop/mon-landing
根拠文書: /Users/ryuki/Desktop/mon-landing/EIGOモン_SAKUモン_次フェーズやることリスト.md

---

## ⚠️ 実装前に必ず読むこと：禁止事項・アンチパターン

```
【セキュリティ】
- Service Role Key はサーバーサイド（API Routes）のみ。クライアント側使用禁止
- RLSをbypassするadminクライアントはAPI Routes以外で使わない
- referralコードはサーバーサイドで検証する（クライアントから直接DBを書かない）

【型安全】
- TypeScript の any / as any は使用禁止。unknown + 型ガードを使うこと
- supabase.ts の型定義を変更した場合は必ずProfile型も更新する

【Stripe】
- 価格IDは必ず環境変数経由。ハードコード禁止
- payment mode の checkout.session では metadata に session_type を必ず含める

【DB】
- EIGOモンのSupabaseはSAKUモンと別インスタンス（URLが異なる）
- SQLマイグレーションは両アプリで別々に実行が必要
- ADD COLUMN IF NOT EXISTS を必ず使うこと（冪等性確保）

【Next.js】
- API Routesは /app/api/ 配下に配置（App Router形式）
- サーバーコンポーネントとクライアントコンポーネントを区別する
- "use client" ディレクティブが必要なファイルには明示的に追加
```

---

## セッション開始テンプレート

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts

今日実装するのは「Phase A-X: ○○」です。
```

---

## Phase A: 即座に実行可能（〜1週間）

---

### A-1. 偏差値カードX共有最適化（EIGOモン）

#### 概要
スキャン完了後のスコア表示画面に「Xでシェア」ボタンを追加し、動的OGP画像を生成する。

#### 事前確認ファイル
```
- /Users/ryuki/Desktop/eigomon/src/app/scan/page.tsx
- /Users/ryuki/Desktop/eigomon/src/app/quiz/page.tsx（スコア表示箇所の特定）
- /Users/ryuki/Desktop/eigomon/package.json（satori/sharpの有無確認）
```

#### A-1-1. 動的OGP画像エンドポイントの作成

**新規ファイル: `/Users/ryuki/Desktop/eigomon/src/app/api/og/score/route.tsx`**

```typescript
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const score = searchParams.get('score') ?? '??'
  const level = searchParams.get('level') ?? 'B1'
  const name = searchParams.get('name') ?? 'あなた'

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 32, color: '#94a3b8', marginBottom: 16 }}>EIGOモン</div>
        <div style={{ fontSize: 120, fontWeight: 900, color: '#f0f9ff' }}>{score}</div>
        <div style={{ fontSize: 40, color: '#7dd3fc', marginTop: 8 }}>偏差値</div>
        <div style={{ fontSize: 28, color: '#cbd5e1', marginTop: 24 }}>{name} · レベル {level}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
```

#### A-1-2. スコアカードにシェアボタンを追加

**対象ファイル: スキャン完了後スコアが表示されるコンポーネント**

スコア表示コンポーネント内に以下を追加:

```typescript
// X共有ボタン（スコア表示の下に配置）
const shareScore = (score: number, level: string) => {
  const text = `EIGOモンで偏差値${score}を記録！\n英語学習にAI使ってみた📚 #英語学習 #EIGOモン`
  const url = `https://eigomon.vercel.app`
  const ogUrl = `https://eigomon.vercel.app/api/og/score?score=${score}&level=${encodeURIComponent(level)}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  window.open(twitterUrl, '_blank', 'noopener,noreferrer')
}

// JSX内（スコア表示コンポーネントの下）
<button
  onClick={() => shareScore(currentScore, currentLevel)}
  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
  Xでシェア
</button>
```

#### A-1-3. メタタグへのOGP設定

スキャン完了ページ（またはスコア表示ページ）の `<head>` に動的OGPを設定。

App Routerの場合、`generateMetadata` 関数内で:

```typescript
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const score = searchParams.score
  const ogImageUrl = score
    ? `https://eigomon.vercel.app/api/og/score?score=${score}`
    : 'https://eigomon.vercel.app/og-default.png'

  return {
    openGraph: {
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogImageUrl],
    },
  }
}
```

#### A-1 完了チェックリスト
```
□ /api/og/score エンドポイントが存在し、パラメータを受け取りImageResponseを返す
□ スコア表示コンポーネントに「Xでシェア」ボタンが表示される
□ ボタンクリックでX共有ダイアログが開く
□ npm run build がエラーなしで完了すること
```

---

### A-2. SEO LP: /lp/toeic（mon-landing）

#### 概要
TOEIC・Quizlet流出ユーザー向けのSEOランディングページを作成する。

#### 事前確認ファイル
```
- /Users/ryuki/Desktop/mon-landing/src/app/ ディレクトリ構造
- /Users/ryuki/Desktop/mon-landing/src/app/page.tsx（既存LPの構成を参考にする）
- /Users/ryuki/Desktop/mon-landing/src/app/war/page.tsx（既存LPの実装パターン参考）
```

#### A-2-1. ページ作成

**新規ファイル: `/Users/ryuki/Desktop/mon-landing/src/app/lp/toeic/page.tsx`**

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TOEIC単語をAIが自動生成 | EIGOモン - Quizletより賢い英語学習',
  description: '写真1枚でTOEIC単語帳を自動作成。SM-2アルゴリズムで忘却曲線に沿って復習。Quizletの代わりを探している方に。無料3回試せます。',
  keywords: ['TOEIC 単語アプリ', 'Quizlet 代わり', '英語学習 AI', 'TOEIC 勉強法'],
  openGraph: {
    title: 'TOEIC単語をAIが自動生成 | EIGOモン',
    description: '写真1枚でTOEIC単語帳を自動作成。無料3回試せます。',
    url: 'https://mon-landing.vercel.app/lp/toeic',
  },
}

export default function ToeicLP() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="inline-block px-3 py-1 mb-6 text-xs font-medium bg-blue-900/50 text-blue-300 rounded-full border border-blue-800">
          Quizletより賢い・atama+より自由な英語学習
        </div>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          TOEIC単語を<br />
          <span className="text-blue-400">AIが自動生成</span>。<br />
          忘却曲線で復習まで全自動。
        </h1>
        <p className="text-slate-400 text-lg mb-10">
          テキストを写真で撮るだけ。AIが単語帳を作り、あなたの正答率に合わせて復習タイミングを自動調整します。
          Quizletに月額払っている方、まず無料で試してみてください。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://eigomon.vercel.app"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
          >
            無料で3回試す
          </a>
          <a
            href="https://eigomon.vercel.app/billing"
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
          >
            ¥398で7日間使い放題
          </a>
        </div>
      </section>

      {/* 差別化3点 */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">Quizletと比べると</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: '自動生成',
              quizlet: '自分でカードを作る必要あり',
              eigomon: '写真1枚で自動生成',
            },
            {
              title: '復習スケジュール',
              quizlet: '手動リマインド or 有料プランのみ',
              eigomon: 'SM-2アルゴリズムで自動最適化（無料）',
            },
            {
              title: '価格',
              quizlet: '月額$7.99〜（≈¥1,200）',
              eigomon: '¥398〜 / 月額¥980〜',
            },
          ].map((item) => (
            <div key={item.title} className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <div className="text-sm font-bold text-blue-400 mb-4">{item.title}</div>
              <div className="text-xs text-slate-500 mb-2">Quizlet</div>
              <div className="text-sm text-slate-400 mb-4">{item.quizlet}</div>
              <div className="text-xs text-blue-400 mb-2">EIGOモン</div>
              <div className="text-sm text-white">{item.eigomon}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 価格ラダー */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-10">まずは無料から始められます</h2>
        <div className="space-y-4">
          {[
            { plan: '無料', price: '¥0', desc: 'スキャン3回/月' },
            { plan: '7日間エントリーパス', price: '¥398', desc: '一回払い・使い放題', highlight: true },
            { plan: '月額', price: '¥980/月', desc: 'スキャン使い放題' },
            { plan: 'MONパス', price: '¥1,980/月', desc: 'EIGOモン+SAKUモン+SHIKENモン全部' },
          ].map((item) => (
            <div
              key={item.plan}
              className={`flex justify-between items-center px-6 py-4 rounded-xl border ${
                item.highlight
                  ? 'border-blue-500 bg-blue-950'
                  : 'border-slate-800 bg-slate-900'
              }`}
            >
              <div>
                <div className={`font-medium ${item.highlight ? 'text-blue-300' : 'text-white'}`}>
                  {item.plan}
                </div>
                <div className="text-sm text-slate-500">{item.desc}</div>
              </div>
              <div className={`font-bold text-lg ${item.highlight ? 'text-blue-300' : 'text-white'}`}>
                {item.price}
              </div>
            </div>
          ))}
        </div>
        <a
          href="https://eigomon.vercel.app"
          className="inline-block mt-8 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
        >
          今すぐ無料で始める
        </a>
      </section>
    </main>
  )
}
```

#### A-2 完了チェックリスト
```
□ /lp/toeic ページが存在しアクセスできる
□ メタタグ（title, description, OGP）が設定されている
□ ヒーロー・差別化3点・価格ラダー・CTAセクションが存在する
□ CTAリンクが正しいURL（eigomon.vercel.app）を指している
□ npm run build がエラーなしで完了すること
```

---

### A-3. 紹介者報酬 +3回（EIGOモン・SAKUモン）

#### 概要
紹介URLを通じて新規登録した場合に、紹介者のスキャン残数を+3回追加する仕組みを実装する。

#### 事前確認ファイル
```
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts（Profile型確認）
- /Users/ryuki/Desktop/eigomon/src/app/api/（既存APIルート確認）
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts
```

#### A-3-1. DBマイグレーション（EIGOモン・SAKUモン両方で実行）

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- 既存ユーザー用: referral_codeを自動生成（Supabaseが提供するgen_random_uuid()を使用）
UPDATE profiles
SET referral_code = SUBSTRING(gen_random_uuid()::TEXT, 1, 8)
WHERE referral_code IS NULL;
```

#### A-3-2. EIGOモン — 型定義更新

**ファイル: `/Users/ryuki/Desktop/eigomon/src/lib/supabase.ts`**

`Profile` 型に追加:
```typescript
referral_code: string | null
referred_by: string | null
```

#### A-3-3. EIGOモン — referral API作成

**新規ファイル: `/Users/ryuki/Desktop/eigomon/src/app/api/referral/complete/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const eigomon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { newUserId, referralCode } = await request.json()

  if (!newUserId || !referralCode) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  // referral_codeからreferrer（紹介者）を検索
  const { data: referrer } = await eigomon
    .from('profiles')
    .select('id, remaining_uses')
    .eq('referral_code', referralCode)
    .single()

  if (!referrer) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
  }

  // 自己紹介防止
  if (referrer.id === newUserId) {
    return NextResponse.json({ error: 'Self-referral not allowed' }, { status: 400 })
  }

  // 既に紹介済みかチェック
  const { data: newUser } = await eigomon
    .from('profiles')
    .select('referred_by')
    .eq('id', newUserId)
    .single()

  if (newUser?.referred_by) {
    return NextResponse.json({ error: 'Already referred' }, { status: 400 })
  }

  // トランザクション的に実行（エラー時はどちらも更新されない）
  const [referrerUpdate, newUserUpdate] = await Promise.all([
    // 紹介者に+3回付与
    eigomon
      .from('profiles')
      .update({ remaining_uses: (referrer.remaining_uses ?? 0) + 3 })
      .eq('id', referrer.id),
    // 新規ユーザーにreferral記録
    eigomon
      .from('profiles')
      .update({ referred_by: referralCode })
      .eq('id', newUserId),
  ])

  if (referrerUpdate.error || newUserUpdate.error) {
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

#### A-3-4. EIGOモン — ホーム画面に紹介バナー追加

**ファイル: `/Users/ryuki/Desktop/eigomon/src/app/home/page.tsx`**

ユーザーの `referral_code` を取得して紹介URLを生成し、コピーボタン付きバナーを追加:

```typescript
// 紹介URLの生成（コンポーネント内）
const referralUrl = profile?.referral_code
  ? `https://eigomon.vercel.app/signup?ref=${profile.referral_code}`
  : null

// JSX内（適切な位置に追加）
{referralUrl && (
  <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 mb-4">
    <p className="text-sm font-medium text-blue-300 mb-2">
      友達に紹介すると <span className="font-bold">スキャン3回プレゼント</span> 🎁
    </p>
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={referralUrl}
        className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 truncate"
      />
      <button
        onClick={() => navigator.clipboard.writeText(referralUrl)}
        className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap"
      >
        コピー
      </button>
    </div>
  </div>
)}
```

#### A-3-5. EIGOモン — signup時のreferral処理

**ファイル: サインアップ処理があるコンポーネント（実際のファイルを確認して追記）**

サインアップ完了後（Supabaseの `onAuthStateChange` でユーザー作成を検知したタイミング）:

```typescript
// URLパラメータからrefコードを取得
const urlRef = new URLSearchParams(window.location.search).get('ref')
if (urlRef && user?.id) {
  await fetch('/api/referral/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newUserId: user.id, referralCode: urlRef }),
  })
}
```

#### A-3-6. SAKUモン — 同様の実装

EIGOモン（A-3-1〜A-3-5）と同様の実装をSAKUモンにも適用。
- `eigomon` クライアント変数を `sakumon` に置き換える
- URLは `https://sakumon-olive.vercel.app/signup?ref=...` を使用

#### A-3 完了チェックリスト
```
□ EIGOモン・SAKUモン両Supabaseで referral_code / referred_by カラムが追加されている
□ 型定義（supabase.ts）が更新されている
□ /api/referral/complete エンドポイントが存在する
□ 自己紹介・二重紹介を防ぐバリデーションが実装されている
□ ホーム画面に紹介URLバナーが表示される
□ サインアップ時にrefパラメータがあれば紹介処理が走る
□ npm run build がエラーなしで完了すること
```

---

### A-4. ¥398→MONパス アップセル通知（EIGOモン）

#### 概要
¥398 7日間パスの有効期限が切れた翌日にアップセルメールを送信し、billing pageにカウントダウンバナーを表示する。

#### 事前確認ファイル
```
- /Users/ryuki/Desktop/eigomon/src/app/api/（既存cronがあるか確認）
- /Users/ryuki/Desktop/eigomon/vercel.json（cronセクションの有無確認）
- /Users/ryuki/Desktop/eigomon/src/app/billing/page.tsx
```

#### A-4-1. Vercel Cron ジョブ作成

**新規ファイル: `/Users/ryuki/Desktop/eigomon/src/app/api/cron/light-pass-upsell/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const eigomon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  // Vercel Cronからの呼び出しであることを確認
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // light_pass_endが昨日に切れたユーザーを取得
  const { data: users } = await eigomon
    .from('profiles')
    .select('id, email, light_pass_end, subscription_status')
    .eq('light_pass_status', 'active')
    .gte('light_pass_end', yesterday.toISOString())
    .lt('light_pass_end', now.toISOString())

  if (!users || users.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sentCount = 0
  for (const user of users) {
    // 既にサブスク契約済みのユーザーにはメールしない
    if (user.subscription_status === 'active') continue
    if (!user.email) continue

    await resend.emails.send({
      from: 'EIGOモン <noreply@eigomon.vercel.app>',
      to: user.email,
      subject: '7日間パスが終了しました — MONパスで続けませんか？',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2>7日間エントリーパスが終了しました</h2>
          <p>ご利用ありがとうございます！</p>
          <p>
            MONパス（月額¥1,980）に切り替えると、
            <strong>月換算で¥399お得</strong>になります。
            また、SAKUモン・SHIKENモンも追加料金なしで使えます。
          </p>
          <a
            href="https://eigomon.vercel.app/billing"
            style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;"
          >
            MONパスに切り替える
          </a>
        </div>
      `,
    })

    // light_pass_statusをexpiredに更新
    await eigomon
      .from('profiles')
      .update({ light_pass_status: 'expired' })
      .eq('id', user.id)

    sentCount++
  }

  return NextResponse.json({ sent: sentCount })
}
```

#### A-4-2. vercel.json にcron設定追加

**ファイル: `/Users/ryuki/Desktop/eigomon/vercel.json`**（存在しない場合は新規作成）

既存の `crons` 配列に追加（または新規作成）:
```json
{
  "crons": [
    {
      "path": "/api/cron/light-pass-upsell",
      "schedule": "0 9 * * *"
    }
  ]
}
```

※ 既存のcron設定がある場合は既存配列に追加すること。上書きしない。

#### A-4-3. 環境変数追加

`/Users/ryuki/Desktop/eigomon/.env.local` に追記:
```
CRON_SECRET=（任意のランダム文字列、例: openssl rand -hex 32 で生成）
```

Vercelダッシュボードにも同じ `CRON_SECRET` を設定する。

#### A-4-4. billing pageにアップセルバナー追加

**ファイル: `/Users/ryuki/Desktop/eigomon/src/app/billing/page.tsx`**

`isLightPass` と `light_pass_end` を取得して、残り3日以内の場合にバナーを表示:

```typescript
// バナー表示条件の計算（コンポーネント内）
const lightPassEnd = profile?.light_pass_end ? new Date(profile.light_pass_end) : null
const daysRemaining = lightPassEnd
  ? Math.ceil((lightPassEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  : null
const showUpsellBanner = isLightPass && daysRemaining !== null && daysRemaining <= 3

// JSX内（¥398パスカードの下に追加）
{showUpsellBanner && (
  <div className="bg-amber-950 border border-amber-700 rounded-xl p-4 mb-4">
    <p className="text-sm text-amber-300 font-medium">
      ⏰ エントリーパスは残り<span className="font-bold text-amber-200">{daysRemaining}日</span>です
    </p>
    <p className="text-xs text-amber-400 mt-1">
      MONパス（¥1,980/月）に切り替えると月換算¥399お得。SAKUモン・SHIKENモンも使い放題。
    </p>
  </div>
)}
```

#### A-4 完了チェックリスト
```
□ /api/cron/light-pass-upsell エンドポイントが存在する
□ Authorization ヘッダー検証（CRON_SECRET）が実装されている
□ vercel.json に cron schedule が設定されている
□ .env.local に CRON_SECRET が追加されている
□ billing page に残り3日以下のアップセルバナーが表示される
□ npm run build がエラーなしで完了すること
```

---

## Phase B: 1〜2週間

---

### B-1. マイゴール機能（EIGOモン）

#### 概要
ユーザーが学習目標（TOEIC/英検スコア・目標日・学習モード）を設定し、ホーム画面に達成率ウィジェットを表示する。

#### 事前確認ファイル
```
- /Users/ryuki/Desktop/eigomon/src/app/home/page.tsx
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts（Profile型）
- /Users/ryuki/Desktop/eigomon/src/lib/hooks.ts
```

#### B-1-1. DBマイグレーション（EIGOモンのSupabaseで実行）

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS goal_target TEXT,
  ADD COLUMN IF NOT EXISTS goal_deadline DATE,
  ADD COLUMN IF NOT EXISTS goal_mode TEXT;

COMMENT ON COLUMN profiles.goal_target IS 'toeic_600 | toeic_730 | toeic_860 | toeic_990 | eiken_2 | eiken_pre1 | eiken_1 | custom';
COMMENT ON COLUMN profiles.goal_deadline IS '目標達成日';
COMMENT ON COLUMN profiles.goal_mode IS 'toeic | eiken | university | free';
```

#### B-1-2. 型定義更新

**ファイル: `/Users/ryuki/Desktop/eigomon/src/lib/supabase.ts`**

`Profile` 型に追加:
```typescript
goal_target: string | null
goal_deadline: string | null
goal_mode: string | null
```

#### B-1-3. マイゴール設定API

**新規ファイル: `/Users/ryuki/Desktop/eigomon/src/app/api/goal/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const eigomon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { userId, goalTarget, goalDeadline, goalMode } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  // goal_target のバリデーション
  const validTargets = ['toeic_600', 'toeic_730', 'toeic_860', 'toeic_990', 'eiken_2', 'eiken_pre1', 'eiken_1', 'custom']
  if (goalTarget && !validTargets.includes(goalTarget)) {
    return NextResponse.json({ error: 'Invalid goal_target' }, { status: 400 })
  }

  const { error } = await eigomon
    .from('profiles')
    .update({
      goal_target: goalTarget ?? null,
      goal_deadline: goalDeadline ?? null,
      goal_mode: goalMode ?? null,
    })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

#### B-1-4. ホーム画面にマイゴールウィジェット追加

**ファイル: `/Users/ryuki/Desktop/eigomon/src/app/home/page.tsx`**

ゴール設定ダイアログ + 達成率ウィジェットを追加:

```typescript
// 目標ラベルのマッピング
const GOAL_LABELS: Record<string, string> = {
  toeic_600: 'TOEIC 600点',
  toeic_730: 'TOEIC 730点',
  toeic_860: 'TOEIC 860点',
  toeic_990: 'TOEIC 990点',
  eiken_2: '英検2級',
  eiken_pre1: '英検準1級',
  eiken_1: '英検1級',
  custom: 'カスタム目標',
}

// 目標日までの残り日数計算
const daysToGoal = profile?.goal_deadline
  ? Math.ceil((new Date(profile.goal_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  : null

// JSX内（ウィジェット）
{profile?.goal_target ? (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
    <div className="flex justify-between items-start">
      <div>
        <div className="text-xs text-slate-500 mb-1">目標</div>
        <div className="font-medium text-white">{GOAL_LABELS[profile.goal_target] ?? profile.goal_target}</div>
        {daysToGoal !== null && daysToGoal > 0 && (
          <div className="text-xs text-slate-400 mt-1">あと{daysToGoal}日</div>
        )}
      </div>
      <button
        onClick={() => setGoalDialogOpen(true)}
        className="text-xs text-slate-500 hover:text-slate-300"
      >
        変更
      </button>
    </div>
  </div>
) : (
  <button
    onClick={() => setGoalDialogOpen(true)}
    className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-sm text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors mb-4"
  >
    + 目標を設定する
  </button>
)}
```

#### B-1-5. weekly-reviewプロンプトに目標情報を追加

**ファイル: `/Users/ryuki/Desktop/eigomon/src/app/api/weekly-review/route.ts`**

プロフィールから目標情報を取得してプロンプトに追加:

```typescript
// profile取得時に goal フィールドも取得していることを確認
// プロンプト内に追加:
const goalContext = profile?.goal_target
  ? `ユーザーの現在の目標: ${GOAL_LABELS[profile.goal_target] ?? profile.goal_target}${
      profile.goal_deadline ? `（目標日: ${profile.goal_deadline}）` : ''
    }`
  : ''

// promptの適切な位置に `${goalContext}` を挿入
```

#### B-1 完了チェックリスト
```
□ EIGOモンのSupabaseにgoal_target/goal_deadline/goal_modeカラムが追加されている
□ Profile型が更新されている
□ /api/goal エンドポイントが存在し、バリデーションが実装されている
□ ホーム画面にゴール設定ボタン/ウィジェットが表示される
□ weekly-reviewプロンプトに目標情報が含まれる
□ npm run build がエラーなしで完了すること
```

---

### B-2. マイゴール機能（SAKUモン）

#### 概要
EIGOモン（B-1）と同様だが、SAKUモン固有のゴールタイプ（論述テーマ・就活ES等）に対応する。

#### B-2-1. DBマイグレーション（SAKUモンのSupabaseで実行）

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS goal_type TEXT,
  ADD COLUMN IF NOT EXISTS goal_deadline DATE,
  ADD COLUMN IF NOT EXISTS goal_theme TEXT;

COMMENT ON COLUMN profiles.goal_type IS 'exam | es | grad | paper';
COMMENT ON COLUMN profiles.goal_deadline IS '目標達成日（試験日・就活締切日等）';
COMMENT ON COLUMN profiles.goal_theme IS '論述テーマや学習テーマ（自由テキスト）';
```

#### B-2-2. 型定義更新

**ファイル: `/Users/ryuki/Desktop/sakumon/src/lib/supabase.ts`**

`Profile` 型に追加:
```typescript
goal_type: string | null
goal_deadline: string | null
goal_theme: string | null
```

#### B-2-3. マイゴール設定API

**新規ファイル: `/Users/ryuki/Desktop/sakumon/src/app/api/goal/route.ts`**

B-1-3と同様の構成。バリデーション値を変更:
```typescript
const validTypes = ['exam', 'es', 'grad', 'paper']
if (goalType && !validTypes.includes(goalType)) {
  return NextResponse.json({ error: 'Invalid goal_type' }, { status: 400 })
}
```

#### B-2-4. ホーム画面にマイゴールウィジェット追加

**ファイル: `/Users/ryuki/Desktop/sakumon/src/app/home/page.tsx`**

B-1-4と同様の構成。ラベルをSAKUモン向けに変更:
```typescript
const GOAL_TYPE_LABELS: Record<string, string> = {
  exam: '定期試験対策',
  es: '就活ES対策',
  grad: '大学院入試',
  paper: '論文執筆',
}
```

#### B-2 完了チェックリスト
```
□ SAKUモンのSupabaseにgoal_type/goal_deadline/goal_themeカラムが追加されている
□ Profile型が更新されている
□ /api/goal エンドポイントが存在する
□ ホーム画面にゴール設定UIが表示される
□ npm run build がエラーなしで完了すること
```

---

### B-3. 成長レポート（SAKUモン）

#### 概要
EIGOモンの weekly-review に相当する機能をSAKUモンに新規実装する。SAKUモンの採点データから週次集計し、AIが成長サマリーを生成する。

#### 事前確認ファイル（SAKUモンのDB構造確認）
```
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/src/app/api/（既存APIルート確認）
- /Users/ryuki/Desktop/eigomon/src/app/api/weekly-review/route.ts（実装参考）
```

**⚠️ 重要**: SAKUモンのDBスキーマ（`quiz_sessions` や採点データを持つテーブル名・カラム名）を事前に `supabase.ts` で確認してから実装すること。テーブル名・カラム名は推測で実装しない。

#### B-3-1. Supabaseのスキーマ確認

SAKUモンのSupabaseで以下SQLを実行してテーブル構造を確認:
```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

確認した実際のテーブル名・カラム名に合わせて以降のクエリを調整すること。

#### B-3-2. weekly-review APIの実装

**新規ファイル: `/Users/ryuki/Desktop/sakumon/src/app/api/weekly-review/route.ts`**

EIGOモンの `/api/weekly-review/route.ts` を参考に、SAKUモンのデータ構造に合わせて実装:

- 週次採点セッションを集計（採点スコア・問題数・提出数）
- 前週比較（diff計算）
- Self-Compassion設計: `diff < 0` の場合は数値露出なし
- AIプロンプトに目標情報（`goal_type`, `goal_deadline`, `goal_theme`）を含める

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const sakumon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const now = new Date()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // ⚠️ 以下のテーブル名・カラム名はsupabase.tsのスキーマに合わせて変更すること
  const [{ data: thisSessions }, { data: prevSessions }, { data: profile }] = await Promise.all([
    sakumon.from('quiz_sessions').select('*').eq('user_id', userId).gte('created_at', weekStart.toISOString()),
    sakumon.from('quiz_sessions').select('*').eq('user_id', userId).gte('created_at', prevWeekStart.toISOString()).lt('created_at', weekStart.toISOString()),
    sakumon.from('profiles').select('goal_type, goal_deadline, goal_theme').eq('id', userId).single(),
  ])

  const thisAvg = thisSessions && thisSessions.length > 0
    ? thisSessions.reduce((sum: number, s: Record<string, unknown>) => sum + (typeof s.score === 'number' ? s.score : 0), 0) / thisSessions.length
    : 0

  let diff = 0
  if (prevSessions && prevSessions.length > 0) {
    const prevAvg = prevSessions.reduce((sum: number, s: Record<string, unknown>) => sum + (typeof s.score === 'number' ? s.score : 0), 0) / prevSessions.length
    diff = Math.round(thisAvg - prevAvg)
  }

  const trendNote = diff > 0
    ? `前週比+${diff}ptの成長`
    : diff < 0
      ? `前週より難しいテーマに挑戦した週（スコア変動あり）`
      : '前週と同水準'

  const goalContext = profile?.goal_type
    ? `目標: ${profile.goal_type}${profile.goal_deadline ? `（期限: ${profile.goal_deadline}）` : ''}${profile.goal_theme ? `・テーマ: ${profile.goal_theme}` : ''}`
    : ''

  const prompt = `
あなたはSAKUモン（論述力トレーニングAI）のコーチです。
ユーザーの今週の学習データを分析して、週次レポートを生成してください。

今週のセッション数: ${thisSessions?.length ?? 0}
今週の平均スコア: ${Math.round(thisAvg)}pt
トレンド: ${trendNote}
${goalContext}

${diff < 0 ? `
【重要・スコア低下週（Self-Compassion設計）】
- "summary" でスコア低下のパーセント数値を直接提示しないこと
- スコア低下を「難しいテーマへの挑戦」として帰属させること
- "nextWeekPlan" の前半は縮小目標（1問から再開）にすること
` : ''}

以下のJSONのみで返答せよ（コードブロック・説明文不要）:
{
  "greeting": "今週のあいさつ（1文）",
  "summary": "今週の学習まとめ（2〜3文）",
  "strengths": ["良かった点1", "良かった点2"],
  "challenges": ["課題点1", "課題点2"],
  "nextWeekPlan": "来週の学習プラン（3日分の具体的な行動）",
  "motivationalQuote": "モチベーションメッセージ（1文）",
  "trend": "up | down | flat"
}
`

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(prompt)
  const text = result.response.text().trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')

  let review: unknown
  try {
    review = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'AI parse error' }, { status: 500 })
  }

  return NextResponse.json({ review, sessionCount: thisSessions?.length ?? 0, avgScore: Math.round(thisAvg), diff })
}
```

#### B-3-3. Cron ジョブ（週次自動送信）

**新規ファイル: `/Users/ryuki/Desktop/sakumon/src/app/api/cron/weekly-review/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const sakumon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 先週アクティブだったユーザーを取得
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const { data: activeUsers } = await sakumon
    .from('quiz_sessions')
    .select('user_id')
    .gte('created_at', weekStart.toISOString())

  const uniqueUserIds = [...new Set(activeUsers?.map((u: { user_id: string }) => u.user_id) ?? [])]

  let sentCount = 0
  for (const userId of uniqueUserIds) {
    const { data: profile } = await sakumon
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (!profile?.email) continue

    // weekly-review APIを内部呼び出し
    const reviewRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/weekly-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (!reviewRes.ok) continue
    const { review } = await reviewRes.json()

    await resend.emails.send({
      from: 'SAKUモン <noreply@sakumon.vercel.app>',
      to: profile.email,
      subject: `📝 今週の成長レポートが届きました`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2>${review.greeting}</h2>
          <p>${review.summary}</p>
          <h3>来週のプラン</h3>
          <p>${review.nextWeekPlan}</p>
          <p style="color: #6366f1; font-style: italic;">${review.motivationalQuote}</p>
          <a href="https://sakumon-olive.vercel.app" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none;">SAKUモンで続ける</a>
        </div>
      `,
    })
    sentCount++
  }

  return NextResponse.json({ sent: sentCount })
}
```

**`/Users/ryuki/Desktop/sakumon/vercel.json`** に追加:
```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-review",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

#### B-3 完了チェックリスト
```
□ SAKUモンのDBスキーマ（テーブル名・カラム名）を確認してからクエリを実装している
□ /api/weekly-review エンドポイントが存在し、AIレスポンスをJSONで返す
□ Self-Compassion設計: diff < 0 のとき数値強調なし・縮小目標が含まれる
□ /api/cron/weekly-review エンドポイントが存在する
□ CRON_SECRET による認証が実装されている
□ vercel.json にcronスケジュールが設定されている
□ npm run build がエラーなしで完了すること
```

---

### B-4. 読書ストリーク + レベルシステム（SAKUモン）

#### 事前確認ファイル
```
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts（Profile型）
- /Users/ryuki/Desktop/sakumon/src/app/home/page.tsx
```

#### B-4-1. DBマイグレーション（SAKUモンのSupabaseで実行）

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS streak_days INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_last_date DATE,
  ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
```

#### B-4-2. 型定義更新

**ファイル: `/Users/ryuki/Desktop/sakumon/src/lib/supabase.ts`**

```typescript
streak_days: number | null
streak_last_date: string | null
level: number | null
```

#### B-4-3. ストリーク更新API

**新規ファイル: `/Users/ryuki/Desktop/sakumon/src/app/api/streak/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sakumon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function calcLevel(days: number): number {
  if (days >= 91) return 4
  if (days >= 31) return 3
  if (days >= 8) return 2
  return 1
}

export async function POST(request: Request) {
  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const { data: profile } = await sakumon
    .from('profiles')
    .select('streak_days, streak_last_date, level')
    .eq('id', userId)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]
  if (profile.streak_last_date === today) {
    // 今日すでに更新済み
    return NextResponse.json({ streak: profile.streak_days, level: profile.level, updated: false })
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const isConsecutive = profile.streak_last_date === yesterday

  const newStreak = isConsecutive ? (profile.streak_days ?? 0) + 1 : 1
  const newLevel = calcLevel(newStreak)

  await sakumon
    .from('profiles')
    .update({ streak_days: newStreak, streak_last_date: today, level: newLevel })
    .eq('id', userId)

  return NextResponse.json({ streak: newStreak, level: newLevel, leveledUp: newLevel > (profile.level ?? 1), updated: true })
}
```

#### B-4-4. ホーム画面にストリーク表示

**ファイル: `/Users/ryuki/Desktop/sakumon/src/app/home/page.tsx`**

ホーム画面ロード時にストリーク更新APIを呼び出し、ストリークカードを表示:

```typescript
const LEVEL_LABELS = ['', 'はじめて', 'ひよこ', 'のびしろ', 'ベテラン']

// ページロード時にAPI呼び出し（useEffectかサーバーアクションで）
useEffect(() => {
  if (user?.id) {
    fetch('/api/streak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
    .then(r => r.json())
    .then(data => {
      if (data.leveledUp) setShowLevelUpAnimation(true)
    })
  }
}, [user?.id])

// JSX内（ストリークカード）
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 flex items-center gap-4">
  <div className="text-3xl">🔥</div>
  <div>
    <div className="text-lg font-bold text-white">{profile?.streak_days ?? 0}日継続中</div>
    <div className="text-xs text-slate-500">Lv.{profile?.level ?? 1} {LEVEL_LABELS[profile?.level ?? 1]}</div>
  </div>
</div>
```

#### B-4 完了チェックリスト
```
□ SAKUモンのSupabaseにstreak_days/streak_last_date/levelカラムが追加されている
□ 型定義が更新されている
□ /api/streak エンドポイントが存在し、連続日数を正しく計算する
□ 当日2回目のアクセスでstreakが重複インクリメントされない
□ ホーム画面にストリークカードが表示される
□ npm run build がエラーなしで完了すること
```

---

## フェーズ別開始テンプレート

### Phase A-1（X共有）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（A-1セクション）
- /Users/ryuki/Desktop/eigomon/src/app/scan/page.tsx
- /Users/ryuki/Desktop/eigomon/src/app/quiz/page.tsx（存在する場合）
- /Users/ryuki/Desktop/eigomon/package.json

まず「禁止事項・アンチパターン」セクションを読んでから開始してください。
A-1 の実装を行ってください。
```

### Phase A-2（TOEIC LP）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（A-2セクション）
- /Users/ryuki/Desktop/mon-landing/src/app/page.tsx
- /Users/ryuki/Desktop/mon-landing/src/app/war/page.tsx

A-2 の実装を行ってください。
```

### Phase A-3（紹介報酬）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（A-3セクション）
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts
- /Users/ryuki/Desktop/eigomon/src/app/api/（既存APIの構造確認）
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts

まずEIGOモン側を実装し、次にSAKUモン側を実装してください。
```

### Phase A-4（アップセル通知）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（A-4セクション）
- /Users/ryuki/Desktop/eigomon/vercel.json（存在する場合）
- /Users/ryuki/Desktop/eigomon/src/app/billing/page.tsx

A-4 の実装を行ってください。
```

### Phase B-1（マイゴール EIGOモン）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（B-1セクション）
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts
- /Users/ryuki/Desktop/eigomon/src/app/home/page.tsx
- /Users/ryuki/Desktop/eigomon/src/app/api/weekly-review/route.ts

B-1 の実装を行ってください。
```

### Phase B-2（マイゴール SAKUモン）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（B-2セクション）
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/src/app/home/page.tsx

B-2 の実装を行ってください。
```

### Phase B-3（成長レポート SAKUモン）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（B-3セクション）
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/src/app/api/（既存APIルート確認）
- /Users/ryuki/Desktop/eigomon/src/app/api/weekly-review/route.ts（参考実装）

⚠️ まずSAKUモンのDBスキーマを確認してからクエリを記述してください。
B-3 の実装を行ってください。
```

### Phase B-4（ストリーク SAKUモン）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（B-4セクション）
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/src/app/home/page.tsx

B-4 の実装を行ってください。
```
