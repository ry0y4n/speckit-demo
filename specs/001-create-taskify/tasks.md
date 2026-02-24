# Tasks: Taskify 作成

**Input**: Design documents from `/specs/001-create-taskify/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/rest-api.md ✅, quickstart.md ✅

**Tests**: テスト専用タスクは含まない（仕様書に明示的な TDD 指定なし）。テストランナー（Vitest / Playwright）のセットアップは Phase 1 で実施。

**Organization**: ユーザーストーリー単位でタスクをグループ化。各ストーリーは独立して実装・テスト可能。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル、未完了タスクへの依存なし）
- **[Story]**: 所属ユーザーストーリー（例: [US1], [US2]）
- 各タスクに正確なファイルパスを記載

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Next.js プロジェクトの初期化と開発ツールの設定

- [ ] T001 Initialize Next.js 15 project with TypeScript and Tailwind CSS 4 via `npx create-next-app@latest`
- [ ] T002 [P] Install runtime dependencies (@dnd-kit/core, @dnd-kit/sortable, prisma, @prisma/client) in package.json
- [ ] T003 [P] Configure ESLint + Prettier with unified project-wide settings in .eslintrc.json and .prettierrc
- [ ] T004 [P] Configure Vitest and Playwright test runners in vitest.config.ts and playwright.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全ユーザーストーリーが依存するコアインフラの構築

**⚠️ CRITICAL**: このフェーズが完了するまでユーザーストーリーの実装は開始不可

- [ ] T005 Create Prisma schema with User, Project, Task, Comment entities, Role/TaskStatus enums, and 5 indexes in prisma/schema.prisma
- [ ] T006 Run initial Prisma migration via `npx prisma migrate dev --name init`
- [ ] T007 [P] Create Prisma client singleton with dev hot-reload guard in src/lib/db.ts
- [ ] T008 [P] Create shared TypeScript type definitions (User, Project, Task, Comment, API response types) in src/types/index.ts
- [ ] T009 [P] Create constants (TaskStatus display labels, column definitions, avatar color map) in src/lib/constants.ts
- [ ] T010 [P] Create .env.example with DATABASE_URL template in project root
- [ ] T011 Create seed script with 5 users, 3 projects, 16-20 tasks distributed across 4 statuses in prisma/seed.ts
- [ ] T012 [P] Create base UI components (Button, Card, Avatar, Badge) in src/components/ui/
- [ ] T013 Create UserProvider context and useCurrentUser hook for current user tracking in src/hooks/useCurrentUser.tsx
- [ ] T014 Create root layout integrating UserProvider and global styles in src/app/layout.tsx

**Checkpoint**: 基盤完了 — ユーザーストーリーの実装開始可能

---

## Phase 3: User Story 1 — ユーザー選択とプロジェクト一覧表示 (Priority: P1) 🎯 MVP

**Goal**: アプリ起動 → 5 名のユーザーから選択 → 3 プロジェクト一覧を表示

**Independent Test**: http://localhost:3000 にアクセスし、ユーザーをクリックして 3 プロジェクトが表示されることを確認

### Implementation for User Story 1

- [ ] T015 [P] [US1] Create GET /api/users route handler returning all 5 users in src/app/api/users/route.ts
- [ ] T016 [P] [US1] Create GET /api/projects route handler returning projects with taskCount in src/app/api/projects/route.ts
- [ ] T017 [US1] Create user selection page with 5 user cards (name, role, avatarColor) as Server Component in src/app/page.tsx
- [ ] T018 [US1] Create project list page showing 3 projects with task counts as Server Component in src/app/projects/page.tsx

**Checkpoint**: US1 完了 — ユーザー選択 → プロジェクト一覧の MVP フローが動作

---

## Phase 4: User Story 2 — かんばんボードの表示とタスク移動 (Priority: P1)

**Goal**: プロジェクト選択 → 4 カラムのかんばんボード表示 → D&D でタスク移動 → 自分のカード色分け

**Independent Test**: プロジェクトを開き、タスクカードを別カラムにドラッグ＆ドロップしてステータス更新を確認

### Implementation for User Story 2

- [ ] T019 [P] [US2] Create GET /api/projects/:id/tasks route handler with status/position ordering in src/app/api/projects/[id]/tasks/route.ts
- [ ] T020 [US2] Create updateTaskStatus Server Action with position recalculation in src/app/actions/tasks.ts
- [ ] T021 [P] [US2] Create TaskCard component displaying title, assignee avatar, commentCount in src/components/board/TaskCard.tsx
- [ ] T022 [P] [US2] Create Column component rendering task cards with drop zone in src/components/board/Column.tsx
- [ ] T023 [US2] Create KanbanBoard component integrating @dnd-kit DnD with 4 columns and current-user card highlighting in src/components/board/KanbanBoard.tsx
- [ ] T024 [US2] Create useOptimisticTasks hook for instant D&D visual feedback in src/hooks/useOptimisticTasks.ts
- [ ] T025 [US2] Create kanban board page as Server Component shell fetching tasks and rendering KanbanBoard in src/app/projects/[id]/page.tsx

**Checkpoint**: US2 完了 — かんばんボードで D&D タスク移動・色分け表示が動作

---

## Phase 5: User Story 3 — タスクへのユーザー割り当て (Priority: P2)

**Goal**: タスクカードから担当者を選択・変更 → カード色が即座に更新

**Independent Test**: タスクカードの割り当てボタンから別ユーザーを選択し、色が変わることを確認

### Implementation for User Story 3

- [ ] T026 [US3] Create assignTask Server Action with user validation in src/app/actions/tasks.ts
- [ ] T027 [US3] Add assignee selection dropdown with user list to TaskCard in src/components/board/TaskCard.tsx
- [ ] T028 [US3] Integrate assignee update with optimistic UI feedback in src/components/board/KanbanBoard.tsx

**Checkpoint**: US3 完了 — タスク担当者の変更と色の即時反映が動作

---

## Phase 6: User Story 4 — タスクへのコメント機能 (Priority: P2)

**Goal**: タスク詳細パネルでコメント一覧表示・追加・編集・削除（自分のみ）

**Independent Test**: タスクを開き、コメント追加 → 自分のコメントに編集/削除ボタンあり → 他人のコメントに操作ボタンなしを確認

### Implementation for User Story 4

- [ ] T029 [P] [US4] Create GET /api/tasks/:id/comments route handler with author info in src/app/api/tasks/[id]/comments/route.ts
- [ ] T030 [US4] Create comment Server Actions (createComment, updateComment, deleteComment) with access control in src/app/actions/comments.ts
- [ ] T031 [P] [US4] Create CommentForm component with validation (1-5000 chars, no whitespace-only) in src/components/comments/CommentForm.tsx
- [ ] T032 [P] [US4] Create CommentList component with author info, edit/delete for own comments only in src/components/comments/CommentList.tsx
- [ ] T033 [US4] Create TaskDetail panel integrating CommentForm + CommentList with task info in src/components/board/TaskDetail.tsx
- [ ] T034 [US4] Add task click handler to TaskCard to open TaskDetail panel in src/components/board/TaskCard.tsx

**Checkpoint**: US4 完了 — コメントの CRUD とアクセス制御が動作

---

## Phase 7: User Story 5 — サンプルデータの初期セットアップ (Priority: P3)

**Goal**: `prisma db seed` で 5 ユーザー・3 プロジェクト・各カラムにタスクが投入される

**Independent Test**: `npx prisma db seed` 実行後、Prisma Studio で 5 users / 3 projects / 各ステータスにタスクが配置されていることを確認

> **Note**: コア実装は Phase 2 の T011（prisma/seed.ts）で完了済み。このフェーズはデータ内容の検証と調整。

### Implementation for User Story 5

- [ ] T035 [US5] Validate and adjust seed data distribution: verify each project has 4-6 tasks across TODO/IN_PROGRESS/IN_REVIEW/DONE with mixed assignees in prisma/seed.ts

**Checkpoint**: US5 完了 — サンプルデータが仕様通りに投入される

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 全ストーリー横断の品質向上

- [ ] T036 [P] Add loading states (Suspense boundaries) and error boundaries to all pages in src/app/
- [ ] T037 [P] Add keyboard navigation and accessibility attributes for @dnd-kit in src/components/board/KanbanBoard.tsx
- [ ] T038 [P] Add responsive layout support for mobile/tablet in src/app/globals.css and board components
- [ ] T039 Code cleanup: remove console.logs, verify TypeScript strict mode, run ESLint/Prettier
- [ ] T040 Run quickstart.md validation end-to-end (setup → seed → dev server → all user stories)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし — 即座に開始可能
- **Foundational (Phase 2)**: Setup 完了に依存 — **全ユーザーストーリーをブロック**
- **US1 (Phase 3)**: Foundational 完了に依存 — 他ストーリーへの依存なし
- **US2 (Phase 4)**: Foundational 完了に依存 — US1 のナビゲーション経由でアクセスするが、コード的には独立
- **US3 (Phase 5)**: US2 完了に依存（TaskCard / KanbanBoard を拡張）
- **US4 (Phase 6)**: US2 完了に依存（TaskCard にクリックハンドラを追加）
- **US5 (Phase 7)**: Foundational の T011 で実装済み — 検証のみ
- **Polish (Phase 8)**: 全ストーリー完了に依存

### User Story Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ──── BLOCKS ALL ────
    │                                       │
    ▼                                       ▼
Phase 3 (US1: P1)                    Phase 7 (US5: P3)
    │                                [検証のみ - T011 で実装済み]
    ▼
Phase 4 (US2: P1)
    │
    ├──────────────┐
    ▼              ▼
Phase 5 (US3)  Phase 6 (US4)
    │              │
    └──────┬───────┘
           ▼
    Phase 8 (Polish)
```

### Within Each User Story

- Route Handlers / Server Actions → Components → Pages の順
- コアコンポーネント → 統合コンポーネント → ページ統合の順
- [P] マークされたタスクは並列実行可能

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 を並列実行（T001 完了後）
- **Phase 2**: T007, T008, T009, T010 を並列実行（T006 完了後）; T012, T013 を並列実行
- **Phase 3**: T015, T016 を並列実行
- **Phase 4**: T019 と T021, T022 を並列実行
- **Phase 5**: US3 と US4 を並列実行（異なるファイルの場合）
- **Phase 6**: T029, T031, T032 を並列実行

---

## Parallel Example: User Story 2

```bash
# Route Handler と基本コンポーネントを並列で作成:
Task T019: "Create GET /api/projects/:id/tasks route handler in src/app/api/projects/[id]/tasks/route.ts"
Task T021: "Create TaskCard component in src/components/board/TaskCard.tsx"
Task T022: "Create Column component in src/components/board/Column.tsx"

# 上記完了後、統合コンポーネントを作成:
Task T023: "Create KanbanBoard component in src/components/board/KanbanBoard.tsx"
Task T024: "Create useOptimisticTasks hook in src/hooks/useOptimisticTasks.ts"

# 最後にページを作成:
Task T025: "Create kanban board page in src/app/projects/[id]/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup 完了
2. Phase 2: Foundational 完了（**CRITICAL — 全ストーリーをブロック**）
3. Phase 3: US1 完了
4. **STOP and VALIDATE**: ユーザー選択 → プロジェクト一覧が動作することを確認
5. この時点でデモ可能な MVP

### Incremental Delivery

1. Setup + Foundational → 基盤完了
2. US1 追加 → テスト → **MVP デモ可能**
3. US2 追加 → テスト → かんばんボード操作可能
4. US3 + US4 並列追加 → テスト → チーム協働機能完了
5. US5 検証 + Polish → 品質確保 → **完成**

### Parallel Team Strategy

複数開発者の場合:

1. 全員で Setup + Foundational を完了
2. Foundational 完了後:
   - **開発者 A**: US1 → US2（依存チェーンのため順次）
   - **開発者 B**: US5 検証（T035）→ US3（US2 完了待ち）
   - **開発者 C**: US4（US2 完了待ち）→ Polish
3. US3 と US4 は US2 完了後に並列実行可能

---

## Notes

- [P] タスク = 異なるファイル、依存なし → 並列実行可能
- [Story] ラベルはユーザーストーリーへのトレーサビリティを確保
- 各ストーリーは独立してテスト・デモ可能
- タスク完了ごとまたは論理グループごとにコミット
- チェックポイントで一旦停止し、ストーリーの動作を独立検証可能
- US5 のコア実装は T011（Foundational）に含まれる — Phase 7 は検証のみ
