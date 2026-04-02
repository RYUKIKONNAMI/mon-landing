# 手順書：EIGOモン・SAKUモン 次フェーズ実装

作成日: 2026-04-02

---

## 全体フロー

```
[あなたがやること]                    [ClaudeCodeがやること]
      ↓
Phase A-1: X共有
  Supabase不要                        ←── A-1 自動実装
      ↓
Phase A-2: TOEIC LP
  Supabase不要                        ←── A-2 自動実装
      ↓
Phase A-3: 紹介報酬 DBマイグレーション
  EIGOモンSupabase で SQL実行 →       ←── A-3 自動実装
  SAKUモンSupabase で SQL実行 →
      ↓
Phase A-4: アップセル通知
  CRON_SECRET を生成して env に追加   ←── A-4 自動実装
      ↓
Phase B-1: マイゴール EIGOモン
  EIGOモンSupabase で SQL実行 →       ←── B-1 自動実装
      ↓
Phase B-2: マイゴール SAKUモン
  SAKUモンSupabase で SQL実行 →       ←── B-2 自動実装
      ↓
Phase B-3: 成長レポート SAKUモン
  SAKUモンSupabase スキーマ確認 →     ←── B-3 自動実装
  CRON_SECRET を env に追加
      ↓
Phase B-4: ストリーク SAKUモン
  SAKUモンSupabase で SQL実行 →       ←── B-4 自動実装
      ↓
Vercel環境変数を追加
      ↓
git push → デプロイ
      ↓
動作確認
```

---

## Phase A-3: 紹介報酬 — 手動作業

### A-3-0. DBマイグレーション（実装前に実行）

⚠️ 実装指示書の「既実装状況」テーブルを確認してから実行すること。
`referral_code` / `referred_by` カラムが既にある場合は実行不要。

**EIGOモンのSupabase SQL Editor で実行:**
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by TEXT;

UPDATE profiles
SET referral_code = SUBSTRING(gen_random_uuid()::TEXT, 1, 8)
WHERE referral_code IS NULL;
```

**SAKUモンのSupabase SQL Editor で同じSQLを実行。**

---

## Phase A-4: アップセル通知 — 手動作業

### A-4-0. CRON_SECRET を生成して設定

ターミナルで実行:
```bash
openssl rand -hex 32
```

出力された文字列（例: `a3f8c2...`）を:

1. `eigomon/.env.local` に追記:
```
CRON_SECRET=（上で生成した文字列）
```

2. Vercelの EIGOモンプロジェクト → Settings → Environment Variables に追加:
```
CRON_SECRET = （同じ文字列）
```

---

## Phase B-1: マイゴール EIGOモン — 手動作業

### B-1-0. DBマイグレーション（実装前に実行）

**EIGOモンのSupabase SQL Editor で実行:**
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS goal_target TEXT,
  ADD COLUMN IF NOT EXISTS goal_deadline DATE,
  ADD COLUMN IF NOT EXISTS goal_mode TEXT;

COMMENT ON COLUMN profiles.goal_target IS 'toeic_600 | toeic_730 | toeic_860 | toeic_990 | eiken_2 | eiken_pre1 | eiken_1 | custom';
COMMENT ON COLUMN profiles.goal_deadline IS '目標達成日';
COMMENT ON COLUMN profiles.goal_mode IS 'toeic | eiken | university | free';
```

---

## Phase B-2: マイゴール SAKUモン — 手動作業

### B-2-0. DBマイグレーション（実装前に実行）

**SAKUモンのSupabase SQL Editor で実行:**
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS goal_type TEXT,
  ADD COLUMN IF NOT EXISTS goal_deadline DATE,
  ADD COLUMN IF NOT EXISTS goal_theme TEXT;

COMMENT ON COLUMN profiles.goal_type IS 'exam | es | grad | paper';
COMMENT ON COLUMN profiles.goal_deadline IS '目標達成日';
COMMENT ON COLUMN profiles.goal_theme IS '論述テーマ（自由テキスト）';
```

---

## Phase B-3: 成長レポート SAKUモン — 手動作業

### B-3-0. SAKUモンのDBスキーマを確認

SAKUモンのSupabase SQL Editor で実行（実装前に必ず確認）:
```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

出力を実装時にClaudeCodeに渡す（クエリのテーブル名・カラム名を合わせるため）。

### B-3-1. CRON_SECRET を設定

**SAKUモン用（EIGOモンで生成したものと同じでOK）:**

1. `sakumon/.env.local` に追記:
```
CRON_SECRET=（EIGOモンと同じ文字列）
NEXT_PUBLIC_APP_URL=https://sakumon-olive.vercel.app
```

2. Vercelの SAKUモンプロジェクト → Settings → Environment Variables に追加:
```
CRON_SECRET = （同じ文字列）
NEXT_PUBLIC_APP_URL = https://sakumon-olive.vercel.app
```

---

## Phase B-4: ストリーク — 手動作業

### B-4-0. DBマイグレーション（実装前に実行）

**SAKUモンのSupabase SQL Editor で実行:**
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS streak_days INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_last_date DATE,
  ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
```

---

## デプロイ手順

### 全Phase実装完了後

**1. EIGOモン:**
```bash
cd /Users/ryuki/Desktop/eigomon
git add -p
git commit -m "feat: X共有OGP・マイゴール・アップセル通知・紹介報酬UI追加"
git push
```

**2. SAKUモン:**
```bash
cd /Users/ryuki/Desktop/sakumon
git add -p
git commit -m "feat: マイゴール・成長レポート・ストリーク・紹介報酬UI追加"
git push
```

**3. mon-landing（TOEIC LP）:**
```bash
cd /Users/ryuki/Desktop/mon-landing
git add -p
git commit -m "feat: /lp/toeic SEOランディングページ追加"
git push
```

---

## 動作確認チェックリスト

| 確認項目 | 確認方法 |
|---|---|
| /lp/toeic にアクセスできる | ブラウザで開く |
| EIGOモンのスコア画面に「Xでシェア」ボタンがある | スキャン完了後の画面 |
| /api/og/score?score=65 で画像が返ってくる | ブラウザで直接アクセス |
| 紹介URLがホーム画面に表示される | ログイン後ホーム |
| billing pageに残り3日以下のアップセルバナーが出る | DBで light_pass_end を手動で2日後にセットして確認 |
| EIGOモンのホームにゴール設定ボタンがある | ログイン後ホーム |
| SAKUモンのホームにゴール設定ボタンがある | ログイン後ホーム |
| SAKUモンのホームにストリークカードがある | ログイン後ホーム |
| /api/weekly-review (POST) がJSONを返す | Postman or curl |

---

## フェーズごとのClaudeCode指示コピペ

### A-1 開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/_docs/実装/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（A-1セクション）
- /Users/ryuki/Desktop/eigomon/src/app/scan/page.tsx
- /Users/ryuki/Desktop/eigomon/src/app/quiz/page.tsx
- /Users/ryuki/Desktop/eigomon/package.json

「⚠️ 実装前に必ず読むこと」を確認してから A-1 を実装してください。完了後にチェックリストを確認してください。
```

### A-2 開始時
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/_docs/実装/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（A-2セクション）
- /Users/ryuki/Desktop/mon-landing/src/app/page.tsx
- /Users/ryuki/Desktop/mon-landing/src/app/war/page.tsx

A-2 を実装してください。完了後にチェックリストを確認してください。
```

### A-3 開始時（DBマイグレーション手動実行済みであること）
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/_docs/実装/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（A-3セクション）
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts
- /Users/ryuki/Desktop/eigomon/src/app/api/referral/route.ts（存在する場合）
- /Users/ryuki/Desktop/eigomon/src/app/api/track-ref/route.ts（存在する場合）
- /Users/ryuki/Desktop/eigomon/src/app/auth/page.tsx
- /Users/ryuki/Desktop/eigomon/src/app/home/page.tsx
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/src/app/auth/page.tsx
- /Users/ryuki/Desktop/sakumon/src/app/home/page.tsx

「既実装状況」テーブルを確認して重複実装しないようにしてください。A-3 を実装してください。
```

### A-4 開始時（CRON_SECRET設定済みであること）
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/_docs/実装/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（A-4セクション）
- /Users/ryuki/Desktop/eigomon/vercel.json
- /Users/ryuki/Desktop/eigomon/src/app/billing/page.tsx

vercel.json の既存cron設定を上書きしないよう注意してください。A-4 を実装してください。
```

### B-1 開始時（DBマイグレーション手動実行済みであること）
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/_docs/実装/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（B-1セクション）
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts
- /Users/ryuki/Desktop/eigomon/src/app/home/page.tsx
- /Users/ryuki/Desktop/eigomon/src/app/api/weekly-review/route.ts

B-1 を実装してください。完了後にチェックリストを確認してください。
```

### B-2 開始時（DBマイグレーション手動実行済みであること）
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/_docs/実装/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（B-2セクション）
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/src/app/home/page.tsx

B-2 を実装してください。完了後にチェックリストを確認してください。
```

### B-3 開始時（DBスキーマ確認・CRON_SECRET設定済みであること）
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/_docs/実装/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（B-3セクション）
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/src/app/api/（既存APIルート）
- /Users/ryuki/Desktop/eigomon/src/app/api/weekly-review/route.ts
- /Users/ryuki/Desktop/sakumon/vercel.json

⚠️ SAKUモンのDBスキーマ確認結果を以下に貼り付けてから開始してください：
[Supabaseで実行したスキーマ確認SQLの結果をここに貼る]

B-3 を実装してください。
```

### B-4 開始時（DBマイグレーション手動実行済みであること）
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/_docs/実装/実装指示書_EIGOモン_SAKUモン_次フェーズ.md（B-4セクション）
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/src/app/home/page.tsx

B-4 を実装してください。完了後にチェックリストを確認してください。
```
