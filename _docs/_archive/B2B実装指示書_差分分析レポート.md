# B2B実装指示書 差分分析レポート

作成日: 2026-04-01
分析対象:
- 正典（設計書）: `B2Bアプリ設計_最終版_v22_94点.md`
- 評価対象: `B2B実装指示書_ClaudeCode用.md`
- 参考: `B2B戦略書_v3_100点_完全版.md`

---

## セクション A: DBスキーマ差分

### A-1. テーブル数の差分

| 項目 | 設計書（v22） | 実装指示書 | 差分 |
|---|---|---|---|
| テーブル総数 | **38テーブル**（全RLS済み） | **10テーブル**（Phase 1〜4合計） | **28テーブル欠落** |

### A-2. 各テーブルの詳細差分

#### `teachers` テーブル

| カラム | 設計書 | 実装指示書 | 差分 |
|---|---|---|---|
| `id` | uuid PK | uuid PK | 一致 |
| `user_id` | uuid NOT NULL | uuid NOT NULL | 一致 |
| `display_name` | text NOT NULL | text NOT NULL | 一致 |
| `stripe_customer_id` | text | text | 一致 |
| `subscription_status` | text DEFAULT 'free' | text DEFAULT 'free' | 一致 |
| `subscription_end` | timestamptz | timestamptz | 一致 |
| `stripe_price_id` | text | text | 一致 |
| `referral_code` | text UNIQUE | text UNIQUE | 一致 |
| `referred_by` | text REFERENCES teachers(referral_code) | text REFERENCES teachers(referral_code) | 一致 |
| `created_at` | timestamptz DEFAULT now() | timestamptz DEFAULT now() | 一致 |
| **referral_count** | 設計書から `referral_yearly_stats` MV で集計 | **カラムなし（MVも未作成）** | **欠落** |
| **plan_type** | 'teacher' \| 'classroom' の区分が暗黙的に必要 | **明示的なカラムなし** | **欠落（設計書も暗黙だが型が未定）** |

#### `students` テーブル

| カラム | 設計書 | 実装指示書 | 差分 |
|---|---|---|---|
| `id` | uuid PK | uuid PK | 一致 |
| `teacher_id` | uuid NOT NULL | uuid NOT NULL | 一致 |
| `display_name` | text NOT NULL | text NOT NULL | 一致 |
| `grade` | 記載なし | text | 設計書側に定義なし |
| `parental_consent_status` | 暗黙（consent_override_logsで管理） | text DEFAULT 'pending' | **実装指示書が先行定義（設計書未記載）** |
| `current_phase` | int（Phase1/2/3） | int DEFAULT 1 | 一致 |
| `created_at` | timestamptz | timestamptz | 一致 |
| **exam_mode** | 設計書に記載なし | EIGOモン専用で追加（ALTER TABLE） | 実装指示書がEIGO固有差分として扱う |
| **target_exam** | 設計書に記載なし | EIGOモン専用で追加 | 同上 |

#### `classrooms` テーブル

| カラム | 設計書 | 実装指示書 | 差分 |
|---|---|---|---|
| `id` | uuid PK | uuid PK | 一致 |
| `owner_teacher_id` | uuid NOT NULL | uuid NOT NULL | 一致 |
| `name` | text NOT NULL | text NOT NULL | 一致 |
| `stripe_subscription_id` | text | text | 一致 |
| `subscription_status` | text | text DEFAULT 'active' | 実装指示書のDEFAULT値が不適切（新規作成時点ではまだ'pending'にすべき） |
| `base_price` | int | int DEFAULT 9800 | 一致 |
| `created_at` | timestamptz | timestamptz | 一致 |
| **per_teacher_price** | ¥1,500/追加講師（設計書に明記） | **カラムなし**（ハードコード） | **欠落** |
| **additional_teacher_count** | 設計書のmetered billing要件 | **カラムなし** | **欠落** |

#### `teacher_consent_override_logs` テーブル

| カラム | 設計書 | 実装指示書（3-1で定義） | 差分 |
|---|---|---|---|
| `id` | uuid PK | id（型定義なし） | **型定義が曖昧** |
| `teacher_id` | uuid NOT NULL | teacher_id（型定義なし） | **型定義が曖昧** |
| `student_id` | uuid NOT NULL | student_id（型定義なし） | **型定義が曖昧** |
| `confirmed_text` | text | confirmed_text | 一致 |
| `confirmed_text_version` | TEXT DEFAULT 'v1.0'（**GDPR法的証明用**） | DEFAULT 'v1.0' | 一致（根拠説明なし） |
| `override_at` | timestamptz | override_at timestamptz DEFAULT now() | 一致 |
| **override_reason** | NOT NULL, CHECK(char_length >= 10)（EU AI Act Art.13） | **カラムなし** | **重大欠落** |

#### `encouragement_message_logs` テーブル

| カラム | 設計書 | 実装指示書（3-2で定義） | 差分 |
|---|---|---|---|
| `id` | uuid PK | id | 一致 |
| `teacher_id` | uuid | teacher_id | 一致 |
| `student_id` | uuid | student_id | 一致 |
| `sdt_category` | autonomy/competence/relatedness | sdt_category | 一致 |
| `example_index` | int（0,1,2） | example_index int（0,1,2） | 一致 |
| `message_content` | text | message_content text | 一致 |
| `sent_at` | timestamptz | sent_at timestamptz DEFAULT now() | 一致 |
| `prohibited_pattern_overridden` | boolean | boolean DEFAULT false | 一致 |
| **ab_test_group** | SDT A/Bテスト設計（rotationStrategy等）が設計書に詳述 | **カラムなし** | **A/Bテスト実装が欠落** |
| **washout_period_end** | 7日ウォッシュアウト期間（Lally et al.2010） | **カラムなし** | **欠落** |

#### `teacher_sop_notifications` テーブル

| カラム | 設計書 | 実装指示書（2-1で定義） | 差分 |
|---|---|---|---|
| `read_at` | timestamptz | timestamptz | 一致 |
| `resent_at` | resent_at（設計書の記述） | `escalation_resent_at` | **カラム名不一致** |
| `bounce_log` | bounce_log付き | `escalation_bounce_log: jsonb` | 名称差異（設計書: `bounce_log`、実装指示書: `escalation_bounce_log`） |
| **resend_count** | 設計書に24h未既読で自動再送（3回上限は実装指示書で定義） | `escalation_resend_count int DEFAULT 0` | 実装指示書で補完 |

#### `zpd_suspension_logs` テーブル

| カラム | 設計書 | 実装指示書（4-3で「未作成なら migration で作成」） | 差分 |
|---|---|---|---|
| `skip_reason` | 設計書に `skip_reason` 付きで明記 | **カラムなし**（`student_id, suspended_at, triggered_by`のみ） | **`skip_reason` 欠落** |
| **`resume_checklist_status`** | resumeChecklist（3項目）がロジックとして詳述 | **未実装** | **欠落** |
| **`automatic_resume`** | `automaticResume: false`（教師の明示操作必要） | **未実装** | **欠落** |
| **`overdue_alert`** | 14日後にin-app通知 | **未実装** | **欠落** |

#### 設計書に記載があるが実装指示書に**完全欠落**しているテーブル

| テーブル | 設計書での役割 | 欠落理由の推測 |
|---|---|---|
| `referral_logs` | 紹介ログ（紹介者・被紹介者・日時） | Phase 3の紹介処理が `teachers.referred_by` カラムのみで代用 |
| `referral_yearly_stats` | マテリアライズドビュー（CONCURRENT REFRESH対応） | 「referral_yearly_stats の集計」と文言はあるが、MV作成指示なし |
| `utm_source_missing_log` | CAC計測用utm_source欠如記録 | 完全欠落 |
| `prohibited_pattern_override_logs` | EU AI Act Art.13 監査ログ（5年保存、admin_only RLS） | 完全欠落 |
| `v_classroom_summary` | VIEW: 教室別KPI集計 | 完全欠落 |
| `v_teacher_student_overview` | VIEW: 講師ダッシュボード用 | 完全欠落 |
| `zpd_cross_month_weeks` | VIEW: 月またぎ週分析 | 完全欠落 |
| `ai_review_samples` | EU AI Act Art.14 月次サンプリング記録 | 3-3で「まず migration で作成」と言及のみ（定義曖昧） |

### A-3. インデックス差分

| インデックス | 設計書（33本） | 実装指示書 | 差分 |
|---|---|---|---|
| `students(teacher_id, phase, week_start)` | 明記（ZPDダッシュボード集計） | `students(teacher_id)` のみ | **複合インデックスが欠落** |
| `phase_transition_logs(student_id, transitioned_at DESC)` | 明記 | 2-1で同じ記述 | 一致 |
| `teacher_sop_notifications(teacher_id, read_at)` | 明記 | 未記載 | **欠落** |
| `referral_logs(referrer_teacher_id, created_at)` | 明記 | referral_logsテーブル自体が未作成 | **欠落** |
| `idx_zpd_weekly_stats_week_end` | VIEWクエリ最適化用（明記） | 4-2でstudent_week/teacher インデックスのみ | **week_end インデックスが欠落** |
| 合計 | 33本 | 約5〜6本 | **27本以上欠落** |

### A-4. RLSポリシー差分

| テーブル | 設計書の方針 | 実装指示書の定義 | 差分 |
|---|---|---|---|
| `prohibited_pattern_override_logs` | **admin_only**（一般ユーザー完全遮断） | テーブル自体なし | **完全欠落** |
| `referral_yearly_stats` MV | admin + owner | 未作成 | **欠落** |
| `teachers` | auth.uid() = user_id | auth.uid() = user_id | 一致 |
| `classrooms` | owner または classroom_teachers 経由 | owner または classroom_teachers 経由 | 一致 |
| `ai_review_samples` | admin_only が望ましい | 未指定 | **RLSポリシー未定義** |

---

## セクション B: ビジネスロジック差分

### B-1. 料金プランの仕様差分

| 項目 | 設計書（v22） | 戦略書（v3） | 実装指示書 | 差分 |
|---|---|---|---|---|
| 講師プラン月額 | ¥1,980 | ¥1,980 | ¥1,980 | 一致 |
| 教室プラン基本 | ¥9,800/月 | ¥19,800/月 | ¥9,800 | **設計書と戦略書で2倍の乖離。実装指示書は設計書準拠** |
| 追加講師席単価 | ¥1,500/追加講師 | ¥19,800に含まれる（5名固定） | ¥1,500 × (teacherCount-1) | 設計書・実装指示書は一致。**戦略書のみ異なる** |
| チェーンプラン | 設計書に記載なし | ¥49,800〜（個別見積） | 記載なし | 戦略書のみ。実装不要かは要確認 |
| 年額プラン | 設計書に記載なし | 講師¥19,800/教室¥198,000 | 記載なし | **実装指示書に年払いオプションが欠落** |

**重大注意**: 教室プランの金額が戦略書（¥19,800）vs 設計書・実装指示書（¥9,800）で2倍乖離。どちらが正なのか要確認。

### B-2. 権限管理ロジックの差分

#### 設計書の権限モデル
- 教室管理者（owner_teacher_id）: 教室全体の管理・講師追加・削除
- 講師（member）: 自分の担当生徒のみ閲覧
- 生徒: アクセス権なし（共有リンクのみ）

#### 実装指示書の権限モデル

| 権限ロール | 設計書 | 実装指示書 | 差分 |
|---|---|---|---|
| 教室オーナー | 明示（owner_teacher_id） | `role: 'owner' \| 'member'` で定義 | 一致 |
| 講師メンバー | 明示 | `role: 'member'` | 一致 |
| **教室管理者が見られる範囲** | 全講師・全生徒のZPDダッシュボード（`v_classroom_summary` VIEW） | **VIEWなし。ダッシュボードUIに教室管理者向け表示の指示なし** | **欠落** |
| **超過講師席の請求更新** | metered billingで動的変更 | `/api/admin/sync-stripe-teacher-count`（Cronで毎日同期） | Cronは設計書と一致。**しかしAPIの実装指示が欠落** |
| **生徒の最大人数制限** | 設計書に記載なし（「生徒無制限」は戦略書） | 実装指示書にも制限なし | 両書で一致 |

### B-3. Stripe処理の差分

| 処理 | 設計書 | 実装指示書 | 差分 |
|---|---|---|---|
| 講師プランidempotencyキー | **全API必須**と明記 | 指示なし | **欠落** |
| 教室プランmetered billing | 2 subscription_items（base + per_teacher） | 2 subscription_items | 一致 |
| 支払い失敗リトライ | `/api/admin/retry-failed-stripe-rewards`（週次Cron） | Cronとして定義あり（4-3で `retry-failed-stripe-rewards` の言及なし） | **Phase 4のCronリストに欠落** |
| UTM source付与 | `Stripe metadata.utm_source` で全契約に付与 | **指示なし** | **欠落** |
| 年次紹介上限リセット | `/api/admin/reset-referral-limits`（1月1日） | **指示なし** | **欠落** |
| Stripe webhookシークレット | 既存パターン参照 | 「既存のwebhook/route.tsを読んで」 | 間接的に対応 |
| 先行匿名化Cron | `/api/admin/anonymize-preemptive`（3月25日年次） | **指示なし** | **欠落** |

### B-4. チャーン防止・NRR改善ロジックの差分

| 施策 | 設計書 | 実装指示書 | 差分 |
|---|---|---|---|
| **NRR目標 > 100%** | 「追加教師席による拡張収益がチャーンを上回る」 | **設計思想の言及なし** | **欠落** |
| **チャーン率目標 < 3%/月** | KPIとして明記、warningThreshold: 5% | **未実装** | **欠落** |
| **LTV計算** | ¥1,980 × 24ヶ月 = ¥47,520 | **未実装** | **欠落** |
| **blended CAC計測** | 四半期レポート + utm_source全契約付与 | **utm_source付与指示なし** | **欠落** |
| **LTV/blendedCAC > 3** | KPI明記 | **未実装** | **欠落** |
| **紹介プログラムプロラタ監視** | highUsersRate >= 0.10 で adminAlert | 3-4で同様のロジックを指示 | 一致 |
| **pg_advisory_xact_lock** | レースコンディション防止（明記） | **指示なし** | **欠落** |

---

## セクション C: 設計書にあって実装指示書に欠落している要素

### C-1. 機能・コンポーネントの欠落

#### SDTメッセージUIフロー（EncouragementMessageDialog）

| 要素 | 設計書の仕様 | 実装指示書 | 差分 |
|---|---|---|---|
| 4ステップフロー | Step1（カテゴリ）→ Step2（例文/自由記述）→ Step3（プレビュー）→ Step4（送信確認） | 「SDTメッセージ送信ログが記録される」のみ | **UIフロー詳細が全欠落** |
| maxLength | message_content maxLength: 200 | 指示なし | **欠落** |
| Back navigation | 全ステップ間で戻り可能、React state保持 | 指示なし | **欠落** |
| 離脱時confirmダイアログ | 明示 | 指示なし | **欠落** |
| Backdrop/Esc制御 | backdrop click無効化（`onInteractOutside` preventDefault）、Escは入力有無で分岐 | 指示なし | **欠落** |
| AlertDialog | shadcn/ui、aria-labelledby/describedby必須 | 指示なし | **欠落** |

#### ZPDロールバック頻度ガード

| 要素 | 設計書の仕様 | 実装指示書（4-3） | 差分 |
|---|---|---|---|
| ロールバック検知 | 30日以内に3回以上 | 30日以内に3回以上 | 一致 |
| `maxSuspensionDays` | 14日 | **指示なし** | **欠落** |
| `automaticResume: false` | 教師の明示的操作が必要 | **指示なし** | **欠落** |
| `overdueAlert` | 14日後にin-app通知 | **指示なし** | **欠落** |
| `resumeChecklist` | 3項目チェックリスト（required/optional/skip_reason含む） | **指示なし** | **欠落** |
| `skip_reason` | zpd_suspension_logsに記録 | **カラム定義なし** | **欠落** |

#### ソフトウォーニング抑制（保護者同意）

| 要素 | 設計書の仕様 | 実装指示書 | 差分 |
|---|---|---|---|
| sessionStorageキー | `consent_override_warned_{studentId}` | **指示なし** | **欠落** |
| 抑制スコープ | session_per_student | **指示なし** | **欠落** |
| resetOn | page_reload | **指示なし** | **欠落** |

### C-2. インフラ・運用の欠落

#### Vercel Cronジョブの比較

| Cronジョブ | 設計書 | 実装指示書 | 差分 |
|---|---|---|---|
| `/api/admin/sync-stripe-teacher-count` | `0 2 * * *`（毎日） | vercel.jsonへの追加指示なし | **欠落** |
| `/api/notifications/escalate-assignments` | `0 * * * *`（毎時） | 2-4で追加指示あり | 一致 |
| `/api/admin/check-ab-consent-delivery` | `0 10 * * 1`（毎週月） | **指示なし** | **欠落** |
| `/api/referral/process-rewards` | `0 3 1 * *` | 3-4で追加指示あり | 一致 |
| `/api/admin/sample-ai-review` | `0 8 1 * *` | 3-3で追加指示あり | 一致 |
| `/api/admin/anonymize` | `0 3 * * 0` | 4-1で追加指示あり | 一致 |
| `/api/admin/remind-ai-reviewer-certification` | `0 9 15 * *` | **指示なし** | **欠落** |
| `/api/admin/retry-failed-stripe-rewards` | `0 4 * * 1` | **指示なし** | **欠落** |
| `/api/admin/reset-referral-limits` | `0 0 1 1 *` | **指示なし** | **欠落** |
| `/api/admin/anonymize-preemptive` | `0 2 25 3 *` | **指示なし** | **欠落** |
| `/api/admin/check-zpd-rollback-triggers` | `0 0 * * 0` | 4-3で追加指示あり | 一致 |

**欠落Cron数: 11本中5本（45%）**

#### データベースメンテナンス

| 要素 | 設計書 | 実装指示書 | 差分 |
|---|---|---|---|
| VACUUM ANALYZE | 月次（zpd_weekly_stats, phase_transition_logs） | **指示なし** | **欠落** |
| REINDEX CONCURRENTLY | 四半期（土曜深夜3時） | **指示なし** | **欠落** |
| log_mv_refresh_result RPC | マテリアライズドビュー更新ログ | **指示なし** | **欠落** |

### C-3. テスト戦略の欠落

| テスト | 設計書 | 実装指示書 | 差分 |
|---|---|---|---|
| E2E: `mvRefreshTest` | MV更新 + fallback | **指示なし** | **欠落** |
| E2E: `mvFallbackTest` | MV障害時フルスキャン代替 | **指示なし** | **欠落** |
| E2E: `consentVersionTest` | deprecated版同意の検知・アラート | **指示なし** | **欠落** |
| E2E: `escalationDeliveryTest` | read_at追跡 + 24h再送 | **指示なし** | **欠落** |
| ロードテスト: `escalationCronLoad` | 100教師同時、p95 < 45秒 | **指示なし** | **欠落** |
| ロードテスト: `zpdDashboardLoad` | 1,000生徒のZPDスコア集計 | **指示なし** | **欠落** |
| プリプロダクションゲート | セキュリティスキャン（RLS漏れチェック）、EU AI Actチェックリスト | **指示なし** | **欠落** |

### C-4. EU AI Act / GDPR関連の欠落

| 要素 | 設計書 | 実装指示書 | 差分 |
|---|---|---|---|
| `prohibited_pattern_override_logs` | EU AI Act Art.13（5年保存、admin_only） | **テーブル自体なし** | **重大欠落** |
| AI reviewer certification リマインド | 毎月15日Cron | **Cronなし** | **欠落** |
| instrumentation.ts | SLACK_ALERT_WEBHOOK_URL の起動時検知 | **指示なし** | **欠落** |
| SDT機能のGDPR法務レビュー | M6で法務レビュー未完了時EU向け除外の意思決定フロー | **指示なし** | **欠落** |
| SDT再同意要件 | confirmed_text変更時のみ（SDTメッセージ例文変更では不要）の法的根拠 | **指示なし** | **欠落** |

### C-5. ZPD理論実装の欠落

| 要素 | 設計書 | 実装指示書 | 差分 |
|---|---|---|---|
| ヒステリシス付きフェーズ遷移 | **連続3日以上の条件充足で遷移** | 「今回はシンプルに閾値超えで遷移してOK、v2で精緻化」と先送り | **設計書の核心仕様が先送り** |
| キャリブレーション | minimumSampleSize: 30、AUCしきい値、Wilson CI（≥20データポイント） | **指示なし** | **欠落** |
| M6実証的検証 | ロジスティック回帰による重み推定 | **指示なし** | **欠落** |
| ZPD計算式（GENERATED ALWAYS AS） | DBカラムとして実装 | `zpd_score: float GENERATED ALWAYS AS (accuracy * 0.5 + cv_stability * 0.2 + error_pattern * 0.3) STORED` | 一致（2-1で正しく定義） |

---

## セクション D: プロンプトエンジニアリング観点での問題点

### D-1. 型定義の不足・曖昧さ

| 箇所 | 問題 | 推奨修正 |
|---|---|---|
| `teacher_consent_override_logs` の3-1定義 | `id, teacher_id, student_id` のSQLカラム型が全て省略されている | `uuid PRIMARY KEY DEFAULT gen_random_uuid()`, `uuid NOT NULL REFERENCES teachers(id)` 等を明示 |
| `ai_review_samples` の3-3定義 | 「まずテーブルを migration で作成: id, sampled_log_id, sampled_at, reviewed_by, reviewed_at」と括弧内に書かれており、SQLとして実装不可能な記述 | 専用のマイグレーションSQL（0006_ai_review.sql等）として独立させる |
| `zpd_suspension_logs` の4-3定義 | 「未作成なら migration で作成」と条件付きで、カラム定義も最小限 | 独立したマイグレーション（0007_zpd_suspension.sql等）として事前定義する |
| `classrooms.subscription_status` のDEFAULT値 | `DEFAULT 'active'` だが、チェックアウト完了前は `'pending'` であるべき | `DEFAULT 'pending'` に修正し、webhook処理で `'active'` に更新する |

### D-2. 依存関係の不明確さ

| 依存関係 | 問題 | 影響 |
|---|---|---|
| `referral_yearly_stats` MV | 3-4の紹介処理コードで「referral_yearly_stats の集計」と言及するが、MVの作成指示が存在しない | Claude Codeがコードを書く際に参照先が存在しない状態になる |
| `lib/consentDialogVersions.ts` | 3-1で「既に存在するので参照してください」と指示するが、既存ファイルの存在確認・作成指示がない | ファイルが存在しない場合にエラーになる |
| `lib/phaseRollbackSop.ts` | 3-2・E-4で参照指示があるが、SAKUモンのファイルが既存かどうかが不明 | 未存在の場合に参照エラー |
| `lib/alertUtils.ts` | 3-3・3-4で使用するが、作成指示がない | ファイルが存在しない場合にimportエラー |
| EIGOモンのE-4 | 「その他の定数（PHASE_ROLLBACK_SOP等）はSAKUモンのファイルをそのままコピー」と指示するが、SAKUモンでのSOPファイル作成指示が実装指示書のどこにもない | コピー元が存在しない |

### D-3. 曖昧な指示

| 箇所 | 曖昧な記述 | 問題の詳細 |
|---|---|---|
| 1-5（Webhook処理） | 「stripe_price_id: session.metadata.plan（'teacher_plan'）」 | `session.metadata.plan` はcheckout時にmetadataに `plan` フィールドを含める設計になっているが、1-4の実装指示では `metadata: { teacherId }` しか指示されていない。planフィールドが欠落している |
| 2-2（ZPDスコア計算式） | 「ZPDスコア = accuracy×0.5 + cvStability×0.2 + errorPattern×0.3」 | DBカラム（2-1）では `GENERATED ALWAYS AS` で自動計算されるが、APIでも「計算して」と指示している。二重計算か参照かが不明確 |
| 3-4（紹介報酬処理） | 「Stripe クレジットを付与（sendAdminAlert で通知するだけでもOK）」 | 「どちらでもOK」は実装者に選択を委ねており、本番仕様として不適切。Stripeクレジット付与ロジックを実装すべきか否かを明確にする必要がある |
| 4-2（zpd_weekly_stats） | 「パーティション化せずシンプルに作る場合（まずはこちら推奨）」 | 推奨案と設計書案が分岐しており、Claude Codeがどちらを選ぶか不明確。設計書ではpg_partman前提 |
| 4-3（ロールバック監視） | 「notification_type: 'rollback_alert'」 | teacher_sop_notificationsの `notification_type` フィールドに使える値の列挙型定義（ENUMまたはCHECK制約）がDBスキーマに存在しない |
| 全体 | 「/Users/ryuki/Desktop/sakumon/src/app/api/b2b/stripe/checkout/route.ts を参考に」 | 参考先ファイルはこの指示書によって新規作成されるものであり、1-4完了前に2-3の参照指示が動作しない |

### D-4. セッション分割による文脈断絶リスク

| 問題 | 詳細 |
|---|---|
| **フェーズをまたいだ型整合性** | Phase 1で定義した型（Teacher/Student/Classroom）をPhase 2〜4で参照するが、セッションが変わるとClaude Codeが型定義を失念するリスクがある。毎セッション開始時に全型定義ファイルを読ませる指示が必要 |
| **マイグレーションの累積管理** | 0001〜0005のSQLが別々のセッションで作成されるため、FKの整合性（特に後続マイグレーションが前のテーブルを参照する場合）が崩れるリスクがある |
| **vercel.json の上書きリスク** | 各フェーズで「vercel.jsonに追加」と指示しているが、Claude Codeが誤ってファイルを上書きする可能性がある。「既存の vercel.json を確認してから追加」の一文が一部のフェーズにしかない |
| **EIGOモンとSAKUモンのSupabaseプロジェクト** | 別プロジェクトに向けている点が明記されているが、`supabase.ts` のURL/KEYが正しく向いているかの確認指示がない |

### D-5. プロンプト構造の問題

| 問題 | 詳細 |
|---|---|
| **コードブロック内に指示文が混在** | バッククォート3つで囲まれたブロックに「〜を作成してください」という命令文が含まれているため、Claude Codeがそのままコードとして解釈するかもしれない |
| **「〜でもOK」の多用** | 本番仕様の実装指示書として、代替案を「OK」と明示することで実装品質が下がるリスクがある |
| **設計書への参照は「参照してください」のみ** | 2-2の「B2Bアプリ設計_最終版_v22_94点.md の『2. ZPD理論実装』セクションも参照してください」は、セクションの内容（重み付けの理論根拠、ヒステリシス、キャリブレーション）を実装に反映させるか否かが曖昧 |

---

## 総括サマリー

### 実装指示書のカバレッジ評価

| カテゴリ | 設計書要素数 | 実装指示書でカバー | カバー率 |
|---|---|---|---|
| テーブル | 38 | 約10 | **26%** |
| インデックス | 33本 | 約6本 | **18%** |
| Cronジョブ | 11本 | 6本 | **55%** |
| UIコンポーネント仕様 | EncouragementMessageDialog（4ステップ詳細） | 記録APIのみ | **10%** |
| テスト戦略 | 6項目E2E + 2ロードテスト | 0 | **0%** |
| KPI/ビジネスロジック | LTV/NRR/CAC/チャーン率の計測基盤 | 0 | **0%** |

### 優先度別の修正推奨事項

#### 最優先（リリースブロッカー）

1. `prohibited_pattern_override_logs` テーブルの追加（EU AI Act Art.13 法令遵守）
2. `teacher_consent_override_logs.override_reason` カラム追加（EU AI Act Art.13 対応、NOT NULL, CHECK(char_length >= 10)）
3. Stripe idempotencyキーの全API実装指示追加
4. `classrooms.subscription_status` のDEFAULT値を `'pending'` に修正
5. 欠落Cron 5本（`sync-stripe-teacher-count`, `check-ab-consent-delivery`, `remind-ai-reviewer-certification`, `retry-failed-stripe-rewards`, `reset-referral-limits`）の追加

#### 高優先（品質・整合性）

6. `referral_yearly_stats` マテリアライズドビューの作成指示
7. `lib/alertUtils.ts` / `lib/consentDialogVersions.ts` / `lib/phaseRollbackSop.ts` の作成指示
8. `zpd_suspension_logs.skip_reason` カラム追加
9. ヒステリシス付きフェーズ遷移（連続3日条件）の実装指示（現状「v2で精緻化」と先送り）
10. ZPDロールバックガードの `resumeChecklist` と停止解除フロー

#### 中優先（スケール・運用）

11. `students(teacher_id, phase, week_start)` 複合インデックス
12. `v_classroom_summary` / `v_teacher_student_overview` VIEWの作成
13. `pg_advisory_xact_lock` によるレースコンディション防止
14. データベースメンテナンス（VACUUM ANALYZE、REINDEX）の運用手順
15. Stripe metadata.utm_source 全契約付与

#### 低優先（将来対応）

16. A/Bテスト基盤（`ab_test_group`, `washout_period_end` カラム）
17. KPI計測基盤（LTV/NRR/CAC/チャーン率）
18. 全E2Eテスト・ロードテストの定義
