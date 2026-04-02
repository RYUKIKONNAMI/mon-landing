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
- API Routesでは必ずSupabase Auth JWTまたはCRON_SECRETでリクエストを認証すること

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

【実装前確認】
- 既存コードのパターン（変数名・エラーハンドリング形式）を必ず参照すること
- 新規APIは既存APIルート（checkout/route.ts等）のパターンに合わせること
```

---

## 既実装状況（2026-04-02時点）

以下は既に実装済みのため、「新規作成」ではなく「拡張」として扱うこと:

| 機能 | EIGOモン | SAKUモン |
|---|---|---|
| `referral_code` / `referred_by` カラム (DBおよびProfile型) | 実装済み | 実装済み |
| `/api/referral/route.ts`（コード生成） | 実装済み | 実装済み |
| `/api/track-ref/route.ts`（紹介記録＋報酬付与） | 実装済み | 実装済み |
| auth/page.tsxでのrefパラメータ処理（localStorage経由） | 実装済み | 実装済み |
| vercel.json の `/api/weekly-review` cron（毎週月曜0時） | 実装済み | 未設定 |
| vercel.json の `/api/report` cron（毎月1日0時） | 実装済み | 実装済み |

---

## セッション開始テンプレート（汎用）

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts

「⚠️ 実装前に必ず読むこと」セクションを確認してから実装を開始してください。
今日実装するのは「Phase X-Y: ○○」です。
```

---

## Phase A: 即座に実行可能（〜1週間）

---

### A-1. 偏差値カードX共有最適化（EIGOモン）

#### 概要
スキャン完了後のスコア表示画面に「Xでシェア」ボタンを追加し、動的OGP画像を生成する。
シェア率 2% → 10% が目標。新規流入月+20〜40人が期待効果。

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

**対象ファイル: `/Users/ryuki/Desktop/eigomon/src/app/scan/page.tsx`**

scan/page.tsxを読んでスコアが表示される箇所（`sel_score` や `q4_rank` が表示されているJSXブロック）を特定し、そのブロックの末尾に以下のボタンを追加:

```typescript
// "use client" ディレクティブが既にあることを確認してから追加

// スコア表示ブロックの末尾に追加する関数とJSX
const shareScore = (score: number, level: string) => {
  const text = `EIGOモンで偏差値${score}を記録！\n英語学習にAI使ってみた📚 #英語学習 #EIGOモン`
  const url = `https://eigomon.vercel.app`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  window.open(twitterUrl, '_blank', 'noopener,noreferrer')
}

// JSX内（スコア数値表示の直下に配置）
<button
  onClick={() => shareScore(currentScore, currentLevel)}
  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors mt-4"
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
  Xでシェア
</button>
```

※ `currentScore` / `currentLevel` はscan/page.tsx内で実際に使われているスコア変数名に合わせること。

#### A-1-3. メタタグへのOGP設定

**対象ファイル: `/Users/ryuki/Desktop/eigomon/src/app/scan/page.tsx`**

App Routerの場合、ページの `generateMetadata` 関数（または静的 `metadata` エクスポート）を追加または更新:

```typescript
import type { Metadata } from 'next'

export async function generateMetadata({ searchParams }: { searchParams: { score?: string } }): Promise<Metadata> {
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
□ /api/og/score エンドポイントが存在し、?score=62&level=B2 のパラメータでImageResponseを返す
□ スコア表示コンポーネントに「Xでシェア」ボタンが表示される
□ ボタンクリックでX共有ダイアログが開く
□ OGPメタタグがscan/page.tsxに設定されている
□ npm run build がエラーなしで完了すること
```

---

### A-2. SEO LP: /lp/toeic（mon-landing）

#### 概要
TOEIC・Quizlet流出ユーザー向けのSEOランディングページを作成する。
月+50〜100オーガニック流入が期待効果。ターゲットキーワード: 「TOEIC 単語アプリ」「Quizlet 代わり」「英語学習 AI」

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
バイラル係数向上が目的。

**⚠️ 既実装状況の確認が必要**: 以下は既に実装済みのため、新規作成ではなく確認・追加のみ:
- `profiles.referral_code` / `profiles.referred_by` カラム: 両アプリのDBおよびProfile型に**実装済み**
- `/api/referral/route.ts`（referral_code生成API）: 両アプリに**実装済み**
- `/api/track-ref/route.ts`（紹介記録＋reported_credits +3付与）: 両アプリに**実装済み**
- `auth/page.tsx` でのlocalStorage経由refパラメータ処理: 両アプリに**実装済み**

**このフェーズで実装が必要なのは以下のみ:**

#### A-3-1. URLパラメータ → localStorage 保存の追加（EIGOモン）

**ファイル: `/Users/ryuki/Desktop/eigomon/src/app/auth/page.tsx`**

既存のauth/page.tsxには `localStorage.getItem('eigomon_ref')` の読み取りは実装済み。
しかし `/signup?ref=XXXX` URLのパラメータをlocalStorageに保存する処理が必要（ユーザーがトップページ等でrefリンクを踏んでから認証ページに来る場合のため）。

以下のルートハンドラを新規作成して、ref付きURLからのアクセスをlocalStorageに保存させる。
または、最も確実な方法として、`auth/page.tsx` の先頭に以下を追加:

```typescript
// "use client" ディレクティブの直後（既存のimport群の後）
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// AuthPage コンポーネント内の先頭（useState定義の直後）に追加:
const searchParams = useSearchParams()
useEffect(() => {
  const ref = searchParams.get('ref')
  if (ref) {
    localStorage.setItem('eigomon_ref', ref)
  }
}, [searchParams])
```

**ファイル: `/Users/ryuki/Desktop/sakumon/src/app/auth/page.tsx`**

同様に追加（localStorageキーは `sakumon_ref`）:

```typescript
// "use client" ディレクティブの直後（既存のimport群の後）
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// AuthPage コンポーネント内の先頭（useState定義の直後）に追加:
const searchParams = useSearchParams()
useEffect(() => {
  const ref = searchParams.get('ref')
  if (ref) {
    localStorage.setItem('sakumon_ref', ref)
  }
}, [searchParams])
```

#### A-3-2. EIGOモン — ホーム画面に紹介バナー追加

**ファイル: `/Users/ryuki/Desktop/eigomon/src/app/home/page.tsx`**

以下のステップで追加:

1. `useProfile` からの `profile.referral_code` を使って紹介URLを生成
2. バナーコンポーネントをJSXに追加（既存のJSX構造を確認してから適切な位置に配置）

```typescript
// コンポーネント内（既存のprofile取得の後）
const referralUrl = profile?.referral_code
  ? `https://eigomon.vercel.app/auth?ref=${profile.referral_code}`
  : null

// JSX内（使用状況カードの下など、ユーザーが目につく位置に追加）
{referralUrl && (
  <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 mb-4">
    <p className="text-sm font-medium text-blue-300 mb-2">
      友達に紹介すると <span className="font-bold">スキャン3回プレゼント</span>
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

#### A-3-3. SAKUモン — ホーム画面に紹介バナー追加

**ファイル: `/Users/ryuki/Desktop/sakumon/src/app/home/page.tsx`**

EIGOモンと同様の実装。URLとローカルの色味はSAKUモンに合わせる:

```typescript
// コンポーネント内（既存のprofile取得の後）
const referralUrl = profile?.referral_code
  ? `https://sakumon-olive.vercel.app/auth?ref=${profile.referral_code}`
  : null

// JSX内（SAKUモンのホーム画面の適切な位置に追加）
{referralUrl && (
  <div className="border rounded-xl p-4 mb-4" style={{ borderColor: 'var(--accent-light)', background: 'var(--accent-bg)' }}>
    <p className="text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
      友達に紹介すると <span className="font-bold">生成3回プレゼント</span>
    </p>
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={referralUrl}
        className="flex-1 text-xs rounded-lg px-3 py-2 truncate"
        style={{ background: 'var(--paper-dark)', border: '1px solid var(--border)', color: 'var(--ink-light)' }}
      />
      <button
        onClick={() => navigator.clipboard.writeText(referralUrl)}
        className="px-3 py-2 text-white text-xs rounded-lg whitespace-nowrap"
        style={{ background: 'var(--accent)' }}
      >
        コピー
      </button>
    </div>
  </div>
)}
```

#### A-3 完了チェックリスト
```
□ EIGOモン auth/page.tsx: ?ref= パラメータをlocalStorage('eigomon_ref')に保存する処理が追加されている
□ SAKUモン auth/page.tsx: ?ref= パラメータをlocalStorage('sakumon_ref')に保存する処理が追加されている
□ EIGOモン home/page.tsx に紹介URLバナーが表示される
□ SAKUモン home/page.tsx に紹介URLバナーが表示される
□ 紹介URLのパスが /auth?ref=... になっている（/signup ではなく /auth）
□ npm run build（EIGOモン・SAKUモン両方）がエラーなしで完了すること
```

---

### A-4. ¥398→MONパス アップセル通知（EIGOモン）

#### 概要
¥398 7日間パスの有効期限が切れた翌日にアップセルメールを送信し、billing pageにカウントダウンバナーを表示する。
¥398パス→MONパス転換率 15%が目標。

#### 事前確認ファイル
```
- /Users/ryuki/Desktop/eigomon/vercel.json（既存cronを確認してから追記する）
- /Users/ryuki/Desktop/eigomon/src/app/billing/page.tsx
- /Users/ryuki/Desktop/eigomon/src/lib/hooks.ts（isLightPass の定義確認）
```

#### 既存vercel.json の内容（確認済み）

```json
{
  "crons": [
    {
      "path": "/api/report",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/weekly-review",
      "schedule": "0 0 * * 1"
    }
  ]
}
```

**⚠️ 以下のcron追加時は既存の2エントリを残して配列に追加すること。上書き禁止。**

#### A-4-1. Vercel Cron ジョブ作成

**新規ファイル: `/Users/ryuki/Desktop/eigomon/src/app/api/cron/light-pass-upsell/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getEigomon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  // Vercel Cronからの呼び出しであることを確認
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const eigomon = getEigomon()
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // light_pass_endが昨日に切れたユーザーを取得
  // ⚠️ profilesテーブルにemailカラムは存在しない。auth.admin経由でemailを取得する
  const { data: users } = await eigomon
    .from('profiles')
    .select('id, light_pass_end, subscription_status')
    .eq('light_pass_status', 'active')
    .gte('light_pass_end', yesterday.toISOString())
    .lt('light_pass_end', now.toISOString())

  if (!users || users.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // auth.admin.listUsersでメールアドレスを取得（profilesテーブルにemailカラムなし）
  const { data: authData } = await eigomon.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map<string, string>(
    (authData?.users ?? []).map(u => [u.id, u.email ?? ''])
  )

  let sentCount = 0
  for (const user of users) {
    // 既にサブスク契約済みのユーザーにはメールしない
    if (user.subscription_status === 'active') continue

    const email = emailMap.get(user.id)
    if (!email) continue

    await resend.emails.send({
      from: 'EIGOモン <noreply@eigomon.vercel.app>',
      to: email,
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

**ファイル: `/Users/ryuki/Desktop/eigomon/vercel.json`**

既存の2エントリを保持したまま、3番目のエントリを追加:

```json
{
  "crons": [
    {
      "path": "/api/report",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/weekly-review",
      "schedule": "0 0 * * 1"
    },
    {
      "path": "/api/cron/light-pass-upsell",
      "schedule": "0 9 * * *"
    }
  ]
}
```

#### A-4-3. 環境変数追加

`/Users/ryuki/Desktop/eigomon/.env.local` に追記:
```
CRON_SECRET=（任意のランダム文字列、例: openssl rand -hex 32 で生成）
```

Vercelダッシュボードにも同じ `CRON_SECRET` を設定する。

**⚠️ 既存の `/api/report` と `/api/weekly-review` のcronも同じ `CRON_SECRET` で認証している可能性があるため、既存ルートのAuthorizationヘッダー検証コードを確認してから設定すること。**

#### A-4-4. billing pageにアップセルバナー追加

**ファイル: `/Users/ryuki/Desktop/eigomon/src/app/billing/page.tsx`**

既存ファイルの構造:
- `useUsage(user?.id)` が呼ばれており、`isLightPass` が `hooks.ts` から返される
- `hooks.ts` の `useUsage` は `{ usage, remaining, canGenerate, isSubscribed, isLightPass, warBonusAvailable, refreshUsage }` を返す（既実装）

以下をコンポーネント内に追加:

```typescript
// BillingPage コンポーネント内（既存の const { remaining } = useUsage(user?.id) の行を以下に拡張）
const { remaining, isLightPass } = useUsage(user?.id)

// バナー表示条件の計算（上記の後に追加）
const lightPassEnd = profile?.light_pass_end ? new Date(profile.light_pass_end) : null
const daysRemaining = lightPassEnd
  ? Math.ceil((lightPassEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  : null
const showUpsellBanner = isLightPass && daysRemaining !== null && daysRemaining <= 3

// JSX内（エントリーパスカードの直下に追加）
{showUpsellBanner && (
  <div className="bg-amber-950 border border-amber-700 rounded-xl p-4 mb-4">
    <p className="text-sm text-amber-300 font-medium">
      エントリーパスは残り<span className="font-bold text-amber-200">{daysRemaining}日</span>です
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
□ emailはprofilesテーブルではなくauth.admin.listUsers経由で取得している
□ vercel.json に3エントリが存在し、既存エントリが削除されていない
□ .env.local に CRON_SECRET が追加されている
□ billing page に残り3日以下のアップセルバナーが表示される
□ useUsage の戻り値から isLightPass が正しく取得されている
□ npm run build がエラーなしで完了すること
```

---

## Phase B: 1〜2週間

---

### B-1. マイゴール機能（EIGOモン）

#### 概要
ユーザーが学習目標（TOEIC/英検スコア・目標日・学習モード）を設定し、ホーム画面に達成率ウィジェットを表示する。
SDT自律性充足による継続率+2ヶ月が期待効果。

#### 事前確認ファイル
```
- /Users/ryuki/Desktop/eigomon/src/app/home/page.tsx
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts（Profile型の末尾確認）
- /Users/ryuki/Desktop/eigomon/src/lib/hooks.ts（useProfile戻り値の確認）
- /Users/ryuki/Desktop/eigomon/src/app/api/weekly-review/route.ts（プロンプト拡張箇所の確認）
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

`Profile` 型の `war_banned: boolean | null` の後に以下を追加:

```typescript
  war_banned: boolean | null
  // --- B-1で追加 ---
  goal_target: string | null     // 'toeic_600' | 'toeic_730' | 'toeic_860' | 'toeic_990' | 'eiken_2' | 'eiken_pre1' | 'eiken_1' | 'custom'
  goal_deadline: string | null   // ISO date string (YYYY-MM-DD)
  goal_mode: string | null       // 'toeic' | 'eiken' | 'university' | 'free'
```

#### B-1-3. マイゴール設定API

**新規ファイル: `/Users/ryuki/Desktop/eigomon/src/app/api/goal/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getEigomon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const VALID_TARGETS = ['toeic_600', 'toeic_730', 'toeic_860', 'toeic_990', 'eiken_2', 'eiken_pre1', 'eiken_1', 'custom'] as const
const VALID_MODES = ['toeic', 'eiken', 'university', 'free'] as const

export async function POST(request: Request) {
  const body: unknown = await request.json()
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const { userId, goalTarget, goalDeadline, goalMode } = body as Record<string, unknown>

  if (typeof userId !== 'string' || !userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  // goal_target のバリデーション
  if (goalTarget !== undefined && goalTarget !== null && !VALID_TARGETS.includes(goalTarget as typeof VALID_TARGETS[number])) {
    return NextResponse.json({ error: 'Invalid goal_target' }, { status: 400 })
  }

  // goal_mode のバリデーション
  if (goalMode !== undefined && goalMode !== null && !VALID_MODES.includes(goalMode as typeof VALID_MODES[number])) {
    return NextResponse.json({ error: 'Invalid goal_mode' }, { status: 400 })
  }

  // goal_deadline の形式チェック（YYYY-MM-DD）
  if (goalDeadline !== undefined && goalDeadline !== null) {
    if (typeof goalDeadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(goalDeadline)) {
      return NextResponse.json({ error: 'Invalid goal_deadline format (expected YYYY-MM-DD)' }, { status: 400 })
    }
  }

  const eigomon = getEigomon()
  const { error } = await eigomon
    .from('profiles')
    .update({
      goal_target: (goalTarget as string) ?? null,
      goal_deadline: (goalDeadline as string) ?? null,
      goal_mode: (goalMode as string) ?? null,
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

home/page.tsxを読んで既存のstate定義・JSX構造を確認してから以下を追加:

```typescript
// "use client" ディレクティブが既にあることを確認

// 既存のuseState定義群の後に追加
const [goalDialogOpen, setGoalDialogOpen] = useState(false)
const [goalTarget, setGoalTarget] = useState('')
const [goalDeadline, setGoalDeadline] = useState('')
const [goalMode, setGoalMode] = useState('')

// 定数定義（コンポーネントの外または内に追加）
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

// 目標日までの残り日数計算（profileが取得された後に計算）
const daysToGoal = profile?.goal_deadline
  ? Math.ceil((new Date(profile.goal_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  : null

// 目標保存関数
const saveGoal = async () => {
  if (!user?.id) return
  await fetch('/api/goal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      goalTarget: goalTarget || null,
      goalDeadline: goalDeadline || null,
      goalMode: goalMode || null,
    }),
  })
  setGoalDialogOpen(false)
  // profileを再取得する（useProfileのsetProfileまたは window.location.reload()）
}

// JSX内（ホーム画面の上部に追加）
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

{/* 目標設定ダイアログ */}
{goalDialogOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm">
      <h3 className="font-bold text-white mb-4">目標を設定</h3>
      <div className="space-y-3">
        <select
          value={goalTarget}
          onChange={e => setGoalTarget(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="">目標スコアを選択</option>
          {Object.entries(GOAL_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          type="date"
          value={goalDeadline}
          onChange={e => setGoalDeadline(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
        />
        <select
          value={goalMode}
          onChange={e => setGoalMode(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="">学習モードを選択</option>
          <option value="toeic">TOEIC</option>
          <option value="eiken">英検</option>
          <option value="university">大学入試</option>
          <option value="free">自由学習</option>
        </select>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => setGoalDialogOpen(false)} className="flex-1 py-2 border border-slate-700 rounded-lg text-sm text-slate-400">
          キャンセル
        </button>
        <button onClick={saveGoal} className="flex-1 py-2 bg-blue-600 rounded-lg text-sm text-white font-medium">
          保存
        </button>
      </div>
    </div>
  </div>
)}
```

#### B-1-5. weekly-reviewプロンプトに目標情報を追加

**ファイル: `/Users/ryuki/Desktop/eigomon/src/app/api/weekly-review/route.ts`**

`generateWeeklyReview` 関数内の変更:

1. `supabase.from('profiles').select('stripe_price_id, weekly_review')` を以下に変更:

```typescript
// 変更前（route.ts 43行目付近）
const { data: profile } = await supabase
  .from('profiles')
  .select('stripe_price_id, weekly_review')
  .eq('id', userId)
  .single()
```

```typescript
// 変更後（generateWeeklyReview関数内のprofile取得、110行目付近）
const { data: profile } = await supabase
  .from('profiles')
  .select('stripe_price_id, weekly_review, goal_target, goal_deadline, goal_mode')
  .eq('id', userId)
  .single()
```

2. プロンプト文字列内（`${trendNote ? ...` の後）に以下を挿入:

```typescript
// route.ts内、GOAL_LABELSをgenerateWeeklyReview関数の直前（ファイル最上部のimport後）に追加
const GOAL_LABELS: Record<string, string> = {
  toeic_600: 'TOEIC 600点', toeic_730: 'TOEIC 730点', toeic_860: 'TOEIC 860点', toeic_990: 'TOEIC 990点',
  eiken_2: '英検2級', eiken_pre1: '英検準1級', eiken_1: '英検1級', custom: 'カスタム目標',
}

// generateWeeklyReview関数内のprompt構築直前に追加
const goalContext = profile?.goal_target
  ? `ユーザーの学習目標: ${GOAL_LABELS[profile.goal_target] ?? profile.goal_target}${
      profile.goal_deadline ? `（目標日: ${profile.goal_deadline}、あと${Math.ceil((new Date(profile.goal_deadline).getTime() - Date.now()) / 86400000)}日）` : ''
    }${profile.goal_mode ? `、学習モード: ${profile.goal_mode}` : ''}`
  : ''

// promptテンプレートの【今週のデータ】セクション末尾（trendNoteの後）に追加:
// ${goalContext ? `- 学習目標: ${goalContext}` : ''}
```

#### B-1 完了チェックリスト
```
□ EIGOモンのSupabaseにgoal_target/goal_deadline/goal_modeカラムが追加されている
□ /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts の Profile型が更新されている
□ /api/goal エンドポイントが存在し、unknown型+型ガードでバリデーションが実装されている
□ ホーム画面にゴール設定ボタン/ウィジェットが表示される
□ 目標設定ダイアログが開き、保存できる
□ weekly-reviewのprofile取得でgoal_target/goal_deadline/goal_modeも取得している
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

`Profile` 型の `referred_by: string | null` の後に以下を追加:

```typescript
  referred_by: string | null
  // --- B-2で追加 ---
  goal_type: string | null      // 'exam' | 'es' | 'grad' | 'paper'
  goal_deadline: string | null  // ISO date string (YYYY-MM-DD)
  goal_theme: string | null     // 自由テキスト
```

#### B-2-3. マイゴール設定API

**新規ファイル: `/Users/ryuki/Desktop/sakumon/src/app/api/goal/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSakumon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const VALID_TYPES = ['exam', 'es', 'grad', 'paper'] as const

export async function POST(request: Request) {
  const body: unknown = await request.json()
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const { userId, goalType, goalDeadline, goalTheme } = body as Record<string, unknown>

  if (typeof userId !== 'string' || !userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  // goal_type のバリデーション
  if (goalType !== undefined && goalType !== null && !VALID_TYPES.includes(goalType as typeof VALID_TYPES[number])) {
    return NextResponse.json({ error: 'Invalid goal_type' }, { status: 400 })
  }

  // goal_deadline の形式チェック（YYYY-MM-DD）
  if (goalDeadline !== undefined && goalDeadline !== null) {
    if (typeof goalDeadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(goalDeadline)) {
      return NextResponse.json({ error: 'Invalid goal_deadline format (expected YYYY-MM-DD)' }, { status: 400 })
    }
  }

  // goal_theme の長さ制限
  if (goalTheme !== undefined && goalTheme !== null) {
    if (typeof goalTheme !== 'string' || goalTheme.length > 200) {
      return NextResponse.json({ error: 'goal_theme too long (max 200 chars)' }, { status: 400 })
    }
  }

  const sakumon = getSakumon()
  const { error } = await sakumon
    .from('profiles')
    .update({
      goal_type: (goalType as string) ?? null,
      goal_deadline: (goalDeadline as string) ?? null,
      goal_theme: (goalTheme as string) ?? null,
    })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

#### B-2-4. ホーム画面にマイゴールウィジェット追加

**ファイル: `/Users/ryuki/Desktop/sakumon/src/app/home/page.tsx`**

home/page.tsxを読んで既存のstate定義・JSX構造を確認してから以下を追加:

```typescript
// 既存のuseState定義群の後に追加
const [goalDialogOpen, setGoalDialogOpen] = useState(false)
const [goalType, setGoalType] = useState('')
const [goalDeadline, setGoalDeadline] = useState('')
const [goalTheme, setGoalTheme] = useState('')

// 定数定義
const GOAL_TYPE_LABELS: Record<string, string> = {
  exam: '定期試験対策',
  es: '就活ES対策',
  grad: '大学院入試',
  paper: '論文執筆',
}

// 目標日までの残り日数計算
const daysToGoal = profile?.goal_deadline
  ? Math.ceil((new Date(profile.goal_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  : null

// 目標保存関数
const saveGoal = async () => {
  if (!user?.id) return
  await fetch('/api/goal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      goalType: goalType || null,
      goalDeadline: goalDeadline || null,
      goalTheme: goalTheme || null,
    }),
  })
  setGoalDialogOpen(false)
}

// JSX内（ホーム画面の適切な位置に追加）
{profile?.goal_type ? (
  <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--paper-dark)', border: '1px solid var(--border)' }}>
    <div className="flex justify-between items-start">
      <div>
        <div className="text-xs mb-1" style={{ color: 'var(--ink-light)' }}>目標</div>
        <div className="font-medium" style={{ color: 'var(--ink)' }}>{GOAL_TYPE_LABELS[profile.goal_type] ?? profile.goal_type}</div>
        {profile.goal_theme && (
          <div className="text-xs mt-1" style={{ color: 'var(--ink-light)' }}>{profile.goal_theme}</div>
        )}
        {daysToGoal !== null && daysToGoal > 0 && (
          <div className="text-xs mt-1" style={{ color: 'var(--ink-light)' }}>あと{daysToGoal}日</div>
        )}
      </div>
      <button
        onClick={() => setGoalDialogOpen(true)}
        className="text-xs"
        style={{ color: 'var(--ink-light)' }}
      >
        変更
      </button>
    </div>
  </div>
) : (
  <button
    onClick={() => setGoalDialogOpen(true)}
    className="w-full py-3 rounded-xl text-sm mb-4"
    style={{ border: '1px dashed var(--border)', color: 'var(--ink-light)' }}
  >
    + 目標を設定する
  </button>
)}

{/* 目標設定ダイアログ */}
{goalDialogOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
    <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: 'var(--paper)', border: '1px solid var(--border)' }}>
      <h3 className="font-bold mb-4" style={{ color: 'var(--ink)' }}>目標を設定</h3>
      <div className="space-y-3">
        <select
          value={goalType}
          onChange={e => setGoalType(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--paper-dark)', border: '1px solid var(--border)', color: 'var(--ink)' }}
        >
          <option value="">目標タイプを選択</option>
          {Object.entries(GOAL_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          type="date"
          value={goalDeadline}
          onChange={e => setGoalDeadline(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--paper-dark)', border: '1px solid var(--border)', color: 'var(--ink)' }}
        />
        <input
          type="text"
          placeholder="論述テーマ（任意）"
          value={goalTheme}
          onChange={e => setGoalTheme(e.target.value)}
          maxLength={200}
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--paper-dark)', border: '1px solid var(--border)', color: 'var(--ink)' }}
        />
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setGoalDialogOpen(false)}
          className="flex-1 py-2 rounded-lg text-sm"
          style={{ border: '1px solid var(--border)', color: 'var(--ink-light)' }}
        >
          キャンセル
        </button>
        <button
          onClick={saveGoal}
          className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          保存
        </button>
      </div>
    </div>
  </div>
)}
```

#### B-2 完了チェックリスト
```
□ SAKUモンのSupabaseにgoal_type/goal_deadline/goal_themeカラムが追加されている
□ /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts の Profile型が更新されている
□ /api/goal エンドポイントが存在し、unknown型+型ガードでバリデーションが実装されている
□ goal_theme のXSS対策（200文字制限）が実装されている
□ ホーム画面にゴール設定UIが表示される
□ npm run build がエラーなしで完了すること
```

---

### B-3. 成長レポート（SAKUモン）

#### 概要
EIGOモンの weekly-review に相当する機能をSAKUモンに新規実装する。
SDT有能感充足による継続率向上が目的。

#### 事前確認（必須）

**⚠️ 実装前にSAKUモンのDBスキーマを確認すること。**

SAKUモンのSupabaseで以下SQLを実行してテーブル構造を確認:
```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

SAKUモンの `/Users/ryuki/Desktop/sakumon/src/lib/supabase.ts` を読んだ限り、採点セッションは `sessions` テーブル（`sel_score`, `completed`, `created_at` 等を持つ）であることが確認済み。ただし `exam_mode` カラムは **SAKUモンのSessionには存在しない**（EIGOモンのみ）ため、以下のクエリはSAKUモンの実際のSessionスキーマに合わせること。

SAKUモンのSession型（/sakumon/src/lib/supabase.ts より）:
```
id, user_id, book_title, source_text, questions, sel_results, extract_ans,
extract_result, desc_answers, ule_results, sel_score, q4_rank, q5_rank,
completed, created_at
※ exam_mode は存在しない
```

#### 技術背景

EIGOモンのweekly-reviewは直接fetchでGemini APIを呼び出すパターンを使用。
SAKUモンも同じパターンを採用する（`GoogleGenerativeAI` SDKではなく直接fetch）。

#### B-3-1. Proチェックの実装方針決定

**`/Users/ryuki/Desktop/sakumon/src/app/billing/page.tsx`** を読んでSAKUモンのPro価格IDを確認する。
SAKUモンのbilling/page.tsxには `SAKUモン Pro: ¥2,980/月` が確認済み。
EIGOモンと同様にPro限定機能とするか、全ユーザー開放とするかを確認してから実装すること。

#### B-3-2. weekly-review APIの実装

**新規ファイル: `/Users/ryuki/Desktop/sakumon/src/app/api/weekly-review/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSakumon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5 },
      }),
    }
  )
  if (!res.ok) throw new Error('AI_ERROR:' + res.status)
  const data: unknown = await res.json()
  if (typeof data !== 'object' || data === null) throw new Error('AI_PARSE_ERROR')
  const candidates = (data as Record<string, unknown>).candidates
  if (!Array.isArray(candidates)) throw new Error('AI_NO_CANDIDATES')
  const text = (candidates[0] as Record<string, unknown>)?.content
  if (typeof text !== 'object' || text === null) throw new Error('AI_NO_CONTENT')
  const parts = (text as Record<string, unknown>).parts
  if (!Array.isArray(parts)) throw new Error('AI_NO_PARTS')
  return (parts[0] as Record<string, unknown>)?.text as string ?? ''
}

// GET: キャッシュ済み週次レビューを返す（オンデマンド生成も対応）
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const sakumon = getSakumon()

    const { data: profile } = await sakumon
      .from('profiles')
      .select('weekly_review, subscription_status, subscription_end')
      .eq('id', userId)
      .single()

    // ⚠️ Proチェック: SAKUモンの有料判定ロジックを確認してから実装
    // 暫定: subscription_statusが'active'のユーザーのみ対象
    const isSubscribed =
      profile?.subscription_status === 'active' &&
      profile?.subscription_end != null &&
      new Date(profile.subscription_end) > new Date()
    if (!isSubscribed) {
      return NextResponse.json({ error: 'SUBSCRIPTION_REQUIRED' }, { status: 403 })
    }

    // キャッシュ済みレビューを確認（3日以内はキャッシュを返す）
    const cached = profile?.weekly_review
    if (cached?.generated_at) {
      const ageMs = Date.now() - new Date(cached.generated_at).getTime()
      if (ageMs < 3 * 24 * 60 * 60 * 1000) {
        return NextResponse.json(cached)
      }
    }

    const review = await generateWeeklyReview(sakumon, userId)
    if (!review) {
      return NextResponse.json({ error: 'NOT_ENOUGH_DATA' }, { status: 404 })
    }
    return NextResponse.json(review)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST: Cron実行 — 全有料ユーザーの週次レビューを生成
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sakumon = getSakumon()

    const { data: activeProfiles } = await sakumon
      .from('profiles')
      .select('id, subscription_status, subscription_end')

    if (!activeProfiles) return NextResponse.json({ ok: true, count: 0 })

    const now = new Date()
    const subscribedUsers = activeProfiles.filter(p =>
      p.subscription_status === 'active' &&
      p.subscription_end != null &&
      new Date(p.subscription_end) > now
    )

    const results: { userId: string; status: string }[] = []
    for (const user of subscribedUsers) {
      try {
        const review = await generateWeeklyReview(sakumon, user.id)
        results.push({ userId: user.id, status: review ? 'generated' : 'skipped (no data)' })
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        results.push({ userId: user.id, status: `error: ${message}` })
      }
    }

    return NextResponse.json({ ok: true, results })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function generateWeeklyReview(sakumon: ReturnType<typeof getSakumon>, userId: string) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  // SAKUモンのSessionスキーマに合わせてselect（exam_modeはSAKUモンに存在しない）
  const [{ data: sessions }, { data: prevSessions }, { data: profile }] = await Promise.all([
    sakumon.from('sessions').select('sel_score, q4_rank, q5_rank, book_title, created_at')
      .eq('user_id', userId).eq('completed', true).gte('created_at', oneWeekAgo),
    sakumon.from('sessions').select('sel_score, created_at')
      .eq('user_id', userId).eq('completed', true)
      .gte('created_at', twoWeeksAgo).lt('created_at', oneWeekAgo),
    sakumon.from('profiles').select('goal_type, goal_deadline, goal_theme, weekly_review')
      .eq('id', userId).single(),
  ])

  if (!sessions || sessions.length === 0) return null

  const avgScore = sessions.reduce((sum, s) => sum + (s.sel_score ?? 0), 0) / sessions.length
  const books = [...new Set(sessions.map(s => s.book_title).filter(Boolean))].slice(0, 5)
  const q4Ranks = sessions.map(s => s.q4_rank).filter(Boolean) as string[]
  const q5Ranks = sessions.map(s => s.q5_rank).filter(Boolean) as string[]

  let diff = 0
  let trendNote = ''
  if (prevSessions && prevSessions.length > 0) {
    const prevAvg = prevSessions.reduce((sum, s) => sum + (s.sel_score ?? 0), 0) / prevSessions.length
    diff = Math.round(avgScore - prevAvg)
    trendNote = diff > 0
      ? `前週比+${diff}ptの成長`
      : diff < 0
        ? `前週より難しいテーマに挑戦した週（スコア変動あり）`
        : '前週と同水準'
  }

  const GOAL_TYPE_LABELS: Record<string, string> = {
    exam: '定期試験対策', es: '就活ES対策', grad: '大学院入試', paper: '論文執筆',
  }
  const goalContext = profile?.goal_type
    ? `目標: ${GOAL_TYPE_LABELS[profile.goal_type] ?? profile.goal_type}${profile.goal_deadline ? `（期限: ${profile.goal_deadline}）` : ''}${profile.goal_theme ? `・テーマ: ${profile.goal_theme}` : ''}`
    : ''

  const prompt = `あなたはSAKUモン（論述力トレーニングAI）の専属コーチです。
ユーザーの今週の学習データを分析して、週次成長レポートを生成してください。

【今週のデータ】
- セッション数: ${sessions.length}回
- 平均スコア: ${Math.round(avgScore)}pt
- 記述問題ランク（問4）: ${q4Ranks.join(', ') || 'なし'}
- 記述問題ランク（問5）: ${q5Ranks.join(', ') || 'なし'}
- 学習した教材: ${books.join('、') || '不明'}
${trendNote ? `- トレンド: ${trendNote}` : ''}
${goalContext ? `- ${goalContext}` : ''}

${diff < 0 ? `
【重要・スコア低下週（Self-Compassion設計）】
- "summary" でスコア低下のパーセント数値を直接提示しないこと
- スコア低下を「難しいテーマへの挑戦」として帰属させること
- "nextWeekPlan" の前半は縮小目標（1問から再開）にすること
- "trend" は "down" に設定すること
` : ''}

以下のJSONのみで返答せよ（コードブロック・説明文不要）:
{
  "greeting": "今週のあいさつ（20字以内、温かい導入）",
  "summary": "今週の学習まとめ（2〜3文、データに基づいた具体的な分析）",
  "highlights": ["良かった点1（20字以内）", "良かった点2（20字以内）"],
  "challenges": ["課題点1（20字以内）", "課題点2（20字以内）"],
  "nextWeekPlan": [
    {"day": "月〜水", "action": "具体的な学習アクション（30字以内）"},
    {"day": "木〜金", "action": "具体的な学習アクション（30字以内）"},
    {"day": "土〜日", "action": "復習と定着に焦点（30字以内）"}
  ],
  "motivationalQuote": "モチベーションメッセージ（25字以内）",
  "weeklyScore": 0から100の整数,
  "trend": "up | stable | down"
}`

  const raw = await callAI(prompt)
  const review: unknown = JSON.parse(raw.replace(/```json|```/g, '').trim())

  // weekly_reviewカラムに保存
  const reviewData = Object.assign(
    typeof review === 'object' && review !== null ? review : {},
    {
      sessionCount: sessions.length,
      avgScore: Math.round(avgScore),
      generated_at: new Date().toISOString(),
      week_start: oneWeekAgo,
      week_end: new Date().toISOString(),
    }
  )

  await sakumon
    .from('profiles')
    .update({ weekly_review: reviewData })
    .eq('id', userId)

  return reviewData
}
```

**⚠️ SAKUモンのprofilesテーブルに `weekly_review` カラムが存在しない場合は先にマイグレーションが必要:**
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS weekly_review JSONB;
```

#### B-3-3. Cron ジョブ（週次自動送信）

**新規ファイル: `/Users/ryuki/Desktop/sakumon/src/app/api/cron/weekly-review/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getSakumon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sakumon = getSakumon()

  // 先週アクティブだったユーザーIDを取得
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: activeSessions } = await sakumon
    .from('sessions')
    .select('user_id')
    .gte('created_at', weekStart)

  const uniqueUserIds = [...new Set((activeSessions ?? []).map(s => s.user_id))]

  // auth.admin.listUsersでemailマップを作成（profilesテーブルにemailカラムなし）
  const { data: authData } = await sakumon.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map<string, string>(
    (authData?.users ?? []).map(u => [u.id, u.email ?? ''])
  )

  let sentCount = 0
  for (const userId of uniqueUserIds) {
    const email = emailMap.get(userId)
    if (!email) continue

    // weekly-review APIを内部呼び出し
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sakumon-olive.vercel.app'
    const reviewRes = await fetch(`${appUrl}/api/weekly-review?userId=${userId}`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    })
    if (!reviewRes.ok) continue

    const review = await reviewRes.json() as Record<string, unknown>
    if (!review.greeting) continue

    await resend.emails.send({
      from: 'SAKUモン <noreply@sakumon-olive.vercel.app>',
      to: email,
      subject: `今週の成長レポートが届きました`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="font-size: 20px; margin-bottom: 12px;">${String(review.greeting ?? '')}</h2>
          <p style="color: #555;">${String(review.summary ?? '')}</p>
          <h3 style="font-size: 16px; margin-top: 20px;">来週のプラン</h3>
          ${Array.isArray(review.nextWeekPlan)
            ? (review.nextWeekPlan as { day: string; action: string }[])
                .map(p => `<p><strong>${p.day}</strong>: ${p.action}</p>`).join('')
            : ''}
          <p style="color: #6366f1; font-style: italic; margin-top: 16px;">${String(review.motivationalQuote ?? '')}</p>
          <a href="https://sakumon-olive.vercel.app"
            style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
            SAKUモンで続ける
          </a>
        </div>
      `,
    })
    sentCount++
  }

  return NextResponse.json({ sent: sentCount })
}
```

#### B-3-4. vercel.json にcron設定追加

**ファイル: `/Users/ryuki/Desktop/sakumon/vercel.json`**

既存の `/api/report` エントリを保持して追加:

```json
{
  "crons": [
    {
      "path": "/api/report",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/weekly-review",
      "schedule": "0 0 * * 1"
    },
    {
      "path": "/api/cron/weekly-review",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

#### B-3 完了チェックリスト
```
□ SAKUモンのDBスキーマを確認済み（sessions テーブルのカラム名が実装と一致している）
□ profilesテーブルに weekly_review JSONB カラムが存在する（なければマイグレーション実行）
□ /api/weekly-review エンドポイント（GET/POST）が存在する
□ AIはGoogleGenerativeAI SDKではなく直接fetch（EIGOモンと同パターン）で呼び出している
□ Self-Compassion設計: diff < 0 のとき数値強調なし・縮小目標が含まれる
□ emailはprofilesテーブルではなくauth.admin.listUsers経由で取得している
□ /api/cron/weekly-review エンドポイントが存在する
□ CRON_SECRET による認証が実装されている
□ vercel.json に3エントリが存在し、既存エントリが削除されていない
□ NEXT_PUBLIC_APP_URL 環境変数が .env.local と Vercel に設定されている
□ npm run build がエラーなしで完了すること
```

---

### B-4. 読書ストリーク + レベルシステム（SAKUモン）

#### 概要
蓄積データロック → チャーン-10%が目標。
ログイン/生成ごとにストリーク日数をインクリメントし、レベルアップアニメーションでエンゲージメントを高める。

#### 事前確認ファイル
```
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts（Profile型）
- /Users/ryuki/Desktop/sakumon/src/app/home/page.tsx（既存state/JSX構造確認）
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

B-2で追加した `goal_theme: string | null` の後に追加:

```typescript
  goal_theme: string | null
  // --- B-4で追加 ---
  streak_days: number | null
  streak_last_date: string | null  // ISO date string (YYYY-MM-DD)
  level: number | null             // 1=はじめて, 2=ひよこ, 3=のびしろ, 4=ベテラン
```

#### B-4-3. ストリーク更新API

**新規ファイル: `/Users/ryuki/Desktop/sakumon/src/app/api/streak/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSakumon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function calcLevel(days: number): number {
  if (days >= 91) return 4
  if (days >= 31) return 3
  if (days >= 8) return 2
  return 1
}

export async function POST(request: Request) {
  const body: unknown = await request.json()
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const { userId } = body as Record<string, unknown>

  if (typeof userId !== 'string' || !userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const sakumon = getSakumon()

  const { data: profile } = await sakumon
    .from('profiles')
    .select('streak_days, streak_last_date, level')
    .eq('id', userId)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]  // UTC日付（JST対応が必要な場合は要調整）
  if (profile.streak_last_date === today) {
    // 今日すでに更新済み（重複インクリメント防止）
    return NextResponse.json({ streak: profile.streak_days, level: profile.level, updated: false })
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const isConsecutive = profile.streak_last_date === yesterday

  const newStreak = isConsecutive ? (profile.streak_days ?? 0) + 1 : 1
  const newLevel = calcLevel(newStreak)
  const prevLevel = profile.level ?? 1

  await sakumon
    .from('profiles')
    .update({ streak_days: newStreak, streak_last_date: today, level: newLevel })
    .eq('id', userId)

  return NextResponse.json({
    streak: newStreak,
    level: newLevel,
    leveledUp: newLevel > prevLevel,
    updated: true,
  })
}
```

#### B-4-4. ホーム画面にストリーク表示

**ファイル: `/Users/ryuki/Desktop/sakumon/src/app/home/page.tsx`**

home/page.tsxを読んで既存のstate・useEffect構造を確認してから追加。
B-2のgoalDialogOpen等のstateと同じコンポーネント内に以下を追加:

```typescript
// 既存のuseState定義群の後に追加（B-2のstateと一緒に）
const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false)

// 既存のuseEffect群の後に追加（user.idが変わったときに1回だけ実行）
useEffect(() => {
  if (!user?.id) return
  fetch('/api/streak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id }),
  })
    .then(r => r.json())
    .then((data: { leveledUp?: boolean }) => {
      if (data.leveledUp) {
        setShowLevelUpAnimation(true)
        setTimeout(() => setShowLevelUpAnimation(false), 3000)
      }
    })
    .catch(() => {})
}, [user?.id])

// 定数（コンポーネント外に定義可）
const LEVEL_LABELS = ['', 'はじめて', 'ひよこ', 'のびしろ', 'ベテラン'] as const

// JSX内（ホーム画面の上部に追加、B-2のゴールウィジェットの上）
<div className="rounded-xl p-4 mb-4 flex items-center gap-4" style={{ background: 'var(--paper-dark)', border: '1px solid var(--border)' }}>
  <div className="text-3xl">🔥</div>
  <div>
    <div className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
      {profile?.streak_days ?? 0}日継続中
    </div>
    <div className="text-xs" style={{ color: 'var(--ink-light)' }}>
      Lv.{profile?.level ?? 1} {LEVEL_LABELS[profile?.level ?? 1]}
    </div>
  </div>
</div>

{/* レベルアップアニメーション */}
{showLevelUpAnimation && (
  <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
    <div className="rounded-2xl px-8 py-6 text-center" style={{ background: 'var(--accent)', color: 'white' }}>
      <div className="text-4xl mb-2">🎉</div>
      <div className="text-xl font-bold">レベルアップ！</div>
      <div className="text-sm mt-1">Lv.{profile?.level ?? 1} {LEVEL_LABELS[profile?.level ?? 1]}</div>
    </div>
  </div>
)}
```

#### B-4 完了チェックリスト
```
□ SAKUモンのSupabaseにstreak_days/streak_last_date/levelカラムが追加されている
□ /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts の Profile型が更新されている
□ /api/streak エンドポイントが存在し、連続日数を正しく計算する
□ 当日2回目のアクセスでstreakが重複インクリメントされない（updated: false を返す）
□ unknown型+型ガードでバリデーションが実装されている
□ ホーム画面にストリークカード（🔥日数 + レベル）が表示される
□ レベルアップ時にアニメーションが3秒間表示される
□ npm run build がエラーなしで完了すること
```

---

## フェーズ別開始テンプレート

### Phase A-1（X共有）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（⚠️禁止事項・A-1セクション）
- /Users/ryuki/Desktop/eigomon/src/app/scan/page.tsx
- /Users/ryuki/Desktop/eigomon/src/app/quiz/page.tsx（存在する場合）
- /Users/ryuki/Desktop/eigomon/package.json

A-1 の実装を行ってください。完了チェックリストを全て確認してから終了してください。
```

### Phase A-2（TOEIC LP）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（⚠️禁止事項・A-2セクション）
- /Users/ryuki/Desktop/mon-landing/src/app/page.tsx
- /Users/ryuki/Desktop/mon-landing/src/app/war/page.tsx

A-2 の実装を行ってください。完了チェックリストを全て確認してから終了してください。
```

### Phase A-3（紹介報酬）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（⚠️禁止事項・A-3セクション）
- /Users/ryuki/Desktop/eigomon/src/app/auth/page.tsx
- /Users/ryuki/Desktop/eigomon/src/app/home/page.tsx
- /Users/ryuki/Desktop/sakumon/src/app/auth/page.tsx
- /Users/ryuki/Desktop/sakumon/src/app/home/page.tsx

⚠️ referral_code/referred_by/track-ref/referral APIは既に実装済みです。
実装指示書の「既実装状況」セクションを必ず読んでから作業してください。
まずEIGOモン側（A-3-1/A-3-2）を実装し、次にSAKUモン側（A-3-3）を実装してください。
完了チェックリストを全て確認してから終了してください。
```

### Phase A-4（アップセル通知）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（⚠️禁止事項・A-4セクション）
- /Users/ryuki/Desktop/eigomon/vercel.json（既存cron設定を確認）
- /Users/ryuki/Desktop/eigomon/src/app/billing/page.tsx
- /Users/ryuki/Desktop/eigomon/src/lib/hooks.ts（isLightPass の定義確認）

⚠️ vercel.jsonには既存のcronエントリが2つあります。上書きせず追加のみ行ってください。
A-4 の実装を行ってください。完了チェックリストを全て確認してから終了してください。
```

### Phase B-1（マイゴール EIGOモン）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（⚠️禁止事項・B-1セクション）
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts
- /Users/ryuki/Desktop/eigomon/src/app/home/page.tsx
- /Users/ryuki/Desktop/eigomon/src/app/api/weekly-review/route.ts

実装順序: DBマイグレーション → 型定義更新（supabase.ts）→ API作成（/api/goal）→ UI追加（home/page.tsx）→ weekly-review拡張
完了チェックリストを全て確認してから終了してください。
```

### Phase B-2（マイゴール SAKUモン）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（⚠️禁止事項・B-2セクション）
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/src/app/home/page.tsx

実装順序: DBマイグレーション → 型定義更新（supabase.ts）→ API作成（/api/goal）→ UI追加（home/page.tsx）
完了チェックリストを全て確認してから終了してください。
```

### Phase B-3（成長レポート SAKUモン）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（⚠️禁止事項・B-3セクション）
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/vercel.json
- /Users/ryuki/Desktop/eigomon/src/app/api/weekly-review/route.ts（参考実装）

⚠️ まずSAKUモンのDBスキーマ確認SQLを実行してから実装を開始してください。
⚠️ AIはGoogleGenerativeAI SDKではなくfetch直接呼び出し（EIGOモンと同パターン）を使用してください。
実装順序: DBマイグレーション確認 → /api/weekly-review 実装 → /api/cron/weekly-review 実装 → vercel.json更新
完了チェックリストを全て確認してから終了してください。
```

### Phase B-4（ストリーク SAKUモン）開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（⚠️禁止事項・B-4セクション）
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/src/app/home/page.tsx

⚠️ B-2（マイゴール）のstateと同一コンポーネントに追加するため、B-2実装後に行うことを推奨。
実装順序: DBマイグレーション → 型定義更新（supabase.ts）→ API作成（/api/streak）→ UI追加（home/page.tsx）
完了チェックリストを全て確認してから終了してください。
```
