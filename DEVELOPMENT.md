# rt18_formula1 サイト開発セッションまとめ
作成日: 2026-04-23

---

## 現状

- **サイトURL**: https://rt18-formula1-official-site.vercel.app
- **構成**: React製、Vercel deploy、GitHubと連携済み
- **DBなし**: 現時点では全データがlocalStorageで動いている
- **Supabase**: プロジェクト作成済み、Cursor連携済み
- **Cursor**: Free Plan、クレジット一時枯渇中（月次リセット待ち）

---

## 完了済み

- 文字色を黒基調に統一
- SNSアイコン下のリンクグリッド復活（note/Shop/Wishlist等）
- 日本語/英語切替（localStorageに保存）
- ヘッダーアイコン差し替え（rt18_formula1-icon.png）
- フッターの「Created by Manus」削除
- Admin管理画面の骨格追加
- `RT18_ADMIN_PASSWORD` をVercel環境変数に設定済み

## 未解決・残タスク

| 課題 | 状態 |
|---|---|
| ファビコン差し替え | プレースホルダーで対応済み（本番用は後日） |
| DB接続・実装 | Supabase準備済み |
| 画像がプレースホルダー | ManusのストレージURL死んでいる → Supabase Storageに移行で解決 |

---

## DB設計（確定）

### 方針
- **Supabase**（PostgreSQL + Storage）を使う
- 画像の実体はSupabase Storageに置き、DBにはURLのみ保持
- 日英カラムは最初から分離（`title_ja` / `title_en`）
- `body` は `jsonb` でPortfolio埋め込みブロックに対応

---

### テーブル構成

#### `news`
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

#### `portfolio`
```sql
create table portfolio (
  id uuid default gen_random_uuid() primary key,
  title_en text not null,
  title_ja text,
  body_en text,
  body_ja text,
  image_url text,
  sort_order int default 0,
  created_at timestamp default now()
);
```

#### `albums`
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
  created_at timestamp default now()
);
```

#### `album_relations`（アルバム同士の親子・多対多・無限ネスト）
```sql
create table album_relations (
  parent_id uuid references albums(id) on delete cascade,
  child_id uuid references albums(id) on delete cascade,
  sort_order int default 0,
  primary key (parent_id, child_id)
);
```

#### `album_news`（NewsとAlbumsの中間テーブル）
```sql
create table album_news (
  album_id uuid references albums(id) on delete cascade,
  news_id uuid references news(id) on delete cascade,
  sort_order int default 0,
  primary key (album_id, news_id)
);
```

#### `album_portfolio`（PortfolioとAlbumsの中間テーブル）
```sql
create table album_portfolio (
  album_id uuid references albums(id) on delete cascade,
  portfolio_id uuid references portfolio(id) on delete cascade,
  sort_order int default 0,
  primary key (album_id, portfolio_id)
);
```

---

### Supabase Storage バケット

| バケット名 | 用途 |
|---|---|
| `news-images` | News記事の画像 |
| `portfolio-images` | Portfolio作品画像 |

## 画像の仕組み
- 画像の実体はSupabase Storageに保存する
- StorageバケットはDBとは別物だが同じSupabaseプロジェクト内で管理
- Admin画面から画像をアップロード → Supabase Storageに保存される
- そのパブリックURLをDBのimage_urlカラムに文字列として保存
- フロント側はimage_urlを読んで<img>タグで表示する
- バケット構成:
  - news-images（News記事の画像）
  - portfolio-images（Portfolio作品画像）

---

## ページ構造（作るもの）

```
/news
├── /news/[id]（個別記事）
└── /backnumber
    └── /backnumber/[album_id]（号まとめ）

/portfolio
└── /albums
    └── /albums/[album_id]（作品まとめ）
```

- URLは `/albums/[id]` で統一も検討
- パンくずは直前に辿ってきたパスを表示
- 同じ親を持つ兄弟アルバムを「おすすめ」としてサジェスト表示
- BacknumberとPortfolioには壁を設ける（混在NG）
- ただし記事の中にPortfolio作品を埋め込むのはOK

---

## アルバム設計の思想

- アルバムが**タグ・カテゴリ・レコメンドエンジンを兼ねる**構造
- 同じ親を持つ兄弟アルバムが自動でサジェストに出る
- パンくず（直前パス）＋サジェスト（兄弟アルバム）の二層構造

---

## 将来フェーズ（今回は対象外）

- **ショップ機能**: ファンブック（デジタル）＋ファングッズ（物理）をStripe決済で販売
- 物理グッズがあるため: 配送先住所・在庫管理・発送ステータスが必要
- portfolioとショップは完全に別ライン（絵は販売しない）
- Phase 3として別途設計予定

---

## 次にやること

1. Supabaseにテーブルを作成（上記SQLを流す）
2. StorageバケットにNews/Portfolio画像をアップ
3. News・Portfolio・AlbumsのCRUD実装
4. Backnumber・Albumsページのルーティング実装
