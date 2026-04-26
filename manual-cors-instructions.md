# Cloudflare R2 手動CORS設定手順

## 問題
ブラウザからR2への直接PUTリクエストが「Failed to fetch」エラーで失敗する。

## 解決策：CloudflareダッシュボードからCORS設定

### 1. Cloudflareダッシュボードにログイン
- https://dash.cloudflare.com/

### 2. R2 Object Storageに移動
- 左メニューから「R2 Object Storage」を選択

### 3. バケットを選択
- `rt18-formula1-official-site` バケットをクリック

### 4. CORS設定を追加
- 「Settings」タブをクリック
- 「CORS」セクションを見つけて「Configure CORS」をクリック
- 以下の設定を入力：

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

### 5. 設定を保存
- 「Save」ボタンをクリックして設定を適用

### 6. 確認
- 設定が反映されるまで数分待つ
- テストページで再度アップロードを試す

## 代替手段：Cloudflare APIを使用

もしダッシュボードが利用できない場合：

```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets/{bucket_name}/cors" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '[
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
  ]'
```

## 必要な情報
- Account ID: 76e067622140110530ca3ec6c8583069
- Bucket Name: rt18-formula1-official-site
