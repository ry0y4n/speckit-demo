# Contract: GitHub Actions ワークフロー定義

**Date**: 2026-03-13  
**Feature**: [spec.md](../spec.md)

## CI ワークフロー (`ci.yml`)

### トリガー条件

| イベント       | ブランチ |
| -------------- | -------- |
| `push`         | `main`   |
| `pull_request` | `main`   |

### 入出力契約

**入力:**

- ソースコード（リポジトリ全体）
- `package-lock.json`（依存関係の確定）

**出力:**

- ビルド・テスト結果（コミットステータス / PR チェック）
- `standalone-build` アーティファクト（main ブランチへの push 時のみ）

### ジョブ構成

```yaml
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      # 1. コードチェックアウト
      # 2. Node.js 20 セットアップ（npm キャッシュ有効）
      # 3. npm ci
      # 4. ユニットテスト実行（vitest run）
      # 5. Next.js ビルド（standalone）
      # 6. 静的アセットコピー（public/, .next/static/）
      # 7. Prisma ファイルコピー（prisma/, prisma.config.ts）
      # 8. アーティファクトアップロード（main push 時のみ）
```

### Concurrency

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

---

## CD ワークフロー (`cd.yml`)

### トリガー条件

| イベント       | 条件                                       |
| -------------- | ------------------------------------------ |
| `workflow_run` | CI ワークフロー完了 & 成功 & main ブランチ |

### 入出力契約

**入力:**

- `standalone-build` アーティファクト（CI ワークフローから）
- GitHub Secrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `DATABASE_URL`

**出力:**

- Azure App Service（taskify-dev）への更新されたデプロイ
- マイグレーション適用済みデータベース

### パーミッション

```yaml
permissions:
  id-token: write # OIDC 認証
  contents: read # コード読み取り
```

### ジョブ構成

```yaml
jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    steps:
      # 1. アーティファクトダウンロード（standalone-build）
      # 2. Azure Login（OIDC）
      # 3. Prisma マイグレーション実行
      # 4. Azure App Service デプロイ
```

### Concurrency

```yaml
concurrency:
  group: cd-production
  cancel-in-progress: false
```

---

## Azure App Service 契約

### エンドポイント

| 項目       | 値                                                |
| ---------- | ------------------------------------------------- |
| URL        | `https://taskify-dev.azurewebsites.net`           |
| プロトコル | HTTPS（App Service 提供の TLS）                   |
| ポート     | App Service が `PORT` 環境変数で指定（内部 8080） |

### ヘルスチェック

App Service のデフォルトヘルスチェック（HTTP 200 応答）を使用。Next.js のルートパス `/` が正常応答すれば Healthy と判定。

### 起動コマンド

```
node server.js
```
