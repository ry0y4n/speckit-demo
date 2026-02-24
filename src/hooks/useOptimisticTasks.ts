'use client';

import { useOptimistic, useCallback } from 'react';
import type { TaskResponse } from '@/types';
import type { TaskStatus } from '@prisma/client';

type OptimisticAction = {
  type: 'move';
  taskId: string;
  newStatus: TaskStatus;
  newPosition: number;
};

function optimisticReducer(tasks: TaskResponse[], action: OptimisticAction): TaskResponse[] {
  if (action.type === 'move') {
    const { taskId, newStatus, newPosition } = action;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return tasks;

    // Remove from old position
    const filtered = tasks.filter((t) => t.id !== taskId);

    // Update the moved task
    const movedTask: TaskResponse = {
      ...task,
      status: newStatus,
      position: newPosition,
    };

    // Recalculate positions in the target column
    const targetColumnTasks = filtered
      .filter((t) => t.status === newStatus)
      .sort((a, b) => a.position - b.position);

    // Insert at the new position
    targetColumnTasks.splice(newPosition, 0, movedTask);

    // Reassign positions
    const updatedTargetTasks = targetColumnTasks.map((t, index) => ({
      ...t,
      position: index,
    }));

    // Rebuild the full list
    const otherTasks = filtered.filter((t) => t.status !== newStatus);
    return [...otherTasks, ...updatedTargetTasks];
  }
  return tasks;
}

export function useOptimisticTasks(initialTasks: TaskResponse[]) {
  const [optimisticTasks, addOptimisticAction] = useOptimistic(initialTasks, optimisticReducer);

  const moveTask = useCallback(
    (taskId: string, newStatus: TaskStatus, newPosition: number) => {
      addOptimisticAction({ type: 'move', taskId, newStatus, newPosition });
    },
    [addOptimisticAction],
  );

  return { optimisticTasks, moveTask };
}
