'use server';

import { prisma } from '@/lib/db';
import { TaskStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import type { UpdateTaskStatusInput, AssignTaskInput, TaskResponse } from '@/types';

const VALID_STATUSES = new Set(Object.values(TaskStatus));

export async function updateTaskStatus(
  input: UpdateTaskStatusInput,
): Promise<{ task?: TaskResponse; error?: string }> {
  const { taskId, status, position } = input;

  if (!VALID_STATUSES.has(status)) {
    return { error: '無効なステータスです' };
  }

  if (position < 0 || !Number.isInteger(position)) {
    return { error: '無効な位置です' };
  }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true, status: true, position: true },
    });

    if (!existingTask) {
      return { error: '指定されたタスクが見つかりません' };
    }

    const isSameColumn = existingTask.status === status;

    // Recalculate positions in the target column
    if (isSameColumn) {
      // Moving within the same column
      const oldPos = existingTask.position;
      const newPos = position;

      if (oldPos !== newPos) {
        if (newPos < oldPos) {
          // Moving up: shift items between newPos and oldPos down
          await prisma.task.updateMany({
            where: {
              projectId: existingTask.projectId,
              status,
              position: { gte: newPos, lt: oldPos },
              id: { not: taskId },
            },
            data: { position: { increment: 1 } },
          });
        } else {
          // Moving down: shift items between oldPos and newPos up
          await prisma.task.updateMany({
            where: {
              projectId: existingTask.projectId,
              status,
              position: { gt: oldPos, lte: newPos },
              id: { not: taskId },
            },
            data: { position: { decrement: 1 } },
          });
        }
      }
    } else {
      // Moving to a different column
      // Remove from old column: decrement positions after the removed task
      await prisma.task.updateMany({
        where: {
          projectId: existingTask.projectId,
          status: existingTask.status,
          position: { gt: existingTask.position },
        },
        data: { position: { decrement: 1 } },
      });

      // Insert into new column: increment positions at and after the insertion point
      await prisma.task.updateMany({
        where: {
          projectId: existingTask.projectId,
          status,
          position: { gte: position },
        },
        data: { position: { increment: 1 } },
      });
    }

    // Update the task itself
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status, position },
      include: {
        assignee: {
          select: { id: true, name: true, avatarColor: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    revalidatePath(`/projects/${existingTask.projectId}`);

    return {
      task: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        position: updatedTask.position,
        assignee: updatedTask.assignee
          ? {
              id: updatedTask.assignee.id,
              name: updatedTask.assignee.name,
              avatarColor: updatedTask.assignee.avatarColor,
            }
          : null,
        commentCount: updatedTask._count.comments,
        createdAt: updatedTask.createdAt.toISOString(),
        updatedAt: updatedTask.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('updateTaskStatus error:', error);
    return { error: 'タスクステータスの更新に失敗しました' };
  }
}

export async function assignTask(
  input: AssignTaskInput,
): Promise<{ task?: TaskResponse; error?: string }> {
  const { taskId, assigneeId } = input;

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true },
    });

    if (!existingTask) {
      return { error: '指定されたタスクが見つかりません' };
    }

    if (assigneeId !== null) {
      const user = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { id: true },
      });
      if (!user) {
        return { error: '指定されたユーザーが見つかりません' };
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId },
      include: {
        assignee: {
          select: { id: true, name: true, avatarColor: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    revalidatePath(`/projects/${existingTask.projectId}`);

    return {
      task: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        position: updatedTask.position,
        assignee: updatedTask.assignee
          ? {
              id: updatedTask.assignee.id,
              name: updatedTask.assignee.name,
              avatarColor: updatedTask.assignee.avatarColor,
            }
          : null,
        commentCount: updatedTask._count.comments,
        createdAt: updatedTask.createdAt.toISOString(),
        updatedAt: updatedTask.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('assignTask error:', error);
    return { error: 'タスク担当者の更新に失敗しました' };
  }
}
