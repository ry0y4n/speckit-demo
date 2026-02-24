import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { TaskResponse } from '@/types';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: '指定されたプロジェクトが見つかりません' },
        { status: 404 },
      );
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      include: {
        assignee: {
          select: { id: true, name: true, avatarColor: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
    });

    const response: TaskResponse[] = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      position: task.position,
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            name: task.assignee.name,
            avatarColor: task.assignee.avatarColor,
          }
        : null,
      commentCount: task._count.comments,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));

    return NextResponse.json({ tasks: response });
  } catch (error) {
    console.error('GET /api/projects/:id/tasks error:', error);
    return NextResponse.json({ error: 'タスク一覧の取得に失敗しました' }, { status: 500 });
  }
}
