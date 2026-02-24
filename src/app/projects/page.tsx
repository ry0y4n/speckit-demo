import { prisma } from '@/lib/db';
import type { ProjectResponse } from '@/types';
import { ProjectListClient } from './ProjectListClient';

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      _count: {
        select: { tasks: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const projectsResponse: ProjectResponse[] = projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    taskCount: project._count.tasks,
  }));

  return <ProjectListClient projects={projectsResponse} />;
}
