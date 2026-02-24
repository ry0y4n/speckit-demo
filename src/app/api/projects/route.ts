import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { ProjectResponse } from '@/types';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const response: ProjectResponse[] = projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      taskCount: project._count.tasks,
    }));

    return NextResponse.json({ projects: response });
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json({ error: 'プロジェクト一覧の取得に失敗しました' }, { status: 500 });
  }
}
