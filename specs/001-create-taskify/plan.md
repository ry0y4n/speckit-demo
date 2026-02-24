# Implementation Plan: Taskify 作成

**Branch**: `001-create-taskify` | **Date**: 2026-02-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-create-taskify/spec.md`

## Summary

チームの生産性向上プラットフォーム「Taskify」の初期フェーズを構築する。事前定義された 5 名のユーザー（PM 1 名 + エンジニア 4 名）が、3 つのサンプルプロジェクトのかんばんボード上でタスク管理（ステータス移動・担当者割り当て・コメント）を行える Web アプリケーション。バックエンドは TypeScript + PostgreSQL の REST API、フロントエンドは Next.js でドラッグ＆ドロップ対応のかんばんボードとリアルタイム更新を実現する。

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 15 (フルスタック — Route Handlers + Server Actions), @dnd-kit/core + @dnd-kit/sortable (ドラッグ＆ドロップ), Prisma 7.x (ORM), Tailwind CSS 4 (スタイリング)
**Storage**: PostgreSQL 16
**Testing**: Vitest (ユニット/結合テスト), Playwright (E2E テスト)
**Target Platform**: Web ブラウザ (デスクトップ優先、モバイル対応)
**Project Type**: Web アプリケーション (Next.js フルスタック — 単一デプロイ)
**Performance Goals**: API p95 < 200ms、LCP < 2.5s、ドラッグ＆ドロップ操作 < 200ms (INP)
**Constraints**: ログイン認証なし (ユーザー選択のみ)、初期フェーズのためリアルタイム同期は対象外、データは PostgreSQL に永続化
**Scale/Scope**: 5 ユーザー、3 プロジェクト、テストフェーズのため小規模

> **アーキテクチャ変更 (Phase 0 研究結果)**: 当初の計画では Express/Fastify 別サーバーを想定していたが、研究の結果 Next.js Route Handlers + Server Actions で REST API を提供する単一デプロイ構成に変更。詳細は [research.md](research.md) §2, §4 を参照。根拠: YAGNI 原則（憲法「シンプルさの優先」）、単一コンシューマー、型共有の自動化。

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### 原則 I: コード品質

- ✅ TypeScript の厳格モード (`strict: true`) をバックエンド・フロントエンド両方で有効化
- ✅ ESLint + Prettier をプロジェクト全体で統一設定、CI で自動実行
- ✅ バックエンド API はルート・サービス・リポジトリの責務分離を採用
- ✅ フロントエンドは Next.js App Router のファイルベース規約に従う

### 原則 II: テスト標準

- ✅ Vitest でユニットテスト・結合テストを実施（カバレッジ 80% 目標）
- ✅ Playwright で主要ユーザージャーニー（US1〜US4）の E2E テストを実施
- ✅ テストは CI パイプラインで自動実行し、失敗時にマージブロック
- ✅ テスト命名規約: `describe("機能")` > `it("条件_期待結果")`

### 原則 III: ユーザー体験の一貫性

- ✅ Tailwind CSS でデザインシステム（カラー・スペーシング・タイポグラフィ）を統一
- ✅ ドラッグ＆ドロップ・カード色分け・コメント操作で統一的なインタラクションパターン
- ✅ エラーメッセージはユーザー向けに明確化（技術詳細を露出しない）
- ✅ キーボード操作対応（@dnd-kit はキーボード DnD をサポート）

### 原則 IV: パフォーマンス要件

- ✅ API p95 < 200ms: PostgreSQL インデックス適切設定 + 軽量クエリ設計
- ✅ LCP < 2.5s: Next.js SSR/SSG + 適切なコード分割
- ✅ INP < 200ms: ドラッグ＆ドロップ操作の楽観的 UI 更新

### ゲート判定: **PASS** — 全原則に違反なし

## Project Structure

### Documentation (this feature)

```text
specs/001-create-taskify/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (REST API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma                # データモデル定義 (User, Project, Task, Comment)
├── seed.ts                      # サンプルデータ投入 (5 ユーザー, 3 プロジェクト, タスク群)
└── migrations/                  # マイグレーションファイル

src/
├── app/
│   ├── layout.tsx               # ルートレイアウト + UserProvider
│   ├── page.tsx                 # ユーザー選択画面 (Server Component)
│   ├── projects/
│   │   ├── page.tsx             # プロジェクト一覧 (Server Component)
│   │   └── [id]/
│   │       └── page.tsx         # かんばんボード (Server Component shell)
│   ├── actions/
│   │   ├── tasks.ts             # Server Actions: updateStatus, assignUser
│   │   └── comments.ts          # Server Actions: create, update, delete
│   └── api/
│       ├── users/route.ts       # GET /api/users
│       ├── projects/route.ts    # GET /api/projects
│       └── tasks/[id]/
│           ├── route.ts         # GET/PUT /api/tasks/:id
│           └── comments/route.ts # GET/POST /api/tasks/:id/comments
├── components/
│   ├── ui/                      # 汎用 UI (Button, Card, Avatar, Badge)
│   ├── board/                   # KanbanBoard, Column, TaskCard ('use client')
│   └── comments/                # CommentList, CommentForm ('use client')
├── hooks/                       # useCurrentUser, useOptimisticTasks
├── lib/
│   ├── db.ts                    # Prisma クライアントシングルトン
│   └── constants.ts             # カラム定義、ステータスマッピング
└── types/                       # 共有型定義 (User, Project, Task, Comment)

tests/
├── unit/                        # Vitest ユニット + コンポーネントテスト
├── integration/                 # API Route Handler 結合テスト
└── e2e/                         # Playwright E2E テスト
```

**Structure Decision**: Next.js フルスタック単一プロジェクト構成を採用。Route Handlers で REST API を提供し、Server Actions でデータ変更を処理する。バックエンドとフロントエンドが同一コードベースに統合されることで、型安全性の自動確保・デプロイの簡素化を実現する。詳細は [research.md](research.md) §4 を参照。

## Constitution Check (Post-Design)

Phase 1 成果物（data-model.md, contracts/rest-api.md, quickstart.md）を踏まえた再評価。

### 原則 I: コード品質

- ✅ Prisma スキーマで型安全なデータアクセス層を設計済み
- ✅ API コントラクトで入出力の TypeScript インターフェースを明確に定義
- ✅ `actions/`, `components/`, `lib/` の責務分離が data-model / contracts と整合

### 原則 II: テスト標準

- ✅ quickstart.md にテスト実行手順（unit, coverage, e2e）を明記
- ✅ contracts/rest-api.md の各エンドポイント定義がテストケース設計の基盤
- ✅ seed データにより再現可能なテスト環境を保証

### 原則 III: ユーザー体験の一貫性

- ✅ エラーレスポンス形式を contracts で統一（`{ error: string, details?: ... }`）
- ✅ 全ステータスコードにユーザー向けエラーメッセージを定義
- ✅ ドラッグ＆ドロップ + キーボード操作の両対応を @dnd-kit で実現

### 原則 IV: パフォーマンス要件

- ✅ data-model.md でクエリパフォーマンス用インデックスを 5 件設計（tasks: projectId+status, projectId+assigneeId, projectId+position; comments: taskId+createdAt, authorId）
- ✅ position フィールドによりソートクエリの O(n log n) を回避
- ✅ SSR + Server Components で初回ロード LCP < 2.5s を確保

### ゲート判定: **PASS** — 設計成果物は全原則に適合

## Complexity Tracking

> 全原則に準拠しているため、例外正当化は不要。

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| なし      | —          | —                                    |
