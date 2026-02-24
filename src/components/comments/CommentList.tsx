'use client';

import { useState, useTransition } from 'react';
import { updateComment, deleteComment } from '@/app/actions/comments';
import { Avatar, Button } from '@/components/ui';
import type { CommentResponse } from '@/types';

type CommentListProps = {
  comments: CommentResponse[];
  currentUserId: string;
  onCommentChanged: () => void;
};

export function CommentList({ comments, currentUserId, onCommentChanged }: CommentListProps) {
  if (comments.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-400">コメントはまだありません</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          isOwn={comment.author.id === currentUserId}
          currentUserId={currentUserId}
          onCommentChanged={onCommentChanged}
        />
      ))}
    </div>
  );
}

type CommentItemProps = {
  comment: CommentResponse;
  isOwn: boolean;
  currentUserId: string;
  onCommentChanged: () => void;
};

function CommentItem({ comment, isOwn, currentUserId, onCommentChanged }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    const trimmed = editBody.trim();
    if (!trimmed || trimmed.length > 5000) return;

    setError(null);
    startTransition(async () => {
      const result = await updateComment({
        commentId: comment.id,
        currentUserId,
        body: trimmed,
      });
      if (result.success) {
        setIsEditing(false);
        onCommentChanged();
      } else {
        setError(result.error ?? '更新に失敗しました');
      }
    });
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteComment({
        commentId: comment.id,
        currentUserId,
      });
      if (result.success) {
        onCommentChanged();
      } else {
        setError(result.error ?? '削除に失敗しました');
      }
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditBody(comment.body);
    setError(null);
  };

  const formattedDate = new Date(comment.createdAt).toLocaleString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isEdited = comment.createdAt !== comment.updatedAt;

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={comment.author.name} color={comment.author.avatarColor} size="sm" />
          <span className="text-sm font-medium text-gray-700">{comment.author.name}</span>
          <span className="text-xs text-gray-400">
            {formattedDate}
            {isEdited && ' (編集済み)'}
          </span>
        </div>
        {isOwn && !isEditing && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              disabled={isPending}
            >
              編集
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
              削除
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            maxLength={5000}
            disabled={isPending}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
              focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none
              disabled:bg-gray-50 disabled:text-gray-500 resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={handleCancelEdit} disabled={isPending}>
              キャンセル
            </Button>
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={!editBody.trim() || editBody.trim().length > 5000 || isPending}
            >
              {isPending ? '更新中...' : '更新'}
            </Button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-gray-600">{comment.body}</p>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
