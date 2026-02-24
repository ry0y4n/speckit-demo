import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import type { TaskResponse, UserResponse } from '@/types';
import { KanbanBoardPageClient } from './KanbanBoardPageClient';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectBoardPage({ params }: Props) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!project) {
    notFound();
  }

  const [tasks, users] = await Promise.all([
    prisma.task.findMany({
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
    }),
    prisma.user.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  const tasksResponse: TaskResponse[] = tasks.map((task) => ({
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

  const usersResponse: UserResponse[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    avatarColor: user.avatarColor,
  }));

  return (
    <KanbanBoardPageClient
      projectName={project.name}
      initialTasks={tasksResponse}
      users={usersResponse}
    />
  );
}
