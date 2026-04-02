# MON B2B 実装指示書（Claude Code用）

作成日: 2026-03-31（v2: 2026-04-01 設計書v22完全準拠版）
対象: SAKUモン（/Users/ryuki/Desktop/sakumon）→ 完成後にEIGOモンへ展開
設計書（正典）: `/Users/ryuki/Desktop/mon-landing/B2Bアプリ設計_最終版_v22_94点.md`
進め方詳細: `B2B実装_進め方.md`（別ファイル）

---

## ⚠️ 実装前に必ず読むこと：禁止事項・アンチパターン

以下は**いかなる理由があっても禁止**です。違反した場合はコードを差し戻してください。

```
【セキュリティ】
- Service Role Key はサーバーサイド（API Routes）のみ使用。クライアントサイド使用禁止
- RLSをbypassするadminクライアントはAPI Routes以外で使わない
- Vercel Cron Secret認証をスキップしない

【型安全】
- TypeScript の型定義は `type` 統一（`interface` は使用禁止）
- `any` 型および `as any` は使用禁止（`unknown` + 型ガードを使うこと）
- supabase.ts の型定義が古い場合は `supabase gen types` で再生成してから実装する

【Stripe】
- Stripe APIの全呼び出しに idempotency key を必ず付ける
  例: stripe.subscriptions.create({...}, { idempotencyKey: `sub_${teacherId}_${Date.now()}` })

【ZPD・DB】
- `zpd_score` はDBのGENERATED ALWAYS ASカラムが自動計算する。APIで手動計算してはならない
- DBスキーマは設計書v22の【付録/DBスキーマ】を唯一の正典とする。
  1カラムも省略せず、型・制約・インデックス・RLSポリシーを完全コピーしてSQLを作成すること。
  独自のカラム追加・削除・型変更・デフォルト値変更は一切禁止する。

【レースコンディション】
- ZPD更新APIとCron処理では pg_advisory_xact_lock で重複処理を防ぐ
  例: SELECT pg_advisory_xact_lock(hashtext(student_id::text));
```

---

## 全体の流れ（概要）

```
SAKUモン Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4
                                                       ↓
                                            EIGOモン（差分のみ実装）
```

**1フェーズずつ完成・テスト・販売してから次へ。** Phase 1だけで収益化できます。
詳細な進め方・判断基準・トラブル対応は `B2B実装_進め方.md` を参照してください。

---

## セッション開始テンプレート（毎回のセッションで使用）

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/B2B実装指示書_ClaudeCode用.md
- /Users/ryuki/Desktop/mon-landing/B2Bアプリ設計_最終版_v22_94点.md
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts（既存の型定義）
- /Users/ryuki/Desktop/sakumon/src/app/api/stripe/checkout/route.ts（既存の課金パターン）

まず実装指示書の「禁止事項・アンチパターン」セクションを読んでから開始してください。
対象Phaseのセクションに従って実装してください。
```

> Phase別の詳細テンプレートは末尾【フェーズ別開始テンプレート】セクションを参照してください。
> ⚠️ 実際のコピペはそちら（フェーズ別開始テンプレート）を使ってください。こちらは概要のみです。

---

## Phase 0: DBマイグレーション（全Phase着手前に完了すること）

### 0-1. データベーススキーマ（設計書v22が唯一の正典）

**Claude Codeへの指示:**
```
データベーススキーマは
/Users/ryuki/Desktop/mon-landing/B2Bアプリ設計_最終版_v22_94点.md の
【付録/DBスキーマ】を唯一の正典とする。

1カラムも省略せず、型・制約・インデックス・RLSポリシーを完全コピーして
/Users/ryuki/Desktop/sakumon/migrations/0001_b2b_base.sql を作成してください。

独自のカラム追加・削除・型変更・デフォルト値変更は一切禁止します。

作成対象テーブル（設計書v22に定義されたもの全て）:
1.  teachers
2.  students
3.  classrooms
4.  classroom_teachers
5.  teacher_student_assignments
6.  zpd_weekly_stats（pg_partman月次パーティション。Supabase Proでない場合は通常テーブルで作成し、コメントを残す）
7.  phase_transition_logs
8.  teacher_sop_notifications（カラム: read_at / resent_at / bounce_log ← 設計書準拠の名称を使うこと）
9.  teacher_consent_override_logs（confirmed_text_version TEXT DEFAULT 'v1.0' 必須）
10. encouragement_message_logs
11. zpd_suspension_logs（skip_reason フィールド必須）
12. referral_logs
13. prohibited_pattern_override_logs（EU AI Act Art.13対応、5年保存、override_reason NOT NULL CHECK(char_length >= 10)）
14. utm_source_missing_log

インデックス（33本、設計書v22の全定義を完全コピーすること）:
設計書の「インデックス（33本）」セクションを参照し、1本も省略しないこと。
代表的なものは以下だが、これだけでは不十分（全33本が必要）:
- students(teacher_id, phase, week_start)
- phase_transition_logs(student_id, transitioned_at DESC)
- teacher_sop_notifications(teacher_id, read_at)
- referral_logs(referrer_teacher_id, created_at)
- idx_zpd_weekly_stats_week_end（zpd_cross_month_weeks VIEWを最適化する）

⚠️ インデックスについて:
設計書v22の【付録/インデックス一覧】に33本が定義されている。
必ずその全てを作成すること。特に以下は見落としが多いため注意:
- idx_zpd_weekly_stats_week_end（zpd_cross_month_weeks VIEWのパフォーマンスに必須）
- idx_students_teacher_id_phase_week_start（複合インデックス）
- idx_phase_transition_logs_student_id_transitioned_at（DESC）
設計書付録のインデックス一覧を1本も省略せず全て実行すること。

VIEW（設計書v22で定義された全VIEWを作成）:
- v_classroom_summary（教室別KPI集計）
- v_teacher_student_overview（講師ダッシュボード用）
- zpd_cross_month_weeks（月またぎ週の分析用）

⚠️ zpd_cross_month_weeks VIEW は idx_zpd_weekly_stats_week_end インデックスに依存している。
VIEWを作成する前にこのインデックスが存在することを確認すること。

マテリアライズドビュー:
- referral_yearly_stats（CONCURRENT REFRESH対応で作成）
  ※ CONCURRENTLY を使うには一意インデックスが必要なので忘れずに作成する
  ※ 月次Cronから log_mv_refresh_result RPC で記録（RPC関数も作成する）

⚠️ referral_yearly_stats のCONCURRENT REFRESHは process-rewards Cron（月次）の
ステップ5として実行する。独立したCronは不要。
これは設計書v22の意図と同等である（月次Cronでのリフレッシュ）。

RLSポリシー（設計書v22を完全コピーすること）:
- teachers: auth.uid() = user_id のみ SELECT/UPDATE
- students: teacher_idが自分のteacher.idのもののみ SELECT/INSERT/UPDATE/DELETE
- teacher_student_assignments: 同上
- classrooms: owner_teacher_idが自分のteacher.idのもの、またはclassroom_teachersに含まれるもの
- classroom_teachers: classroomのowner_teacher_idが自分のもの
- prohibited_pattern_override_logs: admin_only（admin roleのみ読み書き可）

zpd_score カラムについて:
- zpd_weekly_stats の zpd_score は GENERATED ALWAYS AS カラムとして定義する
- 計算式: accuracy * 0.5 + cv_stability * 0.2 + error_pattern * 0.3
- APIで手動計算・手動INSERTは禁止する
```

---

### 0-2. Phase 0 完了チェックリスト

```
□ マイグレーションSQLをSupabaseダッシュボードのSQL Editorで実行した（エラーゼロ）
□ 全14テーブルが作成されている（Supabase Table Editor で確認）
□ 33本のインデックスが全て作成されている（\d tablename で確認）
□ 3つのVIEWが作成されている（v_classroom_summary / v_teacher_student_overview / zpd_cross_month_weeks）
□ referral_yearly_stats マテリアライズドビューが作成されている
□ log_mv_refresh_result RPC関数が作成されている
□ 全テーブルのRLSが有効化されている（supabase.com > Authentication > Policies で確認）
□ prohibited_pattern_override_logs のRLSがadmin_onlyになっている
□ teacher_sop_notifications のカラム名が resent_at / bounce_log になっている（escalation_ プレフィックスなし）
□ npm run build が通る（型エラーがないことを確認）
```

---

## Phase 1: B2B基盤（講師プラン販売開始まで）

### 1-1. Teacher型をsupabase.tsに追加

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/lib/supabase.ts に以下の型を追加してください。
既存のProfile型を参考にして、設計書v22のDBスキーマと完全に一致する型を追加します。

export type Teacher = {
  id: string
  user_id: string
  display_name: string
  stripe_customer_id: string | null
  subscription_status: 'free' | 'active' | 'canceled'
  subscription_end: string | null
  stripe_price_id: string | null
  referral_code: string
  referred_by: string | null
  created_at: string
}

export type Student = {
  id: string
  teacher_id: string
  display_name: string
  grade: string | null
  parental_consent_status: 'pending' | 'granted' | 'override'
  parental_consent_granted_at: string | null
  current_phase: 1 | 2 | 3
  created_at: string
}

export type Classroom = {
  id: string
  owner_teacher_id: string
  name: string
  stripe_subscription_id: string | null
  subscription_status: string
  base_price: number
  created_at: string
}

export type ZpdWeeklyStats = {
  id: string
  student_id: string
  teacher_id: string
  week_start: string
  week_end: string
  accuracy: number
  cv_stability: number
  error_pattern: number
  zpd_score: number  // GENERATED ALWAYS AS カラム（読み取り専用）
  phase: number
  session_count: number
  created_at: string
}

export type PhaseTransitionLog = {
  id: string
  student_id: string
  from_phase: number
  to_phase: number
  transition_type: 'phase1_to_2' | 'phase2_to_3' | 'phase2_to_1' | 'phase3_to_2' | 'phase1_to_2_recovery' | 'phase2_to_3_recovery'
  transitioned_at: string
  triggered_by: 'algorithm' | 'teacher_override'
}

export type TeacherSopNotification = {
  id: string
  teacher_id: string
  student_id: string
  notification_type: string
  message: string
  sent_at: string
  read_at: string | null
  resent_at: string | null           // escalation_resent_at ではない
  escalation_resend_count: number
  bounce_log: Record<string, unknown> | null  // escalation_bounce_log ではない
}
```

---

### 1-2. alertUtils.ts の作成（後続Phaseで参照するため先行作成）

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/lib/alertUtils.ts を作成してください。
設計書v22の「13. アラート設計」に準拠します。

export async function sendSlackAlert(message: string): Promise<void> {
  // 用途: 技術的異常（Cronジョブ異常、パフォーマンス閾値超過）
  // 宛先: process.env.SLACK_ALERT_WEBHOOK_URL
  // 未設定時: console.warn でフォールバック
  const webhookUrl = process.env.SLACK_ALERT_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('[alertUtils] SLACK_ALERT_WEBHOOK_URL が未設定です。Slackアラートをスキップします。', message)
    return
  }
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  })
}

export async function sendAdminAlert(params: { subject: string; body?: string }): Promise<void> {
  // 用途: ビジネス判断要求（紹介報酬プロラタ、utm_source欠如など）
  // 宛先: process.env.ADMIN_EMAIL（Resend/SendGrid経由）
  // 未設定時: console.warn でフォールバック
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.warn('[alertUtils] ADMIN_EMAIL が未設定です。管理者アラートをスキップします。', params.subject)
    return
  }
  // TODO: Resend or SendGrid でメール送信を実装
  console.log('[alertUtils] 管理者アラート送信:', params.subject)
}

このファイルは Phase 3 以降の全Cronで参照します。
```

---

### 1-3. consentDialogVersions.ts の存在確認と作成

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/lib/consentDialogVersions.ts が存在するか確認してください。
存在しない場合は以下の内容で新規作成してください（設計書v22の「4. 保護者同意システム」準拠）:

export const CONSENT_DIALOG_VERSIONS = {
  'v1.0': {
    text: '保護者の同意なしに学習データが記録・分析されます。よろしいですか？',
    introducedAt: '2026-04-01',
    deprecatedAt: null,  // 現行版
  },
} as const

export const CURRENT_CONSENT_DIALOG_VERSION = 'v1.0'

export type ConsentDialogVersion = keyof typeof CONSENT_DIALOG_VERSIONS
```

---

### 1-4. 講師登録API

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/app/api/b2b/teacher/register/route.ts を作成してください。

機能: auth.users に既にいるユーザーをteachersテーブルに登録する。

import { NextRequest, NextResponse } from 'next/server'

type RegisterRequest = {
  displayName: string
}

type RegisterResponse = {
  teacher: Teacher
}

type ErrorResponse = {
  error: string
}

- POST リクエスト
- body: RegisterRequest
- 認証: supabase auth で user_id を取得（未認証は401）
- teachersテーブルに INSERT（既に存在する場合は409エラー）
- 成功時: RegisterResponse を返す（200）

/Users/ryuki/Desktop/sakumon/src/app/api/stripe/checkout/route.ts の
supabase clientの作り方（service role key）を参考にしてください。
Service Role Key はこのファイル内のみで使用し、クライアントに返さないこと。
```

---

### 1-5. 講師プランStripe課金

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/app/api/stripe/checkout/route.ts を参考に、
/Users/ryuki/Desktop/sakumon/src/app/api/b2b/stripe/checkout/route.ts を作成してください。

type CheckoutRequest = {
  plan: 'teacher_plan'
  teacherId: string
  email: string
}

type CheckoutResponse = {
  url: string
}

以下を追加します：
- SUBSCRIPTION_PRICE_IDS に以下を追加:
  teacher_plan: process.env.STRIPE_B2B_TEACHER_PLAN_PRICE_ID!  // ¥1,980/月

- POSTリクエスト body: CheckoutRequest
- teachersテーブルのstripe_customer_idを確認・作成
- Stripe checkout session を作成（subscriptionモード）
- metadata に teacherId と plan_type を両方付与（webhook用）:
  metadata: { teacherId, plan_type: 'teacher_plan' }
  // 統一ルール: metadata のキー名は全て 'plan_type' に統一する
  // 講師プラン: metadata: { teacherId, plan_type: 'teacher_plan' }
  // Webhook側: session.metadata.plan_type で判定する
  // ⚠️ 'plan' と 'type' の混在は禁止。必ず 'plan_type' を使うこと
- success_url: /b2b/dashboard
- cancel_url: /b2b/pricing

- Stripe API呼び出しに idempotency key を付ける:
  stripe.checkout.sessions.create({...}, { idempotencyKey: `checkout_${teacherId}_${Date.now()}` })

既存のcheckout/route.tsのパターン（顧客ID取得→セッション作成）をそのまま踏襲してください。
```

---

### 1-6. Stripe Webhook（講師プラン用）

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/app/api/stripe/webhook/route.ts を読んで、
checkout.session.completed イベント処理に以下を追加してください。

session.metadata.teacherId が存在する場合（B2B講師プランの契約）:
- teachersテーブルを teacherId で UPDATE
  - subscription_status: 'active'
  - stripe_customer_id: session.customer
  - stripe_price_id: session.metadata.plan_type（'teacher_plan'）← 1-5でmetadataに付与済み
  - subscription_end: null（サブスクなので無期限）

既存のB2C処理と排他的に処理すること（teacherIdがあればB2B、なければB2C）。

注意: 1-5で metadata に plan_type を付与しているため、
session.metadata.plan_type は必ず 'teacher_plan' という文字列になります。
session.line_items から price_id を取得する方法は使わないこと（Webhookイベントには含まれない）。
// ⚠️ 'plan' と 'type' の混在は禁止。必ず 'plan_type' を使うこと
```

---

### 1-7. 生徒管理API

**Claude Codeへの指示:**
```
以下の3つのAPIルートを作成してください。
いずれも /Users/ryuki/Desktop/sakumon/src/app/api/b2b/students/ 配下。

// 共通型定義
type StudentListResponse = {
  students: Student[]
}

type StudentResponse = {
  student: Student
}

type CreateStudentRequest = {
  displayName: string
  grade?: string
}

type UpdateStudentRequest = {
  displayName?: string
  grade?: string
  currentPhase?: 1 | 2 | 3
}

1. route.ts（GET: 自分の生徒一覧 / POST: 生徒追加）
   GET レスポンス: StudentListResponse
   POST リクエスト body: CreateStudentRequest
   POST: 生徒を students に追加し、teacher_student_assignments も同時に INSERT。
         teacherId は auth から取得（bodyで受け取らない）

2. [studentId]/route.ts（GET: 生徒詳細 / PATCH: 更新 / DELETE: 削除）
   GET レスポンス: StudentResponse
   PATCH リクエスト body: UpdateStudentRequest
   PATCH: display_name, grade, current_phase を更新可能

認証は Supabase auth.getUser() で行い、
teachers テーブルから自分の teacher_id を取得してから操作してください。
自分の生徒でないリソースへのアクセスは403を返すこと。
```

---

### 1-8. 講師ダッシュボードUI

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/app/b2b/dashboard/page.tsx を作成してください。

表示内容:
- 自分の契約状態（無料 or 有料）
- 生徒一覧テーブル（名前・学年・現在のフェーズ・追加日）
- 生徒追加ボタン → モーダル（名前・学年入力）
- 未課金の場合: 「講師プランに登録」ボタン → /api/b2b/stripe/checkout へPOST

/Users/ryuki/Desktop/sakumon/src/app/home/page.tsx などの既存ページの
Tailwind CSSパターンを参考にしてください。
shadcn/ui が入っているか確認し、入っていればそれを使ってください。
```

---

### Phase 1 完了チェックリスト

```
□ STRIPE_B2B_TEACHER_PLAN_PRICE_ID を .env.local に追加した
□ 講師登録API（/api/b2b/teacher/register）が動く
□ 講師登録 → Stripe checkout → Webhook → subscription_status: 'active' の流れを確認した
□ Webhook の metadata.plan_type が 'teacher_plan' として正しく参照されている
□ 生徒追加・一覧表示が動く
□ /b2b/dashboard にアクセスできる
□ alertUtils.ts が作成されている
□ consentDialogVersions.ts が存在する
□ npm run build が通る
```

---

## Phase 2: B2B強化（教室プラン + SOP通知）

### 2-1. ZPD週次統計テーブルの確認とAPI作成

**Claude Codeへの指示:**
```
Phase 0 で作成した zpd_weekly_stats テーブルを使って、
ZPDスコアを記録しフェーズ遷移を判定するAPIを作成してください。

/Users/ryuki/Desktop/sakumon/src/app/api/b2b/students/[studentId]/zpd/route.ts

type ZpdUpdateRequest = {
  accuracy: number       // 正答率 0-1
  cvStability: number    // 反応時間変動係数（低いほど安定）
  errorPattern: number   // 系統的エラー率 0-1
  weekStart: string      // 週の開始月曜日（ISO date: 'YYYY-MM-DD'）
  weekEnd: string        // 週の終了日
  sessionCount?: number  // セッション数（省略時は 1）
}

type ZpdUpdateResponse = {
  zpd_score: number   // DBが計算したGENERATED ALWAYSの値
  current_phase: number
  transition_occurred: boolean
  transition_type?: string
}

処理手順:
1. 認証確認（自分の生徒かチェック）
2. pg_advisory_xact_lock でレースコンディション防止:
   await supabase.rpc('pg_advisory_xact_lock', { key: hashtext(studentId) })
   ※ RPC経由で実行すること（直接SQL実行は不可）
3. zpd_weekly_stats を UPSERT（week_start + student_id のUNIQUE制約で上書き）
   INSERT するカラム: student_id, teacher_id, week_start, week_end,
                      accuracy, cv_stability, error_pattern, phase, session_count
   ※ zpd_score はGENERATED ALWAYSのため INSERT対象に含めない
4. UPSERT後のレコードから zpd_score（DB計算済み）を取得する
5. ヒステリシス付きフェーズ遷移判定（設計書v22「フェーズ遷移システム」準拠）:
   ■ 連続3日以上の条件充足で遷移（単発の変動では遷移しない）
   ■ 遷移条件:
     - ZPDScore >= 0.75 かつ current_phase < 3 → フェーズアップ候補
     - ZPDScore < 0.45 かつ current_phase > 1 → ロールバック候補
   ■ 判定方法: 直近3日分の zpd_weekly_stats を取得し、全て条件を満たす場合のみ遷移
6. 遷移が発生した場合:
   - students.current_phase を UPDATE
   - phase_transition_logs に INSERT（transition_type は設計書v22のENUM 6値から選択）
7. ZpdUpdateResponse を返す

zpd_score の手動計算は絶対に禁止。DBのGENERATED ALWAYS値を使うこと。

/Users/ryuki/Desktop/mon-landing/B2Bアプリ設計_最終版_v22_94点.md の
「2. ZPD理論実装」「ヒステリシス付きフェーズ遷移」セクションも参照してください。
```

---

### 2-2. 教室プラン（Stripe metered billing）

**Claude Codeへの指示:**
```
教室プランの課金を実装してください。

1. /Users/ryuki/Desktop/sakumon/src/app/api/b2b/stripe/classroom-checkout/route.ts

type ClassroomCheckoutRequest = {
  teacherId: string
  email: string
  teacherCount: number
}

type ClassroomCheckoutResponse = {
  url: string
}

- body: ClassroomCheckoutRequest
- 基本¥9,800 + 追加講師¥1,500×(teacherCount-1) を計算
- Stripe subscription を作成（2つのsubscription_itemsを使用）
  item1: STRIPE_B2B_CLASSROOM_BASE_PRICE_ID（¥9,800、quantity: 1）
  item2: STRIPE_B2B_CLASSROOM_PER_TEACHER_PRICE_ID（¥1,500、quantity: teacherCount-1）
- metadata: { classroomId, plan_type: 'classroom_plan', teacherCount: String(teacherCount) }
  // 統一ルール: metadata のキー名は全て 'plan_type' に統一する
  // 教室プラン: metadata: { classroomId, plan_type: 'classroom_plan' }
  // Webhook側: session.metadata.plan_type で判定する
  // ⚠️ 'plan' と 'type' の混在は禁止。必ず 'plan_type' を使うこと
- Stripe API idempotency key必須:
  stripe.subscriptions.create({...}, { idempotencyKey: `classroom_${teacherId}_${Date.now()}` })

2. Webhookの checkout.session.completed に追加:
   session.metadata.plan_type === 'classroom_plan' の場合:
   - classrooms テーブルに INSERT
   - classroom_teachers に owner として INSERT

/Users/ryuki/Desktop/sakumon/src/app/api/b2b/stripe/checkout/route.ts を参考に実装してください。
```

---

### 2-3. エスカレーション通知Cron

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/app/api/notifications/escalate-assignments/route.ts を作成してください。

type EscalateResponse = {
  processed: number
  resentCount: number
}

処理:
1. Cron Secret認証（Authorization: Bearer {CRON_SECRET}）
2. teacher_sop_notifications で read_at IS NULL かつ sent_at < 24時間前 のレコードを取得
3. 各通知について escalation_resend_count < 3 なら再送信
   - escalation_resend_count を +1
   - resent_at を現在時刻に更新（カラム名: resent_at、escalation_resent_at ではない）
4. 処理結果を EscalateResponse で返す

/Users/ryuki/Desktop/sakumon/vercel.json が存在すれば確認してから、
以下を追加してください（既存のcrons配列に追記）:
{ "path": "/api/notifications/escalate-assignments", "schedule": "0 * * * *" }
```

---

### 2-4. Stripe 教師数同期Cron

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/app/api/admin/sync-stripe-teacher-count/route.ts を作成してください。

```typescript
type SyncStripeTeacherCountResponse = {
  synced: number      // 同期したClassroom数
  errors: string[]    // エラーが発生したclassroom_id一覧
}
```

処理（日次Cron: 毎日2時）:
1. Cron Secret認証
2. classroom_teachers の教師数を集計
3. Stripe の subscription_items を更新（metered billing の quantity を同期）
4. エラー時は sendSlackAlert で通知

/Users/ryuki/Desktop/sakumon/src/lib/alertUtils.ts の sendSlackAlert を使用してください。

vercel.json に追加:
{ "path": "/api/admin/sync-stripe-teacher-count", "schedule": "0 2 * * *" }
```

---

### Phase 2 完了チェックリスト

```
□ zpd_weekly_stats へのUPSERTでzpd_scoreがDB側で自動計算される（APIで手動計算していない）
□ ヒステリシス: 連続3日以上の条件充足でのみフェーズ遷移することを確認した
□ ZPDスコアを POST して current_phase が遷移する場合と遷移しない場合を確認した
□ 教室プランのStripe checkout が動く
□ STRIPE_B2B_CLASSROOM_BASE_PRICE_ID / STRIPE_B2B_CLASSROOM_PER_TEACHER_PRICE_ID を .env.local に追加した
□ escalate-assignments Cron が vercel.json に追加された
□ sync-stripe-teacher-count Cron が vercel.json に追加された
□ npm run build が通る
□ SAKUモンの zpd_score = GENERATED ALWAYS（DB自動計算）、EIGOモンの zpd_score = 通常FLOAT（API側INSERT）であることを両方確認
```

---

## Phase 3: 品質・法令対応

### 3-1. alertUtils.ts の確認（Phase 1 で作成済みのはず）

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/lib/alertUtils.ts が存在することを確認してください。
存在しない場合は Phase 1 の 1-2 に戻って作成してから続行してください。
```

---

### 3-2. 保護者同意システム

**Claude Codeへの指示:**
```
保護者同意のAPIを実装してください。
（teacher_consent_override_logs テーブルは Phase 0 で作成済み）

1. /Users/ryuki/Desktop/sakumon/src/app/api/b2b/students/[studentId]/consent/route.ts

type ConsentRequest = {
  status: 'granted' | 'override'
  confirmedText?: string  // override の場合は必須
}

type ConsentResponse = {
  student: Student
  overrideLogId?: string
}

処理:
- students.parental_consent_status を UPDATE
- override の場合のみ teacher_consent_override_logs に INSERT
  confirmed_text_version は CONSENT_DIALOG_VERSIONS の現行版（CURRENT_CONSENT_DIALOG_VERSION）を使う
  ※ /Users/ryuki/Desktop/sakumon/src/lib/consentDialogVersions.ts を import すること

2. student_id別ソフトウォーニング抑制（設計書v22「5. エスカレーション・SOP設計」準拠）:
   suppressionKey: 'consent_override_warned_{studentId}' を sessionStorage に保存し、
   ページリロードでリセットされる設計にすること（フロントエンド側の実装）

/Users/ryuki/Desktop/sakumon/src/lib/consentDialogVersions.ts が
存在することを確認してから実装してください（存在しない場合は Phase 1 の 1-3 で作成）。
```

---

### 3-3. SDTメッセージ送信 + EncouragementMessageDialog UI

**Claude Codeへの指示:**
```
⚠️ 事前に以下のファイルが存在することを確認すること:
- src/lib/phaseRollbackSop.ts（ENCOURAGEMENT_MESSAGE_SDT_FRAMEWORK を export）
存在しない場合は以下の内容で新規作成してから 3-3 の実装を進めること:
設計書v22の「SDTフレームワーク定義」セクションの内容を完全に転記すること。

SDTメッセージシステムを実装してください。
（encouragement_message_logs テーブルは Phase 0 で作成済み）

1. /Users/ryuki/Desktop/sakumon/src/app/api/b2b/students/[studentId]/encouragement/route.ts

type EncouragementRequest = {
  sdtCategory: 'autonomy' | 'competence' | 'relatedness'
  exampleIndex: number  // 0, 1, 2
  messageContent: string
  prohibitedPatternOverridden?: boolean
}

type EncouragementResponse = {
  logId: string
  sentAt: string
}

処理:
- encouragement_message_logs に INSERT
- 成功時: EncouragementResponse を返す

2. EncouragementMessageDialog コンポーネント（shadcn/ui AlertDialog使用）
   /Users/ryuki/Desktop/sakumon/src/components/b2b/EncouragementMessageDialog.tsx を作成:

   設計書v22「3. SDTメッセージUIフロー」準拠の4ステップフロー:

   Step 1: カテゴリ選択（autonomy / competence / relatedness）
     - RadioGroup + tooltip でカテゴリを選択
     - tooltipTemplate を各RadioItemに表示
       例（autonomy）: '自律性: {student_name}さんが自分で選べる選択肢を提示してみましょう'

   Step 2: 例文選択または自由記述
     - Select コンポーネントで例文（exampleIndex 0,1,2）を選択
     - または Textarea で自由記述（maxLength: 200）

   Step 3: プレビュー確認
     - Preview card にメッセージ内容を表示

   Step 4: 送信確認
     - AlertDialog（shadcn/ui）を使用
     - aria-labelledby と aria-describedby を必ず付ける

   Back navigation:
     - 全ステップ間で戻り可能（Step 4 → 3 → 2 → 1）
     - React state で入力内容を保持
     - 離脱時（Esc / 閉じるボタン）は confirmダイアログを表示

   Backdrop / Esc 制御:
     - backdrop click 無効化（onInteractOutside で e.preventDefault()）
     - Esc キーは入力有無で分岐（入力がある場合は confirm、ない場合はそのまま閉じる）

/Users/ryuki/Desktop/sakumon/src/lib/phaseRollbackSop.ts の
ENCOURAGEMENT_MESSAGE_SDT_FRAMEWORK を参照して例文をUIに表示してください。
```

---

### 3-4. EU AI Act 月次サンプリングCron

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/app/api/admin/sample-ai-review/route.ts を作成してください。

type SampleAiReviewResponse = {
  sampledCount: number
  insertedCount: number
}

処理:
1. Cron Secret認証
2. 直近30日の encouragement_message_logs から全体の5%をランダムサンプリング
3. サンプル結果を ai_review_samples テーブルに INSERT
   （まずテーブルを migration で作成: id, sampled_log_id, sampled_at, reviewed_by, reviewed_at）
4. sendAdminAlert で「月次AIレビューサンプルを抽出しました。件数: XX件」を送信

/Users/ryuki/Desktop/sakumon/src/lib/alertUtils.ts の sendAdminAlert を使用してください。

vercel.json に追加:
{ "path": "/api/admin/sample-ai-review", "schedule": "0 8 1 * *" }
```

---

### 3-5. AI審査員資格リマインダーCron

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/app/api/admin/remind-ai-reviewer-certification/route.ts を作成してください。
（設計書v22「7. EU AI Act Art.14」準拠）

type ReminderResponse = {
  sent: boolean
  month: string
}

処理（月15日Cron）:
1. Cron Secret認証
2. 当月の ai_review_samples で reviewed_at IS NULL のサンプルを集計
3. レビュー未完了数が1件以上の場合、sendAdminAlert で資格更新リマインダーを送信
   subject: '【月次リマインダー】AI審査員レビューが未完了です'
4. ReminderResponse を返す

vercel.json に追加:
{ "path": "/api/admin/remind-ai-reviewer-certification", "schedule": "0 9 15 * *" }
```

---

### 3-6. 同意配信確認Cron

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/app/api/admin/check-ab-consent-delivery/route.ts を作成してください。

処理（週次Cron: 毎週月曜10時）:
1. Cron Secret認証
2. teacher_sop_notifications で sent_at から7日以上経過し read_at IS NULL のレコードを集計
3. 件数が閾値超えの場合 sendSlackAlert で通知

vercel.json に追加:
{ "path": "/api/admin/check-ab-consent-delivery", "schedule": "0 10 * * 1" }
```

---

### 3-7. 紹介プログラム

**Claude Codeへの指示:**
```
紹介報酬の月次処理Cronを実装してください。
（referral_logs テーブルは Phase 0 で作成済み）

/Users/ryuki/Desktop/sakumon/src/app/api/referral/process-rewards/route.ts を確認し、
存在しない場合は新規作成してください。

type ProcessRewardsResponse = {
  newReferrals: number
  rewardsGranted: number
  prorataAlertSent: boolean
}

処理（月次Cron: 毎月1日 3時）:
1. Cron Secret認証
2. 前月に referred_by を通じて新規契約（subscription_status: 'active'）になった教師を検索
3. referral_logs に紹介ログを INSERT
4. 紹介元の teacher に Stripe クレジットを付与（idempotency key 必須）
⚠️ CONCURRENT REFRESHの前提条件:
REFRESH MATERIALIZED VIEW CONCURRENTLY を使うには、対象MVに一意インデックスが必要です。
Phase 0で `CREATE UNIQUE INDEX idx_referral_yearly_stats_unique ON referral_yearly_stats(teacher_id, year)`
が作成されていることを確認してから実行してください。
存在しない場合は先にインデックスを作成すること。

5. referral_yearly_stats MV の集計を確認:
   - REFRESH MATERIALIZED VIEW CONCURRENTLY referral_yearly_stats を実行
   - log_mv_refresh_result RPC を呼び出して結果を記録
   - 年換算6件超の教師割合が10%以上（highUsersRate >= 0.10）なら
     sendAdminAlert で「【要検討】紹介報酬プロラタ導入の再検討条件に到達」を送信

vercel.json に追加:
{ "path": "/api/referral/process-rewards", "schedule": "0 3 1 * *" }
```

---

### Phase 3 完了チェックリスト

```
□ alertUtils.ts が存在し、sendSlackAlert / sendAdminAlert が動く
□ 保護者同意をrecordしてDBに保存できる
□ consentDialogVersions.ts の CURRENT_CONSENT_DIALOG_VERSION が正しく参照されている
□ SDTメッセージ送信ログが encouragement_message_logs に記録される
□ EncouragementMessageDialog の4ステップフローが動く（Back navigation含む）
□ sample-ai-review Cronが動く（月1日 8時）
□ remind-ai-reviewer-certification Cronが動く（月15日 9時）
□ check-ab-consent-delivery Cronが動く（毎週月曜10時）
□ 紹介コード経由の登録が referral_logs に記録される
□ referral_yearly_stats MV のリフレッシュが動く
□ vercel.json の Cron一覧が正しい（11本以内）
□ npm run build が通る
```

---

## Phase 4: スケール対応

### 4-1. データ匿名化Cron（週次）

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/app/api/admin/anonymize/route.ts を作成してください。

type AnonymizeResponse = {
  anonymizedCount: number
}

処理（週次Cron: 毎週日曜3時）:
1. Cron Secret認証
2. 30日以上前 かつ teacher に紐づかなくなった（teacher_idがNULL or teacherが退会済み）の
   students レコードについて:
   - display_name を '匿名ユーザー' に更新
   - grade を NULL に更新
3. 処理件数を AnonymizeResponse で返す

vercel.json に追加:
{ "path": "/api/admin/anonymize", "schedule": "0 3 * * 0" }
```

---

### 4-2. 先行匿名化Cron（年次）

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/app/api/admin/anonymize-preemptive/route.ts を作成してください。
（設計書v22「7. GDPR・個人情報保護法」の先行匿名化対応）

type AnonymizePreemptiveResponse = {
  anonymizedCount: number
  executedAt: string
}

処理（年次Cron: 3月25日 2時）:
1. Cron Secret認証
2. 年度末前に先行して個人データを匿名化:
   - 当年3月1日以前に退会または割り当て解除された students レコードを匿名化
   - display_name を '匿名ユーザー' に更新
   - grade を NULL に更新
3. AnonymizePreemptiveResponse を返す

vercel.json に追加:
{ "path": "/api/admin/anonymize-preemptive", "schedule": "0 2 25 3 *" }
```

---

### 4-3. ZPDロールバック監視Cron

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/app/api/admin/check-zpd-rollback-triggers/route.ts を作成してください。

type RollbackCheckResponse = {
  suspendedStudents: number
  notificationsSent: number
}

処理（週次Cron: 毎週日曜0時）:
1. Cron Secret認証
2. 直近30日以内に phase_transition_logs でロールバック（phase2_to_1 or phase3_to_2）が
   3回以上発生している student を検索（設計書v22「ロールバック頻度ガード」準拠）
3. 該当studentの teacher_id を取得し、teacher_sop_notifications に INSERT:
   - notification_type: 'rollback_alert'
   - message: 'ダッシュボードURL: /b2b/students/{studentId} で詳細を確認してください'
4. zpd_suspension_logs に記録:
   - student_id, suspended_at, triggered_by: 'auto_cron'
   - skip_reason: null（自動停止のため）
5. pg_advisory_xact_lock でレースコンディション防止（同一Cronの多重実行対策）
6. RollbackCheckResponse を返す

vercel.json に追加:
{ "path": "/api/admin/check-zpd-rollback-triggers", "schedule": "0 0 * * 0" }
```

---

### 4-4. ロールバックガード: resumeChecklistUI

**Claude Codeへの指示:**
```
ZPDアルゴリズム停止を解除する際のチェックリストUIを実装してください。
（設計書v22「ロールバック頻度ガード」resumeChecklist 準拠）

/Users/ryuki/Desktop/sakumon/src/components/b2b/ZpdResumeChecklistDialog.tsx を作成:

チェックリスト（3項目）:
const RESUME_CHECKLIST = [
  { id: 1, label: '直近30日のロールバック原因を確認した', required: true },
  {
    id: 2,
    label: '保護者または生徒本人に確認した',
    required: false,
    skipReasonField: {
      required_if_skipped: true,
      loggedIn: 'zpd_suspension_logs',  // スキップ理由をこのテーブルに記録
    },
  },
  { id: 3, label: '今後の学習計画を調整した', required: true },
]

UI要件:
- required: true の項目はチェックしないと「再開」ボタンが活性化しない
- required: false の項目（id: 2）をスキップする場合は skipReason テキストエリアが出現
- skipReason の内容を zpd_suspension_logs の skip_reason カラムに保存する
- 「再開」ボタン押下 → /api/b2b/students/[studentId]/zpd-resume APIを呼び出す

/Users/ryuki/Desktop/sakumon/src/app/api/b2b/students/[studentId]/zpd-resume/route.ts も作成:

type ZpdResumeRequest = {
  checklistCompleted: boolean[]  // 3項目それぞれの完了状態
  skipReasonForItem2?: string    // id:2 をスキップした場合の理由
}

type ZpdResumeResponse = {
  resumed: boolean
  suspensionLogId: string
}

処理:
- required項目が全てチェックされていることをサーバー側でも検証
- zpd_suspension_logs の resumed_at を更新
- skip_reason を保存（skipReasonForItem2 がある場合）
```

---

### 4-5. 失敗Stripe報酬リトライCron

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/app/api/admin/retry-failed-stripe-rewards/route.ts を作成してください。

処理（週次Cron: 毎週月曜4時）:
1. Cron Secret認証
2. referral_logs で stripe_credit_status = 'failed' のレコードを取得
3. Stripe クレジット付与を再試行（idempotency key: referral_log_id ベース）
4. 成功時: stripe_credit_status を 'success' に更新
5. 失敗時: sendSlackAlert で通知

vercel.json に追加:
{ "path": "/api/admin/retry-failed-stripe-rewards", "schedule": "0 4 * * 1" }
```

---

### 4-6. 紹介報酬上限リセットCron（年次）

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/src/app/api/admin/reset-referral-limits/route.ts を作成してください。

処理（年次Cron: 1月1日 0時）:
1. Cron Secret認証
2. 全教師の年間紹介報酬カウンターをリセット（設計書v22「6. 紹介プログラム」準拠）
3. sendAdminAlert で「年間紹介報酬上限をリセットしました」を通知

vercel.json に追加:
{ "path": "/api/admin/reset-referral-limits", "schedule": "0 0 1 1 *" }
```

---

### 4-7. vercel.json の最終確認

**Claude Codeへの指示:**
```
/Users/ryuki/Desktop/sakumon/vercel.json を確認し、
設計書v22「8. Vercel Cronジョブ（11本）」に合わせて完全な状態にしてください。

最終的な vercel.json の crons 配列（11本、上限20本に対して余裕あり）:
[
  { "path": "/api/admin/sync-stripe-teacher-count",        "schedule": "0 2 * * *"   },
  { "path": "/api/notifications/escalate-assignments",     "schedule": "0 * * * *"   },
  { "path": "/api/admin/check-ab-consent-delivery",        "schedule": "0 10 * * 1"  },
  { "path": "/api/referral/process-rewards",               "schedule": "0 3 1 * *"   },
  { "path": "/api/admin/sample-ai-review",                 "schedule": "0 8 1 * *"   },
  { "path": "/api/admin/anonymize",                        "schedule": "0 3 * * 0"   },
  { "path": "/api/admin/remind-ai-reviewer-certification", "schedule": "0 9 15 * *"  },
  { "path": "/api/admin/retry-failed-stripe-rewards",      "schedule": "0 4 * * 1"   },
  { "path": "/api/admin/reset-referral-limits",            "schedule": "0 0 1 1 *"   },
  { "path": "/api/admin/anonymize-preemptive",             "schedule": "0 2 25 3 *"  },
  { "path": "/api/admin/check-zpd-rollback-triggers",      "schedule": "0 0 * * 0"   }
]

全エンドポイントで Vercel Cron Secret認証（Authorization: Bearer {CRON_SECRET}）が
実装されていることを確認してください。
```

---

### Phase 4 完了チェックリスト

```
□ 匿名化Cron（週次）が動く
□ 先行匿名化Cron（年次・3月25日）がvercel.jsonに設定されている
□ ロールバック検知アラートが teacher_sop_notifications に記録される
□ ZpdResumeChecklistDialog の3項目チェックが動く
□ required項目の未チェックで「再開」ボタンが非活性になる
□ id:2 スキップ時に skipReason が zpd_suspension_logs に記録される
□ retry-failed-stripe-rewards Cronが動く
□ reset-referral-limits Cronが動く
□ vercel.json の全Cronが正確に11本設定されている
□ 全テーブルのRLS設定を最終確認した（Supabase > Authentication > Policies）
□ npm run build が通る（型エラーゼロ）
□ ロードテスト実施: escalationCronLoad p95 < 45秒・エラーレート < 1%
□ zpdDashboardLoad p95 < 45秒・エラーレート < 1%
□ preProductionGate: 全E2Eテスト通過・セキュリティスキャン完了・EU AI Actチェックリスト確認
□ VACUUM ANALYZE（月次）・REINDEX CONCURRENTLY（四半期）の定期メンテナンス手順を確認
```

---

## 環境変数チェックリスト

`.env.local` に追加が必要なもの：

```bash
# B2B Stripe Price IDs（Stripeダッシュボードで作成してから追加）
STRIPE_B2B_TEACHER_PLAN_PRICE_ID=price_xxx
STRIPE_B2B_CLASSROOM_BASE_PRICE_ID=price_xxx
STRIPE_B2B_CLASSROOM_PER_TEACHER_PRICE_ID=price_xxx

# Cron認証
CRON_SECRET=your_random_secret_here

# アラート
SLACK_ALERT_WEBHOOK_URL=https://hooks.slack.com/xxx  # 任意（未設定時はconsole.warnでフォールバック）
ADMIN_EMAIL=your@email.com
```

---

## よくある詰まりポイントと対処法

| 詰まりポイント | 対処法 |
|---|---|
| RLSでデータが取れない | `createClient(url, SERVICE_ROLE_KEY)` をサーバーサイドで使う |
| Stripe webhookが届かない | `stripe listen --forward-to localhost:3000/api/stripe/webhook` でローカルtest |
| マイグレーションエラー | Supabase Dashboard > SQL Editor で直接実行してエラーを確認 |
| Cron Secretが動かない | Vercel環境変数に `CRON_SECRET` を追加、ローカルは `.env.local` |
| 型エラー | `supabase.ts` の型定義が古い場合は `supabase gen types` で再生成 |
| zpd_score を INSERT しようとしてエラー | GENERATED ALWAYS カラムは INSERT 対象から除外する。⚠️ EIGOモンの場合のみ例外: zpd_scoreは通常のFLOATカラムのためINSERTして良い。SAKUモン（GENERATED ALWAYS）とEIGOモン（通常FLOAT）で動作が異なる。 |
| MV REFRESH が失敗する | CONCURRENT REFRESH には一意インデックスが必要（Phase 0 で作成済みか確認） |
| teacher_sop_notifications のカラム名エラー | resent_at / bounce_log を使う（escalation_ プレフィックスなし） |

---

## フェーズ別開始テンプレート

> こちらが実際のコピペ用テンプレートです（冒頭の共通前提より優先）。

### Phase 0 開始時
```
以下のファイルを読んでから実装を開始してください：
- /Users/ryuki/Desktop/mon-landing/B2B実装指示書_ClaudeCode用.md の「Phase 0」セクション
- /Users/ryuki/Desktop/mon-landing/B2Bアプリ設計_最終版_v22_94点.md の全DBスキーマ定義
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts

実装指示書の「禁止事項・アンチパターン」を先に読んでください。
Phase 0（DBマイグレーション）から始めてください。
```

### Phase 1 〜 4 開始時
```
Phase {X} を開始します。
以下のファイルを読んでから実装を開始してください：
- /Users/ryuki/Desktop/mon-landing/B2B実装指示書_ClaudeCode用.md の「Phase {X}」セクション
- /Users/ryuki/Desktop/mon-landing/B2Bアプリ設計_最終版_v22_94点.md（設計の正典）
- /Users/ryuki/Desktop/sakumon/src/lib/supabase.ts
- /Users/ryuki/Desktop/sakumon/src/app/api/b2b/（既存のB2B実装を確認してから始める）

実装指示書の「禁止事項・アンチパターン」を先に読んでください。
```

---

## EIGOモン差分セクション

> **前提: SAKUモンのPhase 0〜4が完成してからEIGOモンに着手してください。**
> SAKUモンの実装を参考にしながら、このセクションの差分だけを変えます。

### EIGOモン実装開始時のClaude Codeへの指示

```
以下のファイルを読んでから実装してください：
- /Users/ryuki/Desktop/mon-landing/B2B実装指示書_ClaudeCode用.md の「EIGOモン差分セクション」
- /Users/ryuki/Desktop/mon-landing/B2Bアプリ設計_最終版_v22_94点.md
- /Users/ryuki/Desktop/eigomon/src/lib/supabase.ts（EIGOモンの既存型定義）
- /Users/ryuki/Desktop/eigomon/src/lib/score.ts（スコア計算式、モード別重みの参考）
- /Users/ryuki/Desktop/eigomon/src/app/api/stripe/checkout/route.ts（既存の課金パターン）
- /Users/ryuki/Desktop/sakumon/src/app/api/b2b/（SAKUモンの完成済みB2B実装を参考に）
- /Users/ryuki/Desktop/eigomon/src/lib/zpdWeights.ts  ← EIGOモンのZPD重み定義（存在しない場合は先に作成）

実装指示書の「禁止事項・アンチパターン」を先に読んでください。
SAKUモンと同じパターンで実装しますが、このセクションに記載された差分箇所を必ず変えてください。
```

---

### E-1. DBマイグレーション（SAKUモンと共通、そのまま流用）

```
// EIGOモンのmigrationも設計書v22を正典とする。
// SAKUモンの実装は「既存コードの参考」として読むが、スキーマ定義は設計書v22のみに従う。
// EIGOモン用migrationファイル: /Users/ryuki/Desktop/eigomon/migrations/0001_b2b_base.sql

/Users/ryuki/Desktop/eigomon/migrations/0001_b2b_base.sql を作成してください。

テーブル構造はSAKUモンと完全に同じです。
EIGOモンのSupabaseプロジェクトに対して実行します。

設計書v22が唯一の正典であることに変わりはありません。
```

---

### E-2. ZPDスコア計算（差分あり：モード別重み）

EIGOモンはSAKUモンと異なり、6つの試験モードがあります（`score.ts`で確認済み）。
ZPD計算式をモード別に変える必要があります。

```
/Users/ryuki/Desktop/eigomon/src/lib/zpdWeights.ts を新規作成してください。

以下の内容で作成：

export const ZPD_MODE_WEIGHTS: Record<string, {
  accuracy: number
  cv_stability: number
  error_pattern: number
}> = {
  // TOEIC: 選択問題中心（q4/q5の記述なし）→ 正答率の比重を上げる
  toeic:      { accuracy: 0.7, cv_stability: 0.1, error_pattern: 0.2 },

  // 英検: 記述あり → SAKUモンと同じバランス
  eiken:      { accuracy: 0.5, cv_stability: 0.2, error_pattern: 0.3 },

  // 標準読解: SAKUモンと同じ
  standard:   { accuracy: 0.5, cv_stability: 0.2, error_pattern: 0.3 },

  // 大学入試: SAKUモンと同じ
  university: { accuracy: 0.5, cv_stability: 0.2, error_pattern: 0.3 },

  // 語彙: 反応速度（CV）が習熟度の主指標
  vocab:      { accuracy: 0.6, cv_stability: 0.3, error_pattern: 0.1 },

  // 文法: 正確さが最重要
  grammar:    { accuracy: 0.6, cv_stability: 0.2, error_pattern: 0.2 },
}

export function calcZpdScore(
  accuracy: number,
  cvStability: number,
  errorPattern: number,
  examMode: string
): number {
  const weights = ZPD_MODE_WEIGHTS[examMode] ?? ZPD_MODE_WEIGHTS.standard
  return accuracy * weights.accuracy
    + cvStability * weights.cv_stability
    + errorPattern * weights.error_pattern
}

// 根拠:
// - toeic: score.ts の MODE_SEL_WEIGHT.toeic = 1.0（選択のみ）に準拠
// - vocab: 語彙習熟はNewell & Rosenbloom(1981)のPower law通り反応速度で測る
// - eiken/standard/university: ACT理論準拠（SAKUモンと同等）
```

ZPDスコア更新APIでは、このcalcZpdScore関数を使い、
bodyに `examMode: string` を追加で受け取るようにしてください。

⚠️ EIGOモンのZPDスコアについて:
EIGOモンでは試験モードによって重みが変わるため、SAKUモンと同じ GENERATED ALWAYS AS 固定式は使えない。
EIGOモン用の解決策:
1. DBカラムは GENERATED ALWAYS AS を使わず、通常の FLOAT カラムとして定義する
2. API側で calcZpdScore(mode, accuracy, cv_stability, error_pattern) を呼び、計算結果をINSERTする
3. SAKUモンの zpd_score = GENERATED ALWAYS AS という禁止事項はEIGOモンには適用しない
// この点のみSAKUモンとEIGOモンで実装が異なる（設計書v22 EIGOモン差分セクション参照）

---

### E-3. 教師ダッシュボード（差分あり：モード別表示）

⚠️ recharts を使用します。EIGOモンプロジェクトにインストールされているか確認:
cd /Users/ryuki/Desktop/eigomon && npm list recharts
インストールされていない場合: npm install recharts

SAKUモンのダッシュボードは「読解フェーズ」だけ表示しますが、
EIGOモンは **モード別のスコア推移** を表示する必要があります。

```
/Users/ryuki/Desktop/eigomon/src/app/b2b/dashboard/page.tsx を作成してください。

SAKUモン（/Users/ryuki/Desktop/sakumon/src/app/b2b/dashboard/page.tsx）を参考にしつつ、
生徒テーブルに以下のカラムを追加してください：

| 名前 | 学年 | フェーズ | 主な受験モード | 直近スコア | 追加日 |

「主な受験モード」は students テーブルに exam_mode カラムを追加して管理します。
exam_mode: 'standard' | 'toeic' | 'eiken' | 'university' | 'vocab' | 'grammar'

また生徒詳細ページ（/b2b/students/[studentId]）では
モード別の過去5回スコア推移グラフを表示してください（recharts使用）。
```

EIGOモン用の students テーブルマイグレーション追加分：

// EIGOモン専用カラムの追加は別ファイルに分離する:
// ファイルパス: /Users/ryuki/Desktop/eigomon/migrations/0002_eigomon_b2b_columns.sql
// SAKUモンのmigrationと混ぜないこと

```sql
-- EIGOモン専用カラム（Phase 0 のマイグレーション後に追加）
-- ファイル: /Users/ryuki/Desktop/eigomon/migrations/0002_eigomon_b2b_columns.sql
ALTER TABLE students ADD COLUMN exam_mode text DEFAULT 'standard'
  CHECK (exam_mode IN ('standard','toeic','eiken','university','vocab','grammar'));
ALTER TABLE students ADD COLUMN target_exam text;  -- '英検2級'、'TOEIC700点' など自由入力
```

---

### E-4. SDTメッセージ例文（差分あり：英語学習向け）

```
/Users/ryuki/Desktop/eigomon/src/lib/phaseRollbackSop.ts を新規作成してください。

/Users/ryuki/Desktop/sakumon/src/lib/phaseRollbackSop.ts の
ENCOURAGEMENT_MESSAGE_SDT_FRAMEWORK をベースに、
messageCategories の examples と tooltipTemplate を以下に差し替えてください：

autonomy.examples: [
  '今日はTOEICとスタンダード、どっちをやる？自分で決めていいよ。',
  '苦手な文法か、得意な読解か、今日は好きな方から始めよう。',
  '今週何回やるか、自分でペース決めてみて。',
],
autonomy.tooltipTemplate: '自律性: {student_name}さんが選べる選択肢（モードや問題数）を提示しましょう',

competence.examples: [
  '{exam_mode}で{score}点！前回より{improvement}点アップ！',
  '英検{grade}級の合格ライン、あと{gap}点のところまで来てる。',
  '連続{streak}日続けてる。語彙力が確実についてきてるね。',
],
competence.tooltipTemplate: '有能感: {student_name}さんの{exam_mode}スコア（{score}点）を具体的に伝えましょう',

relatedness.examples: [
  '先生はいつも{student_name}さんの{exam_mode}の伸びを見てるよ。',
  '{target_exam}合格、一緒に目指そう。',
  'わからない単語や文法があればいつでも聞いて。',
],
relatedness.tooltipTemplate: '関係性: {student_name}さんの目標（{target_exam}）に寄り添う言葉を選びましょう',

その他の定数（PHASE_ROLLBACK_SOP、SOP_ESCALATION_POLICYなど）は
SAKUモンのファイルをそのままコピーして使用してください。
```

---

### E-5. Stripe Price ID（差分あり：別プロジェクト）

EIGOモンはSAKUモンとは**別のStripeプロダクト**として作成してください。

```
/Users/ryuki/Desktop/eigomon/.env.local に以下を追加：

STRIPE_B2B_TEACHER_PLAN_PRICE_ID=price_xxx   # EIGOモン用に別途Stripeで作成
STRIPE_B2B_CLASSROOM_BASE_PRICE_ID=price_xxx
STRIPE_B2B_CLASSROOM_PER_TEACHER_PRICE_ID=price_xxx
CRON_SECRET=your_random_secret_here
ADMIN_EMAIL=your@email.com
SLACK_ALERT_WEBHOOK_URL=https://hooks.slack.com/xxx  # SAKUモンと同じチャンネルでOK
```

Stripeダッシュボードでは「MON B2B - EIGO」として別プロダクトを作成し、
SAKUモンと同じ価格設定（¥1,980/¥9,800/¥1,500）で Price を作成してください。

---

### E-6. vercel.json（差分なし：同じCron構成）

```
/Users/ryuki/Desktop/sakumon/vercel.json と同じCron構成（11本）を
/Users/ryuki/Desktop/eigomon/vercel.json にコピーしてください。

エンドポイントパスはSAKUモンと同一なので変更不要です。
設計書v22「8. Vercel Cronジョブ（11本）」と一致していることを確認してください。
```

---

### EIGOモン実装チェックリスト

```
□ SAKUモンのPhase 0〜4が完成している（前提）
□ /Users/ryuki/Desktop/eigomon/migrations/ にマイグレーションを実行した
□ zpdWeights.ts を作成し、calcZpdScore がモード別に正しく動く
□ EIGOモンの zpd_score は通常のFLOATカラムであることを確認（GENERATED ALWAYSではない）
□ EIGOモンのZPD計算はAPI側（calcZpdScore）で実施し、DBにINSERTしていることを確認
□ students テーブルに exam_mode / target_exam カラムが追加された
□ 教師ダッシュボードにモード別スコア表示が出る
□ SDTメッセージ例文が英語学習向けになっている
□ EncouragementMessageDialog の4ステップフローが動く
□ EIGOモン用のStripe Price IDを .env.local に追加した
□ vercel.json にCronが11本設定されている
□ 全テーブルのRLSがEIGOモンのSupabaseプロジェクトに適用されている
□ npm run build が通る（型エラーゼロ）
```
