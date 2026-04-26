# Cloudflare R2 CORS設定

## HTTP 413エラー解決のためのCORS設定

### 問題
ブラウザから直接Cloudflare R2にPUTリクエストを送信する際にCORSエラーが発生し、"Failed to fetch"エラーが表示される。

### 解決策

#### 1. R2バケットにCORS設定を適用

```bash
# AWS CLIをインストール後、以下のコマンドを実行
./scripts/setup-r2-cors.sh
```

または手動で設定：

```bash
aws s3api put-bucket-cors \
    --bucket "YOUR_BUCKET_NAME" \
    --cors-configuration file://r2-cors.json \
    --endpoint-url "https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com" \
    --region auto
```

#### 2. CORS設定ファイル (`r2-cors.json`)

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://rt18-formula1-official-site.vercel.app"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "Content-Type",
      "Authorization",
      "Content-MD5"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

#### 3. アプリケーション側の修正

- `lib/r2.ts`: 署名付きURL生成時にCORS対応ヘッダーを追加
- `lib/supabase-queries.ts`: PUTリクエストにCORSヘッダーを追加
- エラーハンドリングを改善して詳細なログを出力

### 確認方法

1. 管理画面 (`/admin`) にアクセス
2. 新規投稿作成で画像をアップロード
3. ブラウザの開発者ツールでネットワークリクエストを確認
4. CORSエラーが発生しないことを確認

### 環境変数の確認

以下の環境変数が設定されていることを確認：

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
