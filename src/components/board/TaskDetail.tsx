'use client';

import { useState, useEffect, useCallback } from 'react';
import { Avatar, Badge, Button } from '@/components/ui';
import { CommentForm } from '@/components/comments/CommentForm';
import { CommentList } from '@/components/comments/CommentList';
import { TASK_STATUS_LABELS } from '@/lib/constants';
import type { TaskResponse, CommentResponse } from '@/types';

type TaskDetailProps = {
  task: TaskResponse;
  currentUserId: string;
  onClose: () => void;
};

export function TaskDetail({ task, currentUserId, onClose }: TaskDetailProps) {
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/tasks/${task.id}/comments`);
      if (!res.ok) {
        throw new Error('コメントの取得に失敗しました');
      }
      const data = await res.json();
      setComments(data.comments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'コメントの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [task.id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCommentChanged = () => {
    fetchComments();
  };

  const statusLabel = TASK_STATUS_LABELS[task.status];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white shadow-xl sm:max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">タスク詳細</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Task Info */}
        <div className="border-b border-gray-200 px-6 py-4 space-y-3">
          <h3 className="text-base font-semibold text-gray-900">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.description}</p>
          )}
          <div className="flex items-center gap-3">
            <Badge variant="info">{statusLabel}</Badge>
            {task.assignee && (
              <div className="flex items-center gap-1.5">
                <Avatar name={task.assignee.name} color={task.assignee.avatarColor} size="sm" />
                <span className="text-sm text-gray-600">{task.assignee.name}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400">
            作成日:{' '}
            {new Date(task.createdAt).toLocaleString('ja-JP', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Comments Section */}
        <div className="px-6 py-4 space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">
            コメント ({isLoading ? '...' : comments.length})
          </h4>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {isLoading ? (
            <p className="py-4 text-center text-sm text-gray-400">読み込み中...</p>
          ) : (
            <CommentList
              comments={comments}
              currentUserId={currentUserId}
              onCommentChanged={handleCommentChanged}
            />
          )}

          <div className="border-t border-gray-200 pt-4">
            <CommentForm
              taskId={task.id}
              currentUserId={currentUserId}
              onCommentAdded={handleCommentChanged}
            />
          </div>
        </div>
      </div>
    </>
  );
}
