'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Avatar } from '@/components/ui';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { TaskDetail } from '@/components/board/TaskDetail';
import type { TaskResponse, UserResponse } from '@/types';

type KanbanBoardPageClientProps = {
  projectName: string;
  initialTasks: TaskResponse[];
  users: UserResponse[];
};

export function KanbanBoardPageClient({
  projectName,
  initialTasks,
  users,
}: KanbanBoardPageClientProps) {
  const { currentUser, isSelected } = useCurrentUser();
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);

  useEffect(() => {
    if (!isSelected) {
      router.push('/');
    }
  }, [isSelected, router]);

  if (!isSelected || !currentUser) {
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="text-sm text-gray-500 hover:text-gray-700">
            ← プロジェクト一覧
          </Link>
          <span className="text-gray-300">/</span>
          <h2 className="text-lg font-semibold text-gray-900">{projectName}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Avatar name={currentUser.name} color={currentUser.avatarColor} size="sm" />
          <span className="text-sm text-gray-600">{currentUser.name}</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          initialTasks={initialTasks}
          users={users}
          onTaskClick={(task) => setSelectedTask(task)}
        />
      </div>

      {selectedTask && currentUser && (
        <TaskDetail
          task={selectedTask}
          currentUserId={currentUser.id}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
