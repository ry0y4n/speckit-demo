# Research: Azure App Service デプロイ & CI/CD パイプライン構築

**Date**: 2026-03-13  
**Feature**: [spec.md](spec.md)

## Topic 1: Next.js Standalone モードと Azure App Service

### Decision

`output: 'standalone'` を `next.config.ts` に設定し、自己完結型の `.next/standalone` フォルダを App Service にデプロイする。起動コマンドは `node server.js`。

### Rationale

Standalone モードは `@vercel/nft` でランタイムに必要なファイルのみをトレースし、デプロイ成果物を最小化する（~50MB vs 500MB+）。App Service の zip デプロイサイズ制限にも適合し、サーバー上での `npm install` が不要。

### Key Implementation Details

**next.config.ts:**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

**ビルド後のコピー手順:**

```bash
next build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
```

**Standalone 出力構造:**

```
.next/standalone/
├── server.js          # 最小 Node.js サーバー
├── .next/
│   └── static/        # 手動コピー必須
├── public/            # 手動コピー必須
├── node_modules/      # トレースされた依存のみ
└── package.json
```

**起動コマンド:** `node server.js`（`process.env.PORT` を自動読み取り、`HOSTNAME` は `0.0.0.0` デフォルト）

**注意事項:**

- `public/` と `.next/static/` は自動コピーされないため、ビルド後に手動コピーが必要
- `@prisma/adapter-pg`（ドライバーアダプター）を使用しているため、ネイティブエンジンバイナリは不要

### Alternatives Considered

| 代替案                                    | 却下理由                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| 標準 `next build` + 完全な `node_modules` | 成果物サイズが巨大、App Service 上での `npm install` が遅く不安定                     |
| Docker コンテナ on App Service            | PoC には過剰、ビルド複雑性が増加                                                      |
| `output: 'export'`（静的出力）            | Server Components、Server Actions、API Routes を使用しており Node.js ランタイムが必要 |

---

## Topic 2: GitHub Actions OIDC 認証

### Decision

`azure/login@v2` で OpenID Connect（OIDC）フェデレーション認証を使用。GitHub Secrets にはクライアント ID・テナント ID・サブスクリプション ID のみ格納（パスワードなし）。

### Rationale

OIDC は Microsoft 推奨のアプローチ。シークレットローテーション不要、短期トークンのみで露出リスク低減。FR-008 のシークレットレス要件に準拠。

### Key Implementation Details

**必要な GitHub Secrets:**
| Secret | ソース |
|--------|--------|
| `AZURE_CLIENT_ID` | Entra App Registration → Application (client) ID |
| `AZURE_TENANT_ID` | Entra → Directory (tenant) ID |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription → Subscription ID |

**ワークフロー permissions ブロック:**

```yaml
permissions:
  id-token: write # OIDC JWT リクエストに必須
  contents: read # コードチェックアウトに必須
```

**Azure Login ステップ:**

```yaml
- name: Azure Login (OIDC)
  uses: azure/login@v2
  with:
    client-id: ${{ secrets.AZURE_CLIENT_ID }}
    tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

**Azure Entra ID でのフェデレーション資格情報セットアップ:**

```bash
# 1. App Registration 作成
az ad app create --display-name "taskify-github-actions"

# 2. Service Principal 作成
az ad sp create --id <APP_CLIENT_ID>

# 3. リソースグループに Contributor ロール割り当て
az role assignment create \
  --assignee <APP_CLIENT_ID> \
  --role "Contributor" \
  --scope "/subscriptions/<SUB_ID>/resourceGroups/rg-taskify"

# 4. GitHub リポジトリのフェデレーション資格情報追加
az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
  "name": "github-main-branch",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<OWNER>/<REPO>:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

**注意:** `subject` クレームは GitHub コンテキストと完全一致が必要。

### Alternatives Considered

| 代替案                                          | 却下理由                                                |
| ----------------------------------------------- | ------------------------------------------------------- |
| サービスプリンシパル + クライアントシークレット | シークレットローテーション必要、漏洩リスク、FR-008 違反 |
| Azure マネージド ID                             | GitHub ホストランナーでは使用不可                       |
| Publish Profile                                 | 特定サービス限定、柔軟性低、シークレット内包            |

---

## Topic 3: GitHub Actions CI/CD ワークフロー構成

### Decision

CI（`ci.yml`）と CD（`cd.yml`）の 2 ファイルに分離。CI は push/PR でビルド・テスト実行。CD は main ブランチの CI 成功後に自動デプロイ。Concurrency グループで同時デプロイを防止。

### Rationale

CI/CD の分離により責務が明確化。アーティファクト受け渡しで CD での再ビルドを回避。Concurrency グループで FR-009（逐次デプロイ）を満たす。

### Key Implementation Details

**CI ワークフロー構成:**

- トリガー: `push` (main), `pull_request` (main)
- Concurrency: `ci-${{ github.ref }}`, `cancel-in-progress: true`
- ステップ: checkout → setup-node (cache: npm) → npm ci → vitest run → npm run build → static コピー → prisma コピー → artifact upload

**CD ワークフロー構成:**

- トリガー: `workflow_run` (CI 完了, main ブランチ)
- Concurrency: `cd-production`, `cancel-in-progress: false`（進行中のデプロイはキャンセルしない）
- ステップ: artifact download → azure/login (OIDC) → prisma migrate deploy → azure/webapps-deploy

**キャッシュ:** `actions/setup-node@v4` の `cache: 'npm'` で `package-lock.json` ベースのキャッシュ。

**vitest 実行:** `npx vitest run`（`--reporter=github-actions` でインライン注釈対応）

**デプロイアクション:** `azure/webapps-deploy@v3` で App Service にフォルダをデプロイ。

### Alternatives Considered

| 代替案                              | 却下理由                                                  |
| ----------------------------------- | --------------------------------------------------------- |
| 単一ワークフロー（CI+CD 一体型）    | PR 実行時にデプロイジョブのスキップロジックが必要で複雑化 |
| CD での再ビルド                     | 時間・コンピュートの無駄、ビルド出力の差異リスク          |
| `workflow_dispatch`（手動トリガー） | FR-004 の自動デプロイ要件に違反                           |

---

## Topic 4: Prisma マイグレーション

### Decision

CD（デプロイ）フェーズで `npx prisma migrate deploy` を実行。CI では実行しない。

### Rationale

`prisma migrate deploy` は保留中のマイグレーションを適用するのみ（新規作成しない）。本番 DB への適用はデプロイ時に行う必要がある。`_prisma_migrations` テーブルで冪等性を保証。

### Key Implementation Details

**CD ワークフローでのマイグレーションステップ:**

```yaml
- name: Run Prisma Migrations
  working-directory: ./deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: npx prisma migrate deploy
```

**接続文字列:** `DATABASE_URL` を GitHub Secrets に格納。

- 形式: `postgresql://user:pass@db-for-taskify.postgres.database.azure.com:5432/taskify?sslmode=require`
- DB 資格情報は OIDC 化できないため、これが唯一のシークレット

**注意事項:**

- CI アーティファクトに `prisma/` と `prisma.config.ts` を含める必要あり
- マイグレーション失敗時はデプロイを中断（非ゼロ終了）

### Alternatives Considered

| 代替案                                       | 却下理由                                                             |
| -------------------------------------------- | -------------------------------------------------------------------- |
| App Service 起動スクリプトでマイグレーション | タイムアウトリスク、デバッグ困難、複数インスタンスの競合             |
| CI でのみ実行                                | CI データベースのみ適用、本番 DB 未適用                              |
| `prisma db push`                             | 本番環境に不適切（マイグレーションファイル不使用、データ損失リスク） |
| 手動マイグレーション                         | FR-007 違反（デプロイプロセスの一部として実行必須）                  |

---

## Topic 5: Azure App Service Node.js 構成

### Decision

App Service Linux / Node.js 20 LTS ランタイム、起動コマンド `node server.js`、App Settings で環境変数管理。

### Rationale

Node.js 20 LTS はプロジェクトの開発環境と一致。Standalone の `server.js` は最も効率的な起動方法。App Settings は App Service の標準的な環境変数注入方法。

### Key Implementation Details

**Node.js バージョン設定:**

```bash
az webapp config set \
  --resource-group rg-taskify \
  --name taskify-dev \
  --linux-fx-version "NODE|20-lts"
```

**起動コマンド設定:**

```bash
az webapp config set \
  --resource-group rg-taskify \
  --name taskify-dev \
  --startup-file "node server.js"
```

**必要な App Settings:**
| 設定 | 用途 |
|------|------|
| `DATABASE_URL` | Prisma の PostgreSQL 接続文字列 |
| `NODE_ENV` | `production`（App Service が自動設定する場合あり） |
| `PORT` | App Service が自動設定（オーバーライド不可） |

**App Settings 設定:**

```bash
az webapp config appsettings set \
  --resource-group rg-taskify \
  --name taskify-dev \
  --settings \
    DATABASE_URL="postgresql://user:pass@db-for-taskify.postgres.database.azure.com:5432/taskify?sslmode=require" \
    NODE_ENV="production"
```

**注意事項:**

- Linux App Service は Node.js ランタイムの Docker コンテナ内で実行
- PM2 は不要（Standalone `server.js` がプロセス管理を処理）
- デプロイ先パス: `/home/site/wwwroot/`
- `WEBSITES_CONTAINER_START_TIME_LIMIT` デフォルト 230 秒（Next.js コールドスタートに十分）

### Alternatives Considered

| 代替案          | 却下理由                                                |
| --------------- | ------------------------------------------------------- |
| Node.js 22 LTS  | プロジェクトが Node.js 20 をターゲットとしている        |
| PM2 起動        | 複雑性増加、Standalone `server.js` で十分               |
| `npm start`     | 完全な `node_modules` が必要、Standalone モードと非互換 |
| Azure Key Vault | PoC には過剰、App Settings で十分                       |
