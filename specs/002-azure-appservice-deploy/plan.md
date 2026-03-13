# Implementation Plan: Azure App Service デプロイ & CI/CD パイプライン構築

**Branch**: `002-azure-appservice-deploy` | **Date**: 2026-03-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-azure-appservice-deploy/spec.md`

## Summary

Taskify（Next.js + Prisma + PostgreSQL）を Azure App Service（taskify-dev）にデプロイし、GitHub Actions による CI/CD パイプラインを構築する。Next.js Standalone モードでビルドし、GitHub Actions OIDC 認証で Azure へシークレットレスデプロイを実現する。データベースは Azure Database for PostgreSQL Flexible Server（db-for-taskify）を使用する。

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20 LTS  
**Primary Dependencies**: Next.js 16.x, Prisma 7.x（`@prisma/adapter-pg`）, React 19.x  
**Storage**: Azure Database for PostgreSQL Flexible Server（db-for-taskify）via Prisma ORM  
**Testing**: vitest（ユニットテスト）、Playwright（E2E、CI 対象外）  
**Target Platform**: Azure App Service（Linux）, GitHub Actions  
**Project Type**: Web アプリケーション（Next.js フルスタック）  
**Performance Goals**: LCP 2.5 秒以内、API p95 200ms 以内（憲法 IV 準拠）  
**Constraints**: デプロイ時ダウンタイム 1 分未満、CI 完了 10 分以内、CD 完了 15 分以内  
**Scale/Scope**: PoC 環境、5 名の事前定義ユーザー

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                      | 評価 | 詳細                                                                                                        |
| ------------------------- | ---- | ----------------------------------------------------------------------------------------------------------- |
| I. コード品質             | PASS | GitHub Actions CI でリント・ビルド・テストを自動実行。ワークフロー定義自体もコードレビュー対象。            |
| II. テスト標準            | PASS | CI でユニットテスト（vitest）を自動実行し、失敗時はマージをブロック。E2E は CI 対象外だが既存テストは維持。 |
| III. ユーザー体験の一貫性 | PASS | デプロイ先変更のみ、UI/UX の変更は発生しない。                                                              |
| IV. パフォーマンス要件    | PASS | Standalone モードにより起動・レスポンスの効率化。パフォーマンス計測は本機能スコープ外だが、既存基準を維持。 |
| 技術的意思決定            | PASS | OIDC 認証・Standalone モード等の選択理由は Clarifications セクションに記録済み。                            |
| シンプルさの優先          | PASS | PoC 環境のため最小限の構成。ファイアウォール・VNet 等の高度なネットワーク構成は不要と判断。                 |

**Gate Result**: PASS — 全原則準拠、Phase 0 に進行可能。

## Project Structure

### Documentation (this feature)

```text
specs/002-azure-appservice-deploy/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# 既存構造を維持し、以下のファイルを追加・変更
next.config.ts              # output: 'standalone' 追加
.github/
└── workflows/
    ├── ci.yml              # CI ワークフロー（ビルド・リント・ユニットテスト）
    └── cd.yml              # CD ワークフロー（Azure App Service デプロイ）
```

**Structure Decision**: 既存の Next.js プロジェクト構造をそのまま活用。追加するのは `next.config.ts` の設定変更と `.github/workflows/` 配下の 2 つのワークフロー定義ファイルのみ。アプリケーションコードの変更は最小限（Standalone 対応の設定のみ）。
