# Feature Specification: Azure App Service デプロイ & CI/CD パイプライン構築

**Feature Branch**: `002-azure-appservice-deploy`  
**Created**: 2026-03-13  
**Status**: Draft  
**Input**: User description: "この Taskify を Azure App Service にデプロイしたい。既にデプロイ先の App Service は用意済みである。RG: rg-taskify, App Service: taskify-dev. 可能であれば GitHub Actions を使った CI/CD パイプラインを整備したい。"

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - 手動デプロイによる Azure App Service への公開 (Priority: P1)

開発者がローカルで動作確認済みの Taskify アプリケーションを、用意済みの Azure App Service（リソースグループ: rg-taskify, App Service: taskify-dev）にデプロイする。デプロイ完了後、インターネット経由で Taskify にアクセスし、ユーザー選択・プロジェクト一覧表示・かんばんボード操作など全機能が正常に動作することを確認できる。

**Why this priority**: デプロイが成功しなければ CI/CD パイプラインを構築しても意味がない。まずアプリケーションが Azure 上で正しく動作する状態を確立することが最優先。

**Independent Test**: デプロイ手順に従って App Service にデプロイし、公開 URL にアクセスして Taskify のユーザー選択画面が表示され、プロジェクト一覧・かんばんボードが操作できることを確認すればテスト可能。

**Acceptance Scenarios**:

1. **Given** ローカルでビルドが成功した Taskify アプリケーション, **When** Azure App Service（taskify-dev）にデプロイする, **Then** デプロイが正常に完了し、App Service のステータスが「Running」になる
2. **Given** デプロイが完了した App Service, **When** 公開 URL にブラウザでアクセスする, **Then** Taskify のユーザー選択画面が正しく表示される
3. **Given** Azure 上で稼働する Taskify, **When** ユーザー選択→プロジェクト一覧→かんばんボード操作を行う, **Then** ローカル環境と同等の機能が正常に動作する
4. **Given** Azure 上で稼働する Taskify, **When** タスクのステータスを変更しコメントを追加する, **Then** データが永続化され、ページリロード後も変更が保持される

---

### User Story 2 - GitHub Actions による自動ビルド・テスト (Priority: P1)

開発者がコードを GitHub リポジトリにプッシュすると、GitHub Actions ワークフローが自動的にトリガーされ、ビルドとテスト（ユニットテスト）が実行される。ビルドまたはテストが失敗した場合、プルリクエストやコミットステータスに失敗が明確に表示され、開発者が問題を素早く特定できる。

**Why this priority**: CI パイプラインは品質ゲートとして機能し、デプロイ前に問題を検出する。手動デプロイ（US1）と並行して整備すべき基盤機能。

**Independent Test**: テストが含まれるブランチにコードをプッシュし、GitHub Actions のワークフローが自動実行され、ビルド・テスト結果が GitHub 上で確認できればテスト可能。

**Acceptance Scenarios**:

1. **Given** GitHub リポジトリに CI ワークフローが設定されている状態, **When** メインブランチにプッシュする, **Then** GitHub Actions ワークフローが自動的にトリガーされビルドとテストが実行される
2. **Given** CI ワークフローが実行中, **When** ビルドとすべてのテストが成功する, **Then** コミットステータスに成功（緑色チェック）が表示される
3. **Given** CI ワークフローが実行中, **When** テストが失敗する, **Then** コミットステータスに失敗（赤色バツ）が表示され、失敗したテスト名とエラー内容が確認できる
4. **Given** プルリクエストが作成された状態, **When** CI ワークフローがトリガーされる, **Then** プルリクエスト上にビルド・テストの結果が表示される

---

### User Story 3 - GitHub Actions による自動デプロイ (Priority: P2)

メインブランチへのマージが完了し、CI（ビルド・テスト）が成功すると、GitHub Actions が自動的に Azure App Service（taskify-dev）へのデプロイを実行する。開発者は手動操作なしでコードの変更が本番環境に反映されることを確認できる。

**Why this priority**: 自動デプロイは手動デプロイ（US1）と CI（US2）の上に構築される機能であり、開発効率を大幅に向上させる。ただし US1・US2 が先に動作している必要がある。

**Independent Test**: メインブランチにプルリクエストをマージし、GitHub Actions がデプロイワークフローを実行し、Azure App Service 上のアプリケーションが最新コードで更新されていることを確認すればテスト可能。

**Acceptance Scenarios**:

1. **Given** CI が成功したプルリクエスト, **When** メインブランチにマージする, **Then** デプロイワークフローが自動的にトリガーされる
2. **Given** デプロイワークフローが実行中, **When** デプロイが正常に完了する, **Then** Azure App Service 上のアプリケーションが最新のコードで更新される
3. **Given** デプロイが完了した後, **When** 公開 URL にアクセスする, **Then** マージされた変更が反映されている
4. **Given** デプロイワークフローが実行中, **When** デプロイが失敗する, **Then** GitHub Actions 上で失敗理由が明確に表示され、前回正常動作していたバージョンが引き続き稼働する

---

### Edge Cases

- デプロイ中にアプリケーションへのアクセスが発生した場合、ユーザーにエラーが表示されず可能な限りダウンタイムが最小化されること
- 環境変数やデータベース接続文字列が正しく設定されていない場合、アプリケーション起動時に分かりやすいエラーログが出力されること
- GitHub Actions ワークフロー実行中にタイムアウトが発生した場合、明確なエラーメッセージが表示されること
- 同時に複数のデプロイが発生しないよう、ワークフローが逐次実行されること
- ビルド成果物のサイズが App Service のデプロイ制限を超えた場合、ワークフロー内で明確に失敗すること

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Taskify アプリケーションを Next.js Standalone モード（`output: 'standalone'`）でビルドし、Azure App Service（リソースグループ: rg-taskify, App Service 名: taskify-dev）にデプロイできる構成を提供しなければならない
- **FR-002**: デプロイされたアプリケーションは、Azure Database for PostgreSQL Flexible Server（db-for-taskify）への接続情報を含む必要な環境変数を App Service のアプリケーション設定から取得できなければならない
- **FR-003**: GitHub Actions の CI ワークフローは、コードのプッシュ時およびプルリクエスト作成時に自動的にビルドとユニットテスト（vitest）を実行しなければならない（E2E テストは CI 対象外）
- **FR-004**: GitHub Actions の CD ワークフローは、メインブランチへのマージ後かつ CI 成功後に自動的に Azure App Service へデプロイしなければならない
- **FR-005**: CI ワークフローの結果（成功・失敗）がコミットステータスおよびプルリクエスト上に表示されなければならない
- **FR-006**: デプロイ失敗時、前回正常動作していたバージョンが引き続き稼働しなければならない
- **FR-007**: データベースマイグレーションはデプロイプロセスの一部として実行されなければならない
- **FR-008**: 機密情報（データベース接続文字列等）は Azure App Service のアプリケーション設定で管理し、GitHub → Azure の認証は OIDC フェデレーションを使用してシークレットレスで行い、リポジトリにハードコードしてはならない
- **FR-009**: 同一ブランチへの複数コミットによるデプロイの競合を防ぐため、デプロイワークフローは逐次実行されなければならない

### Key Entities

- **デプロイ構成**: アプリケーションを Azure App Service で実行するために必要な設定の集合。Next.js Standalone モードによる自己完結型ビルド成果物、起動コマンド、環境変数マッピングを含む
- **CI ワークフロー**: コード変更時に自動実行されるビルド・テストのパイプライン定義。トリガー条件、ステップ、成果物を含む
- **CD ワークフロー**: CI 成功後に Azure App Service へ自動デプロイするパイプライン定義。認証方法、デプロイ先、マイグレーション実行を含む
- **デプロイ環境設定**: Azure App Service 上のアプリケーション設定。Azure Database for PostgreSQL Flexible Server（db-for-taskify）への接続文字列やアプリケーション固有の設定値を含む

## Clarifications

### Session 2026-03-13

- Q: GitHub Actions → Azure 認証方式は何を採用するか？ → A: GitHub Actions OIDC（OpenID Connect）フェデレーション認証
- Q: Next.js のデプロイモードは？ → A: Standalone モード（`output: 'standalone'`）
- Q: データベースの提供形態は？ → A: Azure Database for PostgreSQL Flexible Server（名前: db-for-taskify、PostgreSQL + Microsoft Entra 認証、Entra 管理者: rhyakuta@microsoft.com）
- Q: CI でのテスト実行範囲は？ → A: ユニットテスト（vitest）のみ（E2E テストは CI 対象外）
- Q: App Service ↔ PostgreSQL 間のネットワーク構成は？ → A: パブリックアクセス（PoC のためファイアウォール制限なし）

## Assumptions

- Azure App Service（taskify-dev）はリソースグループ rg-taskify 内に既に作成済みであり、デプロイ先として利用可能である
- Taskify のソースコードは GitHub リポジトリでホストされている
- データベースは Azure Database for PostgreSQL Flexible Server（名前: db-for-taskify）としてリソースグループ rg-taskify 内にプロビジョニング済みである
- PostgreSQL の認証方法は「PostgreSQL と Microsoft Entra 認証」が有効化されており、管理者パスワードおよび Microsoft Entra 管理者（rhyakuta@microsoft.com）が設定済みである
- PostgreSQL Flexible Server はパブリックアクセス（ファイアウォール制限なし）で構成されている（PoC 環境のため）
- GitHub リポジトリから Azure App Service への認証には、GitHub Actions OIDC（OpenID Connect）フェデレーション認証を使用する（Azure Entra ID にフェデレーション資格情報を設定済みであること）
- App Service のプラン・SKU は Next.js アプリケーションの実行に十分なリソースを持つ
- Node.js のバージョンは App Service でサポートされるバージョンを使用する

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 開発者がデプロイ手順に従い、初回デプロイを 30 分以内に完了できる
- **SC-002**: デプロイされた Taskify にインターネット経由でアクセスし、全機能（ユーザー選択、プロジェクト一覧、かんばんボード、タスク操作、コメント）が正常に動作する
- **SC-003**: コードプッシュから CI ワークフロー完了（ビルド・テスト結果表示）まで 10 分以内に完了する
- **SC-004**: メインブランチへのマージから本番環境への反映まで 15 分以内に完了する
- **SC-005**: デプロイ時のダウンタイムが 1 分未満である
- **SC-006**: CI/CD パイプラインのセットアップ手順が文書化され、新しい開発者が 1 時間以内に理解・運用できる
