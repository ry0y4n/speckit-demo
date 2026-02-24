'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import type { CreateCommentInput, UpdateCommentInput, DeleteCommentInput } from '@/types';

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function createComment(input: CreateCommentInput): Promise<ActionResult> {
  try {
    const { taskId, authorId, body } = input;

    // Validation: 1-5000 chars, no whitespace-only
    const trimmedBody = body.trim();
    if (!trimmedBody || trimmedBody.length === 0) {
      return { success: false, error: 'コメント本文は必須です' };
    }
    if (trimmedBody.length > 5000) {
      return {
        success: false,
        error: 'コメント本文は5000文字以下にしてください',
      };
    }

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true },
    });
    if (!task) {
      return { success: false, error: '指定されたタスクが見つかりません' };
    }

    // Verify author exists
    const author = await prisma.user.findUnique({
      where: { id: authorId },
      select: { id: true },
    });
    if (!author) {
      return { success: false, error: '指定されたユーザーが見つかりません' };
    }

    await prisma.comment.create({
      data: {
        body: trimmedBody,
        taskId,
        authorId,
      },
    });

    revalidatePath(`/projects/${task.projectId}`);
    return { success: true };
  } catch (error) {
    console.error('createComment error:', error);
    return { success: false, error: 'コメントの作成に失敗しました' };
  }
}

export async function updateComment(input: UpdateCommentInput): Promise<ActionResult> {
  try {
    const { commentId, currentUserId, body } = input;

    // Validation: 1-5000 chars, no whitespace-only
    const trimmedBody = body.trim();
    if (!trimmedBody || trimmedBody.length === 0) {
      return { success: false, error: 'コメント本文は必須です' };
    }
    if (trimmedBody.length > 5000) {
      return {
        success: false,
        error: 'コメント本文は5000文字以下にしてください',
      };
    }

    // Verify comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: { select: { projectId: true } },
      },
    });
    if (!comment) {
      return { success: false, error: '指定されたコメントが見つかりません' };
    }

    // Access control: only the author can edit
    if (comment.authorId !== currentUserId) {
      return {
        success: false,
        error: '自分のコメントのみ編集できます',
      };
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { body: trimmedBody },
    });

    revalidatePath(`/projects/${comment.task.projectId}`);
    return { success: true };
  } catch (error) {
    console.error('updateComment error:', error);
    return { success: false, error: 'コメントの更新に失敗しました' };
  }
}

export async function deleteComment(input: DeleteCommentInput): Promise<ActionResult> {
  try {
    const { commentId, currentUserId } = input;

    // Verify comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: { select: { projectId: true } },
      },
    });
    if (!comment) {
      return { success: false, error: '指定されたコメントが見つかりません' };
    }

    // Access control: only the author can delete
    if (comment.authorId !== currentUserId) {
      return {
        success: false,
        error: '自分のコメントのみ削除できます',
      };
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    revalidatePath(`/projects/${comment.task.projectId}`);
    return { success: true };
  } catch (error) {
    console.error('deleteComment error:', error);
    return { success: false, error: 'コメントの削除に失敗しました' };
  }
}
