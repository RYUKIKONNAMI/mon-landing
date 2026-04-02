# SHIKENモン 実装指示書（Claude Code用）v2.0

作成日: 2026-04-01
対象: SHIKENモン新規プロジェクト（/Users/ryuki/Desktop/shikenmon）
企画書: /Users/ryuki/Desktop/mon-landing/_docs/企画書/SHIKENモン_企画書_最終版.md
参考実装: /Users/ryuki/Desktop/sakumon（既存MONシリーズ）

---

## atama+ 差別化戦略との関係（実装の背景）

### ポジションステートメント
> **「あなたの教授のPDFで勉強できる、唯一のAI学習サービス」**

atama+は「高校生 × 塾チャネル × 固定カリキュラム」の3制約内でのみ機能する。
SHIKENモンは「大学生・医療専門職 × D2C直販 × ユーザー自身のPDF」という構造的に参入不可能な軸を押さえる。

| 軸 | atama+ | SHIKENモン |
|---|---|---|
| チャネル | 塾経由B2B2C | D2C直販 |
| ターゲット | 高校生のみ | 大学生・国試受験者（上限なし） |
| コンテンツ | 固定（指導要領） | 完全自由（任意のPDF→AI自動生成） |

### 差別化を支える教育科学フレームワーク（実装優先度順）

| フレームワーク | 実装内容 | 対応Phase |
|---|---|---|
| SDT自律性（自己決定理論） | マイゴール機能（試験日・目標スコア設定） | Phase 3-8 |
| SDT有能感 | 的中率バッジ・フィードバック画面（3-3・3-4） | Phase 3 |
| SDT関係性 | デッキ公開・シェア・学部内ランキング（Phase 2） | Phase 2 |
| Self-Compassion理論 | 的中率低下週のフィードバック設計（3-9） | Phase 3 |
| スイッチングコスト | 的中履歴・蓄積データ・解約防止フロー（3-7） | Phase 3 |
| ZPD/SM-2/FSRS | 復習タイミング自動最適化 | Phase 4（全アプリ共通） |

詳細: `/Users/ryuki/Desktop/mon-landing/_docs/戦略書/MONシリーズ_atama+差別化戦略書_v4.md`

---

## 全体の流れ（概要）

```
Phase 0: プロジェクト作成・DB基盤（1週間）
  ↓
Phase 1: PDF→カード生成 MVP（2週間）← ここでベータ公開可能
  ↓
Phase 2: デッキ公開・シェア・決済（2週間）← ここで収益化
  ↓
STEP 3  OCR品質分岐・AI的中率（3週間）← v1.0
        ├─ 3-1: 画像型PDF・OCR品質分岐
        ├─ 3-2: 的中報告API・Cf計算
        ├─ 3-3: フィードバック画面（試験後3軸評価 + L1/L2/L3申告）
        ├─ 3-4: 的中率バッジUI
        ├─ 3-5: Vercel Cronジョブ
        ├─ 3-6: MONポイント付与
        └─ 3-7: 解約防止フロー（/settings/cancel）
  ↓
Phase 4: 国家試験モード・スケール（後回し）← v2.0
```

**Phase 1完了時点でベータ公開、Phase 2完了で試験月パス販売開始。**

---

## Claude Codeへの共通前提

毎回のセッション開始時に以下を伝えてください：

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/_docs/実装/SHIKENモン_実装指示書_ClaudeCode用.md
- /Users/ryuki/Desktop/mon-landing/_docs/企画書/SHIKENモン_企画書_最終版.md
- /Users/ryuki/Desktop/mon-landing/_docs/戦略書/MONシリーズ_atama+差別化戦略書_v4.md（差別化戦略の背景確認用）
- /Users/ryuki/Desktop/shikenmon/src/lib/supabase.ts  ← Phase 0-4完了後に存在するファイル。未存在の場合はスキップ
- /Users/ryuki/Desktop/sakumon/src/app/api/stripe/checkout/route.ts（課金パターン参考）
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts  ← syncToOther()でEIGOモンに書き込む場合に参照

今日実装するのは「Phase X の X-X: ○○」です。
```

**技術スタック:**
- Next.js 14 (App Router / TypeScript)
- Supabase (Auth + PostgreSQL + Storage)
- Stripe
- Google Gemini 1.5 Flash API
- Vercel（デプロイ）

**プロジェクトパス:** `/Users/ryuki/Desktop/shikenmon`
**参考プロジェクト:** `/Users/ryuki/Desktop/sakumon`（同一スタック）

**フェーズ完了チェックリスト（毎Phase必須）:**
```
□ npm run build がエラーなしで完了すること
□ TypeScript の型エラーが0件であること
□ RLSポリシーが全テーブルに設定済みであること
□ APIに Request/Response インターフェースが定義されていること
□ UIコンポーネントが src/components/ に分割されていること
```

**共通ルール・禁止事項:**
- TypeScript の `any` 型および `as any` 型アサーションは一切使用禁止。
  不明な型は `unknown` を使い、型ガードで絞り込むこと。

---

## Phase 0: プロジェクト作成・DB基盤

### 0-1. Next.jsプロジェクト作成

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/package.json を参考に、
SHIKENモン用のNext.jsプロジェクトを作成してください。

プロジェクト場所: /Users/ryuki/Desktop/shikenmon
条件:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- ESLint
- src/ ディレクトリ構成（sakumonと同じ）

作成後、以下のパッケージをインストールしてください:
- @supabase/supabase-js @supabase/ssr
- stripe
- @google/generative-ai
- pdf-parse（テキスト型PDF用）
- react-card-flip（フラッシュカードアニメーション）
- react-dropzone（PDF D&D アップロード）
```

### 0-2. 環境変数設定

`/Users/ryuki/Desktop/shikenmon/.env.local` を作成：

```
NEXT_PUBLIC_SUPABASE_URL=（SHIKENモン用Supabaseプロジェクト）
NEXT_PUBLIC_SUPABASE_ANON_KEY=（同上）
SUPABASE_SERVICE_ROLE_KEY=（同上）
STRIPE_SECRET_KEY=（既存SAKUモンと同じStripeアカウント）
STRIPE_WEBHOOK_SECRET=（SHIKENモン用Webhookシークレット）
STRIPE_SHIKEN_7DAY_PRICE_ID=（試験7日間パス ¥398）
STRIPE_SHIKEN_MONTHLY_PRICE_ID=（ライト ¥490/月）
STRIPE_SHIKEN_STANDARD_PRICE_ID=（スタンダード ¥980/月）
STRIPE_MON_PASS_MONTHLY_PRICE_ID=（MONパス月額 ¥1,980 ← SAKUモンと共通）
STRIPE_MON_PASS_STUDENT_PRICE_ID=（MONパス学割 ¥680/月）
GEMINI_API_KEY=（Google AI Studio）
NEXT_PUBLIC_APP_URL=http://localhost:3001
SAKUMON_SUPABASE_URL=（SAKUモン Supabase URL）
SAKUMON_SUPABASE_SERVICE_ROLE_KEY=（SAKUモン Service Role Key）
EIGOMON_SUPABASE_URL=（EIGOモン Supabase URL）
EIGOMON_SUPABASE_SERVICE_ROLE_KEY=（EIGOモン Service Role Key）
```

### 0-3. DBマイグレーション（最初に実行）

**重要原則:**
```
データベーススキーマは /Users/ryuki/Desktop/mon-landing/_docs/企画書/SHIKENモン_企画書_最終版.md
の【付録A】を唯一の正典とする。
1カラムも省略せず、型・制約・インデックス・RLSポリシーを完全コピーしてSQLを作成すること。
独自のカラム追加・削除・型変更・デフォルト値変更は一切禁止する。
```

**Claude Codeへの指示:**
```
以下のSQLを /Users/ryuki/Desktop/shikenmon/migrations/0001_initial.sql
として作成してください。

企画書 /Users/ryuki/Desktop/mon-landing/_docs/企画書/SHIKENモン_企画書_最終版.md
の【付録A】を唯一の正典とし、1カラムも省略せずに全テーブルを作成してください。

⚠️ 注意: 以下の3テーブル（free_usage / exams / received_decks）は企画書付録Aには明示的なDDLが
ない補完テーブルだが、企画書本文（セクション3・5・9.3）で言及されており、MVPに必要なため追加する。
付録Aの「唯一の正典」ルールの例外として追加が許可されているテーブルである。

作成するテーブル（企画書付録A準拠・全て必須）:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. profiles（ユーザープロフィール）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
企画書付録A の profiles テーブルを完全コピー。
必須カラム（省略禁止）:
- id: UUID NOT NULL REFERENCES auth.users(id) PRIMARY KEY
- nickname: TEXT（nameではない。email/avatar_urlは含めない）
- university: TEXT
- faculty: TEXT
- grade: INTEGER（学年 1〜6・7=大学院）
- enrollment_course: TEXT（'6year' | '4year' | 'graduate'）
- subscription_status: TEXT DEFAULT 'free'（UIキャッシュ用）
- old_user_id: UUID（Option B移行期間中の旧UUID互換性維持用）
- streak_days: INTEGER DEFAULT 0
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()

インデックス:
- CREATE INDEX idx_profiles_university_faculty ON profiles(university, faculty);

RLSポリシー:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (id = auth.uid());
-- ⚠️ 企画書付録Aに明示なし。本人のみ全操作可として補完（セキュリティ上必須）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. decks（フラッシュカードのデッキ）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
企画書付録A の decks テーブルを完全コピー。
必須カラム（省略禁止）:
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL REFERENCES auth.users(id)
- title: TEXT NOT NULL
- subject: TEXT
- professor: TEXT（担当教授名）
- university: TEXT
- faculty: TEXT
- department: TEXT（学科）
- is_public: BOOLEAN DEFAULT true（デフォルトtrue・trueでなければならない）
- exam_date: DATE
- created_at: TIMESTAMPTZ DEFAULT NOW()

※ hit_rate/hit_cf/hit_count/total_report_count/hit_report_count カラムは
  付録Aに存在しない。追加禁止。hit_ratings テーブルで代替する。
※ pdf_hash/card_count カラムも付録Aには存在しない。追加禁止。

RLSポリシー（企画書付録A完全準拠）:
- ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
- 自分のデッキ読み取り: decks_own_read
- 公開デッキ（同一学部）読み取り: decks_faculty_read
  （タプル比較 (university, faculty) = (SELECT university, faculty FROM profiles WHERE id = auth.uid())）
- INSERT/UPDATE/DELETE: decks_own_write/update/delete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. cards（フラッシュカード単体）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
企画書付録A の cards テーブルを完全コピー。
必須カラム（省略禁止）:
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- deck_id: UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE
- front: TEXT NOT NULL
- back: TEXT NOT NULL
- importance_score: FLOAT DEFAULT 0.0（文字列3値ではない。FLOATのみ）
- created_at: TIMESTAMPTZ DEFAULT NOW()

インデックス:
- CREATE INDEX idx_cards_deck_id ON cards(deck_id);

RLSポリシー（企画書付録A完全準拠）:
- 自分のデッキのカード読み取り: cards_own_deck_read
- 公開デッキのカード読み取り: cards_public_deck_read
- INSERT/UPDATE/DELETE: cards_own_write/update/delete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. hit_ratings（的中率評価・L1/L2/L3）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
企画書付録A の hit_ratings テーブルを完全コピー。
必須カラム（省略禁止）:
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- deck_id: UUID NOT NULL REFERENCES decks(id)
- user_id: UUID NOT NULL REFERENCES auth.users(id)
- exam_date: DATE NOT NULL
- accuracy_score: INTEGER（的中度★ 1-5）
- clarity_score: INTEGER（分かりやすさ★ 1-5）
- coverage_score: INTEGER（網羅性★ 1-5）
- l1_count: INTEGER DEFAULT 0（テーマ的中件数）
- l2_count: INTEGER DEFAULT 0（範囲的中件数）
- l3_count: INTEGER DEFAULT 0（問題的中件数）
- created_at: TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(deck_id, user_id, exam_date)

RLSポリシー:
-- ⚠️ 以下2テーブルのRLSは企画書付録Aに明示なし。設計意図から補完（例外として許可）
ALTER TABLE hit_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hit_ratings_own" ON hit_ratings
  FOR ALL USING (user_id = auth.uid());

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. events（行動ログ・パッシブ評価用）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
企画書付録A の events テーブルを完全コピー。
必須カラム（省略禁止）:
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL REFERENCES auth.users(id)
- event_type: TEXT NOT NULL（card_view, card_flip, test_answer, test_complete, pdf_upload, share_click）
- card_id: UUID
- deck_id: UUID
- subject_id: UUID
- created_at: TIMESTAMPTZ DEFAULT NOW()
- meta: JSONB

インデックス:
- CREATE INDEX idx_events_user_created ON events(user_id, created_at DESC);
- CREATE INDEX idx_events_card_type ON events(card_id, event_type);
- CREATE INDEX idx_events_deck_created ON events(deck_id, created_at DESC);

RLSポリシー:
- events_own_read: FOR SELECT USING (user_id = auth.uid())
- events_own_insert: FOR INSERT WITH CHECK (user_id = auth.uid())

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. national_exams（国家試験マスタ）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
企画書付録A の national_exams テーブルを完全コピー。
必須カラム（省略禁止）:
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- name: TEXT NOT NULL
- category: TEXT NOT NULL
- next_exam_date: DATE
- syllabus_url: TEXT
- target_grades: INTEGER[]（例: [4,5,6]）
- target_faculties: TEXT[]（例: ['医学部','薬学部']）
- created_at: TIMESTAMPTZ DEFAULT NOW()

RLSポリシー:
-- ⚠️ 以下2テーブルのRLSは企画書付録Aに明示なし。設計意図から補完（例外として許可）
-- national_exams: マスタデータのため全ユーザー読み取り可、書き込みはService Role専用
ALTER TABLE national_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "national_exams_read_all" ON national_exams
  FOR SELECT USING (true);
-- INSERT/UPDATE/DELETE はポリシーなし（Service Role Keyのみアクセス可）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. subscriptions（課金管理・MONシリーズ共通）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
企画書付録A の subscriptions テーブルを完全コピー。
必須カラム（省略禁止）:
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL REFERENCES auth.users(id)
- stripe_subscription_id: TEXT UNIQUE
- stripe_customer_id: TEXT（必須・省略禁止）
- plan_id: TEXT
  値一覧: 'shiken_7day' | 'shiken_monthly' | 'shiken_yearly' | 'shiken_pass' | 'mon_pass'
- app_access: TEXT[]（例: ['shiken'] または ['shiken','eigo','saku']）
- status: TEXT（'active' | 'canceled' | 'past_due' | 'trialing' | 'paused'）
- current_period_end: TIMESTAMPTZ（period_end ではない。必ずこの名前）
- pause_until: TIMESTAMPTZ（一時停止終了日）
- canceled_at: TIMESTAMPTZ（解約日時）
- created_at: TIMESTAMPTZ DEFAULT NOW()

インデックス:
- CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

RLSポリシー:
- subscriptions_own_read: FOR SELECT USING (user_id = auth.uid())
- INSERT/UPDATE/DELETEはService Role Key経由のみ（ポリシー不要）

has_access() SQL関数（企画書付録A完全準拠・SECURITY DEFINER必須）:
CREATE OR REPLACE FUNCTION has_access(p_user_id UUID, p_app TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
      AND status IN ('active', 'trialing', 'paused')
      AND current_period_end > NOW()
      AND (pause_until IS NULL OR pause_until > NOW())
      AND p_app = ANY(app_access)
  );
$$ LANGUAGE SQL SECURITY DEFINER;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. webhook_events（Webhookべき等性管理）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
stripe_events テーブルは使用しない。webhook_events テーブルのみ使用する。
企画書付録A の webhook_events テーブルを完全コピー。
必須カラム（省略禁止）:
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- stripe_event_id: TEXT NOT NULL UNIQUE（Stripe event IDのみ。payload不要）
- processed_at: TIMESTAMPTZ DEFAULT NOW()

インデックス:
- CREATE INDEX idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);

RLSポリシー:
- ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
- 意図的にポリシーを作成しない（Service Role Keyのみアクセス可・anon/authenticated全拒否）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. university_aliases（大学名エイリアス・2段階正規化用）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
企画書付録A の university_aliases テーブルを完全コピー。
必須カラム（省略禁止）:
- alias: TEXT PRIMARY KEY
- canonical: TEXT NOT NULL
- created_at: TIMESTAMPTZ DEFAULT NOW()

初期データINSERT文（企画書付録A記載の全エントリを含める）:
INSERT INTO university_aliases (alias, canonical) VALUES
  ('東大', '東京大学'),
  ('京大', '京都大学'),
  ('阪大', '大阪大学'),
  ('名大', '名古屋大学'),
  ('東北大', '東北大学'),
  ('九大', '九州大学'),
  ('北大', '北海道大学'),
  ('一橋大', '一橋大学'),
  ('東工大', '東京工業大学'),
  ('早稲田', '早稲田大学'),
  ('慶應', '慶應義塾大学'),
  ('上智', '上智大学'),
  ('明治', '明治大学'),
  ('立教', '立教大学'),
  ('青学', '青山学院大学'),
  ('中央大', '中央大学'),
  ('法政', '法政大学'),
  ('同志社', '同志社大学'),
  ('立命館', '立命館大学'),
  ('関大', '関西大学'),
  ('関学', '関西学院大学')
;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. cancellation_reasons（解約理由記録）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
企画書付録A の cancellation_reasons テーブルを完全コピー。
必須カラム（省略禁止）:
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL REFERENCES auth.users(id)
- reason: TEXT NOT NULL（'exam_finished' | 'too_expensive' | 'other_tool' | 'other'）
- free_text: TEXT（「その他」の場合の自由記述）
- created_at: TIMESTAMPTZ DEFAULT NOW()

RLSポリシー（企画書付録A完全準拠）:
- ALTER TABLE cancellation_reasons ENABLE ROW LEVEL SECURITY;
- CREATE POLICY "cancellation_reasons_own" ON cancellation_reasons
    FOR ALL USING (user_id = auth.uid());

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. mon_points（MONポイント共通管理）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
企画書付録A の mon_points テーブルを完全コピー。
必須カラム（省略禁止）:
- user_id: UUID NOT NULL
- app: TEXT NOT NULL（'eigomon' | 'sakumon' | 'shikenmon'）
- points: INTEGER NOT NULL DEFAULT 0
- updated_at: TIMESTAMPTZ DEFAULT NOW()
- PRIMARY KEY (user_id, app)

ビュー:
CREATE VIEW total_mon_points AS
  SELECT user_id, SUM(points) AS total_points
  FROM mon_points GROUP BY user_id;

RLSポリシー:
- ALTER TABLE mon_points ENABLE ROW LEVEL SECURITY;
- CREATE POLICY "mon_points_own" ON mon_points FOR ALL USING (user_id = auth.uid());

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. free_usage（無料枠管理）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- user_id: UUID PRIMARY KEY REFERENCES auth.users(id)
- usage_count: INTEGER NOT NULL DEFAULT 0（0〜3）
- reset_at: TIMESTAMPTZ（将来のリセット日時管理用。MVPではNULL）
- created_at: TIMESTAMPTZ DEFAULT NOW()

RLSポリシー:
- ALTER TABLE free_usage ENABLE ROW LEVEL SECURITY;
- CREATE POLICY "free_usage_own" ON free_usage FOR ALL USING (user_id = auth.uid());

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13. exams（試験記録）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL REFERENCES auth.users(id)
- deck_id: UUID NOT NULL REFERENCES decks(id)
- exam_date: DATE
- hit_reported: BOOLEAN DEFAULT false（報告済みフラグ）
- reported_at: TIMESTAMPTZ
- confirmed: BOOLEAN DEFAULT false（72時間経過後にtrueに更新）
- created_at: TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(user_id, deck_id, exam_date)

※ hit: boolean カラムは含めない。的中評価は hit_ratings テーブルで代替する。

RLSポリシー:
- ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
- CREATE POLICY "exams_own" ON exams FOR ALL USING (user_id = auth.uid());

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14. received_decks（シェアURLから受け取ったデッキ）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- deck_id: UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE
- received_at: TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(user_id, deck_id)

RLSポリシー:
- ALTER TABLE received_decks ENABLE ROW LEVEL SECURITY;
- CREATE POLICY "received_decks_own" ON received_decks FOR ALL USING (user_id = auth.uid());

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Supabase Storage バケットポリシー（企画書付録B）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
バケット名: pdf-uploads
ファイルパス構造: pdf-uploads/{user_id}/{timestamp}_{filename}.pdf

以下の4本のポリシーを全て作成すること（企画書付録B完全準拠・そのまま実行すること）:

-- アップロード: 認証済みユーザーのみ、自分のuser_id以下のパスに限定
CREATE POLICY "pdf_uploads_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pdf-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 読み取り: アップロード者本人のみ（OCR処理中の自分のファイルのみ閲覧可）
CREATE POLICY "pdf_uploads_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'pdf-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 削除: アップロード者本人またはService Role（Cron削除用）
CREATE POLICY "pdf_uploads_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'pdf-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 上書き（UPDATE）: アップロード者本人のみ（再送信・差し替え時）
CREATE POLICY "pdf_uploads_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'pdf-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
-- ※ Service Role Keyはポリシーをバイパスするため、Cronによる全削除も可能
```

### 0-4. 型定義・ヘルパー関数（supabase.ts）

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/lib/supabase.ts を参考に、
/Users/ryuki/Desktop/shikenmon/src/lib/supabase.ts を作成してください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
型定義（DBスキーマ付録A準拠）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Profile {
  id: string
  nickname: string | null
  university: string | null
  faculty: string | null
  grade: number | null
  enrollment_course: string | null
  subscription_status: string
  old_user_id: string | null
  streak_days: number
  created_at: string
  updated_at: string
}

export interface Deck {
  id: string
  user_id: string
  title: string
  subject: string | null
  professor: string | null
  university: string | null
  faculty: string | null
  department: string | null
  is_public: boolean
  exam_date: string | null
  created_at: string
}

export interface Card {
  id: string
  deck_id: string
  front: string
  back: string
  importance_score: number
  created_at: string
}

export interface HitRating {
  id: string
  deck_id: string
  user_id: string
  exam_date: string
  accuracy_score: number | null
  clarity_score: number | null
  coverage_score: number | null
  l1_count: number
  l2_count: number
  l3_count: number
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  plan_id: string | null
  app_access: string[]
  status: string
  current_period_end: string
  pause_until: string | null
  canceled_at: string | null
  created_at: string
}

export interface Exam {
  id: string
  user_id: string
  deck_id: string
  exam_date: string | null
  hit_reported: boolean
  reported_at: string | null
  confirmed: boolean
  created_at: string
}

export interface FreeUsage {
  user_id: string
  usage_count: number
  reset_at: string | null
  created_at: string
}

export type HitLevel = 'none' | 'hidden' | 'lv2' | 'lv3'  // 'lv1'は廃止

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cf計算関数（ステップ関数・対数計算は使用禁止）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 信頼度係数Cf計算（ステップ関数）
 * 企画書付録A・セクション8.2準拠
 */
export function calcCf(n: number): number {
  if (n >= 100) return 1.0
  if (n >= 20) return 0.8
  if (n >= 5) return 0.5
  return 0.0
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HitLevel判定関数（ステップ関数基準）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 的中レベル判定
 * 企画書セクション8.2: Cf=0.0（評価4件以下）は「スコア非表示」
 * hidden: Cf === 0.0（5件未満）→ 「報告待ち」状態
 * lv3: Cf >= 0.8 かつ n >= 20（ステップ関数20件以上相当）
 * lv2: それ以外
 */
export function getHitLevel(cf: number, n: number): HitLevel {
  if (n === 0) return 'none'
  // 企画書セクション8.2: Cf=0.0（評価4件以下）は「スコア非表示」
  if (cf === 0.0) return 'hidden'   // ← 'lv1'ではなく'hidden'（報告待ち状態）
  if (cf >= 0.8 && n >= 20) return 'lv3'
  return 'lv2'
}

// 表示ロジック
// 'hidden' → 「報告待ち」グレーテキスト（スコア非表示）
// 'lv2' → 標準バッジ（スコア表示）
// 'lv3' → 高精度バッジ（スコア＋信頼度表示）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
的中率スコア計算関数
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 加重的中スコア計算
 * 企画書セクション8.2準拠
 */
export function calcHitScore(
  l1Count: number,
  l2Count: number,
  l3Count: number,
  totalRaters: number,
  cf: number
): number {
  if (totalRaters === 0) return 0
  const weightedScore = (l3Count * 1.0 + l2Count * 0.6 + l1Count * 0.3) / totalRaters
  return Math.min(1.0, weightedScore * cf)
}

/**
 * 的中スコア→★変換
 */
export function toStars(score: number): number {
  return Math.min(Math.floor(score * 5) + 1, 5)
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
has_access() クライアントサイドヘルパー
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
（権威はSQL関数 has_access(p_user_id, p_app)。
  クライアント側は subscriptions テーブルを参照して判定）

export async function hasAccess(
  supabaseClient: SupabaseClient,
  userId: string,
  app: string = 'shiken'
): Promise<boolean> {
  // ⚠️ .single()/.maybeSingle()禁止。countパターンを使うこと
  // subscriptions テーブルは同一ユーザーが複数レコードを持つ可能性があるため、
  // EXISTSパターン（count）で1件でもヒットすればtrueを返す
  const { count } = await supabaseClient
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'paused'])
    .gt('current_period_end', new Date().toISOString())
    .contains('app_access', [app])

  return (count ?? 0) > 0
}
```

---

## Phase 1: PDF→カード生成 MVP

### 1-1. PDFアップロードUI + Storage

**Claude Codeへの指示:**
```
以下のファイルを作成してください:
- /Users/ryuki/Desktop/shikenmon/src/app/upload/page.tsx
- /Users/ryuki/Desktop/shikenmon/src/components/UploadZone.tsx（react-dropzone使用）

企画書セクション6.1・6.2のUI仕様に従い実装。
UIコンポーネントは src/components/UploadZone.tsx に分割すること。

機能要件:
- react-dropzone でD&Dエリア（UploadZone.tsx に分割）
- 試験名テキスト入力（必須）
- 科目・学部・担当教授・試験日（exam_date）入力（任意）
- ファイルバリデーション:
  - PDFのみ（.pdf）
  - 20MB制限（オーバー時: 「PDFを圧縮するか50Pごとに分割してアップロードしてください」）
- アップロード先: Supabase Storage バケット「pdf-uploads」
  パス: pdf-uploads/{user_id}/{timestamp}_{filename}.pdf
- アップロード後 → /api/pdf/generate を呼び出す
- 30秒タイムアウトのプログレス表示（「カード生成中... 約XX秒」）
- 著作権確認チェックボックス（企画書11.1より必須）:
  「自分が著作権を有するか、適切な許諾を得た資料のみアップロードします」
  チェックなしは「アップロード」ボタンを disabled に

TypeScript インターフェース:
interface UploadFormData {
  title: string
  subject?: string
  faculty?: string
  professor?: string
  examDate?: string
  file: File
  copyrightAgreed: boolean
}

interface GenerateResponse {
  deck_id: string
  card_count: number
}
```

### 1-2. 重複チェックAPI

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/shikenmon/src/app/api/pdf/check-duplicate/route.ts
を作成してください。

// ⚠️ v1.0はスタブ（常に 'new' を返す）のため、'duplicate' バリアントは
// Phase 4まで使用しない。定義のみ残しておく。
interface CheckDuplicateResponse {
  status: 'new'  // | 'duplicate'  ← Phase 4で有効化
  // deck_id?: string  ← Phase 4で有効化
}

処理:
→ v1.0では常に { status: 'new' } を返すスタブとして実装すること。
→ decks テーブルに pdf_hash カラムは存在しない（企画書付録A非準拠のため追加禁止）。
→ Phase 4で pg_trgm を使った本格的な重複チェックを実装する。
（trigram部分一致は v2.0 で実装）
```

### 1-3. カード生成API（メイン処理）

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/shikenmon/src/app/api/pdf/generate/route.ts
を作成してください。企画書セクション4のGeminiプロンプトテンプレートを使用。

⚠️ Geminiへのプロンプトは企画書_最終版.md のセクション4（「4. PDF→カード生成 詳細設計」）内の
「Geminiプロンプトテンプレート」コードブロックを1文字も変えずにそのまま使用すること。
（他のプロンプトを自己生成することは禁止する）

⚠️ route.ts の先頭に必ず以下を両方追加してください（Edge Runtime禁止・企画書付録B準拠）:
export const runtime = 'nodejs'
export const maxDuration = 60

TypeScript インターフェース:
interface GenerateRequest {
  storage_path: string   // Supabase Storage のファイルパス
  title: string
  subject?: string
  faculty?: string
  professor?: string
  exam_date?: string
}

interface GenerateResponse {
  deck_id: string
  card_count: number
}

処理フロー:
1. 認証チェック（Supabase Auth）
2. 無料枠チェック（free_usage.usage_count < 3 or hasAccess()）
3. Supabase Storage からPDF取得（signed URL）
4. PDF種別判定:
   - pdf-parse でテキスト抽出
   - 文字数 ÷ ページ数 >= 200 → テキスト型
   - それ以外 → 画像型（Phase 3 で対応。現時点では「近日対応予定」エラー）
5. Gemini 1.5 Flash API でカード生成（企画書のプロンプトテンプレート通り）
   MAX_CARDS = min(40, ページ数 × 2)
6. 生成されたカードを cards テーブルに INSERT
   ⚠️ importance_score は FLOAT で INSERT（文字列値 'high'/'medium'/'low' は使用禁止）
   例: importance_score: card.importanceScore ?? 0.5
7. decks テーブルに INSERT:
   { title, subject, professor, faculty, exam_date, is_public: true, user_id }
8. free_usage.usage_count をインクリメント（無料枠消費）
9. Supabase Storage から PDF を削除（即時）
10. レスポンス: { deck_id, card_count }

エラーハンドリング:
- Gemini API エラー → 500（リトライ可能）
- タイムアウト: maxDuration = 60 秒
```

### 1-4. フラッシュカード学習UI

**Claude Codeへの指示:**
```
以下のページとコンポーネントを作成してください:

1. /Users/ryuki/Desktop/shikenmon/src/app/deck/[deckId]/page.tsx
   - デッキ詳細ページ（カード一覧 + 学習開始ボタン）
   - is_public=true のデッキは未ログインでも閲覧可能
   - 「学習開始」→ /deck/[deckId]/study へ

2. /Users/ryuki/Desktop/shikenmon/src/app/deck/[deckId]/study/page.tsx
   - 企画書6.3モックアップ通りのUI
   - カードフリップアニメーション（CSS rotateY 400ms）
   - 「✓ 知ってた」「✗ 知らなかった」ボタン
   - 「知らなかった」カードをリピートキューに追加（useState管理）
   - 全カード完了後: 「このデッキを公開して後輩を助けよう」CTA
   - スワイプ左右でのカード送り（touch event）

3. /Users/ryuki/Desktop/shikenmon/src/components/FlashCard.tsx
   - react-card-flip を使用
   - 表面: 問い（白背景・24px）
   - 裏面: 答え（淡いアンバー背景・アクセントカラー #c9871a）
   - importance_score に応じた重要度バッジ:
     score >= 0.7 → 赤（高）
     score >= 0.4 → 黄（中）
     score < 0.4  → グレー（低）

UIコンポーネント分割方針（src/components/ 配下）:
- FlashCard.tsx: カードフリップコンポーネント
- DeckList.tsx: デッキ一覧コンポーネント
- UploadZone.tsx: PDFアップロードD&Dゾーン
- StarRating.tsx: ★評価入力UI（Phase 3で使用）
- HitRatingForm.tsx: 的中評価フォーム（Phase 3で使用）
- FeedbackModal.tsx: フィードバックモーダル（Phase 3で使用）
```

### 1-4b. 確認テスト機能

**Claude Codeへの指示:**
```
以下を実装してください。確認テスト機能は企画書セクション6.4・M1-5の仕様に準拠すること。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. /api/quiz/generate (POST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TypeScript インターフェース:
interface QuizGenerateRequest {
  deck_id: string
  quiz_type: 'multiple_choice' | 'fill_blank'
}

interface QuizQuestion {
  question: string
  options?: string[]   // 4択の場合のみ（4要素）
  answer: string
  card_id: string
}

interface QuizGenerateResponse {
  questions: QuizQuestion[]
}

処理:
1. 認証チェック（Supabase Auth）
2. deck_id で cards テーブルからカード一覧を取得（最大15枚）
3. Gemini 1.5 Flash API に渡し、quiz_type に応じたクイズ問題を生成:
   - 'multiple_choice': 4択問題（正解1つ + ダミー3つ）を15問
   - 'fill_blank': 穴埋め問題（重要語句を[　]に置換）を15問

⚠️ クイズ生成プロンプトは以下の手順で作成すること:
1. まず企画書_最終版.md のセクション4を読み、クイズ生成プロンプトテンプレートが
   存在するか確認する
2. テンプレートが存在する場合: 1文字も変えずそのまま使用する
3. テンプレートが存在しない場合: セクション4のカード生成プロンプトを元に、
   以下の変換指示を追加する:
   「上記カードをベースに [quiz_type] 形式の問題を生成せよ。
    multiple_choice: 4択（正答1つ・誤答3つ）
    fill_blank: 穴埋め（キーワードを___に置換）」

4. QuizGenerateResponse を返す

エラーハンドリング:
- カード枚数が5枚未満 → 400 "カードが少なすぎます（最低5枚必要）"
- Gemini APIエラー → 500

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. /app/deck/[deckId]/quiz/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- ページ表示時に /api/quiz/generate を呼び出し問題を取得
- quiz_type は URLパラメータ（?type=multiple_choice または ?type=fill_blank）で切り替え
- 4択問題: 選択肢4つをボタン表示 → 正解/不正解でボタン色変化（緑/赤）
- 穴埋め問題: テキスト入力フォームで回答 → 正解と一致確認
- 全問終了後: 結果画面（正答率・苦手カード一覧）を表示（企画書6.4モックアップ準拠）
  → [苦手カードだけ復習] → /deck/[deckId]/study?filter=wrong にリダイレクト
- events テーブルに test_answer / test_complete イベントを記録
```

### 1-5. ダッシュボード + 無料枠表示

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/shikenmon/src/app/dashboard/page.tsx を作成してください。
DeckList.tsx コンポーネントを src/components/ に分割して使用すること。

- ユーザーの作成デッキ一覧（DeckList.tsx を使用）
- 受信デッキ一覧（received_decks テーブルから取得）
- 無料枠残り表示: 「残り X 回 / 3回」（free_usage参照）
  有料ユーザーは「無制限」表示
- 「PDFをアップロード」ボタン → /upload
- 認証なし → /login にリダイレクト
```

### 1-6. オンボーディング（6ステップ）

**Claude Codeへの指示:**
```
前提: Phase 1-3（/api/pdf/generate）の実装が完了していること。
ステップ3「デモ用カード生成」は1-3のAPIを使用する。
1-3未完了の場合はステップ3をモックデータで代替し、1-3完了後に差し替えること。

/Users/ryuki/Desktop/shikenmon/src/app/onboarding/page.tsx
を作成してください。企画書セクション6.6・4.5の仕様に完全準拠すること。

6ステップ構成（企画書6.6準拠）:

Step 1: ニックネーム入力
  → profiles.nickname に保存（name ではない）

Step 2: 大学・学部・学年・在籍コース選択
  → profiles.university（normalizeUniversityName() で正規化後に保存）
  → profiles.faculty（ドロップダウン）
  → profiles.grade（1〜6年生 or 大学院=7）
  → profiles.enrollment_course（'6year' | '4year' | 'graduate'）
  → この情報により国試モード表示分岐ロジックが起動

Step 3: チュートリアルWOW体験
  → サンプルスライドでデモ → 10秒でカード3枚生成
  → 自分のスライドなしで価値を実感させる

Step 4: 自分のスライドをアップロード（本番初回）
  → UploadZone コンポーネントを使用

Step 5: 既存の学部内カードがあれば表示
  → 「先輩のデッキがすでに○枚あります。すぐ使えます」

Step 6: 学年別コンテンツ案内（企画書4.5の表示ルール）
  → 条件A: grade >= 3 かつ faculty in ['医学部','歯学部','薬学部','看護学部','理学療法学部','作業療法学部','臨床検査技術学部']
    → 「国試モードが利用できます」バナーを表示
  → 条件B: 資格試験登録あり（学年不問）
    → 資格試験モードバナーを表示
  → 条件C: 条件B非該当 かつ grade <= 2 かつ医歯薬看護
    → 「国試モードは3年生になると解放されます」プレビュー
  → 条件D: それ以外（grade <= 2）
    → 定期試験対策のみ案内

TypeScript インターフェース:
interface OnboardingData {
  nickname: string
  university: string
  faculty: string
  grade: number
  enrollment_course: '6year' | '4year' | 'graduate'
}
```

---

## Phase 2: デッキ公開・シェア・決済

⚠️ Phase 2 開始前の必須確認:
syncToOther() はSAKUモン・EIGOモンのDBに直接書き込む。
実装前に以下を確認すること:
1. /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts の subscriptions テーブル定義に
   app_access TEXT[]・current_period_end・pause_until・canceled_at が存在するか
2. 存在しない場合は syncToOther() の該当フィールドをコメントアウトして
   「TODO: sakumon側のスキーマ更新後に有効化」と明記すること
```typescript
// ⚠️ SAKUモン側に pause_until カラムが存在しない場合は以下のようにコメントアウト:
// await sakumonClient
//   .from('subscriptions')
//   .update({
//     status: data.status,
//     current_period_end: data.current_period_end,
//     // pause_until: data.pause_until,  // TODO: sakumon側のスキーマ更新後に有効化
//   })
//   .eq('user_id', userId)
```
3. SAKUMON_SUPABASE_URL・SAKUMON_SERVICE_ROLE_KEY の環境変数が .env.local に設定済みか

### 2-1. デッキ公開・非公開切り替え

**Claude Codeへの指示:**
```
以下を実装してください:

TypeScript インターフェース:
interface VisibilityRequest {
  is_public: boolean
}
interface VisibilityResponse {
  success: boolean
}

1. /api/deck/[deckId]/visibility (PATCH)
   { is_public: boolean }
   → decks.is_public を更新
   → 本人のみ操作可（RLS + API双方でチェック）

2. ダッシュボードの各デッキカードに「公開/非公開」トグルを追加
   公開時: 「このデッキは同大学・同学部の後輩が学習できます」の説明文表示
```

### 2-2. シェアURL + OGP

**Claude Codeへの指示:**
```
以下を実装してください:

1. /Users/ryuki/Desktop/shikenmon/src/app/deck/share/[deckId]/page.tsx
   企画書6.6の未ログインユーザー着地画面。
   - デッキプレビュー（1枚目のカードを表示）
   - 「全て見るには無料登録が必要です」
   - 「Googleで無料登録（30秒）」ボタン
   - 登録後、このデッキが自動でダッシュボードに追加:
     → /api/deck/[deckId]/receive (POST) で received_decks テーブルに記録
```typescript
// POST /api/deck/[deckId]/receive
interface ReceiveDeckRequest {
  deck_id: string  // URLパラメータから取得
}
interface ReceiveDeckResponse {
  success: boolean
  received_deck_id: string  // received_decks テーブルの id
}
// ファイルパス: /Users/ryuki/Desktop/shikenmon/src/app/api/deck/[deckId]/receive/route.ts
```

2. /Users/ryuki/Desktop/shikenmon/src/app/api/og/[deckId]/route.tsx
   @vercel/og で動的OGP画像生成。
   - デッキ名・カード枚数・SHIKENモンロゴ
   - サイズ: 1200×630

3. /deck/[deckId]/page.tsx に OGPメタタグを追加:
   title: 「{試験名}」の試験カード - SHIKENモン
   description: 先輩から{枚数}枚のフラッシュカードが届いています。無料で受け取ろう。
```

### 2-3. Stripe決済（全プラン）

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/app/api/stripe/checkout/route.ts を参考に、
/Users/ryuki/Desktop/shikenmon/src/app/api/stripe/checkout/route.ts を作成。

TypeScript インターフェース:
interface CheckoutRequest {
  plan: 'shiken_7day' | 'shiken_monthly' | 'shiken_standard' | 'mon_pass_monthly' | 'mon_pass_student'
  return_url?: string
}

interface CheckoutResponse {
  url: string
  upsell?: {
    show: boolean
    message: string
  }
}

サポートするプラン（企画書10.1準拠）:
- shiken_7day: ¥398（試験7日間パス）
  STRIPE_SHIKEN_7DAY_PRICE_ID
- shiken_monthly: ¥490/月（ライト）
  STRIPE_SHIKEN_MONTHLY_PRICE_ID
- shiken_standard: ¥980/月（スタンダード）
  STRIPE_SHIKEN_STANDARD_PRICE_ID
- mon_pass_monthly: ¥1,980/月（MONパス一般）
  STRIPE_MON_PASS_MONTHLY_PRICE_ID
- mon_pass_student: ¥680/月（MONパス学割）
  STRIPE_MON_PASS_STUDENT_PRICE_ID

app_access マッピング:
- shiken_7day/shiken_monthly/shiken_standard → ['shiken']
- mon_pass_monthly/mon_pass_student → ['shiken','eigo','saku']

MONパスアップセルトリガー:
POST { plan: 'shiken_7day', ... } の場合、
upsell.show = true の判定: shiken_7dayの過去購入回数 >= 1
レスポンスに upsell: { show: true, message: '差額でSAKUモン・EIGOモンも使えます' } を含める。

checkout.sessions.create の設定:
- success_url: /dashboard?payment=success
- cancel_url: /pricing
- allow_promotion_codes: true
```

### 2-4. Stripe Webhook（冪等性保証）

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/shikenmon/src/app/api/stripe/webhook/route.ts を作成。
/Users/ryuki/Desktop/sakumon/src/app/api/stripe/webhook/ を参考にしてください。

⚠️ stripe_events テーブルは使用禁止。
   冪等性チェックは webhook_events テーブルのみ使用すること。

処理フロー（企画書12.3の実装コードを完全準拠）:

// 冪等性チェック
async function isAlreadyProcessed(client: SupabaseClient, stripeEventId: string): Promise<boolean>
  → webhook_events テーブルの stripe_event_id で検索

// 処理済み記録
async function markAsProcessed(client: SupabaseClient, stripeEventId: string): Promise<void>
  → webhook_events に INSERT { stripe_event_id }

// メインハンドラ
export async function POST(request: Request) {
  const event = await constructStripeEvent(request)
  if (await isAlreadyProcessed(supabase, event.id)) {
    return NextResponse.json({ received: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        → subscriptions テーブルに INSERT/UPSERT
        → app_access を plan_id に応じて設定
        → stripe_customer_id も保存すること
        → syncToOther() で SAKUモン・EIGOモンにも反映

      case 'customer.subscription.updated':
        → subscriptions.status, current_period_end を更新
        （period_end ではなく current_period_end）

      case 'customer.subscription.paused':
        → status: 'paused'
        → pause_until: resumes_at があれば new Date(resumes_at * 1000).toISOString()、なければ null

      case 'customer.subscription.resumed':
        → status: 'active'
        → pause_until: null

      case 'customer.subscription.deleted':
        → status: 'canceled'
        → canceled_at: new Date().toISOString()

      default:
        break
    }
    await markAsProcessed(supabase, event.id)
  } catch (err) {
    console.error('Webhook processing error:', err)
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

syncToOther() 実装:
// 企画書12.3では「EIGOモン側に syncToSHIKEN() を追加する」アーキテクチャも示されているが、
// 実装指示書ではSHIKENモン側からのfanout（APP_REGISTRYパターン）を採用する。
// 理由: 新規アプリ追加時の変更箇所がSHIKENモン1箇所に集約できるため。
// SAKUモン・EIGOモン側への変更は不要。
APP_REGISTRY パターンで sakumon / eigomon への同期を実装。
SHIKENモン自身は APP_REGISTRY に含めない:
APP_REGISTRY = [
  { appName: 'sakumon', supabaseUrl: SAKUMON_SUPABASE_URL, serviceKey: SAKUMON_SUPABASE_SERVICE_ROLE_KEY },
  { appName: 'eigomon', supabaseUrl: EIGOMON_SUPABASE_URL, serviceKey: EIGOMON_SUPABASE_SERVICE_ROLE_KEY },
]
各アプリの webhook_events テーブルにも markAsProcessed() を実行してべき等性を保証。
```

### 2-5. 料金ページ + アップセルUI

**Claude Codeへの指示:**
```
/app/pricing/page.tsx を作成してください。

企画書10.1の料金プランを表示（全プラン必須）:
- 無料（スキャン3回/月）
- 試験7日間パス ¥398（買い切り）
- ライト ¥490/月
- スタンダード ¥980/月（おすすめバッジ）
- MONパス月額 ¥1,980/月（3アプリ）
- MONパス学割 ¥680/月

試験7日間パス2回目購入時のアップセルモーダル:
- checkout API から upsell: { show: true } が返ってきた場合に表示
- 「差額でSAKUモン・EIGOモンも使えます」
- 「MONパスにアップグレード」ボタン
- 「このまま続ける」リンク
```

---

## Phase 3: OCR品質分岐・AI的中率

**Phase 3 サブセクション:**
```
3-1. 画像型PDF・OCR品質分岐
3-2. 的中報告API・Cf計算
3-3. フィードバック画面（試験後3軸評価 + L1/L2/L3申告）
// ※ OCR編集UIは3-1に統合済み
3-4. 的中率バッジUI
3-5. Vercel Cronジョブ（通知・集計）
3-6. MONポイント付与
3-7. 解約防止フロー（/settings/cancel）
```

### 3-1. 画像型PDF・OCR品質分岐

**Claude Codeへの指示:**
```
Phase 1 の /api/pdf/generate を拡張してください。

画像型PDF処理（企画書6.2の2ステップインライン編集確定設計）:
- pdf-parse でテキスト抽出 → 文字数/P < 200 → 画像型と判定
- 画像型の場合: Gemini 1.5 Flash Vision API でPDFを直接読み込む
  （Gemini File API: PDFを直接inputとして渡せる）
- ブロック信頼度スコア計算（enterprise画像):
  - Gemini Vision レスポンスのテキストブロックを評価
  - ブロックスコア < 0.85 → フロントに { blocks: [{text, score, index}] } を返す
- 全ブロック >= 0.85 → そのままカード生成
- 一部ブロック < 0.85 → { status: 'needs_review', blocks: [...] } を返す

TypeScript インターフェース:
interface OCRBlock {
  text: string
  score: number
  index: number
}

interface GenerateNeedsReviewResponse {
  status: 'needs_review'
  blocks: OCRBlock[]
}

/app/upload/review/page.tsx を作成してください（企画書6.2のOCR編集UI）:
- 低スコアブロックをオレンジ枠でハイライト
- 2ステップインライン編集（モーダル不使用・ページ遷移なし）:
  Step 1: ハイライト表示 → [修正する]タップ → textareaがインライン編集可能に変化
  Step 2: 編集完了 → [保存]ボタン → 次の不鮮明ページへ自動スクロール
- [キャンセル]押下: 当該ページの編集を破棄し元のOCRテキストに戻す
- 全ページ確認完了で「カード生成」ボタンが活性化
- [このままでOK]ボタン: 警告文言付きでスキップ可能
- 60秒タイムアウト時のfallback: 処理完了済みページ分のカードを先行表示
  残りページは「処理中」バッジで非同期追加
```

### 3-2. 的中評価報告 + 的中率計算

**最重要: 旧 `hit: boolean` API は使用しない。hit_ratings テーブル向けの新仕様に全面変更。**

**Claude Codeへの指示:**
```
以下を実装してください。企画書セクション8、付録A・Eを参照。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. /api/exam/report (POST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TypeScript インターフェース（新仕様・変更禁止）
interface HitRatingRequest {
  deck_id: string
  exam_date: string
  l1_count: number        // テーマ的中件数
  l2_count: number        // 範囲的中件数
  l3_count: number        // 問題的中件数
  accuracy_score: number  // 的中度★ (1-5)
  clarity_score: number   // 分かりやすさ★ (1-5)
  coverage_score: number  // 網羅性★ (1-5)
}

interface HitRatingResponse {
  success: boolean
  hit_score: number       // 計算された的中スコア (0-1.0)
  hit_stars: number       // ★表示 (1-5)
  cf: number              // 信頼度係数
  total_raters: number    // 評価受験者数
}

処理:
- hit_ratings テーブルに UPSERT（UNIQUE: deck_id + user_id + exam_date）
- 作成者本人の申告は計算から除外（decks.user_id = auth.uid() の場合はskip）
- ゲーミング対策: 1ユーザー/試験期あたり最大5科目（exams でカウント）
- 的中率計算:
  n = hit_ratings テーブルの同一 deck_id + exam_date の件数
  Cf = calcCf(n)（ステップ関数）
  加重的中スコア = (L3件数 × 1.0 + L2件数 × 0.6 + L1件数 × 0.3) ÷ n
  hit_score = min(1.0, 加重的中スコア × Cf)
- exams テーブルの hit_reported = true に更新
- スキャン+3チケット付与（free_usage.usage_count + 3）
- 72時間仮集計: reported_at が72時間以内のレコードは仮集計扱い
  → decks.hit_rate 表示に「（集計中）」フラグ（APIレスポンスで is_confirmed: false）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. /api/cron/finalize-reports（Vercel Cron・毎時実行）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- exams の reported_at < NOW() - INTERVAL '72 hours' AND confirmed = false を
  confirmed = true に更新
- hit_rate を再計算して確定スコアに更新

vercel.json に以下を追加すること（Phase 3-2完了時点で登録するもの）:
{
  "crons": [
    { "path": "/api/cron/finalize-reports", "schedule": "0 * * * *" }
  ]
}
// ⚠️ /api/cron/remind は Phase 3-5 完了時に登録する

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. リマインド通知の実装は Phase 3-5 を参照

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. /app/deck/[deckId]/study/page.tsx に試験日登録フロー追加
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
カード学習完了後:
- Cf = 0.0（5件未満）の場合: 「的中率はまだ集計中です。試験後に報告してください」
- 「試験日をカレンダーに登録」ボタン → exams テーブルに INSERT
```

### 3-3. フィードバック画面（試験後）

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/shikenmon/src/app/deck/[deckId]/feedback/page.tsx
を作成してください。
UIコンポーネントは src/components/ に分割すること。

企画書セクション6.5のモックアップ通りに実装。

使用コンポーネント（src/components/ に作成）:
- StarRating.tsx: ★1〜5の評価入力UI（タップで選択）
- HitRatingForm.tsx: L1/L2/L3申告UI + StarRating を組み合わせたフォーム

HitRatingForm のUI要件:
1. 3軸★評価（StarRating.tsx を使用）:
   - 的中度（accuracy_score）: ★1〜5
   - 分かりやすさ（clarity_score）: ★1〜5
   - 網羅性（coverage_score）: ★1〜5

2. L1/L2/L3申告UI（企画書付録E.1の定義に準拠）:
   - L3（問題的中）: デッキ内カードを個別チェックボックス表示
     → チェックされたカードのl3_count をカウント
   - L2（範囲的中）: 「このページ範囲から出た」ページ範囲選択
     → l2_count をカウント
   - L1（テーマ的中）: 「このテーマが出た」大カテゴリチェック
     → l1_count をカウント

3. 送信ボタン: 「送信 → スキャン+3枚チケット獲得」
   → /api/exam/report に HitRatingRequest を送信

TypeScript インターフェース:
interface FeedbackFormState {
  accuracy_score: number
  clarity_score: number
  coverage_score: number
  l1_count: number
  l2_count: number
  l3_count: number
  selectedL3Cards: string[]
}
```

### 3-4. 的中率表示UI

**Claude Codeへの指示:**
```
以下を実装してください。企画書6.4の表示仕様を参照。

1. DeckList.tsx / デッキカードコンポーネントに的中率バッジ追加:
   - Cf = 0.0 → 表示なし（「報告待ち」グレー）
   - Cf = 0.5 → ★平均のみ（オレンジ）
   - Cf >= 0.8 → 重要度スコア表示（グリーン）
   - Cf = 1.0 → 「出題傾向分析済み」バッジ
   - ツールチップ: 「XX人の報告に基づく（信頼度: 高/中/参考値）」

2. 学習画面の上部プログレスバー横に的中率表示

3. getHitLevel() を supabase.ts から import して使用:
   - 'hidden'（Cf === 0.0、評価4件以下）→「報告待ち」グレーテキスト、スコア非表示
   - 'lv2'（Cf = 0.5〜0.8）→ 標準バッジ（スコア表示）
   - 'lv3'（Cf >= 0.8 かつ n >= 20）→ 高精度バッジ（スコア＋信頼度表示）
  // ※ Cf=1.0（n>=100）でも lv3。calcCf()定義と必ず一致させること。
   - none（n === 0）→ 非表示
   // ⚠️ 'lv1'は廃止。'hidden'を使うこと。
```

### 3-5. Vercel Cronジョブ（通知・集計）

**実装すること:**

1. `/api/cron/finalize-reports/route.ts`（毎時実行）
   - reported_at < NOW() - INTERVAL '72 hours' かつ confirmed = false の hit_ratings を
     confirmed = true に更新し、decks.hit_rate を再計算する
   - ※ vercel.json への登録は Phase 3-2 完了時点で実施済み

2. `/api/cron/remind/route.ts`（毎朝9時 JST = UTC 0:00）
   - 試験14日前ユーザーへのリマインド通知（Web Push / メール）
   - vercel.json に以下を追記すること（Phase 3-7完了後ではなくここで登録）:
     { "path": "/api/cron/remind", "schedule": "0 0 * * *" }

**完了チェックリスト:**
- [ ] /api/cron/finalize-reports が Vercel Dashboard で毎時実行されている
- [ ] /api/cron/remind が Vercel Dashboard で毎朝0:00 UTC に実行されている
- [ ] npm run build でエラーなし

### 3-6. MONポイント付与（企画書V1-8）

**Claude Codeへの指示:**
```
以下を実装してください。

実装すること:
1. 以下のイベントでmon_pointsテーブルにポイントを付与:
   - デッキ作成: +50ポイント
   - 的中フィードバック提出: +10ポイント
   - デッキシェア（初回）: +20ポイント
   - 7日連続ログイン: +100ポイント（streak_days更新と連動）

2. バッジシステム（総累計ポイントで判定）:
   - ブロンズ: 0〜499pt
   - シルバー: 500〜1999pt
   - ゴールド: 2000〜4999pt
   - プラチナ: 5000pt以上

3. 付与関数:
// POST /api/mon-points/add
interface AddPointsRequest {
  user_id: string
  app: string      // 'shiken' | 'saku' | 'eigo'
  points: number
  reason: string   // 'deck_created' | 'feedback_submitted' | 'deck_shared' | 'streak_7days'
}
interface AddPointsResponse {
  total_points: number
  badge: 'bronze' | 'silver' | 'gold' | 'platinum'
}
ファイルパス: `/Users/ryuki/Desktop/shikenmon/src/app/api/mon-points/add/route.ts`

4. ダッシュボードにポイント残高とバッジを表示
```

### 3-7. 解約防止フロー（3ヶ月一時停止）

**Claude Codeへの指示:**
```
企画書9.3の解約防止フローを実装してください。
一時停止期間は3ヶ月（1ヶ月ではない）。

TypeScript インターフェース:
interface CancelPreviewResponse {
  deck_count: number
  card_count: number
  hit_record_count: number
  streak_days: number
}

interface PauseRequest {
  months: 3
}

interface PauseResponse {
  success: boolean
  pause_until: string
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. /api/subscription/cancel-preview (GET)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
企画書9.3の技術仕様コードに完全準拠:
- decks テーブルから user_id で取得
- deckIds が空の場合は .in() を呼ばない（空配列チェック必須）
- hit_ratings テーブルで hit_record_count を取得
- profiles.streak_days を取得
- レスポンス: { deck_count, card_count, hit_record_count, streak_days }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. /app/settings/cancel/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
企画書9.3のフロー通り:
- 「解約すると以下のデータが失われます」（蓄積データ表示）
- 「代わりに3ヶ月一時停止（¥0）にする」ボタン（先出し）
  → 承諾: pause_until = 3ヶ月後
         Stripe pause_collection: { behavior: 'void' } 設定
- 「解約理由を選択」（一時停止却下後）:
  ① 試験が終わった
  ② 値段が高い
  ③ 他のツールで足りる
  ④ その他（自由記述）
  → cancellation_reasons テーブルに記録
- 「やっぱり続ける」ボタン
- 「解約する」（グレー・小さいボタン）→ /api/subscription/cancel

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. /api/subscription/cancel (POST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- stripe.subscriptions.cancel()
- subscriptions.status = 'canceled'
- subscriptions.canceled_at = new Date().toISOString()

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. /api/subscription/pause (POST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- stripe.subscriptions.update(stripeSubscriptionId, { pause_collection: { behavior: 'void' } })
- subscriptions.pause_until = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
- subscriptions.status = 'paused'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. Vercel Cron（14日リマインド）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/api/cron/remind
schedule: "0 0 * * *"（毎朝9時JST）
// ↑ UTC 0:00 = JST 9:00
- profiles で最終ログインから14日以上経過したアクティブ有料ユーザーを取得
- Web Push → フォールバックでメール送信
- 月2回上限（events テーブルで管理）
  event_type: 'reminder_sent' で記録。当月2件以上ならスキップ

// ⚠️ /api/cron/remind の vercel.json 登録は Phase 3-5 完了時に実施済み。
// ここで再登録する必要はない。
```

### 3-8. マイゴール機能（SDT自律性）

**概要**: ユーザーが受験目標（試験名・目標日・目標スコア）を設定し、ホーム画面に達成率ウィジェットを表示する。Self-Determination Theory（SDT）の「自律性」充足による継続率向上が目的。

**DBマイグレーション（SHIKENモンのSupabaseで実行）:**
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS goal_exam TEXT,
  ADD COLUMN IF NOT EXISTS goal_deadline DATE,
  ADD COLUMN IF NOT EXISTS goal_target_score INTEGER;

COMMENT ON COLUMN profiles.goal_exam IS '目標試験名（例: 医師国家試験・薬剤師国試・TOEIC）';
COMMENT ON COLUMN profiles.goal_deadline IS '試験日・目標達成日';
COMMENT ON COLUMN profiles.goal_target_score IS '目標スコア（任意）';
```

**型定義更新（supabase.ts のProfile型に追加）:**
```typescript
goal_exam: string | null
goal_deadline: string | null
goal_target_score: number | null
```

**実装内容:**
- `/src/app/api/goal/route.ts` を新規作成（POST: goal_exam/goal_deadline/goal_target_score をprofilesに保存）
- ホーム画面にゴール設定ウィジェット追加（設定済みの場合は「{試験名}まであと{N}日」表示）
- 目標が設定されている場合、weekly-review（B-3実装後）のAIプロンプトに目標情報を付加

**完了チェックリスト:**
```
□ SHIKENモンのSupabaseにgoal_exam/goal_deadline/goal_target_scoreカラムが追加されている
□ Profile型が更新されている
□ /api/goal エンドポイントが存在し、バリデーション実装済み
□ ホーム画面にゴール設定UIが表示される
□ npm run build がエラーなしで完了すること
```

---

### 3-9. Self-Compassionフィードバック設計（的中率低下週）

**概要**: 的中率が前週比で低下した週のユーザーに対し、数値強調を避けた「難易度帰属型」フィードバックを実装する。Self-Compassion理論（Deci & Ryan, 2000）に基づくチャーン防止施策。

**実装対象ファイル**: Phase 3-3で実装したフィードバック画面（`/src/app/feedback/page.tsx` または相当するファイル）

**実装内容:**

的中率集計時に前週比 `diff` を計算し、フィードバックテキストを分岐:

```typescript
// 的中率の前週比計算
const thisWeekRate = thisWeekRatings.length > 0
  ? thisWeekRatings.reduce((sum, r) => sum + r.accuracy_score, 0) / thisWeekRatings.length
  : 0
let diff = 0
if (prevWeekRatings && prevWeekRatings.length > 0) {
  const prevWeekRate = prevWeekRatings.reduce((sum, r) => sum + r.accuracy_score, 0) / prevWeekRatings.length
  diff = Math.round((thisWeekRate - prevWeekRate) * 10) / 10
}

// フィードバックテキストの分岐
const feedbackNote = diff > 0
  ? `前週比+${diff}ptの的中精度向上`
  : diff < 0
    ? `前週より範囲が広い・難度の高い試験に挑戦した週（的中精度変動あり）`  // 数値露出しない
    : '前週と同水準の的中精度'
```

**AIプロンプトへのSelf-Compassion指示追加（Gemini API呼び出し箇所）:**

```typescript
${diff < 0 ? `
【重要・的中率低下週の設計指示（Self-Compassion理論に基づく）】
- 的中率低下のパーセント数値を直接提示しないこと（「〇%下がった」という表現禁止）
- 的中率低下を「難度の高い科目・範囲への挑戦」として帰属させること
- nextWeekPlan は「1デッキだけ復習」「得意科目から再開」という縮小目標にすること
- motivationalQuote は挑戦・継続・立ち直りに関するものを選ぶこと
` : ''}
```

**完了チェックリスト:**
```
□ 的中率の前週比 diff 変数がフィードバック生成時点のスコープにある
□ diff < 0 のとき feedbackNote に数値が含まれない
□ AIプロンプトに Self-Compassion 条件分岐が追加されている
□ npm run build がエラーなしで完了すること
```

---

## Phase 4: スケール・国家試験モード（v2.0 後回し）

### 4-1. fuzzy match 重複検出（v2.0）

**Claude Codeへの指示:**
```
pg_trgm 拡張を使った重複検出を実装してください。
企画書付録D（大学名2段階正規化仕様）参照。

1. Supabase で pg_trgm 拡張を有効化:
   CREATE EXTENSION IF NOT EXISTS pg_trgm;

2. /api/pdf/check-duplicate を拡張:
   Phase 1（ハッシュ）で不一致の場合:
   → Supabase RPC で trigram 類似度チェック:
     find_university_by_trigram（付録Dの関数を使用）

3. フロント: 類似デッキ検出時の確認モーダル
   「類似したデッキが既にあります。別のデッキとして保存しますか？」
   「既存デッキを利用」 / 「新しいデッキとして保存」

4. normalizeUniversityName() 関数を supabase.ts に実装（付録D完全準拠）:
   Step 1: university_aliases テーブルの alias で完全一致検索
   Step 2: trigram 0.8 で fuzzy match
```

### 4-2. 国家試験モード（v2.0）

**Claude Codeへの指示:**
```
企画書セクション9.2の国家試験モードを実装してください。
national_exams テーブルは Phase 0-3 で作成済み。

1. /app/national-exam/page.tsx
   - 国家試験選択UI（medical_exams テーブルから取得）
   - 「市販教材PDF」と「自分のノートPDF」を両方アップロード

2. /api/pdf/generate-hybrid (POST)
   - 2つのPDFテキストを結合してGeminiに渡す
   - プロンプト調整: 「市販教材の定義 + 自分のノートの言葉で説明」するカードを生成

3. Virtual Scroll（react-window）:
   カード枚数 > 100枚の場合は react-window の FixedSizeList を使用
```

### 4-3. Option A→B DB移行（MAU 10,000 達成時）

企画書12.2の移行判断KPIを参照。
移行判断フロー・マイグレーション手順・ロールバック手順は企画書セクション12.2に記載済み。
実装時は Feature Flag `UNIFIED_DB=false` を環境変数で管理。

#### Phase 4 予定: ZPD/SM-2/FSRS 全アプリ共通実装

SHIKENモンリリース後に EIGOモン・SAKUモン・SHIKENモンの全アプリ横断で設計・実装予定。

| 機能 | 概要 | 実装方針 |
|---|---|---|
| SM-2/FSRS分散学習エンジン | 復習タイミング自動最適化（1日後→3日後→7日後→21日後→60日後） | cards/events テーブルに next_review_at / ease_factor カラム追加 |
| ZPDスコア難易度最適化 | 正答率55〜75%ゾーンの問題を自動選択 | ZPD_Score = (正答率×0.4) + (1/解答時間_正規化×0.3) + (難易度×0.3) |
| IRT（項目応答理論） | 問題難易度の統計的推定・ユーザー能力値計算 | Raschモデルによる difficulty/discrimination パラメータ推定 |

詳細設計はSHIKENモン v1.0 リリース後に別途実装指示書を作成する。

---

## 付録: よく使うClaude Codeへの指示テンプレート

### セッション開始（毎回コピペ）
```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/_docs/実装/SHIKENモン_実装指示書_ClaudeCode用.md
- /Users/ryuki/Desktop/mon-landing/_docs/企画書/SHIKENモン_企画書_最終版.md
- /Users/ryuki/Desktop/mon-landing/_docs/戦略書/MONシリーズ_atama+差別化戦略書_v4.md（差別化戦略の背景確認用）
- /Users/ryuki/Desktop/sakumon/src/app/api/stripe/checkout/route.ts
- /Users/ryuki/Desktop/shikenmon/src/lib/supabase.ts  ← Phase 0-4完了後に存在するファイル。未存在の場合はスキップ
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts  ← syncToOther()でEIGOモンに書き込む場合に参照

データベーススキーマは企画書【付録A】を唯一の正典とする。
カラムの追加・削除・型変更は一切禁止。

今日実装するのは「Phase X の X-X: ○○」です。
```

### DBマイグレーション実行指示
```
/Users/ryuki/Desktop/shikenmon/migrations/000X_xxx.sql の内容を確認して、
Supabase Dashboard の SQL Editor でそのまま実行できる形式になっているか
確認してください。

チェックリスト:
□ 全テーブルのRLSポリシーが含まれているか
□ has_access() 関数に SECURITY DEFINER が付いているか
□ subscriptions テーブルが current_period_end（period_end でない）を使っているか
□ webhook_events テーブルのみ存在し stripe_events テーブルが存在しないか
□ profiles テーブルが nickname（name でない）を使っているか
□ cards テーブルが importance_score FLOAT（TEXT でない）を使っているか
```

### Stripe環境変数確認指示
```
/Users/ryuki/Desktop/shikenmon/.env.local の STRIPE_* 変数が正しく設定されているか確認し、
Stripe Dashboard > Products で以下の Price ID を確認してください:
- STRIPE_SHIKEN_7DAY_PRICE_ID（¥398）
- STRIPE_SHIKEN_MONTHLY_PRICE_ID（¥490/月・ライト）
- STRIPE_SHIKEN_STANDARD_PRICE_ID（¥980/月・スタンダード）
- STRIPE_MON_PASS_MONTHLY_PRICE_ID（¥1,980/月・SAKUモンと共通）
- STRIPE_MON_PASS_STUDENT_PRICE_ID（¥680/月・学割）
```

### Gemini API テスト指示
```
/Users/ryuki/Desktop/shikenmon/scripts/test-gemini.ts を作成し、
企画書のプロンプトテンプレートでサンプルテキストからカードが生成できるか
テストしてください。
```

### Phase完了確認チェックリスト
```
以下の全チェックを通過してからPhase完了とします:
□ npm run build がエラーなしで完了する
□ TypeScript の型エラーが0件
□ 全APIに Request/Response TypeScript インターフェースが定義されている
□ UIコンポーネントが src/components/ 配下に分割されている
□ 新規テーブルがあれば RLSポリシーが全て設定されている
□ subscriptions の period_end カラムを使っていないか（current_period_end を使う）
□ hit_ratings テーブルを正しく参照しているか（exams.hit は使わない）
□ calcCf() がステップ関数を使っているか（対数計算は禁止）
```

---

## トラブルシューティング

### DBスキーマ確認（最頻出ミス）

以下のミスが発生しやすい。実装前に必ずチェック:

| NG（古い指定） | OK（企画書付録A正典） |
|---|---|
| `name TEXT` | `nickname TEXT` |
| `email TEXT` | 存在しない |
| `avatar_url TEXT` | 存在しない |
| `period_end TIMESTAMPTZ` | `current_period_end TIMESTAMPTZ` |
| `importance TEXT CHECK (importance IN ('high','medium','low'))` | `importance_score FLOAT DEFAULT 0.0` |
| `hit BOOLEAN` on exams | 存在しない（hit_ratings テーブルで代替） |
| `stripe_events` テーブル | `webhook_events` テーブルのみ |
| `hit_rate/hit_cf/hit_count` on decks | 存在しない（hit_ratings で計算） |
| `DEFAULT false` on decks.is_public | `DEFAULT true`（公開がデフォルト） |
| `calcCf: Math.log(n+1)/Math.log(11)` | ステップ関数（n>=100→1.0, n>=20→0.8, n>=5→0.5, else→0.0） |
| `status IN ('active','canceled')` | `status IN ('active', 'trialing', 'paused')` |

### Vercel タイムアウトエラー

PDF処理APIで `Function Execution Timeout` が発生する場合:
```typescript
// route.ts の先頭に必ず両方追加
export const runtime = 'nodejs'   // Edge Runtime禁止
export const maxDuration = 60     // Vercel Pro: 最大60秒
```

### Webhook 二重処理エラー

Stripe Webhookが複数回配信された場合の対処:
- `webhook_events` テーブルの `stripe_event_id UNIQUE` 制約でべき等性を保証
- `isAlreadyProcessed()` で処理済みチェックを行い、済みならスキップ
- `markAsProcessed()` は try ブロックの**最後**に実行（エラー時は記録しない）

### supabase.ts の型不一致エラー

```
型エラー: Property 'name' does not exist on type 'Profile'
```
→ `nickname` に変更すること（DBスキーマは nickname）

```
型エラー: Property 'period_end' does not exist on type 'Subscription'
```
→ `current_period_end` に変更すること

---

*企画書（v12.0）: /Users/ryuki/Desktop/mon-landing/_docs/企画書/SHIKENモン_企画書_最終版.md*
*DBスキーマ正典: 企画書【付録A】（1624〜1774行）*
