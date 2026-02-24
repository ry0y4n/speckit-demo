'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Avatar, Badge, Card, CardBody, CardFooter } from '@/components/ui';
import type { ProjectResponse } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type ProjectListClientProps = {
  projects: ProjectResponse[];
};

export function ProjectListClient({ projects }: ProjectListClientProps) {
  const { currentUser, isSelected } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isSelected) {
      router.push('/');
    }
  }, [isSelected, router]);

  if (!isSelected || !currentUser) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">プロジェクト一覧</h2>
        <div className="flex items-center gap-2">
          <Avatar name={currentUser.name} color={currentUser.avatarColor} size="sm" />
          <span className="text-sm text-gray-600">{currentUser.name}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`} className="block">
            <Card interactive className="h-full">
              <CardBody>
                <h3 className="font-semibold text-gray-900">{project.name}</h3>
                {project.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{project.description}</p>
                )}
              </CardBody>
              <CardFooter>
                <Badge variant="info">{project.taskCount} タスク</Badge>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
