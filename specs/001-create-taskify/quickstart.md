# Quickstart: Taskify

**Feature**: 001-create-taskify
**Date**: 2026-02-24

---

## Prerequisites

- **Node.js**: 20.x 以上
- **PostgreSQL**: 16.x（ローカルまたは Docker）
- **npm**: 10.x 以上

---

## 1. プロジェクトセットアップ

```bash
# リポジトリのクローン & ブランチ切り替え
git clone <repository-url>
cd speckit-demo
git checkout 001-create-taskify

# 依存関係のインストール
npm install
```

## 2. データベースの準備

### Option A: Docker（推奨）

```bash
# PostgreSQL コンテナの起動
docker run --name taskify-db \
  -e POSTGRES_USER=taskify \
  -e POSTGRES_PASSWORD=taskify \
  -e POSTGRES_DB=taskify \
  -p 5432:5432 \
  -d postgres:16

# 接続確認
docker exec -it taskify-db psql -U taskify -d taskify -c "SELECT 1"
```

### Option B: ローカル PostgreSQL

```bash
# データベース作成
createdb taskify
```

## 3. 環境変数の設定

```bash
# .env ファイルを作成
cp .env.example .env
```

`.env` の内容:

```env
DATABASE_URL="postgresql://taskify:taskify@localhost:5432/taskify"
```

## 4. データベースの初期化

```bash
# Prisma マイグレーション実行
npx prisma migrate dev --name init

# サンプルデータ投入
npx prisma db seed

# （任意）Prisma Studio でデータ確認
npx prisma studio
```

## 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開くと、ユーザー選択画面が表示されます。

---

## 動作確認手順

### ユーザー選択 → プロジェクト一覧（US1）

1. http://localhost:3000 にアクセス
2. 5 名のユーザーが表示されることを確認
3. いずれかのユーザーをクリック
4. 3 つのサンプルプロジェクトが一覧表示されることを確認

### かんばんボード（US2）

1. プロジェクト一覧からプロジェクトをクリック
2. 「未着手」「進行中」「レビュー中」「完了」の 4 カラムが表示されることを確認
3. タスクカードを別のカラムにドラッグ＆ドロップ
4. 自分に割り当てられたカードが異なる色で表示されることを確認

### タスク割り当て（US3）

1. かんばんボード上のタスクカードの割り当てボタンをクリック
2. ユーザーリストから別のユーザーを選択
3. 割り当てが更新され、カードの色が変わることを確認

### コメント（US4）

1. タスクカードをクリックして詳細を表示
2. コメントを入力して送信
3. 自分のコメントに編集・削除ボタンが表示されることを確認
4. 他のユーザーのコメントには編集・削除ボタンがないことを確認

---

## テストの実行

```bash
# ユニットテスト + 結合テスト
npm run test

# カバレッジ付き
npm run test:coverage

# E2E テスト（開発サーバーが起動している状態で）
npm run test:e2e

# E2E テスト（サーバー自動起動）
npm run test:e2e:ci
```

---

## 主要コマンド一覧

| Command                  | Description                               |
| ------------------------ | ----------------------------------------- |
| `npm run dev`            | 開発サーバー起動（http://localhost:3000） |
| `npm run build`          | プロダクションビルド                      |
| `npm run start`          | プロダクションサーバー起動                |
| `npm run test`           | Vitest ユニット/結合テスト実行            |
| `npm run test:coverage`  | テストカバレッジ付き実行                  |
| `npm run test:e2e`       | Playwright E2E テスト実行                 |
| `npm run lint`           | ESLint 実行                               |
| `npm run format`         | Prettier フォーマット実行                 |
| `npx prisma studio`      | Prisma Studio（データブラウザ）           |
| `npx prisma migrate dev` | マイグレーション作成・実行                |
| `npx prisma db seed`     | サンプルデータ投入                        |

---

## トラブルシューティング

### PostgreSQL に接続できない

```bash
# Docker の状態確認
docker ps | grep taskify-db

# コンテナが停止している場合
docker start taskify-db

# 接続テスト
psql "postgresql://taskify:taskify@localhost:5432/taskify"
```

### Prisma マイグレーションエラー

```bash
# データベースをリセットして再作成
npx prisma migrate reset

# マイグレーション履歴の確認
npx prisma migrate status
```

### ポート 3000 が使用中

```bash
# 使用中のプロセスを確認
lsof -i :3000

# 別のポートで起動
PORT=3001 npm run dev
```
