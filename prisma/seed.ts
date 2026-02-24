import { PrismaClient, Role, TaskStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://taskify:taskify@localhost:5433/taskify';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean up existing data
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // ---- Users (5名) ----
  const users = await Promise.all([
    prisma.user.create({
      data: { name: '佐藤 美咲', role: Role.PRODUCT_MANAGER, avatarColor: '#8B5CF6' },
    }),
    prisma.user.create({
      data: { name: '田中 健太', role: Role.ENGINEER, avatarColor: '#3B82F6' },
    }),
    prisma.user.create({
      data: { name: '鈴木 陽子', role: Role.ENGINEER, avatarColor: '#10B981' },
    }),
    prisma.user.create({
      data: { name: '山田 大輔', role: Role.ENGINEER, avatarColor: '#F59E0B' },
    }),
    prisma.user.create({
      data: { name: '中村 あゆみ', role: Role.ENGINEER, avatarColor: '#EF4444' },
    }),
  ]);

  // ---- Projects (3つ) ----
  const projects = await Promise.all([
    prisma.project.create({
      data: { name: 'Taskify v1.0 開発', description: 'かんばんボード機能の初期実装' },
    }),
    prisma.project.create({
      data: { name: 'モバイルアプリ設計', description: 'iOS/Android アプリの UI/UX 設計' },
    }),
    prisma.project.create({
      data: {
        name: 'インフラ構築',
        description: 'CI/CD パイプラインとクラウド環境のセットアップ',
      },
    }),
  ]);

  // ---- Tasks ----
  // Project 1: Taskify v1.0 開発 (6 tasks)
  const project1Tasks = [
    {
      title: 'ユーザー選択画面の実装',
      description: '5名のユーザーカードを表示し、クリックで選択可能にする',
      status: TaskStatus.DONE,
      position: 0,
      assigneeId: users[1].id,
    },
    {
      title: 'プロジェクト一覧 API の作成',
      description: 'GET /api/projects エンドポイントの実装',
      status: TaskStatus.DONE,
      position: 1,
      assigneeId: users[2].id,
    },
    {
      title: 'かんばんボード UI の構築',
      description: '4カラム表示とタスクカードのレイアウト',
      status: TaskStatus.IN_REVIEW,
      position: 0,
      assigneeId: users[3].id,
    },
    {
      title: 'ドラッグ＆ドロップ機能の実装',
      description: '@dnd-kit を使用したカード移動機能',
      status: TaskStatus.IN_PROGRESS,
      position: 0,
      assigneeId: users[1].id,
    },
    {
      title: 'タスク割り当て機能',
      description: 'タスクカードから担当者を選択・変更する機能',
      status: TaskStatus.IN_PROGRESS,
      position: 1,
      assigneeId: null,
    },
    {
      title: 'コメント機能の設計',
      description: 'コメント CRUD とアクセス制御の設計',
      status: TaskStatus.TODO,
      position: 0,
      assigneeId: users[0].id,
    },
  ];

  // Project 2: モバイルアプリ設計 (5 tasks)
  const project2Tasks = [
    {
      title: 'ユーザーリサーチの実施',
      description: 'ターゲットユーザーへのインタビューとアンケート',
      status: TaskStatus.DONE,
      position: 0,
      assigneeId: users[0].id,
    },
    {
      title: 'ワイヤーフレームの作成',
      description: '主要画面のワイヤーフレーム設計',
      status: TaskStatus.IN_REVIEW,
      position: 0,
      assigneeId: users[2].id,
    },
    {
      title: 'UI デザインシステムの構築',
      description: 'カラーパレット、タイポグラフィ、コンポーネント定義',
      status: TaskStatus.IN_PROGRESS,
      position: 0,
      assigneeId: users[4].id,
    },
    {
      title: 'プロトタイプの作成',
      description: 'Figma でインタラクティブプロトタイプを作成',
      status: TaskStatus.TODO,
      position: 0,
      assigneeId: users[3].id,
    },
    {
      title: 'ユーザビリティテスト計画',
      description: 'テストシナリオと評価基準の策定',
      status: TaskStatus.TODO,
      position: 1,
      assigneeId: null,
    },
  ];

  // Project 3: インフラ構築 (5 tasks)
  const project3Tasks = [
    {
      title: 'GitHub Actions CI/CD パイプライン構築',
      description: 'テスト自動化、ビルド、デプロイのパイプライン',
      status: TaskStatus.DONE,
      position: 0,
      assigneeId: users[3].id,
    },
    {
      title: 'ステージング環境のセットアップ',
      description: 'AWS/GCP 上にステージング環境を構築',
      status: TaskStatus.DONE,
      position: 1,
      assigneeId: users[1].id,
    },
    {
      title: '本番環境の構築',
      description: '本番用インフラのプロビジョニングと設定',
      status: TaskStatus.IN_PROGRESS,
      position: 0,
      assigneeId: users[3].id,
    },
    {
      title: '監視・アラートの設定',
      description: 'Datadog/CloudWatch でのモニタリング設定',
      status: TaskStatus.IN_REVIEW,
      position: 0,
      assigneeId: users[4].id,
    },
    {
      title: 'セキュリティ監査の実施',
      description: '脆弱性スキャンとセキュリティレビュー',
      status: TaskStatus.TODO,
      position: 0,
      assigneeId: null,
    },
  ];

  // Create all tasks
  for (const task of project1Tasks) {
    await prisma.task.create({
      data: { ...task, projectId: projects[0].id },
    });
  }
  for (const task of project2Tasks) {
    await prisma.task.create({
      data: { ...task, projectId: projects[1].id },
    });
  }
  for (const task of project3Tasks) {
    await prisma.task.create({
      data: { ...task, projectId: projects[2].id },
    });
  }

  // ---- Comments (some sample comments) ----
  const allTasks = await prisma.task.findMany();
  const taskifyTasks = allTasks.filter((t) => t.projectId === projects[0].id);

  if (taskifyTasks.length > 0) {
    await prisma.comment.create({
      data: {
        body: 'デザインの方向性について相談したいです。明日のミーティングで話しましょう。',
        taskId: taskifyTasks[0].id,
        authorId: users[0].id,
      },
    });
    await prisma.comment.create({
      data: {
        body: '了解です！資料を準備しておきます。',
        taskId: taskifyTasks[0].id,
        authorId: users[1].id,
      },
    });
    await prisma.comment.create({
      data: {
        body: '@dnd-kit のドキュメントを確認しました。SortableContext を使うのが良さそうです。',
        taskId: taskifyTasks[3].id,
        authorId: users[1].id,
      },
    });
  }

  console.log('✅ Seed data created successfully');
  console.log(`   Users: ${users.length}`);
  console.log(`   Projects: ${projects.length}`);
  console.log(`   Tasks: ${project1Tasks.length + project2Tasks.length + project3Tasks.length}`);
  console.log('   Comments: 3');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
