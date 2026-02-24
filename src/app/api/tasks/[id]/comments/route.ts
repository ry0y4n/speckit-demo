import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { CommentResponse } from '@/types';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!task) {
      return NextResponse.json({ error: '指定されたタスクが見つかりません' }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: { taskId: id },
      include: {
        author: {
          select: { id: true, name: true, avatarColor: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const response: CommentResponse[] = comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      author: {
        id: comment.author.id,
        name: comment.author.name,
        avatarColor: comment.author.avatarColor,
      },
    }));

    return NextResponse.json({ comments: response });
  } catch (error) {
    console.error('GET /api/tasks/:id/comments error:', error);
    return NextResponse.json({ error: 'コメント一覧の取得に失敗しました' }, { status: 500 });
  }
}
