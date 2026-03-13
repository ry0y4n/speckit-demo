# Quickstart: Azure App Service デプロイ & CI/CD パイプライン

**Date**: 2026-03-13  
**Feature**: [spec.md](spec.md)

## 前提条件

- Azure CLI がインストール済み（`az login` でログイン済み）
- GitHub CLI がインストール済み（`gh auth login` でログイン済み）
- Node.js 20 LTS がインストール済み
- Azure リソースが作成済み:
  - リソースグループ: `rg-taskify`
  - App Service: `taskify-dev`
  - PostgreSQL Flexible Server: `db-for-taskify`

## Step 1: Azure Entra ID フェデレーション資格情報のセットアップ

```bash
# App Registration 作成
az ad app create --display-name "taskify-github-actions"

# 出力された appId を記録
APP_CLIENT_ID=<出力された appId>
APP_OBJECT_ID=$(az ad app show --id $APP_CLIENT_ID --query id -o tsv)

# Service Principal 作成
az ad sp create --id $APP_CLIENT_ID

# Contributor ロール割り当て
SUB_ID=$(az account show --query id -o tsv)
az role assignment create \
  --assignee $APP_CLIENT_ID \
  --role "Contributor" \
  --scope "/subscriptions/$SUB_ID/resourceGroups/rg-taskify"

# フェデレーション資格情報作成（OWNER/REPO を実際の値に置換）
az ad app federated-credential create --id $APP_OBJECT_ID --parameters '{
  "name": "github-main-branch",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:OWNER/REPO:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

## Step 2: GitHub Secrets の設定

```bash
# OWNER/REPO を実際の値に置換
TENANT_ID=$(az account show --query tenantId -o tsv)

gh secret set AZURE_CLIENT_ID --body "$APP_CLIENT_ID"
gh secret set AZURE_TENANT_ID --body "$TENANT_ID"
gh secret set AZURE_SUBSCRIPTION_ID --body "$SUB_ID"
gh secret set DATABASE_URL --body "postgresql://USER:PASS@db-for-taskify.postgres.database.azure.com:5432/taskify?sslmode=require"
```

## Step 3: App Service の構成

```bash
# Node.js バージョン設定
az webapp config set \
  --resource-group rg-taskify \
  --name taskify-dev \
  --linux-fx-version "NODE|20-lts"

# 起動コマンド設定
az webapp config set \
  --resource-group rg-taskify \
  --name taskify-dev \
  --startup-file "node server.js"

# 環境変数設定
az webapp config appsettings set \
  --resource-group rg-taskify \
  --name taskify-dev \
  --settings \
    DATABASE_URL="postgresql://USER:PASS@db-for-taskify.postgres.database.azure.com:5432/taskify?sslmode=require" \
    NODE_ENV="production"
```

## Step 4: Next.js Standalone 設定の確認

`next.config.ts` に `output: 'standalone'` が設定されていることを確認:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

## Step 5: 手動デプロイ（初回確認）

```bash
# ビルド
npm run build

# 静的アセットコピー
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# Prisma ファイルコピー
cp -r prisma .next/standalone/
cp prisma.config.ts .next/standalone/

# マイグレーション実行
cd .next/standalone
DATABASE_URL="postgresql://USER:PASS@db-for-taskify.postgres.database.azure.com:5432/taskify?sslmode=require" \
  npx prisma migrate deploy
cd ../..

# App Service へデプロイ（zip deploy）
cd .next/standalone
zip -r ../../deploy.zip .
cd ../..
az webapp deploy \
  --resource-group rg-taskify \
  --name taskify-dev \
  --src-path deploy.zip \
  --type zip
```

## Step 6: 動作確認

ブラウザで `https://taskify-dev.azurewebsites.net` にアクセスし、ユーザー選択画面が表示されることを確認。

## Step 7: CI/CD の有効化

ワークフローファイルを main ブランチにプッシュすると、自動的に CI/CD パイプラインが有効化される:

```bash
git add .github/workflows/ci.yml .github/workflows/cd.yml
git commit -m "feat: add CI/CD pipeline for Azure App Service"
git push origin main
```

以降、main ブランチへの push/PR で CI が自動実行され、main への CI 成功後に CD が自動デプロイを行う。
