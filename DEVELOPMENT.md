# rt18_formula1 Official Site - DEVELOPMENT.md
最終更新: 2026-05-21 00:00 (JST)

---

## 重要: AIエージェントへの指示

このファイルはエージェント間で共有する「設計書」兼「進捗管理表」です。
ClaudeやDevinなどの後続エージェントは、作業前に必ず以下の **「Stripe/ショップの実装状況」** を熟読してください。

---

## プロジェクト概要

- **サイトURL**: https://rt18-formula1-official-site.vercel.app
- **DB**: Supabase (PostgreSQL)
- **決済**: Stripe (Managed Payments / Checkout Session方式)
- **メール**: Resend
- **画像ストレージ**: Cloudflare R2

---

## ショップ / Stripe 実装状況 (2026-05-13 更新)

### 完了した作業
- **Stripe Managed Payments 移行**: `PaymentIntent` 直接作成方式から、最新のブループリントに基づいた `Stripe Checkout Session` 方式へ移行済み。
- **Webhook 実装**: `app/api/shop/webhook/route.tsx` で `checkout.session.completed` を受信し、注文作成とResendメール送信を行うロジックを実装済み。
- **Stripe設定**: ダッシュボード側での Webhook 登録 (`whsec_...`)、テスト商品の作成完了。
- **UI バグ修正**: 
  - `product.type` が null の場合に `.toUpperCase()` でクラッシュする問題を全ショップコンポーネントで修正済み。
  - ログインリダイレクト先を `/shop/mypage` (未作成) から `/shop` (トップ) へ修正。
  - 新規ユーザー（プロフィール未作成）がチェックアウト画面で無限リダイレクトされる問題を、Authセッション確認のみのガードに変更して修正。
  - RLSポリシーを修正し、ログイン済みユーザー（authenticated）でも商品を `SELECT` できるように変更。

### 技術的な特記事項
- **Stripe API Version**: 決済処理では `2026-02-25.preview` ヘッダーを使用。
- **環境変数**: Vercelには `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` 等が設定済み。

---

## 開発ログ

### 2026-05-21 Supabase Security Advisor対応

#### 対応内容
- Supabaseから `rls_disabled_in_public` のCritical通知が届いたため、project `ghnnfndnjvtrgkovuxte` のSecurity Advisorを確認。
- RLSが無効だった `public.album_relations`, `public.album_news`, `public.album_portfolio`, `public.orders`, `public.order_items`, `public.user_profiles` に対して RLS を有効化。
- `public.activate_codes`, `public.commissions`, `public.digital_contents`, `public.inquiries` は RLS 有効だが policy が無かったため、用途に合わせた最小限の policy を追加。
- `public.albums` の `Allow all operations` policy と、`public.products` の `Authenticated users can manage products` policy を削除。どちらも書き込み許可が広すぎるため、管理系書き込みは service role 経由に寄せる。
- 適用SQLを `supabase-security-fix-2026-05-21.sql` に保存。

#### 検証
- Supabase Security Advisor再実行: `rls_disabled_in_public` は解消。
- 残存WARN: `auth_leaked_password_protection` のみ。これはDashboardのAuth設定でLeaked Password Protectionを有効化する必要がある。
- SQLで `public` schema の RLS無効テーブルを確認: 0件。
- `anon` roleで検証: `album_relations` は公開読み取り可、`orders`, `user_profiles`, `digital_contents`, `activate_codes` は0件で非公開化されていることを確認。

#### 後続エージェントへの注意
- RLS強化により、anon/authenticated Supabase clientからの管理系直接書き込みは失敗する。Admin画面の注文ステータス変更、商品デジタル納品データ作成、commission更新などは service role を使うAPI/Server Actionへ移行すること。
- 購入者向けの `digital_contents` は、`orders.status in ('paid', 'processing', 'shipped', 'delivered')` の注文を持つユーザーのみ参照可能。
- `activate_codes` は `used_by = auth.uid()` のユーザーのみ参照可能。
- Leaked Password ProtectionはSQLではなくSupabase Dashboard側のAuth設定で対応する。

---

### 2026-05-21 Codex作業ログ

#### 実装内容
- **チェックアウト住所保存**: `app/api/shop/checkout/route.ts` で、チェックアウト時の配送先情報を `user_profiles` に `upsert` する処理を追加。
- **注文数量の永続化**: Stripe Checkout metadata に `cart_quantities` を追加し、`app/api/shop/webhook/route.tsx` 側で `order_items.quantity` を正しく保存するよう修正。従来は数量が常に `1` になり得た。
- **注文確認メール修正**: 注文確認メールで `\${order.total_price.toLocaleString()}` が文字列のまま表示される問題を修正。金額、注文ID、配送先、ステータスを含むHTMLメールに整理。
- **発送通知メール改善**: `app/api/shop/shipping-notification/route.ts` のHTML生成にエスケープ処理を追加し、配送先表示を整理。
- **チェックアウトUI改善**: `components/shop/checkout-client.tsx` に必須入力チェック、Country入力、エラー表示を追加。ローカル環境で Supabase public env が未設定の場合、無限Loadingではなく設定不足メッセージを表示。
- **マイページ強化**: `app/shop/mypage/page.tsx` で注文履歴に商品明細、数量、小計、配送先、追跡番号、デジタル納品リンク/テキスト/アクティベートコードを表示。
- **Admin注文管理強化**: `components/shop/shop-admin-tab.tsx` で注文詳細に商品明細を表示。発送処理時に注文内容を確認しやすくした。

#### 検証
- `npx tsc --noEmit`: 成功。
- `npm run build`: 成功。
- `npm run lint`: 既存の広範な lint エラーにより失敗。今回変更範囲の型エラーは `tsc` で解消済み。
- Browserで `http://localhost:3000/shop/checkout` を確認。ローカル `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` が無いため、設定不足メッセージが表示されることを確認。

#### Git / Deploy
- Commit: `8185dc6` `Polish shop checkout and order flow`
- Push: `origin/main` へ push 済み。
- Production deploy: `npx vercel --prod` 実行済み、Vercel deployment `dpl_9aSYnSG2KAwfnQRV6WJBiHSfYbUj` が `READY`。
- 本番URL: https://rt18-formula1-official-site.vercel.app
- デプロイ中に `/calendar` の `Dynamic server usage` 警告が出たが、ビルドと本番デプロイは成功。

#### 後続エージェントへの注意
- 本番環境では Supabase/Stripe/Resend の環境変数が設定済み前提。ローカル `.env.local` には `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` が無かったため、ローカルで実決済フローを検証する場合は追加が必要。
- `orders.shipping_country` / `user_profiles.country` をコード上で参照している。DBに未追加の環境がある場合はカラム追加が必要。
- `activate_codes` は `used_by = user.id` でマイページ表示している。RLSが厳しい環境ではユーザー自身が使用済みコードを読めるポリシーを確認すること。
- 注文メール/発送メールは `onboarding@resend.dev` 送信元のまま。独自ドメイン送信に切り替える場合は Resend 側のドメイン認証と `from` の更新が必要。

---

## 次のタスク (Claudeへの引き継ぎ事項)

1. **決済完了フローの最終確認 (最優先)**
   - Stripe Checkoutでテスト決済完了後、Supabaseの `orders` および `order_items` テーブルに正しくデータが書き込まれるか確認。
   - Resend経由で注文確認メールが実際に届くか確認。
   - 数量2以上の商品購入時に `order_items.quantity` が正しく保存されるか確認。

2. **Admin UI の詳細実装**
   - 注文一覧、注文詳細、ステータス変更、追跡番号登録、発送通知メール送信は実装済み。
   - 今後は検索、絞り込み、注文CSV出力、発送メール再送履歴などを追加すると運用しやすい。

3. **マイページ (My Page) の構築**
   - ユーザーがログイン後に自分の購入履歴を確認できる画面は `/shop/mypage` に実装済み。
   - デジタルコンテンツ（`digital_contents`）のダウンロードリンクやアクティベートコード表示も実装済み。
   - 今後はダウンロード期限、購入者限定表示のRLS検証、UIの多言語化を確認する。

4. **プロフィール管理の強化**
   - チェックアウト時に入力された住所を `user_profiles` テーブルに保存・更新するロジックは実装済み。
   - 今後は本番DBの `country` カラム有無、住所更新時の既存プロフィール情報の保持、郵便番号補完のチェックを行う。

---

## DBテーブル設計 (抜粋)

### products
| Name | Type | Note |
|------|------|------|
| id | uuid | Primary |
| status | text | 'on_sale', 'sold_out', 'draft' |
| stripe_product_id | text | Stripe側の商品ID |
| stripe_price_id | text | Stripe側の価格ID |

### orders
| Name | Type | Note |
|------|------|------|
| id | uuid | Primary |
| user_id | uuid | references user_profiles(id) |
| status | text | 'pending', 'paid', 'shipped', etc. |
| stripe_checkout_session_id | text | Webhookでの照合用 |

---

## 進捗

### 完了済み
- [x] 基本ページ構成 (News, Portfolio, Calendar, Profile, Contact, Request)
- [x] Admin管理画面 (骨格実装)
- [x] Cloudflare R2連携
- [x] Supabase Auth 会員登録・ログイン実装
- [x] Stripe Managed Payments 移行完了
- [x] Webhook による注文自動作成・メール送信ロジック実装
- [x] チェックアウト時の住所保存・更新
- [x] 注文数量を `order_items` に反映
- [x] 注文確認メールの金額表示バグ修正
- [x] Admin 注文管理・発送通知UIの強化
- [x] マイページ購入履歴・デジタル納品表示

### 進行中
- [ ] ショップデータの整合性確認 (Stripe同期テスト)
- [ ] 本番環境でのStripe Checkout実決済テスト
- [ ] Admin画面の管理系書き込みを service role API/Server Action へ移行

### 未着手 (優先度高)
- [ ] Supabase Auth Leaked Password Protection の有効化
- [ ] 注文検索・絞り込み・CSV出力
- [ ] Resend独自ドメイン送信元への切り替え
- [ ] lint既存エラーの整理

---

### 2026-05-29 プロジェクト保存場所の移行

#### 作業内容
- プロジェクトの保存場所を `/Users/Ryusei_Tsukamoto/Downloads/rt18_formula1-Official-Site/` から外部HDD `/Volumes/Mac Hdd/RYUSEI/rt18_formula1-Official-Site/` へ移行。
- 移行手順:
  1. `rsync` でプロジェクトファイル（node_modules, .next 除く）を外部HDDへコピー
  2. `.git` ディレクトリを外部HDDへコピー（Git履歴を保持）
  3. `node_modules` を元フォルダからrsyncでコピー
- 外部HDD: `/Volumes/Mac Hdd/` (3.6TB, 使用量299GB, 空き527GB)

#### 新しい作業パス
**今後の開発は `/Volumes/Mac Hdd/RYUSEI/rt18_formula1-Official-Site/` で行うこと。**

#### 後続エージェントへの注意
- プロジェクトの正式パスが変更されました。
- `cd '/Volumes/Mac Hdd/RYUSEI/rt18_formula1-Official-Site/'` でプロジェクトに移動してから作業してください。
- npm/node コマンドは nvm 経由で使用: `export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"`

---

### 2026-06-01 Claude作業ログ: F1DB AI取得機能の追加

#### 実装内容
- **新規APIルート `app/api/f1-ai-fetch/route.ts`** を作成
  - Anthropic claude-sonnet-4-20250514 + web_search_20250305 ツールを使用
  - `type: 'schedule'` → グランプリの週末スケジュール（TrackTime / JapanTime付き）を取得
  - `type: 'result'` → 指定セッション（Race / Qualifying / Sprint等）の公式リザルトを取得
  - 環境変数 `ANTHROPIC_API_KEY` が必須（Vercelに要設定）

- **`components/f1-jolpica-client.tsx` にAI取得タブを追加**
  - タブに「AI取得 / AI Fetch」を追加（activeTab: 'aifetch'）
  - 週末スケジュール / セッション結果の切り替え
  - Grand Prix名・Year・Sessionを入力してAIで取得
  - 結果をTrackTime + JapanTimeのテーブル形式で表示

#### 重要: 環境変数
- Vercelダッシュボードで `ANTHROPIC_API_KEY` の追加が必要
- プロジェクト設定 → Environment Variables → `ANTHROPIC_API_KEY` を追加

#### Git / Deploy
- Commit: 後続で記録
- Push: origin/main へ push 済み
- Production deploy: npx vercel --prod 実行済み

#### 後続エージェントへの注意
- `ANTHROPIC_API_KEY` がVercelに未設定の場合、AI取得ボタン押下時に500エラーが出る
- APIルートは `/app/api/f1-ai-fetch/route.ts` に存在
- f1-jolpica-clientの他タブ（schedule, standings等）は変更なし

---

### 2026-06-02 Codex作業ログ: F1DB AI取得機能をGemini構成へ移行

#### 実装内容
- **`app/api/f1-ai-fetch/route.ts` をGemini API構成に変更**
  - Base44側で使用していた `add_context_from_internet: true + gemini_3_flash + response_json_schema` の考え方に合わせ、Gemini REST APIの `google_search` tool と `generationConfig.response_schema` を使用。
  - `RESULT_PROMPT_BASE` はユーザー提示のプロンプトに合わせ、DSQ・ペナルティ・107%例外などのnotesを含めるルールを反映。
  - レスポンスに `provider: "gemini"`, `model`, `sources` を含めるようにした。
  - `GEMINI_MODEL` 未設定時のデフォルトは `gemini-3-flash-preview`。

- **`components/f1-jolpica-client.tsx` のAI取得タブを更新**
  - 表示文を Claude から Gemini + Google Search に変更。
  - Gemini grounding metadata 由来の参照元URLを結果下部に表示。
  - APIエラー詳細がUIに出るように改善。

#### 重要: 環境変数
- Vercelダッシュボードで `GEMINI_API_KEY` の設定が必要。
- 必要に応じて `GEMINI_MODEL` を設定可能。未設定時は `gemini-3-flash-preview`。
- 旧 `ANTHROPIC_API_KEY` はこのAI取得APIでは不要。

#### 検証
- `npx tsc --noEmit`: 成功。
- `npm run build`: 成功。既存の `/calendar` Dynamic server usage 警告と、ローカルSupabaseキー不足による取得エラーは出るがビルドは完了。
- ローカル `.env.local` の `GEMINI_API_KEY` は空のため、実際のGemini検索取得は未検証。

---

### 2026-06-02 Codex作業ログ: F1DBスケジュール取得をGoogle Calendar iCal優先に変更

#### 実装内容
- **`lib/calendar-service.ts` にF1スケジュール抽出機能を追加**
  - 既存のFormula 1 public Google Calendar iCalからGP名・年に一致するセッションを抽出。
  - Practice / Sprint Qualifying / Sprint / Qualifying / Race をセッション順に整列。
  - iCalの開始・終了時刻から `TrackTime` と `JapanTime` を生成。
  - JST日付も `japanDate` として返し、日付跨ぎ（例: Monaco Practice 2のJST 06/06 00:00）を表示できるようにした。

- **`app/api/f1-ai-fetch/route.ts` のschedule取得をiCal優先に変更**
  - `type: "schedule"` はまず `fetchF1CalendarSchedule()` を使用。
  - iCalで一致するGPが見つかった場合は `provider: "google-calendar-ical"` として返却。
  - iCalで見つからない場合のみ従来どおりGemini + Google Searchへフォールバック。

- **`components/f1-jolpica-client.tsx` のAI取得タブを更新**
  - 説明文を「スケジュールはiCal、結果はGemini検索」に変更。
  - 取得元表示を `via Calendar iCal` / `via Gemini + Google Search` で切り替え。
  - スケジュール表示を `Track: MM/DD HH:MM - HH:MM`, `Japan: MM/DD HH:MM - HH:MM` 形式に変更。

#### 検証
- ローカルAPI確認:
  - Monaco 2026: `provider: "google-calendar-ical"` でPractice 1/2/3, Qualifying, Raceを取得。
  - China 2026: Sprint weekendとしてPractice 1, Sprint Qualifying, Sprint, Qualifying, Raceを取得。
- `npx tsc --noEmit`: 成功。
- `npm run build`: 成功。既存の `/calendar` Dynamic server usage 警告と、ローカルSupabaseキー不足による取得エラーは出るがビルドは完了。

---

### 2026-06-04 Claude work log: Fix F1DB always showing loading spinner

#### Problem
- `loading` useState was initialized to `true`
- This caused a full-screen spinner before any data loaded
- The AI Fetch tab was never visible until Jolpica API responded (which it was failing to do)

#### Fix
- Changed `useState(true)` -> `useState(false)` in f1-jolpica-client.tsx
- Now the full UI (including AI Fetch tab) renders immediately on page load
- Jolpica data loads in the background after mount via useEffect

#### Git / Deploy
- Commit: e6a1781
- Push: origin/main
- Vercel Production: Ready in 2m
- URL: https://rt18-formula1-official-site.vercel.app/f1-database

#### Notes for next agent
- GEMINI_API_KEY must be set in Vercel env vars for AI Fetch to work
- Schedule fetch uses Google Calendar iCal first, falls back to Gemini + Google Search
- Result fetch always uses Gemini + Google Search
