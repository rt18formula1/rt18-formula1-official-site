#!/bin/bash

# Cloudflare R2 CORS設定スクリプト
# このスクリプトはR2バケットにCORS設定を適用します

# 環境変数チェック
if [ -z "$R2_ACCOUNT_ID" ] || [ -z "$R2_ACCESS_KEY_ID" ] || [ -z "$R2_SECRET_ACCESS_KEY" ] || [ -z "$R2_BUCKET_NAME" ]; then
    echo "Error: R2環境変数が設定されていません"
    echo "必要な環境変数:"
    echo "- R2_ACCOUNT_ID"
    echo "- R2_ACCESS_KEY_ID"
    echo "- R2_SECRET_ACCESS_KEY"
    echo "- R2_BUCKET_NAME"
    exit 1
fi

echo "R2バケットにCORS設定を適用中..."

# AWS CLIを使用してCORS設定を適用
aws s3api put-bucket-cors \
    --bucket "$R2_BUCKET_NAME" \
    --cors-configuration file://r2-cors.json \
    --endpoint-url "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com" \
    --region auto

if [ $? -eq 0 ]; then
    echo "✅ CORS設定が正常に適用されました"
else
    echo "❌ CORS設定の適用に失敗しました"
    echo "AWS CLIがインストールされていることを確認してください"
    exit 1
fi
