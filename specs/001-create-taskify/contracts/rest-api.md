# REST API Contracts: Taskify

**Feature**: 001-create-taskify
**Date**: 2026-02-24
**Base URL**: `/api`
**Format**: JSON
**Implementation**: Next.js Route Handlers (`app/api/`) + Server Actions (`app/actions/`)

---

## Overview

| Method | Endpoint                  | Description                  | Implementation |
| ------ | ------------------------- | ---------------------------- | -------------- |
| GET    | `/api/users`              | ユーザー一覧取得             | Route Handler  |
| GET    | `/api/projects`           | プロジェクト一覧取得         | Route Handler  |
| GET    | `/api/projects/:id/tasks` | プロジェクトのタスク一覧取得 | Route Handler  |
| PUT    | `/api/tasks/:id/status`   | タスクステータス更新         | Server Action  |
| PUT    | `/api/tasks/:id/assignee` | タスク担当者更新             | Server Action  |
| GET    | `/api/tasks/:id/comments` | タスクのコメント一覧取得     | Route Handler  |
| POST   | `/api/tasks/:id/comments` | コメント追加                 | Server Action  |
| PUT    | `/api/comments/:id`       | コメント編集                 | Server Action  |
| DELETE | `/api/comments/:id`       | コメント削除                 | Server Action  |

---

## 1. Users

### GET /api/users

ユーザー一覧を取得する。

**Request**: なし（パラメータ不要）

**Response**: `200 OK`

```json
{
  "users": [
    {
      "id": "clx1abc123",
      "name": "佐藤 美咲",
      "role": "PRODUCT_MANAGER",
      "avatarColor": "#8B5CF6"
    },
    {
      "id": "clx2def456",
      "name": "田中 健太",
      "role": "ENGINEER",
      "avatarColor": "#3B82F6"
    }
  ]
}
```

**Notes**: 常に全 5 名を返す。フィルタリング不要。

---

## 2. Projects

### GET /api/projects

プロジェクト一覧を取得する。

**Request**: なし（パラメータ不要）

**Response**: `200 OK`

```json
{
  "projects": [
    {
      "id": "clx3ghi789",
      "name": "Taskify v1.0 開発",
      "description": "かんばんボード機能の初期実装",
      "taskCount": 6
    }
  ]
}
```

**Notes**: `taskCount` はプロジェクトに紐づくタスク総数。一覧画面での表示用。

---

## 3. Tasks

### GET /api/projects/:id/tasks

指定プロジェクトのタスク一覧を、ステータス別・位置順で取得する。

**Path Parameters**:

- `id` (string, required): プロジェクト ID

**Response**: `200 OK`

```json
{
  "tasks": [
    {
      "id": "clx4jkl012",
      "title": "ログイン画面のデザイン",
      "description": "モックアップの作成と確認",
      "status": "TODO",
      "position": 0,
      "assignee": {
        "id": "clx2def456",
        "name": "田中 健太",
        "avatarColor": "#3B82F6"
      },
      "commentCount": 3,
      "createdAt": "2026-02-20T09:00:00.000Z",
      "updatedAt": "2026-02-23T14:30:00.000Z"
    },
    {
      "id": "clx5mno345",
      "title": "API 設計書の作成",
      "description": null,
      "status": "IN_PROGRESS",
      "position": 0,
      "assignee": null,
      "commentCount": 0,
      "createdAt": "2026-02-21T10:00:00.000Z",
      "updatedAt": "2026-02-21T10:00:00.000Z"
    }
  ]
}
```

**Error**: `404 Not Found` — プロジェクトが存在しない場合

```json
{
  "error": "指定されたプロジェクトが見つかりません"
}
```

### PUT /api/tasks/:id/status (Server Action)

タスクのステータスとカラム内位置を更新する（ドラッグ＆ドロップ用）。

**Implementation**: `app/actions/tasks.ts` > `updateTaskStatus()`

**Input**:

```typescript
interface UpdateTaskStatusInput {
  taskId: string;
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  position: number; // 移動先カラム内の位置
}
```

**Success Response**: 更新後のタスクオブジェクト

**Behavior**:

- 同一カラム内ドロップ: `position` のみ更新
- 異なるカラムへのドロップ: `status` + `position` を更新
- 影響を受ける他タスクの `position` を自動再計算

**Error Cases**:

- タスクが存在しない → エラーメッセージ返却
- 無効な status 値 → バリデーションエラー

### PUT /api/tasks/:id/assignee (Server Action)

タスクの担当者を変更する。

**Implementation**: `app/actions/tasks.ts` > `assignTask()`

**Input**:

```typescript
interface AssignTaskInput {
  taskId: string;
  assigneeId: string | null; // null = 担当者なし
}
```

**Success Response**: 更新後のタスクオブジェクト（assignee 情報含む）

**Error Cases**:

- タスクが存在しない → エラーメッセージ返却
- assigneeId が無効なユーザー → エラーメッセージ返却

---

## 4. Comments

### GET /api/tasks/:id/comments

指定タスクのコメント一覧を作成日時の昇順で取得する。

**Path Parameters**:

- `id` (string, required): タスク ID

**Response**: `200 OK`

```json
{
  "comments": [
    {
      "id": "clx6pqr678",
      "body": "デザインの方向性について相談したいです",
      "createdAt": "2026-02-22T11:00:00.000Z",
      "updatedAt": "2026-02-22T11:00:00.000Z",
      "author": {
        "id": "clx1abc123",
        "name": "佐藤 美咲",
        "avatarColor": "#8B5CF6"
      }
    }
  ]
}
```

**Error**: `404 Not Found` — タスクが存在しない場合

### POST /api/tasks/:id/comments (Server Action)

タスクにコメントを追加する。

**Implementation**: `app/actions/comments.ts` > `createComment()`

**Input**:

```typescript
interface CreateCommentInput {
  taskId: string;
  authorId: string;
  body: string; // 1〜5000 文字、空白のみ不可
}
```

**Success Response**: 作成されたコメントオブジェクト

**Error Cases**:

- `body` が空白のみ → `"コメント内容を入力してください"`
- `body` が 5000 文字超 → `"コメントは 5000 文字以内で入力してください"`
- タスクが存在しない → エラーメッセージ返却

### PUT /api/comments/:id (Server Action)

自分が作成したコメントを編集する。

**Implementation**: `app/actions/comments.ts` > `updateComment()`

**Input**:

```typescript
interface UpdateCommentInput {
  commentId: string;
  currentUserId: string; // アクセス制御用
  body: string; // 1〜5000 文字、空白のみ不可
}
```

**Success Response**: 更新後のコメントオブジェクト

**Error Cases**:

- `currentUserId !== comment.authorId` → `"このコメントを編集する権限がありません"`
- `body` が空白のみ → `"コメント内容を入力してください"`
- コメントが存在しない → エラーメッセージ返却

### DELETE /api/comments/:id (Server Action)

自分が作成したコメントを削除する。

**Implementation**: `app/actions/comments.ts` > `deleteComment()`

**Input**:

```typescript
interface DeleteCommentInput {
  commentId: string;
  currentUserId: string; // アクセス制御用
}
```

**Success Response**: `{ success: true }`

**Error Cases**:

- `currentUserId !== comment.authorId` → `"このコメントを削除する権限がありません"`
- コメントが存在しない → エラーメッセージ返却

---

## 5. Common Error Format

すべてのエラーレスポンスは以下の統一フォーマットに従う:

```json
{
  "error": "ユーザー向けエラーメッセージ（技術詳細は含まない）"
}
```

**HTTP Status Codes**:

- `200`: 成功
- `400`: バリデーションエラー（不正な入力）
- `403`: 権限エラー（他ユーザーのコメント操作）
- `404`: リソース不存在
- `500`: サーバー内部エラー

---

## 6. Header Convention

**Request Headers**:

- `X-Current-User-Id`: 現在のユーザー ID（認証なしのため、ヘッダーまたは Cookie で渡す）

**Response Headers**:

- `Content-Type: application/json`

**Notes**:

- 認証がないため、`X-Current-User-Id` はフロントエンドから送信される。Server Actions では引数として `currentUserId` を受け取る。
- 本番環境では JWT/セッションベースの認証に置き換える想定。
