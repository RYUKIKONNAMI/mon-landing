# EIGOモン・SAKUモン 次フェーズやることリスト

作成日: 2026-04-02
根拠文書: /Users/ryuki/Desktop/mon-landing/B2C成長戦略_完全版.md

---

## 実装済み（今セッションまで）

| 項目 | 対象 | 完了日 |
|---|---|---|
| 無料枠 5→3回に変更 | EIGOモン・SAKUモン | 2026-03-31 |
| ¥398 7日間エントリーパス（Stripe checkout / webhook / billing UI） | EIGOモン・SAKUモン | 2026-04-02 |
| EIGOモン light_pass 型定義・hooks追加 | EIGOモン | 2026-04-02 |
| Self-Compassionフィードバック（weekly-review） | EIGOモン | 2026-04-02 |

---

## Phase A：即座に実行可能（〜1週間）

### A-1. 偏差値カードX共有最適化（EIGOモン）
- **目標**: シェア率 2% → 10%
- **内容**:
  - スキャン完了後のスコアカードに「Xでシェア」ボタンを追加
  - シェアテキスト例: `EIGOモンで偏差値62を記録！#英語学習 #EIGOモン https://eigomon.vercel.app`
  - OGP画像（偏差値スコア入り）をサーバーサイドで動的生成（satori or sharp）
  - `/api/og/score?score=62&user=田中&level=B2` のような動的OGPエンドポイント作成
- **対象ファイル**:
  - `/Users/ryuki/Desktop/eigomon/src/app/scan/page.tsx`（シェアボタン追加）
  - `/Users/ryuki/Desktop/eigomon/src/app/api/og/score/route.tsx`（新規作成）
- **期待効果**: 新規流入月+20〜40人

### A-2. SEO LP: /lp/toeic（mon-landing）
- **目標**: TOEIC層・Quizlet流出ユーザーの検索流入獲得
- **内容**:
  - Next.js App Routerで `/lp/toeic` ページを新規作成
  - H1: 「TOEIC単語をAIが自動生成。Quizletより賢い英語学習アプリ」
  - 構成: ヒーロー → 差別化3点 → 価格ラダー → CTA（無料3回 / ¥398パス）
  - メタディスクリプション・OGP設定
  - ターゲットキーワード: 「TOEIC 単語アプリ」「Quizlet 代わり」「英語学習 AI」
- **対象ファイル**:
  - `/Users/ryuki/Desktop/mon-landing/src/app/lp/toeic/page.tsx`（新規）
- **期待効果**: 月+50〜100 オーガニック流入

### A-3. 紹介者報酬 +3回（EIGOモン・SAKUモン）
- **目標**: バイラル係数向上
- **内容**:
  - 既存のreferral仕組みがあれば拡張、なければ新規実装
  - 紹介URL生成: `/signup?ref=USER_ID`
  - 紹介完了時（紹介先が初回生成完了）: 紹介者の remaining_uses += 3
  - UI: ホーム画面に「友達に紹介すると3回分プレゼント」バナー追加
  - 紹介者が3人紹介 → Pro1ヶ月無料（将来拡張用のフラグをDBに持たせるのみ、今フェーズはUI表示まで）
- **対象ファイル**:
  - `/Users/ryuki/Desktop/eigomon/src/app/api/referral/route.ts`（新規）
  - `/Users/ryuki/Desktop/eigomon/src/app/home/page.tsx`（バナー追加）
  - `/Users/ryuki/Desktop/sakumon/src/app/api/referral/route.ts`（新規）
  - `/Users/ryuki/Desktop/sakumon/src/app/home/page.tsx`（バナー追加）
  - DB: `profiles` に `referral_code TEXT UNIQUE`, `referred_by TEXT` カラム追加

### A-4. ¥398→MONパス アップセル通知（EIGOモン）
- **目標**: ¥398パス→MONパス転換率 15%
- **内容**:
  - `light_pass_end` の翌日にメール送信（Resend使用）
  - メール件名: 「7日間パスが終了しました。月換算¥399お得なMONパスはこちら」
  - Vercel Cron または webhook完了後の delayed job で送信
  - billing pageに「パス終了まであと○日 / MONパスの方が月換算¥399お得」バナー追加（light_pass_end - 今日が3日以内の場合）
- **対象ファイル**:
  - `/Users/ryuki/Desktop/eigomon/src/app/api/cron/light-pass-upsell/route.ts`（新規）
  - `/Users/ryuki/Desktop/eigomon/src/app/billing/page.tsx`（アップセルバナー追加）
  - `vercel.json`（cron設定追加）

---

## Phase B：1〜2週間

### B-1. マイゴール機能（EIGOモン）
- **目標**: SDT自律性充足 → 継続率+2ヶ月
- **内容**:
  - ユーザーが以下を設定できる:
    - 目標スコア（TOEIC: 600/730/860/990、英検: 2級/準1級/1級）
    - 目標達成日（カレンダーピッカー）
    - 学習モード（TOEIC / 英検 / 大学授業 / 自由）
  - ホーム画面に「目標まであと〇日・現在の達成率〇%」ウィジェット表示
  - weekly-reviewのAIプロンプトに目標情報を付加
- **DB追加カラム** (`profiles`):
  ```sql
  goal_target TEXT,          -- 'toeic_730' | 'eiken_pre1' | 'custom'
  goal_deadline DATE,
  goal_mode TEXT             -- 'toeic' | 'eiken' | 'university' | 'free'
  ```
- **対象ファイル**:
  - `/Users/ryuki/Desktop/eigomon/src/app/home/page.tsx`
  - `/Users/ryuki/Desktop/eigomon/src/app/api/goal/route.ts`（新規）
  - `/Users/ryuki/Desktop/eigomon/src/lib/supabase.ts`（型追加）
  - `/Users/ryuki/Desktop/eigomon/src/app/api/weekly-review/route.ts`（プロンプト拡張）

### B-2. マイゴール機能（SAKUモン）
- **目標**: SDT自律性充足
- **内容**:
  - ユーザーが以下を設定できる:
    - 目標タイプ（定期試験 / 就活ES / 大学院入試 / 論文執筆）
    - 目標日（カレンダーピッカー）
    - 論述テーマ（自由テキスト、任意）
  - ホーム画面にウィジェット表示
- **DB追加カラム** (`profiles`):
  ```sql
  goal_type TEXT,           -- 'exam' | 'es' | 'grad' | 'paper'
  goal_deadline DATE,
  goal_theme TEXT
  ```
- **対象ファイル**:
  - `/Users/ryuki/Desktop/sakumon/src/app/home/page.tsx`
  - `/Users/ryuki/Desktop/sakumon/src/app/api/goal/route.ts`（新規）
  - `/Users/ryuki/Desktop/sakumon/src/lib/supabase.ts`（型追加）

### B-3. 成長レポート（SAKUモン）
- **目標**: SDT有能感充足 → 継続率向上
- **内容**:
  - EIGOモンの `/api/weekly-review/route.ts` 相当の機能をSAKUモンに新規実装
  - SAKUモンの採点データ（`quiz_sessions`テーブル想定）から週次集計
  - 構成力スコア・論理の飛躍の減少・語彙の多様性を指標化
  - AIが週次サマリー・課題・来週プラン・モチベーションメッセージを生成
  - Self-Compassion設計: スコア低下週は数値強調なし・縮小目標提示
  - 週1回プッシュ通知（Resendメール）
- **対象ファイル**:
  - `/Users/ryuki/Desktop/sakumon/src/app/api/weekly-review/route.ts`（新規）
  - `/Users/ryuki/Desktop/sakumon/src/app/api/cron/weekly-review/route.ts`（新規）
  - `vercel.json`（cron設定追加）

### B-4. 読書ストリーク + レベルシステム（SAKUモン）
- **目標**: 蓄積データロック → チャーン-10%
- **内容**:
  - ログイン/生成ごとにストリーク日数をインクリメント
  - レベル定義: Lv1（1-7日）→ Lv2（8-30日）→ Lv3（31-90日）→ Lv4（91日+）
  - ホーム画面にストリークカレンダー表示
  - レベルアップ時にアニメーション + 「○日継続中！」表示
- **DB追加カラム** (`profiles`):
  ```sql
  streak_days INT DEFAULT 0,
  streak_last_date DATE,
  level INT DEFAULT 1
  ```
- **対象ファイル**:
  - `/Users/ryuki/Desktop/sakumon/src/app/home/page.tsx`
  - `/Users/ryuki/Desktop/sakumon/src/app/api/streak/route.ts`（新規）
  - `/Users/ryuki/Desktop/sakumon/src/lib/supabase.ts`（型追加）

---

## Phase C：2〜4週間

### C-1. War他大学展開（EIGOモン・SAKUモン）
- MARCH → 旧帝大 → 関関同立の順で早慶戦LPと同様のイベントページ拡張
- 対象: `/war` ルート拡張、大学ごとのパラメータ対応
- 期待効果: 大学1校あたり月+20〜40人

### C-2. 蓄積データロック（解約フロー）
- 解約フロー途中で「○日分のデータ・○枚のカード」を表示
- チャーン-10%目標

### C-3. SEO LP量産
- `/lp/eiken`（英検層）
- `/lp/juken`（大学受験層）
- `/lp/saiyou`（就活ES層、SAKUモン向け）

### C-4. 年額プラン訴求強化
- billing pageに年額割引バナー追加（「年払いで2ヶ月分お得」）
- LTV+40%目標

---

## Phase D：SHIKENモンリリース後

| 項目 | 概要 | 目安期間 |
|---|---|---|
| SM-2/FSRS分散学習エンジン | 復習タイミング自動最適化 | 1ヶ月+ |
| ZPDスコア難易度最適化 | 正答率55〜75%ゾーンの問題自動選択 | 1ヶ月+ |
| IRT（項目応答理論）統合 | 問題難易度の統計的推定 | 2ヶ月+ |
| X Bot自動投稿 | 週次ランキング自動ツイート | 2〜3時間（アカウント準備後） |
| SHIKENモン連携ワークフロー | SAKUモン×SHIKENモン クロスセル | SHIKENモンリリース後 |

---

## KPI目標（再掲）

### EIGOモン
| 指標 | M6 | M12 | M18 |
|---|---|---|---|
| MAU | 800 | 2,500 | 5,000 |
| 有料転換率 | 8% | 12% | 15% |
| MRR | ¥8万 | ¥25万 | ¥50万 |

### SAKUモン
| 指標 | M6 | M12 | M18 |
|---|---|---|---|
| MAU | 400 | 1,500 | 3,500 |
| 有料転換率 | 7% | 11% | 14% |
| MRR | ¥5万 | ¥18万 | ¥40万 |
