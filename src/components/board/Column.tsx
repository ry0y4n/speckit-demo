'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@/lib/constants';
import type { TaskResponse, UserResponse } from '@/types';
import type { TaskStatus } from '@prisma/client';

type ColumnProps = {
  status: TaskStatus;
  tasks: TaskResponse[];
  currentUserId: string | null;
  users?: UserResponse[];
  onAssigneeChange?: (taskId: string, assigneeId: string | null) => void;
  onTaskClick?: (task: TaskResponse) => void;
};

export function Column({
  status,
  tasks,
  currentUserId,
  users,
  onAssigneeChange,
  onTaskClick,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      className={`flex w-[85vw] flex-shrink-0 flex-col rounded-lg snap-center md:w-72 md:snap-align-none ${TASK_STATUS_COLORS[status]} ${
        isOver ? 'ring-2 ring-indigo-400' : ''
      }`}
      role="region"
      aria-label={`${TASK_STATUS_LABELS[status]} カラム — ${tasks.length}件`}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-semibold text-gray-700">{TASK_STATUS_LABELS[status]}</h3>
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-gray-600">
          {tasks.length}
        </span>
      </div>
      <div ref={setNodeRef} className="flex min-h-[100px] flex-1 flex-col gap-2 p-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isCurrentUser={task.assignee?.id === currentUserId}
              users={users}
              onAssigneeChange={onAssigneeChange}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
