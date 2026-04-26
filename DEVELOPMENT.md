## 現状 (2026-04-25 更新)

- **サイトURL**: https://rt18-formula1-official-site.vercel.app
- **DB**: Supabase (PostgreSQL) 実装完了
- **ストレージ**: Cloudflare R2 実装完了 (Supabase Storage から移行)
- **認証**: Admin 認証 (Cookieベース) 実装完了
- **PWA**: 対応完了 (ホーム画面追加可能)

---

## 完了済み (直近の作業)

### 1. システム・基盤
- **ビルドエラー解消**: Supabase 環境変数が欠けている環境でもビルドが通るようガードを実装。
- **PWA化**: `manifest.ts` の作成と `appleWebApp` メタタグの設定。iOS/Android でアプリのように動作。
- **ストレージ移行**: 画像保存先を Supabase Storage から Cloudflare R2 に変更（パフォーマンスとコスト最適化）。
- **シェア機能刷新**: X (Twitter)、リンクコピー、OSネイティブシェアを統合。Instagram ストーリーズは検討の末削除。

### 2. UI/UX 改善
- **ヘッダー**: News 詳細ページでもヘッダーを固定表示。
- **デザイン**: 
  - セクション名の下の二重線を削除（シンプル化）。
  - セクション間の余白（前セクションの境界線と次セクションのタイトル間）を短縮。
- **Portfolio グリッド**:
  - 6列から3列に変更し、画像を大型化。
  - 画像下のタイトル・テキスト表示を追加。
- **管理画面**:
  - 投稿エラー（HTTP 413 等）の可視化。
  - 画像アップロード失敗時に投稿をブロックするガード実装。

---

## 現在の課題と解決方針

### 課題: 画像アップロードの 4.5MB 制限 (HTTP 413)
- **原因**: Vercel の API Route（サーバーレス関数）には 4.5MB のペイロード制限がある。高画質な画像を送ると Vercel 側で遮断される。
- **解決策**: **署名付きURL (Presigned URL)** 方式への切り替え。
  - Vercel は「アップロード権限」のみを発行し、ブラウザが直接 Cloudflare R2 へ大容量ファイルを送信する。

### 2026-04-26 追記: HTTP 413 対応の実装ログ
- `/api/admin/upload` を「ファイル受信API」から「署名URL発行API」へ変更。
- `lib/supabase-queries.ts` の `uploadImageToStorage()` を、`/api/admin/upload` で取得した `uploadUrl` に対してブラウザから `PUT` する実装に変更。
- `lib/r2.ts` を `getPresignedUrl()` + `buildR2ObjectKey()` 中心へ整理し、サーバーがファイル本体を受けない設計へ移行。
- `.env.example` に R2 必須環境変数 (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`) を追記。
- これにより、Vercel 経由アップロードで発生していた 413 を構造的に回避。

### 2026-04-26 追記: R2 画像アップロード障害の修正 (PR #1〜#4)

署名付きURL方式への移行後、画像が全くアップロードできない（表示されない）問題が発生。以下4つのPRで段階的に修正した。

#### PR #1: 署名不一致の修正
- **原因**: `PutObjectCommand` に `Metadata: { "Access-Control-Allow-Origin": "*" }` を含めていたため、署名付きURLが `x-amz-meta-access-control-allow-origin` ヘッダーを要求。ブラウザ側のPUTリクエストではこのヘッダーを送信しないため、R2が署名不一致で拒否。
- **修正**: `Metadata` をPutObjectCommandから削除。CORSはR2バケットレベルの設定で管理する。

#### PR #2: R2_PUBLIC_URL の必須化
- **原因**: `R2_PUBLIC_URL` 未設定時のデフォルト値が `https://pub-${R2_ACCOUNT_ID}.r2.dev` だったが、R2の公開URLはアカウントIDではなくバケット固有のハッシュを使用する。誤ったURLが生成され、画像はR2にアップロード済みにもかかわらず表示できなかった。
- **修正**: デフォルト値を削除し、`R2_PUBLIC_URL` を必須環境変数に変更。未設定時はエラーメッセージで正しい設定方法を案内。

#### PR #3: R2_PUBLIC_URL の自動正規化
- **原因**: Vercelの環境変数に `pub-xxx` のように `https://` や `.r2.dev` を含まない値が設定されていた。結果、画像URLが相対パスとして保存され404エラー。
- **修正**: `normalizeR2PublicUrl()` 関数を追加。`https://` や `.r2.dev` が欠けていても自動補完する。

#### PR #4: サーバー側アップロードフォールバック
- **目的**: 署名付きURL（CORS経由）が失敗した場合の安定性向上。
- **実装**:
  - `lib/r2.ts` に `uploadToR2()` 関数を追加（サーバー側から直接R2にアップロード）。
  - `/api/admin/upload-direct` エンドポイントを新設（FormDataでファイル受信→R2に直接アップロード）。
  - `uploadImageToStorage()` を改修: まず署名付きURLでアップロードを試行し、失敗時はサーバー経由にフォールバック。
- **注意**: サーバー経由のフォールバックにはVercelの4.5MBペイロード制限が適用される。

#### 環境変数の設定
- Vercelに `R2_PUBLIC_URL` を設定済み。値は Cloudflare Dashboard > R2 > バケット > Settings > Public access で確認可能。
- R2バケットのCORS設定は `r2-cors.json` の内容が適用済み。

### 課題: Cloudflare R2 の公開URL制限
- **現状**: `pub-*.r2.dev` ドメインを使用中だが、レートリミットがあり本番には非推奨。
- **解決策**: カスタムドメイン（例: `media.rt18-formula1.com`）を Cloudflare 上で設定する。

---

## 次にやること

1. ~~**署名付きURLの実装完了**~~: 完了済み（PR #1〜#4で修正・フォールバック含め実装完了）。
2. **問い合わせフォームの疎通**: Contact セクションに実際の送信ロジック（Resend 等）を統合。
3. **カレンダー機能の強化**: Google Calendar API 連携や iCal 書き出しの最適化。
4. **SEO/OGP 強化**: SNS シェア時のプレビュー画像の動的生成。
5. **R2 カスタムドメイン設定**: `pub-*.r2.dev` からカスタムドメインへの移行（レートリミット回避）。
