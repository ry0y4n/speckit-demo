# Tasks: Azure App Service デプロイ & CI/CD パイプライン構築

**Input**: Design documents from `/specs/002-azure-appservice-deploy/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: テスト対象のアプリケーションコード変更がないため、テストタスクは含まない。CI ワークフロー自体が既存テストを実行する。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Next.js Standalone モード対応と Azure 環境の前提条件セットアップ

- [x] T001 `next.config.ts` に `output: 'standalone'` を追加して Next.js Standalone モードを有効化する in `next.config.ts`
- [x] T002 [P] `.github/workflows/` ディレクトリを作成する in `.github/workflows/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Azure Entra ID フェデレーション資格情報と GitHub Secrets の設定（CI/CD ワークフローの前提条件）

**⚠️ CRITICAL**: Azure OIDC 認証の前提条件が整わないと CD ワークフローが動作しない

- [x] T003 Azure Entra ID に App Registration（`taskify-github-actions`）を作成し、Service Principal を作成し、rg-taskify に Contributor ロールを割り当てる（手動 Azure CLI 操作、quickstart.md Step 1 参照）
- [x] T004 Azure Entra ID にフェデレーション資格情報を追加し、GitHub リポジトリの main ブランチからの OIDC 認証を許可する（手動 Azure CLI 操作、quickstart.md Step 1 参照）
- [x] T005 GitHub リポジトリに Secrets を設定する: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `DATABASE_URL`（手動 GitHub CLI 操作、quickstart.md Step 2 参照）
- [x] T006 Azure App Service（taskify-dev）の構成を設定する: Node.js 20 LTS ランタイム、起動コマンド `node server.js`、環境変数 `DATABASE_URL` と `NODE_ENV=production`（手動 Azure CLI 操作、quickstart.md Step 3 参照）

**Checkpoint**: Azure 環境と GitHub Secrets が設定完了 — ワークフロー実装を開始可能

---

## Phase 3: User Story 1 - 手動デプロイによる Azure App Service への公開 (Priority: P1) 🎯 MVP

**Goal**: ローカルでビルドした Taskify を Azure App Service（taskify-dev）に手動デプロイし、全機能が正常に動作することを確認する

**Independent Test**: `https://taskify-dev.azurewebsites.net` にアクセスし、ユーザー選択→プロジェクト一覧→かんばんボードの全フローが動作することを確認

### Implementation for User Story 1

- [x] T007 [US1] ローカルで `npm run build` を実行し、Standalone ビルド成果物が `.next/standalone/` に生成されることを確認する
- [x] T008 [US1] ビルド後に `public/` と `.next/static/` を `.next/standalone/` 配下にコピーし、`prisma/` と `prisma.config.ts` もコピーする
- [x] T009 [US1] Azure Database for PostgreSQL Flexible Server（db-for-taskify）に対して `DATABASE_URL` 環境変数を設定した状態で `npx prisma migrate deploy` を実行し、マイグレーションを適用する
- [x] T010 [US1] `.next/standalone/` を zip 化し、`az webapp deploy` コマンドで Azure App Service（taskify-dev）にデプロイする
- [x] T011 [US1] `https://taskify-dev.azurewebsites.net` にアクセスし、ユーザー選択画面の表示、プロジェクト一覧、かんばんボード操作、タスク移動、コメント追加の全機能が正常に動作することを確認する

**Checkpoint**: Taskify が Azure App Service 上で全機能動作 — MVP 達成

---

## Phase 4: User Story 2 - GitHub Actions による自動ビルド・テスト (Priority: P1)

**Goal**: コードプッシュ / PR 作成時に GitHub Actions で自動的にビルドとユニットテスト（vitest）が実行され、結果がコミットステータスに反映される

**Independent Test**: テストを含むブランチに push し、GitHub Actions の CI ワークフローが自動実行され、ビルド・テスト結果が GitHub 上で確認できること

### Implementation for User Story 2

- [x] T012 [US2] CI ワークフローの基本構造を作成する: トリガー（push/PR on main）、concurrency グループ（`ci-${{ github.ref }}`、cancel-in-progress: true）in `.github/workflows/ci.yml`
- [x] T013 [US2] CI ワークフローにビルド・テストジョブを実装する: checkout → setup-node (Node.js 20, cache: npm) → npm ci → `npx vitest run` → `npm run build` in `.github/workflows/ci.yml`
- [x] T014 [US2] CI ワークフローに Standalone 成果物のアーティファクトアップロードステップを追加する: static アセットコピー、Prisma ファイルコピー、`actions/upload-artifact@v4`（main push 時のみ条件付き実行）in `.github/workflows/ci.yml`
- [x] T015 [US2] CI ワークフローを main ブランチにプッシュし、GitHub Actions で正常にビルド・テストが完了し、コミットステータスに成功が表示されることを確認する

**Checkpoint**: CI パイプラインが自動実行され、ビルド・テスト結果が GitHub 上で表示される

---

## Phase 5: User Story 3 - GitHub Actions による自動デプロイ (Priority: P2)

**Goal**: main ブランチへのマージ＆CI 成功後に、GitHub Actions が自動的に Azure App Service へデプロイする

**Independent Test**: main ブランチに PR をマージし、CD ワークフローが自動実行され、Azure 上のアプリケーションが最新コードで更新されていることを確認

### Implementation for User Story 3

- [x] T016 [US3] CD ワークフローの基本構造を作成する: トリガー（workflow_run: CI 完了 on main）、concurrency グループ（`cd-production`、cancel-in-progress: false）、permissions（id-token: write, contents: read）in `.github/workflows/cd.yml`
- [x] T017 [US3] CD ワークフローにアーティファクトダウンロードと Azure Login（OIDC）ステップを実装する: `actions/download-artifact@v4`、`azure/login@v2`（OIDC 認証）in `.github/workflows/cd.yml`
- [x] T018 [US3] CD ワークフローに Prisma マイグレーションステップを追加する: `DATABASE_URL` シークレットを環境変数に設定し `npx prisma migrate deploy` を実行 in `.github/workflows/cd.yml`
- [x] T019 [US3] CD ワークフローに Azure App Service デプロイステップを追加する: `azure/webapps-deploy@v3` で taskify-dev にデプロイ in `.github/workflows/cd.yml`
- [x] T020 [US3] main ブランチに PR をマージし、CD ワークフローが CI 成功後に自動トリガーされ、Azure App Service 上のアプリケーションが最新コードで更新されることを確認する

**Checkpoint**: CI/CD パイプライン全体が自動化され、push → ビルド → テスト → デプロイの完全な自動化フローが動作する

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント整備と最終検証

- [x] T021 [P] quickstart.md の手順に従って新規開発者向けにセットアップ手順の妥当性を最終確認する
- [x] T022 README.md にデプロイ手順と CI/CD パイプラインの概要を追記する in `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories（Azure OIDC 設定が CD ワークフローの前提条件）
- **User Story 1 (Phase 3)**: Depends on Setup (T001) + Foundational (T006) — 手動デプロイのため OIDC 不要だが App Service 設定が必要
- **User Story 2 (Phase 4)**: Depends on Setup (T001, T002) — CI ワークフローは Azure 認証不要
- **User Story 3 (Phase 5)**: Depends on Foundational (T003-T005) + User Story 2 (T012-T014) — CD は CI のアーティファクト出力に依存
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Setup + App Service 設定（T006）後に開始可能 — 他ストーリーへの依存なし
- **User Story 2 (P1)**: Setup 後に開始可能 — US1 と並行実装可能
- **User Story 3 (P2)**: Foundational（OIDC 設定）+ US2（CI ワークフロー）完了後に開始可能

### Within Each User Story

- US1: ビルド → コピー → マイグレーション → デプロイ → 動作確認（逐次実行）
- US2: 基本構造 → ビルド・テストジョブ → アーティファクトアップロード → 動作確認（逐次実行）
- US3: 基本構造 → ダウンロード＆ログイン → マイグレーション → デプロイ → 動作確認（逐次実行）

### Parallel Opportunities

- T001 と T002 は並行実行可能（異なるファイル、依存なし）
- US1 と US2 は Foundational 完了後に並行実装可能（US1 は手動デプロイ、US2 は CI ワークフロー）
- T021 と T022 は並行実行可能

---

## Parallel Example: User Story 1 & 2 の並行実行

```bash
# Setup 完了後、US1 と US2 を並行で開始可能：

# Developer A: User Story 1（手動デプロイ）
Task: T007 — ローカルでビルド確認
Task: T008 — 成果物コピー
Task: T009 — マイグレーション実行
Task: T010 — App Service デプロイ
Task: T011 — 動作確認

# Developer B: User Story 2（CI ワークフロー）
Task: T012 — ci.yml 基本構造作成
Task: T013 — ビルド・テストジョブ実装
Task: T014 — アーティファクトアップロード追加
Task: T015 — CI 動作確認
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup（T001-T002）
2. Complete Phase 2: Foundational（T003-T006）
3. Complete Phase 3: User Story 1（T007-T011）
4. **STOP and VALIDATE**: `https://taskify-dev.azurewebsites.net` で全機能テスト
5. Deploy/demo if ready — Taskify が Azure 上で稼働

### Incremental Delivery

1. Complete Setup + Foundational → 基盤準備完了
2. Add User Story 1 → 手動デプロイ成功 → **MVP!**
3. Add User Story 2 → CI パイプライン稼働 → ビルド・テスト自動化
4. Add User Story 3 → CD パイプライン稼働 → 完全自動化デプロイ
5. Each story adds automation without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- T003-T006 は手動 Azure CLI / GitHub CLI 操作であり、コード生成タスクではない
- T007-T011 は手動デプロイの実行・確認タスク
- T012-T020 がコード生成タスク（`.github/workflows/ci.yml`, `.github/workflows/cd.yml`）
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
