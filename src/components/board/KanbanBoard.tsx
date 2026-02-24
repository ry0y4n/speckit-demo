'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { useOptimisticTasks } from '@/hooks/useOptimisticTasks';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { updateTaskStatus, assignTask } from '@/app/actions/tasks';
import { COLUMN_ORDER } from '@/lib/constants';
import type { TaskResponse, UserResponse } from '@/types';
import type { TaskStatus } from '@prisma/client';

type KanbanBoardProps = {
  initialTasks: TaskResponse[];
  users: UserResponse[];
  onTaskClick?: (task: TaskResponse) => void;
};

export function KanbanBoard({ initialTasks, users, onTaskClick }: KanbanBoardProps) {
  const { currentUser } = useCurrentUser();
  const { optimisticTasks, moveTask } = useOptimisticTasks(initialTasks);
  const [activeTask, setActiveTask] = useState<TaskResponse | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Group tasks by status column
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, TaskResponse[]> = {};
    for (const status of COLUMN_ORDER) {
      grouped[status] = optimisticTasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.position - b.position);
    }
    return grouped;
  }, [optimisticTasks]);

  const findTaskById = useCallback(
    (id: string) => optimisticTasks.find((t) => t.id === id) ?? null,
    [optimisticTasks],
  );

  const findColumnForTask = useCallback(
    (taskId: string): TaskStatus | null => {
      const task = findTaskById(taskId);
      return task ? task.status : null;
    },
    [findTaskById],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = findTaskById(event.active.id as string);
      setActiveTask(task);
    },
    [findTaskById],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Visual feedback handled by Column's isOver
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Determine the target column
      let targetStatus: TaskStatus;
      let targetPosition: number;

      // Check if dropped on a column (droppable) or task (sortable)
      if (COLUMN_ORDER.includes(overId as TaskStatus)) {
        // Dropped directly on a column
        targetStatus = overId as TaskStatus;
        targetPosition = tasksByStatus[targetStatus]?.length ?? 0;
      } else {
        // Dropped on another task
        const overTask = findTaskById(overId);
        if (!overTask) return;
        targetStatus = overTask.status;
        const columnTasks = tasksByStatus[targetStatus] ?? [];
        const overIndex = columnTasks.findIndex((t) => t.id === overId);
        targetPosition = overIndex >= 0 ? overIndex : columnTasks.length;
      }

      const currentStatus = findColumnForTask(activeId);
      if (!currentStatus) return;

      // Skip if no change
      const currentTask = findTaskById(activeId);
      if (
        currentTask &&
        currentTask.status === targetStatus &&
        currentTask.position === targetPosition
      ) {
        return;
      }

      // Apply optimistic update and call server action
      startTransition(async () => {
        moveTask(activeId, targetStatus, targetPosition);
        const result = await updateTaskStatus({
          taskId: activeId,
          status: targetStatus,
          position: targetPosition,
        });
        if (result.error) {
          console.error('Failed to update task status:', result.error);
        }
      });
    },
    [tasksByStatus, findTaskById, findColumnForTask, moveTask],
  );

  const handleAssigneeChange = useCallback((taskId: string, assigneeId: string | null) => {
    startTransition(async () => {
      const result = await assignTask({ taskId, assigneeId });
      if (result.error) {
        console.error('Failed to assign task:', result.error);
      }
    });
  }, []);

  return (
    <div className="flex h-full gap-4 overflow-x-auto p-4 pb-6 snap-x snap-mandatory md:snap-none">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {COLUMN_ORDER.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={tasksByStatus[status] ?? []}
            currentUserId={currentUser?.id ?? null}
            users={users}
            onAssigneeChange={handleAssigneeChange}
            onTaskClick={onTaskClick}
          />
        ))}
        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              isCurrentUser={activeTask.assignee?.id === currentUser?.id}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
