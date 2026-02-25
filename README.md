# Taskify

チームのタスク管理かんばんボードアプリケーション。ドラッグ＆ドロップでタスクのステータス移動、担当者割り当て、コメント機能を備えた Web アプリです。

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

## 機能

- **ユーザー選択** — 5 名の事前定義ユーザー（PM 1 名 + エンジニア 4 名）から選択
- **プロジェクト一覧** — 3 つのサンプルプロジェクトをタスク数付きで表示
- **かんばんボード** — 4 カラム（未着手・進行中・レビュー中・完了）のドラッグ＆ドロップ対応ボード
- **担当者割り当て** — タスクカードから担当者を選択・変更
- **コメント** — タスク詳細パネルでコメントの追加・編集・削除（自分のコメントのみ操作可能）

## 技術スタック

| カテゴリ       | 技術                               |
| -------------- | ---------------------------------- |
| フレームワーク | Next.js 16 (App Router, Turbopack) |
| 言語           | TypeScript 5.9 (strict mode)       |
| ORM            | Prisma 7 (PostgreSQL adapter)      |
| DB             | PostgreSQL 16                      |
| DnD            | @dnd-kit/core + @dnd-kit/sortable  |
| スタイリング   | Tailwind CSS 4                     |
| テスト         | Vitest, Playwright                 |

## セットアップ

### 前提条件

- Node.js 20.x 以上
- PostgreSQL 16.x（ローカルまたは Docker）

### 1. インストール

```bash
git clone <repository-url>
cd speckit-demo
npm install
```

### 2. データベースの準備

```bash
# Docker で PostgreSQL を起動
docker run --name taskify-db \
  -e POSTGRES_USER=taskify \
  -e POSTGRES_PASSWORD=taskify \
  -e POSTGRES_DB=taskify \
  -p 5432:5432 \
  -d postgres:16
```

### 3. 環境変数

```bash
cp .env.example .env
```

`.env` を編集し、接続先を設定:

```env
DATABASE_URL="postgresql://taskify:taskify@localhost:5432/taskify"
```

### 4. DB 初期化 & シード

```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 を開くとユーザー選択画面が表示されます。

## スクリプト

| コマンド           | 説明                         |
| ------------------ | ---------------------------- |
| `npm run dev`      | 開発サーバー起動             |
| `npm run build`    | プロダクションビルド         |
| `npm run start`    | プロダクションサーバー起動   |
| `npm run lint`     | ESLint 実行                  |
| `npm run format`   | Prettier でフォーマット      |
| `npm test`         | Vitest でユニットテスト実行  |
| `npm run test:e2e` | Playwright で E2E テスト実行 |

## プロジェクト構成

```
src/
├── app/
│   ├── api/                    # REST API Route Handlers
│   │   ├── users/              # GET /api/users
│   │   ├── projects/           # GET /api/projects, GET /api/projects/:id/tasks
│   │   └── tasks/              # GET /api/tasks/:id/comments
│   ├── actions/                # Server Actions (tasks, comments)
│   ├── projects/               # プロジェクト一覧 & かんばんボードページ
│   ├── layout.tsx              # ルートレイアウト
│   └── page.tsx                # ユーザー選択画面
├── components/
│   ├── board/                  # KanbanBoard, Column, TaskCard, TaskDetail
│   ├── comments/               # CommentForm, CommentList
│   └── ui/                     # Button, Card, Avatar, Badge
├── hooks/                      # useCurrentUser, useOptimisticTasks
├── lib/                        # db.ts, constants.ts
└── types/                      # 共有型定義
prisma/
├── schema.prisma               # データモデル定義
└── seed.ts                     # サンプルデータ
specs/
└── 001-create-taskify/         # 機能仕様・設計ドキュメント
```

## データモデル

```
User ──< Task ──< Comment
           │
Project ──┘
```

- **User**: ユーザー（PM / エンジニア）
- **Project**: プロジェクト
- **Task**: タスク（4 ステータス: TODO, IN_PROGRESS, IN_REVIEW, DONE）
- **Comment**: コメント（著者のみ編集・削除可）

## ライセンス

MIT
