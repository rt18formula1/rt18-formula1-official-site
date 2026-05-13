# rt18_formula1 Official Site - DEVELOPMENT.md
最終更新: 2026-05-13 19:00 (JST)

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

## 次のタスク (Claudeへの引き継ぎ事項)

1. **決済完了フローの最終確認 (最優先)**
   - Stripe Checkoutでテスト決済完了後、Supabaseの `orders` および `order_items` テーブルに正しくデータが書き込まれるか確認。
   - Resend経由で注文確認メールが実際に届くか確認。

2. **Admin UI の詳細実装**
   - 管理者が全注文の一覧を確認し、ステータス（pending -> paid -> shipped等）を変更できる管理画面を `/admin` タブ内に追加。

3. **マイページ (My Page) の構築**
   - ユーザーがログイン後に自分の購入履歴を確認できる画面 (`/shop/mypage/orders`)。
   - デジタルコンテンツ（`digital_contents`）のダウンロードリンクやアクティベートコードの表示。

4. **プロフィール管理の強化**
   - チェックアウト時に入力された住所を `user_profiles` テーブルに保存・更新するロジックの確認。

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

### 進行中
- [ ] ショップデータの整合性確認 (Stripe同期テスト)

### 未着手 (優先度高)
- [ ] Admin 注文管理・発送管理UI実装
- [ ] マイページ (購入履歴, デジタルコンテンツ配布) の詳細実装
- [ ] プロフィール情報の自動更新ロジック
