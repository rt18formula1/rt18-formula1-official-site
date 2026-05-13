# rt18_formula1 Official Site - DEVELOPMENT.md
最終更新: 2026-04-29

---

## 重要: AIエージェントへの指示

このファイルはCursor・Codex・Antigravity・Devinなど複数のAIエージェントが共有する設計書です。
- **作業前に必ずこのファイルを全部読んでください**
- **作業完了後は進捗セクションを更新してください**
- **同時に複数のエージェントが同じファイルを触らないようにしてください**
- **作業前に必ず `git pull` してください**

---

## プロジェクト概要

- **サイトURL**: https://rt18-formula1-official-site.vercel.app
- **構成**: Next.js (React), Vercel deploy, GitHub連携済み
- **DB**: Supabase (PostgreSQL)
- **画像ストレージ**: Cloudflare R2
- **認証**: Admin認証 (Cookieベース) 実装済み / ユーザー認証はSupabase Auth (実装予定)
- **メール**: Resend (実装予定)
- **決済**: Stripe (実装予定)

---

## 技術スタック

| 用途 | サービス |
|---|---|
| ホスティング | Vercel |
| DB | Supabase PostgreSQL |
| 画像ストレージ | Cloudflare R2 |
| ユーザー認証 | Supabase Auth |
| メール送信 | Resend |
| 決済 | Stripe |
| 郵便番号自動入力 | zipcloud (無料API) |

---

## 画像の仕組み

- 画像の実体はCloudflare R2に保存する
- Admin画面から画像をアップロード → R2に保存される
- そのパブリックURLをDBのimage_urlカラムに文字列として保存
- フロント側はimage_urlを読んでimgタグで表示する
- R2の無料枠: 10GB/月

---

## DBテーブル設計 (確定)

### メインサイト系

#### news
```sql
create table news (
  id uuid default gen_random_uuid() primary key,
  title_en text not null,
  title_ja text,
  body_en jsonb,
  body_ja jsonb,
  image_url text,
  published_at date not null,
  created_at timestamp default now()
);
```
bodyはjsonbブロック構造。テキストとPortfolio埋め込みブロックを混在可能
例: [{"type":"text","content":"..."}, {"type":"portfolio_embed","portfolio_id":"uuid"}]

#### portfolio
```sql
create table portfolio (
  id uuid default gen_random_uuid() primary key,
  title_en text not null,
  title_ja text,
  description_en text,
  description_ja text,
  image_url text,
  sort_order int default 0,
  created_at timestamp default now()
);
```

#### albums
```sql
create table albums (
  id uuid default gen_random_uuid() primary key,
  name_en text not null,
  name_ja text,
  description_en text,
  description_ja text,
  cover_image_url text,
  type text check (type in ('backnumber', 'portfolio')),
  tags text[],
  sort_order int default 0,
  position_x float default 0,
  position_y float default 0,
  created_at timestamp default now()
);
```

#### album_relations (多対多・無限ネスト)
```sql
create table album_relations (
  parent_id uuid references albums(id) on delete cascade,
  child_id uuid references albums(id) on delete cascade,
  sort_order int default 0,
  primary key (parent_id, child_id)
);
```

#### album_news (中間テーブル)
```sql
create table album_news (
  album_id uuid references albums(id) on delete cascade,
  news_id uuid references news(id) on delete cascade,
  sort_order int default 0,
  primary key (album_id, news_id)
);
```

#### album_portfolio (中間テーブル)
```sql
create table album_portfolio (
  album_id uuid references albums(id) on delete cascade,
  portfolio_id uuid references portfolio(id) on delete cascade,
  sort_order int default 0,
  primary key (album_id, portfolio_id)
);
```

### ショップ系

#### user_profiles (Supabase Authと連携)
```sql
create table user_profiles (
  id uuid references auth.users(id) primary key,
  display_id text unique,
  display_name text,
  last_name text,
  first_name text,
  postal_code text,
  prefecture text,
  city text,
  address_line1 text,
  address_line2 text,
  agreed_at timestamp,
  created_at timestamp default now()
);
```
- display_idは未設定の場合「匿名#000000」形式で自動付与
- display_idはあとから編集可能
- ログインはメールアドレスまたはdisplay_idどちらでも可能
- 将来的にSNS・コミュニティ機能に拡張予定

#### products
```sql
create table products (
  id uuid default gen_random_uuid() primary key,
  name_ja text not null,
  name_en text,
  description_ja text,
  description_en text,
  type text check (type in ('digital', 'physical', 'skill')),
  price int not null,
  stock int,
  status text check (status in ('on_sale', 'sold_out', 'draft')) default 'draft',
  image_url text,
  sort_order int default 0,
  created_at timestamp default now()
);
```

#### digital_contents
```sql
create table digital_contents (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete cascade,
  delivery_type text check (delivery_type in ('file', 'activate_code', 'link', 'text')),
  content text,
  created_at timestamp default now()
);
```
delivery_type: file=ファイル配布, activate_code=コード配布, link=リンク配布, text=テキスト配布
アクティベートコードは他プラットフォーム(Steam等)のコードも対応

#### activate_codes
```sql
create table activate_codes (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete cascade,
  code text not null,
  is_used boolean default false,
  used_by uuid,
  used_at timestamp,
  created_at timestamp default now()
);
```

#### orders
```sql
create table orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references user_profiles(id),
  status text check (status in (
    'pending', 'awaiting_payment', 'paid',
    'processing', 'shipped', 'delivered', 'cancelled'
  )) default 'pending',
  total_price int not null,
  stripe_payment_intent_id text,
  shipping_name text,
  shipping_postal_code text,
  shipping_prefecture text,
  shipping_city text,
  shipping_address_line1 text,
  shipping_address_line2 text,
  created_at timestamp default now()
);
```

#### order_items
```sql
create table order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity int default 1,
  price int not null,
  created_at timestamp default now()
);
```

#### commissions (イラスト制作依頼)
```sql
create table commissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references user_profiles(id),
  status text check (status in (
    'requested', 'reviewing', 'quoted',
    'approved', 'agreement_sent', 'agreed',
    'in_progress', 'checking', 'completed', 'cancelled'
  )) default 'requested',
  detail text not null,
  budget int,
  quoted_price int,
  stripe_payment_intent_id text,
  created_at timestamp default now()
);
```
フロー: 依頼→確認→見積もり→承認→同意書送付→同意確認→制作→確認→決済→納品

#### inquiries (問い合わせ)
```sql
create table inquiries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references user_profiles(id),
  subject text not null,
  body text not null,
  status text check (status in ('open', 'replied', 'closed')) default 'open',
  created_at timestamp default now()
);
```

---

## ページ構造

### メインサイト
```
/ (トップ)
/news
/news/[id]
/backnumber
/backnumber/[album_id]
/portfolio
/portfolio/[id]
/albums/[album_id]
/calendar
/profile
/request
/contact
/admin
```

### ショップ (/shop以下)
```
/shop (商品一覧)
/shop/[id] (商品詳細)
/shop/cart (カート)
/shop/checkout (決済)
/shop/commission (イラスト依頼)
/shop/inquiry (問い合わせ)
/shop/auth/login (ログイン)
/shop/auth/register (会員登録)
/shop/mypage (マイページ)
/shop/mypage/orders (購入履歴)
/shop/mypage/profile (プロフィール設定)
```

---

## Admin画面構成

```
/admin
├── タブ1: メインサイト管理 (既存)
│   ├── News管理
│   ├── Portfolio管理
│   └── Album Relations Editor (React Flow)
└── タブ2: Shop管理
    ├── 商品管理 (デジタル・実物・スキル)
    ├── 注文管理
    ├── アクティベートコード管理
    ├── イラスト依頼管理
    └── 発送管理
```

---

## アルバム設計の思想

- albumsテーブルはタグ・カテゴリ・レコメンドエンジンを兼ねる
- 同じ親を持つ兄弟アルバムをサジェスト表示する
- パンくずは直前に辿ってきたパスを表示
- BacknumberとPortfolioには壁を設ける (同列混在NG)
- ただし記事の中にPortfolio作品を埋め込むのはOK (jsonbブロック)
- albumの親子は多対多・無限ネスト可能
- 循環参照対策はアプリ側で対応

---

## 会員登録仕様

- メール認証必須 (Supabase Auth)
- ログイン: メールアドレスまたはdisplay_idどちらでも可能
- display_id: 未設定の場合「匿名#000000」形式で自動付与・あとから編集可能
- 住所入力: 郵便番号からzipcloudで自動補完 (都道府県・市区町村)
- 個人情報取り扱い同意書への同意必須
- 住所は全購入時に必須

---

## 将来フェーズ

- コミュニティ機能: display_idを使ったSNS的な機能
- ショップ拡張: 発送委託サービス連携
- カスタムドメイン: R2をpub-*.r2.devからカスタムドメインへ移行

---

## 進捗

### 完了済み
- [x] 基本ページ構成 (News, Portfolio, Calendar, Profile, Contact, Request)
- [x] 日本語/英語切替
- [x] Admin管理画面 (骨格)
- [x] Cloudflare R2画像アップロード (Presigned URL方式)
- [x] Album Relations Editor (React Flow) UI実装
- [x] albumsテーブルにposition_x/position_y追加
- [x] Google Search Console登録
- [x] SEOスコア 100点達成
- [x] PageSpeed: モバイル78 / デスクトップ97
- [x] Album Relations EditorのonConnect (DB保存) デバッグ完了
- [x] Supabase Auth 会員登録・ログイン・コールバック実装 (@supabase/ssr導入)
- [x] /shop ページ群の基本実装 (商品一覧, 詳細, カート, チェックアウト, 決済完了)
- [x] Admin Shop管理セクション実装 (商品・注文・依頼の閲覧と商品作成/削除)
- [x] Stripe決済実装 (Payment Intent API & Webhook)
- [x] Resendメール送信実装 (注文確認メール自動送信)

### 進行中
- [ ] ショップ系DBテーブル作成 (supabase-shop-tables.sql の実行待ち)

### 未着手 (優先度高)
- [ ] アクティベートコード管理の詳細UI実装
- [ ] 発送管理UI実装
- [ ] マイページ (購入履歴, プロフィール編集) の詳細実装

### 未着手 (優先度低)
- [ ] R2カスタムドメイン設定
- [ ] コミュニティ機能
