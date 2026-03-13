# Data Model: Azure App Service デプロイ & CI/CD パイプライン構築

**Date**: 2026-03-13  
**Feature**: [spec.md](spec.md)

## 概要

本機能ではアプリケーションのデータモデル（Prisma schema）に変更を加えない。既存の User, Project, Task, Comment エンティティはそのまま維持する。本ドキュメントでは、デプロイ・CI/CD に関連する構成エンティティを定義する。

## 構成エンティティ

### 1. Next.js ビルド構成

| 属性             | 値                                                           |
| ---------------- | ------------------------------------------------------------ |
| output           | `standalone`                                                 |
| 成果物パス       | `.next/standalone/`                                          |
| 静的アセット     | `.next/standalone/public/`, `.next/standalone/.next/static/` |
| エントリポイント | `server.js`                                                  |

**状態遷移:** なし（ビルド時に一度生成される静的成果物）

### 2. Azure App Service 環境設定

| 設定キー       | 用途                  | ソース                      |
| -------------- | --------------------- | --------------------------- |
| `DATABASE_URL` | PostgreSQL 接続文字列 | App Settings                |
| `NODE_ENV`     | 実行環境識別          | App Settings (`production`) |
| `PORT`         | HTTP リスンポート     | App Service 自動設定        |

**バリデーションルール:**

- `DATABASE_URL` は `postgresql://` で始まる有効な接続文字列であること
- `DATABASE_URL` には `sslmode=require` パラメータを含むこと
- `NODE_ENV` は `production` であること

### 3. GitHub Actions シークレット

| シークレット名          | 用途                                 | 機密性               |
| ----------------------- | ------------------------------------ | -------------------- |
| `AZURE_CLIENT_ID`       | OIDC 認証用クライアント ID           | 低（識別子のみ）     |
| `AZURE_TENANT_ID`       | OIDC 認証用テナント ID               | 低（識別子のみ）     |
| `AZURE_SUBSCRIPTION_ID` | Azure サブスクリプション ID          | 低（識別子のみ）     |
| `DATABASE_URL`          | マイグレーション実行用 DB 接続文字列 | 高（パスワード含む） |

### 4. Azure Entra ID フェデレーション資格情報

| 属性                 | 値                                            |
| -------------------- | --------------------------------------------- |
| App Registration 名  | `taskify-github-actions`                      |
| ロール               | `Contributor` (スコープ: rg-taskify)          |
| フェデレーション対象 | `repo:<OWNER>/<REPO>:ref:refs/heads/main`     |
| Issuer               | `https://token.actions.githubusercontent.com` |
| Audience             | `api://AzureADTokenExchange`                  |

## 既存データモデル（変更なし）

```
User ─┬── Task (AssignedTasks)
      └── Comment

Project ── Task ── Comment
```

既存の Prisma schema（`prisma/schema.prisma`）およびマイグレーション（`prisma/migrations/`）は変更不要。デプロイ先の Azure Database for PostgreSQL Flexible Server に対して `prisma migrate deploy` で既存マイグレーションを適用する。
